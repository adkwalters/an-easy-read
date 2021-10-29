from flask import render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user
from sqlalchemy import update

from app import db
from app.main import bp
from app.main.forms import ArticleForm
from app.models import Article, Source, Category


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

    # If author posts valid article 
    if form.validate_on_submit():         
    
        # Create article object
        article = Article(
            title=form.article_title.data,
            description=form.article_desc.data,
            user_id=current_user.id)
        
        # Add and flush article object to get article ID
        db.session.add(article)
        db.session.flush()
        
        # Create source object
        source = Source(
            article_id=article.id,
            title=form.source_title.data,
            author=form.source_author.data,
            link=form.source_link.data,
            name=form.source_name.data,
            contact=form.source_contact.data)

        # Add source object to session
        db.session.add(source)

        # Get submitted categories
        categories_in_form = form.article_category.data

        # For each category selected
        for category in categories_in_form:

            # Check if category exists in database
            category_in_database = db.session.query(Category) \
                .filter_by(name=category).one_or_none()
            
            if category_in_database is None:
                
                # Instantiate new category
                category_in_database = Category(name=category)

            # Append category to article collection
            article.categories.append(category_in_database)

        # Save changes to database
        db.session.commit()

        # Alert author 
        flash('Article successfully saved', 'success')

        # Return author to author's articles page
        return redirect(url_for('main.author_articles'))
    
    # Render blank article form
    return render_template('create-article.html', form=form)


@bp.route('/edit-article', methods=['GET', 'POST'])
@login_required
def edit_article():

    # Get article form data
    form = ArticleForm() 

    # Get article ID from URL 
    article_id = request.args.get('article-id')

    # Get article from article ID
    article = db.session.query(Article).filter_by(id=article_id).one()

    # If the author selects an article that is not theirs
    if current_user != article.author:

        # Alert author
        flash('You do not have access to edit that article.', 'error')

        # Redirect author to their own articles page
        return redirect(url_for('main.author_articles'))

    # If author posts valid article 
    if form.validate_on_submit():

        # Update article data
        db.session.execute(update(Article)
            .where(Article.id==article.id)
            .values(
                id=article.id,
                title=form.article_title.data,
                description=form.article_desc.data,
                user_id=current_user.id))

        # Update source data
        db.session.execute(update(Source)
            .where(Source.article_id==article.id)
            .values(
                article_id=article_id,
                title=form.source_title.data,
                author=form.source_author.data,
                link=form.source_link.data,
                name=form.source_name.data,
                contact=form.source_contact.data))
        
        # In order to reset categories, delete and reinsert
        # Delete category collection
        article.categories = [] 

        # Get selected categories
        categories_in_form = form.article_category.data

        # For each category selected
        for category in categories_in_form:

            # Check if category exists in database
            category_in_database = db.session.query(Category) \
                .filter_by(name=category).one_or_none()
            
            if category_in_database is None:
                
                # Instantiate new category
                category_in_database = Category(name=category)

            # Append category to article collection
            article.categories.append(category_in_database)
        
        # Save changes to database
        db.session.commit()

        # Alert author 
        flash('Article successfully saved', 'success')

        # Return author to author's articles page
        return redirect(url_for('main.author_articles'))

    # Get article data
    source = article.source
    categories = article.categories

    # Render prefilled article form (edit mode)  
    return render_template('edit-article.html', form=form, article=article, source=source, categories=categories)

