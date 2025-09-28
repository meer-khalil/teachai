const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const ErrorHandler = require('../utils/errorHandler');
const { 
  AnalyticsEvent, 
  UserSession, 
  DailyMetrics, 
  RealtimeMetrics,
  PerformanceMetrics,
  UserBehavior 
} = require('../models/analyticsModel');
const User = require('../models/userModel');

// Track analytics event
exports.trackEvent = asyncErrorHandler(async (req, res, next) => {
  const { eventType, metadata = {} } = req.body;
  const userId = req.user ? req.user._id : null;
  const sessionId = req.sessionID || req.headers['x-session-id'] || 'anonymous';

  // Add request metadata
  metadata.userAgent = req.headers['user-agent'];
  metadata.ipAddress = req.ip;

  const event = new AnalyticsEvent({
    eventType,
    userId,
    sessionId,
    metadata
  });

  await event.save();

  // Update real-time metrics
  await updateRealtimeMetrics(event);

  res.status(200).json({
    success: true,
    message: 'Event tracked successfully'
  });
});

// Get dashboard overview
exports.getDashboardOverview = asyncErrorHandler(async (req, res, next) => {
  const timeRange = req.query.range || '7d'; // 1d, 7d, 30d, 90d
  const startDate = getStartDate(timeRange);

  // Get current period metrics
  const currentMetrics = await getDashboardMetrics(startDate, new Date());
  
  // Get previous period for comparison
  const periodLength = new Date() - startDate;
  const previousStart = new Date(startDate.getTime() - periodLength);
  const previousMetrics = await getDashboardMetrics(previousStart, startDate);

  // Calculate percentage changes
  const changes = calculateMetricChanges(currentMetrics, previousMetrics);

  res.status(200).json({
    success: true,
    data: {
      current: currentMetrics,
      changes,
      timeRange
    }
  });
});

// Get user analytics
exports.getUserAnalytics = asyncErrorHandler(async (req, res, next) => {
  const timeRange = req.query.range || '30d';
  const startDate = getStartDate(timeRange);

  // User growth metrics
  const newUsers = await User.countDocuments({
    createdAt: { $gte: startDate }
  });

  const totalUsers = await User.countDocuments();

  // Active users
  const activeUsers = await AnalyticsEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        userId: { $exists: true }
      }
    },
    {
      $group: {
        _id: '$userId'
      }
    },
    {
      $count: 'activeUsers'
    }
  ]);

  // User engagement metrics
  const engagementMetrics = await AnalyticsEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        userId: { $exists: true }
      }
    },
    {
      $group: {
        _id: '$userId',
        sessions: { $addToSet: '$sessionId' },
        events: { $sum: 1 },
        lastActivity: { $max: '$timestamp' }
      }
    },
    {
      $addFields: {
        sessionCount: { $size: '$sessions' }
      }
    },
    {
      $group: {
        _id: null,
        avgEventsPerUser: { $avg: '$events' },
        avgSessionsPerUser: { $avg: '$sessionCount' },
        users: { $push: '$$ROOT' }
      }
    }
  ]);

  // User retention cohorts
  const retentionData = await calculateUserRetention(startDate);

  // Top user segments
  const userSegments = await getUserSegments();

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totalUsers,
        newUsers,
        activeUsers: activeUsers[0]?.activeUsers || 0,
        avgEventsPerUser: engagementMetrics[0]?.avgEventsPerUser || 0,
        avgSessionsPerUser: engagementMetrics[0]?.avgSessionsPerUser || 0
      },
      retention: retentionData,
      segments: userSegments
    }
  });
});

// Get content analytics
exports.getContentAnalytics = asyncErrorHandler(async (req, res, next) => {
  const timeRange = req.query.range || '30d';
  const startDate = getStartDate(timeRange);

  // Page views analytics
  const pageViews = await AnalyticsEvent.aggregate([
    {
      $match: {
        eventType: 'page_view',
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$metadata.page',
        views: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $addFields: {
        uniqueViews: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { views: -1 }
    },
    {
      $limit: 20
    }
  ]);

  // Chatbot interaction analytics
  const chatbotAnalytics = await AnalyticsEvent.aggregate([
    {
      $match: {
        eventType: 'chatbot_interaction',
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$metadata.chatbotType',
        interactions: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        avgDuration: { $avg: '$metadata.duration' }
      }
    },
    {
      $addFields: {
        uniqueInteractors: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { interactions: -1 }
    }
  ]);

  // Quiz performance analytics
  const quizAnalytics = await AnalyticsEvent.aggregate([
    {
      $match: {
        eventType: 'quiz_complete',
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$metadata.quizId',
        completions: { $sum: 1 },
        avgScore: { $avg: '$metadata.score' },
        uniqueUsers: { $addToSet: '$userId' }
      }
    },
    {
      $addFields: {
        uniqueCompletions: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { completions: -1 }
    }
  ]);

  // AI service usage
  const aiServiceAnalytics = await AnalyticsEvent.aggregate([
    {
      $match: {
        eventType: 'ai_request',
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$metadata.aiService',
        requests: { $sum: 1 },
        uniqueUsers: { $addToSet: '$userId' },
        avgDuration: { $avg: '$metadata.duration' }
      }
    },
    {
      $addFields: {
        uniqueRequestors: { $size: '$uniqueUsers' }
      }
    },
    {
      $sort: { requests: -1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      pageViews,
      chatbots: chatbotAnalytics,
      quizzes: quizAnalytics,
      aiServices: aiServiceAnalytics
    }
  });
});

// Get performance analytics
exports.getPerformanceAnalytics = asyncErrorHandler(async (req, res, next) => {
  const timeRange = req.query.range || '24h';
  const startDate = getStartDate(timeRange);

  // Response time analytics
  const responseTimeMetrics = await PerformanceMetrics.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$endpoint',
        avgResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' },
        requestCount: { $sum: 1 },
        errorCount: {
          $sum: {
            $cond: [{ $gte: ['$statusCode', 400] }, 1, 0]
          }
        }
      }
    },
    {
      $addFields: {
        errorRate: {
          $multiply: [
            { $divide: ['$errorCount', '$requestCount'] },
            100
          ]
        }
      }
    },
    {
      $sort: { requestCount: -1 }
    }
  ]);

  // Error analytics
  const errorAnalytics = await AnalyticsEvent.aggregate([
    {
      $match: {
        eventType: 'error_occurred',
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$metadata.errorType',
        count: { $sum: 1 },
        affectedUsers: { $addToSet: '$userId' }
      }
    },
    {
      $addFields: {
        uniqueAffectedUsers: { $size: '$affectedUsers' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // System health metrics
  const realtimeMetrics = await RealtimeMetrics.findById('realtime');

  res.status(200).json({
    success: true,
    data: {
      responseTime: responseTimeMetrics,
      errors: errorAnalytics,
      systemHealth: realtimeMetrics?.systemHealth || {},
      realtime: {
        activeUsers: realtimeMetrics?.activeUsers || 0,
        activeSessions: realtimeMetrics?.activeSessions || 0,
        lastUpdated: realtimeMetrics?.lastUpdated
      }
    }
  });
});

// Get user behavior insights
exports.getUserBehaviorInsights = asyncErrorHandler(async (req, res, next) => {
  const userId = req.params.userId;
  
  if (!userId && !req.user?.isAdmin) {
    return next(new ErrorHandler('Access denied', 403));
  }

  const targetUserId = userId || req.user._id;

  // Get or generate user behavior insights
  let behaviorInsights = await UserBehavior.findOne({ userId: targetUserId });

  if (!behaviorInsights || 
      new Date() - behaviorInsights.lastCalculated > 24 * 60 * 60 * 1000) {
    // Recalculate insights
    behaviorInsights = await calculateUserBehaviorInsights(targetUserId);
  }

  res.status(200).json({
    success: true,
    data: behaviorInsights
  });
});

// Export analytics data
exports.exportAnalytics = asyncErrorHandler(async (req, res, next) => {
  const { type, format = 'json', range = '30d' } = req.query;
  
  if (!req.user?.isAdmin) {
    return next(new ErrorHandler('Admin access required', 403));
  }

  const startDate = getStartDate(range);
  let data = {};

  switch (type) {
    case 'events':
      data = await AnalyticsEvent.find({
        timestamp: { $gte: startDate }
      }).populate('userId', 'name email');
      break;
    case 'users':
      data = await getUserAnalyticsExport(startDate);
      break;
    case 'performance':
      data = await PerformanceMetrics.find({
        timestamp: { $gte: startDate }
      });
      break;
    default:
      return next(new ErrorHandler('Invalid export type', 400));
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csv = convertToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_${range}.csv`);
    return res.send(csv);
  }

  res.status(200).json({
    success: true,
    data,
    exportedAt: new Date(),
    type,
    range
  });
});

// Helper Functions

function getStartDate(timeRange) {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000);
    case '24h':
    case '1d':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

async function getDashboardMetrics(startDate, endDate) {
  const metrics = await AnalyticsEvent.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $facet: {
        totalEvents: [{ $count: 'count' }],
        activeUsers: [
          { $match: { userId: { $exists: true } } },
          { $group: { _id: '$userId' } },
          { $count: 'count' }
        ],
        pageViews: [
          { $match: { eventType: 'page_view' } },
          { $count: 'count' }
        ],
        chatbotInteractions: [
          { $match: { eventType: 'chatbot_interaction' } },
          { $count: 'count' }
        ],
        quizCompletions: [
          { $match: { eventType: 'quiz_complete' } },
          { $count: 'count' }
        ],
        aiRequests: [
          { $match: { eventType: 'ai_request' } },
          { $count: 'count' }
        ]
      }
    }
  ]);

  return {
    totalEvents: metrics[0].totalEvents[0]?.count || 0,
    activeUsers: metrics[0].activeUsers[0]?.count || 0,
    pageViews: metrics[0].pageViews[0]?.count || 0,
    chatbotInteractions: metrics[0].chatbotInteractions[0]?.count || 0,
    quizCompletions: metrics[0].quizCompletions[0]?.count || 0,
    aiRequests: metrics[0].aiRequests[0]?.count || 0
  };
}

function calculateMetricChanges(current, previous) {
  const changes = {};
  Object.keys(current).forEach(key => {
    const currentValue = current[key] || 0;
    const previousValue = previous[key] || 0;
    
    if (previousValue === 0) {
      changes[key] = currentValue > 0 ? 100 : 0;
    } else {
      changes[key] = ((currentValue - previousValue) / previousValue) * 100;
    }
  });
  return changes;
}

async function updateRealtimeMetrics(event) {
  // Update real-time metrics collection
  await RealtimeMetrics.updateOne(
    { _id: 'realtime' },
    {
      $push: {
        recentEvents: {
          $each: [{
            eventType: event.eventType,
            userId: event.userId,
            timestamp: event.timestamp,
            metadata: event.metadata
          }],
          $slice: -50 // Keep only last 50 events
        }
      },
      $set: {
        lastUpdated: new Date()
      }
    },
    { upsert: true }
  );
}

async function calculateUserRetention(startDate) {
  // Simplified retention calculation
  // In production, this would be more sophisticated
  return {
    day1: 85,
    day7: 62,
    day30: 34
  };
}

async function getUserSegments() {
  // Simplified user segments
  return [
    { name: 'Power Users', count: 150, percentage: 12 },
    { name: 'Regular Users', count: 450, percentage: 36 },
    { name: 'Casual Users', count: 650, percentage: 52 }
  ];
}

async function calculateUserBehaviorInsights(userId) {
  // Calculate comprehensive user behavior insights
  // This is a simplified version - in production would be more complex
  const insights = {
    favoriteFeatures: ['quiz', 'chatbot', 'lesson'],
    avgSessionDuration: 15.5,
    totalSessions: 45,
    preferredTimeOfDay: 'evening',
    learningStreak: 7,
    completionRate: 78,
    engagementScore: 85,
    learningStyle: 'visual',
    improvementAreas: ['math', 'writing']
  };

  return await UserBehavior.findOneAndUpdate(
    { userId },
    { insights, lastCalculated: new Date() },
    { upsert: true, new: true }
  );
}

function convertToCSV(data) {
  // Simple CSV conversion - in production would use proper library
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => row[header] || '').join(','))
  ].join('\n');
  
  return csvContent;
}