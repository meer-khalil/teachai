@echo off
REM TeachAI Windows Deployment Script

setlocal EnableDelayedExpansion

set DEPLOY_ENV=%1
if "%DEPLOY_ENV%"=="" set DEPLOY_ENV=production

echo 🚀 Starting TeachAI Production Deployment on Windows...

REM Check if Docker is running
docker version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running or not installed
    echo Please install Docker Desktop and ensure it's running
    exit /b 1
)

REM Check if docker-compose is available
docker-compose version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not available
    echo Please install Docker Compose
    exit /b 1
)

REM Check for .env file
if not exist ".env" (
    echo ⚠️ .env file not found. Copying from .env.example...
    copy .env.example .env
    echo ⚠️ Please update .env file with your production values before continuing
    pause
)

REM Generate SSL certificates if they don't exist
if not exist "docker\nginx\ssl\cert.pem" (
    echo 📋 Generating SSL certificates...
    mkdir docker\nginx\ssl 2>nul
    
    REM Create OpenSSL config for Windows
    echo [req] > ssl.conf
    echo distinguished_name = req_distinguished_name >> ssl.conf
    echo req_extensions = v3_req >> ssl.conf
    echo prompt = no >> ssl.conf
    echo [req_distinguished_name] >> ssl.conf
    echo C = US >> ssl.conf
    echo ST = State >> ssl.conf
    echo L = City >> ssl.conf
    echo O = TeachAI >> ssl.conf
    echo OU = IT >> ssl.conf
    echo CN = localhost >> ssl.conf
    echo [v3_req] >> ssl.conf
    echo keyUsage = keyEncipherment, dataEncipherment >> ssl.conf
    echo extendedKeyUsage = serverAuth >> ssl.conf
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout docker\nginx\ssl\key.pem -out docker\nginx\ssl\cert.pem -config ssl.conf
    del ssl.conf
    echo ✅ SSL certificates generated
)

echo 📦 Building Docker images...
docker-compose build --no-cache --parallel

echo 🛑 Stopping existing services...
docker-compose down --remove-orphans

echo 🚀 Starting database services...
docker-compose up -d mongodb redis

echo ⏳ Waiting for database to be ready...
timeout /t 30 /nobreak >nul

echo 🚀 Starting API service...
docker-compose up -d api

echo ⏳ Waiting for API to be ready...
timeout /t 20 /nobreak >nul

echo 🚀 Starting web server...
docker-compose up -d nginx

echo 🔍 Running health checks...
timeout /t 10 /nobreak >nul

REM Simple health check using curl if available
curl -f http://localhost:5000/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️ API health check failed - please check logs
) else (
    echo ✅ API health check passed
)

curl -f http://localhost/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Web server health check failed - please check logs
) else (
    echo ✅ Web server health check passed
)

echo 🧹 Cleaning up old Docker images...
docker image prune -f

echo.
echo 🎉 TeachAI deployment completed!
echo.
echo 📋 Access Information:
echo   Frontend: https://localhost
echo   API: https://localhost/api
echo   Health: https://localhost/health
echo.
echo 🔧 Management Commands:
echo   View logs: docker-compose logs -f
echo   Stop: docker-compose down
echo   Restart: docker-compose restart
echo.
echo 📊 Service Status:
docker-compose ps

pause