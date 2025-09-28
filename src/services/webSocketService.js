import io from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.messageQueue = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    
    // Event callbacks
    this.onConnectionChange = null;
    this.onNotification = null;
    this.onChatMessage = null;
    this.onPresenceUpdate = null;
  }

  // Initialize and connect to WebSocket server
  connect(token) {
    try {
      if (this.socket && this.socket.connected) {
        console.log('🔌 WebSocket already connected');
        return;
      }

      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:4000';
      
      this.socket = io(serverUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
      
      console.log('🔌 Connecting to WebSocket server...');
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
    }
  }

  // Setup socket event listeners
  setupEventListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Process queued messages
      this.processMessageQueue();
      
      if (this.onConnectionChange) {
        this.onConnectionChange(true);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      this.isConnected = false;
      
      if (this.onConnectionChange) {
        this.onConnectionChange(false);
      }

      // Auto-reconnect for certain disconnect reasons
      if (reason === 'io server disconnect') {
        // Server-side disconnect, don't auto-reconnect
        console.log('Server disconnected client, not auto-reconnecting');
      } else {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 WebSocket connection error:', error.message);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    // System events
    this.socket.on('system:welcome', (data) => {
      console.log('🎉 Welcome message:', data);
    });

    this.socket.on('system:shutdown', (data) => {
      console.warn('⚠️ Server shutdown:', data);
    });

    // Chat events
    this.socket.on('chat:message', (message) => {
      if (this.onChatMessage) {
        this.onChatMessage(message);
      }
      this.notifyListeners('chat:message', message);
    });

    this.socket.on('chat:user-joined', (data) => {
      console.log('👋 User joined:', data.user.email);
      this.notifyListeners('chat:user-joined', data);
    });

    this.socket.on('chat:user-left', (data) => {
      console.log('👋 User left:', data.user.email);
      this.notifyListeners('chat:user-left', data);
    });

    this.socket.on('chat:typing', (data) => {
      this.notifyListeners('chat:typing', data);
    });

    this.socket.on('chat:delivered', (data) => {
      this.notifyListeners('chat:delivered', data);
    });

    this.socket.on('chat:room-joined', (data) => {
      console.log('🏠 Joined room:', data.roomId);
      this.notifyListeners('chat:room-joined', data);
    });

    // Notification events
    this.socket.on('notification:new', (notification) => {
      console.log('🔔 New notification:', notification);
      
      if (this.onNotification) {
        this.onNotification(notification);
      }
      
      this.notifyListeners('notification:new', notification);
    });

    // Presence events
    this.socket.on('presence:update', (data) => {
      if (this.onPresenceUpdate) {
        this.onPresenceUpdate(data);
      }
      this.notifyListeners('presence:update', data);
    });

    this.socket.on('presence:status', (data) => {
      this.notifyListeners('presence:status', data);
    });

    // AI events
    this.socket.on('ai:response', (response) => {
      console.log('🤖 AI response received');
      this.notifyListeners('ai:response', response);
    });

    this.socket.on('ai:typing', (data) => {
      this.notifyListeners('ai:typing', data);
    });

    // Collaboration events
    this.socket.on('collaboration:operation', (data) => {
      this.notifyListeners('collaboration:operation', data);
    });

    this.socket.on('collaboration:cursor', (data) => {
      this.notifyListeners('collaboration:cursor', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('🚫 WebSocket error:', error);
      this.notifyListeners('error', error);
    });
  }

  // Schedule reconnection attempt
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        console.log('🔄 Attempting to reconnect...');
        this.socket.connect();
      }
    }, delay);
  }

  // Process queued messages
  processMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`📤 Processing ${this.messageQueue.length} queued messages`);
      
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.socket.emit(message.event, message.data);
      }
    }
  }

  // Send message with queuing support
  emit(event, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit(event, data);
    } else {
      console.log(`📦 Queueing message: ${event}`);
      this.messageQueue.push({ event, data });
    }
  }

  // Chat methods
  sendChatMessage(roomId, message, type = 'text', metadata = {}) {
    this.emit('chat:send', {
      roomId,
      message,
      type,
      metadata,
      timestamp: new Date()
    });
  }

  joinChatRoom(roomId, roomType = 'general') {
    this.emit('chat:join', { roomId, roomType });
  }

  leaveChatRoom(roomId) {
    this.emit('chat:leave', { roomId });
  }

  sendTypingIndicator(roomId, isTyping) {
    this.emit('chat:typing', { roomId, isTyping });
  }

  // AI Chat methods
  sendAIMessage(message, context = {}, chatbotId = null) {
    this.emit('ai:chat', {
      message,
      context,
      chatbotId,
      timestamp: new Date()
    });
  }

  // Notification methods
  markNotificationAsRead(notificationId) {
    this.emit('notification:read', { notificationId });
  }

  subscribeToNotifications(categories = []) {
    this.emit('notification:subscribe', { categories });
  }

  // Presence methods
  updatePresence(status, customMessage = null) {
    this.emit('presence:update', { status, customMessage });
  }

  // Collaboration methods
  joinCollaboration(documentId) {
    if (this.socket) {
      this.socket.join(`doc:${documentId}`);
    }
    this.emit('collaboration:join', { documentId });
  }

  sendCollaborativeEdit(documentId, operation, metadata = {}) {
    this.emit('collaboration:edit', {
      documentId,
      operation,
      metadata,
      timestamp: new Date()
    });
  }

  sendCursorUpdate(documentId, position, selection = null) {
    this.emit('collaboration:cursor', {
      documentId,
      position,
      selection,
      timestamp: new Date()
    });
  }

  // Event listener management
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // Notify all listeners for an event
  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for ${event}:`, error);
        }
      });
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length
    };
  }

  // Disconnect from WebSocket server
  disconnect() {
    console.log('🔌 Disconnecting WebSocket...');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.messageQueue = [];
    this.listeners.clear();
    
    if (this.onConnectionChange) {
      this.onConnectionChange(false);
    }
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }

  // Get socket instance (for advanced usage)
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;