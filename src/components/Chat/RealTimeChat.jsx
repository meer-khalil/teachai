import React, { useState, useEffect, useRef } from 'react';
import webSocketService from '../../services/webSocketService';
import './RealTimeChat.css';

const RealTimeChat = ({ roomId = 'general', roomType = 'general' }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [connected, setConnected] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket if not connected
    if (!webSocketService.isSocketConnected()) {
      const token = localStorage.getItem('token');
      if (token) {
        webSocketService.connect(token);
      }
    }

    // Set up connection status callback
    webSocketService.onConnectionChange = (status) => {
      setConnected(status);
      if (status) {
        // Join the chat room when connected
        webSocketService.joinChatRoom(roomId, roomType);
      }
    };

    // Set up chat message callback
    webSocketService.onChatMessage = (message) => {
      setMessages(prev => [...prev, message]);
    };

    // Set up event listeners
    const handleRoomJoined = (data) => {
      console.log('Joined room:', data);
      setRoomInfo(data);
      // Load room message history
      loadMessageHistory();
    };

    const handleUserJoined = (data) => {
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        type: 'system',
        message: `${data.user.firstName} ${data.user.lastName} joined the chat`,
        timestamp: data.timestamp,
        system: true
      }]);
    };

    const handleUserLeft = (data) => {
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        type: 'system',
        message: `${data.user.firstName} ${data.user.lastName} left the chat`,
        timestamp: data.timestamp,
        system: true
      }]);
    };

    const handleTyping = (data) => {
      if (data.isTyping) {
        setTypingUsers(prev => new Set([...prev, data.user.firstName + ' ' + data.user.lastName]));
      } else {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.user.firstName + ' ' + data.user.lastName);
          return newSet;
        });
      }

      // Clear typing after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.user.firstName + ' ' + data.user.lastName);
          return newSet;
        });
      }, 3000);
    };

    const handleMessageDelivered = (data) => {
      setMessages(prev => prev.map(msg => 
        msg.id === data.messageId ? { ...msg, delivered: true } : msg
      ));
    };

    // Add event listeners
    webSocketService.addEventListener('chat:room-joined', handleRoomJoined);
    webSocketService.addEventListener('chat:user-joined', handleUserJoined);
    webSocketService.addEventListener('chat:user-left', handleUserLeft);
    webSocketService.addEventListener('chat:typing', handleTyping);
    webSocketService.addEventListener('chat:delivered', handleMessageDelivered);

    // Join room if already connected
    if (webSocketService.isSocketConnected()) {
      setConnected(true);
      webSocketService.joinChatRoom(roomId, roomType);
    }

    // Cleanup
    return () => {
      webSocketService.removeEventListener('chat:room-joined', handleRoomJoined);
      webSocketService.removeEventListener('chat:user-joined', handleUserJoined);
      webSocketService.removeEventListener('chat:user-left', handleUserLeft);
      webSocketService.removeEventListener('chat:typing', handleTyping);
      webSocketService.removeEventListener('chat:delivered', handleMessageDelivered);
      
      // Leave room
      webSocketService.leaveChatRoom(roomId);
    };
  }, [roomId, roomType]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessageHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/websocket/chat/room/${roomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Failed to load message history:', error);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (!connected) {
      alert('Not connected to chat server');
      return;
    }

    // Send message via WebSocket
    webSocketService.sendChatMessage(roomId, newMessage.trim());
    
    // Clear input
    setNewMessage('');
    
    // Stop typing indicator
    if (isTyping) {
      webSocketService.sendTypingIndicator(roomId, false);
      setIsTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    // Send typing indicator
    if (!isTyping && connected) {
      webSocketService.sendTypingIndicator(roomId, true);
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        webSocketService.sendTypingIndicator(roomId, false);
        setIsTyping(false);
      }
    }, 2000);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="realtime-chat">
      <div className="chat-header">
        <div className="room-info">
          <h3>💬 {roomInfo?.name || roomId}</h3>
          <span className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
        {roomInfo && (
          <div className="room-stats">
            <span>👥 {roomInfo.memberCount || 0} members</span>
          </div>
        )}
      </div>

      <div className="messages-container">
        <div className="messages-list">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.system ? 'system-message' : ''} ${
                message.sender?._id === webSocketService.socket?.userId ? 'own-message' : ''
              }`}
            >
              {!message.system && (
                <div className="message-header">
                  <span className="sender-name">
                    {message.sender.firstName} {message.sender.lastName}
                  </span>
                  <span className="message-time">
                    {formatTimestamp(message.timestamp)}
                  </span>
                  {message.delivered && (
                    <span className="delivery-status">✓</span>
                  )}
                </div>
              )}
              <div className="message-content">
                {message.type === 'text' ? (
                  <p>{message.message}</p>
                ) : (
                  <div className="special-message">
                    {message.message}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            <div className="typing-animation">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="message-input-form">
        <div className="input-group">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder={connected ? "Type a message..." : "Connecting..."}
            disabled={!connected}
            className="message-input"
          />
          <button
            type="submit"
            disabled={!connected || !newMessage.trim()}
            className="send-button"
          >
            📤 Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default RealTimeChat;