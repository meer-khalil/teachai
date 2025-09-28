const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema({
  // User who saved the search
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Search name/title
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Search name is too long']
  },
  
  // Search query
  query: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Search query is too long']
  },
  
  // Search type
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
  
  // Sort configuration
  sort: {
    field: {
      type: String,
      default: 'relevance'
    },
    order: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'desc'
    }
  },
  
  // Whether search is public (shareable)
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Search description
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description is too long']
  },
  
  // Tags for organizing searches
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Usage statistics
  useCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Last time search was used
  lastUsed: {
    type: Date,
    default: Date.now
  },
  
  // Alert settings
  alerts: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['immediate', 'daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    lastAlertSent: {
      type: Date,
      default: null
    },
    newResultsThreshold: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  
  // Sharing settings
  sharing: {
    shareCode: {
      type: String,
      unique: true,
      sparse: true
    },
    sharedWith: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permission: {
        type: String,
        enum: ['view', 'edit'],
        default: 'view'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true,
  collection: 'savedsearches'
});

// Indexes for better performance
savedSearchSchema.index({ userId: 1, createdAt: -1 });
savedSearchSchema.index({ userId: 1, lastUsed: -1 });
savedSearchSchema.index({ isPublic: 1, createdAt: -1 });
savedSearchSchema.index({ tags: 1 });
savedSearchSchema.index({ 'sharing.shareCode': 1 });

// Text index for searching saved searches
savedSearchSchema.index({
  name: 'text',
  query: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for formatted filters
savedSearchSchema.virtual('formattedFilters').get(function() {
  const filters = this.filters || {};
  const formatted = [];
  
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      formatted.push(`${key}: ${value.join(', ')}`);
    } else if (typeof value === 'object') {
      if (value.min !== undefined || value.max !== undefined) {
        const range = [];
        if (value.min !== undefined) range.push(`>= ${value.min}`);
        if (value.max !== undefined) range.push(`<= ${value.max}`);
        formatted.push(`${key}: ${range.join(' and ')}`);
      }
    } else {
      formatted.push(`${key}: ${value}`);
    }
  });
  
  return formatted;
});

// Virtual for search URL
savedSearchSchema.virtual('searchUrl').get(function() {
  const params = new URLSearchParams({
    q: this.query,
    type: this.type,
    sort: this.sort.field,
    order: this.sort.order
  });
  
  // Add filters as query parameters
  Object.entries(this.filters || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      params.append(key, value.join(','));
    } else {
      params.append(key, value);
    }
  });
  
  return `/search?${params.toString()}`;
});

// Static methods
savedSearchSchema.statics.findByUser = function(userId, options = {}) {
  const {
    limit = 50,
    skip = 0,
    sort = { lastUsed: -1 },
    includePublic = false
  } = options;
  
  const query = includePublic 
    ? { $or: [{ userId }, { isPublic: true }] }
    : { userId };
  
  return this.find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name email')
    .lean();
};

savedSearchSchema.statics.findPublic = function(options = {}) {
  const {
    limit = 20,
    skip = 0,
    sort = { useCount: -1, createdAt: -1 }
  } = options;
  
  return this.find({ isPublic: true })
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('userId', 'name')
    .select('-sharing')
    .lean();
};

savedSearchSchema.statics.findByShareCode = function(shareCode) {
  return this.findOne({ 'sharing.shareCode': shareCode })
    .populate('userId', 'name email')
    .lean();
};

savedSearchSchema.statics.searchSavedSearches = function(userId, searchQuery, options = {}) {
  const {
    limit = 20,
    skip = 0
  } = options;
  
  return this.find({
    userId,
    $text: { $search: searchQuery }
  }, {
    score: { $meta: 'textScore' }
  })
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit)
  .skip(skip)
  .lean();
};

// Instance methods
savedSearchSchema.methods.incrementUseCount = function() {
  this.useCount += 1;
  this.lastUsed = new Date();
  return this.save();
};

savedSearchSchema.methods.generateShareCode = function() {
  if (!this.sharing.shareCode) {
    this.sharing.shareCode = require('crypto')
      .randomBytes(16)
      .toString('hex');
  }
  return this.sharing.shareCode;
};

savedSearchSchema.methods.shareWith = function(userId, permission = 'view') {
  // Remove existing sharing with this user
  this.sharing.sharedWith = this.sharing.sharedWith.filter(
    share => !share.userId.equals(userId)
  );
  
  // Add new sharing
  this.sharing.sharedWith.push({
    userId,
    permission,
    sharedAt: new Date()
  });
  
  return this.save();
};

savedSearchSchema.methods.unshareWith = function(userId) {
  this.sharing.sharedWith = this.sharing.sharedWith.filter(
    share => !share.userId.equals(userId)
  );
  
  return this.save();
};

savedSearchSchema.methods.canAccess = function(userId) {
  // Owner can always access
  if (this.userId.equals(userId)) {
    return 'owner';
  }
  
  // Check if public
  if (this.isPublic) {
    return 'public';
  }
  
  // Check if shared
  const sharing = this.sharing.sharedWith.find(
    share => share.userId.equals(userId)
  );
  
  if (sharing) {
    return sharing.permission;
  }
  
  return null;
};

savedSearchSchema.methods.canEdit = function(userId) {
  const access = this.canAccess(userId);
  return access === 'owner' || access === 'edit';
};

// Pre-save middleware
savedSearchSchema.pre('save', function(next) {
  // Ensure share code is generated for public searches
  if (this.isPublic && !this.sharing.shareCode) {
    this.generateShareCode();
  }
  
  // Clean up empty filters
  if (this.filters && typeof this.filters === 'object') {
    Object.keys(this.filters).forEach(key => {
      if (this.filters[key] === null || 
          this.filters[key] === undefined || 
          this.filters[key] === '' ||
          (Array.isArray(this.filters[key]) && this.filters[key].length === 0)) {
        delete this.filters[key];
      }
    });
  }
  
  next();
});

// Post-save middleware to update user's saved search count
savedSearchSchema.post('save', async function(doc) {
  try {
    const User = mongoose.model('User');
    await User.updateOne(
      { _id: doc.userId },
      { $inc: { 'stats.savedSearches': 1 } }
    );
  } catch (error) {
    console.error('Error updating user saved search count:', error);
  }
});

module.exports = mongoose.model('SavedSearch', savedSearchSchema);