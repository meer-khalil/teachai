const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { CollaborationSession, Operation } = require('../models/collaborationModel');
const User = require('../models/userModel');

class CollaborationWebSocket {
  constructor(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.sessions = new Map(); // sessionId -> Set of socketIds
    this.userSockets = new Map(); // userId -> Set of socketIds
    this.socketUsers = new Map(); // socketId -> userId

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id).select('+password');

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar
        };

        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.name} connected: ${socket.id}`);

      // Track user connections
      if (!this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, new Set());
      }
      this.userSockets.get(socket.userId).add(socket.id);
      this.socketUsers.set(socket.id, socket.userId);

      // Join collaboration session
      socket.on('join-session', async (data) => {
        try {
          await this.handleJoinSession(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Leave collaboration session
      socket.on('leave-session', async (data) => {
        try {
          await this.handleLeaveSession(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle real-time operations
      socket.on('operation', async (data) => {
        try {
          await this.handleOperation(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle cursor updates
      socket.on('cursor-update', async (data) => {
        try {
          await this.handleCursorUpdate(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle selection updates
      socket.on('selection-update', async (data) => {
        try {
          await this.handleSelectionUpdate(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle awareness updates (typing indicators, etc.)
      socket.on('awareness-update', async (data) => {
        try {
          await this.handleAwarenessUpdate(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle collaborative comments
      socket.on('comment-add', async (data) => {
        try {
          await this.handleCommentAdd(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle comment replies
      socket.on('comment-reply', async (data) => {
        try {
          await this.handleCommentReply(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle lock requests
      socket.on('request-lock', async (data) => {
        try {
          await this.handleLockRequest(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle lock releases
      socket.on('release-lock', async (data) => {
        try {
          await this.handleLockRelease(socket, data);
        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  async handleJoinSession(socket, { sessionId }) {
    const session = await CollaborationSession.findOne({ sessionId })
      .populate('participants.userId', 'name email avatar');

    if (!session) {
      throw new Error('Session not found');
    }

    // Check if user is a participant
    const participant = session.participants.find(p => p.userId._id.toString() === socket.userId);
    if (!participant) {
      throw new Error('You are not a participant in this session');
    }

    // Join socket room
    socket.join(sessionId);
    
    // Track session membership
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new Set());
    }
    this.sessions.get(sessionId).add(socket.id);
    socket.currentSession = sessionId;

    // Update participant socket info
    participant.socketId = socket.id;
    participant.isActive = true;
    participant.lastActivity = new Date();
    await session.save();

    // Notify other participants
    socket.to(sessionId).emit('user-joined', {
      user: socket.user,
      participant: participant
    });

    // Send current session state to joining user
    socket.emit('session-joined', {
      sessionId,
      participants: session.participants,
      settings: session.settings,
      locks: session.locks
    });

    console.log(`User ${socket.user.name} joined session ${sessionId}`);
  }

  async handleLeaveSession(socket, { sessionId }) {
    if (socket.currentSession === sessionId) {
      await this.leaveCurrentSession(socket);
    }
  }

  async leaveCurrentSession(socket) {
    if (!socket.currentSession) return;

    const sessionId = socket.currentSession;
    
    try {
      const session = await CollaborationSession.findOne({ sessionId });
      if (session) {
        // Update participant status
        const participant = session.participants.find(p => p.socketId === socket.id);
        if (participant) {
          participant.isActive = false;
          participant.lastActivity = new Date();
        }

        // Release any locks held by this user
        session.locks = session.locks.filter(lock => 
          lock.userId.toString() !== socket.userId
        );

        await session.save();

        // Notify other participants
        socket.to(sessionId).emit('user-left', {
          userId: socket.userId,
          user: socket.user
        });
      }

      // Leave socket room
      socket.leave(sessionId);
      
      // Clean up tracking
      if (this.sessions.has(sessionId)) {
        this.sessions.get(sessionId).delete(socket.id);
        if (this.sessions.get(sessionId).size === 0) {
          this.sessions.delete(sessionId);
        }
      }

      socket.currentSession = null;
      console.log(`User ${socket.user.name} left session ${sessionId}`);
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  }

  async handleOperation(socket, { sessionId, operation, version }) {
    if (!socket.currentSession || socket.currentSession !== sessionId) {
      throw new Error('You are not in this session');
    }

    const session = await CollaborationSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    const participant = session.participants.find(p => p.userId.toString() === socket.userId);
    if (!participant || participant.permissions === 'view') {
      throw new Error('Insufficient permissions');
    }

    // Create operation record
    const newOperation = new Operation({
      sessionId,
      userId: socket.userId,
      operation,
      version
    });

    await newOperation.save();
    await newOperation.populate('userId', 'name email avatar');

    // Broadcast operation to other participants
    socket.to(sessionId).emit('operation', {
      operationId: newOperation._id,
      userId: socket.userId,
      user: socket.user,
      operation,
      version,
      timestamp: newOperation.timestamp
    });

    // Update participant activity
    participant.lastActivity = new Date();
    await session.save();
  }

  async handleCursorUpdate(socket, { sessionId, cursor }) {
    if (!socket.currentSession || socket.currentSession !== sessionId) {
      return;
    }

    const session = await CollaborationSession.findOne({ sessionId });
    if (session) {
      session.updateCursor(socket.userId, cursor);
      await session.save();

      // Broadcast cursor update
      socket.to(sessionId).emit('cursor-update', {
        userId: socket.userId,
        user: socket.user,
        cursor
      });
    }
  }

  async handleSelectionUpdate(socket, { sessionId, selection }) {
    if (!socket.currentSession || socket.currentSession !== sessionId) {
      return;
    }

    // Broadcast selection update
    socket.to(sessionId).emit('selection-update', {
      userId: socket.userId,
      user: socket.user,
      selection
    });
  }

  async handleAwarenessUpdate(socket, { sessionId, awareness }) {
    if (!socket.currentSession || socket.currentSession !== sessionId) {
      return;
    }

    // Broadcast awareness update (typing indicators, etc.)
    socket.to(sessionId).emit('awareness-update', {
      userId: socket.userId,
      user: socket.user,
      awareness
    });
  }

  async handleCommentAdd(socket, { sessionId, comment }) {
    if (!socket.currentSession || socket.currentSession !== sessionId) {
      throw new Error('You are not in this session');
    }

    // Broadcast new comment
    socket.to(sessionId).emit('comment-added', {
      comment: {
        ...comment,
        author: socket.user,
        createdAt: new Date()
      }
    });
  }

  async handleCommentReply(socket, { sessionId, commentId, reply }) {
    if (!socket.currentSession || socket.currentSession !== sessionId) {
      throw new Error('You are not in this session');
    }

    // Broadcast comment reply
    socket.to(sessionId).emit('comment-reply', {
      commentId,
      reply: {
        ...reply,
        author: socket.user,
        createdAt: new Date()
      }
    });
  }

  async handleLockRequest(socket, { sessionId, section, timeout = 30000 }) {
    if (!socket.currentSession || socket.currentSession !== sessionId) {
      throw new Error('You are not in this session');
    }

    const session = await CollaborationSession.findOne({ sessionId });
    if (!session) {
      throw new Error('Session not found');
    }

    const participant = session.participants.find(p => p.userId.toString() === socket.userId);
    if (!participant || participant.permissions === 'view') {
      throw new Error('Insufficient permissions');
    }

    try {
      session.acquireLock(socket.userId, section, timeout);
      await session.save();

      // Notify user of successful lock
      socket.emit('lock-acquired', {
        section,
        expiresAt: new Date(Date.now() + timeout)
      });

      // Notify other participants
      socket.to(sessionId).emit('section-locked', {
        userId: socket.userId,
        user: socket.user,
        section,
        expiresAt: new Date(Date.now() + timeout)
      });
    } catch (error) {
      socket.emit('lock-denied', {
        section,
        reason: error.message
      });
    }
  }

  async handleLockRelease(socket, { sessionId, section }) {
    if (!socket.currentSession || socket.currentSession !== sessionId) {
      return;
    }

    const session = await CollaborationSession.findOne({ sessionId });
    if (session) {
      session.releaseLock(socket.userId, section);
      await session.save();

      // Notify all participants
      this.io.to(sessionId).emit('section-unlocked', {
        userId: socket.userId,
        user: socket.user,
        section
      });
    }
  }

  async handleDisconnect(socket) {
    console.log(`User ${socket.user.name} disconnected: ${socket.id}`);

    // Leave current session
    await this.leaveCurrentSession(socket);

    // Clean up user tracking
    if (this.userSockets.has(socket.userId)) {
      this.userSockets.get(socket.userId).delete(socket.id);
      if (this.userSockets.get(socket.userId).size === 0) {
        this.userSockets.delete(socket.userId);
      }
    }
    this.socketUsers.delete(socket.id);
  }

  // Utility methods
  getActiveUsers() {
    return Array.from(this.userSockets.keys());
  }

  getSessionParticipants(sessionId) {
    if (!this.sessions.has(sessionId)) return [];
    
    const socketIds = Array.from(this.sessions.get(sessionId));
    return socketIds.map(socketId => {
      const userId = this.socketUsers.get(socketId);
      const socket = this.io.sockets.sockets.get(socketId);
      return socket ? socket.user : null;
    }).filter(user => user !== null);
  }

  broadcastToSession(sessionId, event, data) {
    this.io.to(sessionId).emit(event, data);
  }

  sendToUser(userId, event, data) {
    if (this.userSockets.has(userId)) {
      const socketIds = Array.from(this.userSockets.get(userId));
      socketIds.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      });
    }
  }
}

module.exports = CollaborationWebSocket;