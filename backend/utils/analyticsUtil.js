const { 
  AnalyticsEvent, 
  DailyMetrics, 
  RealtimeMetrics,
  UserSession,
  UserBehavior 
} = require('../models/analyticsModel');
const User = require('../models/userModel');

// Calculate and store daily metrics
const calculateDailyMetrics = async (date = new Date()) => {
  try {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    console.log(`Calculating daily metrics for ${startOfDay.toDateString()}`);

    // Aggregate various metrics for the day
    const metrics = await AnalyticsEvent.aggregate([
      {
        $match: {
          timestamp: { $gte: startOfDay, $lte: endOfDay }
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
          quizzesCompleted: [
            { $match: { eventType: 'quiz_complete' } },
            { 
              $group: {
                _id: null,
                count: { $sum: 1 },
                avgScore: { $avg: '$metadata.score' }
              }
            }
          ],
          aiRequests: [
            { $match: { eventType: 'ai_request' } },
            { $count: 'count' }
          ],
          errors: [
            { $match: { eventType: 'error_occurred' } },
            { $count: 'count' }
          ],
          topPages: [
            { $match: { eventType: 'page_view' } },
            { 
              $group: {
                _id: '$metadata.page',
                views: { $sum: 1 }
              }
            },
            { $sort: { views: -1 } },
            { $limit: 10 }
          ],
          topChatbots: [
            { $match: { eventType: 'chatbot_interaction' } },
            {
              $group: {
                _id: '$metadata.chatbotType',
                interactions: { $sum: 1 }
              }
            },
            { $sort: { interactions: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    // Get session metrics
    const sessionMetrics = await UserSession.aggregate([
      {
        $match: {
          startTime: { $gte: startOfDay, $lte: endOfDay }
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    // Get new registrations
    const newRegistrations = await User.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });

    // Prepare metrics object
    const dailyMetricsData = {
      date: startOfDay,
      metrics: {
        totalUsers: await User.countDocuments({ createdAt: { $lte: endOfDay } }),
        activeUsers: metrics[0].activeUsers[0]?.count || 0,
        newRegistrations,
        totalSessions: sessionMetrics[0]?.totalSessions || 0,
        avgSessionDuration: sessionMetrics[0]?.avgDuration || 0,
        pageViews: metrics[0].pageViews[0]?.count || 0,
        chatbotInteractions: metrics[0].chatbotInteractions[0]?.count || 0,
        quizzesCompleted: metrics[0].quizzesCompleted[0]?.count || 0,
        aiRequests: metrics[0].aiRequests[0]?.count || 0,
        errors: metrics[0].errors[0]?.count || 0,
        avgQuizScore: metrics[0].quizzesCompleted[0]?.avgScore || 0
      },
      topPages: metrics[0].topPages.map(page => ({
        page: page._id,
        views: page.views
      })),
      topChatbots: metrics[0].topChatbots.map(chatbot => ({
        chatbotType: chatbot._id,
        interactions: chatbot.interactions
      })),
      userRetention: await calculateRetentionForDate(startOfDay)
    };

    // Save or update daily metrics
    await DailyMetrics.findOneAndUpdate(
      { date: startOfDay },
      dailyMetricsData,
      { upsert: true, new: true }
    );

    console.log(`Daily metrics calculated successfully for ${startOfDay.toDateString()}`);
    return dailyMetricsData;

  } catch (error) {
    console.error('Error calculating daily metrics:', error);
    throw error;
  }
};

// Update real-time metrics
const updateRealtimeMetrics = async () => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    // Get active users (users with activity in last 5 minutes)
    const activeUsers = await AnalyticsEvent.distinct('userId', {
      timestamp: { $gte: fiveMinutesAgo },
      userId: { $exists: true }
    });

    // Get active sessions
    const activeSessions = await UserSession.countDocuments({
      isActive: true,
      startTime: { $gte: oneHourAgo }
    });

    // Get recent events
    const recentEvents = await AnalyticsEvent.find({
      timestamp: { $gte: fiveMinutesAgo }
    })
    .sort({ timestamp: -1 })
    .limit(50)
    .select('eventType userId timestamp metadata');

    // Calculate system health metrics (simplified)
    const recentErrors = await AnalyticsEvent.countDocuments({
      eventType: 'error_occurred',
      timestamp: { $gte: oneHourAgo }
    });

    const totalRequests = await AnalyticsEvent.countDocuments({
      timestamp: { $gte: oneHourAgo }
    });

    const errorRate = totalRequests > 0 ? (recentErrors / totalRequests) * 100 : 0;

    // Update real-time metrics
    const realtimeData = {
      activeUsers: activeUsers.length,
      activeSessions,
      recentEvents,
      systemHealth: {
        errorRate,
        activeConnections: activeSessions,
        // These would come from system monitoring in production
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        avgResponseTime: 150 + Math.random() * 100
      },
      lastUpdated: now
    };

    await RealtimeMetrics.findByIdAndUpdate(
      'realtime',
      realtimeData,
      { upsert: true, new: true }
    );

    return realtimeData;

  } catch (error) {
    console.error('Error updating real-time metrics:', error);
    throw error;
  }
};

// Calculate user retention for a specific date
const calculateRetentionForDate = async (date) => {
  try {
    // Get users who registered on this date
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const newUsers = await User.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    }).select('_id');

    if (newUsers.length === 0) {
      return { day1: 0, day7: 0, day30: 0 };
    }

    const newUserIds = newUsers.map(user => user._id);

    // Calculate retention for different periods
    const day1 = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const day7 = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
    const day30 = new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [day1Active, day7Active, day30Active] = await Promise.all([
      AnalyticsEvent.distinct('userId', {
        userId: { $in: newUserIds },
        timestamp: { 
          $gte: day1,
          $lt: new Date(day1.getTime() + 24 * 60 * 60 * 1000)
        }
      }),
      AnalyticsEvent.distinct('userId', {
        userId: { $in: newUserIds },
        timestamp: { 
          $gte: day7,
          $lt: new Date(day7.getTime() + 24 * 60 * 60 * 1000)
        }
      }),
      AnalyticsEvent.distinct('userId', {
        userId: { $in: newUserIds },
        timestamp: { 
          $gte: day30,
          $lt: new Date(day30.getTime() + 24 * 60 * 60 * 1000)
        }
      })
    ]);

    return {
      day1: Math.round((day1Active.length / newUsers.length) * 100),
      day7: Math.round((day7Active.length / newUsers.length) * 100),
      day30: Math.round((day30Active.length / newUsers.length) * 100)
    };

  } catch (error) {
    console.error('Error calculating retention:', error);
    return { day1: 0, day7: 0, day30: 0 };
  }
};

// Update user behavior insights
const updateUserBehaviorInsights = async (userId) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Get user's activity in the last 30 days
    const userEvents = await AnalyticsEvent.find({
      userId,
      timestamp: { $gte: thirtyDaysAgo }
    });

    if (userEvents.length === 0) {
      return null;
    }

    // Analyze favorite features
    const featureCount = {};
    userEvents.forEach(event => {
      const feature = getFeatureFromEvent(event);
      featureCount[feature] = (featureCount[feature] || 0) + 1;
    });

    const favoriteFeatures = Object.entries(featureCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([feature]) => feature);

    // Calculate session metrics
    const sessions = await UserSession.find({
      userId,
      startTime: { $gte: thirtyDaysAgo }
    });

    const avgSessionDuration = sessions.length > 0 
      ? sessions.reduce((sum, session) => sum + (session.duration || 0), 0) / sessions.length
      : 0;

    // Calculate engagement score (0-100)
    const eventTypes = [...new Set(userEvents.map(e => e.eventType))];
    const uniqueDays = [...new Set(userEvents.map(e => e.timestamp.toDateString()))];
    const engagementScore = Math.min(100, 
      (eventTypes.length * 10) + 
      (uniqueDays.length * 2) + 
      (sessions.length * 5)
    );

    // Determine preferred time of day
    const hourCounts = {};
    userEvents.forEach(event => {
      const hour = event.timestamp.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const preferredHour = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '12';
    
    const preferredTimeOfDay = getTimeOfDayCategory(parseInt(preferredHour));

    // Calculate completion rates
    const quizStarts = userEvents.filter(e => e.eventType === 'quiz_start').length;
    const quizCompletions = userEvents.filter(e => e.eventType === 'quiz_complete').length;
    const completionRate = quizStarts > 0 ? Math.round((quizCompletions / quizStarts) * 100) : 0;

    // Calculate learning streak
    const learningStreak = calculateLearningStreak(userEvents);

    const insights = {
      favoriteFeatures,
      avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
      totalSessions: sessions.length,
      preferredTimeOfDay,
      learningStreak,
      completionRate,
      engagementScore,
      learningStyle: determineLearningStyle(userEvents),
      improvementAreas: determineImprovementAreas(userEvents)
    };

    // Save insights
    const behaviorInsights = await UserBehavior.findOneAndUpdate(
      { userId },
      { 
        insights,
        lastCalculated: new Date()
      },
      { upsert: true, new: true }
    );

    return behaviorInsights;

  } catch (error) {
    console.error('Error updating user behavior insights:', error);
    throw error;
  }
};

// Helper function to get feature name from event
const getFeatureFromEvent = (event) => {
  switch (event.eventType) {
    case 'chatbot_interaction':
      return event.metadata.chatbotType || 'chatbot';
    case 'quiz_start':
    case 'quiz_complete':
      return 'quiz';
    case 'lesson_start':
    case 'lesson_complete':
      return 'lesson';
    case 'ai_request':
      return event.metadata.aiService || 'ai_service';
    case 'page_view':
      return event.metadata.page || 'navigation';
    default:
      return event.eventType;
  }
};

// Helper function to categorize time of day
const getTimeOfDayCategory = (hour) => {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

// Calculate learning streak
const calculateLearningStreak = (events) => {
  const learningEvents = events.filter(e => 
    ['quiz_complete', 'lesson_complete', 'chatbot_interaction'].includes(e.eventType)
  );

  if (learningEvents.length === 0) return 0;

  // Group events by date
  const eventsByDate = {};
  learningEvents.forEach(event => {
    const date = event.timestamp.toDateString();
    eventsByDate[date] = true;
  });

  const dates = Object.keys(eventsByDate).sort((a, b) => new Date(b) - new Date(a));
  
  let streak = 0;
  let currentDate = new Date();
  
  for (const dateStr of dates) {
    const eventDate = new Date(dateStr);
    const diffInDays = Math.floor((currentDate - eventDate) / (24 * 60 * 60 * 1000));
    
    if (diffInDays <= streak + 1) {
      streak++;
      currentDate = eventDate;
    } else {
      break;
    }
  }
  
  return streak;
};

// Determine learning style based on interactions
const determineLearningStyle = (events) => {
  const visualEvents = events.filter(e => 
    e.metadata.page?.includes('diagram') || 
    e.metadata.chatbotType?.includes('visual')
  ).length;
  
  const auditoryEvents = events.filter(e => 
    e.metadata.chatbotType?.includes('audio') ||
    e.metadata.feature?.includes('listen')
  ).length;
  
  const kinestheticEvents = events.filter(e => 
    e.eventType === 'quiz_complete' ||
    e.metadata.feature?.includes('interactive')
  ).length;

  const max = Math.max(visualEvents, auditoryEvents, kinestheticEvents);
  
  if (max === visualEvents) return 'visual';
  if (max === auditoryEvents) return 'auditory';
  return 'kinesthetic';
};

// Determine improvement areas
const determineImprovementAreas = (events) => {
  const quizEvents = events.filter(e => e.eventType === 'quiz_complete');
  const areas = {};
  
  quizEvents.forEach(event => {
    const subject = event.metadata.subject || 'general';
    const score = event.metadata.score || 0;
    
    if (!areas[subject]) {
      areas[subject] = { total: 0, count: 0 };
    }
    
    areas[subject].total += score;
    areas[subject].count += 1;
  });

  // Find subjects with average score < 70%
  const improvementAreas = Object.entries(areas)
    .filter(([, data]) => (data.total / data.count) < 70)
    .sort(([,a], [,b]) => (a.total/a.count) - (b.total/b.count))
    .slice(0, 3)
    .map(([subject]) => subject);

  return improvementAreas.length > 0 ? improvementAreas : ['practice', 'focus'];
};

// Clean old analytics data
const cleanOldAnalyticsData = async () => {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    // Remove old events (handled by TTL index, but explicit cleanup)
    await AnalyticsEvent.deleteMany({
      timestamp: { $lt: ninetyDaysAgo }
    });

    // Remove old sessions
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await UserSession.deleteMany({
      startTime: { $lt: thirtyDaysAgo }
    });

    console.log('Old analytics data cleaned successfully');
  } catch (error) {
    console.error('Error cleaning old analytics data:', error);
  }
};

module.exports = {
  calculateDailyMetrics,
  updateRealtimeMetrics,
  calculateRetentionForDate,
  updateUserBehaviorInsights,
  cleanOldAnalyticsData
};