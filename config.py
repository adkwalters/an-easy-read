import os

# Class-based app configuration
class Config(object):
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'this is a fallback'
    TEMPLATES_AUTO_RELOAD = True