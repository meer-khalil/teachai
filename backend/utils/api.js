const axios = require('axios');

// Use environment variable for Flask API URL, fallback to localhost:5000
const FLASK_API_URL = process.env.FLASK_API_URL || 'http://127.0.0.1:5000';

const api = axios.create({
  baseURL: FLASK_API_URL, // Flask API base URL
  headers: {
    'Content-Type': 'application/json',
  }
});


module.exports = api