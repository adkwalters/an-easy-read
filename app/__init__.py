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

# Initialise login manager
login = LoginManager(app)

# import here at bottom as workaround for circular import
from app import routes, models