import React, { useState, useEffect } from 'react';
import webSocketService from '../../services/webSocketService';
import './WebSocketStatus.css';

const WebSocketStatus = () => {
  const [status, setStatus] = useState({
    connected: false,
    socketId: null,
    reconnectAttempts: 0,
    queuedMessages: 0
  });
  const [showDetails, setShowDetails] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    // Set up connection status callback
    webSocketService.onConnectionChange = (connected) => {
      updateStatus();
    };

    // Update status initially and periodically
    updateStatus();
    const statusInterval = setInterval(updateStatus, 1000);

    // Load online users periodically
    loadOnlineUsers();
    const usersInterval = setInterval(loadOnlineUsers, 30000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(usersInterval);
    };
  }, []);

  const updateStatus = () => {
    const connectionStatus = webSocketService.getConnectionStatus();
    setStatus(connectionStatus);
  };

  const loadOnlineUsers = async () => {
    if (!webSocketService.isSocketConnected()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/websocket/users/online', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOnlineUsers(data.data.users);
      }
    } catch (error) {
      console.error('Failed to load online users:', error);
    }
  };

  const handleReconnect = () => {
    const token = localStorage.getItem('token');
    if (token) {
      webSocketService.disconnect();
      setTimeout(() => {
        webSocketService.connect(token);
      }, 1000);
    }
  };

  const getStatusColor = () => {
    if (status.connected) return '#10b981'; // Green
    if (status.reconnectAttempts > 0) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getStatusText = () => {
    if (status.connected) return 'Connected';
    if (status.reconnectAttempts > 0) return 'Reconnecting...';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (status.connected) return '🟢';
    if (status.reconnectAttempts > 0) return '🟡';
    return '🔴';
  };

  return (
    <div className="websocket-status">
      <div 
        className="status-indicator"
        onClick={() => setShowDetails(!showDetails)}
        title="WebSocket Connection Status"
      >
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">{getStatusText()}</span>
        {status.queuedMessages > 0 && (
          <span className="queued-messages" title={`${status.queuedMessages} queued messages`}>
            📤{status.queuedMessages}
          </span>
        )}
      </div>

      {showDetails && (
        <div className="status-details">
          <div className="details-header">
            <h4>WebSocket Status</h4>
            <button 
              className="close-details"
              onClick={() => setShowDetails(false)}
            >
              ×
            </button>
          </div>

          <div className="status-info">
            <div className="info-item">
              <span className="info-label">Status:</span>
              <span 
                className="info-value"
                style={{ color: getStatusColor() }}
              >
                {getStatusText()}
              </span>
            </div>

            {status.socketId && (
              <div className="info-item">
                <span className="info-label">Socket ID:</span>
                <span className="info-value socket-id">
                  {status.socketId.substring(0, 8)}...
                </span>
              </div>
            )}

            {status.reconnectAttempts > 0 && (
              <div className="info-item">
                <span className="info-label">Reconnect Attempts:</span>
                <span className="info-value">
                  {status.reconnectAttempts}
                </span>
              </div>
            )}

            {status.queuedMessages > 0 && (
              <div className="info-item">
                <span className="info-label">Queued Messages:</span>
                <span className="info-value">
                  {status.queuedMessages}
                </span>
              </div>
            )}
          </div>

          {onlineUsers.length > 0 && (
            <div className="online-users">
              <div className="online-users-header">
                <span>👥 Online Users ({onlineUsers.length})</span>
              </div>
              <div className="online-users-list">
                {onlineUsers.slice(0, 5).map((user, index) => (
                  <div key={user.userId} className="online-user">
                    <span className="user-status-dot" style={{ 
                      backgroundColor: user.status === 'online' ? '#10b981' : 
                                     user.status === 'away' ? '#f59e0b' : 
                                     user.status === 'busy' ? '#ef4444' : '#6b7280'
                    }}></span>
                    <span className="user-name">User {index + 1}</span>
                  </div>
                ))}
                {onlineUsers.length > 5 && (
                  <div className="more-users">
                    +{onlineUsers.length - 5} more
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="status-actions">
            {!status.connected && (
              <button 
                className="reconnect-btn"
                onClick={handleReconnect}
              >
                🔄 Reconnect
              </button>
            )}
            <button 
              className="test-btn"
              onClick={() => {
                if (status.connected) {
                  webSocketService.emit('ping', { timestamp: new Date() });
                  console.log('WebSocket ping sent');
                }
              }}
              disabled={!status.connected}
            >
              📡 Test Connection
            </button>
          </div>

          <div className="status-features">
            <div className="features-header">Available Features:</div>
            <div className="features-list">
              <div className={`feature ${status.connected ? 'enabled' : 'disabled'}`}>
                💬 Real-time Chat
              </div>
              <div className={`feature ${status.connected ? 'enabled' : 'disabled'}`}>
                🔔 Live Notifications
              </div>
              <div className={`feature ${status.connected ? 'enabled' : 'disabled'}`}>
                👥 Presence Tracking
              </div>
              <div className={`feature ${status.connected ? 'enabled' : 'disabled'}`}>
                🤖 AI Chat Streaming
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus;