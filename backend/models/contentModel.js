const mongoose = require('mongoose');

// Content Version Schema for tracking revisions
const contentVersionSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  versionNumber: {
    type: Number,
    required: true,
    min: 1
  },
  changes: {
    type: String, // Summary of changes made
    maxlength: 500
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    wordCount: Number,
    characterCount: Number,
    readingTime: Number, // in minutes
    lastModified: Date
  }
});

// Content Template Schema
const contentTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    maxlength: 100,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['post', 'story', 'course', 'lesson', 'assignment', 'quiz', 'announcement', 'page'],
    default: 'post'
  },
  template: {
    type: String, // HTML/JSON template structure
    required: true
  },
  fields: [{
    name: String,
    type: {
      type: String,
      enum: ['text', 'textarea', 'rich-text', 'image', 'video', 'file', 'select', 'checkbox', 'radio', 'date', 'number']
    },
    label: String,
    placeholder: String,
    required: Boolean,
    options: [String], // For select, radio, checkbox
    validation: {
      minLength: Number,
      maxLength: Number,
      pattern: String,
      min: Number,
      max: Number
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  usage: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Main Content Model
const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Content title is required'],
    maxlength: 200,
    trim: true,
    index: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  content: {
    type: String,
    required: [true, 'Content body is required']
  },
  contentType: {
    type: String,
    required: true,
    enum: ['post', 'story', 'course', 'lesson', 'assignment', 'quiz', 'announcement', 'page'],
    default: 'post',
    index: true
  },
  format: {
    type: String,
    enum: ['html', 'markdown', 'draft-js', 'plain-text'],
    default: 'html'
  },
  
  // Content Management
  status: {
    type: String,
    enum: ['draft', 'pending-review', 'in-review', 'approved', 'published', 'archived', 'rejected'],
    default: 'draft',
    index: true
  },
  publishedAt: {
    type: Date,
    index: true
  },
  scheduledPublishAt: {
    type: Date,
    index: true
  },
  
  // Workflow & Approval
  workflow: {
    currentStep: {
      type: String,
      enum: ['creation', 'editing', 'review', 'approval', 'publishing'],
      default: 'creation'
    },
    approvalRequired: {
      type: Boolean,
      default: false
    },
    approvers: [{
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      approved: {
        type: Boolean,
        default: false
      },
      approvedAt: Date,
      comments: String
    }],
    reviewers: [{
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'changes-requested']
      },
      feedback: String,
      reviewedAt: Date
    }]
  },
  
  // Versioning
  currentVersion: {
    type: Number,
    default: 1,
    min: 1
  },
  versions: [contentVersionSchema],
  
  // SEO & Meta
  seo: {
    metaTitle: {
      type: String,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    metaKeywords: [String],
    canonicalUrl: String,
    ogImage: String,
    ogTitle: String,
    ogDescription: String,
    schemaMarkup: mongoose.Schema.Types.Mixed
  },
  
  // Content Organization
  categories: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    index: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    index: true
  }],
  
  // Access Control
  visibility: {
    type: String,
    enum: ['public', 'private', 'restricted', 'password-protected'],
    default: 'public',
    index: true
  },
  accessPassword: String,
  allowedUsers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  allowedRoles: [String],
  
  // Content Metadata
  metadata: {
    wordCount: {
      type: Number,
      default: 0
    },
    characterCount: {
      type: Number,
      default: 0
    },
    readingTime: {
      type: Number,
      default: 0
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      index: true
    },
    estimatedDuration: Number, // in minutes
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Media & Assets
  featuredImage: {
    url: String,
    alt: String,
    caption: String
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'embed']
    },
    url: String,
    title: String,
    description: String,
    thumbnail: String,
    size: Number,
    duration: Number, // for video/audio
    dimensions: {
      width: Number,
      height: Number
    }
  }],
  
  // Analytics & Engagement
  stats: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    },
    bookmarks: {
      type: Number,
      default: 0
    },
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      count: {
        type: Number,
        default: 0
      }
    },
    engagement: {
      type: Number,
      default: 0
    }
  },
  
  // Relationships
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['editor', 'reviewer', 'contributor', 'viewer'],
      default: 'contributor'
    },
    permissions: {
      canEdit: {
        type: Boolean,
        default: false
      },
      canReview: {
        type: Boolean,
        default: false
      },
      canPublish: {
        type: Boolean,
        default: false
      },
      canDelete: {
        type: Boolean,
        default: false
      }
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Related Content
  relatedContent: [{
    content: {
      type: mongoose.Schema.ObjectId,
      ref: 'Content'
    },
    relation: {
      type: String,
      enum: ['prerequisite', 'continuation', 'related', 'reference', 'inspiration']
    }
  }],
  
  // Template Information
  template: {
    type: mongoose.Schema.ObjectId,
    ref: 'ContentTemplate'
  },
  customFields: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastEditedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  lastEditedAt: Date
});

// Indexes for better query performance
contentSchema.index({ title: 'text', content: 'text', 'seo.metaDescription': 'text' });
contentSchema.index({ author: 1, status: 1, createdAt: -1 });
contentSchema.index({ contentType: 1, status: 1, publishedAt: -1 });
contentSchema.index({ tags: 1, status: 1 });
contentSchema.index({ categories: 1, status: 1 });
contentSchema.index({ 'workflow.currentStep': 1, status: 1 });
contentSchema.index({ slug: 1 }, { unique: true });

// Pre-save middleware
contentSchema.pre('save', async function(next) {
  // Generate slug if not provided
  if (!this.slug && this.title) {
    const slugify = require('slugify');
    let baseSlug = slugify(this.title, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;
    
    // Ensure unique slug
    while (await mongoose.model('Content').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
  
  // Update metadata
  if (this.content) {
    const stripHtml = (html) => html.replace(/<[^>]*>/g, '');
    const plainText = stripHtml(this.content);
    
    this.metadata.characterCount = plainText.length;
    this.metadata.wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
    this.metadata.readingTime = Math.ceil(this.metadata.wordCount / 200); // Average reading speed
  }
  
  // Update timestamps
  if (this.isModified() && !this.isNew) {
    this.updatedAt = new Date();
    this.lastEditedAt = new Date();
  }
  
  // Handle publishing
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Methods
contentSchema.methods.addVersion = function(content, author, changes = '') {
  const newVersion = {
    content,
    versionNumber: this.currentVersion + 1,
    changes,
    author,
    metadata: {
      wordCount: this.metadata.wordCount,
      characterCount: this.metadata.characterCount,
      readingTime: this.metadata.readingTime,
      lastModified: new Date()
    }
  };
  
  this.versions.push(newVersion);
  this.currentVersion = newVersion.versionNumber;
  this.content = content;
  
  return newVersion;
};

contentSchema.methods.revertToVersion = function(versionNumber) {
  const version = this.versions.find(v => v.versionNumber === versionNumber);
  if (!version) {
    throw new Error('Version not found');
  }
  
  this.content = version.content;
  // Don't change version history, just current content
  
  return version;
};

contentSchema.methods.getVersionDiff = function(versionA, versionB) {
  const DiffMatchPatch = require('diff-match-patch');
  const dmp = new DiffMatchPatch();
  
  const contentA = versionA === 'current' ? this.content : 
    this.versions.find(v => v.versionNumber === versionA)?.content;
  const contentB = versionB === 'current' ? this.content : 
    this.versions.find(v => v.versionNumber === versionB)?.content;
  
  if (!contentA || !contentB) {
    throw new Error('Version not found');
  }
  
  const diff = dmp.diff_main(contentA, contentB);
  dmp.diff_cleanupSemantic(diff);
  
  return diff;
};

contentSchema.methods.canUserEdit = function(user) {
  if (!user) return false;
  
  // Author can always edit
  if (this.author.toString() === user._id.toString()) return true;
  
  // Check collaborators
  const collaborator = this.collaborators.find(c => c.user.toString() === user._id.toString());
  if (collaborator) {
    return collaborator.permissions.canEdit;
  }
  
  // Check admin/moderator roles
  return user.role === 'admin' || user.role === 'moderator';
};

contentSchema.methods.canUserPublish = function(user) {
  if (!user) return false;
  
  // Author can publish if no approval required
  if (this.author.toString() === user._id.toString() && !this.workflow.approvalRequired) {
    return true;
  }
  
  // Check collaborators
  const collaborator = this.collaborators.find(c => c.user.toString() === user._id.toString());
  if (collaborator) {
    return collaborator.permissions.canPublish;
  }
  
  // Check admin/moderator roles
  return user.role === 'admin' || user.role === 'moderator';
};

// Statics
contentSchema.statics.getContentBySlug = function(slug) {
  return this.findOne({ slug, status: 'published' })
    .populate('author', 'name avatar email')
    .populate('categories', 'name slug description')
    .populate('collaborators.user', 'name avatar');
};

contentSchema.statics.getContentForEdit = function(id, user) {
  return this.findById(id)
    .populate('author', 'name avatar email')
    .populate('categories', 'name slug description')
    .populate('collaborators.user', 'name avatar')
    .populate('versions.author', 'name avatar')
    .then(content => {
      if (!content) throw new Error('Content not found');
      if (!content.canUserEdit(user)) throw new Error('Access denied');
      return content;
    });
};

// Template Schema Indexes
contentTemplateSchema.index({ category: 1, isPublic: 1 });
contentTemplateSchema.index({ author: 1, createdAt: -1 });
contentTemplateSchema.index({ name: 'text', description: 'text' });

// Export models
const Content = mongoose.model('Content', contentSchema);
const ContentTemplate = mongoose.model('ContentTemplate', contentTemplateSchema);

module.exports = {
  Content,
  ContentTemplate
};