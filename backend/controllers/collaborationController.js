const { CollaborationSession, Operation, CollaborativeComment } = require('../models/collaborationModel');
const { Content } = require('../models/contentModel');
const asyncErrorHandler = require('../middlewares/asyncErrorHandler');
const CustomError = require('../utils/errorHandler');
const ApiFeatures = require('../utils/api');

// Create or join collaboration session
const createOrJoinSession = asyncErrorHandler(async (req, res, next) => {
  const { contentId } = req.params;
  const { permissions = 'edit' } = req.body;
  const userId = req.user.id;

  // Verify content exists and user has access
  const content = await Content.findById(contentId);
  if (!content) {
    return next(new CustomError('Content not found', 404));
  }

  // Check if user has permission to access content
  if (content.author.toString() !== userId && 
      !content.collaborators.some(c => c.userId.toString() === userId && c.permissions !== 'view')) {
    return next(new CustomError('You do not have permission to collaborate on this content', 403));
  }

  // Find existing active session
  let session = await CollaborationSession.findActiveSession(contentId);

  if (!session) {
    // Create new session if user is content owner or has admin permissions
    if (content.author.toString() === userId || 
        content.collaborators.some(c => c.userId.toString() === userId && c.permissions === 'admin')) {
      session = await CollaborationSession.createSession(contentId, userId);
    } else {
      return next(new CustomError('No active collaboration session found', 404));
    }
  } else {
    // Join existing session
    try {
      await session.addParticipant(userId, permissions);
      await session.save();
    } catch (error) {
      return next(new CustomError(error.message, 400));
    }
  }

  // Populate session data
  await session.populate('participants.userId', 'name email avatar');
  await session.populate('owner', 'name email avatar');

  res.status(200).json({
    success: true,
    message: 'Successfully joined collaboration session',
    data: {
      session: {
        id: session._id,
        sessionId: session.sessionId,
        contentId: session.contentId,
        owner: session.owner,
        participants: session.participants,
        settings: session.settings,
        status: session.status
      }
    }
  });
});

// Leave collaboration session
const leaveSession = asyncErrorHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  const session = await CollaborationSession.findOne({ sessionId });
  if (!session) {
    return next(new CustomError('Session not found', 404));
  }

  session.removeParticipant(userId);
  await session.save();

  // End session if no participants left
  if (session.participants.length === 0) {
    session.status = 'ended';
    await session.save();
  }

  res.status(200).json({
    success: true,
    message: 'Successfully left collaboration session'
  });
});

// Get session participants
const getSessionParticipants = asyncErrorHandler(async (req, res, next) => {
  const { sessionId } = req.params;

  const session = await CollaborationSession.findOne({ sessionId })
    .populate('participants.userId', 'name email avatar')
    .populate('owner', 'name email avatar');

  if (!session) {
    return next(new CustomError('Session not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      participants: session.participants,
      owner: session.owner,
      settings: session.settings
    }
  });
});

// Apply operation (for real-time changes)
const applyOperation = asyncErrorHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const { operation, version } = req.body;
  const userId = req.user.id;

  const session = await CollaborationSession.findOne({ sessionId });
  if (!session) {
    return next(new CustomError('Session not found', 404));
  }

  // Check if user is a participant
  const participant = session.participants.find(p => p.userId.toString() === userId);
  if (!participant || !participant.isActive) {
    return next(new CustomError('You are not an active participant in this session', 403));
  }

  // Check permissions
  if (operation.type !== 'cursor' && participant.permissions === 'view') {
    return next(new CustomError('You do not have edit permissions', 403));
  }

  // Create operation record
  const newOperation = new Operation({
    sessionId,
    userId,
    operation,
    version
  });

  await newOperation.save();

  // Update participant activity
  participant.lastActivity = new Date();
  if (operation.type === 'cursor') {
    participant.cursor = { ...participant.cursor, ...operation.cursor };
  }
  await session.save();

  res.status(200).json({
    success: true,
    message: 'Operation applied successfully',
    data: {
      operationId: newOperation._id,
      version: newOperation.version
    }
  });
});

// Get operations for synchronization
const getOperations = asyncErrorHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const { fromVersion = 0, limit = 100 } = req.query;

  const session = await CollaborationSession.findOne({ sessionId });
  if (!session) {
    return next(new CustomError('Session not found', 404));
  }

  const operations = await Operation.find({
    sessionId,
    version: { $gt: parseInt(fromVersion) }
  })
  .populate('userId', 'name email avatar')
  .sort({ version: 1 })
  .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      operations,
      totalCount: operations.length
    }
  });
});

// Acquire content lock
const acquireLock = asyncErrorHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const { section, timeout = 30000 } = req.body;
  const userId = req.user.id;

  const session = await CollaborationSession.findOne({ sessionId });
  if (!session) {
    return next(new CustomError('Session not found', 404));
  }

  const participant = session.participants.find(p => p.userId.toString() === userId);
  if (!participant || participant.permissions === 'view') {
    return next(new CustomError('You do not have edit permissions', 403));
  }

  try {
    session.acquireLock(userId, section, timeout);
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Lock acquired successfully',
      data: {
        section,
        expiresAt: new Date(Date.now() + timeout)
      }
    });
  } catch (error) {
    return next(new CustomError(error.message, 409));
  }
});

// Release content lock
const releaseLock = asyncErrorHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const { section } = req.body;
  const userId = req.user.id;

  const session = await CollaborationSession.findOne({ sessionId });
  if (!session) {
    return next(new CustomError('Session not found', 404));
  }

  session.releaseLock(userId, section);
  await session.save();

  res.status(200).json({
    success: true,
    message: 'Lock released successfully'
  });
});

// Add collaborative comment
const addComment = asyncErrorHandler(async (req, res, next) => {
  const { contentId } = req.params;
  const { sessionId, content, position, mentions = [] } = req.body;
  const userId = req.user.id;

  const session = await CollaborationSession.findOne({ sessionId });
  if (!session) {
    return next(new CustomError('Session not found', 404));
  }

  const participant = session.participants.find(p => p.userId.toString() === userId);
  if (!participant) {
    return next(new CustomError('You are not a participant in this session', 403));
  }

  const comment = new CollaborativeComment({
    contentId,
    sessionId,
    author: userId,
    content,
    position,
    mentions
  });

  await comment.save();
  await comment.populate('author', 'name email avatar');
  await comment.populate('mentions', 'name email');

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: { comment }
  });
});

// Reply to comment
const replyToComment = asyncErrorHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  const comment = await CollaborativeComment.findById(commentId);
  if (!comment) {
    return next(new CustomError('Comment not found', 404));
  }

  comment.thread.push({
    author: userId,
    content,
    createdAt: new Date()
  });

  await comment.save();
  await comment.populate('thread.author', 'name email avatar');

  res.status(200).json({
    success: true,
    message: 'Reply added successfully',
    data: {
      comment,
      reply: comment.thread[comment.thread.length - 1]
    }
  });
});

// Resolve comment
const resolveComment = asyncErrorHandler(async (req, res, next) => {
  const { commentId } = req.params;
  const userId = req.user.id;

  const comment = await CollaborativeComment.findById(commentId);
  if (!comment) {
    return next(new CustomError('Comment not found', 404));
  }

  comment.resolved = true;
  comment.resolvedBy = userId;
  comment.resolvedAt = new Date();

  await comment.save();

  res.status(200).json({
    success: true,
    message: 'Comment resolved successfully',
    data: { comment }
  });
});

// Get comments for content
const getComments = asyncErrorHandler(async (req, res, next) => {
  const { contentId } = req.params;
  const { resolved = null } = req.query;

  const filter = { contentId };
  if (resolved !== null) {
    filter.resolved = resolved === 'true';
  }

  const features = new ApiFeatures(
    CollaborativeComment.find(filter)
      .populate('author', 'name email avatar')
      .populate('thread.author', 'name email avatar')
      .populate('mentions', 'name email')
      .populate('resolvedBy', 'name email'),
    req.query
  ).sort().paginate();

  const comments = await features.query;
  const totalComments = await CollaborativeComment.countDocuments(filter);

  res.status(200).json({
    success: true,
    results: comments.length,
    totalResults: totalComments,
    data: { comments }
  });
});

// Update session settings
const updateSessionSettings = asyncErrorHandler(async (req, res, next) => {
  const { sessionId } = req.params;
  const { settings } = req.body;
  const userId = req.user.id;

  const session = await CollaborationSession.findOne({ sessionId });
  if (!session) {
    return next(new CustomError('Session not found', 404));
  }

  // Check if user is owner or has admin permissions
  const participant = session.participants.find(p => p.userId.toString() === userId);
  if (session.owner.toString() !== userId && 
      (!participant || participant.permissions !== 'admin')) {
    return next(new CustomError('You do not have permission to update session settings', 403));
  }

  session.settings = { ...session.settings, ...settings };
  await session.save();

  res.status(200).json({
    success: true,
    message: 'Session settings updated successfully',
    data: { settings: session.settings }
  });
});

// Get active sessions for user
const getUserSessions = asyncErrorHandler(async (req, res, next) => {
  const userId = req.user.id;
  const { status = 'active' } = req.query;

  const sessions = await CollaborationSession.find({
    'participants.userId': userId,
    'participants.isActive': true,
    status
  })
  .populate('owner', 'name email avatar')
  .populate('participants.userId', 'name email avatar')
  .populate('contentId', 'title slug status')
  .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    results: sessions.length,
    data: { sessions }
  });
});

module.exports = {
  createOrJoinSession,
  leaveSession,
  getSessionParticipants,
  applyOperation,
  getOperations,
  acquireLock,
  releaseLock,
  addComment,
  replyToComment,
  resolveComment,
  getComments,
  updateSessionSettings,
  getUserSessions
};