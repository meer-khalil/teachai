import logging
import traceback
import sys
import time
from functools import wraps
from typing import Dict, Any, Optional, Callable
from flask import request, jsonify, current_app
import psutil
import asyncio
from datetime import datetime
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class AIErrorHandler:
    """Comprehensive error handling for AI services"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.error_counts = {}
        self.performance_metrics = {
            'total_requests': 0,
            'failed_requests': 0,
            'average_response_time': 0,
            'slow_requests': 0
        }
    
    def log_error(self, error: Exception, context: Dict[str, Any] = None):
        """Log error with context information"""
        error_data = {
            'error': {
                'type': type(error).__name__,
                'message': str(error),
                'traceback': traceback.format_exc(),
                'timestamp': datetime.now().isoformat()
            },
            'context': context or {},
            'system': {
                'memory_percent': psutil.virtual_memory().percent,
                'cpu_percent': psutil.cpu_percent(),
                'disk_usage': psutil.disk_usage('/').percent
            }
        }
        
        self.logger.error(f"AI Service Error: {error}", extra=error_data)
        
        # Update error counts
        error_type = type(error).__name__
        self.error_counts[error_type] = self.error_counts.get(error_type, 0) + 1
    
    def handle_openai_error(self, error):
        """Handle OpenAI API specific errors"""
        error_mapping = {
            'RateLimitError': {
                'message': 'API rate limit exceeded. Please try again later.',
                'status_code': 429,
                'retry_after': 60
            },
            'InvalidRequestError': {
                'message': 'Invalid request to AI service.',
                'status_code': 400
            },
            'AuthenticationError': {
                'message': 'AI service authentication failed.',
                'status_code': 401
            },
            'ServiceUnavailableError': {
                'message': 'AI service is temporarily unavailable.',
                'status_code': 503,
                'retry_after': 30
            },
            'TimeoutError': {
                'message': 'AI service request timed out.',
                'status_code': 504
            }
        }
        
        error_type = type(error).__name__
        error_info = error_mapping.get(error_type, {
            'message': f'AI service error: {str(error)}',
            'status_code': 500
        })
        
        return error_info
    
    def create_error_response(self, error: Exception, request_id: str = None) -> Dict[str, Any]:
        """Create standardized error response"""
        if 'openai' in str(type(error)).lower():
            error_info = self.handle_openai_error(error)
        else:
            error_info = {
                'message': 'An unexpected error occurred.',
                'status_code': 500
            }
        
        response = {
            'success': False,
            'error': {
                'type': type(error).__name__,
                'message': error_info['message'],
                'timestamp': datetime.now().isoformat()
            },
            'request_id': request_id
        }
        
        if 'retry_after' in error_info:
            response['retry_after'] = error_info['retry_after']
        
        return response, error_info['status_code']

# Global error handler instance
ai_error_handler = AIErrorHandler()

def handle_ai_errors(operation_name: str = None):
    """Decorator for handling AI operation errors"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            request_id = getattr(request, 'request_id', None)
            
            try:
                # Update metrics
                ai_error_handler.performance_metrics['total_requests'] += 1
                
                # Execute the function
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                
                # Calculate response time
                response_time = (time.time() - start_time) * 1000
                
                # Update performance metrics
                total_requests = ai_error_handler.performance_metrics['total_requests']
                current_avg = ai_error_handler.performance_metrics['average_response_time']
                ai_error_handler.performance_metrics['average_response_time'] = (
                    (current_avg * (total_requests - 1) + response_time) / total_requests
                )
                
                # Track slow requests
                if response_time > 2000:  # 2 seconds
                    ai_error_handler.performance_metrics['slow_requests'] += 1
                    ai_error_handler.logger.warning(
                        f"Slow AI operation: {operation_name or func.__name__} took {response_time:.2f}ms"
                    )
                
                return result
                
            except Exception as error:
                response_time = (time.time() - start_time) * 1000
                ai_error_handler.performance_metrics['failed_requests'] += 1
                
                # Create error context
                context = {
                    'operation': operation_name or func.__name__,
                    'request_id': request_id,
                    'response_time': f"{response_time:.2f}ms",
                    'args': str(args)[:200],  # Limit args length
                    'kwargs': str(kwargs)[:200]  # Limit kwargs length
                }
                
                # Log the error
                ai_error_handler.log_error(error, context)
                
                # Return error response
                error_response, status_code = ai_error_handler.create_error_response(error, request_id)
                
                return jsonify(error_response), status_code
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            request_id = getattr(request, 'request_id', None)
            
            try:
                # Update metrics
                ai_error_handler.performance_metrics['total_requests'] += 1
                
                # Execute the function
                result = func(*args, **kwargs)
                
                # Calculate response time
                response_time = (time.time() - start_time) * 1000
                
                # Update performance metrics
                total_requests = ai_error_handler.performance_metrics['total_requests']
                current_avg = ai_error_handler.performance_metrics['average_response_time']
                ai_error_handler.performance_metrics['average_response_time'] = (
                    (current_avg * (total_requests - 1) + response_time) / total_requests
                )
                
                # Track slow requests
                if response_time > 2000:  # 2 seconds
                    ai_error_handler.performance_metrics['slow_requests'] += 1
                    ai_error_handler.logger.warning(
                        f"Slow AI operation: {operation_name or func.__name__} took {response_time:.2f}ms"
                    )
                
                return result
                
            except Exception as error:
                response_time = (time.time() - start_time) * 1000
                ai_error_handler.performance_metrics['failed_requests'] += 1
                
                # Create error context
                context = {
                    'operation': operation_name or func.__name__,
                    'request_id': request_id,
                    'response_time': f"{response_time:.2f}ms",
                    'args': str(args)[:200],  # Limit args length
                    'kwargs': str(kwargs)[:200]  # Limit kwargs length
                }
                
                # Log the error
                ai_error_handler.log_error(error, context)
                
                # Return error response
                error_response, status_code = ai_error_handler.create_error_response(error, request_id)
                
                return jsonify(error_response), status_code
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def retry_on_failure(max_retries: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator for retrying failed operations"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            last_error = None
            
            for attempt in range(max_retries + 1):
                try:
                    if asyncio.iscoroutinefunction(func):
                        return await func(*args, **kwargs)
                    else:
                        return func(*args, **kwargs)
                        
                except Exception as error:
                    last_error = error
                    
                    if attempt < max_retries:
                        wait_time = delay * (backoff ** attempt)
                        ai_error_handler.logger.warning(
                            f"Attempt {attempt + 1} failed for {func.__name__}, "
                            f"retrying in {wait_time:.1f}s: {str(error)}"
                        )
                        await asyncio.sleep(wait_time)
                    else:
                        ai_error_handler.logger.error(
                            f"All {max_retries + 1} attempts failed for {func.__name__}: {str(error)}"
                        )
            
            raise last_error
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            last_error = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                        
                except Exception as error:
                    last_error = error
                    
                    if attempt < max_retries:
                        wait_time = delay * (backoff ** attempt)
                        ai_error_handler.logger.warning(
                            f"Attempt {attempt + 1} failed for {func.__name__}, "
                            f"retrying in {wait_time:.1f}s: {str(error)}"
                        )
                        time.sleep(wait_time)
                    else:
                        ai_error_handler.logger.error(
                            f"All {max_retries + 1} attempts failed for {func.__name__}: {str(error)}"
                        )
            
            raise last_error
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def timeout_handler(timeout_seconds: float = 30.0):
    """Decorator for handling operation timeouts"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(
                    func(*args, **kwargs) if asyncio.iscoroutinefunction(func) else asyncio.create_task(func(*args, **kwargs)),
                    timeout=timeout_seconds
                )
            except asyncio.TimeoutError:
                error_msg = f"Operation {func.__name__} timed out after {timeout_seconds} seconds"
                ai_error_handler.logger.error(error_msg)
                raise TimeoutError(error_msg)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            import signal
            
            def timeout_handler_func(signum, frame):
                raise TimeoutError(f"Operation {func.__name__} timed out after {timeout_seconds} seconds")
            
            # Set the signal handler
            old_handler = signal.signal(signal.SIGALRM, timeout_handler_func)
            signal.alarm(int(timeout_seconds))
            
            try:
                result = func(*args, **kwargs)
                signal.alarm(0)  # Cancel the alarm
                return result
            except TimeoutError:
                raise
            finally:
                signal.signal(signal.SIGALRM, old_handler)
        
        # Return appropriate wrapper based on function type
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator

def validate_ai_input(required_fields: list = None, max_length: int = 10000):
    """Decorator for validating AI service inputs"""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                # Get request data
                data = request.get_json() if request.is_json else request.form.to_dict()
                
                if not data:
                    return jsonify({
                        'success': False,
                        'error': {
                            'type': 'ValidationError',
                            'message': 'No input data provided',
                            'timestamp': datetime.now().isoformat()
                        }
                    }), 400
                
                # Check required fields
                if required_fields:
                    missing_fields = [field for field in required_fields if field not in data]
                    if missing_fields:
                        return jsonify({
                            'success': False,
                            'error': {
                                'type': 'ValidationError',
                                'message': f'Missing required fields: {", ".join(missing_fields)}',
                                'missing_fields': missing_fields,
                                'timestamp': datetime.now().isoformat()
                            }
                        }), 400
                
                # Check input length
                for field, value in data.items():
                    if isinstance(value, str) and len(value) > max_length:
                        return jsonify({
                            'success': False,
                            'error': {
                                'type': 'ValidationError',
                                'message': f'Field "{field}" exceeds maximum length of {max_length} characters',
                                'field': field,
                                'max_length': max_length,
                                'timestamp': datetime.now().isoformat()
                            }
                        }), 400
                
                return func(*args, **kwargs)
                
            except Exception as error:
                ai_error_handler.log_error(error, {'operation': 'input_validation'})
                return jsonify({
                    'success': False,
                    'error': {
                        'type': 'ValidationError',
                        'message': 'Input validation failed',
                        'timestamp': datetime.now().isoformat()
                    }
                }), 400
        
        return wrapper
    return decorator

# Flask error handlers
def setup_ai_error_handlers(app):
    """Setup Flask error handlers for AI service"""
    
    @app.before_request
    def before_request():
        # Generate request ID
        import uuid
        request.request_id = str(uuid.uuid4())
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': {
                'type': 'NotFoundError',
                'message': 'Endpoint not found',
                'path': request.path,
                'method': request.method,
                'timestamp': datetime.now().isoformat()
            },
            'request_id': getattr(request, 'request_id', None)
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            'success': False,
            'error': {
                'type': 'MethodNotAllowedError',
                'message': 'Method not allowed',
                'path': request.path,
                'method': request.method,
                'timestamp': datetime.now().isoformat()
            },
            'request_id': getattr(request, 'request_id', None)
        }), 405
    
    @app.errorhandler(500)
    def internal_server_error(error):
        ai_error_handler.log_error(error, {
            'path': request.path,
            'method': request.method,
            'request_id': getattr(request, 'request_id', None)
        })
        
        return jsonify({
            'success': False,
            'error': {
                'type': 'InternalServerError',
                'message': 'Internal server error occurred',
                'timestamp': datetime.now().isoformat()
            },
            'request_id': getattr(request, 'request_id', None)
        }), 500
    
    # Health check endpoint
    @app.route('/health')
    def health_check():
        try:
            # Basic health metrics
            system_metrics = {
                'memory_percent': psutil.virtual_memory().percent,
                'cpu_percent': psutil.cpu_percent(),
                'disk_usage': psutil.disk_usage('/').percent,
                'uptime': time.time() - psutil.boot_time()
            }
            
            # Performance metrics
            performance = ai_error_handler.performance_metrics.copy()
            if performance['total_requests'] > 0:
                performance['error_rate'] = (performance['failed_requests'] / performance['total_requests']) * 100
                performance['slow_request_rate'] = (performance['slow_requests'] / performance['total_requests']) * 100
            else:
                performance['error_rate'] = 0
                performance['slow_request_rate'] = 0
            
            # Determine health status
            status = 'healthy'
            if (system_metrics['memory_percent'] > 90 or 
                system_metrics['cpu_percent'] > 90 or
                performance['error_rate'] > 10):
                status = 'unhealthy'
            elif (system_metrics['memory_percent'] > 80 or 
                  system_metrics['cpu_percent'] > 80 or
                  performance['error_rate'] > 5):
                status = 'degraded'
            
            return jsonify({
                'status': status,
                'timestamp': datetime.now().isoformat(),
                'system': system_metrics,
                'performance': performance,
                'error_counts': ai_error_handler.error_counts
            })
            
        except Exception as error:
            ai_error_handler.log_error(error, {'operation': 'health_check'})
            return jsonify({
                'status': 'unhealthy',
                'error': str(error),
                'timestamp': datetime.now().isoformat()
            }), 500
    
    ai_error_handler.logger.info("AI Error handlers setup complete")

# Export the main components
__all__ = [
    'handle_ai_errors',
    'retry_on_failure', 
    'timeout_handler',
    'validate_ai_input',
    'setup_ai_error_handlers',
    'ai_error_handler'
]