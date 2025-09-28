#!/bin/bash

# TeachAI Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting TeachAI Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if .env file exists
    if [[ ! -f .env ]]; then
        log_warning ".env file not found. Copying from .env.example..."
        cp .env.example .env
        log_warning "Please update .env file with your production values before continuing."
        read -p "Press Enter to continue after updating .env file..."
    fi
    
    log_success "Requirements check passed"
}

backup_data() {
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        log_info "Creating backup before deployment..."
        mkdir -p "$BACKUP_DIR"
        
        # Backup database
        if docker-compose ps mongodb | grep -q "Up"; then
            log_info "Backing up MongoDB..."
            docker-compose exec -T mongodb mongodump --out /tmp/backup
            docker cp $(docker-compose ps -q mongodb):/tmp/backup "$BACKUP_DIR/mongodb"
        fi
        
        # Backup Redis data
        if docker-compose ps redis | grep -q "Up"; then
            log_info "Backing up Redis..."
            docker-compose exec -T redis redis-cli --rdb /tmp/dump.rdb
            docker cp $(docker-compose ps -q redis):/tmp/dump.rdb "$BACKUP_DIR/redis-dump.rdb"
        fi
        
        # Backup uploaded files
        if [[ -d "./uploads" ]]; then
            log_info "Backing up uploaded files..."
            cp -r ./uploads "$BACKUP_DIR/"
        fi
        
        log_success "Backup completed: $BACKUP_DIR"
    fi
}

build_images() {
    log_info "Building Docker images..."
    
    # Build production images
    docker-compose build --no-cache --parallel
    
    # Tag images with version
    VERSION=$(git rev-parse --short HEAD)
    docker tag teachai_api:latest teachai_api:$VERSION
    docker tag teachai_nginx:latest teachai_nginx:$VERSION
    
    log_success "Docker images built successfully"
}

deploy_services() {
    log_info "Deploying TeachAI services..."
    
    # Stop existing services
    docker-compose down --remove-orphans
    
    # Start database and cache first
    log_info "Starting database services..."
    docker-compose up -d mongodb redis
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    timeout 60 bash -c 'while ! docker-compose exec mongodb mongo --eval "db.stats()" >/dev/null 2>&1; do sleep 2; done'
    
    # Start API service
    log_info "Starting API service..."
    docker-compose up -d api
    
    # Wait for API to be ready
    log_info "Waiting for API to be ready..."
    timeout 60 bash -c 'while ! curl -f http://localhost:5000/health >/dev/null 2>&1; do sleep 2; done'
    
    # Start web server
    log_info "Starting web server..."
    docker-compose up -d nginx
    
    # Start monitoring services if enabled
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        log_info "Starting monitoring services..."
        docker-compose --profile monitoring up -d
    fi
    
    log_success "All services deployed successfully"
}

generate_ssl() {
    log_info "Setting up SSL certificates..."
    
    if [[ ! -f "./docker/nginx/ssl/cert.pem" ]]; then
        log_info "Generating self-signed SSL certificate for development..."
        mkdir -p ./docker/nginx/ssl
        
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ./docker/nginx/ssl/key.pem \
            -out ./docker/nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=TeachAI/OU=IT/CN=localhost"
        
        chmod 600 ./docker/nginx/ssl/key.pem
        chmod 644 ./docker/nginx/ssl/cert.pem
        
        log_warning "Self-signed certificate generated. For production, replace with real SSL certificates."
    fi
    
    log_success "SSL configuration completed"
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Check API health
    if curl -f http://localhost:5000/health >/dev/null 2>&1; then
        log_success "API health check passed"
    else
        log_error "API health check failed"
        return 1
    fi
    
    # Check web server health
    if curl -f http://localhost/health >/dev/null 2>&1; then
        log_success "Web server health check passed"
    else
        log_error "Web server health check failed"
        return 1
    fi
    
    # Check database connectivity
    if docker-compose exec -T api node -e "
        const mongoose = require('mongoose');
        mongoose.connect(process.env.MONGO_URI)
            .then(() => { console.log('DB OK'); process.exit(0); })
            .catch(() => process.exit(1));
    " >/dev/null 2>&1; then
        log_success "Database connectivity check passed"
    else
        log_error "Database connectivity check failed"
        return 1
    fi
    
    log_success "All health checks passed"
}

cleanup_old_images() {
    log_info "Cleaning up old Docker images..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove old versions (keep last 3)
    docker images teachai_api --format "table {{.Tag}}" | grep -v TAG | grep -v latest | sort -V | head -n -3 | xargs -r docker rmi teachai_api: 2>/dev/null || true
    
    log_success "Cleanup completed"
}

show_deployment_info() {
    log_success "🎉 TeachAI deployment completed successfully!"
    echo
    echo "📋 Deployment Information:"
    echo "  Environment: $DEPLOY_ENV"
    echo "  Version: $(git rev-parse --short HEAD)"
    echo "  Timestamp: $(date)"
    echo
    echo "🌐 Access URLs:"
    echo "  Frontend: https://localhost"
    echo "  API: https://localhost/api"
    echo "  Health Check: https://localhost/health"
    if [[ "$DEPLOY_ENV" == "production" ]]; then
        echo "  Monitoring: http://localhost:3001 (admin/admin123)"
        echo "  Metrics: http://localhost:9090"
    fi
    echo
    echo "🔧 Management Commands:"
    echo "  View logs: docker-compose logs -f"
    echo "  Stop services: docker-compose down"
    echo "  Restart services: docker-compose restart"
    echo "  Update: git pull && ./deploy.sh"
    echo
    echo "📊 Service Status:"
    docker-compose ps
}

# Main deployment process
main() {
    log_info "TeachAI Deployment Script v1.0"
    echo "Environment: $DEPLOY_ENV"
    echo "Timestamp: $(date)"
    echo

    check_requirements
    backup_data
    generate_ssl
    build_images
    deploy_services
    run_health_checks
    cleanup_old_images
    show_deployment_info
}

# Handle interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main process
main "$@"