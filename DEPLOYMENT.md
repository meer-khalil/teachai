# 🚀 TeachAI Deployment Guide

## 📋 **Overview**
This guide provides comprehensive instructions for deploying the TeachAI platform in various environments, from local development to production deployment.

## 🏗️ **Deployment Architecture**

```
Production Architecture
├── 🌐 Frontend (React.js)
│   ├── Build Artifacts → Static Hosting (Vercel/Netlify)
│   ├── CDN Distribution
│   └── SSL/TLS Termination
│
├── 🔧 Backend API (Node.js)
│   ├── Application Server (Heroku/Railway/VPS)
│   ├── Load Balancer (nginx)
│   ├── Process Manager (PM2)
│   └── SSL/TLS Certificates
│
├── 🤖 AI Services (Flask/Python)
│   ├── Python Application (Heroku/Railway/VPS)
│   ├── Virtual Environment
│   ├── GPU Support (Optional)
│   └── OpenAI API Integration
│
├── 💾 Database (MongoDB)
│   ├── MongoDB Atlas (Recommended)
│   ├── Self-hosted MongoDB
│   └── Backup & Replication
│
└── 📁 File Storage
    ├── AWS S3 / Google Cloud Storage
    ├── Cloudinary (Images)
    └── Local Storage (Development)
```

---

## 🛠️ **Environment Setup**

### **Environment Variables**

#### **Frontend Environment (.env)**
```bash
# API Endpoints
REACT_APP_BACKEND_URL=https://your-backend-domain.com/api/v1
REACT_APP_AI_SERVICES_URL=https://your-ai-services-domain.com
REACT_APP_SITE_URL=https://your-frontend-domain.com

# External Services
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_key
REACT_APP_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
```

#### **Backend Environment (.env)**
```bash
# Server Configuration
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://your-frontend-domain.com

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/teachai?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=5

# Payment Processing
STRIPE_API_KEY=pk_live_your_stripe_api_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# File Storage
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# External APIs
AI_SERVICES_URL=https://your-ai-services-domain.com
```

#### **AI Services Environment**
```bash
# Flask Configuration
FLASK_ENV=production
FLASK_APP=app.py
PORT=5000

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here

# CORS Configuration
CORS_ORIGINS=https://your-frontend-domain.com,https://your-backend-domain.com
```

---

## 🌐 **Frontend Deployment**

### **Vercel Deployment (Recommended)**

#### **1. Prepare for Build**
```bash
# Install dependencies
npm install --legacy-peer-deps

# Create production build
npm run build

# Test build locally
npx serve -s build
```

#### **2. Deploy to Vercel**
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### **3. Vercel Configuration (vercel.json)**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_BACKEND_URL": "@backend_url",
    "REACT_APP_AI_SERVICES_URL": "@ai_services_url",
    "REACT_APP_STRIPE_PUBLISHABLE_KEY": "@stripe_key"
  }
}
```

### **Netlify Deployment**

#### **1. Build Configuration (_redirects file)**
```
/*    /index.html   200
```

#### **2. Environment Variables in Netlify**
```
REACT_APP_BACKEND_URL=https://your-backend.herokuapp.com/api/v1
REACT_APP_AI_SERVICES_URL=https://your-ai-services.herokuapp.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

#### **3. Deploy Command**
```bash
# Build command
npm run build

# Publish directory
build
```

---

## 🔧 **Backend Deployment**

### **Heroku Deployment**

#### **1. Prepare Application**
```bash
# Create Procfile
echo "web: node server.js" > Procfile

# Create .gitignore
echo "node_modules/" > .gitignore
echo ".env" >> .gitignore

# Initialize git repository
git init
git add .
git commit -m "Initial commit"
```

#### **2. Deploy to Heroku**
```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-teachai-backend

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGO_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your_jwt_secret"
heroku config:set STRIPE_SECRET_KEY="sk_live_..."

# Deploy
git push heroku main

# Scale dyno
heroku ps:scale web=1
```

#### **3. Package.json Scripts**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required'",
    "heroku-postbuild": "echo 'Backend deployment successful'"
  },
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

### **Railway Deployment**

#### **1. Railway Configuration (railway.toml)**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"

[[services]]
name = "teachai-backend"
```

#### **2. Environment Variables**
```bash
# Using Railway CLI
railway add --name MONGO_URI --value "mongodb+srv://..."
railway add --name JWT_SECRET --value "your_jwt_secret"
railway add --name NODE_ENV --value "production"
```

### **VPS Deployment with PM2**

#### **1. Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install nginx
sudo apt install nginx
```

#### **2. Application Setup**
```bash
# Clone repository
git clone https://github.com/your-username/teachai.git
cd teachai/backend

# Install dependencies
npm install --production

# Create PM2 ecosystem file
```

#### **3. PM2 Ecosystem (ecosystem.config.js)**
```javascript
module.exports = {
  apps: [{
    name: 'teachai-backend',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      MONGO_URI: 'mongodb+srv://...',
      JWT_SECRET: 'your_jwt_secret'
    }
  }]
};
```

#### **4. Start with PM2**
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

#### **5. Nginx Configuration**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🤖 **AI Services Deployment**

### **Heroku Python Deployment**

#### **1. Prepare Python Application**
```bash
# Create requirements.txt (already exists)
# Create Procfile
echo "web: python app.py" > Procfile

# Create runtime.txt
echo "python-3.11.0" > runtime.txt
```

#### **2. Flask App Configuration**
```python
# app.py modifications for production
import os

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
```

#### **3. Deploy to Heroku**
```bash
# Create Heroku app
heroku create your-teachai-ai-services

# Set environment variables
heroku config:set FLASK_ENV=production
heroku config:set OPENAI_API_KEY="sk-your_key_here"

# Deploy
git subtree push --prefix=flaskApi heroku main
```

### **Railway Python Deployment**

#### **1. Dockerfile (Optional)**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
```

#### **2. Railway Configuration**
```toml
[build]
builder = "dockerfile"

[deploy]
startCommand = "python app.py"
```

### **VPS Python Deployment**

#### **1. System Setup**
```bash
# Install Python and pip
sudo apt update
sudo apt install python3 python3-pip python3-venv nginx

# Create application directory
sudo mkdir -p /var/www/teachai-ai
sudo chown $USER:$USER /var/www/teachai-ai
```

#### **2. Application Setup**
```bash
# Clone and setup
cd /var/www/teachai-ai
git clone https://github.com/your-username/teachai.git .
cd flaskApi

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### **3. Gunicorn Configuration**
```bash
# Install Gunicorn
pip install gunicorn

# Create Gunicorn config
```

#### **4. Gunicorn Config (gunicorn_config.py)**
```python
bind = "127.0.0.1:5000"
workers = 4
worker_class = "sync"
timeout = 300
keepalive = 5
max_requests = 1000
preload_app = True
```

#### **5. Systemd Service (/etc/systemd/system/teachai-ai.service)**
```ini
[Unit]
Description=TeachAI AI Services
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/teachai-ai/flaskApi
Environment="PATH=/var/www/teachai-ai/flaskApi/venv/bin"
ExecStart=/var/www/teachai-ai/flaskApi/venv/bin/gunicorn --config gunicorn_config.py app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

#### **6. Start Service**
```bash
# Enable and start service
sudo systemctl enable teachai-ai
sudo systemctl start teachai-ai
sudo systemctl status teachai-ai
```

---

## 💾 **Database Deployment**

### **MongoDB Atlas (Recommended)**

#### **1. Create Cluster**
1. Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create free tier cluster
3. Configure security settings
4. Get connection string

#### **2. Security Configuration**
```javascript
// Database user creation
username: teachai_user
password: secure_random_password
role: readWrite on teachai database

// Network access
IP Whitelist: 0.0.0.0/0 (for production, use specific IPs)
```

#### **3. Connection String**
```
mongodb+srv://teachai_user:password@cluster0.mongodb.net/teachai?retryWrites=true&w=majority
```

### **Self-Hosted MongoDB**

#### **1. Installation**
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### **2. Security Configuration**
```bash
# Create admin user
mongo
use admin
db.createUser({
  user: "admin",
  pwd: "secure_admin_password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Create application user
use teachai
db.createUser({
  user: "teachai_user",
  pwd: "secure_app_password",
  roles: ["readWrite"]
})
```

---

## 📁 **File Storage Configuration**

### **Cloudinary Setup**
```javascript
// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

module.exports = cloudinary;
```

### **AWS S3 Setup**
```javascript
// backend/config/aws.js
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

module.exports = s3;
```

---

## 🔒 **SSL/TLS Configuration**

### **Let's Encrypt with Certbot**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **Nginx SSL Configuration**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📊 **Monitoring and Logging**

### **Application Monitoring**
```bash
# PM2 monitoring
pm2 monitor

# Check logs
pm2 logs teachai-backend
pm2 logs teachai-ai-services
```

### **System Monitoring**
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Check system resources
htop
df -h
free -h
```

### **Log Management**
```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f ~/.pm2/logs/teachai-backend-out.log
tail -f ~/.pm2/logs/teachai-backend-error.log
```

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow (.github/workflows/deploy.yml)**
```yaml
name: Deploy TeachAI

on:
  push:
    branches: [ main ]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install --legacy-peer-deps
        
      - name: Build
        run: npm run build
        env:
          REACT_APP_BACKEND_URL: ${{ secrets.BACKEND_URL }}
          REACT_APP_AI_SERVICES_URL: ${{ secrets.AI_SERVICES_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: "your-teachai-backend"
          heroku_email: "your-email@example.com"
          appdir: "backend"
```

---

## 📋 **Pre-deployment Checklist**

### **Frontend Checklist**
- [ ] Environment variables configured
- [ ] API endpoints updated for production
- [ ] Build process successful
- [ ] SSL certificate configured
- [ ] CDN configured (optional)
- [ ] Performance optimization applied

### **Backend Checklist**
- [ ] Production environment variables set
- [ ] Database connection tested
- [ ] SSL/TLS configured
- [ ] Rate limiting configured
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Health check endpoint working

### **AI Services Checklist**
- [ ] OpenAI API key configured
- [ ] Python virtual environment set up
- [ ] Dependencies installed
- [ ] CORS configured properly
- [ ] File permissions set correctly
- [ ] Error handling implemented

### **Database Checklist**
- [ ] Production database created
- [ ] User authentication configured
- [ ] Backup strategy implemented
- [ ] Connection limits configured
- [ ] Indexing optimized
- [ ] Monitoring set up

### **Security Checklist**
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Database access restricted
- [ ] API keys secured
- [ ] Input validation implemented
- [ ] Rate limiting active
- [ ] CORS properly configured
- [ ] Security headers set

---

## 🚨 **Troubleshooting**

### **Common Issues and Solutions**

#### **Frontend Build Errors**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Check for peer dependency conflicts
npm ls
```

#### **Backend Connection Issues**
```bash
# Check environment variables
printenv | grep MONGO_URI

# Test database connection
node -e "
const mongoose = require('mongoose');
mongoose.connect('your_mongo_uri')
  .then(() => console.log('Connected!'))
  .catch(err => console.error('Error:', err));
"
```

#### **AI Services Import Errors**
```bash
# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate.bat  # Windows

# Reinstall dependencies
pip install -r requirements.txt

# Check Python path
which python
python --version
```

#### **SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew --dry-run

# Check nginx configuration
sudo nginx -t
```

### **Performance Optimization**

#### **Frontend Optimization**
```bash
# Analyze bundle size
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# Implement lazy loading
# Use React.lazy() for route-based code splitting
```

#### **Backend Optimization**
```javascript
// Enable compression
const compression = require('compression');
app.use(compression());

// Database indexing
// Create indexes for frequently queried fields
db.users.createIndex({ email: 1 });
db.chathistories.createIndex({ user_id: 1, conversation_id: 1 });
```

#### **AI Services Optimization**
```python
# Implement caching for repeated requests
from functools import lru_cache

@lru_cache(maxsize=100)
def cached_ai_request(prompt_hash):
    # Cached AI processing
    pass

# Use connection pooling for database connections
```

---

## 📈 **Scaling Considerations**

### **Horizontal Scaling**
- Load balancers for multiple instances
- Database sharding or read replicas
- CDN for static asset delivery
- Message queues for async processing

### **Vertical Scaling**
- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching strategies
- Use faster storage solutions

### **Cost Optimization**
- Monitor usage and optimize resource allocation
- Implement auto-scaling policies
- Use spot instances for non-critical workloads
- Optimize database queries to reduce compute costs

---

**🚀 Your TeachAI platform is now ready for production deployment!**

*For additional support or questions, refer to the project documentation or create an issue in the repository.*