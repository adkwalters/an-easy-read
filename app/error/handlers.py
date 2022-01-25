from flask import render_template

from app import db
from app.error import bp


@bp.app_errorhandler(404)
def not_found_error(error):
    """Return custom 404 page for pages not found"""
    return render_template('/error/404.html'), 404


@bp.app_errorhandler(500)
def interal_server_error(error):
    """Return custom 500 page upon internal server error"""

    # Rollback session
    db.session.rollback()

    return render_template('/error/500.html'), 500
