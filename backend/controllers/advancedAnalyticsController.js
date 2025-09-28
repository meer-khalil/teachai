const { 
  UserAnalytics, 
  ContentAnalytics, 
  SystemAnalytics, 
  FunnelAnalytics 
} = require('../models/advancedAnalyticsModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const CustomError = require('../utils/errorHandler');
const SearchFeatures = require('../utils/searchFeatures');

// Track user interaction
const trackUserInteraction = asyncErrorHandler(async (req, res, next) => {
  const { sessionId, interaction } = req.body;
  const userId = req.user.id;

  if (!sessionId || !interaction) {
    return next(new CustomError('Session ID and interaction data are required', 400));
  }

  // Find or create user analytics session
  let analytics = await UserAnalytics.findOne({ 
    userId, 
    sessionId,
    'sessionData.endTime': { $exists: false }
  });

  if (!analytics) {
    analytics = new UserAnalytics({
      userId,
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

  // Add interaction
  analytics.addInteraction(interaction);
  await analytics.save();

  res.status(200).json({
    success: true,
    message: 'Interaction tracked successfully'
  });
});

// End user session
const endUserSession = asyncErrorHandler(async (req, res, next) => {
  const { sessionId } = req.body;
  const userId = req.user.id;

  const analytics = await UserAnalytics.findOne({ 
    userId, 
    sessionId,
    'sessionData.endTime': { $exists: false }
  });

  if (analytics) {
    analytics.endSession();
    await analytics.save();
  }

  res.status(200).json({
    success: true,
    message: 'Session ended successfully'
  });
});

// Record content view
const recordContentView = asyncErrorHandler(async (req, res, next) => {
  const { contentId } = req.params;
  const { 
    contentType = 'content',
    timeSpent,
    scrollDepth,
    device,
    isUnique = false 
  } = req.body;

  const viewerData = {
    contentType,
    timeSpent,
    scrollDepth,
    device: device || req.headers['x-device-type'] || 'desktop',
    isUnique,
    location: {
      country: req.headers['cf-ipcountry'] || req.headers['x-country'] || 'Unknown'
    }
  };

  const analytics = await ContentAnalytics.recordView(contentId, viewerData);

  // Update engagement metrics if provided
  if (timeSpent) {
    const currentAvg = analytics.engagement.averageTimeSpent;
    const totalViews = analytics.views.total;
    analytics.engagement.averageTimeSpent = 
      ((currentAvg * (totalViews - 1)) + timeSpent) / totalViews;
  }

  if (scrollDepth) {
    const currentAvg = analytics.engagement.scrollDepth.average;
    const totalViews = analytics.views.total;
    analytics.engagement.scrollDepth.average = 
      ((currentAvg * (totalViews - 1)) + scrollDepth) / totalViews;
  }

  await analytics.save();

  res.status(200).json({
    success: true,
    message: 'Content view recorded successfully'
  });
});

// Get user analytics
const getUserAnalytics = asyncErrorHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { 
    startDate, 
    endDate, 
    limit = 100,
    period = 'day' 
  } = req.query;

  // Build query
  const query = { userId };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const features = new SearchFeatures(
    UserAnalytics.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit)),
    req.query
  );

  const analytics = await features.query;

  // Calculate summary statistics
  const summary = {
    totalSessions: analytics.length,
    totalInteractions: analytics.reduce((sum, a) => sum + a.interactions.length, 0),
    averageSessionDuration: analytics.reduce((sum, a) => sum + (a.sessionData.duration || 0), 0) / analytics.length,
    featureUsage: {},
    engagementMetrics: {
      totalActiveTime: analytics.reduce((sum, a) => sum + a.engagement.activeTime, 0),
      averageScrollDepth: analytics.reduce((sum, a) => sum + a.engagement.scrollDepth, 0) / analytics.length,
      totalClicks: analytics.reduce((sum, a) => sum + a.engagement.clickCount, 0)
    }
  };

  // Aggregate feature usage
  analytics.forEach(a => {
    Object.keys(a.featureUsage).forEach(feature => {
      if (!summary.featureUsage[feature]) {
        summary.featureUsage[feature] = { used: 0, frequency: 0 };
      }
      if (a.featureUsage[feature].used) summary.featureUsage[feature].used++;
      summary.featureUsage[feature].frequency += a.featureUsage[feature].frequency;
    });
  });

  res.status(200).json({
    success: true,
    results: analytics.length,
    data: { analytics, summary }
  });
});

// Get content analytics
const getContentAnalytics = asyncErrorHandler(async (req, res, next) => {
  const { contentId } = req.params;
  const { startDate, endDate } = req.query;

  const query = { contentId };
  const analytics = await ContentAnalytics.findOne(query);

  if (!analytics) {
    return next(new CustomError('No analytics found for this content', 404));
  }

  // Filter daily data by date range if provided
  if (startDate || endDate) {
    analytics.views.daily = analytics.views.daily.filter(day => {
      const dayDate = new Date(day.date);
      if (startDate && dayDate < new Date(startDate)) return false;
      if (endDate && dayDate > new Date(endDate)) return false;
      return true;
    });
  }

  res.status(200).json({
    success: true,
    data: { analytics }
  });
});

// Get dashboard analytics
const getDashboardAnalytics = asyncErrorHandler(async (req, res, next) => {
  const { 
    period = 'day', 
    startDate, 
    endDate,
    metrics = 'all' 
  } = req.query;

  // Build date query
  const dateQuery = {};
  if (startDate || endDate) {
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
  } else {
    // Default to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dateQuery.$gte = thirtyDaysAgo;
  }

  const query = { 
    period,
    ...(Object.keys(dateQuery).length && { date: dateQuery })
  };

  const systemAnalytics = await SystemAnalytics.find(query).sort({ date: -1 });

  // Calculate totals and trends
  const totals = systemAnalytics.reduce((acc, curr) => {
    acc.users.total += curr.users.total || 0;
    acc.users.active += curr.users.active || 0;
    acc.users.new += curr.users.new || 0;
    acc.content.created += curr.content.created || 0;
    acc.content.views += curr.content.views || 0;
    acc.revenue.total += curr.revenue.total || 0;
    return acc;
  }, {
    users: { total: 0, active: 0, new: 0 },
    content: { created: 0, views: 0 },
    revenue: { total: 0 }
  });

  // Calculate trends (compare with previous period)
  const midPoint = Math.floor(systemAnalytics.length / 2);
  const currentPeriod = systemAnalytics.slice(0, midPoint);
  const previousPeriod = systemAnalytics.slice(midPoint);

  const calculateTrend = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const currentTotals = currentPeriod.reduce((acc, curr) => {
    acc.users += curr.users.active || 0;
    acc.content += curr.content.created || 0;
    acc.revenue += curr.revenue.total || 0;
    return acc;
  }, { users: 0, content: 0, revenue: 0 });

  const previousTotals = previousPeriod.reduce((acc, curr) => {
    acc.users += curr.users.active || 0;
    acc.content += curr.content.created || 0;
    acc.revenue += curr.revenue.total || 0;
    return acc;
  }, { users: 0, content: 0, revenue: 0 });

  const trends = {
    users: calculateTrend(currentTotals.users, previousTotals.users),
    content: calculateTrend(currentTotals.content, previousTotals.content),
    revenue: calculateTrend(currentTotals.revenue, previousTotals.revenue)
  };

  // Get top content
  const topContent = await ContentAnalytics.find({})
    .sort({ 'views.total': -1 })
    .limit(10)
    .populate('contentId', 'title type');

  // Get feature usage
  const featureUsage = systemAnalytics.reduce((acc, curr) => {
    Object.keys(curr.features).forEach(feature => {
      acc[feature] = (acc[feature] || 0) + curr.features[feature];
    });
    return acc;
  }, {});

  res.status(200).json({
    success: true,
    data: {
      overview: {
        totals,
        trends,
        period,
        dataPoints: systemAnalytics.length
      },
      timeSeries: systemAnalytics,
      topContent,
      featureUsage
    }
  });
});

// Get real-time analytics
const getRealTimeAnalytics = asyncErrorHandler(async (req, res, next) => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Get recent user activity
  const recentActivity = await UserAnalytics.find({
    'sessionData.startTime': { $gte: oneHourAgo },
    'sessionData.endTime': { $exists: false }
  })
  .populate('userId', 'name')
  .sort({ 'sessionData.startTime': -1 })
  .limit(100);

  // Get current active users
  const activeUsers = recentActivity.length;

  // Get recent interactions
  const recentInteractions = [];
  recentActivity.forEach(session => {
    const interactions = session.interactions
      .filter(i => i.timestamp >= oneHourAgo)
      .slice(-5); // Last 5 interactions per session
    recentInteractions.push(...interactions);
  });

  recentInteractions.sort((a, b) => b.timestamp - a.timestamp);

  // Get real-time metrics
  const metrics = {
    activeUsers,
    sessionsLastHour: recentActivity.length,
    interactionsLastHour: recentInteractions.length,
    topPages: {},
    topInteractions: {}
  };

  // Calculate top pages and interactions
  recentInteractions.forEach(interaction => {
    metrics.topPages[interaction.page] = (metrics.topPages[interaction.page] || 0) + 1;
    metrics.topInteractions[interaction.type] = (metrics.topInteractions[interaction.type] || 0) + 1;
  });

  res.status(200).json({
    success: true,
    data: {
      metrics,
      recentActivity: recentActivity.slice(0, 20),
      recentInteractions: recentInteractions.slice(0, 50)
    }
  });
});

// Create custom funnel
const createFunnel = asyncErrorHandler(async (req, res, next) => {
  const { name, description, steps } = req.body;

  if (!name || !steps || steps.length < 2) {
    return next(new CustomError('Funnel name and at least 2 steps are required', 400));
  }

  const funnel = new FunnelAnalytics({
    name,
    description,
    steps: steps.map((step, index) => ({
      ...step,
      order: index + 1
    }))
  });

  await funnel.save();

  res.status(201).json({
    success: true,
    message: 'Funnel created successfully',
    data: { funnel }
  });
});

// Get funnel analytics
const getFunnelAnalytics = asyncErrorHandler(async (req, res, next) => {
  const { funnelId } = req.params;
  const { startDate, endDate } = req.query;

  const funnel = await FunnelAnalytics.findById(funnelId);
  if (!funnel) {
    return next(new CustomError('Funnel not found', 404));
  }

  // Filter data by date range
  let funnelData = funnel.data;
  if (startDate || endDate) {
    funnelData = funnelData.filter(data => {
      const dataDate = new Date(data.date);
      if (startDate && dataDate < new Date(startDate)) return false;
      if (endDate && dataDate > new Date(endDate)) return false;
      return true;
    });
  }

  // Calculate aggregated metrics
  const aggregated = {
    totalUsers: funnelData.reduce((sum, d) => sum + d.totalUsers, 0),
    finalConversions: funnelData.reduce((sum, d) => sum + d.finalConversions, 0),
    overallConversionRate: 0,
    stepMetrics: []
  };

  if (aggregated.totalUsers > 0) {
    aggregated.overallConversionRate = (aggregated.finalConversions / aggregated.totalUsers) * 100;
  }

  // Calculate step metrics
  if (funnelData.length > 0) {
    const stepCount = funnel.steps.length;
    for (let i = 0; i < stepCount; i++) {
      const stepUsers = funnelData.reduce((sum, d) => sum + (d.stepData[i]?.users || 0), 0);
      const stepConversions = funnelData.reduce((sum, d) => sum + (d.stepData[i]?.conversions || 0), 0);
      
      aggregated.stepMetrics.push({
        step: i + 1,
        name: funnel.steps[i].name,
        users: stepUsers,
        conversions: stepConversions,
        conversionRate: stepUsers > 0 ? (stepConversions / stepUsers) * 100 : 0,
        dropoffRate: stepUsers > 0 ? ((stepUsers - stepConversions) / stepUsers) * 100 : 0
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      funnel: {
        ...funnel.toObject(),
        data: funnelData
      },
      aggregated
    }
  });
});

// Export data
const exportAnalytics = asyncErrorHandler(async (req, res, next) => {
  const { 
    type = 'user', // user, content, system
    format = 'json', // json, csv
    startDate, 
    endDate 
  } = req.query;

  // Build query
  const dateQuery = {};
  if (startDate || endDate) {
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);
  }

  let data;
  let filename;

  switch (type) {
    case 'user':
      data = await UserAnalytics.find({ 
        ...(Object.keys(dateQuery).length && { createdAt: dateQuery })
      }).populate('userId', 'name email');
      filename = `user_analytics_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'content':
      data = await ContentAnalytics.find({})
        .populate('contentId', 'title type');
      filename = `content_analytics_${new Date().toISOString().split('T')[0]}`;
      break;
    case 'system':
      data = await SystemAnalytics.find({
        ...(Object.keys(dateQuery).length && { date: dateQuery })
      });
      filename = `system_analytics_${new Date().toISOString().split('T')[0]}`;
      break;
    default:
      return next(new CustomError('Invalid analytics type', 400));
  }

  if (format === 'csv') {
    // Convert to CSV format
    const csvData = convertToCSV(data);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csvData);
  } else {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json({
      success: true,
      exportDate: new Date(),
      type,
      count: data.length,
      data
    });
  }
});

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value).replace(/"/g, '""');
      }
      return value?.toString().replace(/"/g, '""') || '';
    });
    csvRows.push(values.map(v => `"${v}"`).join(','));
  });
  
  return csvRows.join('\n');
};

module.exports = {
  trackUserInteraction,
  endUserSession,
  recordContentView,
  getUserAnalytics,
  getContentAnalytics,
  getDashboardAnalytics,
  getRealTimeAnalytics,
  createFunnel,
  getFunnelAnalytics,
  exportAnalytics
};