# 🎓 TeachAI - Complete Project Structure Documentation

## 📋 **Project Overview**
TeachAI is a comprehensive AI-powered educational platform that provides teachers and students with intelligent tools for lesson planning, assessment, content creation, and academic support.

## 🏗️ **Architecture Overview**

```
TeachAI Platform
├── 🌐 Frontend (React.js) - Port 3000
│   ├── User Interface & Experience
│   ├── Teacher & Student Dashboards  
│   ├── AI Chat Interfaces
│   └── Content Management
│
├── 🔧 Backend API (Node.js) - Port 4000
│   ├── Authentication & Authorization
│   ├── Database Management (MongoDB)
│   ├── User Management
│   ├── Content Storage & Retrieval
│   └── Payment Processing
│
├── 🤖 AI Services (Flask/Python) - Port 5000
│   ├── OpenAI GPT Integration
│   ├── Educational Content Generation
│   ├── Assessment & Grading
│   ├── Plagiarism Detection
│   └── AI Presentations
│
└── 💾 Database (MongoDB)
    ├── User Data & Authentication
    ├── Educational Content
    ├── Chat Histories
    ├── Usage Analytics
    └── File Storage References
```

## 📂 **Directory Structure**

### **Root Level**
```
teachai/
├── 📱 Frontend Components
│   ├── src/                          # React source code
│   ├── public/                       # Static assets
│   ├── build/                        # Production build
│   ├── package.json                  # Frontend dependencies
│   └── tailwind.config.js            # Styling configuration
│
├── ⚙️ Backend Services
│   ├── backend/                      # Node.js API server
│   │   ├── controllers/              # Route controllers
│   │   ├── models/                   # MongoDB schemas
│   │   ├── routes/                   # API endpoints
│   │   ├── middlewares/              # Custom middleware
│   │   ├── utils/                    # Utility functions
│   │   ├── config/                   # Configuration files
│   │   ├── public/                   # File uploads & static content
│   │   └── server.js                 # Main server file
│   │
│   └── flaskApi/                     # Python AI services
│       ├── AI Module Files           # Core AI functionality
│       ├── venv/                     # Virtual environment
│       ├── Cache/                    # Response caching
│       ├── ChatData/                 # Chat conversations
│       ├── ChatHistory/              # Historical data
│       ├── GeneratedPresentations/   # AI-created presentations
│       ├── Questions/                # Generated questions
│       ├── Quizzes/                  # Generated quizzes
│       ├── demo/                     # Testing interface
│       └── requirements.txt          # Python dependencies
│
├── 📋 Configuration & Scripts
│   ├── start-project.bat             # Windows startup script
│   ├── start-project.sh              # Unix startup script
│   ├── package.json                  # Root project config
│   └── .env files                    # Environment variables
│
└── 📖 Documentation
    ├── README.md                     # Project overview
    ├── SETUP.md                      # Installation guide
    ├── PROJECT_STRUCTURE.md          # This file
    └── API_DOCUMENTATION.md          # API reference
```

### **Frontend Structure (`src/`)**
```
src/
├── 🎨 Components
│   ├── Admin/                        # Admin dashboard
│   ├── Dashboard/                    # User dashboards
│   ├── Blog/                         # Content management
│   ├── Login/                        # Authentication
│   ├── Signup/                       # Registration
│   ├── Password/                     # Password management
│   ├── Stripe/                       # Payment processing
│   ├── OTP/                          # Two-factor auth
│   └── commons/                      # Shared components
│
├── 🎭 Context                        # React context providers
├── 🖼️ Images                         # Static images
├── 🎬 Animation                      # Animation assets
├── 🔧 util/                          # Frontend utilities
├── App.jsx                          # Main app component
├── index.js                         # Entry point
└── index.css                        # Global styles
```

### **Backend Structure (`backend/`)**
```
backend/
├── 🎮 Controllers
│   ├── userController.js            # User management
│   ├── chatController.js            # Chat functionality  
│   ├── postController.js            # Content posts
│   ├── paymentController.js         # Payment processing
│   ├── orderController.js           # Order management
│   └── contactController.js         # Contact forms
│
├── 📊 Models
│   ├── userModel.js                 # User schema
│   ├── chatHistoryModel.js          # Chat data
│   ├── postModel.js                 # Content posts
│   ├── paymentModel.js              # Payment records
│   ├── usageModel.js                # Usage tracking
│   └── uploadFileModel.js           # File uploads
│
├── 🛣️ Routes
│   ├── userRoute.js                 # User endpoints
│   ├── chatRoute.js                 # Chat endpoints
│   ├── postRoute.js                 # Content endpoints
│   ├── paymentRoute.js              # Payment endpoints
│   └── contactRoute.js              # Contact endpoints
│
├── 🛡️ Middlewares
│   ├── auth.js                      # Authentication
│   ├── asyncErrorHandler.js         # Error handling
│   ├── requestLimit.js              # Rate limiting
│   └── error.js                     # Error middleware
│
├── 🔧 Utils
│   ├── api.js                       # API utilities
│   ├── chatHistoryUtil.js           # Chat management
│   ├── sendEmail.js                 # Email service
│   ├── sendToken.js                 # JWT tokens
│   └── errorHandler.js              # Error utilities
│
├── ⚙️ Config
│   ├── database.js                  # MongoDB connection
│   ├── keys.js                      # API keys
│   ├── stripe.js                    # Payment config
│   └── .env                         # Environment variables
│
└── 📁 Public
    ├── pdfFiles/                    # Uploaded PDFs
    ├── userPhotos/                  # Profile images
    └── storyImages/                 # Content images
```

### **AI Services Structure (`flaskApi/`)**
```
flaskApi/
├── 🤖 Core AI Modules
│   ├── app.py                       # Main Flask application
│   ├── config.py                    # Configuration
│   ├── lessonplannerapi.py          # Lesson planning AI
│   ├── quizapi.py                   # Quiz generation
│   ├── math_quiz.py                 # Math quiz AI
│   ├── math_lesson.py               # Math lessons
│   ├── grade_essay.py               # Essay grading
│   ├── ytgpt.py                     # YouTube integration
│   ├── aipresentation.py            # AI presentations
│   ├── lesson_comp.py               # Lesson components
│   ├── detect_ai.py                 # AI content detection
│   ├── plag_cheker.py               # Plagiarism detection
│   └── gptutils.py                  # GPT utilities
│
├── 📊 Data Storage
│   ├── Cache/                       # Response caching
│   ├── ChatData/                    # Active chats
│   ├── ChatHistory/                 # Historical chats
│   ├── GeneratedPresentations/      # AI presentations
│   ├── Questions/                   # Generated questions
│   └── Quizzes/                     # Generated quizzes
│
├── 🐍 Environment
│   ├── venv/                        # Python virtual environment
│   ├── requirements.txt             # Dependencies
│   └── __pycache__/                 # Python cache
│
└── 🧪 Demo & Testing
    └── demo/                        # Testing interface
        ├── app.py                   # Demo Flask app
        ├── templates/               # HTML templates
        └── static/                  # Demo assets
```

## 🚀 **Key Features by Component**

### **Frontend Features**
- 👥 **User Management:** Registration, login, profiles
- 📊 **Dashboards:** Teacher and student interfaces
- 💬 **Chat Interfaces:** AI-powered educational conversations
- 📝 **Content Creation:** Blog posts, stories, educational content
- 💳 **Payment Integration:** Stripe payment processing
- 📱 **Responsive Design:** Mobile-friendly interface

### **Backend Features**
- 🔐 **Authentication:** JWT-based secure login
- 📁 **File Management:** PDF uploads, image storage
- 💾 **Database:** MongoDB with Mongoose ODM
- 📧 **Email Service:** Automated notifications
- 📊 **Usage Tracking:** Analytics and monitoring
- 🔒 **Security:** Rate limiting, input validation

### **AI Services Features**
- 📚 **Lesson Planning:** Intelligent curriculum design
- 📝 **Quiz Generation:** Automated assessment creation
- ✏️ **Essay Grading:** AI-powered evaluation with rubrics
- 🧮 **Math Tools:** Mathematical problem solving
- 📹 **YouTube Integration:** Video summarization and quiz creation
- 🎨 **AI Presentations:** Automated slide generation
- 🔍 **Plagiarism Detection:** Content originality checking
- 🤖 **AI Content Detection:** Identify AI-generated content

## 🔧 **Technology Stack**

### **Frontend Stack**
- ⚛️ **React.js** - Component-based UI
- 🎨 **Tailwind CSS** - Utility-first styling
- 🎭 **Material-UI** - Component library
- 📝 **CKEditor** - Rich text editing
- 🎬 **Lottie** - Animations
- 🌐 **Axios** - HTTP client

### **Backend Stack**
- 🟢 **Node.js** - Runtime environment
- 🚀 **Express.js** - Web framework
- 🍃 **MongoDB** - Database
- 🐘 **Mongoose** - ODM
- 🔐 **JWT** - Authentication
- 💳 **Stripe** - Payment processing

### **AI Services Stack**
- 🐍 **Python 3.13** - Programming language
- 🌶️ **Flask** - Micro web framework
- 🤖 **OpenAI GPT** - Language model
- 🔗 **LangChain** - AI framework
- 📊 **scikit-learn** - Machine learning
- 🔤 **NLTK** - Natural language processing

### **Database Stack**
- 📊 **MongoDB** - Primary database
- 📁 **File System** - File storage
- 💾 **JSON** - Data serialization
- 🗂️ **GridFS** - Large file storage

## 🌊 **Data Flow Architecture**

```
User Request → Frontend (React) → Backend API (Node.js) → AI Services (Flask) → OpenAI API
                    ↓                      ↓                      ↓
                 UI Updates ← JSON Response ← Database Query ← AI Processing
```

## 📊 **API Endpoints Structure**

### **Backend API (`/api/v1/`)**
- 👥 **Users:** `/users/` - User management
- 💬 **Chat:** `/chatbot/` - Chat functionality  
- 📝 **Posts:** `/posts/` - Content management
- 💳 **Payments:** `/payments/` - Payment processing
- 📊 **Analytics:** `/usage/` - Usage tracking

### **AI API (`/`)**
- 📚 **Lesson Planning:** `/lessonplanner`
- 📝 **Quiz Generation:** `/quiz`
- ✏️ **Essay Grading:** `/gradeEssay`
- 🧮 **Math Tools:** `/mathquiz/`, `/math/lesson`
- 📹 **Video Analysis:** `/video/summarize`, `/video/quiz`
- 🎨 **Presentations:** `/powerpoint`
- 🔍 **Content Analysis:** `/detectai`, `/checkplag`

## 🔐 **Security & Configuration**

### **Environment Variables**
```bash
# Backend Configuration
PORT=4000
MONGO_URI=mongodb://localhost:27017/teachai
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# AI Services Configuration  
OPENAI_KEY=your_openai_api_key_here
FLASK_ENV=development

# Payment Configuration
STRIPE_API_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
```

### **Security Features**
- 🔐 JWT authentication
- 🛡️ Rate limiting
- 🔒 Input validation
- 🚫 CORS protection
- 📊 Usage monitoring

## 📈 **Performance Optimization**

### **Caching Strategy**
- 💾 **Redis** - Session storage (optional)
- 📁 **File System** - Generated content cache
- 🌐 **Browser** - Static asset caching
- 📊 **Database** - Query optimization

### **Scalability Features**  
- 🔄 **Microservices** - Separated AI services
- 📊 **Load Balancing** - Multiple instance support
- 📁 **File Storage** - Scalable file management
- 📈 **Monitoring** - Usage analytics

## 🧪 **Testing Strategy**

### **Testing Structure**
```
tests/
├── frontend/         # React component tests
├── backend/          # API endpoint tests  
├── ai-services/      # AI functionality tests
├── integration/      # End-to-end tests
└── performance/      # Load testing
```

## 📚 **Documentation Files**

1. **README.md** - Project overview and quick start
2. **SETUP.md** - Detailed installation instructions  
3. **PROJECT_STRUCTURE.md** - This comprehensive guide
4. **API_DOCUMENTATION.md** - Complete API reference
5. **DEPLOYMENT.md** - Production deployment guide
6. **CONTRIBUTING.md** - Development guidelines
7. **CHANGELOG.md** - Version history and updates

## 🎯 **Development Workflow**

### **Getting Started**
1. Clone repository
2. Install dependencies (`npm install`, `pip install -r requirements.txt`)
3. Configure environment variables
4. Set up local MongoDB
5. Run startup script (`.\start-project.bat`)

### **Development Process**
1. Frontend development (React components)
2. Backend API development (Node.js endpoints)
3. AI services integration (Flask APIs)
4. Testing and validation
5. Documentation updates

---

**🎓 TeachAI - Empowering Education with Artificial Intelligence**

*This document serves as the complete architectural guide for the TeachAI platform. For specific implementation details, refer to the individual component documentation.*