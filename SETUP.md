# 🚀 TeachAI Project Setup Guide

## 📋 Prerequisites
- Node.js (v16 or higher)
- Python (3.7 or higher)
- MongoDB (local or Atlas)
- Git

## 🛠️ Installation Steps

### 1. Frontend Setup
```bash
# Install dependencies
npm install --legacy-peer-deps

# Note: Using --legacy-peer-deps due to Material-UI v4 compatibility with React 18
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file with:
PORT=4000
MONGO_URI=mongodb://localhost:27017/teachai
JWT_SECRET=WFFWf15115U842UGUBWF81EE858UYBY51BGBJ5E51Q
JWT_EXPIRE=7d
COOKIE_EXPIRE=5
NODE_ENV=development
```

### 3. Flask API Setup
```bash
cd flaskApi
pip install -r requirements.txt

# Update config.py with your OpenAI API key
# Replace 'your_openai_api_key_here' in DevelopmentConfig.OPENAI_KEY
```

### 4. MongoDB Setup
- **Local**: Install MongoDB Community Edition
- **Cloud**: Use MongoDB Atlas (free tier available)

## 🚀 Running the Project

### Option 1: Use Scripts (Recommended)
- **Windows**: Double-click `start-project.bat`
- **Unix/Mac**: Run `./start-project.sh`

### Option 2: Manual Start
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Flask API
cd flaskApi
python app.py

# Terminal 3 - Frontend
npm start
```

## 🌐 Service URLs
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000
- **Flask API**: http://localhost:5000

## 🔧 Configuration

### Backend Environment Variables
Create `backend/.env` file:
```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/teachai
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=5
NODE_ENV=development
```

### Flask API Configuration
Update `flaskApi/config.py`:
```python
class DevelopmentConfig(Config):
    OPENAI_KEY = 'your_openai_api_key_here'
```

## 🐛 Troubleshooting

### Common Issues:
1. **Port conflicts**: Change ports in respective config files
2. **MongoDB connection**: Ensure MongoDB is running
3. **Dependency conflicts**: Use `--legacy-peer-deps` for frontend
4. **Python packages**: Use virtual environment if needed

### Dependencies Issues:
```bash
# Frontend
npm install --legacy-peer-deps

# Backend
npm install

# Flask API
pip install -r requirements.txt
```

## 📱 Features Available
- AI-powered lesson planning
- Quiz generation
- Essay grading
- Math tools
- Video-to-notes conversion
- AI presentation generation
- Plagiarism detection
- User authentication
- Admin dashboard

## 🎯 Next Steps
1. Complete the Flask API setup
2. Configure your OpenAI API key
3. Set up MongoDB
4. Run the project using the scripts
5. Access the application at http://localhost:3000

## 📞 Support
If you encounter issues, check:
1. All services are running
2. Environment variables are set correctly
3. MongoDB is accessible
4. Ports are not blocked by firewall
