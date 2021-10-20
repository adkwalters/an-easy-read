from flask import render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from sqlalchemy import insert, update

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

    articles = current_user.articles

    # Render author's articles pages
    return render_template('easy-read-author-articles.html', articles=articles)


@bp.route('/create-article', methods=['GET', 'POST'])
@login_required
def create_article():

    # Get article form data
    form = ArticleForm() 

    # Get article ID from URL 
    article_id = request.args.get('article-id')

    # Get article from article ID
    article = Article.query.filter_by(id=article_id).first()

    # If author requests an article form
    if request.method == 'GET':

        # If author requests to edit an article 
        if article:
            
            # If the author selects an article that is not theirs
            if current_user != article.author:

                # Alert author
                flash('You do not have access to edit that article.', 'error')

                # Redirect author to their own articles page
                return redirect(url_for('main.author_articles'))

        # Render blank article form (create) or prefilled article form (edit)  
        return render_template('create-article.html', form=form, article=article)
    
    # If author posts valid article 
    if form.validate_on_submit():

        # Edit mode
        if article:

            # I wanted to use an UPSERT statement to combine the UPDATE
            # and INSERT statements below, using the .on_conflict_do_update
            # constructor. However, the use of the 'article' variable causes
            # the constructor to fail in article create mode as no 
            # URL parameters are present, resulting in an undefined variable.

            # Construct and execute article UPDATE query
            update_statement = (
                update(Article).
                where(Article.id == article.id).
                values(
                    title=form.article_title.data,
                    description=form.article_desc.data
                )
            )

            db.session.execute(update_statement)
        
        # Create mode
        else:

            # Construct and execute INSERT query
            insert_statement = (
                insert(Article).
                values(
                    title=form.article_title.data,
                    description=form.article_desc.data,
                    user_id=current_user.id
                )
            )

            db.session.execute(insert_statement)

        # Save changes to database
        db.session.commit()

        # Alert author 
        flash('Article successfully saved', 'success')

        # Return author to author's articles page
        return redirect(url_for('main.author_articles'))

    