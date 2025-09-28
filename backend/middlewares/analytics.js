const { AnalyticsEvent, UserSession, PerformanceMetrics } = require('../models/analyticsModel');

// Analytics tracking middleware
const analyticsMiddleware = (req, res, next) => {
  // Track performance metrics
  const startTime = Date.now();
  
  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    
    // Don't track analytics endpoints to avoid recursive logging
    if (req.path.startsWith('/api/analytics/track')) {
      return;
    }
    
    try {
      // Save performance metrics
      const performanceMetric = new PerformanceMetrics({
        endpoint: req.path,
        method: req.method,
        responseTime,
        statusCode: res.statusCode,
        userAgent: req.headers['user-agent'],
        userId: req.user ? req.user._id : null,
        errorMessage: res.statusCode >= 400 ? res.statusMessage : null
      });
      
      await performanceMetric.save();
      
      // Track page view events for GET requests
      if (req.method === 'GET' && res.statusCode === 200) {
        const event = new AnalyticsEvent({
          eventType: 'page_view',
          userId: req.user ? req.user._id : null,
          sessionId: req.sessionID || req.headers['x-session-id'] || 'anonymous',
          metadata: {
            page: req.path,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
            responseTime
          }
        });
        
        await event.save();
      }
      
      // Track API errors
      if (res.statusCode >= 400) {
        const errorEvent = new AnalyticsEvent({
          eventType: 'error_occurred',
          userId: req.user ? req.user._id : null,
          sessionId: req.sessionID || req.headers['x-session-id'] || 'anonymous',
          metadata: {
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            errorType: getErrorType(res.statusCode),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          }
        });
        
        await errorEvent.save();
      }
      
    } catch (error) {
      console.error('Analytics middleware error:', error);
      // Don't let analytics errors break the request
    }
  });
  
  next();
};

// Session tracking middleware
const sessionTrackingMiddleware = (req, res, next) => {
  const sessionId = req.sessionID || req.headers['x-session-id'];
  
  if (sessionId && req.user) {
    // Update or create session
    UserSession.findOneAndUpdate(
      { sessionId },
      {
        $set: {
          userId: req.user._id,
          isActive: true,
          deviceInfo: {
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          }
        },
        $inc: {
          pageViews: req.method === 'GET' ? 1 : 0,
          interactions: req.method !== 'GET' ? 1 : 0
        },
        $setOnInsert: {
          startTime: new Date()
        }
      },
      { upsert: true, new: true }
    ).catch(error => {
      console.error('Session tracking error:', error);
    });
  }
  
  next();
};

// User authentication tracking
const authTrackingMiddleware = (eventType) => {
  return async (req, res, next) => {
    // This middleware is called after successful auth operations
    res.on('finish', async () => {
      if (res.statusCode === 200 && req.user) {
        try {
          const event = new AnalyticsEvent({
            eventType,
            userId: req.user._id,
            sessionId: req.sessionID || req.headers['x-session-id'] || 'anonymous',
            metadata: {
              userAgent: req.headers['user-agent'],
              ipAddress: req.ip,
              timestamp: new Date()
            }
          });
          
          await event.save();
        } catch (error) {
          console.error('Auth tracking error:', error);
        }
      }
    });
    
    next();
  };
};

// Feature usage tracking helper
const trackFeatureUsage = async (userId, feature, metadata = {}) => {
  try {
    const event = new AnalyticsEvent({
      eventType: 'feature_usage',
      userId,
      sessionId: metadata.sessionId || 'backend',
      metadata: {
        feature,
        ...metadata,
        timestamp: new Date()
      }
    });
    
    await event.save();
  } catch (error) {
    console.error('Feature tracking error:', error);
  }
};

// Helper function to categorize HTTP errors
function getErrorType(statusCode) {
  if (statusCode >= 400 && statusCode < 500) {
    switch (statusCode) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 409: return 'Conflict';
      case 422: return 'Validation Error';
      default: return 'Client Error';
    }
  } else if (statusCode >= 500) {
    switch (statusCode) {
      case 500: return 'Internal Server Error';
      case 502: return 'Bad Gateway';
      case 503: return 'Service Unavailable';
      case 504: return 'Gateway Timeout';
      default: return 'Server Error';
    }
  }
  return 'Unknown Error';
}

module.exports = {
  analyticsMiddleware,
  sessionTrackingMiddleware,
  authTrackingMiddleware,
  trackFeatureUsage
};