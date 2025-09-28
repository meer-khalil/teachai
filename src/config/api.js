// Centralized API configuration for TeachAI Frontend
// This file consolidates all API endpoint configurations

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Base API URLs
export const API_CONFIG = {
  // Main backend API (Node.js/Express)
  BACKEND: {
    BASE_URL: process.env.REACT_APP_API_URL || (isDevelopment ? 'http://localhost:4000/api/v1' : '/api/v1'),
    TIMEOUT: 30000,
  },
  
  // Flask API (AI/ML services)
  FLASK: {
    BASE_URL: process.env.REACT_APP_FLASK_API_URL || (isDevelopment ? 'http://localhost:5000' : '/flask'),
    TIMEOUT: 60000, // Longer timeout for AI operations
  },
  
  // WebSocket configuration
  WEBSOCKET: {
    URL: process.env.REACT_APP_WS_URL || (isDevelopment ? 'ws://localhost:4000' : `wss://${window.location.host}`),
  },
  
  // Site configuration
  SITE: {
    URL: isDevelopment ? 'http://localhost:3000' : 'https://www.teachassistai.com',
    NAME: 'TeachAI',
  }
};

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
    REFRESH: '/refresh',
  },
  
  // Content management
  CONTENT: '/content',
  
  // Analytics
  ANALYTICS: '/analytics',
  ADVANCED_ANALYTICS: '/advanced-analytics',
  
  // Search
  SEARCH: '/search',
  
  // Collaboration
  COLLABORATION: '/collaboration',
  
  // WebSocket
  WEBSOCKET: '/websocket',
  
  // Cache
  CACHE: '/cache',
};

// Helper function to get full API URL
export const getApiUrl = (endpoint, apiType = 'BACKEND') => {
  const baseUrl = API_CONFIG[apiType].BASE_URL;
  return `${baseUrl}${endpoint}`;
};

// Export for backward compatibility
export const { BACKEND, FLASK, WEBSOCKET, SITE } = API_CONFIG;
export default API_CONFIG;