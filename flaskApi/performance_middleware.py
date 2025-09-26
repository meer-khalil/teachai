import asyncio
import time
import json
import hashlib
import logging
from functools import wraps
from typing import Dict, Any, Optional, List
import redis
from flask import request, jsonify, current_app
import psutil
import threading
from datetime import datetime, timedelta

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIPerformanceMonitor:
    """Performance monitoring for AI services"""
    
    def __init__(self):
        self.metrics = {
            'requests': {
                'total': 0,
                'successful': 0,
                'failed': 0,
                'average_response_time': 0,
                'cache_hits': 0,
                'cache_misses': 0
            },
            'ai_operations': {
                'total': 0,
                'average_processing_time': 0,
                'memory_usage': 0,
                'cpu_usage': 0
            },
            'system': {
                'memory_percent': 0,
                'cpu_percent': 0,
                'active_threads': 0
            }
        }
        self.response_times = []
        self.max_history = 1000
        self.start_monitoring()
    
    def start_monitoring(self):
        """Start system monitoring in background thread"""
        def monitor_system():
            while True:
                try:
                    # Update system metrics
                    self.metrics['system']['memory_percent'] = psutil.virtual_memory().percent
                    self.metrics['system']['cpu_percent'] = psutil.cpu_percent(interval=1)
                    self.metrics['system']['active_threads'] = threading.active_count()
                    
                    # Log warnings for high resource usage
                    if self.metrics['system']['memory_percent'] > 85:
                        logger.warning(f"⚠️ High memory usage: {self.metrics['system']['memory_percent']}%")
                    
                    if self.metrics['system']['cpu_percent'] > 80:
                        logger.warning(f"⚠️ High CPU usage: {self.metrics['system']['cpu_percent']}%")
                        
                    time.sleep(30)  # Update every 30 seconds
                except Exception as e:
                    logger.error(f"System monitoring error: {e}")
                    time.sleep(60)  # Wait longer on error
        
        monitor_thread = threading.Thread(target=monitor_system, daemon=True)
        monitor_thread.start()
    
    def record_request(self, response_time: float, success: bool, cache_hit: bool = False):
        """Record request metrics"""
        self.metrics['requests']['total'] += 1
        
        if success:
            self.metrics['requests']['successful'] += 1
        else:
            self.metrics['requests']['failed'] += 1
        
        if cache_hit:
            self.metrics['requests']['cache_hits'] += 1
        else:
            self.metrics['requests']['cache_misses'] += 1
        
        # Update response time history
        self.response_times.append(response_time)
        if len(self.response_times) > self.max_history:
            self.response_times.pop(0)
        
        # Calculate average response time
        if self.response_times:
            self.metrics['requests']['average_response_time'] = sum(self.response_times) / len(self.response_times)
    
    def record_ai_operation(self, processing_time: float, memory_used: float):
        """Record AI operation metrics"""
        self.metrics['ai_operations']['total'] += 1
        
        # Update average processing time
        total_ops = self.metrics['ai_operations']['total']
        current_avg = self.metrics['ai_operations']['average_processing_time']
        self.metrics['ai_operations']['average_processing_time'] = (
            (current_avg * (total_ops - 1) + processing_time) / total_ops
        )
        
        # Update memory usage
        self.metrics['ai_operations']['memory_usage'] = memory_used
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics"""
        return {
            **self.metrics,
            'timestamp': datetime.now().isoformat(),
            'cache_hit_rate': self._calculate_cache_hit_rate()
        }
    
    def _calculate_cache_hit_rate(self) -> float:
        """Calculate cache hit rate percentage"""
        total_requests = self.metrics['requests']['cache_hits'] + self.metrics['requests']['cache_misses']
        if total_requests == 0:
            return 0.0
        return (self.metrics['requests']['cache_hits'] / total_requests) * 100

# Global performance monitor instance
performance_monitor = AIPerformanceMonitor()

class AICache:
    """Caching system for AI responses"""
    
    def __init__(self, redis_client=None):
        self.redis_client = redis_client
        self.memory_cache = {}
        self.max_memory_cache_size = 1000
        self.default_ttl = 3600  # 1 hour
    
    def _generate_cache_key(self, prompt: str, model: str = "default", **kwargs) -> str:
        """Generate a unique cache key for the request"""
        cache_data = {
            'prompt': prompt.strip().lower(),
            'model': model,
            **kwargs
        }
        cache_string = json.dumps(cache_data, sort_keys=True)
        return hashlib.sha256(cache_string.encode()).hexdigest()
    
    async def get(self, prompt: str, model: str = "default", **kwargs) -> Optional[Dict[str, Any]]:
        """Get cached response"""
        cache_key = self._generate_cache_key(prompt, model, **kwargs)
        
        try:
            # Try Redis first
            if self.redis_client:
                cached_data = await self._get_from_redis(cache_key)
                if cached_data:
                    logger.info(f"📦 Cache HIT (Redis): {cache_key[:16]}...")
                    return json.loads(cached_data)
            
            # Fall back to memory cache
            if cache_key in self.memory_cache:
                cached_item = self.memory_cache[cache_key]
                if datetime.now() < cached_item['expires']:
                    logger.info(f"📦 Cache HIT (Memory): {cache_key[:16]}...")
                    return cached_item['data']
                else:
                    # Remove expired item
                    del self.memory_cache[cache_key]
            
            logger.info(f"🔍 Cache MISS: {cache_key[:16]}...")
            return None
            
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(self, prompt: str, response: Dict[str, Any], model: str = "default", ttl: int = None, **kwargs):
        """Cache response"""
        cache_key = self._generate_cache_key(prompt, model, **kwargs)
        ttl = ttl or self.default_ttl
        
        try:
            # Try Redis first
            if self.redis_client:
                await self._set_to_redis(cache_key, json.dumps(response), ttl)
                logger.info(f"💾 Cached to Redis: {cache_key[:16]}... (TTL: {ttl}s)")
                return
            
            # Fall back to memory cache
            # Clean up memory cache if it's getting too large
            if len(self.memory_cache) >= self.max_memory_cache_size:
                # Remove oldest entries
                sorted_items = sorted(
                    self.memory_cache.items(),
                    key=lambda x: x[1]['created']
                )
                for i in range(len(sorted_items) // 4):  # Remove 25%
                    del self.memory_cache[sorted_items[i][0]]
            
            expires = datetime.now() + timedelta(seconds=ttl)
            self.memory_cache[cache_key] = {
                'data': response,
                'expires': expires,
                'created': datetime.now()
            }
            logger.info(f"💾 Cached to Memory: {cache_key[:16]}... (TTL: {ttl}s)")
            
        except Exception as e:
            logger.error(f"Cache set error: {e}")
    
    async def _get_from_redis(self, key: str) -> Optional[str]:
        """Get data from Redis"""
        if self.redis_client:
            try:
                return await self.redis_client.get(key)
            except Exception as e:
                logger.error(f"Redis get error: {e}")
                return None
        return None
    
    async def _set_to_redis(self, key: str, value: str, ttl: int):
        """Set data to Redis"""
        if self.redis_client:
            try:
                await self.redis_client.setex(key, ttl, value)
            except Exception as e:
                logger.error(f"Redis set error: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        memory_size = len(self.memory_cache)
        redis_connected = self.redis_client is not None
        
        return {
            'memory_cache_size': memory_size,
            'max_memory_cache_size': self.max_memory_cache_size,
            'redis_connected': redis_connected,
            'default_ttl': self.default_ttl
        }

# Global cache instance
ai_cache = AICache()

def performance_monitoring(f):
    """Decorator for monitoring AI service performance"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        
        try:
            result = f(*args, **kwargs)
            success = True
        except Exception as e:
            logger.error(f"AI service error: {e}")
            success = False
            result = {'error': str(e), 'success': False}
        
        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        
        response_time = (end_time - start_time) * 1000  # Convert to ms
        memory_used = end_memory - start_memory
        
        # Record metrics
        performance_monitor.record_request(response_time, success)
        performance_monitor.record_ai_operation(response_time, memory_used)
        
        # Log slow operations
        if response_time > 2000:  # 2 seconds
            logger.warning(f"🐌 Slow AI operation: {f.__name__} took {response_time:.2f}ms")
        
        return result
    
    return decorated_function

def cached_ai_response(cache_ttl: int = 3600, model: str = "default"):
    """Decorator for caching AI responses"""
    def decorator(f):
        @wraps(f)
        async def decorated_function(*args, **kwargs):
            # Extract prompt from request
            prompt = None
            if request.is_json and request.json:
                prompt = request.json.get('prompt')
            elif request.form:
                prompt = request.form.get('prompt')
            elif request.args:
                prompt = request.args.get('prompt')
            
            if not prompt:
                # If no prompt, don't cache
                return f(*args, **kwargs)
            
            # Try to get from cache
            cache_key_data = {
                'model': model,
                **kwargs,
                **dict(request.args),
                **dict(request.form)
            }
            
            cached_response = await ai_cache.get(prompt, model, **cache_key_data)
            if cached_response:
                performance_monitor.record_request(0, True, cache_hit=True)
                return jsonify(cached_response)
            
            # Execute function and cache result
            start_time = time.time()
            result = f(*args, **kwargs)
            response_time = (time.time() - start_time) * 1000
            
            # Cache the result if it's successful
            if hasattr(result, 'get_json') and result.get_json():
                response_data = result.get_json()
                if response_data.get('success', True):
                    await ai_cache.set(prompt, response_data, model, cache_ttl, **cache_key_data)
            
            performance_monitor.record_request(response_time, True, cache_hit=False)
            return result
        
        return decorated_function
    return decorator

def async_ai_processing(f):
    """Decorator for async AI processing"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            if asyncio.iscoroutinefunction(f):
                result = loop.run_until_complete(f(*args, **kwargs))
            else:
                result = f(*args, **kwargs)
            return result
        finally:
            loop.close()
    
    return decorated_function

def memory_optimization(f):
    """Decorator for memory usage optimization"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        import gc
        
        # Force garbage collection before processing
        gc.collect()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024
        
        try:
            result = f(*args, **kwargs)
            return result
        finally:
            # Force garbage collection after processing
            gc.collect()
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024
            
            memory_used = end_memory - start_memory
            if memory_used > 100:  # 100MB threshold
                logger.warning(f"⚠️ High memory usage in {f.__name__}: {memory_used:.2f}MB")
    
    return decorated_function

# Flask middleware setup functions
def setup_ai_performance_monitoring(app):
    """Setup AI performance monitoring for Flask app"""
    
    @app.before_request
    def before_request():
        request.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        if hasattr(request, 'start_time'):
            response_time = (time.time() - request.start_time) * 1000
            success = response.status_code < 400
            performance_monitor.record_request(response_time, success)
        return response
    
    # Add health check endpoint
    @app.route('/health/performance')
    def performance_health():
        return jsonify(performance_monitor.get_metrics())
    
    # Add cache stats endpoint
    @app.route('/health/cache')
    def cache_health():
        return jsonify(ai_cache.get_cache_stats())
    
    logger.info("✅ AI Performance monitoring setup complete")

# Connection helper for Redis
def setup_redis_cache(app, redis_url: str = None):
    """Setup Redis cache for AI services"""
    try:
        if redis_url:
            redis_client = redis.from_url(redis_url, decode_responses=True)
        else:
            redis_client = redis.Redis(
                host=app.config.get('REDIS_HOST', 'localhost'),
                port=app.config.get('REDIS_PORT', 6379),
                password=app.config.get('REDIS_PASSWORD'),
                decode_responses=True
            )
        
        # Test connection
        redis_client.ping()
        ai_cache.redis_client = redis_client
        logger.info("✅ Redis cache connected successfully")
        
    except Exception as e:
        logger.warning(f"⚠️ Redis connection failed, using memory cache: {e}")
        ai_cache.redis_client = None