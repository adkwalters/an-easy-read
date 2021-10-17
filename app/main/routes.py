from flask import render_template, redirect, url_for, request, flash
from flask_login import login_required
from app import db
from app.auth.routes import login
from app.main import bp
from app.models import Article
from app.main.forms import ArticleForm



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


@bp.route('/create-article', methods=['GET', 'POST'])
@login_required
def create_article():

    # Get article data
    form = ArticleForm() 

    # If article data is valid
    if form.validate_on_submit():
    
        # Instantiate article and set data
        article = Article(
            title=form.article_title.data,
            description=form.article_desc.data 
        )

        # Add article to database and commit
        db.session.add(article)
        db.session.commit()

        flash('Article successfully saved', 'success')

        return redirect(url_for('main.author_articles'))
    
    return render_template('create-article.html', form=form)