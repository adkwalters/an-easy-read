from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from config import Config


# Instantiate app database engine
db = SQLAlchemy()

# Instatiate and configure login manager 
login = LoginManager()
login.login_view = 'login'
login.login_message = 'Please log in to access that page.'
login.login_message_category = 'error'


def create_app(config_class=Config):

    # Create Flask app
    app = Flask(__name__)    

    # Configure app from config class
    app.config.from_object(config_class)

    # Initialise extensions
    db.init_app(app)
    login.init_app(app)
    
    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp)

    from app.main import bp as main_bp
    app.register_blueprint(main_bp)

    return app


from app import models