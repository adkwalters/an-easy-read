import logging
from logging.handlers import SMTPHandler

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_mail import Mail
from flask_s3 import FlaskS3
from flask_talisman import Talisman
from flask_migrate import Migrate
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore

from config import Config

# Instantiate app database engine
db = SQLAlchemy()

# Instatiate and configure login manager 
login = LoginManager()
login.login_view = 'auth.login'
login.login_message = 'Please log in to access that page.'
login.login_message_category = 'error'

# Instantiate other extensions
mail = Mail()
s3 = FlaskS3()
talisman = Talisman()
migrate = Migrate()

# Initialise and configure APScheduler for image deletion
# Persist scheduled jobs using database
scheduled_delete = BackgroundScheduler(jobstores={
    'default': SQLAlchemyJobStore(url=Config.SQLALCHEMY_DATABASE_URI)
})


def create_app(config_class=Config):

    # Create Flask app
    app = Flask(__name__)    

    # Configure app from config class
    app.config.from_object(config_class)

    # Initialise extensions
    db.init_app(app)
    login.init_app(app)
    mail.init_app(app)
    s3.init_app(app)
    talisman.init_app(app, content_security_policy=None)
    migrate.init_app(app, db)
    
    # Register blueprints
    from app.auth import bp as auth_bp
    app.register_blueprint(auth_bp)

    from app.error import bp as error_bp
    app.register_blueprint(error_bp)

    from app.main import bp as main_bp
    app.register_blueprint(main_bp)

    from app.publish import bp as publish_bp
    app.register_blueprint(publish_bp)

    # Email all errors to all admins while in production
    # https://blog.miguelgrinberg.com/post/the-flask-mega-tutorial-part-vii-error-handling 
    if not app.debug and not app.testing:
        if app.config['MAIL_SERVER']:
            auth = None
            if app.config['MAIL_USERNAME'] or app.config['MAIL_PASSWORD']:
                auth = (app.config['MAIL_USERNAME'],
                        app.config['MAIL_PASSWORD'])
            secure = None
            if app.config['MAIL_USE_TLS']:
                secure = ()
            mail_handler = SMTPHandler(
                mailhost=(app.config['MAIL_SERVER'], app.config['MAIL_PORT']),
                fromaddr='no-reply@' + app.config['MAIL_SERVER'],
                toaddrs=app.config['ADMIN'], subject='EasyRead Server Error',
                credentials=auth, secure=secure)
            mail_handler.setLevel(logging.ERROR)
            app.logger.addHandler(mail_handler)

    # Start APScheduler for image deletion
    if not scheduled_delete.running:
        scheduled_delete.start()

    return app


from app import models
