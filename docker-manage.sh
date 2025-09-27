#!/bin/bash

# TeachAI Docker Management Script
# This script provides easy commands to manage the TeachAI Docker environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
DEV_COMPOSE_FILE="docker-compose.dev.yml"
PROD_COMPOSE_FILE="docker-compose.prod.yml"

# Function to print colored output
print_color() {
    printf "${2}${1}${NC}\n"
}

# Function to print usage
print_usage() {
    echo "TeachAI Docker Management Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  dev             Start development environment"
    echo "  prod            Start production environment"
    echo "  stop            Stop all services"
    echo "  restart         Restart all services"
    echo "  logs            View logs from all services"
    echo "  build           Build all Docker images"
    echo "  clean           Remove all containers, volumes, and images"
    echo "  backup          Backup database and volumes"
    echo "  restore         Restore database and volumes"
    echo "  health          Check health of all services"
    echo "  scale           Scale services (usage: scale [service] [count])"
    echo "  shell           Open shell in a service container"
    echo "  update          Update and rebuild services"
    echo ""
    echo "Options:"
    echo "  --build         Force rebuild of images"
    echo "  --pull          Pull latest base images"
    echo "  --no-cache      Build without cache"
    echo "  --verbose       Verbose output"
    echo ""
    echo "Examples:"
    echo "  $0 dev                    # Start development environment"
    echo "  $0 prod --build           # Start production with rebuild"
    echo "  $0 logs backend           # View backend service logs"
    echo "  $0 scale backend 3        # Scale backend to 3 replicas"
    echo "  $0 shell backend          # Open shell in backend container"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_color "Error: Docker is not running. Please start Docker first." "$RED"
        exit 1
    fi
}

# Function to check if required files exist
check_requirements() {
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        print_color "Error: docker-compose.yml not found!" "$RED"
        exit 1
    fi
    
    if [[ ! -f ".env" ]] && [[ ! -f ".env.example" ]]; then
        print_color "Warning: No .env file found. Using defaults." "$YELLOW"
    fi
}

# Function to create .env from example if it doesn't exist
create_env_file() {
    if [[ ! -f ".env" ]] && [[ -f ".env.example" ]]; then
        print_color "Creating .env file from .env.example..." "$BLUE"
        cp .env.example .env
        print_color "Please edit .env file with your configuration before continuing." "$YELLOW"
        print_color "Press Enter to continue after editing .env file..."
        read
    fi
}

# Function to start development environment
start_dev() {
    print_color "Starting TeachAI Development Environment..." "$GREEN"
    create_env_file
    
    COMPOSE_COMMAND="docker-compose -f $COMPOSE_FILE -f $DEV_COMPOSE_FILE"
    
    if [[ "$BUILD" == "true" ]]; then
        $COMPOSE_COMMAND build
    fi
    
    if [[ "$PULL" == "true" ]]; then
        $COMPOSE_COMMAND pull
    fi
    
    $COMPOSE_COMMAND up -d
    
    print_color "Development environment started successfully!" "$GREEN"
    print_color "Services available at:" "$BLUE"
    print_color "  Frontend: http://localhost:3000" "$BLUE"
    print_color "  Backend API: http://localhost:4000" "$BLUE"
    print_color "  Flask AI: http://localhost:5000" "$BLUE"
    print_color "  MongoDB: mongodb://localhost:27017" "$BLUE"
    print_color "  Redis: redis://localhost:6379" "$BLUE"
    print_color "  Mongo Express: http://localhost:8081" "$BLUE"
    print_color "  Redis Commander: http://localhost:8082" "$BLUE"
}

# Function to start production environment
start_prod() {
    print_color "Starting TeachAI Production Environment..." "$GREEN"
    create_env_file
    
    COMPOSE_COMMAND="docker-compose -f $COMPOSE_FILE -f $PROD_COMPOSE_FILE"
    
    if [[ "$BUILD" == "true" ]]; then
        $COMPOSE_COMMAND build
    fi
    
    if [[ "$PULL" == "true" ]]; then
        $COMPOSE_COMMAND pull
    fi
    
    $COMPOSE_COMMAND up -d
    
    print_color "Production environment started successfully!" "$GREEN"
    print_color "Services available at:" "$BLUE"
    print_color "  Application: http://localhost:80" "$BLUE"
    print_color "  Monitoring: http://localhost:3001" "$BLUE"
}

# Function to stop services
stop_services() {
    print_color "Stopping TeachAI services..." "$YELLOW"
    docker-compose -f $COMPOSE_FILE -f $DEV_COMPOSE_FILE -f $PROD_COMPOSE_FILE down
    print_color "All services stopped." "$GREEN"
}

# Function to restart services
restart_services() {
    print_color "Restarting TeachAI services..." "$YELLOW"
    stop_services
    sleep 2
    if [[ -f "$DEV_COMPOSE_FILE" ]] && docker-compose -f $DEV_COMPOSE_FILE ps -q > /dev/null 2>&1; then
        start_dev
    else
        start_prod
    fi
}

# Function to view logs
view_logs() {
    local service=${1:-""}
    if [[ -n "$service" ]]; then
        print_color "Showing logs for $service..." "$BLUE"
        docker-compose logs -f "$service"
    else
        print_color "Showing logs for all services..." "$BLUE"
        docker-compose logs -f
    fi
}

# Function to build images
build_images() {
    print_color "Building TeachAI Docker images..." "$BLUE"
    
    BUILD_ARGS=""
    if [[ "$NO_CACHE" == "true" ]]; then
        BUILD_ARGS="--no-cache"
    fi
    
    docker-compose -f $COMPOSE_FILE build $BUILD_ARGS
    print_color "Build completed successfully!" "$GREEN"
}

# Function to clean up
clean_all() {
    print_color "Warning: This will remove all TeachAI containers, volumes, and images!" "$RED"
    print_color "Are you sure? (y/N): " "$YELLOW"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_color "Cleaning up..." "$YELLOW"
        
        # Stop and remove containers
        docker-compose -f $COMPOSE_FILE -f $DEV_COMPOSE_FILE -f $PROD_COMPOSE_FILE down -v --rmi all
        
        # Remove dangling images
        docker image prune -f
        
        # Remove unused volumes
        docker volume prune -f
        
        print_color "Cleanup completed!" "$GREEN"
    else
        print_color "Cleanup cancelled." "$BLUE"
    fi
}

# Function to check health
check_health() {
    print_color "Checking health of TeachAI services..." "$BLUE"
    docker-compose ps
    
    print_color "\nDetailed health status:" "$BLUE"
    for service in mongodb redis backend flask-ai frontend; do
        if docker-compose ps | grep -q "$service"; then
            health_status=$(docker inspect --format='{{.State.Health.Status}}' "teachai-$service" 2>/dev/null || echo "no-health-check")
            if [[ "$health_status" == "healthy" ]]; then
                print_color "  $service: ✓ Healthy" "$GREEN"
            elif [[ "$health_status" == "unhealthy" ]]; then
                print_color "  $service: ✗ Unhealthy" "$RED"
            else
                print_color "  $service: ? No health check" "$YELLOW"
            fi
        else
            print_color "  $service: ✗ Not running" "$RED"
        fi
    done
}

# Function to scale services
scale_service() {
    local service=$1
    local count=$2
    
    if [[ -z "$service" ]] || [[ -z "$count" ]]; then
        print_color "Usage: scale [service] [count]" "$RED"
        exit 1
    fi
    
    print_color "Scaling $service to $count replicas..." "$BLUE"
    docker-compose up -d --scale "$service=$count"
    print_color "Service scaled successfully!" "$GREEN"
}

# Function to open shell in service
open_shell() {
    local service=${1:-"backend"}
    local container_name="teachai-$service"
    
    if docker ps | grep -q "$container_name"; then
        print_color "Opening shell in $service container..." "$BLUE"
        docker exec -it "$container_name" /bin/sh
    else
        print_color "Error: Container $container_name is not running!" "$RED"
        exit 1
    fi
}

# Function to backup data
backup_data() {
    print_color "Creating backup of TeachAI data..." "$BLUE"
    
    BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup MongoDB
    if docker ps | grep -q "teachai-mongodb"; then
        print_color "Backing up MongoDB..." "$BLUE"
        docker exec teachai-mongodb mongodump --out /tmp/backup
        docker cp teachai-mongodb:/tmp/backup "$BACKUP_DIR/mongodb"
    fi
    
    # Backup volumes
    print_color "Backing up Docker volumes..." "$BLUE"
    docker run --rm -v teachai_backend_uploads:/data -v "$PWD/$BACKUP_DIR:/backup" alpine tar czf /backup/backend_uploads.tar.gz -C /data .
    docker run --rm -v teachai_flask_data:/data -v "$PWD/$BACKUP_DIR:/backup" alpine tar czf /backup/flask_data.tar.gz -C /data .
    
    print_color "Backup completed: $BACKUP_DIR" "$GREEN"
}

# Function to restore data
restore_data() {
    local backup_dir=${1:-""}
    
    if [[ -z "$backup_dir" ]] || [[ ! -d "$backup_dir" ]]; then
        print_color "Usage: restore [backup_directory]" "$RED"
        print_color "Available backups:" "$BLUE"
        ls -la ./backups/ 2>/dev/null || echo "No backups found"
        exit 1
    fi
    
    print_color "Restoring data from $backup_dir..." "$BLUE"
    print_color "Warning: This will overwrite existing data!" "$RED"
    print_color "Continue? (y/N): " "$YELLOW"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        # Restore MongoDB
        if [[ -d "$backup_dir/mongodb" ]]; then
            docker cp "$backup_dir/mongodb" teachai-mongodb:/tmp/restore
            docker exec teachai-mongodb mongorestore --drop /tmp/restore
        fi
        
        # Restore volumes
        if [[ -f "$backup_dir/backend_uploads.tar.gz" ]]; then
            docker run --rm -v teachai_backend_uploads:/data -v "$PWD/$backup_dir:/backup" alpine tar xzf /backup/backend_uploads.tar.gz -C /data
        fi
        
        if [[ -f "$backup_dir/flask_data.tar.gz" ]]; then
            docker run --rm -v teachai_flask_data:/data -v "$PWD/$backup_dir:/backup" alpine tar xzf /backup/flask_data.tar.gz -C /data
        fi
        
        print_color "Restore completed!" "$GREEN"
    else
        print_color "Restore cancelled." "$BLUE"
    fi
}

# Function to update services
update_services() {
    print_color "Updating TeachAI services..." "$BLUE"
    
    # Pull latest base images
    docker-compose pull
    
    # Rebuild services
    docker-compose build --pull
    
    # Restart services
    docker-compose up -d
    
    print_color "Update completed!" "$GREEN"
}

# Parse command line arguments
COMMAND=""
BUILD="false"
PULL="false"
NO_CACHE="false"
VERBOSE="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        dev|prod|stop|restart|logs|build|clean|backup|restore|health|scale|shell|update)
            COMMAND=$1
            shift
            ;;
        --build)
            BUILD="true"
            shift
            ;;
        --pull)
            PULL="true"
            shift
            ;;
        --no-cache)
            NO_CACHE="true"
            shift
            ;;
        --verbose)
            VERBOSE="true"
            set -x
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            break
            ;;
    esac
done

# Check requirements
check_docker
check_requirements

# Execute command
case $COMMAND in
    dev)
        start_dev
        ;;
    prod)
        start_prod
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs "$1"
        ;;
    build)
        build_images
        ;;
    clean)
        clean_all
        ;;
    backup)
        backup_data
        ;;
    restore)
        restore_data "$1"
        ;;
    health)
        check_health
        ;;
    scale)
        scale_service "$1" "$2"
        ;;
    shell)
        open_shell "$1"
        ;;
    update)
        update_services
        ;;
    *)
        print_color "Error: Unknown command '$COMMAND'" "$RED"
        print_usage
        exit 1
        ;;
esac