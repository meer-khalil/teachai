const Redis = require('ioredis');
const config = require('../config/keys');

// Redis configuration based on environment
const redisConfig = {
  development: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  },
  production: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    connectTimeout: 60000,
    lazyConnect: true,
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    retryTimes: 3,
  }
};

const currentConfig = redisConfig[process.env.NODE_ENV] || redisConfig.development;

// Create Redis instance
const redis = new Redis(currentConfig);

// Redis event handlers
redis.on('connect', () => {
  console.log('🔗 Redis connected successfully');
});

redis.on('ready', () => {
  console.log('🚀 Redis ready for operations');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redis.on('close', () => {
  console.log('🔒 Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Cache service class
class CacheService {
  constructor() {
    this.redis = redis;
    this.defaultTTL = 3600; // 1 hour in seconds
    this.isConnected = false;
    
    this.redis.on('ready', () => {
      this.isConnected = true;
    });
    
    this.redis.on('error', () => {
      this.isConnected = false;
    });
  }

  // Check if Redis is available
  isAvailable() {
    return this.isConnected && this.redis.status === 'ready';
  }

  // Generate cache key with prefix
  generateKey(prefix, ...args) {
    return `${prefix}:${args.join(':')}`;
  }

  // Set cache with TTL
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isAvailable()) return false;
      
      const serializedValue = JSON.stringify(value);
      const result = await this.redis.setex(key, ttl, serializedValue);
      return result === 'OK';
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Get cache value
  async get(key) {
    try {
      if (!this.isAvailable()) return null;
      
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache key
  async del(key) {
    try {
      if (!this.isAvailable()) return false;
      
      const result = await this.redis.del(key);
      return result > 0;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      if (!this.isAvailable()) return false;
      
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Set cache with expiration time
  async setWithExpiration(key, value, expireAt) {
    try {
      if (!this.isAvailable()) return false;
      
      const serializedValue = JSON.stringify(value);
      const result = await this.redis.set(key, serializedValue, 'EXAT', Math.floor(expireAt.getTime() / 1000));
      return result === 'OK';
    } catch (error) {
      console.error('Cache setWithExpiration error:', error);
      return false;
    }
  }

  // Get multiple keys
  async mget(keys) {
    try {
      if (!this.isAvailable() || !keys.length) return {};
      
      const values = await this.redis.mget(...keys);
      const result = {};
      
      keys.forEach((key, index) => {
        const value = values[index];
        result[key] = value ? JSON.parse(value) : null;
      });
      
      return result;
    } catch (error) {
      console.error('Cache mget error:', error);
      return {};
    }
  }

  // Set multiple key-value pairs
  async mset(keyValuePairs, ttl = this.defaultTTL) {
    try {
      if (!this.isAvailable()) return false;
      
      const pipeline = this.redis.pipeline();
      
      Object.entries(keyValuePairs).forEach(([key, value]) => {
        const serializedValue = JSON.stringify(value);
        pipeline.setex(key, ttl, serializedValue);
      });
      
      const results = await pipeline.exec();
      return results.every(result => result[1] === 'OK');
    } catch (error) {
      console.error('Cache mset error:', error);
      return false;
    }
  }

  // Increment counter
  async incr(key, ttl = this.defaultTTL) {
    try {
      if (!this.isAvailable()) return 0;
      
      const pipeline = this.redis.pipeline();
      pipeline.incr(key);
      pipeline.expire(key, ttl);
      
      const results = await pipeline.exec();
      return results[0][1];
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }

  // Get keys by pattern
  async keys(pattern) {
    try {
      if (!this.isAvailable()) return [];
      
      return await this.redis.keys(pattern);
    } catch (error) {
      console.error('Cache keys error:', error);
      return [];
    }
  }

  // Delete keys by pattern
  async delPattern(pattern) {
    try {
      if (!this.isAvailable()) return 0;
      
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;
      
      return await this.redis.del(...keys);
    } catch (error) {
      console.error('Cache delPattern error:', error);
      return 0;
    }
  }

  // Hash operations
  async hset(key, field, value, ttl = this.defaultTTL) {
    try {
      if (!this.isAvailable()) return false;
      
      const pipeline = this.redis.pipeline();
      pipeline.hset(key, field, JSON.stringify(value));
      pipeline.expire(key, ttl);
      
      const results = await pipeline.exec();
      return results[0][1] === 1;
    } catch (error) {
      console.error('Cache hset error:', error);
      return false;
    }
  }

  async hget(key, field) {
    try {
      if (!this.isAvailable()) return null;
      
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache hget error:', error);
      return null;
    }
  }

  async hgetall(key) {
    try {
      if (!this.isAvailable()) return {};
      
      const hash = await this.redis.hgetall(key);
      const result = {};
      
      Object.entries(hash).forEach(([field, value]) => {
        result[field] = JSON.parse(value);
      });
      
      return result;
    } catch (error) {
      console.error('Cache hgetall error:', error);
      return {};
    }
  }

  // List operations
  async lpush(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isAvailable()) return 0;
      
      const pipeline = this.redis.pipeline();
      pipeline.lpush(key, JSON.stringify(value));
      pipeline.expire(key, ttl);
      
      const results = await pipeline.exec();
      return results[0][1];
    } catch (error) {
      console.error('Cache lpush error:', error);
      return 0;
    }
  }

  async lrange(key, start = 0, end = -1) {
    try {
      if (!this.isAvailable()) return [];
      
      const values = await this.redis.lrange(key, start, end);
      return values.map(value => JSON.parse(value));
    } catch (error) {
      console.error('Cache lrange error:', error);
      return [];
    }
  }

  // Cache invalidation
  async invalidateUserCache(userId) {
    const patterns = [
      `user:${userId}:*`,
      `session:${userId}:*`,
      `preferences:${userId}:*`
    ];
    
    let deletedCount = 0;
    for (const pattern of patterns) {
      deletedCount += await this.delPattern(pattern);
    }
    
    return deletedCount;
  }

  async invalidateContentCache(contentId, contentType) {
    const patterns = [
      `content:${contentType}:${contentId}:*`,
      `analytics:content:${contentId}:*`,
      `localization:${contentId}:*`
    ];
    
    let deletedCount = 0;
    for (const pattern of patterns) {
      deletedCount += await this.delPattern(pattern);
    }
    
    return deletedCount;
  }

  // Health check
  async healthCheck() {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
        connected: this.isConnected,
        memory: await this.redis.memory('usage')
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      };
    }
  }

  // Get cache statistics
  async getStats() {
    try {
      if (!this.isAvailable()) return null;
      
      const info = await this.redis.info('stats');
      const memory = await this.redis.info('memory');
      
      return {
        stats: this.parseRedisInfo(info),
        memory: this.parseRedisInfo(memory)
      };
    } catch (error) {
      console.error('Cache getStats error:', error);
      return null;
    }
  }

  // Parse Redis INFO command output
  parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = isNaN(value) ? value : Number(value);
        }
      }
    });
    
    return result;
  }

  // Graceful shutdown
  async disconnect() {
    try {
      await this.redis.quit();
      console.log('🔒 Redis connection closed gracefully');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

// Create singleton instance
const cacheService = new CacheService();

// Export both the service and raw redis client
module.exports = {
  cacheService,
  redis,
  CacheService
};