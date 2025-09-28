const mongoose = require('mongoose');

// Translation schema for storing dynamic content translations
const translationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    index: true
  },
  namespace: {
    type: String,
    default: 'common',
    index: true
  },
  translations: {
    type: Map,
    of: String,
    required: true
  },
  context: {
    type: String,
    default: ''
  },
  interpolation: {
    type: Map,
    of: String,
    default: new Map()
  },
  pluralization: {
    type: Map,
    of: {
      zero: String,
      one: String,
      two: String,
      few: String,
      many: String,
      other: String
    },
    default: new Map()
  },
  metadata: {
    description: String,
    maxLength: Number,
    category: String,
    tags: [String]
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'deprecated'],
    default: 'draft'
  },
  version: {
    type: Number,
    default: 1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Content localization schema for user-generated content
const contentLocalizationSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  contentType: {
    type: String,
    required: true,
    enum: ['lesson', 'quiz', 'post', 'story', 'comment', 'announcement']
  },
  originalLanguage: {
    type: String,
    required: true,
    default: 'en'
  },
  localizedVersions: {
    type: Map,
    of: {
      title: String,
      content: String,
      description: String,
      tags: [String],
      metadata: mongoose.Schema.Types.Mixed,
      translatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      translationMethod: {
        type: String,
        enum: ['manual', 'ai', 'mixed'],
        default: 'manual'
      },
      quality: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      reviewStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'needs_revision'],
        default: 'pending'
      },
      translatedAt: {
        type: Date,
        default: Date.now
      },
      lastReviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  },
  isAutoTranslationEnabled: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Language preference schema for users
const languagePreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  preferredLanguage: {
    type: String,
    required: true,
    default: 'en'
  },
  fallbackLanguages: [{
    type: String
  }],
  autoDetect: {
    type: Boolean,
    default: true
  },
  dateFormat: {
    type: String,
    default: 'auto'
  },
  numberFormat: {
    type: String,
    default: 'auto'
  },
  timezone: {
    type: String,
    default: 'auto'
  },
  contentLanguagePreferences: [{
    contentType: String,
    preferredLanguage: String
  }],
  translationSettings: {
    autoTranslate: {
      type: Boolean,
      default: false
    },
    showOriginal: {
      type: Boolean,
      default: true
    },
    translationQuality: {
      type: String,
      enum: ['fast', 'balanced', 'accurate'],
      default: 'balanced'
    }
  }
}, {
  timestamps: true
});

// Translation request schema for managing translation workflows
const translationRequestSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  contentType: {
    type: String,
    required: true
  },
  sourceLanguage: {
    type: String,
    required: true
  },
  targetLanguage: {
    type: String,
    required: true
  },
  requestType: {
    type: String,
    enum: ['new', 'update', 'review'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled', 'failed'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deadline: Date,
  estimatedCost: Number,
  actualCost: Number,
  notes: String,
  translationMethod: {
    type: String,
    enum: ['human', 'ai', 'hybrid'],
    default: 'ai'
  },
  qualityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: String,
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
translationSchema.index({ key: 1, namespace: 1 }, { unique: true });
translationSchema.index({ status: 1, namespace: 1 });
translationSchema.index({ 'metadata.category': 1 });

contentLocalizationSchema.index({ contentId: 1, contentType: 1 });
contentLocalizationSchema.index({ originalLanguage: 1 });
contentLocalizationSchema.index({ 'localizedVersions.reviewStatus': 1 });

languagePreferenceSchema.index({ preferredLanguage: 1 });

translationRequestSchema.index({ status: 1, priority: 1 });
translationRequestSchema.index({ assignedTo: 1, status: 1 });
translationRequestSchema.index({ targetLanguage: 1, status: 1 });

// Methods for Translation model
translationSchema.methods.addTranslation = function(language, text) {
  this.translations.set(language, text);
  return this.save();
};

translationSchema.methods.getTranslation = function(language, fallback = 'en') {
  return this.translations.get(language) || this.translations.get(fallback) || '';
};

translationSchema.methods.removeTranslation = function(language) {
  this.translations.delete(language);
  return this.save();
};

translationSchema.methods.getAllLanguages = function() {
  return Array.from(this.translations.keys());
};

// Methods for ContentLocalization model
contentLocalizationSchema.methods.addLocalizedVersion = function(language, data) {
  this.localizedVersions.set(language, {
    ...data,
    translatedAt: new Date()
  });
  return this.save();
};

contentLocalizationSchema.methods.getLocalizedContent = function(language) {
  return this.localizedVersions.get(language);
};

contentLocalizationSchema.methods.isTranslated = function(language) {
  return this.localizedVersions.has(language);
};

contentLocalizationSchema.methods.getAvailableLanguages = function() {
  return Array.from(this.localizedVersions.keys());
};

contentLocalizationSchema.methods.getTranslationStatus = function(language) {
  const version = this.localizedVersions.get(language);
  return version ? version.reviewStatus : 'not_translated';
};

// Static methods for Translation model
translationSchema.statics.findByNamespace = function(namespace) {
  return this.find({ namespace });
};

translationSchema.statics.findByKey = function(key, namespace = 'common') {
  return this.findOne({ key, namespace });
};

translationSchema.statics.getTranslationsForLanguage = function(language, namespace) {
  const query = namespace ? { namespace } : {};
  return this.find(query).then(translations => {
    const result = {};
    translations.forEach(t => {
      const translation = t.getTranslation(language);
      if (translation) {
        result[t.key] = translation;
      }
    });
    return result;
  });
};

// Static methods for ContentLocalization model
contentLocalizationSchema.statics.findByContentAndType = function(contentId, contentType) {
  return this.findOne({ contentId, contentType });
};

contentLocalizationSchema.statics.findByLanguage = function(language) {
  return this.find({ [`localizedVersions.${language}`]: { $exists: true } });
};

contentLocalizationSchema.statics.getPendingTranslations = function(language) {
  return this.find({ 
    [`localizedVersions.${language}.reviewStatus`]: 'pending' 
  });
};

// Models
const Translation = mongoose.model('Translation', translationSchema);
const ContentLocalization = mongoose.model('ContentLocalization', contentLocalizationSchema);
const LanguagePreference = mongoose.model('LanguagePreference', languagePreferenceSchema);
const TranslationRequest = mongoose.model('TranslationRequest', translationRequestSchema);

module.exports = {
  Translation,
  ContentLocalization,
  LanguagePreference,
  TranslationRequest
};