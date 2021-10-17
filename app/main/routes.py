from flask import render_template, redirect, url_for, flash
from flask_login import login_required, current_user

from app import db
from app.main import bp
from app.main.forms import ArticleForm
from app.models import Article


@bp.route('/')
@bp.route('/index')
def index():
    
    # Render index page
    return render_template('easy-read-index.html')


@bp.route('/author-articles', methods=['GET'])
@login_required
def author_articles():

    articles = Article.query.filter_by(author=current_user) 

    # Render author's articles pages
    return render_template('easy-read-author-articles.html', articles=articles)


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
            description=form.article_desc.data,
            user_id=current_user.id
        )

        # Add article to database and commit
        db.session.add(article)
        db.session.commit()

        flash('Article successfully saved', 'success')

        return redirect(url_for('main.author_articles'))
    
    return render_template('create-article.html', form=form)
    