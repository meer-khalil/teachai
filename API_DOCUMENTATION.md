# 📖 TeachAI API Documentation

## 🌟 **Overview**
This document provides comprehensive API documentation for the TeachAI platform, covering both the Backend API (Node.js) and AI Services API (Flask/Python).

## 🏗️ **API Architecture**

```
TeachAI API Structure
├── 🔧 Backend API (Node.js) - http://localhost:4000/api/v1/
│   ├── Authentication & User Management
│   ├── Content Management
│   ├── Payment Processing
│   └── File Upload & Storage
│
└── 🤖 AI Services API (Flask) - http://localhost:5000/
    ├── Educational Content Generation
    ├── Assessment & Grading
    ├── Analysis & Detection Tools
    └── Interactive AI Features
```

---

## 🔧 **Backend API Endpoints**

### **Base URL:** `http://localhost:4000/api/v1/`

### 🔐 **Authentication Endpoints**

#### **User Registration**
```http
POST /users/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "teacher" // or "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "teacher"
  },
  "token": "jwt_token_here"
}
```

#### **User Login**
```http
POST /users/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### **Get User Profile**
```http
GET /users/profile
Authorization: Bearer jwt_token_here
```

### 💬 **Chat Management**

#### **Get Chat History**
```http
GET /chatbot/history/:userId
Authorization: Bearer jwt_token_here
```

#### **Create New Conversation**
```http
POST /chatbot/conversation
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "title": "Lesson Planning Session",
  "type": "lessonplanner"
}
```

### 📝 **Content Management**

#### **Create Post**
```http
POST /posts/create
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "title": "Educational Content Title",
  "content": "Post content here...",
  "category": "lesson-plans",
  "tags": ["math", "algebra"]
}
```

#### **Get All Posts**
```http
GET /posts?page=1&limit=10&category=lesson-plans
```

### 💳 **Payment Processing**

#### **Create Payment Intent**
```http
POST /payments/create-intent
Authorization: Bearer jwt_token_here
Content-Type: application/json

{
  "amount": 999, // in cents
  "currency": "usd",
  "plan": "premium"
}
```

---

## 🤖 **AI Services API Endpoints**

### **Base URL:** `http://localhost:5000/`

### 📚 **Lesson Planning**

#### **Generate Lesson Plan**
```http
POST /lessonplanner
Content-Type: application/json

{
  "prompt": {
    "topic": "Introduction to Algebra",
    "grade": "8th Grade",
    "duration": "45 minutes",
    "language": "English"
  },
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

**Response:** Streaming response with lesson plan content
```
data: {"type": "content", "text": "# Lesson Plan: Introduction to Algebra\n\n"}
data: {"type": "content", "text": "## Objective\nStudents will understand..."}
data: {"type": "complete", "filename": "chat_history_file.json"}
```

### 📝 **Quiz Generation**

#### **Generate Quiz**
```http
POST /quiz
Content-Type: application/json

{
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here",
  "grade": "8th Grade",
  "topic": "Algebraic Expressions",
  "subject": "Mathematics",
  "summary": "Basic algebra concepts",
  "type": "multiple-choice",
  "questionnumber": "10"
}
```

**Response:**
```json
{
  "quiz": {
    "title": "Algebraic Expressions Quiz",
    "questions": [
      {
        "question": "What is 2x + 3x?",
        "options": ["5x", "6x", "5x²", "2x³"],
        "correct_answer": "5x",
        "explanation": "Combine like terms: 2x + 3x = 5x"
      }
    ],
    "total_questions": 10,
    "estimated_time": "15 minutes"
  }
}
```

### ✏️ **Essay Grading**

#### **Grade Essay**
```http
POST /gradeEssay
Content-Type: application/json

{
  "prompt": {
    "essay_text": "Student's essay content here...",
    "assignment_prompt": "Write about climate change",
    "grade_level": "10th Grade",
    "subject": "Environmental Science",
    "language": "English"
  },
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

#### **Generate Rubric**
```http
POST /gradeEssay/rubric
Content-Type: application/json

{
  "essay_question": "Analyze the causes of climate change",
  "grade": "10th Grade",
  "language": "English",
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

### 🧮 **Math Tools**

#### **Generate Math Quiz**
```http
POST /mathquiz/gen
Content-Type: application/json

{
  "prompt": {
    "topic": "Linear Equations",
    "difficulty": "intermediate",
    "num_questions": 5,
    "language": "English"
  },
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

#### **Evaluate Math Quiz**
```http
POST /mathquiz/evaluate
Content-Type: application/json

{
  "prompt": {
    "quiz_data": {
      "questions": [...],
      "student_answers": [...]
    },
    "language": "English"
  },
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

#### **Math Lesson Planning**
```http
POST /math/lesson
Content-Type: application/json

{
  "prompt": {
    "topic": "Quadratic Equations",
    "grade": "9th Grade",
    "duration": "50 minutes",
    "language": "English"
  },
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

### 📹 **Video Analysis**

#### **Summarize YouTube Video**
```http
POST /video/summarize
Content-Type: application/json

{
  "prompt": {
    "url": "https://youtube.com/watch?v=VIDEO_ID",
    "userinput": "Focus on key mathematical concepts",
    "language": "English"
  },
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

#### **Generate Quiz from Video**
```http
POST /video/quiz
Content-Type: application/json

{
  "prompt": {
    "url": "https://youtube.com/watch?v=VIDEO_ID",
    "num_question": 5,
    "quiz_type": "multiple-choice",
    "userinput": "Focus on main concepts",
    "language": "English"
  },
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

#### **Video Chat Integration**
```http
POST /video/chat
Content-Type: application/json

{
  "prompt": {
    "url": "https://youtube.com/watch?v=VIDEO_ID",
    "question": "Explain the concept discussed at 5:30",
    "language": "English"
  },
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

### 🎨 **AI Presentations**

#### **Generate PowerPoint Presentation**
```http
POST /powerpoint
Content-Type: application/json

{
  "prompt": {
    "description": "Introduction to Photosynthesis",
    "grade": "7th Grade",
    "subject": "Biology",
    "number_of_slides": 10,
    "language": "English"
  },
  "user_id": "user_id_here"
}
```

**Response:**
```json
{
  "presentation_link": "http://localhost:5000/GeneratedPresentations/presentation_12345.pptx",
  "slides_count": 10,
  "filename": "photosynthesis_presentation.pptx"
}
```

### 🔍 **Content Analysis**

#### **Detect AI-Generated Content**
```http
POST /detectai
Content-Type: application/json

{
  "prompt": {
    "text": "Text content to analyze for AI generation..."
  }
}
```

**Response:**
```json
{
  "result": {
    "is_ai_generated": true,
    "confidence": 0.85,
    "explanation": "This text shows characteristics typical of AI-generated content...",
    "recommendations": ["Review for authenticity", "Verify sources"]
  }
}
```

#### **Check for Plagiarism**
```http
POST /checkplag
Content-Type: application/json

{
  "prompt": {
    "text": "Text content to check for plagiarism..."
  }
}
```

**Response:**
```json
{
  "report": {
    "plagiarism_percentage": 25,
    "matches_found": 3,
    "sources": [
      {
        "url": "https://example.com/source1",
        "similarity": 15,
        "matched_text": "Similar text found..."
      }
    ],
    "overall_assessment": "Low plagiarism detected"
  }
}
```

### 📊 **Lesson Components**

#### **Generate Questions from Content**
```http
POST /lessonComp/questions
Content-Type: application/json

{
  "prompt": {
    "writeup": "Educational content here...",
    "qtype": "multiple-choice",
    "qnumber": "5",
    "language": "English"
  },
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

#### **Chat with Lesson Content**
```http
POST /lessonComp/chat
Content-Type: application/json

{
  "prompt": {
    "context": "Lesson content context...",
    "question": "Can you explain this concept further?",
    "language": "English"
  },
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

### 🎯 **Utility Endpoints**

#### **Get Chat Titles**
```http
POST /chattitles
Content-Type: application/json

{
  "user_id": "user_id_here",
  "conversation_id": "conversation_id_here"
}
```

#### **Download Generated Files**
```http
GET /GeneratedPresentations/{filename}
```

---

## 📊 **Response Formats**

### **Streaming Responses**
Many AI endpoints return streaming responses for real-time content generation:

```
Content-Type: text/event-stream

data: {"type": "start", "message": "Generating content..."}
data: {"type": "content", "text": "Generated text chunk..."}
data: {"type": "content", "text": "More generated content..."}
data: {"type": "complete", "filename": "chat_history.json"}
```

### **Standard JSON Response**
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {
    // Response data here
  },
  "timestamp": "2025-09-27T10:30:00Z"
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Bad Request: Missing required parameter 'user_id'",
    "details": "The user_id parameter is required for this operation"
  },
  "timestamp": "2025-09-27T10:30:00Z"
}
```

---

## 🔐 **Authentication**

### **JWT Token Format**
All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Token Payload**
```json
{
  "userId": "user_id_here",
  "email": "user@example.com",
  "role": "teacher",
  "iat": 1695804600,
  "exp": 1696409400
}
```

---

## 📝 **Request/Response Examples**

### **Complete Lesson Planning Example**

**Request:**
```http
POST http://localhost:5000/lessonplanner
Content-Type: application/json

{
  "prompt": {
    "topic": "Photosynthesis in Plants",
    "grade": "7th Grade",
    "duration": "45 minutes",
    "learning_objectives": [
      "Understand the process of photosynthesis",
      "Identify the role of chlorophyll"
    ],
    "language": "English"
  },
  "user_id": "64fa041a77c59af3e0b4413d",
  "conversation_id": "lesson_planning_001"
}
```

**Streaming Response:**
```
data: # Complete Lesson Plan: Photosynthesis in Plants

data: ## Grade Level: 7th Grade
data: ## Duration: 45 minutes

data: ### Learning Objectives:
data: 1. Students will understand the basic process of photosynthesis
data: 2. Students will identify the role of chlorophyll in plants
data: 3. Students will explain the importance of sunlight and water

data: ### Materials Needed:
data: - Green leaves samples
data: - Magnifying glasses
data: - Worksheets
data: - Projector for presentations

[Content continues streaming...]
```

### **Quiz Generation with Evaluation**

**Generate Quiz Request:**
```http
POST http://localhost:5000/quiz
Content-Type: application/json

{
  "user_id": "64fa041a77c59af3e0b4413d",
  "conversation_id": "quiz_session_001",
  "grade": "7th Grade",
  "topic": "Photosynthesis",
  "subject": "Biology",
  "summary": "Basic understanding of how plants make food",
  "type": "multiple-choice",
  "questionnumber": "5"
}
```

**Quiz Response:**
```json
{
  "quiz": {
    "title": "Photosynthesis Quiz - 7th Grade",
    "instructions": "Choose the best answer for each question.",
    "questions": [
      {
        "id": 1,
        "question": "What is the primary purpose of photosynthesis?",
        "options": [
          "To produce oxygen for animals",
          "To convert sunlight into chemical energy", 
          "To absorb water from soil",
          "To create beautiful green colors"
        ],
        "correct_answer": "To convert sunlight into chemical energy",
        "explanation": "Photosynthesis converts light energy into chemical energy stored in glucose."
      },
      {
        "id": 2,
        "question": "Which organelle is responsible for photosynthesis?",
        "options": [
          "Nucleus",
          "Mitochondria",
          "Chloroplast",
          "Ribosome"
        ],
        "correct_answer": "Chloroplast",
        "explanation": "Chloroplasts contain chlorophyll and are where photosynthesis occurs."
      }
    ],
    "total_questions": 5,
    "estimated_time": "10 minutes",
    "difficulty": "intermediate"
  }
}
```

---

## ⚠️ **Error Handling**

### **Common HTTP Status Codes**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error

### **Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Validation Error",
    "details": {
      "user_id": "This field is required",
      "prompt": "Prompt cannot be empty"
    }
  },
  "timestamp": "2025-09-27T10:30:00Z",
  "path": "/lessonplanner"
}
```

---

## 🔧 **Rate Limiting**

### **Rate Limits**
- **Authentication endpoints:** 5 requests per minute
- **AI generation endpoints:** 10 requests per minute  
- **File upload endpoints:** 3 requests per minute
- **General API endpoints:** 100 requests per minute

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1695804660
```

---

## 📚 **SDK and Integration**

### **JavaScript/Node.js Integration**
```javascript
// Backend API client
const axios = require('axios');

const teachaiAPI = axios.create({
  baseURL: 'http://localhost:4000/api/v1/',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// AI Services API client
const teachaiAI = axios.create({
  baseURL: 'http://localhost:5000/',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Example: Generate lesson plan
const generateLessonPlan = async (promptData, userId, conversationId) => {
  try {
    const response = await teachaiAI.post('/lessonplanner', {
      prompt: promptData,
      user_id: userId,
      conversation_id: conversationId
    });
    return response.data;
  } catch (error) {
    console.error('Error generating lesson plan:', error);
    throw error;
  }
};
```

### **Python Integration**
```python
import requests
import json

class TeachAIClient:
    def __init__(self, backend_url, ai_url, token=None):
        self.backend_url = backend_url
        self.ai_url = ai_url
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}' if token else None
        }
    
    def generate_quiz(self, quiz_data, user_id, conversation_id):
        payload = {
            'prompt': quiz_data,
            'user_id': user_id,
            'conversation_id': conversation_id
        }
        response = requests.post(
            f'{self.ai_url}/quiz',
            headers=self.headers,
            data=json.dumps(payload)
        )
        return response.json()

# Usage
client = TeachAIClient(
    'http://localhost:4000/api/v1',
    'http://localhost:5000',
    token='your_jwt_token_here'
)

quiz = client.generate_quiz({
    'topic': 'Algebra',
    'grade': '8th Grade',
    'type': 'multiple-choice',
    'questionnumber': '10'
}, 'user_123', 'quiz_session_456')
```

---

## 📊 **Monitoring and Analytics**

### **Health Check Endpoints**

#### **Backend Health Check**
```http
GET http://localhost:4000/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-09-27T10:30:00Z",
  "services": {
    "database": "connected",
    "ai_services": "available",
    "storage": "accessible"
  }
}
```

#### **AI Services Health Check**
```http
GET http://localhost:5000/health
```

---

## 🔄 **Webhooks**

### **Payment Webhooks**
```http
POST /webhooks/stripe
Content-Type: application/json
Stripe-Signature: webhook_signature

{
  "id": "evt_1234567890",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 999,
      "currency": "usd"
    }
  }
}
```

---

**📖 This API documentation is regularly updated. For the latest version, refer to the project repository.**

*🎓 TeachAI - Empowering Education with Artificial Intelligence*