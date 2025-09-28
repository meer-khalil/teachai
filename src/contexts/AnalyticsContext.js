import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../util/api';

const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export const AnalyticsProvider = ({ children }) => {
  const [sessionId] = useState(() => 
    Math.random().toString(36).substring(2) + Date.now().toString(36)
  );
  
  const [isTrackingEnabled, setIsTrackingEnabled] = useState(true);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Track user interaction
  const trackInteraction = async (interactionData) => {
    if (!isTrackingEnabled) return;
    
    try {
      await api.post('/analytics/track/interaction', {
        sessionId,
        interaction: {
          ...interactionData,
          timestamp: new Date(),
          page: window.location.pathname,
          userAgent: navigator.userAgent
        }
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  // Track page view
  const trackPageView = async (page, additionalData = {}) => {
    await trackInteraction({
      type: 'page_view',
      page,
      data: {
        title: document.title,
        referrer: document.referrer,
        ...additionalData
      }
    });
  };

  // Track click event
  const trackClick = async (element, data = {}) => {
    await trackInteraction({
      type: 'click',
      element,
      data
    });
  };

  // Track feature usage
  const trackFeatureUsage = async (feature, action, data = {}) => {
    await trackInteraction({
      type: 'feature_usage',
      feature,
      action,
      data
    });
  };

  // Track content view
  const trackContentView = async (contentId, contentType = 'content', viewData = {}) => {
    try {
      await api.post(`/analytics/track/content/${contentId}/view`, {
        contentType,
        isUnique: true,
        device: getDeviceType(),
        ...viewData
      });
    } catch (error) {
      console.error('Content view tracking error:', error);
    }
  };

  // Track time spent on page
  const trackTimeSpent = (() => {
    let startTime = Date.now();
    let isActive = true;
    
    const updateActiveTime = () => {
      if (isActive) {
        const timeSpent = Date.now() - startTime;
        trackInteraction({
          type: 'time_spent',
          duration: timeSpent,
          page: window.location.pathname
        });
        startTime = Date.now();
      }
    };

    // Track when user becomes inactive/active
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActive = false;
        updateActiveTime();
      } else {
        isActive = true;
        startTime = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Update every 30 seconds
    const interval = setInterval(updateActiveTime, 30000);

    return () => {
      updateActiveTime();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  });

  // End session
  const endSession = async () => {
    try {
      await api.post('/analytics/track/session/end', { sessionId });
    } catch (error) {
      console.error('Session end tracking error:', error);
    }
  };

  // Get user analytics
  const getUserAnalytics = async (userId, filters = {}) => {
    setLoading(true);
    try {
      const response = await api.get(`/analytics/user/${userId}`, {
        params: filters
      });
      setUserAnalytics(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user analytics:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get dashboard analytics
  const getDashboardAnalytics = async (filters = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/dashboard', {
        params: filters
      });
      setDashboardData(response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get real-time analytics
  const getRealTimeAnalytics = async () => {
    try {
      const response = await api.get('/analytics/realtime');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
      return null;
    }
  };

  // Get content analytics
  const getContentAnalytics = async (contentId, filters = {}) => {
    try {
      const response = await api.get(`/analytics/content/${contentId}`, {
        params: filters
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching content analytics:', error);
      return null;
    }
  };

  // Create funnel
  const createFunnel = async (funnelData) => {
    try {
      const response = await api.post('/analytics/funnel', funnelData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating funnel:', error);
      throw error;
    }
  };

  // Get funnel analytics
  const getFunnelAnalytics = async (funnelId, filters = {}) => {
    try {
      const response = await api.get(`/analytics/funnel/${funnelId}`, {
        params: filters
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching funnel analytics:', error);
      return null;
    }
  };

  // Export analytics
  const exportAnalytics = async (type, format = 'json', filters = {}) => {
    try {
      const response = await api.get('/analytics/export', {
        params: { type, format, ...filters },
        responseType: format === 'csv' ? 'blob' : 'json'
      });

      if (format === 'csv') {
        // Create download link for CSV
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${type}_analytics_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else {
        return response.data;
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  };

  // Helper function to get device type
  const getDeviceType = () => {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  };

  // Set up automatic page view tracking
  useEffect(() => {
    if (!isTrackingEnabled) return;

    // Track initial page view
    trackPageView(window.location.pathname);

    // Track page changes (for SPA)
    const handleLocationChange = () => {
      trackPageView(window.location.pathname);
    };

    // Listen for popstate (back/forward buttons)
    window.addEventListener('popstate', handleLocationChange);

    // Track time spent
    const cleanup = trackTimeSpent();

    // Cleanup on unmount
    return () => {
      cleanup();
      window.removeEventListener('popstate', handleLocationChange);
      endSession();
    };
  }, [isTrackingEnabled]);

  // Track scroll depth
  useEffect(() => {
    if (!isTrackingEnabled) return;

    let maxScrollDepth = 0;
    let scrollDepthIntervals = [25, 50, 75, 100];
    let trackedIntervals = [];

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollDepth = Math.round((scrollTop / documentHeight) * 100);

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        // Track milestone scroll depths
        scrollDepthIntervals.forEach(interval => {
          if (scrollDepth >= interval && !trackedIntervals.includes(interval)) {
            trackedIntervals.push(interval);
            trackInteraction({
              type: 'scroll_depth',
              depth: interval,
              page: window.location.pathname
            });
          }
        });
      }
    };

    const throttledScroll = throttle(handleScroll, 250);
    window.addEventListener('scroll', throttledScroll);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, [isTrackingEnabled]);

  // Throttle function
  const throttle = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const contextValue = {
    sessionId,
    isTrackingEnabled,
    setIsTrackingEnabled,
    userAnalytics,
    dashboardData,
    loading,
    trackInteraction,
    trackPageView,
    trackClick,
    trackFeatureUsage,
    trackContentView,
    endSession,
    getUserAnalytics,
    getDashboardAnalytics,
    getRealTimeAnalytics,
    getContentAnalytics,
    createFunnel,
    getFunnelAnalytics,
    exportAnalytics
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};