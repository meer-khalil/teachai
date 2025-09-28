// WebSocket Server Implementation
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { cacheService } = require('../utils/cacheService');

class WebSocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["authorization"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling']
    });

    this.connectedUsers = new Map(); // userId -> Set of socketIds
    this.socketUsers = new Map(); // socketId -> userId
    this.rooms = new Map(); // roomId -> Set of socketIds
    
    this.setupMiddleware();
    this.setupEventHandlers();
    
    console.log('🔌 WebSocket server initialized');
  }

  // Authentication middleware for WebSocket connections
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.authorization?.replace('Bearer ', '');

        if (!token) {
          throw new Error('Authentication token required');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
          throw new Error('User not found');
        }

        socket.userId = user._id.toString();
        socket.user = {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        };

        console.log(`🔐 WebSocket authentication successful: ${user.email}`);
        next();
      } catch (error) {
        console.error('🚫 WebSocket authentication failed:', error.message);
        next(new Error('Authentication failed'));
      }
    });
  }

  // Setup main event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      this.setupSocketEvents(socket);
    });
  }

  // Handle new socket connection
  handleConnection(socket) {
    const userId = socket.userId;
    
    console.log(`🔌 User connected: ${socket.user.email} (${socket.id})`);

    // Track connected users
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId).add(socket.id);
    this.socketUsers.set(socket.id, userId);

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Update user online status
    this.updateUserPresence(userId, 'online');

    // Send user their current presence info
    socket.emit('presence:status', {
      userId,
      status: 'online',
      lastSeen: new Date()
    });

    // Broadcast user online status to friends/contacts
    this.broadcastPresenceUpdate(userId, 'online');

    // Send welcome message
    socket.emit('system:welcome', {
      message: 'Connected to TeachAI real-time server',
      user: socket.user,
      timestamp: new Date(),
      features: ['chat', 'notifications', 'collaboration', 'presence']
    });
  }

  // Setup socket event listeners
  setupSocketEvents(socket) {
    // Chat events
    socket.on('chat:send', (data) => this.handleChatMessage(socket, data));
    socket.on('chat:join', (data) => this.handleJoinRoom(socket, data));
    socket.on('chat:leave', (data) => this.handleLeaveRoom(socket, data));
    socket.on('chat:typing', (data) => this.handleTyping(socket, data));

    // Notification events
    socket.on('notification:read', (data) => this.handleNotificationRead(socket, data));
    socket.on('notification:subscribe', (data) => this.handleNotificationSubscribe(socket, data));

    // Presence events
    socket.on('presence:update', (data) => this.handlePresenceUpdate(socket, data));

    // Collaboration events
    socket.on('collaboration:join', (data) => this.handleCollaborationJoin(socket, data));
    socket.on('collaboration:cursor', (data) => this.handleCursorUpdate(socket, data));
    socket.on('collaboration:edit', (data) => this.handleCollaborativeEdit(socket, data));

    // AI Chat events
    socket.on('ai:chat', (data) => this.handleAIChat(socket, data));

    // Disconnect event
    socket.on('disconnect', () => this.handleDisconnection(socket));

    // Error handling
    socket.on('error', (error) => {
      console.error(`🚫 Socket error for user ${socket.userId}:`, error);
    });
  }

  // Handle chat message
  async handleChatMessage(socket, data) {
    try {
      const { roomId, message, type = 'text', metadata = {} } = data;

      if (!message || !roomId) {
        socket.emit('error', { message: 'Message and room ID are required' });
        return;
      }

      // Validate room access
      if (!this.canAccessRoom(socket.userId, roomId)) {
        socket.emit('error', { message: 'Access denied to this room' });
        return;
      }

      const chatMessage = {
        id: require('uuid').v4(),
        roomId,
        senderId: socket.userId,
        sender: socket.user,
        message,
        type,
        metadata,
        timestamp: new Date(),
        delivered: false,
        read: false
      };

      // Save message to cache and database
      await this.saveChatMessage(chatMessage);

      // Broadcast message to room members
      this.io.to(roomId).emit('chat:message', chatMessage);

      // Send delivery confirmation
      socket.emit('chat:delivered', { 
        messageId: chatMessage.id,
        timestamp: chatMessage.timestamp 
      });

      console.log(`💬 Chat message from ${socket.user.email} in room ${roomId}`);
    } catch (error) {
      console.error('Chat message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  // Handle joining a chat room
  async handleJoinRoom(socket, data) {
    try {
      const { roomId, roomType = 'general' } = data;

      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // Validate room access
      if (!this.canAccessRoom(socket.userId, roomId)) {
        socket.emit('error', { message: 'Access denied to this room' });
        return;
      }

      // Join the room
      socket.join(roomId);
      
      // Track room membership
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId).add(socket.id);

      // Notify room members of new user
      socket.to(roomId).emit('chat:user-joined', {
        user: socket.user,
        roomId,
        timestamp: new Date()
      });

      // Send room info to user
      const roomInfo = await this.getRoomInfo(roomId);
      socket.emit('chat:room-joined', {
        roomId,
        roomType,
        ...roomInfo,
        timestamp: new Date()
      });

      console.log(`🏠 User ${socket.user.email} joined room: ${roomId}`);
    } catch (error) {
      console.error('Join room error:', error);
      socket.emit('error', { message: 'Failed to join room' });
    }
  }

  // Handle leaving a chat room
  handleLeaveRoom(socket, data) {
    try {
      const { roomId } = data;

      if (!roomId) {
        socket.emit('error', { message: 'Room ID is required' });
        return;
      }

      // Leave the room
      socket.leave(roomId);

      // Remove from room tracking
      if (this.rooms.has(roomId)) {
        this.rooms.get(roomId).delete(socket.id);
        if (this.rooms.get(roomId).size === 0) {
          this.rooms.delete(roomId);
        }
      }

      // Notify room members
      socket.to(roomId).emit('chat:user-left', {
        user: socket.user,
        roomId,
        timestamp: new Date()
      });

      socket.emit('chat:room-left', { roomId });

      console.log(`🚪 User ${socket.user.email} left room: ${roomId}`);
    } catch (error) {
      console.error('Leave room error:', error);
    }
  }

  // Handle typing indicators
  handleTyping(socket, data) {
    try {
      const { roomId, isTyping } = data;

      if (!roomId) return;

      socket.to(roomId).emit('chat:typing', {
        userId: socket.userId,
        user: socket.user,
        roomId,
        isTyping,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Typing indicator error:', error);
    }
  }

  // Handle AI chat interactions
  async handleAIChat(socket, data) {
    try {
      const { message, context = {}, chatbotId } = data;

      if (!message) {
        socket.emit('error', { message: 'Message is required' });
        return;
      }

      console.log(`🤖 AI chat request from ${socket.user.email}: ${message.substring(0, 50)}...`);

      // Emit typing indicator
      socket.emit('ai:typing', { isTyping: true, timestamp: new Date() });

      // Process AI request (integration with existing AI system)
      // This would connect to your existing chat API
      const aiResponse = await this.processAIRequest({
        userId: socket.userId,
        message,
        context,
        chatbotId
      });

      // Stop typing indicator
      socket.emit('ai:typing', { isTyping: false, timestamp: new Date() });

      // Send AI response
      socket.emit('ai:response', {
        id: require('uuid').v4(),
        message: aiResponse.message,
        chatbotId,
        metadata: aiResponse.metadata,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('AI chat error:', error);
      socket.emit('ai:typing', { isTyping: false });
      socket.emit('error', { message: 'AI chat service temporarily unavailable' });
    }
  }

  // Handle notification read status
  async handleNotificationRead(socket, data) {
    try {
      const { notificationId } = data;

      if (!notificationId) return;

      // Update notification read status in database
      await this.markNotificationAsRead(socket.userId, notificationId);

      // Confirm to client
      socket.emit('notification:read-confirmed', {
        notificationId,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Notification read error:', error);
    }
  }

  // Handle presence updates
  async handlePresenceUpdate(socket, data) {
    try {
      const { status, customMessage } = data;
      const validStatuses = ['online', 'away', 'busy', 'invisible'];

      if (!validStatuses.includes(status)) {
        socket.emit('error', { message: 'Invalid presence status' });
        return;
      }

      await this.updateUserPresence(socket.userId, status, customMessage);
      this.broadcastPresenceUpdate(socket.userId, status, customMessage);

      socket.emit('presence:updated', {
        status,
        customMessage,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Presence update error:', error);
    }
  }

  // Handle collaborative editing
  handleCollaborativeEdit(socket, data) {
    try {
      const { documentId, operation, metadata } = data;

      if (!documentId || !operation) {
        socket.emit('error', { message: 'Document ID and operation are required' });
        return;
      }

      // Broadcast edit operation to other collaborators
      socket.to(`doc:${documentId}`).emit('collaboration:operation', {
        documentId,
        operation,
        userId: socket.userId,
        user: socket.user,
        metadata,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Collaborative edit error:', error);
    }
  }

  // Handle cursor updates in collaborative editing
  handleCursorUpdate(socket, data) {
    try {
      const { documentId, position, selection } = data;

      if (!documentId) return;

      // Broadcast cursor position to other collaborators
      socket.to(`doc:${documentId}`).emit('collaboration:cursor', {
        documentId,
        userId: socket.userId,
        user: socket.user,
        position,
        selection,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Cursor update error:', error);
    }
  }

  // Handle user disconnection
  handleDisconnection(socket) {
    const userId = socket.userId;
    
    console.log(`🔌 User disconnected: ${socket.user?.email} (${socket.id})`);

    // Remove from tracking maps
    if (this.connectedUsers.has(userId)) {
      this.connectedUsers.get(userId).delete(socket.id);
      if (this.connectedUsers.get(userId).size === 0) {
        this.connectedUsers.delete(userId);
        // User has no more connections, mark as offline
        this.updateUserPresence(userId, 'offline');
        this.broadcastPresenceUpdate(userId, 'offline');
      }
    }

    this.socketUsers.delete(socket.id);

    // Remove from all rooms
    for (const [roomId, socketIds] of this.rooms.entries()) {
      if (socketIds.has(socket.id)) {
        socketIds.delete(socket.id);
        if (socketIds.size === 0) {
          this.rooms.delete(roomId);
        }
        
        // Notify room members
        socket.to(roomId).emit('chat:user-left', {
          user: socket.user,
          roomId,
          timestamp: new Date(),
          reason: 'disconnected'
        });
      }
    }
  }

  // Send notification to specific user
  async sendNotification(userId, notification) {
    try {
      // Send to all user's connected sockets
      this.io.to(`user:${userId}`).emit('notification:new', {
        id: require('uuid').v4(),
        ...notification,
        timestamp: new Date()
      });

      // Cache notification for offline delivery
      await cacheService.set(
        `notification:${userId}:${Date.now()}`,
        notification,
        { ttl: 86400 } // 24 hours
      );

      console.log(`🔔 Notification sent to user: ${userId}`);
    } catch (error) {
      console.error('Send notification error:', error);
    }
  }

  // Broadcast message to multiple users
  broadcastToUsers(userIds, event, data) {
    try {
      userIds.forEach(userId => {
        this.io.to(`user:${userId}`).emit(event, data);
      });
      
      console.log(`📢 Broadcast ${event} to ${userIds.length} users`);
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  }

  // Utility methods
  async updateUserPresence(userId, status, customMessage = null) {
    try {
      const presenceData = {
        userId,
        status,
        customMessage,
        lastSeen: new Date()
      };

      await cacheService.set(
        `presence:${userId}`,
        presenceData,
        { ttl: 3600 } // 1 hour
      );

      return presenceData;
    } catch (error) {
      console.error('Update presence error:', error);
    }
  }

  async broadcastPresenceUpdate(userId, status, customMessage = null) {
    try {
      // Broadcast to user's contacts/friends
      // This would typically query the database for user's contacts
      // For now, we'll broadcast to all connected users
      
      this.io.emit('presence:update', {
        userId,
        status,
        customMessage,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Broadcast presence error:', error);
    }
  }

  canAccessRoom(userId, roomId) {
    // Implement room access control logic
    // For now, allow access to all rooms
    return true;
  }

  async getRoomInfo(roomId) {
    try {
      // Get room information from cache or database
      const roomInfo = await cacheService.get(`room:${roomId}`, {
        fallback: async () => ({
          memberCount: this.rooms.get(roomId)?.size || 0,
          type: 'general',
          createdAt: new Date()
        })
      });

      return roomInfo;
    } catch (error) {
      console.error('Get room info error:', error);
      return { memberCount: 0, type: 'general' };
    }
  }

  async saveChatMessage(message) {
    try {
      // Save to cache for quick retrieval
      await cacheService.set(
        `message:${message.id}`,
        message,
        { ttl: 7200 } // 2 hours
      );

      // Add to room message history
      const roomHistoryKey = `room:${message.roomId}:messages`;
      const roomHistory = await cacheService.get(roomHistoryKey) || [];
      roomHistory.push(message);
      
      // Keep only last 100 messages in cache
      if (roomHistory.length > 100) {
        roomHistory.splice(0, roomHistory.length - 100);
      }
      
      await cacheService.set(roomHistoryKey, roomHistory, { ttl: 7200 });

      // TODO: Save to persistent database
      
    } catch (error) {
      console.error('Save chat message error:', error);
    }
  }

  async processAIRequest(request) {
    try {
      // This would integrate with your existing AI chat system
      // For now, return a mock response
      return {
        message: `I received your message: "${request.message}". This is a real-time WebSocket AI response!`,
        metadata: {
          model: 'gpt-3.5-turbo',
          processingTime: '250ms',
          tokens: 45
        }
      };
    } catch (error) {
      console.error('Process AI request error:', error);
      throw new Error('AI processing failed');
    }
  }

  async markNotificationAsRead(userId, notificationId) {
    try {
      // Update notification status in database
      // For now, just cache the read status
      await cacheService.set(
        `notification:read:${userId}:${notificationId}`,
        true,
        { ttl: 86400 }
      );
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  }

  // Get server statistics
  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      totalConnections: this.socketUsers.size,
      activeRooms: this.rooms.size,
      timestamp: new Date()
    };
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🔌 Shutting down WebSocket server...');
    
    // Notify all connected clients
    this.io.emit('system:shutdown', {
      message: 'Server is shutting down for maintenance',
      timestamp: new Date()
    });

    // Close all connections
    this.io.close();
    
    console.log('✅ WebSocket server shutdown complete');
  }
}

module.exports = WebSocketServer;