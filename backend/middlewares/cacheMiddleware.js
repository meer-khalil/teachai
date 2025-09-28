const { cacheService, cacheKey, userCacheKey, apiCacheKey } = require('../utils/cacheService');

// Cache middleware for Express routes
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 600, // 10 minutes default
    keyGenerator = null,
    skipCache = null,
    onlyStatus = [200],
    varyBy = [],
    useMemory = true,
    useRedis = true
  } = options;

  return async (req, res, next) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    // Check if caching should be skipped
    if (skipCache && await skipCache(req, res)) {
      return next();
    }

    try {
      // Generate cache key
      let key;
      if (keyGenerator) {
        key = await keyGenerator(req, res);
      } else {
        const varyParts = varyBy.map(field => {
          if (field.startsWith('header:')) {
            return req.get(field.substring(7)) || '';
          } else if (field.startsWith('query:')) {
            return req.query[field.substring(6)] || '';
          } else if (field === 'user') {
            return req.user ? req.user._id : 'anonymous';
          }
          return '';
        });
        
        key = apiCacheKey(req.originalUrl, ...varyParts);
      }

      // Try to get cached response
      const cachedResponse = await cacheService.get(key, {
        useMemory,
        useRedis,
        ttl
      });

      if (cachedResponse) {
        console.log(`🎯 Cache HIT for route: ${req.originalUrl}`);
        
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': key,
          'Content-Type': cachedResponse.contentType || 'application/json'
        });

        return res.status(cachedResponse.status || 200).send(cachedResponse.data);
      }

      console.log(`❌ Cache MISS for route: ${req.originalUrl}`);

      // Override res.json and res.send to cache the response
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);
      
      let responseData;
      let responseSent = false;

      const cacheResponse = (data, status) => {
        if (!responseSent && onlyStatus.includes(status)) {
          const responseToCache = {
            data,
            status,
            contentType: res.get('Content-Type'),
            timestamp: new Date().toISOString()
          };

          // Cache the response asynchronously
          cacheService.set(key, responseToCache, {
            ttl,
            useMemory,
            useRedis
          }).catch(error => {
            console.error('Cache set error:', error);
          });

          console.log(`✅ Response cached for route: ${req.originalUrl}`);
        }
        responseSent = true;
      };

      res.json = function(data) {
        responseData = data;
        cacheResponse(data, res.statusCode);
        
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': key
        });
        
        return originalJson(data);
      };

      res.send = function(data) {
        responseData = data;
        cacheResponse(data, res.statusCode);
        
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': key
        });
        
        return originalSend(data);
      };

      next();

    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Session caching middleware
const sessionCacheMiddleware = (options = {}) => {
  const { ttl = 3600 } = options; // 1 hour default

  return async (req, res, next) => {
    if (!req.sessionID) {
      return next();
    }

    try {
      const sessionKey = `session:${req.sessionID}`;
      
      // Try to get session from cache first
      const cachedSession = await cacheService.get(sessionKey, {
        useRedis: true,
        useMemory: false, // Sessions should be in Redis only
        ttl
      });

      if (cachedSession) {
        req.session = Object.assign(req.session || {}, cachedSession);
        console.log(`🎯 Session cache HIT: ${req.sessionID}`);
      }

      // Override session save to cache it
      if (req.session && req.session.save) {
        const originalSave = req.session.save.bind(req.session);
        req.session.save = function(callback) {
          // Save session to cache
          cacheService.set(sessionKey, req.session, {
            ttl,
            useRedis: true,
            useMemory: false
          }).catch(error => {
            console.error('Session cache error:', error);
          });

          if (originalSave) {
            return originalSave(callback);
          } else if (callback) {
            callback();
          }
        };
      }

      next();
    } catch (error) {
      console.error('Session cache middleware error:', error);
      next();
    }
  };
};

// User data caching middleware
const userCacheMiddleware = (options = {}) => {
  const { ttl = 900 } = options; // 15 minutes default

  return async (req, res, next) => {
    if (!req.user || !req.user._id) {
      return next();
    }

    try {
      const userKey = userCacheKey(req.user._id, 'profile');
      
      // Cache user data for quick access
      await cacheService.set(userKey, {
        _id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        lastActive: new Date()
      }, {
        ttl,
        useMemory: true,
        useRedis: true
      });

      next();
    } catch (error) {
      console.error('User cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation middleware
const cacheInvalidationMiddleware = (patterns = []) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    const originalEnd = res.end.bind(res);

    const invalidateCache = async () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        for (const pattern of patterns) {
          try {
            let keyPattern;
            
            if (typeof pattern === 'function') {
              keyPattern = await pattern(req, res);
            } else if (typeof pattern === 'string') {
              // Replace placeholders in pattern
              keyPattern = pattern
                .replace('{userId}', req.user ? req.user._id : '*')
                .replace('{path}', req.path)
                .replace('{method}', req.method);
            } else {
              keyPattern = pattern;
            }

            if (keyPattern) {
              const deletedCount = await cacheService.delPattern(keyPattern);
              console.log(`🗑️ Cache invalidated: ${keyPattern} (${deletedCount} keys)`);
            }
          } catch (error) {
            console.error('Cache invalidation error:', error);
          }
        }
      }
    };

    // Override response methods to trigger cache invalidation
    res.json = function(data) {
      invalidateCache();
      return originalJson(data);
    };

    res.send = function(data) {
      invalidateCache();
      return originalSend(data);
    };

    res.end = function(data) {
      invalidateCache();
      return originalEnd(data);
    };

    next();
  };
};

// Rate limiting with cache
const rateLimitCache = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // Max requests per window
    keyGenerator = null,
    skip = null
  } = options;

  return async (req, res, next) => {
    if (skip && skip(req, res)) {
      return next();
    }

    try {
      const key = keyGenerator 
        ? keyGenerator(req) 
        : `ratelimit:${req.ip}:${Math.floor(Date.now() / windowMs)}`;

      const current = await cacheService.increment(key, 1, {
        ttl: Math.ceil(windowMs / 1000),
        useRedis: true
      });

      const remaining = Math.max(0, max - current);
      const resetTime = Date.now() + windowMs;

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': remaining,
        'X-RateLimit-Reset': new Date(resetTime).toISOString()
      });

      if (current > max) {
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again after ${new Date(resetTime).toISOString()}`,
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit cache error:', error);
      next();
    }
  };
};

module.exports = {
  cacheMiddleware,
  sessionCacheMiddleware,
  userCacheMiddleware,
  cacheInvalidationMiddleware,
  rateLimitCache
};