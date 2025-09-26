import os
import time
import functools
from flask import Flask, request, jsonify, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
import logging
from datetime import datetime, timedelta
import hashlib
import hmac

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.environ.get('LOG_LEVEL', 'INFO').upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SecurityConfig:
    """Security configuration for Flask AI services"""
    
    # Rate limiting configuration
    RATE_LIMITS = {
        'default': '100 per hour',
        'ai_generation': '50 per hour',
        'file_upload': '10 per hour',
        'auth': '5 per minute'
    }
    
    # CORS configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')
    
    # Security headers
    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'X-Content-Security-Policy': "default-src 'self'"
    }
    
    # API key configuration
    API_KEY_HEADER = 'X-API-Key'
    API_KEY_REQUIRED_ENDPOINTS = [
        '/lessonplanner',
        '/quiz',
        '/gradeEssay',
        '/mathquiz',
        '/math/lesson',
        '/powerpoint',
        '/detectai',
        '/checkplag'
    ]

def init_security(app: Flask):
    """Initialize security middleware for Flask app"""
    
    # Apply proxy fix for proper IP detection behind load balancers
    app.wsgi_app = ProxyFix(app.wsgi_app)
    
    # Initialize rate limiter
    limiter = Limiter(
        app,
        key_func=get_remote_address,
        default_limits=[SecurityConfig.RATE_LIMITS['default']],
        storage_uri=os.environ.get('REDIS_URL', 'memory://'),
        strategy='moving-window'
    )
    
    # Initialize CORS
    CORS(app, origins=SecurityConfig.CORS_ORIGINS, supports_credentials=True)
    
    # Add security headers to all responses
    @app.after_request
    def add_security_headers(response):
        for header, value in SecurityConfig.SECURITY_HEADERS.items():
            response.headers[header] = value
        return response
    
    # Log all requests for monitoring
    @app.before_request
    def log_request_info():
        g.start_time = time.time()
        logger.info(f'Request: {request.method} {request.path} from {request.remote_addr}')
    
    @app.after_request
    def log_response_info(response):
        duration = time.time() - g.start_time if hasattr(g, 'start_time') else 0
        logger.info(f'Response: {response.status_code} - Duration: {duration:.3f}s')
        return response
    
    return limiter

def require_api_key(f):
    """Decorator to require API key authentication"""
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get(SecurityConfig.API_KEY_HEADER)
        
        if not api_key:
            logger.warning(f'Missing API key for {request.path} from {request.remote_addr}')
            return jsonify({
                'error': 'API key is required',
                'message': 'Please provide a valid API key in the X-API-Key header'
            }), 401
        
        # Validate API key
        expected_key = os.environ.get('API_KEY')
        if not expected_key:
            logger.error('API_KEY environment variable not set')
            return jsonify({
                'error': 'Server configuration error'
            }), 500
        
        if not hmac.compare_digest(api_key, expected_key):
            logger.warning(f'Invalid API key attempt from {request.remote_addr}')
            return jsonify({
                'error': 'Invalid API key'
            }), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

def validate_input_size(max_length=10000):
    """Decorator to validate input size"""
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            if request.is_json:
                content_length = len(str(request.get_json()))
            else:
                content_length = len(request.get_data())
            
            if content_length > max_length:
                logger.warning(f'Input too large: {content_length} bytes from {request.remote_addr}')
                return jsonify({
                    'error': 'Input too large',
                    'message': f'Maximum input size is {max_length} characters'
                }), 413
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def sanitize_input(data):
    """Sanitize user input to prevent injection attacks"""
    if isinstance(data, dict):
        return {key: sanitize_input(value) for key, value in data.items()}
    elif isinstance(data, list):
        return [sanitize_input(item) for item in data]
    elif isinstance(data, str):
        # Remove potentially dangerous characters
        dangerous_chars = ['<', '>', '"', "'", '&', ';', '(', ')', '|', '`']
        for char in dangerous_chars:
            data = data.replace(char, '')
        return data.strip()
    else:
        return data

def rate_limit_by_endpoint(endpoint_type):
    """Apply specific rate limiting based on endpoint type"""
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            # This would be handled by the limiter decorator
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_security_event(event_type, details):
    """Log security-related events"""
    logger.warning(f'SECURITY EVENT - {event_type}: {details} - IP: {request.remote_addr} - Time: {datetime.utcnow()}')

# Error handlers for security-related errors
def register_security_error_handlers(app):
    """Register error handlers for security-related errors"""
    
    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({
            'error': 'Bad Request',
            'message': 'The request could not be understood by the server'
        }), 400
    
    @app.errorhandler(401)
    def unauthorized_error(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication required'
        }), 401
    
    @app.errorhandler(403)
    def forbidden_error(error):
        return jsonify({
            'error': 'Forbidden',
            'message': 'Access denied'
        }), 403
    
    @app.errorhandler(413)
    def payload_too_large_error(error):
        return jsonify({
            'error': 'Payload Too Large',
            'message': 'Request entity too large'
        }), 413
    
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({
            'error': 'Rate limit exceeded',
            'message': 'Too many requests. Please try again later.',
            'retry_after': str(e.retry_after)
        }), 429

# Security audit function
def security_audit():
    """Perform basic security audit"""
    issues = []
    
    # Check environment variables
    required_env_vars = ['OPENAI_API_KEY', 'FLASK_SECRET_KEY']
    for var in required_env_vars:
        if not os.environ.get(var):
            issues.append(f'Missing required environment variable: {var}')
    
    # Check if in production without debug mode
    if os.environ.get('FLASK_ENV') == 'production' and os.environ.get('FLASK_DEBUG') == '1':
        issues.append('Debug mode should be disabled in production')
    
    # Check API key strength (if provided)
    api_key = os.environ.get('API_KEY')
    if api_key and len(api_key) < 32:
        issues.append('API key should be at least 32 characters long')
    
    return issues\n