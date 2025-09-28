const Redis = require('ioredis');
const NodeCache = require('node-cache');
const { promisify } = require('util');

// Redis Configuration
const redisConfig = {
  development: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0,
    keyPrefix: 'teachai:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 1, // Reduced from 3 to 1
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 5000, // 5 second timeout
    maxRetriesPerRequest: null, // Disable automatic retries
  },
  production: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
    keyPrefix: 'teachai:prod:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 1, // Reduced from 3 to 1
    lazyConnect: true,
    keepAlive: 30000,
    tls: process.env.REDIS_TLS ? {} : undefined,
    family: 4,
    connectTimeout: 5000, // 5 second timeout
    maxRetriesPerRequest: null, // Disable automatic retries
  }
};

// Cache Service Class
class CacheService {
  constructor() {
    this.redisClient = null;
    this.memoryCache = null;
    this.isRedisConnected = false;
    this.initializeCache();
  }

  // Initialize cache systems
  async initializeCache() {
    try {
      // Initialize Redis
      await this.initializeRedis();
      
      // Initialize Memory Cache
      this.initializeMemoryCache();
      
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('✅ Cache service initialized successfully');
    } catch (error) {
      console.error('❌ Cache service initialization failed:', error);
    }
  }

  // Initialize Redis connection
  async initializeRedis() {
    // Skip Redis initialization in development if not available
    if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_REDIS) {
      console.log('⚠️ Skipping Redis in development mode - using memory cache only');
      this.isRedisConnected = false;
      this.redisClient = null;
      return;
    }

    const config = redisConfig[process.env.NODE_ENV || 'development'];
    
    try {
      this.redisClient = new Redis(config);
      
      // Connection event handlers
      this.redisClient.on('connect', () => {
        console.log('🔗 Redis connected');
        this.isRedisConnected = true;
      });
      
      this.redisClient.on('error', (error) => {
        console.error('❌ Redis connection error:', error);
        this.isRedisConnected = false;
        // Disconnect on error to prevent reconnection attempts
        if (this.redisClient) {
          this.redisClient.disconnect();
          this.redisClient = null;
        }
      });
      
      this.redisClient.on('close', () => {
        console.log('⚠️ Redis connection closed');
        this.isRedisConnected = false;
      });
      
      this.redisClient.on('reconnecting', () => {
        console.log('🔄 Redis reconnecting...');
      });

      // Test connection with timeout
      await Promise.race([
        this.redisClient.ping(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        )
      ]);
      
      console.log('✅ Redis connection established successfully');
      this.isRedisConnected = true;
    } catch (error) {
      console.warn('⚠️ Redis not available, using memory cache only:', error.message);
      this.isRedisConnected = false;
      if (this.redisClient) {
        this.redisClient.disconnect();
        this.redisClient = null;
      }
    }
  }

  // Initialize Memory Cache
  initializeMemoryCache() {
    this.memoryCache = new NodeCache({
      stdTTL: 600, // 10 minutes default TTL
      checkperiod: 120, // Check for expired keys every 2 minutes
      useClones: false, // Performance optimization
      deleteOnExpire: true,
      maxKeys: 10000 // Maximum keys in memory
    });

    // Memory cache event listeners
    this.memoryCache.on('set', (key, value) => {
      console.log(`📝 Memory cache SET: ${key}`);
    });

    this.memoryCache.on('del', (key, value) => {
      console.log(`🗑️ Memory cache DEL: ${key}`);
    });

    this.memoryCache.on('expired', (key, value) => {
      console.log(`⏰ Memory cache EXPIRED: ${key}`);
    });
  }

  // Setup event listeners
  setupEventListeners() {
    process.on('SIGINT', () => {
      this.disconnect();
    });

    process.on('SIGTERM', () => {
      this.disconnect();
    });
  }

  // Get from cache with fallback strategy
  async get(key, options = {}) {
    const {
      useMemory = true,
      useRedis = true,
      fallback = null,
      ttl = 600
    } = options;

    try {
      // Try memory cache first (L1)
      if (useMemory) {
        const memoryResult = this.memoryCache.get(key);
        if (memoryResult !== undefined) {
          console.log(`🎯 Memory cache HIT: ${key}`);
          return memoryResult;
        }
      }

      // Try Redis cache (L2)
      if (useRedis && this.isRedisConnected) {
        const redisResult = await this.redisClient.get(key);
        if (redisResult !== null) {
          console.log(`🎯 Redis cache HIT: ${key}`);
          const parsedResult = JSON.parse(redisResult);
          
          // Populate memory cache
          if (useMemory) {
            this.memoryCache.set(key, parsedResult, ttl);
          }
          
          return parsedResult;
        }
      }

      // Cache miss - use fallback if provided
      if (fallback && typeof fallback === 'function') {
        console.log(`❌ Cache MISS: ${key} - executing fallback`);
        const fallbackResult = await fallback();
        
        // Store in cache for future requests
        await this.set(key, fallbackResult, { ttl, useMemory, useRedis });
        
        return fallbackResult;
      }

      console.log(`❌ Cache MISS: ${key} - no fallback`);
      return null;

    } catch (error) {
      console.error(`❌ Cache GET error for key ${key}:`, error);
      
      // Fallback to original function if available
      if (fallback && typeof fallback === 'function') {
        return await fallback();
      }
      
      return null;
    }
  }

  // Set value in cache
  async set(key, value, options = {}) {
    const {
      ttl = 600,
      useMemory = true,
      useRedis = true
    } = options;

    try {
      // Set in memory cache (L1)
      if (useMemory) {
        this.memoryCache.set(key, value, ttl);
        console.log(`✅ Memory cache SET: ${key} (TTL: ${ttl}s)`);
      }

      // Set in Redis cache (L2)
      if (useRedis && this.isRedisConnected) {
        const serializedValue = JSON.stringify(value);
        await this.redisClient.setex(key, ttl, serializedValue);
        console.log(`✅ Redis cache SET: ${key} (TTL: ${ttl}s)`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Cache SET error for key ${key}:`, error);
      return false;
    }
  }

  // Delete from cache
  async del(key, options = {}) {
    const { useMemory = true, useRedis = true } = options;

    try {
      // Delete from memory cache
      if (useMemory) {
        this.memoryCache.del(key);
        console.log(`🗑️ Memory cache DEL: ${key}`);
      }

      // Delete from Redis cache
      if (useRedis && this.isRedisConnected) {
        await this.redisClient.del(key);
        console.log(`🗑️ Redis cache DEL: ${key}`);
      }

      return true;
    } catch (error) {
      console.error(`❌ Cache DEL error for key ${key}:`, error);
      return false;
    }
  }

  // Delete by pattern
  async delPattern(pattern, options = {}) {
    const { useMemory = true, useRedis = true } = options;

    try {
      let deletedCount = 0;

      // Delete from memory cache
      if (useMemory) {
        const keys = this.memoryCache.keys();
        const matchingKeys = keys.filter(key => 
          new RegExp(pattern.replace(/\*/g, '.*')).test(key)
        );
        
        matchingKeys.forEach(key => {
          this.memoryCache.del(key);
          deletedCount++;
        });
        
        console.log(`🗑️ Memory cache pattern DEL: ${pattern} (${matchingKeys.length} keys)`);
      }

      // Delete from Redis cache
      if (useRedis && this.isRedisConnected) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          deletedCount += keys.length;
          console.log(`🗑️ Redis cache pattern DEL: ${pattern} (${keys.length} keys)`);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error(`❌ Cache pattern DEL error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Check if key exists
  async exists(key, options = {}) {
    const { useMemory = true, useRedis = true } = options;

    try {
      // Check memory cache first
      if (useMemory && this.memoryCache.has(key)) {
        return true;
      }

      // Check Redis cache
      if (useRedis && this.isRedisConnected) {
        const exists = await this.redisClient.exists(key);
        return exists === 1;
      }

      return false;
    } catch (error) {
      console.error(`❌ Cache EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  // Get TTL for a key
  async getTTL(key, options = {}) {
    const { useRedis = true } = options;

    try {
      if (useRedis && this.isRedisConnected) {
        const ttl = await this.redisClient.ttl(key);
        return ttl;
      }

      // Memory cache TTL is not easily accessible in node-cache
      return -1;
    } catch (error) {
      console.error(`❌ Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  // Increment numeric value
  async increment(key, amount = 1, options = {}) {
    const { ttl = 600, useRedis = true } = options;

    try {
      if (useRedis && this.isRedisConnected) {
        const result = await this.redisClient.incrby(key, amount);
        
        // Set expiration if this is a new key
        const keyTTL = await this.redisClient.ttl(key);
        if (keyTTL === -1) {
          await this.redisClient.expire(key, ttl);
        }
        
        return result;
      }

      // Fallback to get/set for memory cache
      const current = await this.get(key, { useMemory: true, useRedis: false }) || 0;
      const newValue = parseInt(current) + amount;
      await this.set(key, newValue, { ttl, useMemory: true, useRedis: false });
      return newValue;

    } catch (error) {
      console.error(`❌ Cache INCREMENT error for key ${key}:`, error);
      return null;
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      const stats = {
        memory: {
          keys: this.memoryCache.keys().length,
          hits: this.memoryCache.getStats().hits || 0,
          misses: this.memoryCache.getStats().misses || 0,
          hitRate: 0
        },
        redis: {
          connected: this.isRedisConnected,
          info: null
        },
        timestamp: new Date().toISOString()
      };

      // Calculate hit rate
      const totalRequests = stats.memory.hits + stats.memory.misses;
      if (totalRequests > 0) {
        stats.memory.hitRate = (stats.memory.hits / totalRequests * 100).toFixed(2);
      }

      // Get Redis info
      if (this.isRedisConnected) {
        const redisInfo = await this.redisClient.info('memory');
        stats.redis.info = this.parseRedisInfo(redisInfo);
      }

      return stats;
    } catch (error) {
      console.error('❌ Error getting cache stats:', error);
      return null;
    }
  }

  // Parse Redis info string
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    lines.forEach(line => {
      if (line.includes(':') && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        result[key] = value;
      }
    });
    
    return result;
  }

  // Flush all caches
  async flush(options = {}) {
    const { useMemory = true, useRedis = true } = options;

    try {
      // Flush memory cache
      if (useMemory) {
        this.memoryCache.flushAll();
        console.log('🧹 Memory cache flushed');
      }

      // Flush Redis cache
      if (useRedis && this.isRedisConnected) {
        await this.redisClient.flushdb();
        console.log('🧹 Redis cache flushed');
      }

      return true;
    } catch (error) {
      console.error('❌ Cache flush error:', error);
      return false;
    }
  }

  // Disconnect from cache
  async disconnect() {
    try {
      if (this.redisClient) {
        await this.redisClient.quit();
        console.log('👋 Redis disconnected');
      }

      if (this.memoryCache) {
        this.memoryCache.close();
        console.log('👋 Memory cache closed');
      }
    } catch (error) {
      console.error('❌ Cache disconnect error:', error);
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Export cache service and utilities
module.exports = {
  cacheService,
  CacheService,
  
  // Utility functions
  cacheKey: (...parts) => parts.join(':'),
  userCacheKey: (userId, ...parts) => `user:${userId}:${parts.join(':')}`,
  sessionCacheKey: (sessionId) => `session:${sessionId}`,
  apiCacheKey: (endpoint, ...params) => `api:${endpoint}:${params.join(':')}`,
  
  // Cache decorators
  cached: (key, options = {}) => {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function (...args) {
        const cacheKey = typeof key === 'function' ? key(...args) : key;
        
        const cachedResult = await cacheService.get(cacheKey, {
          ...options,
          fallback: () => originalMethod.apply(this, args)
        });
        
        return cachedResult;
      };
      
      return descriptor;
    };
  }
};