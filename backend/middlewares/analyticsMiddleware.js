const { 
  UserAnalytics, 
  ContentAnalytics, 
  SystemAnalytics, 
  FunnelAnalytics 
} = require('../models/advancedAnalyticsModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');

// Middleware to track user interactions automatically
const trackInteraction = (interactionType) => {
  return asyncErrorHandler(async (req, res, next) => {
    // Don't track if user is not authenticated or if it's an analytics endpoint
    if (!req.user || req.path.includes('/analytics')) {
      return next();
    }

    try {
      const sessionId = req.headers['x-session-id'] || req.sessionID || 'anonymous';
      
      const interactionData = {
        type: interactionType,
        page: req.path,
        method: req.method,
        timestamp: new Date(),
        data: {
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          params: req.params,
          query: req.query,
          body: req.method !== 'GET' ? req.body : undefined
        }
      };

      // Find or create user analytics session
      let analytics = await UserAnalytics.findOne({ 
        userId: req.user.id, 
        sessionId,
        'sessionData.endTime': { $exists: false }
      });

      if (!analytics) {
        analytics = new UserAnalytics({
          userId: req.user.id,
          sessionId,
          sessionData: {
            startTime: new Date(),
            device: {
              type: req.headers['x-device-type'] || 'desktop',
              browser: req.headers['user-agent'],
              userAgent: req.headers['user-agent']
            }
          }
        });
      }

      analytics.addInteraction(interactionData);
      await analytics.save();
    } catch (error) {
      // Don't fail the request if analytics tracking fails
      console.error('Analytics tracking error:', error);
    }

    next();
  });
};

// Middleware to track API performance
const trackPerformance = asyncErrorHandler(async (req, res, next) => {
  const start = Date.now();
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Track performance metrics
    if (req.user) {
      trackAPIPerformance(req, res, duration).catch(err => 
        console.error('Performance tracking error:', err)
      );
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

// Helper function to track API performance
const trackAPIPerformance = async (req, res, duration) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.sessionID || 'anonymous';
    
    let analytics = await UserAnalytics.findOne({ 
      userId: req.user.id, 
      sessionId,
      'sessionData.endTime': { $exists: false }
    });

    if (analytics) {
      // Update performance metrics
      const performanceData = {
        endpoint: req.path,
        method: req.method,
        responseTime: duration,
        statusCode: res.statusCode,
        timestamp: new Date()
      };

      if (!analytics.performance.apiCalls) {
        analytics.performance.apiCalls = [];
      }

      analytics.performance.apiCalls.push(performanceData);
      
      // Calculate average response time
      const apiCalls = analytics.performance.apiCalls;
      analytics.performance.averageResponseTime = 
        apiCalls.reduce((sum, call) => sum + call.responseTime, 0) / apiCalls.length;

      // Update error count
      if (res.statusCode >= 400) {
        analytics.performance.errors = (analytics.performance.errors || 0) + 1;
      }

      await analytics.save();
    }
  } catch (error) {
    console.error('Performance tracking error:', error);
  }
};

// Middleware to update system analytics
const updateSystemAnalytics = asyncErrorHandler(async (req, res, next) => {
  // Only update system analytics for certain operations
  const trackableOperations = ['POST', 'PUT', 'DELETE'];
  if (!trackableOperations.includes(req.method)) {
    return next();
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let systemAnalytics = await SystemAnalytics.findOne({
      date: today,
      period: 'day'
    });

    if (!systemAnalytics) {
      systemAnalytics = new SystemAnalytics({
        date: today,
        period: 'day'
      });
    }

    // Track different types of operations
    if (req.path.includes('/content') || req.path.includes('/post')) {
      if (req.method === 'POST') {
        systemAnalytics.content.created += 1;
      } else if (req.method === 'PUT') {
        systemAnalytics.content.updated += 1;
      }
    }

    if (req.path.includes('/user') && req.method === 'POST') {
      systemAnalytics.users.new += 1;
    }

    // Track feature usage
    const feature = extractFeatureFromPath(req.path);
    if (feature) {
      if (!systemAnalytics.features[feature]) {
        systemAnalytics.features[feature] = 0;
      }
      systemAnalytics.features[feature] += 1;
    }

    await systemAnalytics.save();
  } catch (error) {
    console.error('System analytics update error:', error);
  }

  next();
});

// Helper function to extract feature from request path
const extractFeatureFromPath = (path) => {
  const pathSegments = path.split('/').filter(Boolean);
  
  const featureMap = {
    'chat': 'ai_chat',
    'lesson': 'lesson_planner',
    'quiz': 'quiz_generator',
    'presentation': 'presentation_maker',
    'collaboration': 'collaboration',
    'content': 'content_management',
    'analytics': 'analytics',
    'story': 'story_generator'
  };

  for (const segment of pathSegments) {
    if (featureMap[segment]) {
      return featureMap[segment];
    }
  }

  return null;
};

// Middleware to track content engagement
const trackContentEngagement = (engagementType) => {
  return asyncErrorHandler(async (req, res, next) => {
    // Store engagement data for later processing
    req.engagementData = {
      type: engagementType,
      contentId: req.params.contentId || req.params.postId,
      userId: req.user?.id,
      timestamp: new Date(),
      metadata: {
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        ip: req.ip
      }
    };

    next();
  });
};

// Middleware to process engagement data after response
const processEngagementData = asyncErrorHandler(async (req, res, next) => {
  // Override res.end to process engagement after response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    if (req.engagementData && res.statusCode < 400) {
      processEngagement(req.engagementData).catch(err => 
        console.error('Engagement processing error:', err)
      );
    }
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
});

// Helper function to process engagement
const processEngagement = async (engagementData) => {
  if (!engagementData.contentId) return;

  try {
    let contentAnalytics = await ContentAnalytics.findOne({
      contentId: engagementData.contentId
    });

    if (!contentAnalytics) {
      contentAnalytics = new ContentAnalytics({
        contentId: engagementData.contentId
      });
    }

    // Update engagement metrics based on type
    switch (engagementData.type) {
      case 'like':
        contentAnalytics.engagement.likes += 1;
        break;
      case 'share':
        contentAnalytics.engagement.shares += 1;
        break;
      case 'comment':
        contentAnalytics.engagement.comments += 1;
        break;
      case 'download':
        contentAnalytics.engagement.downloads += 1;
        break;
    }

    await contentAnalytics.save();
  } catch (error) {
    console.error('Engagement processing error:', error);
  }
};

// Middleware to track funnel steps
const trackFunnelStep = (funnelId, stepName) => {
  return asyncErrorHandler(async (req, res, next) => {
    if (!req.user) return next();

    try {
      const funnel = await FunnelAnalytics.findById(funnelId);
      if (funnel) {
        await funnel.recordStep(req.user.id, stepName);
      }
    } catch (error) {
      console.error('Funnel tracking error:', error);
    }

    next();
  });
};

// Job to aggregate daily analytics
const aggregateDailyAnalytics = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const nextDay = new Date(yesterday);
    nextDay.setDate(nextDay.getDate() + 1);

    // Aggregate user analytics
    const userSessions = await UserAnalytics.find({
      'sessionData.startTime': { $gte: yesterday, $lt: nextDay }
    });

    // Calculate daily system metrics
    const dailyMetrics = {
      date: yesterday,
      period: 'day',
      users: {
        total: await UserAnalytics.countDocuments(),
        active: userSessions.length,
        new: userSessions.filter(s => s.sessionData.isFirstSession).length
      },
      content: {
        views: await ContentAnalytics.aggregate([
          { $unwind: '$views.daily' },
          { $match: { 'views.daily.date': { $gte: yesterday, $lt: nextDay } } },
          { $group: { _id: null, total: { $sum: '$views.daily.count' } } }
        ]).then(result => result[0]?.total || 0),
        created: 0, // Will be updated by middleware
        updated: 0
      },
      engagement: {
        totalInteractions: userSessions.reduce((sum, s) => sum + s.interactions.length, 0),
        averageSessionDuration: userSessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0) / userSessions.length || 0
      },
      performance: {
        averageResponseTime: userSessions
          .filter(s => s.performance.averageResponseTime)
          .reduce((sum, s) => sum + s.performance.averageResponseTime, 0) / userSessions.length || 0,
        errorRate: userSessions.reduce((sum, s) => sum + (s.performance.errors || 0), 0) / userSessions.length || 0
      }
    };

    // Create or update daily system analytics
    await SystemAnalytics.findOneAndUpdate(
      { date: yesterday, period: 'day' },
      dailyMetrics,
      { upsert: true, new: true }
    );

    console.log('Daily analytics aggregated successfully');
  } catch (error) {
    console.error('Daily analytics aggregation error:', error);
  }
};

// Schedule daily aggregation (run at midnight)
const scheduleDailyAggregation = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const timeUntilMidnight = tomorrow.getTime() - now.getTime();

  setTimeout(() => {
    aggregateDailyAnalytics();
    // Schedule to run every 24 hours
    setInterval(aggregateDailyAnalytics, 24 * 60 * 60 * 1000);
  }, timeUntilMidnight);
};

module.exports = {
  trackInteraction,
  trackPerformance,
  updateSystemAnalytics,
  trackContentEngagement,
  processEngagementData,
  trackFunnelStep,
  aggregateDailyAnalytics,
  scheduleDailyAggregation
};

const {
  scheduleDailyAggregation
} = require('../middlewares/analyticsMiddleware');

// Start the daily aggregation job
scheduleDailyAggregation();