# TeachAI API Configuration Guide

## Overview
This document explains the API configuration for the TeachAI platform, ensuring proper routing between frontend, backend, and AI services.

## Architecture
```
Frontend (React) → Backend (Node.js/Express) → Database (MongoDB)
       ↓
   Flask API (AI/ML Services)
```

## Service Ports
- **Frontend (React)**: `http://localhost:3000`
- **Backend (Node.js)**: `http://localhost:4000`
- **Flask API (AI/ML)**: `http://localhost:5000`
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`

## Environment Configuration

### Development (.env.development)
```bash
# Main API endpoints
REACT_APP_API_URL=http://localhost:4000/api/v1
REACT_APP_FLASK_API_URL=http://localhost:5000
FLASK_API_URL=http://localhost:5000

# Service ports
BACKEND_PORT=4000
FLASK_PORT=5000
FRONTEND_PORT=3000
```

### Production
```bash
# Production URLs
REACT_APP_API_URL=https://www.teachassistai.com/api/v1
REACT_APP_FLASK_API_URL=https://www.teachassistai.com/flask
FLASK_API_URL=https://www.teachassistai.com/flask
```

## API Endpoints Structure

### Backend API (Node.js/Express) - Port 4000
- **Base URL**: `http://localhost:4000/api/v1`
- **Routes**:
  - `/auth` - Authentication
  - `/content` - Content management
  - `/analytics` - Analytics data
  - `/advanced-analytics` - Advanced analytics
  - `/search` - Search functionality
  - `/collaboration` - Real-time collaboration
  - `/websocket` - WebSocket connections
  - `/cache` - Caching operations

### Flask API (AI/ML Services) - Port 5000
- **Base URL**: `http://localhost:5000`
- **Routes**:
  - `/api/chatbot` - AI chatbot
  - `/api/quiz` - Quiz generation
  - `/api/lesson` - Lesson planning
  - `/api/grade` - Essay grading
  - `/api/presentation` - AI presentations

## Configuration Files

### Frontend Configuration
1. **`src/config/api.js`** - Centralized API configuration
2. **`src/util/variables.js`** - Legacy configuration (now environment-aware)
3. **`src/utils/error-handler.js`** - API client with error handling
4. **`src/utils/analyticsApi.js`** - Analytics API utilities

### Backend Configuration
1. **`backend/config/database.js`** - Database connection
2. **`backend/utils/api.js`** - Flask API client
3. **`backend/.env`** - Environment variables

## Usage Examples

### Frontend API Calls
```javascript
// Using the centralized config
import { getApiUrl, API_ENDPOINTS } from '../config/api';

// Get backend API URL
const backendUrl = getApiUrl(API_ENDPOINTS.CONTENT);
// Result: http://localhost:4000/api/v1/content

// Get Flask API URL  
const flaskUrl = getApiUrl('/chatbot', 'FLASK');
// Result: http://localhost:5000/chatbot
```

### Environment Variable Usage
```javascript
// React components
const apiUrl = process.env.REACT_APP_API_URL;

// Backend services
const flaskUrl = process.env.FLASK_API_URL;
```

## Troubleshooting

### Common Issues
1. **CORS errors**: Ensure backend is running on port 4000
2. **API not found**: Check environment variables are set correctly
3. **Connection refused**: Verify services are running on correct ports

### Verification Commands
```bash
# Check backend is running
curl http://localhost:4000

# Check Flask API is running  
curl http://localhost:5000

# Verify API endpoint
curl http://localhost:4000/api/v1/health
```

## Migration Notes
- **Old**: Hardcoded URLs in `src/util/variables.js`
- **New**: Environment-aware configuration with fallbacks
- **Benefits**: Automatic dev/prod switching, centralized configuration, better maintainability