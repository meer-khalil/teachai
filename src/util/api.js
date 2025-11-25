import axios from 'axios';
import { backend_url } from './variables';

const api = axios.create({
  baseURL: backend_url, // Replace this with your desired base URL
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies and credentials for CORS
  timeout: 10000 // 10 second timeout
});

// Request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log('🚀 API Request:', config.method?.toUpperCase(), config.url);
  console.log('🚀 Request data:', config.data);
  return config;
}, (error) => {
  console.error('❌ Request Error:', error);
  return Promise.reject(error);
});

// Response interceptor for debugging
api.interceptors.response.use((response) => {
  console.log('✅ API Response:', response.status, response.config.url);
  return response;
}, (error) => {
  console.error('❌ API Error:', error.response?.status, error.response?.data || error.message);
  return Promise.reject(error);
});

export default api;