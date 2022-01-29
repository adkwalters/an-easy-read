from flask import Blueprint

bp = Blueprint('publish', __name__)

from app.publish import routes
