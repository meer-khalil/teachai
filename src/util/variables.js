// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Base URLs based on environment
const site = isDevelopment ? 'http://localhost:3000' : 'https://www.teachassistai.com';
const backend_resourse = isDevelopment ? 'http://localhost:4000' : 'https://www.teachassistai.com';
const backend_url = isDevelopment ? 'http://localhost:4000/api/v1' : 'https://www.teachassistai.com/api/v1';
const addstory_url = isDevelopment ? 'http://localhost:4000/api/v1' : 'https://www.teachassistai.com/api/v1';

module.exports = {
    site,
    backend_url,
    backend_resourse,
    addstory_url
}