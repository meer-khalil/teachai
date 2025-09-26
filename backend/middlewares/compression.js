const compression = require('compression');
const zlib = require('zlib');

// Compression configuration
const compressionConfig = {
    // Only compress responses above 1kb
    threshold: 1024,
    
    // Compression level (1-9, 6 is default)
    level: 6,
    
    // Memory level for zlib (1-9, 8 is default)
    memLevel: 8,
    
    // Window size for zlib
    windowBits: 15,
    
    // Enable compression for specific MIME types
    filter: (req, res) => {
        // Don't compress if client doesn't support it
        if (!req.headers['accept-encoding']) {
            return false;
        }

        // Don't compress if response is already compressed
        if (res.get('Content-Encoding')) {
            return false;
        }

        // Check content type
        const contentType = res.get('Content-Type') || '';
        
        // Compress text-based responses
        return (
            contentType.includes('text/') ||
            contentType.includes('application/json') ||
            contentType.includes('application/javascript') ||
            contentType.includes('application/xml') ||
            contentType.includes('application/xhtml+xml') ||
            contentType.includes('image/svg+xml') ||
            contentType.includes('application/rss+xml') ||
            contentType.includes('application/atom+xml')
        );
    }
};

// Different compression strategies for different content types
const createCompressionMiddleware = (options = {}) => {
    const config = { ...compressionConfig, ...options };
    
    return compression({
        ...config,
        // Custom compression strategy based on request
        strategy: (req, res) => {
            const userAgent = req.get('User-Agent') || '';
            const contentType = res.get('Content-Type') || '';
            
            // Use faster compression for mobile devices
            if (userAgent.includes('Mobile')) {
                return zlib.constants.Z_BEST_SPEED;
            }
            
            // Use better compression for JSON APIs
            if (contentType.includes('application/json')) {
                return zlib.constants.Z_BEST_COMPRESSION;
            }
            
            // Default strategy
            return zlib.constants.Z_DEFAULT_STRATEGY;
        }
    });
};

// High compression for static assets
const highCompressionMiddleware = compression({
    threshold: 512,
    level: 9,
    memLevel: 9,
    filter: (req, res) => {
        const contentType = res.get('Content-Type') || '';
        return (
            contentType.includes('text/css') ||
            contentType.includes('application/javascript') ||
            contentType.includes('text/html')
        );
    }
});

// Fast compression for API responses
const fastCompressionMiddleware = compression({
    threshold: 1024,
    level: 3,
    memLevel: 6,
    filter: (req, res) => {
        const contentType = res.get('Content-Type') || '';
        return contentType.includes('application/json');
    }
});

// Adaptive compression based on response size
const adaptiveCompressionMiddleware = (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override send method to check response size
    res.send = function(data) {
        const dataSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf8');
        
        // Use different compression based on size
        if (dataSize > 50000) { // 50KB
            // High compression for large responses
            return compression({
                level: 9,
                threshold: 0
            })(req, res, () => {
                originalSend.call(this, data);
            });
        } else if (dataSize > 5000) { // 5KB
            // Medium compression for medium responses
            return compression({
                level: 6,
                threshold: 0
            })(req, res, () => {
                originalSend.call(this, data);
            });
        } else {
            // No compression for small responses
            return originalSend.call(this, data);
        }
    };
    
    // Override json method
    res.json = function(data) {
        const dataSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
        
        if (dataSize > 10000) { // 10KB
            return compression({
                level: 6,
                threshold: 0
            })(req, res, () => {
                originalJson.call(this, data);
            });
        } else {
            return originalJson.call(this, data);
        }
    };
    
    next();
};

// Brotli compression for modern browsers
const brotliCompressionMiddleware = (req, res, next) => {
    const acceptEncoding = req.get('Accept-Encoding') || '';
    
    if (acceptEncoding.includes('br')) {
        // Use Brotli compression if supported
        return compression({
            threshold: 1024,
            level: 4, // Brotli level
            filter: (req, res) => {
                const contentType = res.get('Content-Type') || '';
                return (
                    contentType.includes('text/') ||
                    contentType.includes('application/json') ||
                    contentType.includes('application/javascript')
                );
            }
        })(req, res, next);
    }
    
    next();
};

// Response size monitoring middleware
const responseSizeMonitor = (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
        const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf8');
        res.set('X-Response-Size', size.toString());
        
        if (size > 100000) { // 100KB
            console.warn(`⚠️ Large response detected: ${req.method} ${req.originalUrl} - ${size} bytes`);
        }
        
        return originalSend.call(this, data);
    };
    
    res.json = function(data) {
        const size = Buffer.byteLength(JSON.stringify(data), 'utf8');
        res.set('X-Response-Size', size.toString());
        
        if (size > 100000) { // 100KB
            console.warn(`⚠️ Large JSON response: ${req.method} ${req.originalUrl} - ${size} bytes`);
        }
        
        return originalJson.call(this, data);
    };
    
    next();
};

// Compression statistics
let compressionStats = {
    totalRequests: 0,
    compressedRequests: 0,
    totalBytesOriginal: 0,
    totalBytesCompressed: 0
};

const compressionStatsMiddleware = (req, res, next) => {
    compressionStats.totalRequests++;
    
    const originalSend = res.send;
    const originalJson = res.json;
    
    res.send = function(data) {
        const originalSize = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data, 'utf8');
        compressionStats.totalBytesOriginal += originalSize;
        
        if (res.get('Content-Encoding')) {
            compressionStats.compressedRequests++;
        }
        
        return originalSend.call(this, data);
    };
    
    res.json = function(data) {
        const originalSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
        compressionStats.totalBytesOriginal += originalSize;
        
        if (res.get('Content-Encoding')) {
            compressionStats.compressedRequests++;
        }
        
        return originalJson.call(this, data);
    };
    
    next();
};

// Get compression statistics
const getCompressionStats = () => {
    const compressionRatio = compressionStats.totalBytesOriginal > 0 
        ? (1 - (compressionStats.totalBytesCompressed / compressionStats.totalBytesOriginal)) * 100
        : 0;
        
    return {
        ...compressionStats,
        compressionRatio: `${compressionRatio.toFixed(2)}%`,
        compressionRate: `${((compressionStats.compressedRequests / compressionStats.totalRequests) * 100).toFixed(2)}%`
    };
};

// Reset compression statistics
const resetCompressionStats = () => {
    compressionStats = {
        totalRequests: 0,
        compressedRequests: 0,
        totalBytesOriginal: 0,
        totalBytesCompressed: 0
    };
};

module.exports = {
    createCompressionMiddleware,
    highCompressionMiddleware,
    fastCompressionMiddleware,
    adaptiveCompressionMiddleware,
    brotliCompressionMiddleware,
    responseSizeMonitor,
    compressionStatsMiddleware,
    getCompressionStats,
    resetCompressionStats
};