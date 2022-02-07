import os
from dotenv import load_dotenv


# Get application base directory
basedir = os.path.abspath(os.path.dirname(__file__))
# Load .env file from base directory
load_dotenv(os.path.join(basedir, '.env'))


# Class-based app configuration
class Config(object):

    # Get secret key
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'this_is_a_fallback_key'
    
    # Auto-reload templates upon change
    TEMPLATES_AUTO_RELOAD = True

    # Get location of database with fallback
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', '').replace(
        'postgres://', 'postgresql://') or \
        'sqlite:///' + os.path.join(basedir, 'easy_read.db')
    
    # Disable application change signalling
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Configure images
    UPLOAD_PATH = r'\app\static\images'
    MAX_CONTENT_LENGTH = 1024 * 1024    # 1MB
    UPLOAD_EXTENSIONS = ['.jpg', '.png', '.gif']

    # Configure mail settings 
    MAIL_SERVER = os.environ.get('MAIL_SERVER')    # $env  smtp.googlemail.com
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 25)    # $env 587
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') is not None    # $env 1
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')    # $env andrew@an-easy-read.com
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')    # $env <app password>
    ADMIN = ['andrew@an-easy-read.com', 'adkwalters@gmail.com']
    
    