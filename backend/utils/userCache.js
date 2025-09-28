const { cacheService, userCacheKey } = require('../utils/cacheService');
const { CACHE_PRESETS, CacheKeyGenerators } = require('../utils/cacheUtils');

// User-specific caching utilities
class UserCache {
  constructor(userId) {
    this.userId = userId;
  }

  // Cache user profile
  async cacheProfile(userData, options = {}) {
    const key = CacheKeyGenerators.user.profile(this.userId);
    const cacheOptions = { ...CACHE_PRESETS.profile, ...options };
    
    const profileData = {
      _id: userData._id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      avatar: userData.avatar,
      preferences: userData.preferences,
      createdAt: userData.createdAt,
      lastActive: new Date(),
      cached: true
    };

    return await cacheService.set(key, profileData, cacheOptions);
  }

  // Get cached profile
  async getProfile(fallback = null) {
    const key = CacheKeyGenerators.user.profile(this.userId);
    
    return await cacheService.get(key, {
      ...CACHE_PRESETS.profile,
      fallback: fallback ? async () => {
        const userData = await fallback();
        if (userData) {
          await this.cacheProfile(userData);
        }
        return userData;
      } : null
    });
  }

  // Cache user settings
  async cacheSettings(settings, options = {}) {
    const key = CacheKeyGenerators.user.settings(this.userId);
    const cacheOptions = { ...CACHE_PRESETS.medium, ...options };
    
    return await cacheService.set(key, settings, cacheOptions);
  }

  // Get cached settings
  async getSettings(fallback = null) {
    const key = CacheKeyGenerators.user.settings(this.userId);
    
    return await cacheService.get(key, {
      ...CACHE_PRESETS.medium,
      fallback
    });
  }

  // Cache user preferences
  async cachePreferences(preferences, options = {}) {
    const key = CacheKeyGenerators.user.preferences(this.userId);
    const cacheOptions = { ...CACHE_PRESETS.long, ...options };
    
    return await cacheService.set(key, preferences, cacheOptions);
  }

  // Get cached preferences
  async getPreferences(fallback = null) {
    const key = CacheKeyGenerators.user.preferences(this.userId);
    
    return await cacheService.get(key, {
      ...CACHE_PRESETS.long,
      fallback
    });
  }

  // Cache user statistics
  async cacheStatistics(stats, period = 'daily', options = {}) {
    const key = CacheKeyGenerators.stats.user(this.userId, period);
    const cacheOptions = { ...CACHE_PRESETS.medium, ...options };
    
    const statsData = {
      ...stats,
      userId: this.userId,
      period,
      lastUpdated: new Date(),
      cached: true
    };

    return await cacheService.set(key, statsData, cacheOptions);
  }

  // Get cached statistics
  async getStatistics(period = 'daily', fallback = null) {
    const key = CacheKeyGenerators.stats.user(this.userId, period);
    
    return await cacheService.get(key, {
      ...CACHE_PRESETS.medium,
      fallback
    });
  }

  // Cache user sessions
  async cacheSessions(sessions, options = {}) {
    const key = CacheKeyGenerators.user.sessions(this.userId);
    const cacheOptions = { ...CACHE_PRESETS.session, ...options };
    
    return await cacheService.set(key, sessions, cacheOptions);
  }

  // Get cached sessions
  async getSessions(fallback = null) {
    const key = CacheKeyGenerators.user.sessions(this.userId);
    
    return await cacheService.get(key, {
      ...CACHE_PRESETS.session,
      fallback
    });
  }

  // Invalidate all user-related cache
  async invalidateAll() {
    const pattern = `user:${this.userId}:*`;
    const deletedCount = await cacheService.delPattern(pattern);
    
    console.log(`🗑️ Invalidated ${deletedCount} cache entries for user ${this.userId}`);
    return deletedCount;
  }

  // Invalidate specific cache type
  async invalidate(type) {
    let key;
    
    switch (type) {
      case 'profile':
        key = CacheKeyGenerators.user.profile(this.userId);
        break;
      case 'settings':
        key = CacheKeyGenerators.user.settings(this.userId);
        break;
      case 'preferences':
        key = CacheKeyGenerators.user.preferences(this.userId);
        break;
      case 'sessions':
        key = CacheKeyGenerators.user.sessions(this.userId);
        break;
      case 'stats':
        return await cacheService.delPattern(`user:${this.userId}:stats:*`);
      default:
        throw new Error(`Unknown cache type: ${type}`);
    }

    return await cacheService.del(key);
  }

  // Warm user cache with essential data
  async warmCache(userData) {
    const operations = [];
    
    // Cache profile
    if (userData.profile) {
      operations.push(this.cacheProfile(userData.profile));
    }
    
    // Cache settings
    if (userData.settings) {
      operations.push(this.cacheSettings(userData.settings));
    }
    
    // Cache preferences
    if (userData.preferences) {
      operations.push(this.cachePreferences(userData.preferences));
    }
    
    const results = await Promise.allSettled(operations);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    
    console.log(`🔥 Warmed ${successCount}/${operations.length} cache entries for user ${this.userId}`);
    return successCount;
  }
}

// Session management with caching
class SessionCache {
  constructor() {
    this.sessionPrefix = 'session:';
  }

  // Store session in cache
  async storeSession(sessionId, sessionData, options = {}) {
    const key = `${this.sessionPrefix}${sessionId}`;
    const cacheOptions = { ...CACHE_PRESETS.session, ...options };
    
    const enrichedSessionData = {
      ...sessionData,
      sessionId,
      lastAccessed: new Date(),
      cached: true
    };

    return await cacheService.set(key, enrichedSessionData, cacheOptions);
  }

  // Get session from cache
  async getSession(sessionId, fallback = null) {
    const key = `${this.sessionPrefix}${sessionId}`;
    
    const sessionData = await cacheService.get(key, {
      ...CACHE_PRESETS.session,
      fallback
    });

    if (sessionData && sessionData.sessionId) {
      // Update last accessed time
      await this.touchSession(sessionId);
    }

    return sessionData;
  }

  // Update session last accessed time
  async touchSession(sessionId) {
    const key = `${this.sessionPrefix}${sessionId}`;
    const sessionData = await cacheService.get(key, CACHE_PRESETS.session);
    
    if (sessionData) {
      sessionData.lastAccessed = new Date();
      await cacheService.set(key, sessionData, CACHE_PRESETS.session);
    }
  }

  // Update session data
  async updateSession(sessionId, updates) {
    const key = `${this.sessionPrefix}${sessionId}`;
    const sessionData = await cacheService.get(key, CACHE_PRESETS.session);
    
    if (sessionData) {
      const updatedData = {
        ...sessionData,
        ...updates,
        lastModified: new Date()
      };
      
      return await cacheService.set(key, updatedData, CACHE_PRESETS.session);
    }
    
    return false;
  }

  // Delete session
  async deleteSession(sessionId) {
    const key = `${this.sessionPrefix}${sessionId}`;
    return await cacheService.del(key);
  }

  // Get active sessions for a user
  async getUserSessions(userId) {
    try {
      // This would typically require Redis SCAN for production
      // For now, we'll use a simplified approach
      const userSessionKey = userCacheKey(userId, 'activeSessions');
      
      return await cacheService.get(userSessionKey, {
        ...CACHE_PRESETS.short,
        fallback: async () => {
          // Fallback would query database or scan Redis keys
          return [];
        }
      });
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Clean expired sessions
  async cleanExpiredSessions() {
    // This would be implemented with Redis key expiration
    // and a cleanup job in production
    console.log('🧹 Session cleanup would run here in production');
  }
}

// Authentication token caching
class AuthTokenCache {
  constructor() {
    this.tokenPrefix = 'auth:token:';
    this.refreshPrefix = 'auth:refresh:';
  }

  // Cache authentication token
  async cacheToken(tokenHash, tokenData, options = {}) {
    const key = `${this.tokenPrefix}${tokenHash}`;
    const cacheOptions = { 
      ttl: options.expiresIn || 3600, // 1 hour default
      useMemory: true, 
      useRedis: true 
    };
    
    const enrichedTokenData = {
      ...tokenData,
      tokenHash,
      cached: true,
      cachedAt: new Date()
    };

    return await cacheService.set(key, enrichedTokenData, cacheOptions);
  }

  // Get cached token
  async getToken(tokenHash) {
    const key = `${this.tokenPrefix}${tokenHash}`;
    
    return await cacheService.get(key, {
      useMemory: true,
      useRedis: true
    });
  }

  // Invalidate token
  async invalidateToken(tokenHash) {
    const key = `${this.tokenPrefix}${tokenHash}`;
    return await cacheService.del(key);
  }

  // Cache refresh token
  async cacheRefreshToken(tokenHash, tokenData, options = {}) {
    const key = `${this.refreshPrefix}${tokenHash}`;
    const cacheOptions = { 
      ttl: options.expiresIn || 604800, // 7 days default
      useMemory: false, 
      useRedis: true 
    };
    
    return await cacheService.set(key, tokenData, cacheOptions);
  }

  // Get cached refresh token
  async getRefreshToken(tokenHash) {
    const key = `${this.refreshPrefix}${tokenHash}`;
    
    return await cacheService.get(key, {
      useMemory: false,
      useRedis: true
    });
  }

  // Invalidate refresh token
  async invalidateRefreshToken(tokenHash) {
    const key = `${this.refreshPrefix}${tokenHash}`;
    return await cacheService.del(key);
  }

  // Invalidate all tokens for a user
  async invalidateUserTokens(userId) {
    const patterns = [
      `auth:token:*:${userId}:*`,
      `auth:refresh:*:${userId}:*`
    ];
    
    let totalDeleted = 0;
    
    for (const pattern of patterns) {
      const deleted = await cacheService.delPattern(pattern);
      totalDeleted += deleted;
    }
    
    console.log(`🗑️ Invalidated ${totalDeleted} auth tokens for user ${userId}`);
    return totalDeleted;
  }
}

// Factory function to create user cache instance
const createUserCache = (userId) => new UserCache(userId);

// Create singleton instances
const sessionCache = new SessionCache();
const authTokenCache = new AuthTokenCache();

module.exports = {
  UserCache,
  SessionCache,
  AuthTokenCache,
  createUserCache,
  sessionCache,
  authTokenCache,
  
  // Middleware integration helpers
  withUserCache: (req, res, next) => {
    if (req.user && req.user._id) {
      req.userCache = createUserCache(req.user._id);
    }
    next();
  },
  
  // Express middleware for automatic user data caching
  autoUserCache: (options = {}) => {
    const { cacheProfile = true, cacheSettings = false, cachePreferences = false } = options;
    
    return async (req, res, next) => {
      if (!req.user || !req.user._id) {
        return next();
      }
      
      req.userCache = createUserCache(req.user._id);
      
      try {
        // Auto-cache user data based on options
        if (cacheProfile && req.user) {
          await req.userCache.cacheProfile(req.user, { ttl: 1800 });
        }
        
        next();
      } catch (error) {
        console.error('Auto user cache error:', error);
        next();
      }
    };
  }
};