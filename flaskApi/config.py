
class Config(object):
    DEBUG = True
    TESTING = False

class DevelopmentConfig(Config):
    # Please replace with your actual OpenAI API key
    # Get your key from: https://platform.openai.com/account/api-keys
    OPENAI_KEY = 'your_openai_api_key_here'

config = {
    'development': DevelopmentConfig,
    'testing': DevelopmentConfig,
    'production': DevelopmentConfig
}