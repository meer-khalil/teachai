# 🎓 TeachAI - AI-Powered Educational Platform

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://python.org/)
[![React](https://img.shields.io/badge/React-18%2B-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-green.svg)](https://mongodb.com/)

> **Empowering Education with Artificial Intelligence** - A comprehensive platform that revolutionizes teaching and learning through AI-powered tools for lesson planning, assessment, content creation, and educational support.

## 🌟 **Overview**

TeachAI is a cutting-edge educational technology platform that harnesses the power of artificial intelligence to transform how educators create content, assess students, and manage learning experiences. Built with modern web technologies and powered by OpenAI's GPT models, TeachAI provides intelligent tools that save time, enhance educational quality, and personalize learning experiences.

### 🎯 **Key Features**

- 📚 **AI Lesson Planning** - Intelligent curriculum design and lesson plan generation
- 📝 **Automated Quiz Creation** - Generate quizzes from any content or topic
- ✏️ **Essay Grading & Feedback** - AI-powered evaluation with detailed rubrics
- 🧮 **Math Problem Solving** - Advanced mathematical tools and step-by-step solutions
- 📹 **Video Analysis** - YouTube video summarization and quiz generation
- 🎨 **AI Presentations** - Automated PowerPoint slide creation
- 🔍 **Content Analysis** - Plagiarism and AI content detection
- 💬 **Interactive AI Chat** - Conversational learning support
- 👥 **User Management** - Teacher and student account systems
- 📊 **Analytics Dashboard** - Usage tracking and performance insights

---

## 🏗️ **Architecture**

TeachAI follows a modern microservices architecture:

```
🌐 Frontend (React.js) ←→ 🔧 Backend API (Node.js) ←→ 🤖 AI Services (Python/Flask)
                               ↓
                        💾 MongoDB Database
```

### **Technology Stack**

#### **Frontend**
- ⚛️ **React 18** - Modern component-based UI
- 🎨 **Tailwind CSS** - Utility-first styling
- 🎭 **Material-UI** - Professional component library
- 📝 **CKEditor** - Rich text editing
- 🔄 **Axios** - HTTP client for API calls

#### **Backend**
- 🟢 **Node.js** - Runtime environment
- 🚀 **Express.js** - Web application framework
- 🍃 **MongoDB** - NoSQL database
- 🔐 **JWT** - Secure authentication
- 💳 **Stripe** - Payment processing

#### **AI Services**
- 🐍 **Python 3.13** - Programming language
- 🌶️ **Flask** - Lightweight web framework
- 🤖 **OpenAI GPT** - Language model integration
- 🔗 **LangChain** - AI framework for complex workflows
- 📊 **scikit-learn** - Machine learning tools

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.11+ and pip
- MongoDB (local or Atlas)
- OpenAI API key

### **1. Clone Repository**
```bash
git clone https://github.com/meer-khalil/teachai.git
cd teachai
```

### **2. Install Dependencies**

**Frontend:**
```bash
npm install --legacy-peer-deps
```

**Backend:**
```bash
cd backend
npm install
```

**AI Services:**
```bash
cd flaskApi
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate
pip install -r requirements.txt
```

### **3. Configure Environment**

**Backend (.env):**
```bash
PORT=4000
MONGO_URI=mongodb://localhost:27017/teachai
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development
```

**AI Services (config.py):**
```python
OPENAI_KEY = 'your_openai_api_key_here'
```

### **4. Start All Services**
```bash
# Windows:
.\start-project.bat

# macOS/Linux:
./start-project.sh
```

### **5. Access Application**
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:4000
- 🤖 **AI Services**: http://localhost:5000

---

## 📂 **Project Structure**

```
teachai/
├── 📱 src/                          # React frontend source
│   ├── components/                  # React components
│   ├── context/                     # State management
│   └── util/                        # Frontend utilities
├── ⚙️ backend/                      # Node.js backend
│   ├── controllers/                 # Route handlers
│   ├── models/                      # Database schemas
│   ├── routes/                      # API endpoints
│   ├── middlewares/                 # Custom middleware
│   └── config/                      # Configuration files
├── 🤖 flaskApi/                     # Python AI services
│   ├── Core AI modules              # AI functionality
│   ├── venv/                        # Virtual environment
│   ├── Cache/                       # Response caching
│   └── demo/                        # Testing interface
├── 🛠️ Configuration Files
│   ├── start-project.bat            # Windows startup script
│   ├── package.json                 # Project metadata
│   └── tailwind.config.js           # Styling configuration
└── 📖 Documentation
    ├── PROJECT_STRUCTURE.md         # Detailed architecture
    ├── API_DOCUMENTATION.md         # Complete API reference
    ├── DEPLOYMENT.md                # Production deployment guide
    └── SETUP.md                     # Detailed setup instructions
```

---

## 🎯 **Core Features**

### 📚 **AI Lesson Planning**
Create comprehensive lesson plans with learning objectives, activities, assessments, and resources tailored to specific grade levels and subjects.

```javascript
// Example API call
const lessonPlan = await fetch('/lessonplanner', {
  method: 'POST',
  body: JSON.stringify({
    prompt: {
      topic: "Introduction to Photosynthesis",
      grade: "7th Grade",
      duration: "45 minutes"
    }
  })
});
```

### 📝 **Quiz Generation**
Generate customized quizzes with multiple question types, automatic grading, and detailed explanations.

**Supported Question Types:**
- Multiple Choice
- True/False
- Short Answer
- Essay Questions
- Math Problems

### ✏️ **Essay Grading**
AI-powered essay evaluation with:
- Automated scoring based on customizable rubrics
- Detailed feedback on content, structure, and grammar
- Suggestions for improvement
- Grade-level appropriate assessments

### 🧮 **Mathematical Tools**
Advanced math problem-solving capabilities:
- Step-by-step solution generation
- Interactive problem sets
- Algebraic expression evaluation
- Graphing and visualization support

### 📹 **Video Integration**
YouTube video analysis features:
- Automatic transcript extraction
- Content summarization
- Quiz generation from video content
- Interactive chat about video topics

---

## 🔧 **API Documentation**

### **Backend API Endpoints**

#### **Authentication**
```http
POST /api/v1/users/register    # User registration
POST /api/v1/users/login       # User login
GET  /api/v1/users/profile     # Get user profile
```

#### **Content Management**
```http
GET    /api/v1/posts           # Get all posts
POST   /api/v1/posts/create    # Create new post
PUT    /api/v1/posts/:id       # Update post
DELETE /api/v1/posts/:id       # Delete post
```

### **AI Services Endpoints**

#### **Educational Tools**
```http
POST /lessonplanner            # Generate lesson plans
POST /quiz                     # Create quizzes
POST /gradeEssay              # Grade essays
POST /mathquiz/gen            # Generate math quizzes
POST /video/summarize         # Summarize YouTube videos
POST /powerpoint              # Create AI presentations
```

#### **Analysis Tools**
```http
POST /detectai                # Detect AI-generated content
POST /checkplag               # Check for plagiarism
```

*For complete API documentation, see [API_DOCUMENTATION.md](API_DOCUMENTATION.md)*

---

## 🛡️ **Security Features**

- 🔐 **JWT Authentication** - Secure token-based authentication
- 🛡️ **Rate Limiting** - Prevent API abuse
- 🔒 **Input Validation** - Sanitize all user inputs
- 🚫 **CORS Protection** - Prevent cross-origin attacks
- 📊 **Usage Monitoring** - Track and analyze usage patterns

---

## 🎨 **User Interface**

### **Dashboard Features**
- 📊 **Analytics Dashboard** - Usage statistics and insights
- 💬 **Chat Interface** - Conversational AI interactions  
- 📝 **Content Editor** - Rich text editing with CKEditor
- 🎨 **Responsive Design** - Mobile-friendly interface
- 🌙 **Dark/Light Mode** - Customizable themes

### **User Roles**
- 👨‍🏫 **Teachers** - Full access to all features
- 👨‍🎓 **Students** - Limited access to learning tools
- 🔧 **Administrators** - Platform management capabilities

---

## 📊 **Performance & Scalability**

### **Optimization Features**
- 💾 **Caching System** - Redis-based response caching
- 🔄 **Lazy Loading** - React component optimization
- 📦 **Code Splitting** - Optimized bundle sizes
- 🌐 **CDN Integration** - Fast static asset delivery

### **Monitoring**
- 📈 **Usage Analytics** - Comprehensive usage tracking
- 🚨 **Error Monitoring** - Real-time error detection
- ⚡ **Performance Metrics** - Response time tracking
- 📊 **Resource Usage** - System resource monitoring

---

## 🚀 **Deployment**

### **Development Environment**
```bash
# Start all services locally
.\start-project.bat  # Windows
./start-project.sh   # macOS/Linux
```

### **Production Deployment Options**
- 🌐 **Vercel/Netlify** - Frontend hosting
- 🚀 **Heroku/Railway** - Backend deployment
- 🤖 **Python App Platforms** - AI services hosting
- 🍃 **MongoDB Atlas** - Database hosting

*For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)*

---

## 🧪 **Testing**

### **Testing Strategy**
```bash
# Frontend tests
npm test

# Backend tests
cd backend && npm test

# AI services tests
cd flaskApi && python -m pytest
```

### **Test Coverage**
- ✅ Unit tests for all components
- 🔄 Integration tests for API endpoints
- 🎭 End-to-end testing with Cypress
- 📊 Performance testing with Jest

---

## 📚 **Documentation**

- 📖 **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Comprehensive architecture guide
- 🔧 **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- 🚀 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- ⚙️ **[SETUP.md](SETUP.md)** - Detailed installation instructions

---

## 🤝 **Contributing**

We welcome contributions! Please follow these steps:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💾 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🔄 Open a Pull Request

### **Development Guidelines**
- Follow ESLint and Prettier configurations
- Write comprehensive tests for new features
- Update documentation for any API changes
- Follow semantic versioning for releases

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 **Support**

### **Getting Help**
- 📖 Check the [documentation](PROJECT_STRUCTURE.md)
- 🐛 Report bugs via [GitHub Issues](https://github.com/meer-khalil/teachai/issues)
- 💬 Join our community discussions
- 📧 Contact support at support@teachai.com

### **FAQ**

**Q: How do I get an OpenAI API key?**
A: Visit [OpenAI's website](https://platform.openai.com/) and create an account to get your API key.

**Q: Can I use this without MongoDB?**
A: MongoDB is required for user management and data storage. You can use MongoDB Atlas for a cloud solution.

**Q: Is there a demo version available?**
A: Yes, check the `flaskApi/demo/` directory for a standalone demo interface.

---

## 🙏 **Acknowledgments**

- 🤖 **OpenAI** - For providing the GPT API that powers our AI features
- ⚛️ **React Team** - For the amazing frontend framework
- 🟢 **Node.js Community** - For the robust backend runtime
- 🐍 **Python Community** - For the extensive AI/ML libraries
- 🍃 **MongoDB** - For the flexible database solution

---

## 📈 **Roadmap**

### **Upcoming Features**
- 🎥 **Live Video Integration** - Real-time video analysis
- 🌍 **Multi-language Support** - Internationalization
- 📱 **Mobile Applications** - Native iOS and Android apps
- 🔌 **LMS Integration** - Canvas, Moodle, Blackboard support
- 🤖 **Advanced AI Models** - GPT-4 and specialized educational models
- 📊 **Advanced Analytics** - Predictive learning analytics

### **Version History**
- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added video analysis capabilities
- **v1.2.0** - Enhanced AI presentation generation
- **v1.3.0** - Improved math problem solving tools

---

**🎓 TeachAI - Transforming Education Through Artificial Intelligence**

*Built with ❤️ by educators, for educators.*

[![GitHub stars](https://img.shields.io/github/stars/meer-khalil/teachai.svg?style=social&label=Star)](https://github.com/meer-khalil/teachai)
[![GitHub forks](https://img.shields.io/github/forks/meer-khalil/teachai.svg?style=social&label=Fork)](https://github.com/meer-khalil/teachai/fork)

---

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
