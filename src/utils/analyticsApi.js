import React from 'react';

// Base API URL - should be moved to environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

// Create axios-like fetch wrapper with error handling
const fetchWithAuth = async (url, options = {}) => {
  try {
    // Get auth token from localStorage or context
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const config = {
      method: 'GET',
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Main analytics data fetcher
export const fetchAnalyticsData = async (endpoint, params = {}) => {
  const searchParams = new URLSearchParams(params);
  const url = `${API_BASE_URL}/analytics/${endpoint}?${searchParams}`;
  
  return await fetchWithAuth(url);
};

// Specific analytics API functions

// Track an analytics event
export const trackAnalyticsEvent = async (eventType, metadata = {}) => {
  const url = `${API_BASE_URL}/analytics/track`;
  
  return await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({
      eventType,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        sessionId: getSessionId(),
      },
    }),
  });
};

// Get dashboard overview data
export const getDashboardOverview = async (timeRange = '7d') => {
  return await fetchAnalyticsData('dashboard', { range: timeRange });
};

// Get user analytics data
export const getUserAnalytics = async (timeRange = '30d') => {
  return await fetchAnalyticsData('users', { range: timeRange });
};

// Get content analytics data
export const getContentAnalytics = async (timeRange = '30d') => {
  return await fetchAnalyticsData('content', { range: timeRange });
};

// Get performance analytics data
export const getPerformanceAnalytics = async (timeRange = '24h') => {
  return await fetchAnalyticsData('performance', { range: timeRange });
};

// Get user behavior insights
export const getUserBehaviorInsights = async (userId = null) => {
  const endpoint = userId ? `behavior/${userId}` : 'behavior';
  return await fetchAnalyticsData(endpoint);
};

// Export analytics data
export const exportAnalyticsData = async (type, format = 'json', timeRange = '30d') => {
  return await fetchAnalyticsData('export', { type, format, range: timeRange });
};

// Helper function to get or generate session ID
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  
  return sessionId;
};

// Generate a unique session ID
const generateSessionId = () => {
  return 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
};

// Event tracking helpers

// Track page view
export const trackPageView = (page) => {
  return trackAnalyticsEvent('page_view', { page });
};

// Track user login
export const trackUserLogin = () => {
  return trackAnalyticsEvent('user_login');
};

// Track user logout
export const trackUserLogout = () => {
  return trackAnalyticsEvent('user_logout');
};

// Track chatbot interaction
export const trackChatbotInteraction = (chatbotType, duration = null) => {
  return trackAnalyticsEvent('chatbot_interaction', { chatbotType, duration });
};

// Track quiz start
export const trackQuizStart = (quizId, subject = null) => {
  return trackAnalyticsEvent('quiz_start', { quizId, subject });
};

// Track quiz completion
export const trackQuizComplete = (quizId, score, subject = null, duration = null) => {
  return trackAnalyticsEvent('quiz_complete', { 
    quizId, 
    score, 
    subject, 
    duration 
  });
};

// Track lesson start
export const trackLessonStart = (lessonId, subject = null) => {
  return trackAnalyticsEvent('lesson_start', { lessonId, subject });
};

// Track lesson completion
export const trackLessonComplete = (lessonId, duration = null, subject = null) => {
  return trackAnalyticsEvent('lesson_complete', { lessonId, duration, subject });
};

// Track AI service request
export const trackAIRequest = (aiService, duration = null) => {
  return trackAnalyticsEvent('ai_request', { aiService, duration });
};

// Track file upload
export const trackFileUpload = (fileType, fileSize = null) => {
  return trackAnalyticsEvent('file_upload', { fileType, fileSize });
};

// Track error occurrence
export const trackError = (errorType, errorMessage = null) => {
  return trackAnalyticsEvent('error_occurred', { errorType, errorMessage });
};

// Batch event tracking for efficiency
export const trackMultipleEvents = async (events) => {
  const url = `${API_BASE_URL}/analytics/track/batch`;
  
  return await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify({
      events: events.map(event => ({
        ...event,
        metadata: {
          ...event.metadata,
          timestamp: new Date().toISOString(),
          sessionId: getSessionId(),
        },
      })),
    }),
  });
};

// Analytics hook for React components
export const useAnalytics = () => {
  const trackEvent = (eventType, metadata = {}) => {
    // Non-blocking event tracking
    trackAnalyticsEvent(eventType, metadata).catch(error => {
      console.warn('Failed to track analytics event:', error);
    });
  };

  const trackTimed = (eventType, metadata = {}) => {
    const startTime = Date.now();
    
    return {
      finish: (additionalMetadata = {}) => {
        const duration = Date.now() - startTime;
        trackEvent(eventType, {
          ...metadata,
          ...additionalMetadata,
          duration,
        });
      },
    };
  };

  return {
    track: trackEvent,
    trackTimed,
    trackPageView,
    trackUserLogin,
    trackUserLogout,
    trackChatbotInteraction,
    trackQuizStart,
    trackQuizComplete,
    trackLessonStart,
    trackLessonComplete,
    trackAIRequest,
    trackFileUpload,
    trackError,
  };
};

// React hook for fetching analytics data
export const useAnalyticsData = (endpoint, params = {}, refreshInterval = null) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAnalyticsData(endpoint, params);
      setData(result.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, JSON.stringify(params)]);

  React.useEffect(() => {
    fetchData();

    if (refreshInterval) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refetch: fetchData };
};

// Performance monitoring
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const startTime = performance.now();
    
    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;
      
      // Track performance metric
      trackAnalyticsEvent('performance_metric', {
        name,
        duration,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Track performance metric with error
      trackAnalyticsEvent('performance_metric', {
        name,
        duration,
        success: false,
        error: error.message,
      });
      
      throw error;
    }
  };
};

export default {
  fetchAnalyticsData,
  trackAnalyticsEvent,
  getDashboardOverview,
  getUserAnalytics,
  getContentAnalytics,
  getPerformanceAnalytics,
  getUserBehaviorInsights,
  exportAnalyticsData,
  useAnalytics,
  useAnalyticsData,
  measurePerformance,
};