# TeachAI Backend API Documentation

## 🚀 Quick Start

### Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Base URLs
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.teachai.com`

### Content Type
All requests should use `Content-Type: application/json`

---

## 📚 API Endpoints

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "securePassword123",
  "role": "student"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "isVerified": false,
      "createdAt": "2024-01-20T15:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

#### POST /auth/login
Authenticate user and receive access token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "lastLogin": "2024-01-20T15:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

---

### User Management

#### GET /auth/profile
Get current user profile information.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "avatar": "https://example.com/avatar.jpg",
      "bio": "Passionate learner",
      "isVerified": true,
      "createdAt": "2024-01-15T08:30:00Z",
      "lastLogin": "2024-01-20T15:30:00Z"
    }
  }
}
```

#### PUT /auth/profile
Update user profile information.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "name": "Jane Smith",
  "bio": "Updated bio information",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6789012345",
      "name": "Jane Smith",
      "email": "john@example.com",
      "bio": "Updated bio information",
      "avatar": "https://example.com/new-avatar.jpg"
    }
  },
  "message": "Profile updated successfully"
}
```

---

### Chat Management

#### POST /chat/send
Send a message and receive AI response.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "message": "What is photosynthesis?",
  "subject": "biology",
  "grade": "10",
  "conversationId": "conv-biology-123" // Optional, for continuing conversation
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response": "Photosynthesis is the process by which plants...",
    "conversationId": "conv-biology-123",
    "messageId": "msg-456",
    "timestamp": "2024-01-20T15:30:00Z",
    "metadata": {
      "subject": "biology",
      "grade": "10",
      "responseTime": 1.5
    }
  }
}
```

#### GET /chat/history
Get user's chat conversation history.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `subject` (optional): Filter by subject
- `search` (optional): Search in conversation titles

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "_id": "64a1b2c3d4e5f6789012347",
        "conversationId": "conv-biology-123",
        "title": "Biology: Photosynthesis Discussion",
        "subject": "biology",
        "messageCount": 8,
        "lastMessage": "That's a great explanation!",
        "lastActivity": "2024-01-20T15:30:00Z",
        "createdAt": "2024-01-20T14:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### GET /chat/conversation/:conversationId
Get specific conversation with full message history.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "_id": "64a1b2c3d4e5f6789012347",
      "conversationId": "conv-biology-123",
      "title": "Biology: Photosynthesis Discussion",
      "subject": "biology",
      "grade": "10",
      "messages": [
        {
          "_id": "64a1b2c3d4e5f6789012348",
          "role": "user",
          "content": "What is photosynthesis?",
          "timestamp": "2024-01-20T14:00:00Z"
        },
        {
          "_id": "64a1b2c3d4e5f6789012349",
          "role": "assistant", 
          "content": "Photosynthesis is the process...",
          "timestamp": "2024-01-20T14:00:05Z"
        }
      ],
      "createdAt": "2024-01-20T14:00:00Z",
      "updatedAt": "2024-01-20T15:30:00Z"
    }
  }
}
```

#### DELETE /chat/conversation/:conversationId
Delete a conversation and all its messages.

**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response (200):**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

---

### Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "ERROR_CODE",
  "details": {
    "field": "specific error details"
  },
  "timestamp": "2024-01-20T15:30:00Z",
  "requestId": "req_64a1b2c3d4e5f6789012348"
}
```

#### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity (validation failed)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## 📝 Code Examples

### JavaScript (Fetch API)
```javascript
// Register user
const registerUser = async (userData) => {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(userData)
  });
  
  const result = await response.json();
  return result;
};

// Send authenticated request
const sendChatMessage = async (message, token) => {
  const response = await fetch('http://localhost:5000/api/chat/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message })
  });
  
  const result = await response.json();
  return result;
};
```

### cURL Examples
```bash
# Register user
curl -X POST http://localhost:5000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "role": "student"
  }'

# Login user
curl -X POST http://localhost:5000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'

# Send chat message
curl -X POST http://localhost:5000/api/chat/send \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -d '{
    "message": "What is photosynthesis?",
    "subject": "biology",
    "grade": "10"
  }'
```

### Python (Requests)
```python
import requests

# Register user
def register_user(user_data):
    response = requests.post(
        'http://localhost:5000/api/auth/register',
        json=user_data,
        headers={'Content-Type': 'application/json'}
    )
    return response.json()

# Authenticated request
def send_chat_message(message, token):
    response = requests.post(
        'http://localhost:5000/api/chat/send',
        json={'message': message},
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
    )
    return response.json()
```

---

## 🔧 Rate Limits

- **Authentication endpoints**: 5 requests per minute per IP
- **Chat endpoints**: 60 requests per hour per user
- **General endpoints**: 1000 requests per hour per user

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when current window resets

---

## 🚨 Troubleshooting

### Common Issues

#### 401 Unauthorized
- Check that you're including the `Authorization` header
- Verify token is not expired (tokens expire after 24 hours)
- Ensure token format is `Bearer YOUR_JWT_TOKEN`

#### 422 Validation Error  
- Check required fields in request body
- Validate email format and password requirements
- Ensure proper data types (strings, numbers, booleans)

#### 429 Rate Limit Exceeded
- Implement exponential backoff in your requests
- Cache responses when possible
- Consider upgrading to higher rate limits

For additional support, contact: support@teachai.com