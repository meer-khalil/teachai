#!/bin/bash

# TeachAI Production Health Check Script
# Comprehensive health monitoring for production deployment

set -e

# Configuration
API_URL=${API_URL:-"https://localhost/api/v1"}
WEB_URL=${WEB_URL:-"https://localhost"}
TIMEOUT=${TIMEOUT:-30}
MAX_RETRIES=${MAX_RETRIES:-3}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Health check functions
check_service_health() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    log_info "Checking $service_name health..."
    
    for i in $(seq 1 $MAX_RETRIES); do
        response=$(curl -s -o /dev/null -w "%{http_code}:%{time_total}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000:0")
        status_code=$(echo $response | cut -d: -f1)
        response_time=$(echo $response | cut -d: -f2)
        
        if [ "$status_code" = "$expected_status" ]; then
            log_success "$service_name is healthy (${response_time}s)"
            return 0
        else
            log_warning "$service_name check attempt $i failed (status: $status_code)"
            [ $i -lt $MAX_RETRIES ] && sleep 2
        fi
    done
    
    log_error "$service_name health check failed after $MAX_RETRIES attempts"
    return 1
}

check_api_endpoints() {
    log_info "Testing critical API endpoints..."
    
    # Public endpoints
    check_service_health "API Health" "$API_URL/health"
    check_service_health "API Documentation" "$API_URL/../api-docs"
    
    # Check if authentication endpoint is accessible
    auth_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test","password":"test"}' 2>/dev/null || echo "000")
    
    if [ "$auth_response" = "400" ] || [ "$auth_response" = "401" ]; then
        log_success "Authentication endpoint is accessible"
    else
        log_warning "Authentication endpoint returned status: $auth_response"
    fi
}

check_database_connectivity() {
    log_info "Checking database connectivity..."
    
    # Check if MongoDB container is running
    if docker-compose ps mongodb | grep -q "Up"; then
        # Test database connection through API
        db_response=$(curl -s --max-time $TIMEOUT "$API_URL/health" | grep -o '"database":"connected"' || echo "")
        
        if [ -n "$db_response" ]; then
            log_success "Database connectivity verified"
        else
            log_error "Database connectivity test failed"
            return 1
        fi
    else
        log_error "MongoDB container is not running"
        return 1
    fi
}

check_cache_connectivity() {
    log_info "Checking cache connectivity..."
    
    # Check if Redis container is running
    if docker-compose ps redis | grep -q "Up"; then
        # Test Redis connection through API
        cache_response=$(curl -s --max-time $TIMEOUT "$API_URL/health" | grep -o '"cache":"connected"' || echo "")
        
        if [ -n "$cache_response" ]; then
            log_success "Cache connectivity verified"
        else
            log_warning "Cache connectivity test inconclusive"
        fi
    else
        log_error "Redis container is not running"
        return 1
    fi
}

check_ssl_certificates() {
    log_info "Checking SSL certificate validity..."
    
    # Extract hostname from URL
    hostname=$(echo $WEB_URL | sed 's|https\?://||' | cut -d'/' -f1)
    
    # Check certificate expiration
    cert_info=$(echo | openssl s_client -servername $hostname -connect $hostname:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
    
    if [ -n "$cert_info" ]; then
        expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
        current_epoch=$(date +%s)
        days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
        
        if [ $days_until_expiry -gt 30 ]; then
            log_success "SSL certificate is valid ($days_until_expiry days remaining)"
        elif [ $days_until_expiry -gt 7 ]; then
            log_warning "SSL certificate expires in $days_until_expiry days"
        else
            log_error "SSL certificate expires in $days_until_expiry days - renewal needed!"
            return 1
        fi
    else
        log_warning "Could not verify SSL certificate"
    fi
}

check_performance_metrics() {
    log_info "Checking performance metrics..."
    
    # Test response times
    start_time=$(date +%s.%N)
    curl -s --max-time $TIMEOUT "$WEB_URL" >/dev/null
    end_time=$(date +%s.%N)
    response_time=$(echo "$end_time - $start_time" | bc)
    
    if (( $(echo "$response_time < 2.0" | bc -l) )); then
        log_success "Frontend response time: ${response_time}s"
    else
        log_warning "Frontend response time slow: ${response_time}s"
    fi
    
    # Check API response time
    start_time=$(date +%s.%N)
    curl -s --max-time $TIMEOUT "$API_URL/health" >/dev/null
    end_time=$(date +%s.%N)
    api_response_time=$(echo "$end_time - $start_time" | bc)
    
    if (( $(echo "$api_response_time < 1.0" | bc -l) )); then
        log_success "API response time: ${api_response_time}s"
    else
        log_warning "API response time slow: ${api_response_time}s"
    fi
}

check_docker_resources() {
    log_info "Checking Docker container resources..."
    
    # Check container status
    containers=$(docker-compose ps --services)
    for container in $containers; do
        status=$(docker-compose ps $container | tail -n1 | awk '{print $4}')
        if [ "$status" = "Up" ]; then
            log_success "Container $container is running"
            
            # Check memory usage
            container_id=$(docker-compose ps -q $container)
            if [ -n "$container_id" ]; then
                memory_usage=$(docker stats --no-stream --format "{{.MemPerc}}" $container_id | sed 's/%//')
                if (( $(echo "$memory_usage < 80" | bc -l) )); then
                    log_success "Container $container memory usage: ${memory_usage}%"
                else
                    log_warning "Container $container high memory usage: ${memory_usage}%"
                fi
            fi
        else
            log_error "Container $container is not running (status: $status)"
            return 1
        fi
    done
}

check_disk_space() {
    log_info "Checking disk space..."
    
    disk_usage=$(df -h . | tail -n1 | awk '{print $5}' | sed 's/%//')
    
    if [ $disk_usage -lt 80 ]; then
        log_success "Disk usage: ${disk_usage}%"
    elif [ $disk_usage -lt 90 ]; then
        log_warning "Disk usage high: ${disk_usage}%"
    else
        log_error "Disk usage critical: ${disk_usage}%"
        return 1
    fi
}

generate_report() {
    echo
    echo "==================== HEALTH CHECK REPORT ===================="
    echo "Timestamp: $(date)"
    echo "Target URLs:"
    echo "  Frontend: $WEB_URL"
    echo "  API: $API_URL"
    echo
    echo "Service Status:"
    docker-compose ps
    echo
    echo "Docker System Info:"
    docker system df
    echo "==========================================================="
}

# Main health check execution
main() {
    log_info "Starting comprehensive health check..."
    echo "Target: $WEB_URL | API: $API_URL"
    echo
    
    local exit_code=0
    
    # Core service checks
    check_service_health "Frontend" "$WEB_URL" || exit_code=1
    check_api_endpoints || exit_code=1
    check_database_connectivity || exit_code=1
    check_cache_connectivity || exit_code=1
    
    # Security and performance
    check_ssl_certificates || exit_code=1
    check_performance_metrics || exit_code=1
    
    # Infrastructure checks
    check_docker_resources || exit_code=1
    check_disk_space || exit_code=1
    
    echo
    if [ $exit_code -eq 0 ]; then
        log_success "🎉 All health checks passed!"
    else
        log_error "❌ Some health checks failed!"
    fi
    
    generate_report
    
    return $exit_code
}

# Handle script arguments
case "${1:-}" in
    --report-only)
        generate_report
        ;;
    --quick)
        check_service_health "Frontend" "$WEB_URL"
        check_service_health "API Health" "$API_URL/health"
        ;;
    *)
        main "$@"
        ;;
esac