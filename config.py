import os

# Class-based app configuration
class Config(object):

    # Set secret key !! to change
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'this is a fallback'
    
    # Auto-reload templates upon change
    TEMPLATES_AUTO_RELOAD = True