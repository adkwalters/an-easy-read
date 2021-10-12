import os


# Get application base directory
basedir = os.path.abspath(os.path.dirname(__file__))


# Class-based app configuration
class Config(object):

    # Set secret key !! to change
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'this is a fallback'
    
    # Auto-reload templates upon change
    TEMPLATES_AUTO_RELOAD = True

    # Set location of database with fallback
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'easy_read.db')
    
    # Disable application change signalling
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    