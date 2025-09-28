const mongoose = require('mongoose');

// Collaboration Session Schema
const collaborationSessionSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: [true, 'Content ID is required'],
    index: true
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    unique: true,
    index: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    cursor: {
      position: { type: Number, default: 0 },
      selection: {
        start: { type: Number, default: 0 },
        end: { type: Number, default: 0 }
      },
      color: { type: String, default: '#007bff' }
    },
    permissions: {
      type: String,
      enum: ['view', 'comment', 'edit', 'admin'],
      default: 'edit'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    socketId: String
  }],
  settings: {
    maxParticipants: {
      type: Number,
      default: 10,
      max: 50
    },
    allowAnonymous: {
      type: Boolean,
      default: false
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    lockTimeout: {
      type: Number,
      default: 30000 // 30 seconds
    }
  },
  locks: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    section: {
      start: Number,
      end: Number
    },
    lockedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['active', 'paused', 'ended'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours
  }
}, {
  timestamps: true
});

// Operation Schema for real-time changes
const operationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: [true, 'Session ID is required'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  operation: {
    type: {
      type: String,
      enum: ['insert', 'delete', 'retain', 'format', 'cursor'],
      required: true
    },
    position: {
      type: Number,
      required: true
    },
    content: String,
    length: Number,
    attributes: mongoose.Schema.Types.Mixed
  },
  version: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    expires: 3600 // 1 hour
  },
  applied: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Comment Schema for collaborative comments
const collaborativeCommentSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    required: [true, 'Content ID is required'],
    index: true
  },
  sessionId: {
    type: String,
    required: [true, 'Session ID is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    maxlength: [2000, 'Comment cannot exceed 2000 characters']
  },
  position: {
    start: {
      type: Number,
      required: true
    },
    end: {
      type: Number,
      required: true
    }
  },
  thread: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    edited: {
      type: Boolean,
      default: false
    },
    editedAt: Date
  }],
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: Date,
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
collaborationSessionSchema.index({ contentId: 1, status: 1 });
collaborationSessionSchema.index({ 'participants.userId': 1 });
collaborationSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

operationSchema.index({ sessionId: 1, version: 1 });
operationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 3600 });

collaborativeCommentSchema.index({ contentId: 1, resolved: 1 });
collaborativeCommentSchema.index({ 'mentions': 1 });

// Methods
collaborationSessionSchema.methods.addParticipant = async function(userId, permissions = 'edit', socketId = null) {
  const existingParticipant = this.participants.find(p => p.userId.toString() === userId.toString());
  
  if (existingParticipant) {
    existingParticipant.lastActivity = new Date();
    existingParticipant.isActive = true;
    if (socketId) existingParticipant.socketId = socketId;
    return existingParticipant;
  }

  if (this.participants.length >= this.settings.maxParticipants) {
    throw new Error('Maximum participants reached');
  }

  const colors = ['#007bff', '#28a745', '#dc3545', '#ffc107', '#6f42c1', '#20c997', '#fd7e14', '#e83e8c'];
  const color = colors[this.participants.length % colors.length];

  this.participants.push({
    userId,
    permissions,
    socketId,
    cursor: { color }
  });

  return this.participants[this.participants.length - 1];
};

collaborationSessionSchema.methods.removeParticipant = function(userId) {
  this.participants = this.participants.filter(p => p.userId.toString() !== userId.toString());
};

collaborationSessionSchema.methods.updateCursor = function(userId, cursor) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    participant.cursor = { ...participant.cursor, ...cursor };
    participant.lastActivity = new Date();
  }
};

collaborationSessionSchema.methods.acquireLock = function(userId, section, timeout = 30000) {
  // Remove expired locks
  this.locks = this.locks.filter(lock => lock.expiresAt > new Date());

  // Check for conflicts
  const hasConflict = this.locks.some(lock => 
    (section.start < lock.section.end && section.end > lock.section.start) &&
    lock.userId.toString() !== userId.toString()
  );

  if (hasConflict) {
    throw new Error('Section is locked by another user');
  }

  // Remove existing locks by this user in this section
  this.locks = this.locks.filter(lock => 
    !(lock.userId.toString() === userId.toString() && 
      section.start < lock.section.end && section.end > lock.section.start)
  );

  // Add new lock
  this.locks.push({
    userId,
    section,
    expiresAt: new Date(Date.now() + timeout)
  });
};

collaborationSessionSchema.methods.releaseLock = function(userId, section) {
  this.locks = this.locks.filter(lock => 
    !(lock.userId.toString() === userId.toString() && 
      section.start === lock.section.start && section.end === lock.section.end)
  );
};

// Static methods
collaborationSessionSchema.statics.createSession = async function(contentId, ownerId, settings = {}) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const session = new this({
    contentId,
    sessionId,
    owner: ownerId,
    settings: { ...this.schema.paths.settings.defaultValue, ...settings }
  });

  await session.addParticipant(ownerId, 'admin');
  return await session.save();
};

collaborationSessionSchema.statics.findActiveSession = async function(contentId) {
  return await this.findOne({ 
    contentId, 
    status: 'active' 
  }).populate('participants.userId', 'name email avatar');
};

operationSchema.statics.applyOperations = async function(sessionId, operations) {
  const session = await mongoose.model('CollaborationSession').findOne({ sessionId });
  if (!session) throw new Error('Session not found');

  // Sort operations by version
  const sortedOps = operations.sort((a, b) => a.version - b.version);
  
  // Apply operations and mark as applied
  for (const op of sortedOps) {
    await this.findByIdAndUpdate(op._id, { applied: true });
  }

  return sortedOps;
};

const CollaborationSession = mongoose.model('CollaborationSession', collaborationSessionSchema);
const Operation = mongoose.model('Operation', operationSchema);
const CollaborativeComment = mongoose.model('CollaborativeComment', collaborativeCommentSchema);

module.exports = {
  CollaborationSession,
  Operation,
  CollaborativeComment
};