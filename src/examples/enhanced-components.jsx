/**
 * Example React Component with Enhanced Error Handling
 * 
 * This file demonstrates how to use the comprehensive error handling
 * system including error boundaries and the enhanced API client.
 */

import React, { useState, useEffect } from 'react';
import { ErrorBoundary, PageErrorBoundary, ComponentErrorBoundary } from '../utils/error-handler';
import { apiClient } from '../utils/api-client'; // Your enhanced API client

// Example: Chat Component with Comprehensive Error Handling
const EnhancedChatComponent = () => {
    const [message, setMessage] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);

    // Error recovery function
    const handleError = (error, errorInfo) => {
        console.error('Chat Component Error:', error, errorInfo);
        
        // Log error to monitoring system (if available)
        if (window.errorLogger) {
            window.errorLogger.logError(error, {
                component: 'EnhancedChatComponent',
                props: { message, chatHistoryLength: chatHistory.length },
                errorInfo
            });
        }

        // Set user-friendly error message
        setError({
            type: error.name,
            message: error.message,
            userMessage: 'Something went wrong with the chat. Please try again.',
            canRetry: true
        });
    };

    // Retry mechanism
    const retryOperation = () => {
        setError(null);
        setRetryCount(prev => prev + 1);
        
        // Clear any cached data that might be causing issues
        if (retryCount > 2) {
            setChatHistory([]);
            setMessage('');
        }
    };

    // Send message with enhanced error handling
    const sendMessage = async () => {
        if (!message.trim()) {
            setError({
                type: 'ValidationError',
                message: 'Message cannot be empty',
                userMessage: 'Please enter a message before sending.',
                canRetry: false
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Use enhanced API client with automatic retry and error handling
            const response = await apiClient.post('/api/v1/chat', {
                message: message.trim(),
                chatbotType: 'general'
            }, {
                timeout: 30000,
                retry: {
                    maxRetries: 3,
                    retryDelay: 1000,
                    retryCondition: (error) => {
                        // Retry on network errors or 5xx server errors
                        return !error.response || error.response.status >= 500;
                    }
                }
            });

            // Add to chat history
            setChatHistory(prev => [...prev, {
                id: Date.now(),
                type: 'user',
                message: message,
                timestamp: new Date()
            }, {
                id: Date.now() + 1,
                type: 'bot',
                message: response.data.response,
                timestamp: new Date()
            }]);

            setMessage('');
            setRetryCount(0); // Reset retry count on success

        } catch (error) {
            console.error('Send Message Error:', error);

            let userError = {
                type: error.name || 'UnknownError',
                message: error.message,
                canRetry: true
            };

            // Handle different error types with user-friendly messages
            if (error.name === 'ValidationError') {
                userError.userMessage = 'Please check your message and try again.';
                userError.canRetry = false;
            } else if (error.name === 'AuthenticationError') {
                userError.userMessage = 'Please log in again to continue.';
                userError.canRetry = false;
            } else if (error.code === 'NETWORK_ERROR') {
                userError.userMessage = 'Network error. Please check your connection and try again.';
            } else if (error.response?.status === 429) {
                userError.userMessage = 'Too many requests. Please wait a moment before trying again.';
            } else if (error.response?.status >= 500) {
                userError.userMessage = 'Server error. Our team has been notified. Please try again later.';
            } else if (error.code === 'TIMEOUT') {
                userError.userMessage = 'Request timed out. Please try again.';
            } else {
                userError.userMessage = 'An unexpected error occurred. Please try again.';
            }

            setError(userError);

            // Log error for monitoring
            if (window.errorLogger) {
                window.errorLogger.logError(error, {
                    component: 'EnhancedChatComponent',
                    operation: 'sendMessage',
                    message: message,
                    retryCount
                });
            }

        } finally {
            setLoading(false);
        }
    };

    // Handle network status changes
    useEffect(() => {
        const handleOnline = () => {
            if (error?.code === 'NETWORK_ERROR') {
                setError(null);
            }
        };

        const handleOffline = () => {
            setError({
                type: 'NetworkError',
                message: 'No internet connection',
                userMessage: 'You are currently offline. Please check your internet connection.',
                canRetry: false
            });
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [error]);

    // Error display component
    const ErrorDisplay = ({ error, onRetry, onDismiss }) => (
        <div className="error-container" style={{
            backgroundColor: '#fee',
            border: '1px solid #fcc',
            borderRadius: '4px',
            padding: '12px',
            margin: '8px 0',
            color: '#c33'
        }}>
            <div className="error-message">
                <strong>Error:</strong> {error.userMessage || error.message}
            </div>
            <div className="error-actions" style={{ marginTop: '8px' }}>
                {error.canRetry && (
                    <button 
                        onClick={onRetry}
                        style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            marginRight: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        Try Again
                    </button>
                )}
                <button 
                    onClick={onDismiss}
                    style={{
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '4px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Dismiss
                </button>
            </div>
        </div>
    );

    return (
        <div className="enhanced-chat-component">
            <div className="chat-header">
                <h3>AI Chat Assistant</h3>
                {loading && <div className="loading-indicator">Processing...</div>}
            </div>

            {error && (
                <ErrorDisplay
                    error={error}
                    onRetry={retryOperation}
                    onDismiss={() => setError(null)}
                />
            )}

            <div className="chat-history" style={{
                height: '400px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                padding: '12px',
                marginBottom: '12px'
            }}>
                {chatHistory.map(item => (
                    <div 
                        key={item.id} 
                        className={`chat-message ${item.type}`}
                        style={{
                            marginBottom: '12px',
                            padding: '8px',
                            borderRadius: '8px',
                            backgroundColor: item.type === 'user' ? '#e3f2fd' : '#f5f5f5'
                        }}
                    >
                        <div className="message-content">{item.message}</div>
                        <div className="message-timestamp" style={{
                            fontSize: '0.8em',
                            color: '#666',
                            marginTop: '4px'
                        }}>
                            {item.timestamp.toLocaleTimeString()}
                        </div>
                    </div>
                ))}
            </div>

            <div className="chat-input">
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !loading && !error?.type === 'NetworkError') {
                                sendMessage();
                            }
                        }}
                        placeholder="Type your message..."
                        disabled={loading || error?.type === 'NetworkError'}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                        }}
                    />
                    <button 
                        onClick={sendMessage}
                        disabled={loading || !message.trim() || error?.type === 'NetworkError'}
                        style={{
                            backgroundColor: loading ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Example: User Profile Component with Error Boundary
const EnhancedUserProfile = ({ userId }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await apiClient.get(`/api/v1/users/${userId}`);
            setUser(response.data.user);

        } catch (error) {
            console.error('Fetch User Profile Error:', error);
            setError(error);

            // Log error for monitoring
            if (window.errorLogger) {
                window.errorLogger.logError(error, {
                    component: 'EnhancedUserProfile',
                    operation: 'fetchUserProfile',
                    userId
                });
            }

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserProfile();
        }
    }, [userId]);

    if (loading) {
        return <div>Loading user profile...</div>;
    }

    if (error) {
        return (
            <div className="user-profile-error">
                <h3>Unable to Load Profile</h3>
                <p>We couldn't load the user profile. Please try again.</p>
                <button onClick={fetchUserProfile}>Retry</button>
            </div>
        );
    }

    if (!user) {
        return <div>User not found.</div>;
    }

    return (
        <div className="user-profile">
            <h3>User Profile</h3>
            <div><strong>Name:</strong> {user.name}</div>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Role:</strong> {user.role}</div>
            <div><strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
        </div>
    );
};

// Example: Main App Component with Nested Error Boundaries
const EnhancedApp = () => {
    return (
        <ErrorBoundary
            fallback={<div>Something went wrong with the application. Please refresh the page.</div>}
            onError={(error, errorInfo) => {
                console.error('Application Error:', error, errorInfo);
                if (window.errorLogger) {
                    window.errorLogger.logError(error, {
                        component: 'EnhancedApp',
                        errorInfo,
                        level: 'application'
                    });
                }
            }}
        >
            <div className="app">
                <header>
                    <h1>TeachAI Platform</h1>
                </header>

                <main>
                    {/* Chat section with page-level error boundary */}
                    <PageErrorBoundary
                        fallback={
                            <div>
                                <h3>Chat Service Unavailable</h3>
                                <p>The chat service is temporarily unavailable. Please try again later.</p>
                            </div>
                        }
                    >
                        <section className="chat-section">
                            <ComponentErrorBoundary
                                fallback={<div>Chat component error. Trying to recover...</div>}
                            >
                                <EnhancedChatComponent />
                            </ComponentErrorBoundary>
                        </section>
                    </PageErrorBoundary>

                    {/* User profile section with component-level error boundary */}
                    <ComponentErrorBoundary
                        fallback={<div>User profile unavailable.</div>}
                    >
                        <section className="profile-section">
                            <EnhancedUserProfile userId="current-user-id" />
                        </section>
                    </ComponentErrorBoundary>
                </main>
            </div>
        </ErrorBoundary>
    );
};

export {
    EnhancedChatComponent,
    EnhancedUserProfile,
    EnhancedApp
};