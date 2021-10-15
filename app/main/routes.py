from flask import render_template
from flask_login import login_required
from app.main import bp


@bp.route('/')
@bp.route('/index')
def index():
    
    # Render index page
    return render_template('easy-read-index.html')


@bp.route('/author-articles', methods=['GET', 'POST'])
@login_required
def author_articles():

    # Render author's articles pages
    return render_template('easy-read-author-articles.html')
