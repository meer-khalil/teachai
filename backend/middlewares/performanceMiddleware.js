const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { cacheService } = require('../services/cacheService');

// Compression middleware with smart filtering
const compressionMiddleware = compression({
  // Only compress responses that are larger than this
  threshold: 1024,
  
  // Compression level (0-9, where 9 is best compression but slowest)
  level: 6,
  
  // Only compress these types
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Don't compress already compressed files
    const contentType = res.get('Content-Type');
    if (contentType) {
      const type = contentType.toLowerCase();
      if (type.includes('image/') || 
          type.includes('video/') || 
          type.includes('audio/') ||
          type.includes('application/zip') ||
          type.includes('application/gzip')) {
        return false;
      }
    }

    // Use compression filter
    return compression.filter(req, res);
  },

  // Memory level (1-9, where 9 uses most memory but is fastest)
  memLevel: 8
});

// Security middleware with comprehensive headers
const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-eval'", 'https://cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", 'ws:', 'wss:'],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:'],
      upgradeInsecureRequests: []
    },
  },
  
  // Cross Origin Embedder Policy
  crossOriginEmbedderPolicy: false,
  
  // HSTS
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // XSS Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'same-origin' }
});

// Enhanced rate limiting with Redis
const createRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests from this IP, please try again later',
    standardHeaders = true,
    legacyHeaders = false,
    keyPrefix = 'rl:',
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Rate limit exceeded',
      message,
      retryAfter: windowMs
    },
    standardHeaders,
    legacyHeaders,
    keyGenerator: (req) => `${keyPrefix}${req.ip}`,
    
    // Custom store using Redis
    store: {
      incr: async (key) => {
        try {
          const count = await cacheService.increment(key, 1, {
            ttl: Math.ceil(windowMs / 1000),
            useRedis: true
          });
          return { totalHits: count, resetTime: new Date(Date.now() + windowMs) };
        } catch (error) {
          console.error('Rate limit store error:', error);
          return { totalHits: 1, resetTime: new Date(Date.now() + windowMs) };
        }
      },
      
      decrement: async (key) => {
        try {
          const count = await cacheService.decrement(key, 1);
          return { totalHits: Math.max(0, count) };
        } catch (error) {
          console.error('Rate limit decrement error:', error);
          return { totalHits: 0 };
        }
      },
      
      resetKey: async (key) => {
        try {
          await cacheService.del(key);
        } catch (error) {
          console.error('Rate limit reset error:', error);
        }
      }
    },
    
    skip: (req, res) => {
      // Skip rate limiting for successful requests if configured
      if (skipSuccessfulRequests && res.statusCode < 400) {
        return true;
      }
      
      // Skip rate limiting for failed requests if configured
      if (skipFailedRequests && res.statusCode >= 400) {
        return true;
      }
      
      // Skip for health checks
      if (req.path === '/health' || req.path === '/api/health') {
        return true;
      }
      
      return false;
    }
  });
};

// Request logging middleware
const requestLoggingMiddleware = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  // Log request start
  console.log(`📥 ${method} ${url} - IP: ${ip} - Started: ${new Date().toISOString()}`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('Content-Length') || '-';
    
    // Color code based on status
    let statusColor = '';
    if (statusCode >= 500) statusColor = '🔴';
    else if (statusCode >= 400) statusColor = '🟡';
    else if (statusCode >= 300) statusColor = '🔵';
    else statusColor = '🟢';
    
    console.log(`📤 ${method} ${url} - ${statusColor} ${statusCode} - ${duration}ms - ${contentLength} bytes`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`⚠️  SLOW REQUEST: ${method} ${url} took ${duration}ms`);
    }
    
    originalEnd.apply(res, args);
  };
  
  next();
};

// Response time middleware
const responseTimeMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const duration = process.hrtime.bigint() - start;
    const ms = Number(duration) / 1000000; // Convert to milliseconds
    
    res.set('X-Response-Time', `${ms.toFixed(3)}ms`);
    
    // Store response time metrics
    const key = `response_time:${req.method}:${req.route?.path || req.path}`;
    cacheService.set(key, {
      method: req.method,
      path: req.route?.path || req.path,
      responseTime: ms,
      statusCode: res.statusCode,
      timestamp: new Date()
    }, { ttl: 3600, useRedis: true }).catch(console.error);
  });
  
  next();
};

// Error handling middleware for performance monitoring
const performanceErrorMiddleware = (err, req, res, next) => {
  const start = Date.now();
  
  // Log performance-related errors
  if (err.code === 'ECONNRESET' || 
      err.code === 'ETIMEDOUT' || 
      err.message.includes('timeout')) {
    
    console.error(`🚨 Performance Error: ${err.message}`, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
    
    // Store error metrics
    const errorKey = `performance_error:${Date.now()}`;
    cacheService.set(errorKey, {
      error: err.message,
      code: err.code,
      method: req.method,
      url: req.url,
      ip: req.ip,
      timestamp: new Date()
    }, { ttl: 86400, useRedis: true }).catch(console.error); // Store for 24 hours
  }
  
  next(err);
};

// Health check middleware
const healthCheckMiddleware = async (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version
  };
  
  try {
    // Check Redis connection
    const redisHealth = await cacheService.health();
    healthData.redis = redisHealth;
    
    // Check cache statistics
    const cacheStats = await cacheService.stats();
    healthData.cache = cacheStats;
    
    res.json(healthData);
  } catch (error) {
    healthData.status = 'unhealthy';
    healthData.error = error.message;
    res.status(503).json(healthData);
  }
};

// Performance monitoring dashboard middleware
const performanceStatsMiddleware = async (req, res) => {
  try {
    const stats = await cacheService.stats();
    const responseTimePattern = 'response_time:*';
    const errorPattern = 'performance_error:*';
    
    // Get response time metrics (last 100)
    const responseTimeKeys = await cacheService.getKeys(responseTimePattern);
    const responseTimes = [];
    
    for (const key of responseTimeKeys.slice(-100)) {
      const data = await cacheService.get(key);
      if (data) responseTimes.push(data);
    }
    
    // Get error metrics (last 50)
    const errorKeys = await cacheService.getKeys(errorPattern);
    const errors = [];
    
    for (const key of errorKeys.slice(-50)) {
      const data = await cacheService.get(key);
      if (data) errors.push(data);
    }
    
    // Calculate performance metrics
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, rt) => sum + rt.responseTime, 0) / responseTimes.length 
      : 0;
    
    const slowRequests = responseTimes.filter(rt => rt.responseTime > 1000).length;
    const errorRate = errors.length / (responseTimes.length || 1) * 100;
    
    res.json({
      cache: stats,
      performance: {
        avgResponseTime: avgResponseTime.toFixed(2),
        slowRequests,
        errorRate: errorRate.toFixed(2),
        totalRequests: responseTimes.length,
        totalErrors: errors.length
      },
      recentResponseTimes: responseTimes.slice(-20),
      recentErrors: errors.slice(-10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  compressionMiddleware,
  securityMiddleware,
  createRateLimit,
  requestLoggingMiddleware,
  responseTimeMiddleware,
  performanceErrorMiddleware,
  healthCheckMiddleware,
  performanceStatsMiddleware
};