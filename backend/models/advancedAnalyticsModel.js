const mongoose = require('mongoose');

// User Analytics Schema
const userAnalyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true
  },
  // Session Information
  sessionData: {
    startTime: {
      type: Date,
      required: true,
      default: Date.now
    },
    endTime: Date,
    duration: {
      type: Number, // in milliseconds
      default: 0
    },
    device: {
      type: {
        type: String,
        enum: ['desktop', 'tablet', 'mobile'],
        default: 'desktop'
      },
      browser: String,
      os: String,
      screenResolution: String,
      userAgent: String
    },
    location: {
      country: String,
      region: String,
      city: String,
      timezone: String,
      ip: String
    }
  },
  // User Behavior
  interactions: [{
    type: {
      type: String,
      enum: [
        'page_view', 'click', 'scroll', 'input', 'search', 
        'content_create', 'content_edit', 'content_publish', 'content_share',
        'comment_add', 'comment_reply', 'collaboration_join', 'file_upload',
        'ai_query', 'lesson_generate', 'quiz_attempt', 'presentation_create'
      ],
      required: true
    },
    element: String, // CSS selector or element ID
    page: String, // Current page/route
    content: String, // Related content ID
    metadata: mongoose.Schema.Types.Mixed, // Additional data
    timestamp: {
      type: Date,
      default: Date.now
    },
    duration: Number // Time spent on action
  }],
  // Performance Metrics
  performance: {
    pageLoadTime: Number,
    timeToInteractive: Number,
    bounceRate: Boolean,
    pagesPerSession: {
      type: Number,
      default: 1
    },
    averageSessionDuration: Number,
    returnVisitor: {
      type: Boolean,
      default: false
    }
  },
  // Engagement Metrics
  engagement: {
    activeTime: {
      type: Number, // Active time in milliseconds
      default: 0
    },
    scrollDepth: {
      type: Number, // Percentage scrolled
      min: 0,
      max: 100,
      default: 0
    },
    clickCount: {
      type: Number,
      default: 0
    },
    keystrokes: {
      type: Number,
      default: 0
    },
    contentInteractions: {
      created: { type: Number, default: 0 },
      edited: { type: Number, default: 0 },
      published: { type: Number, default: 0 },
      shared: { type: Number, default: 0 }
    },
    aiInteractions: {
      queries: { type: Number, default: 0 },
      lessonsGenerated: { type: Number, default: 0 },
      quizzesTaken: { type: Number, default: 0 },
      presentationsCreated: { type: Number, default: 0 }
    }
  },
  // Feature Usage
  featureUsage: {
    contentManagement: {
      used: { type: Boolean, default: false },
      frequency: { type: Number, default: 0 },
      lastUsed: Date
    },
    collaboration: {
      used: { type: Boolean, default: false },
      frequency: { type: Number, default: 0 },
      lastUsed: Date,
      sessionsJoined: { type: Number, default: 0 }
    },
    aiTools: {
      used: { type: Boolean, default: false },
      frequency: { type: Number, default: 0 },
      lastUsed: Date,
      favoriteTools: [String]
    },
    search: {
      used: { type: Boolean, default: false },
      frequency: { type: Number, default: 0 },
      lastUsed: Date,
      searchTerms: [String]
    }
  }
}, {
  timestamps: true,
  // TTL index - keep data for 1 year
  expireAfterSeconds: 31536000
});

// Content Analytics Schema
const contentAnalyticsSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: [true, 'Content ID is required'],
    index: true
  },
  contentType: {
    type: String,
    enum: ['post', 'lesson', 'quiz', 'presentation', 'story', 'content'],
    required: true
  },
  // View Metrics
  views: {
    total: { type: Number, default: 0 },
    unique: { type: Number, default: 0 },
    daily: [{ date: Date, views: Number, unique: Number }],
    byDevice: {
      desktop: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 }
    },
    byLocation: [{
      country: String,
      views: Number
    }]
  },
  // Engagement Metrics
  engagement: {
    averageTimeSpent: { type: Number, default: 0 }, // in seconds
    bounceRate: { type: Number, default: 0 }, // percentage
    scrollDepth: {
      average: { type: Number, default: 0 },
      percentiles: {
        p25: Number,
        p50: Number,
        p75: Number,
        p90: Number
      }
    },
    interactions: {
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      downloads: { type: Number, default: 0 }
    }
  },
  // Performance Metrics
  performance: {
    loadTime: {
      average: Number,
      percentiles: {
        p50: Number,
        p90: Number,
        p95: Number
      }
    },
    searchRanking: {
      position: Number,
      impressions: Number,
      clicks: Number,
      ctr: Number // Click-through rate
    }
  },
  // Collaboration Metrics
  collaboration: {
    sessions: { type: Number, default: 0 },
    participants: { type: Number, default: 0 },
    edits: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    versions: { type: Number, default: 0 }
  },
  // Conversion Metrics
  conversions: {
    signups: { type: Number, default: 0 },
    subscriptions: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    referrals: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// System Analytics Schema
const systemAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  period: {
    type: String,
    enum: ['hour', 'day', 'week', 'month'],
    required: true
  },
  // System Performance
  performance: {
    serverResponse: {
      average: Number,
      min: Number,
      max: Number,
      p95: Number
    },
    databaseQueries: {
      total: Number,
      average: Number,
      slowQueries: Number
    },
    errorRate: Number,
    uptime: Number
  },
  // User Activity
  users: {
    total: { type: Number, default: 0 },
    active: { type: Number, default: 0 },
    new: { type: Number, default: 0 },
    returning: { type: Number, default: 0 },
    churn: { type: Number, default: 0 }
  },
  // Content Metrics
  content: {
    created: { type: Number, default: 0 },
    published: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }
  },
  // Feature Usage
  features: {
    aiTools: { type: Number, default: 0 },
    collaboration: { type: Number, default: 0 },
    contentManagement: { type: Number, default: 0 },
    search: { type: Number, default: 0 }
  },
  // Revenue Metrics
  revenue: {
    total: { type: Number, default: 0 },
    subscriptions: { type: Number, default: 0 },
    oneTime: { type: Number, default: 0 },
    refunds: { type: Number, default: 0 }
  },
  // Traffic Sources
  traffic: {
    direct: { type: Number, default: 0 },
    organic: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    referral: { type: Number, default: 0 },
    email: { type: Number, default: 0 },
    paid: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Funnel Analytics Schema
const funnelAnalyticsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  description: String,
  steps: [{
    name: String,
    event: String,
    order: Number
  }],
  data: [{
    date: Date,
    stepData: [{
      step: Number,
      users: Number,
      conversions: Number,
      conversionRate: Number,
      dropoffRate: Number
    }],
    totalUsers: Number,
    finalConversions: Number,
    overallConversionRate: Number
  }],
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for performance
userAnalyticsSchema.index({ userId: 1, 'sessionData.startTime': -1 });
userAnalyticsSchema.index({ 'interactions.type': 1, 'interactions.timestamp': -1 });
userAnalyticsSchema.index({ createdAt: -1 });

contentAnalyticsSchema.index({ contentId: 1, createdAt: -1 });
contentAnalyticsSchema.index({ contentType: 1, 'views.total': -1 });

systemAnalyticsSchema.index({ date: -1, period: 1 });

funnelAnalyticsSchema.index({ name: 1, active: 1 });

// Methods
userAnalyticsSchema.methods.addInteraction = function(interactionData) {
  this.interactions.push({
    ...interactionData,
    timestamp: new Date()
  });
  
  // Update engagement metrics
  if (interactionData.type === 'click') {
    this.engagement.clickCount++;
  } else if (interactionData.type === 'input') {
    this.engagement.keystrokes++;
  }
  
  // Update feature usage
  this.updateFeatureUsage(interactionData.type);
};

userAnalyticsSchema.methods.updateFeatureUsage = function(interactionType) {
  const now = new Date();
  
  switch (interactionType) {
    case 'content_create':
    case 'content_edit':
    case 'content_publish':
      this.featureUsage.contentManagement.used = true;
      this.featureUsage.contentManagement.frequency++;
      this.featureUsage.contentManagement.lastUsed = now;
      this.engagement.contentInteractions[interactionType.split('_')[1]]++;
      break;
    case 'collaboration_join':
      this.featureUsage.collaboration.used = true;
      this.featureUsage.collaboration.frequency++;
      this.featureUsage.collaboration.lastUsed = now;
      this.featureUsage.collaboration.sessionsJoined++;
      break;
    case 'ai_query':
    case 'lesson_generate':
    case 'quiz_attempt':
    case 'presentation_create':
      this.featureUsage.aiTools.used = true;
      this.featureUsage.aiTools.frequency++;
      this.featureUsage.aiTools.lastUsed = now;
      if (interactionType === 'ai_query') this.engagement.aiInteractions.queries++;
      break;
    case 'search':
      this.featureUsage.search.used = true;
      this.featureUsage.search.frequency++;
      this.featureUsage.search.lastUsed = now;
      break;
  }
};

userAnalyticsSchema.methods.endSession = function() {
  this.sessionData.endTime = new Date();
  this.sessionData.duration = this.sessionData.endTime - this.sessionData.startTime;
  this.performance.averageSessionDuration = this.sessionData.duration;
};

contentAnalyticsSchema.statics.recordView = async function(contentId, viewerData) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let analytics = await this.findOne({ contentId });
  if (!analytics) {
    analytics = new this({ contentId, contentType: viewerData.contentType || 'content' });
  }
  
  // Update view counts
  analytics.views.total++;
  
  if (viewerData.isUnique) {
    analytics.views.unique++;
  }
  
  // Update device stats
  if (viewerData.device) {
    analytics.views.byDevice[viewerData.device]++;
  }
  
  // Update location stats
  if (viewerData.location) {
    const locationEntry = analytics.views.byLocation.find(l => l.country === viewerData.location.country);
    if (locationEntry) {
      locationEntry.views++;
    } else {
      analytics.views.byLocation.push({
        country: viewerData.location.country,
        views: 1
      });
    }
  }
  
  // Update daily stats
  const dailyEntry = analytics.views.daily.find(d => 
    d.date.toDateString() === today.toDateString()
  );
  
  if (dailyEntry) {
    dailyEntry.views++;
    if (viewerData.isUnique) dailyEntry.unique++;
  } else {
    analytics.views.daily.push({
      date: today,
      views: 1,
      unique: viewerData.isUnique ? 1 : 0
    });
  }
  
  await analytics.save();
  return analytics;
};

systemAnalyticsSchema.statics.updateMetrics = async function(period, data) {
  const date = new Date();
  if (period === 'day') date.setHours(0, 0, 0, 0);
  if (period === 'hour') date.setMinutes(0, 0, 0);
  
  let analytics = await this.findOne({ date, period });
  if (!analytics) {
    analytics = new this({ date, period });
  }
  
  // Merge data
  Object.keys(data).forEach(key => {
    if (analytics[key] && typeof analytics[key] === 'object') {
      Object.assign(analytics[key], data[key]);
    } else {
      analytics[key] = data[key];
    }
  });
  
  await analytics.save();
  return analytics;
};

const UserAnalytics = mongoose.model('UserAnalytics', userAnalyticsSchema);
const ContentAnalytics = mongoose.model('ContentAnalytics', contentAnalyticsSchema);
const SystemAnalytics = mongoose.model('SystemAnalytics', systemAnalyticsSchema);
const FunnelAnalytics = mongoose.model('FunnelAnalytics', funnelAnalyticsSchema);

module.exports = {
  UserAnalytics,
  ContentAnalytics,
  SystemAnalytics,
  FunnelAnalytics
};