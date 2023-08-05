import axios from 'axios';

const api = axios.create({
  baseURL: 'https://www.teachassistai.com/api/v1', // Replace this with your desired base URL
  headers: {
    'Content-Type': 'application/json',
  }
});


api.interceptors.request.use((config) => {
  console.log('Request Headers:', config.headers);
  return config;
}, (error) => {
  console.error('Request Error:', error);
  return Promise.reject(error);
});


export default api;