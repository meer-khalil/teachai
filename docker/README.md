# 🐳 TeachAI Docker Setup

This directory contains Docker configurations and management tools for the TeachAI platform.

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+

### Development Environment
```powershell
# Windows PowerShell
.\docker-manage.ps1 dev

# Linux/Mac Bash
./docker-manage.sh dev
```

### Production Environment
```powershell
# Windows PowerShell
.\docker-manage.ps1 prod

# Linux/Mac Bash  
./docker-manage.sh prod
```

## 📁 File Structure

```
├── docker/
│   ├── nginx.conf              # Frontend Nginx config
│   ├── nginx-lb.conf           # Load balancer config
│   ├── redis.conf              # Redis configuration
│   └── mongo-init.js           # MongoDB initialization
├── backend/
│   ├── Dockerfile              # Backend container config
│   └── .dockerignore           # Backend ignore rules
├── flaskApi/
│   ├── Dockerfile              # Flask AI container config
│   └── .dockerignore           # Flask ignore rules
├── Dockerfile                  # Frontend container config
├── .dockerignore               # Frontend ignore rules
├── docker-compose.yml          # Main orchestration
├── docker-compose.dev.yml      # Development overrides
├── docker-compose.prod.yml     # Production overrides
├── docker-manage.ps1           # Windows management script
├── docker-manage.sh            # Linux/Mac management script
├── .env.example                # Environment template
└── .env.development            # Development config
```

## 🛠️ Management Commands

| Command | Description |
|---------|-------------|
| `dev` | Start development environment with hot reload |
| `prod` | Start production environment with scaling |
| `stop` | Stop all running services |
| `restart` | Restart all services |
| `logs [service]` | View logs (optionally for specific service) |
| `build` | Build all Docker images |
| `clean` | Remove all containers, volumes, and images |
| `backup` | Create backup of data volumes |
| `restore [path]` | Restore from backup |
| `health` | Check health status of all services |
| `scale [service] [count]` | Scale service to specified replicas |
| `shell [service]` | Open shell in service container |
| `update` | Update and rebuild services |

## 🔧 Configuration

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit configuration:**
   - Set secure passwords for MongoDB and Redis
   - Add your OpenAI API key
   - Configure JWT secret
   - Set email credentials (if needed)

3. **Required Environment Variables:**
   ```env
   MONGO_ROOT_PASSWORD=your_secure_password
   REDIS_PASSWORD=your_redis_password
   JWT_SECRET=your_jwt_secret_min_32_chars
   OPENAI_API_KEY=your_openai_api_key
   ```

## 📊 Services & Ports

### Development Environment
| Service | Internal Port | External Port | URL |
|---------|---------------|---------------|-----|
| Frontend | 3000 | 3000 | http://localhost:3000 |
| Backend API | 4000 | 4000 | http://localhost:4000 |
| Flask AI | 5000 | 5000 | http://localhost:5000 |
| MongoDB | 27017 | 27017 | mongodb://localhost:27017 |
| Redis | 6379 | 6379 | redis://localhost:6379 |
| Mongo Express | 8081 | 8081 | http://localhost:8081 |
| Redis Commander | 8082 | 8082 | http://localhost:8082 |

### Production Environment
| Service | Internal Port | External Port | URL |
|---------|---------------|---------------|-----|
| Nginx LB | 80/443 | 80/443 | http://localhost |
| Grafana | 3000 | 3001 | http://localhost:3001 |

## 🏗️ Development Workflow

1. **Start development environment:**
   ```powershell
   .\docker-manage.ps1 dev
   ```

2. **Make code changes** (hot reload will update automatically)

3. **View logs:**
   ```powershell
   .\docker-manage.ps1 logs backend
   ```

4. **Debug in container:**
   ```powershell
   .\docker-manage.ps1 shell backend
   ```

5. **Stop when done:**
   ```powershell
   .\docker-manage.ps1 stop
   ```

## 🚀 Production Deployment

1. **Configure production environment:**
   ```bash
   # Set production environment variables
   export NODE_ENV=production
   export PYTHON_ENV=production
   ```

2. **Deploy with build:**
   ```powershell
   .\docker-manage.ps1 prod --build
   ```

3. **Scale services:**
   ```powershell
   .\docker-manage.ps1 scale backend 3
   .\docker-manage.ps1 scale flask-ai 2
   ```

4. **Monitor health:**
   ```powershell
   .\docker-manage.ps1 health
   ```

## 📋 Health Monitoring

### Health Check Endpoints
- **Main Health:** `http://localhost/health`
- **Backend Health:** `http://localhost:4000/health`  
- **Flask AI Health:** `http://localhost:5000/health`
- **Detailed Health:** `http://localhost:4000/api/v1/health`

### Monitoring URLs
- **Application Metrics:** `http://localhost:4000/api/v1/monitoring/metrics`
- **Alerts:** `http://localhost:4000/api/v1/monitoring/alerts`
- **Nginx Status:** `http://localhost/nginx_status` (production)

## 💾 Data Management

### Backup
```powershell
# Create backup
.\docker-manage.ps1 backup

# Backups are stored in ./backups/YYYYMMDD_HHMMSS/
```

### Restore
```powershell
# List available backups
ls ./backups/

# Restore from specific backup
.\docker-manage.ps1 restore ./backups/20251227_140000
```

### Persistent Volumes
- `teachai_mongodb_data` - MongoDB database files
- `teachai_redis_data` - Redis persistent data
- `teachai_backend_logs` - Backend application logs
- `teachai_backend_uploads` - User uploaded files
- `teachai_flask_cache` - Flask AI cache data
- `teachai_flask_data` - Flask AI generated data

## 🔧 Troubleshooting

### Container Won't Start
```powershell
# Check logs
.\docker-manage.ps1 logs [service-name]

# Check container status  
docker-compose ps

# Inspect container
docker inspect teachai-[service-name]
```

### Network Issues
```powershell
# Check networks
docker network ls

# Test connectivity
docker exec teachai-backend ping teachai-mongodb
```

### Performance Issues
```powershell
# Monitor resources
docker stats

# Scale problematic service
.\docker-manage.ps1 scale backend 3
```

### Port Conflicts
If you get port conflict errors:
1. Check what's using the port: `netstat -an | findstr :3000`
2. Stop the conflicting service
3. Or change the port in environment variables

## 🔒 Security Notes

- All services run as non-root users
- Containers use minimal base images
- Networks are isolated between services
- Sensitive data is managed through environment variables
- Regular security updates are applied to base images

## 📝 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Docker Best Practices](https://docs.docker.com/develop/best-practices/)
- [Container Security Guide](https://docs.docker.com/engine/security/)

For more detailed information, see the complete documentation in `Progress Tracking/04-Docker-Containerization.md`.