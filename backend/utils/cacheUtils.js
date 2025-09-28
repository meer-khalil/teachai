const { cacheService, cacheKey, userCacheKey, apiCacheKey } = require('./cacheService');

// Cache configuration presets
const CACHE_PRESETS = {
  // Very short-lived cache for real-time data
  realtime: { ttl: 30, useMemory: true, useRedis: true },
  
  // Short-lived cache for frequently changing data
  short: { ttl: 300, useMemory: true, useRedis: true }, // 5 minutes
  
  // Medium-lived cache for semi-static data
  medium: { ttl: 1800, useMemory: true, useRedis: true }, // 30 minutes
  
  // Long-lived cache for static data
  long: { ttl: 7200, useMemory: false, useRedis: true }, // 2 hours
  
  // Very long-lived cache for rarely changing data
  persistent: { ttl: 86400, useMemory: false, useRedis: true }, // 24 hours
  
  // Session data cache
  session: { ttl: 3600, useMemory: false, useRedis: true }, // 1 hour
  
  // User profile cache
  profile: { ttl: 1800, useMemory: true, useRedis: true }, // 30 minutes
  
  // API response cache
  api: { ttl: 600, useMemory: true, useRedis: true } // 10 minutes
};

// Cache warming strategies
class CacheWarmer {
  constructor() {
    this.warmupTasks = new Map();
  }

  // Register a warmup task
  register(name, warmupFunction, options = {}) {
    this.warmupTasks.set(name, {
      fn: warmupFunction,
      interval: options.interval || 3600000, // 1 hour default
      enabled: options.enabled !== false,
      lastRun: null
    });
  }

  // Execute warmup task
  async executeTask(name) {
    const task = this.warmupTasks.get(name);
    if (!task || !task.enabled) {
      return false;
    }

    try {
      console.log(`🔥 Warming cache: ${name}`);
      await task.fn();
      task.lastRun = Date.now();
      console.log(`✅ Cache warmed: ${name}`);
      return true;
    } catch (error) {
      console.error(`❌ Cache warmup failed: ${name}`, error);
      return false;
    }
  }

  // Execute all warmup tasks
  async executeAll() {
    const results = [];
    
    for (const [name, task] of this.warmupTasks) {
      const result = await this.executeTask(name);
      results.push({ name, success: result });
    }
    
    return results;
  }

  // Start periodic warmup
  startPeriodicWarmup() {
    for (const [name, task] of this.warmupTasks) {
      if (task.enabled && task.interval) {
        setInterval(() => {
          this.executeTask(name);
        }, task.interval);
      }
    }
    
    console.log(`🔥 Cache warmer started for ${this.warmupTasks.size} tasks`);
  }
}

// Cache key generators
const CacheKeyGenerators = {
  user: {
    profile: (userId) => userCacheKey(userId, 'profile'),
    settings: (userId) => userCacheKey(userId, 'settings'),
    preferences: (userId) => userCacheKey(userId, 'preferences'),
    statistics: (userId) => userCacheKey(userId, 'stats'),
    sessions: (userId) => userCacheKey(userId, 'sessions')
  },
  
  api: {
    search: (query, filters = {}) => apiCacheKey('search', query, JSON.stringify(filters)),
    list: (resource, page = 1, limit = 10, filters = {}) => 
      apiCacheKey('list', resource, page, limit, JSON.stringify(filters)),
    details: (resource, id) => apiCacheKey('details', resource, id)
  },
  
  content: {
    post: (postId) => cacheKey('content', 'post', postId),
    story: (storyId) => cacheKey('content', 'story', storyId),
    comments: (resourceType, resourceId) => cacheKey('comments', resourceType, resourceId),
    likes: (resourceType, resourceId) => cacheKey('likes', resourceType, resourceId)
  },
  
  stats: {
    daily: (date) => cacheKey('stats', 'daily', date),
    weekly: (weekStart) => cacheKey('stats', 'weekly', weekStart),
    monthly: (month, year) => cacheKey('stats', 'monthly', month, year),
    user: (userId, period) => userCacheKey(userId, 'stats', period)
  }
};

// Cache invalidation patterns
const CacheInvalidationPatterns = {
  user: {
    profile: (userId) => `user:${userId}:*`,
    all: () => 'user:*'
  },
  
  content: {
    post: (postId) => `content:post:${postId}*`,
    story: (storyId) => `content:story:${storyId}*`,
    all: () => 'content:*'
  },
  
  api: {
    search: () => 'api:search:*',
    list: (resource) => `api:list:${resource}:*`,
    all: () => 'api:*'
  },
  
  stats: {
    all: () => 'stats:*',
    daily: () => 'stats:daily:*',
    user: (userId) => `user:${userId}:stats:*`
  }
};

// Smart caching utilities
class SmartCache {
  constructor() {
    this.hitRates = new Map();
    this.accessPatterns = new Map();
  }

  // Get with automatic optimization
  async get(key, options = {}) {
    const startTime = Date.now();
    
    try {
      const result = await cacheService.get(key, options);
      const responseTime = Date.now() - startTime;
      
      // Track performance
      this.updateMetrics(key, result !== null, responseTime);
      
      return result;
    } catch (error) {
      console.error(`Smart cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Set with intelligent TTL calculation
  async set(key, value, options = {}) {
    try {
      // Analyze access patterns to optimize TTL
      const accessPattern = this.accessPatterns.get(key);
      let optimizedOptions = { ...options };
      
      if (accessPattern && accessPattern.frequency > 10) {
        // High frequency access - shorter TTL, use memory cache
        optimizedOptions.ttl = Math.min(options.ttl || 600, 300);
        optimizedOptions.useMemory = true;
      } else if (accessPattern && accessPattern.frequency < 2) {
        // Low frequency access - longer TTL, Redis only
        optimizedOptions.ttl = Math.max(options.ttl || 600, 1800);
        optimizedOptions.useMemory = false;
      }
      
      return await cacheService.set(key, value, optimizedOptions);
    } catch (error) {
      console.error(`Smart cache set error for key ${key}:`, error);
      return false;
    }
  }

  // Update performance metrics
  updateMetrics(key, hit, responseTime) {
    // Update hit rates
    const hitRate = this.hitRates.get(key) || { hits: 0, misses: 0 };
    if (hit) {
      hitRate.hits++;
    } else {
      hitRate.misses++;
    }
    this.hitRates.set(key, hitRate);

    // Update access patterns
    const pattern = this.accessPatterns.get(key) || { 
      frequency: 0, 
      lastAccess: Date.now(), 
      avgResponseTime: responseTime 
    };
    
    pattern.frequency++;
    pattern.lastAccess = Date.now();
    pattern.avgResponseTime = (pattern.avgResponseTime + responseTime) / 2;
    
    this.accessPatterns.set(key, pattern);
  }

  // Get optimization recommendations
  getOptimizationRecommendations() {
    const recommendations = [];

    for (const [key, hitRate] of this.hitRates) {
      const totalRequests = hitRate.hits + hitRate.misses;
      const hitRatePercentage = (hitRate.hits / totalRequests) * 100;

      if (hitRatePercentage < 50 && totalRequests > 10) {
        recommendations.push({
          type: 'low_hit_rate',
          key,
          hitRate: hitRatePercentage.toFixed(2),
          suggestion: 'Consider increasing TTL or reviewing cache strategy'
        });
      }
    }

    for (const [key, pattern] of this.accessPatterns) {
      if (pattern.frequency > 100 && pattern.avgResponseTime > 50) {
        recommendations.push({
          type: 'high_frequency_slow',
          key,
          frequency: pattern.frequency,
          avgResponseTime: pattern.avgResponseTime.toFixed(2),
          suggestion: 'Consider moving to memory cache for better performance'
        });
      }
    }

    return recommendations;
  }
}

// Cache health monitor
class CacheHealthMonitor {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      hitRate: 70, // Minimum hit rate percentage
      responseTime: 100, // Maximum average response time in ms
      memoryUsage: 80, // Maximum memory usage percentage
      errorRate: 5 // Maximum error rate percentage
    };
  }

  async checkHealth() {
    const health = {
      status: 'healthy',
      checks: {},
      alerts: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Check cache service connectivity
      health.checks.connectivity = await this.checkConnectivity();
      
      // Check performance metrics
      health.checks.performance = await this.checkPerformance();
      
      // Check memory usage
      health.checks.memory = await this.checkMemoryUsage();
      
      // Determine overall health status
      const failedChecks = Object.values(health.checks).filter(check => !check.healthy);
      
      if (failedChecks.length > 0) {
        health.status = failedChecks.some(check => check.severity === 'critical') ? 'critical' : 'warning';
      }

      // Generate alerts
      health.alerts = this.generateAlerts(health.checks);
      
      return health;
    } catch (error) {
      console.error('Cache health check error:', error);
      return {
        status: 'critical',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkConnectivity() {
    try {
      const redisConnected = cacheService.isRedisConnected;
      const memoryWorking = cacheService.memoryCache !== null;

      return {
        healthy: redisConnected || memoryWorking,
        details: {
          redis: redisConnected,
          memory: memoryWorking
        },
        severity: !redisConnected && !memoryWorking ? 'critical' : 'info'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        severity: 'critical'
      };
    }
  }

  async checkPerformance() {
    try {
      const stats = await cacheService.getStats();
      
      if (!stats) {
        return {
          healthy: false,
          error: 'Unable to retrieve cache statistics',
          severity: 'warning'
        };
      }

      const hitRate = parseFloat(stats.memory.hitRate) || 0;
      const healthy = hitRate >= this.thresholds.hitRate;

      return {
        healthy,
        details: {
          hitRate: `${hitRate}%`,
          threshold: `${this.thresholds.hitRate}%`
        },
        severity: healthy ? 'info' : 'warning'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        severity: 'warning'
      };
    }
  }

  async checkMemoryUsage() {
    try {
      const stats = await cacheService.getStats();
      
      if (!stats || !stats.memory) {
        return {
          healthy: false,
          error: 'Unable to retrieve memory statistics',
          severity: 'warning'
        };
      }

      const keyCount = stats.memory.keys || 0;
      const maxKeys = 10000; // Configurable threshold
      const usage = (keyCount / maxKeys) * 100;
      const healthy = usage <= this.thresholds.memoryUsage;

      return {
        healthy,
        details: {
          keyCount,
          maxKeys,
          usage: `${usage.toFixed(2)}%`
        },
        severity: healthy ? 'info' : 'warning'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        severity: 'warning'
      };
    }
  }

  generateAlerts(checks) {
    const alerts = [];

    Object.entries(checks).forEach(([checkName, result]) => {
      if (!result.healthy) {
        alerts.push({
          type: checkName,
          severity: result.severity || 'warning',
          message: result.error || `${checkName} check failed`,
          details: result.details,
          timestamp: new Date().toISOString()
        });
      }
    });

    return alerts;
  }
}

// Create instances
const cacheWarmer = new CacheWarmer();
const smartCache = new SmartCache();
const healthMonitor = new CacheHealthMonitor();

module.exports = {
  CACHE_PRESETS,
  CacheWarmer,
  CacheKeyGenerators,
  CacheInvalidationPatterns,
  SmartCache,
  CacheHealthMonitor,
  
  // Instances
  cacheWarmer,
  smartCache,
  healthMonitor,
  
  // Utility functions
  getCachePreset: (preset) => CACHE_PRESETS[preset] || CACHE_PRESETS.medium,
  
  // Batch operations
  mget: async (keys, options = {}) => {
    const results = {};
    
    for (const key of keys) {
      try {
        results[key] = await cacheService.get(key, options);
      } catch (error) {
        console.error(`Batch get error for key ${key}:`, error);
        results[key] = null;
      }
    }
    
    return results;
  },
  
  mset: async (keyValuePairs, options = {}) => {
    const results = {};
    
    for (const [key, value] of Object.entries(keyValuePairs)) {
      try {
        results[key] = await cacheService.set(key, value, options);
      } catch (error) {
        console.error(`Batch set error for key ${key}:`, error);
        results[key] = false;
      }
    }
    
    return results;
  }
};