const express = require('express');
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth');
const WebSocketService = require('../services/websocketService');
const { cacheService } = require('../utils/cacheService');
const router = express.Router();

// Get WebSocket server statistics
router.get('/stats', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const wsService = req.app.get('wsService');
    
    if (!wsService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket service not available'
      });
    }

    const stats = wsService.getStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('WebSocket stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve WebSocket statistics'
    });
  }
});

// Send notification to specific user
router.post('/notification/send', isAuthenticatedUser, async (req, res) => {
  try {
    const { userId, title, message, type = 'info', data = {} } = req.body;

    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and message are required'
      });
    }

    const wsService = req.app.get('wsService');
    
    if (!wsService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket service not available'
      });
    }

    const notification = {
      title,
      message,
      type,
      data,
      senderId: req.user._id,
      sender: {
        _id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
      }
    };

    await wsService.sendNotification(userId, notification);

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification'
    });
  }
});

// Broadcast notification to multiple users
router.post('/notification/broadcast', isAuthenticatedUser, authorizeRoles('admin'), async (req, res) => {
  try {
    const { userIds, title, message, type = 'info', data = {} } = req.body;

    if (!userIds || !Array.isArray(userIds) || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userIds (array), title, and message are required'
      });
    }

    const wsService = req.app.get('wsService');
    
    if (!wsService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket service not available'
      });
    }

    const notification = {
      title,
      message,
      type,
      data,
      senderId: req.user._id,
      sender: {
        _id: req.user._id,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        email: req.user.email
      }
    };

    // Send to each user
    for (const userId of userIds) {
      await wsService.sendNotification(userId, notification);
    }

    res.status(200).json({
      success: true,
      message: `Notification broadcast to ${userIds.length} users`
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to broadcast notification'
    });
  }
});

// Get user's presence status
router.get('/presence/:userId', isAuthenticatedUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const presenceData = await cacheService.get(`presence:${userId}`);
    
    if (!presenceData) {
      return res.status(404).json({
        success: false,
        message: 'User presence not found'
      });
    }

    res.status(200).json({
      success: true,
      data: presenceData
    });
  } catch (error) {
    console.error('Get presence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve presence status'
    });
  }
});

// Get online users list
router.get('/users/online', isAuthenticatedUser, async (req, res) => {
  try {
    const wsService = req.app.get('wsService');
    
    if (!wsService) {
      return res.status(503).json({
        success: false,
        message: 'WebSocket service not available'
      });
    }

    // Get list of online user IDs
    const onlineUserIds = Array.from(wsService.connectedUsers.keys());
    
    // Get presence data for each user
    const onlineUsers = [];
    for (const userId of onlineUserIds) {
      const presenceData = await cacheService.get(`presence:${userId}`);
      if (presenceData) {
        onlineUsers.push(presenceData);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        count: onlineUsers.length,
        users: onlineUsers
      }
    });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve online users'
    });
  }
});

// Get chat room messages
router.get('/chat/room/:roomId/messages', isAuthenticatedUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;

    // Check if user has access to this room
    // TODO: Implement proper room access control
    
    const roomHistoryKey = `room:${roomId}:messages`;
    const messages = await cacheService.get(roomHistoryKey) || [];
    
    // Filter messages if 'before' timestamp is provided
    let filteredMessages = messages;
    if (before) {
      const beforeTimestamp = new Date(before);
      filteredMessages = messages.filter(msg => new Date(msg.timestamp) < beforeTimestamp);
    }

    // Limit results
    const limitedMessages = filteredMessages.slice(-Math.min(limit, 100));

    res.status(200).json({
      success: true,
      data: {
        roomId,
        messages: limitedMessages,
        hasMore: messages.length > limitedMessages.length
      }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve chat messages'
    });
  }
});

// Create or join a chat room
router.post('/chat/room/:roomId/join', isAuthenticatedUser, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { roomType = 'general', roomName } = req.body;

    // Store room information
    const roomInfo = {
      id: roomId,
      name: roomName || roomId,
      type: roomType,
      createdBy: req.user._id,
      createdAt: new Date(),
      members: [req.user._id]
    };

    await cacheService.set(`room:${roomId}`, roomInfo, { ttl: 86400 });

    // Send WebSocket event to user's sockets to join the room
    const wsService = req.app.get('wsService');
    if (wsService) {
      // This would be handled by the WebSocket connection automatically
      // when the user is connected
    }

    res.status(200).json({
      success: true,
      message: 'Room joined successfully',
      data: roomInfo
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join room'
    });
  }
});

// Leave a chat room
router.post('/chat/room/:roomId/leave', isAuthenticatedUser, async (req, res) => {
  try {
    const { roomId } = req.params;

    // Remove user from room members
    const roomInfo = await cacheService.get(`room:${roomId}`);
    if (roomInfo && roomInfo.members) {
      roomInfo.members = roomInfo.members.filter(id => id !== req.user._id.toString());
      await cacheService.set(`room:${roomId}`, roomInfo, { ttl: 86400 });
    }

    res.status(200).json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave room'
    });
  }
});

// Get user's notifications
router.get('/notifications', isAuthenticatedUser, async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const userId = req.user._id;

    // Get cached notifications
    // In production, this would query a database with pagination
    const notifications = [];
    
    // This is a simplified implementation
    // You would typically have a proper notification system with database storage
    
    res.status(200).json({
      success: true,
      data: {
        notifications,
        hasMore: false,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notifications'
    });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', isAuthenticatedUser, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user._id;

    // Mark as read in cache
    await cacheService.set(
      `notification:read:${userId}:${notificationId}`,
      true,
      { ttl: 86400 }
    );

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
});

// Health check for WebSocket service
router.get('/health', async (req, res) => {
  try {
    const wsService = req.app.get('wsService');
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: {
        websocket: wsService ? 'running' : 'not-running',
        connectedUsers: wsService ? wsService.connectedUsers.size : 0,
        totalConnections: wsService ? wsService.socketUsers.size : 0,
        activeRooms: wsService ? wsService.rooms.size : 0
      }
    };

    const statusCode = wsService ? 200 : 503;

    res.status(statusCode).json({
      success: wsService ? true : false,
      data: health
    });
  } catch (error) {
    console.error('WebSocket health check error:', error);
    res.status(500).json({
      success: false,
      message: 'WebSocket health check failed',
      error: error.message
    });
  }
});

module.exports = router;