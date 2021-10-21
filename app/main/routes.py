from flask import render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from sqlalchemy.dialects.sqlite import insert

from app import db
from app.main import bp
from app.main.forms import ArticleForm
from app.models import Article, Source


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

            # Get article source data
            source = article.source
            
            # If the author selects an article that is not theirs
            if current_user != article.author:

                # Alert author
                flash('You do not have access to edit that article.', 'error')

                # Redirect author to their own articles page
                return redirect(url_for('main.author_articles'))

        # Render blank article form (create) or prefilled article form (edit)  
        return render_template('create-article.html', form=form, article=article, source=source)
    
    # If author posts valid article 
    if form.validate_on_submit():
        
        # Construct article upsert query
        article_upsert = insert(Article) \
            .values(
                id=article_id,
                title=form.article_title.data,
                description=form.article_desc.data,
                user_id=current_user.id) \
            .on_conflict_do_update(
                index_elements=['id'],
                set_=dict(
                    title=form.article_title.data,
                    description=form.article_desc.data,
                )
            )

        # Construct source upsert query
        source_upsert = insert(Source) \
            .values(
                article_id=article_id,
                title=form.source_title.data,
                author=form.source_author.data,
                link=form.source_link.data,
                name=form.source_name.data,
                contact=form.source_contact.data) \
            .on_conflict_do_update(
                index_elements=['article_id'],
                set_=dict(
                    title=form.source_title.data,
                    author=form.source_author.data,
                    link=form.source_link.data,
                    name=form.source_name.data,
                    contact=form.source_contact.data))

        # Execute queries
        db.session.execute(article_upsert)
        db.session.execute(source_upsert)

        # Save changes to database
        db.session.commit()

        # Alert author 
        flash('Article successfully saved', 'success')

        # Return author to author's articles page
        return redirect(url_for('main.author_articles'))

    