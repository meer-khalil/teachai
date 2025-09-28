const express = require('express');
const { cacheService } = require('../utils/cacheService');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const router = express.Router();

// Get cache statistics
router.get('/stats', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    
    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve cache statistics'
      });
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving cache stats'
    });
  }
});

// Get cache key information
router.get('/key/:key', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { useMemory = true, useRedis = true } = req.query;

    const exists = await cacheService.exists(key, {
      useMemory: useMemory === 'true',
      useRedis: useRedis === 'true'
    });

    if (!exists) {
      return res.status(404).json({
        success: false,
        message: 'Cache key not found'
      });
    }

    const value = await cacheService.get(key, {
      useMemory: useMemory === 'true',
      useRedis: useRedis === 'true'
    });

    const ttl = await cacheService.getTTL(key, {
      useRedis: useRedis === 'true'
    });

    res.status(200).json({
      success: true,
      data: {
        key,
        value,
        ttl,
        exists: true
      }
    });
  } catch (error) {
    console.error('Cache key retrieval error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving cache key'
    });
  }
});

// Set cache key
router.post('/key/:key', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value, ttl = 600, useMemory = true, useRedis = true } = req.body;

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    const success = await cacheService.set(key, value, {
      ttl: parseInt(ttl),
      useMemory: useMemory === true,
      useRedis: useRedis === true
    });

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to set cache key'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cache key set successfully',
      data: { key, ttl }
    });
  } catch (error) {
    console.error('Cache key set error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while setting cache key'
    });
  }
});

// Delete cache key
router.delete('/key/:key', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { useMemory = true, useRedis = true } = req.query;

    const success = await cacheService.del(key, {
      useMemory: useMemory === 'true',
      useRedis: useRedis === 'true'
    });

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete cache key'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cache key deleted successfully'
    });
  } catch (error) {
    console.error('Cache key deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting cache key'
    });
  }
});

// Delete cache keys by pattern
router.delete('/pattern/:pattern', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { pattern } = req.params;
    const { useMemory = true, useRedis = true } = req.query;

    // Decode URL-encoded pattern
    const decodedPattern = decodeURIComponent(pattern);

    const deletedCount = await cacheService.delPattern(decodedPattern, {
      useMemory: useMemory === 'true',
      useRedis: useRedis === 'true'
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${deletedCount} cache keys matching pattern`,
      data: { pattern: decodedPattern, deletedCount }
    });
  } catch (error) {
    console.error('Cache pattern deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting cache pattern'
    });
  }
});

// Flush all cache
router.delete('/flush', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { useMemory = true, useRedis = true, confirm } = req.body;

    if (confirm !== 'FLUSH_ALL_CACHE') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Send { "confirm": "FLUSH_ALL_CACHE" } to proceed.'
      });
    }

    const success = await cacheService.flush({
      useMemory: useMemory === true,
      useRedis: useRedis === true
    });

    if (!success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to flush cache'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cache flushed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Cache flush error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while flushing cache'
    });
  }
});

// Warm cache with predefined data
router.post('/warm', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { keys = [], force = false } = req.body;

    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keys array is required and must not be empty'
      });
    }

    const results = [];

    for (const keyConfig of keys) {
      const { key, value, ttl = 600 } = keyConfig;

      if (!key || value === undefined) {
        results.push({ key, success: false, message: 'Key and value are required' });
        continue;
      }

      try {
        // Check if key exists unless force is true
        if (!force) {
          const exists = await cacheService.exists(key);
          if (exists) {
            results.push({ key, success: false, message: 'Key already exists (use force=true to override)' });
            continue;
          }
        }

        const success = await cacheService.set(key, value, { ttl });
        results.push({ 
          key, 
          success, 
          message: success ? 'Cache warmed successfully' : 'Failed to warm cache'
        });
      } catch (error) {
        results.push({ key, success: false, message: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    res.status(200).json({
      success: true,
      message: `Cache warming completed. ${successCount}/${keys.length} keys processed successfully.`,
      data: results
    });
  } catch (error) {
    console.error('Cache warming error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while warming cache'
    });
  }
});

// Get cache health check
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        memory: {
          status: 'ok',
          keys: cacheService.memoryCache ? cacheService.memoryCache.keys().length : 0
        },
        redis: {
          status: cacheService.isRedisConnected ? 'ok' : 'error',
          connected: cacheService.isRedisConnected
        }
      }
    };

    // Test Redis connection
    if (cacheService.isRedisConnected) {
      try {
        await cacheService.redisClient.ping();
        health.services.redis.ping = 'ok';
      } catch (error) {
        health.services.redis.status = 'error';
        health.services.redis.error = error.message;
        health.status = 'degraded';
      }
    }

    const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Cache health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during health check',
      error: error.message
    });
  }
});

// Cache performance metrics
router.get('/metrics', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const stats = await cacheService.getStats();
    
    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve cache metrics'
      });
    }

    // Enhanced metrics calculation
    const metrics = {
      ...stats,
      performance: {
        memoryEfficiency: stats.memory.hitRate,
        totalRequests: stats.memory.hits + stats.memory.misses,
        cacheUtilization: stats.redis.connected ? 'Connected' : 'Disconnected',
        recommendations: []
      }
    };

    // Generate performance recommendations
    if (parseFloat(stats.memory.hitRate) < 80) {
      metrics.performance.recommendations.push({
        type: 'performance',
        message: 'Cache hit rate is below 80%. Consider increasing TTL or improving cache key strategy.'
      });
    }

    if (stats.memory.keys > 8000) {
      metrics.performance.recommendations.push({
        type: 'memory',
        message: 'High number of cached keys. Consider implementing cache eviction policies.'
      });
    }

    if (!stats.redis.connected) {
      metrics.performance.recommendations.push({
        type: 'availability',
        message: 'Redis is not connected. System is running on memory cache only.'
      });
    }

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Cache metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving cache metrics'
    });
  }
});

module.exports = router;