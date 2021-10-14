from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config

# Create Flask app
app = Flask(__name__)

# Configure app from config class
app.config.from_object(Config)

# Initialise app database engine
db = SQLAlchemy(app)

# Initialise and configure login manager 
login = LoginManager(app)
login.login_view = 'login'
login.login_message = 'Please log in to access that page.'
login.login_message_category = 'error'

# import here at bottom as workaround for circular import
from app import routes, models