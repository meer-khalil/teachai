const Redis = require('ioredis');
const crypto = require('crypto');

// Redis client configuration
let redisClient;

const connectRedis = async () => {
    try {
        redisClient = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retryDelayOnFailover: 100,
            enableReadyCheck: true,
            maxRetriesPerRequest: null,
            lazyConnect: true,
            // Connection timeout
            connectTimeout: 10000,
            commandTimeout: 5000,
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        redisClient.on('error', (err) => {
            console.error('❌ Redis connection error:', err);
        });

        redisClient.on('ready', () => {
            console.log('🔥 Redis ready for operations');
        });

        // Test the connection
        await redisClient.ping();
        console.log('🏓 Redis ping successful');

    } catch (error) {
        console.error('❌ Redis connection failed:', error);
        // Fall back to memory cache if Redis fails
        console.log('⚠️ Falling back to memory cache');
        redisClient = null;
    }
};

// In-memory fallback cache
const memoryCache = new Map();
const MEMORY_CACHE_MAX_SIZE = 1000;
const MEMORY_CACHE_TTL = 300000; // 5 minutes in milliseconds

// Helper function to generate cache key
const generateCacheKey = (req) => {
    const { method, originalUrl, body, query, user } = req;
    const userId = user ? user.id : 'anonymous';
    
    const keyData = {
        method,
        url: originalUrl,
        query,
        body: method === 'POST' || method === 'PUT' ? body : undefined,
        userId
    };
    
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(keyData))
        .digest('hex');
};

// Memory cache operations
const setMemoryCache = (key, value, ttl = MEMORY_CACHE_TTL) => {
    if (memoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
        // Remove oldest entries
        const firstKey = memoryCache.keys().next().value;
        memoryCache.delete(firstKey);
    }
    
    const expiry = Date.now() + ttl;
    memoryCache.set(key, { value, expiry });
};

const getMemoryCache = (key) => {
    const cached = memoryCache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
        memoryCache.delete(key);
        return null;
    }
    
    return cached.value;
};

// Generic cache operations
const setCache = async (key, value, ttl = 300) => {
    try {
        if (redisClient && redisClient.status === 'ready') {
            await redisClient.setex(key, ttl, JSON.stringify(value));
        } else {
            setMemoryCache(key, value, ttl * 1000);
        }
    } catch (error) {
        console.error('Cache set error:', error);
        // Fallback to memory cache
        setMemoryCache(key, value, ttl * 1000);
    }
};

const getCache = async (key) => {
    try {
        if (redisClient && redisClient.status === 'ready') {
            const cached = await redisClient.get(key);
            return cached ? JSON.parse(cached) : null;
        } else {
            return getMemoryCache(key);
        }
    } catch (error) {
        console.error('Cache get error:', error);
        return getMemoryCache(key);
    }
};

const deleteCache = async (key) => {
    try {
        if (redisClient && redisClient.status === 'ready') {
            await redisClient.del(key);
        } else {
            memoryCache.delete(key);
        }
    } catch (error) {
        console.error('Cache delete error:', error);
        memoryCache.delete(key);
    }
};

const clearCachePattern = async (pattern) => {
    try {
        if (redisClient && redisClient.status === 'ready') {
            const keys = await redisClient.keys(pattern);
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }
        } else {
            // Clear memory cache entries matching pattern
            const regex = new RegExp(pattern.replace('*', '.*'));
            for (const key of memoryCache.keys()) {
                if (regex.test(key)) {
                    memoryCache.delete(key);
                }
            }
        }
    } catch (error) {
        console.error('Cache pattern clear error:', error);
    }
};

// Cache middleware factory
const cache = (options = {}) => {
    const {
        ttl = 300, // 5 minutes default
        keyGenerator = generateCacheKey,
        condition = () => true,
        skipCache = false
    } = options;

    return async (req, res, next) => {
        // Skip caching for certain conditions
        if (skipCache || !condition(req) || req.method !== 'GET') {
            return next();
        }

        const cacheKey = `api:${keyGenerator(req)}`;

        try {
            // Try to get from cache
            const cachedResponse = await getCache(cacheKey);
            
            if (cachedResponse) {
                console.log(`📦 Cache HIT for key: ${cacheKey.substring(0, 20)}...`);
                
                // Set cache headers
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Key': cacheKey.substring(0, 20) + '...'
                });
                
                return res.json(cachedResponse);
            }

            console.log(`🔍 Cache MISS for key: ${cacheKey.substring(0, 20)}...`);

            // Capture the original json method
            const originalJson = res.json.bind(res);

            // Override res.json to cache the response
            res.json = function(data) {
                // Cache the response
                setCache(cacheKey, data, ttl).catch(err => {
                    console.error('Failed to cache response:', err);
                });

                // Set cache headers
                res.set({
                    'X-Cache': 'MISS',
                    'X-Cache-Key': cacheKey.substring(0, 20) + '...'
                });

                // Call original json method
                return originalJson(data);
            };

            next();

        } catch (error) {
            console.error('Cache middleware error:', error);
            next();
        }
    };
};

// Specific cache middleware for different types of data
const userCache = cache({
    ttl: 600, // 10 minutes
    keyGenerator: (req) => `user:${req.user?.id || 'anonymous'}:${req.originalUrl}`,
    condition: (req) => req.user && req.method === 'GET'
});

const publicCache = cache({
    ttl: 1800, // 30 minutes
    keyGenerator: (req) => `public:${req.originalUrl}`,
    condition: (req) => req.method === 'GET'
});

const aiCache = cache({
    ttl: 3600, // 1 hour
    keyGenerator: (req) => {
        const prompt = req.body?.prompt || req.query?.prompt || '';
        return crypto.createHash('sha256').update(`ai:${prompt}`).digest('hex');
    },
    condition: (req) => req.body?.prompt || req.query?.prompt
});

// Cache invalidation helpers
const invalidateUserCache = async (userId) => {
    await clearCachePattern(`api:user:${userId}:*`);
};

const invalidatePublicCache = async () => {
    await clearCachePattern('api:public:*');
};

const invalidateAICache = async (prompt) => {
    const key = crypto.createHash('sha256').update(`ai:${prompt}`).digest('hex');
    await deleteCache(`api:${key}`);
};

// Cache statistics
const getCacheStats = async () => {
    try {
        if (redisClient && redisClient.status === 'ready') {
            const info = await redisClient.info('memory');
            const keyspace = await redisClient.info('keyspace');
            return {
                type: 'Redis',
                memory: info,
                keyspace: keyspace,
                connected: true
            };
        } else {
            return {
                type: 'Memory',
                size: memoryCache.size,
                maxSize: MEMORY_CACHE_MAX_SIZE,
                connected: false
            };
        }
    } catch (error) {
        return {
            type: 'Error',
            error: error.message,
            connected: false
        };
    }
};

// Graceful shutdown
const closeCacheConnection = async () => {
    if (redisClient) {
        await redisClient.quit();
        console.log('🔌 Redis connection closed');
    }
    memoryCache.clear();
    console.log('🧹 Memory cache cleared');
};

module.exports = {
    connectRedis,
    cache,
    userCache,
    publicCache,
    aiCache,
    setCache,
    getCache,
    deleteCache,
    clearCachePattern,
    invalidateUserCache,
    invalidatePublicCache,
    invalidateAICache,
    getCacheStats,
    closeCacheConnection
};