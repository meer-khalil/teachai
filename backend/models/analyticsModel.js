const mongoose = require('mongoose');

// Analytics Event Schema
const analyticsEventSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    enum: [
      'user_login',
      'user_logout', 
      'user_registration',
      'page_view',
      'chatbot_interaction',
      'quiz_start',
      'quiz_complete',
      'lesson_start',
      'lesson_complete',
      'ai_request',
      'file_upload',
      'error_occurred'
    ]
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.eventType !== 'page_view';
    }
  },
  sessionId: {
    type: String,
    required: true
  },
  metadata: {
    // Flexible object to store event-specific data
    page: String,
    chatbotType: String,
    quizId: String,
    lessonId: String,
    aiService: String,
    errorType: String,
    duration: Number,
    score: Number,
    userAgent: String,
    ipAddress: String,
    location: {
      country: String,
      city: String,
      coordinates: [Number]
    }
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '90d' // Auto-delete after 90 days
  }
});

// Indexes for efficient queries
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ sessionId: 1, timestamp: -1 });

// User Session Schema
const userSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  duration: Number, // in seconds
  pageViews: Number,
  interactions: Number,
  deviceInfo: {
    type: String,
    browser: String,
    os: String,
    screenResolution: String
  },
  location: {
    country: String,
    city: String,
    coordinates: [Number]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d'
  }
});

userSessionSchema.index({ userId: 1, startTime: -1 });
userSessionSchema.index({ sessionId: 1 });

// Daily Metrics Aggregation Schema
const dailyMetricsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  metrics: {
    totalUsers: Number,
    activeUsers: Number,
    newRegistrations: Number,
    totalSessions: Number,
    avgSessionDuration: Number,
    pageViews: Number,
    chatbotInteractions: Number,
    quizzesCompleted: Number,
    lessonsCompleted: Number,
    aiRequests: Number,
    errors: Number,
    avgQuizScore: Number
  },
  topPages: [{
    page: String,
    views: Number
  }],
  topChatbots: [{
    chatbotType: String,
    interactions: Number
  }],
  userRetention: {
    day1: Number,
    day7: Number,
    day30: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

dailyMetricsSchema.index({ date: -1 });

// Real-time Metrics Schema (for current statistics)
const realtimeMetricsSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: 'realtime'
  },
  activeUsers: Number,
  activeSessions: Number,
  recentEvents: [{
    eventType: String,
    userId: String,
    timestamp: Date,
    metadata: Object
  }],
  systemHealth: {
    cpuUsage: Number,
    memoryUsage: Number,
    activeConnections: Number,
    errorRate: Number,
    avgResponseTime: Number
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Performance Metrics Schema
const performanceMetricsSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  endpoint: String,
  method: String,
  responseTime: Number,
  statusCode: Number,
  userAgent: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  errorMessage: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d'
  }
});

performanceMetricsSchema.index({ endpoint: 1, timestamp: -1 });
performanceMetricsSchema.index({ timestamp: -1 });

// User Behavior Insights Schema
const userBehaviorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  insights: {
    favoriteFeatures: [String],
    avgSessionDuration: Number,
    totalSessions: Number,
    preferredTimeOfDay: String, // morning, afternoon, evening, night
    learningStreak: Number,
    completionRate: Number,
    engagementScore: Number, // 0-100
    learningStyle: String, // visual, auditory, kinesthetic
    improvementAreas: [String]
  },
  lastCalculated: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

userBehaviorSchema.index({ userId: 1 });
userBehaviorSchema.index({ 'insights.engagementScore': -1 });

module.exports = {
  AnalyticsEvent: mongoose.model('AnalyticsEvent', analyticsEventSchema),
  UserSession: mongoose.model('UserSession', userSessionSchema),
  DailyMetrics: mongoose.model('DailyMetrics', dailyMetricsSchema),
  RealtimeMetrics: mongoose.model('RealtimeMetrics', realtimeMetricsSchema),
  PerformanceMetrics: mongoose.model('PerformanceMetrics', performanceMetricsSchema),
  UserBehavior: mongoose.model('UserBehavior', userBehaviorSchema)
};