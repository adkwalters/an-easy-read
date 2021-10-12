from flask import Flask
from config import Config
from flask_sqlalchemy import SQLAlchemy


# Create Flask app
app = Flask(__name__)

# Configure app from config class
app.config.from_object(Config)

db = SQLAlchemy(app)

# import here at bottom as workaround for circular import
from app import routes