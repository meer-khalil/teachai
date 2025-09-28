const mongoose = require('mongoose');

const searchAnalyticsSchema = new mongoose.Schema({
  // Search query details
  query: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Search query is too long']
  },
  
  // Search type (posts, stories, users, etc.)
  type: {
    type: String,
    enum: ['posts', 'stories', 'users', 'courses', 'comments', 'all'],
    default: 'all'
  },
  
  // Applied filters
  filters: {
    type: Object,
    default: {}
  },
  
  // User who performed the search
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Session identifier
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  
  // Search results metadata
  resultsCount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Search performance
  searchTime: {
    type: Number, // milliseconds
    required: true,
    min: 0
  },
  
  // Click-through data
  clickThroughRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 1
  },
  
  // Results that were clicked
  clickedResults: [{
    resultId: String,
    resultType: String,
    position: Number, // Position in search results
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Search refinements
  refinements: [{
    action: {
      type: String,
      enum: ['filter_added', 'filter_removed', 'query_modified', 'sort_changed']
    },
    details: Object,
    timestamp: { type: Date, default: Date.now }
  }],
  
  // Geographic data (if available)
  location: {
    country: String,
    region: String,
    city: String
  },
  
  // Device/browser info
  userAgent: String,
  deviceType: {
    type: String,
    enum: ['desktop', 'tablet', 'mobile', 'unknown'],
    default: 'unknown'
  },
  
  // Search source
  source: {
    type: String,
    enum: ['search_bar', 'advanced_search', 'suggestion', 'similar_content'],
    default: 'search_bar'
  },
  
  // Whether search used fallback (no Elasticsearch)
  fallback: {
    type: Boolean,
    default: false
  },
  
  // Search timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true,
  collection: 'searchanalytics'
});

// Indexes for better query performance
searchAnalyticsSchema.index({ query: 1, timestamp: -1 });
searchAnalyticsSchema.index({ userId: 1, timestamp: -1 });
searchAnalyticsSchema.index({ sessionId: 1, timestamp: -1 });
searchAnalyticsSchema.index({ type: 1, timestamp: -1 });
searchAnalyticsSchema.index({ resultsCount: 1 });
searchAnalyticsSchema.index({ timestamp: -1 });

// Compound indexes for analytics queries
searchAnalyticsSchema.index({ 
  timestamp: -1, 
  type: 1, 
  resultsCount: 1 
});

// TTL index to automatically remove old analytics data after 6 months
searchAnalyticsSchema.index({ 
  timestamp: 1 
}, { 
  expireAfterSeconds: 15552000 // 6 months in seconds
});

// Static methods for analytics
searchAnalyticsSchema.statics.getPopularQueries = async function(timeframe = '7d', limit = 20) {
  const startDate = new Date();
  
  switch (timeframe) {
    case '1d':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        query: { $ne: '' },
        resultsCount: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: '$query',
        count: { $sum: 1 },
        avgResults: { $avg: '$resultsCount' },
        avgClickThrough: { $avg: '$clickThroughRate' }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        query: '$_id',
        searchCount: '$count',
        avgResults: { $round: ['$avgResults', 2] },
        avgClickThrough: { $round: ['$avgClickThrough', 3] },
        _id: 0
      }
    }
  ]);
};

searchAnalyticsSchema.statics.getZeroResultQueries = async function(timeframe = '7d', limit = 20) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (timeframe === '1d' ? 1 : 7));

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        resultsCount: 0,
        query: { $ne: '' }
      }
    },
    {
      $group: {
        _id: '$query',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    },
    {
      $project: {
        query: '$_id',
        searchCount: '$count',
        _id: 0
      }
    }
  ]);
};

searchAnalyticsSchema.statics.getSearchTrends = async function(timeframe = '7d', groupBy = 'hour') {
  const startDate = new Date();
  
  switch (timeframe) {
    case '1d':
      startDate.setDate(startDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  const dateFormat = groupBy === 'hour' 
    ? '%Y-%m-%d %H:00:00'
    : '%Y-%m-%d';

  return this.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: dateFormat,
            date: '$timestamp'
          }
        },
        totalSearches: { $sum: 1 },
        uniqueQueries: { $addToSet: '$query' },
        avgResults: { $avg: '$resultsCount' },
        avgResponseTime: { $avg: '$searchTime' }
      }
    },
    {
      $addFields: {
        uniqueQueryCount: { $size: '$uniqueQueries' }
      }
    },
    {
      $project: {
        date: '$_id',
        totalSearches: 1,
        uniqueQueryCount: 1,
        avgResults: { $round: ['$avgResults', 2] },
        avgResponseTime: { $round: ['$avgResponseTime', 2] },
        _id: 0
      }
    },
    {
      $sort: { date: 1 }
    }
  ]);
};

searchAnalyticsSchema.statics.getUserSearchBehavior = async function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('query type filters resultsCount clickThroughRate timestamp')
    .lean();
};

// Instance methods
searchAnalyticsSchema.methods.recordClick = function(resultId, resultType, position) {
  this.clickedResults.push({
    resultId,
    resultType,
    position,
    timestamp: new Date()
  });
  
  // Update click-through rate
  this.clickThroughRate = this.clickedResults.length > 0 ? 1 : 0;
  
  return this.save();
};

searchAnalyticsSchema.methods.addRefinement = function(action, details) {
  this.refinements.push({
    action,
    details,
    timestamp: new Date()
  });
  
  return this.save();
};

// Pre-save middleware to extract device type from user agent
searchAnalyticsSchema.pre('save', function(next) {
  if (this.userAgent && !this.deviceType) {
    const ua = this.userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      this.deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      this.deviceType = 'tablet';
    } else {
      this.deviceType = 'desktop';
    }
  }
  
  next();
});

module.exports = mongoose.model('SearchAnalytics', searchAnalyticsSchema);