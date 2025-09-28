import React, { useState, useEffect } from 'react';
import webSocketService from '../../services/webSocketService';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Connect to WebSocket if not connected
    if (!webSocketService.isSocketConnected()) {
      const token = localStorage.getItem('token');
      if (token) {
        webSocketService.connect(token);
      }
    }

    // Set up notification callback
    webSocketService.onNotification = (notification) => {
      console.log('📢 New notification received:', notification);
      
      // Add notification to list
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission granted
      showBrowserNotification(notification);
      
      // Play notification sound
      playNotificationSound();
      
      // Show toast notification
      showToastNotification(notification);
    };

    // Load existing notifications
    loadNotifications();

    // Clean up old notifications periodically
    const cleanupInterval = setInterval(() => {
      setNotifications(prev => {
        const now = new Date();
        return prev.filter(notification => {
          const notificationTime = new Date(notification.timestamp);
          const hoursDiff = (now - notificationTime) / (1000 * 60 * 60);
          return hoursDiff < 24; // Keep notifications for 24 hours
        });
      });
    }, 60000); // Check every minute

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/websocket/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
        
        // Count unread notifications
        const unread = data.data.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const showBrowserNotification = (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo-removebg-preview.png',
        tag: notification.id,
        requireInteraction: notification.type === 'urgent'
      });
    }
  };

  const playNotificationSound = () => {
    try {
      // Create a simple notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  };

  const showToastNotification = (notification) => {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${notification.type || 'info'}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${notification.title}</div>
        <div class="toast-message">${notification.message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to toast container or create one
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/websocket/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Send WebSocket event
      webSocketService.markNotificationAsRead(notificationId);
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  const clearAllNotifications = () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showToastNotification({
          title: 'Notifications Enabled',
          message: 'You will now receive browser notifications',
          type: 'success'
        });
      }
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'urgent': return '🚨';
      default: return '🔔';
    }
  };

  return (
    <>
      <div className="notification-center">
        <div className="notification-trigger" onClick={() => setIsOpen(!isOpen)}>
          <span className="notification-icon">🔔</span>
          {unreadCount > 0 && (
            <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </div>

        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="mark-all-read-btn"
                  >
                    Mark all read
                  </button>
                )}
                <button 
                  onClick={clearAllNotifications}
                  className="clear-all-btn"
                >
                  Clear all
                </button>
              </div>
            </div>

            {notifications.length === 0 ? (
              <div className="no-notifications">
                <div className="no-notifications-icon">🔕</div>
                <p>No notifications yet</p>
                {Notification.permission !== 'granted' && (
                  <button 
                    onClick={requestNotificationPermission}
                    className="enable-notifications-btn"
                  >
                    Enable Browser Notifications
                  </button>
                )}
              </div>
            ) : (
              <div className="notifications-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.read ? 'unread' : ''} notification-${notification.type || 'info'}`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className="notification-content">
                      <div className="notification-icon-text">
                        <span className="notification-type-icon">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="notification-text">
                          <div className="notification-title">
                            {notification.title}
                          </div>
                          <div className="notification-message">
                            {notification.message}
                          </div>
                          {notification.sender && (
                            <div className="notification-sender">
                              from {notification.sender.firstName} {notification.sender.lastName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="notification-meta">
                        <span className="notification-time">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <span className="unread-indicator">●</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="notification-footer">
              <span className="connection-status">
                {webSocketService.isSocketConnected() ? '🟢 Live' : '🔴 Offline'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Toast container will be created dynamically */}
      <style jsx global>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          pointer-events: none;
        }

        .toast-notification {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          border-left: 4px solid;
          max-width: 400px;
          pointer-events: all;
          animation: slideInRight 0.3s ease-out;
        }

        .toast-info { border-left-color: #3b82f6; }
        .toast-success { border-left-color: #10b981; }
        .toast-warning { border-left-color: #f59e0b; }
        .toast-error { border-left-color: #ef4444; }

        .toast-content {
          flex: 1;
        }

        .toast-title {
          font-weight: 600;
          margin-bottom: 4px;
          color: #1f2937;
        }

        .toast-message {
          color: #6b7280;
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .toast-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #9ca3af;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toast-close:hover {
          color: #6b7280;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default NotificationCenter;