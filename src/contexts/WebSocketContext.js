import React, { createContext, useContext, useEffect, useState } from 'react';
import webSocketService from '../services/webSocketService';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [presenceData, setPresenceData] = useState(new Map());
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    reconnectAttempts: 0,
    queuedMessages: 0
  });

  useEffect(() => {
    // Initialize WebSocket connection
    const token = localStorage.getItem('token');
    if (token) {
      connectWebSocket(token);
    }

    // Listen for token changes (login/logout)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          connectWebSocket(e.newValue);
        } else {
          disconnectWebSocket();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      disconnectWebSocket();
    };
  }, []);

  const connectWebSocket = (token) => {
    try {
      webSocketService.connect(token);

      // Set up connection status callback
      webSocketService.onConnectionChange = (connected) => {
        setIsConnected(connected);
        updateConnectionStatus();
      };

      // Set up notification callback
      webSocketService.onNotification = (notification) => {
        setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50
      };

      // Set up presence callback
      webSocketService.onPresenceUpdate = (data) => {
        setPresenceData(prev => {
          const newData = new Map(prev);
          newData.set(data.userId, data);
          return newData;
        });
      };

      // Update connection status periodically
      const statusInterval = setInterval(updateConnectionStatus, 5000);
      return () => clearInterval(statusInterval);

    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  };

  const disconnectWebSocket = () => {
    webSocketService.disconnect();
    setIsConnected(false);
    setNotifications([]);
    setPresenceData(new Map());
    setConnectionStatus({ connected: false, reconnectAttempts: 0, queuedMessages: 0 });
  };

  const updateConnectionStatus = () => {
    const status = webSocketService.getConnectionStatus();
    setConnectionStatus(status);
  };

  // WebSocket API methods
  const sendChatMessage = (roomId, message, type = 'text', metadata = {}) => {
    return webSocketService.sendChatMessage(roomId, message, type, metadata);
  };

  const joinChatRoom = (roomId, roomType = 'general') => {
    return webSocketService.joinChatRoom(roomId, roomType);
  };

  const leaveChatRoom = (roomId) => {
    return webSocketService.leaveChatRoom(roomId);
  };

  const sendAIMessage = (message, context = {}, chatbotId = null) => {
    return webSocketService.sendAIMessage(message, context, chatbotId);
  };

  const updatePresence = (status, customMessage = null) => {
    return webSocketService.updatePresence(status, customMessage);
  };

  const sendNotification = async (userId, notification) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/websocket/notification/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          ...notification
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  };

  const markNotificationAsRead = (notificationId) => {
    webSocketService.markNotificationAsRead(notificationId);
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const addEventListener = (event, callback) => {
    return webSocketService.addEventListener(event, callback);
  };

  const removeEventListener = (event, callback) => {
    return webSocketService.removeEventListener(event, callback);
  };

  const getOnlineUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/websocket/users/online', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.users;
      }
      return [];
    } catch (error) {
      console.error('Get online users error:', error);
      return [];
    }
  };

  const getUserPresence = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/websocket/presence/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Get user presence error:', error);
      return null;
    }
  };

  const getChatHistory = async (roomId, limit = 50, before = null) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ limit });
      if (before) params.append('before', before);

      const response = await fetch(`/api/v1/websocket/chat/room/${roomId}/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.data.messages;
      }
      return [];
    } catch (error) {
      console.error('Get chat history error:', error);
      return [];
    }
  };

  const contextValue = {
    // Connection state
    isConnected,
    connectionStatus,
    
    // Data
    notifications,
    presenceData,
    
    // Chat methods
    sendChatMessage,
    joinChatRoom,
    leaveChatRoom,
    getChatHistory,
    
    // AI methods
    sendAIMessage,
    
    // Notification methods
    sendNotification,
    markNotificationAsRead,
    clearNotifications,
    
    // Presence methods
    updatePresence,
    getUserPresence,
    getOnlineUsers,
    
    // Event management
    addEventListener,
    removeEventListener,
    
    // Connection management
    connect: connectWebSocket,
    disconnect: disconnectWebSocket,
    
    // Service access
    webSocketService
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;