
import os
from datetime import timedelta

class Config(object):
    DEBUG = True
    TESTING = False
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Security Headers
    SECURITY_HEADERS = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    }
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL') or 'memory://'
    RATELIMIT_DEFAULT = '100 per hour'
    
    # CORS Configuration
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:3000').split(',')

class DevelopmentConfig(Config):
    DEBUG = True
    # OpenAI Configuration - Use environment variable
    OPENAI_KEY = os.environ.get('OPENAI_API_KEY') or 'your_openai_api_key_here'
    
class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    # Production requires environment variables
    OPENAI_KEY = os.environ.get('OPENAI_API_KEY')
    
class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    OPENAI_KEY = 'test-key'

config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}