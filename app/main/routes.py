import os
import imghdr

from flask import render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import login_required, current_user
from sqlalchemy import update
from werkzeug.utils import secure_filename

from app import db
from app.main import bp
from app.main.forms import ArticleForm, ImageForm
from app.models import Article, Source, Category, Image
from config import basedir


# Image validation
# https://blog.miguelgrinberg.com/post/handling-file-uploads-with-flask
def validate_image(stream):
    header = stream.read(512)           # Read first chunk of data from stream
    stream.seek(0)                      # Reset stream for file save
    format = imghdr.what(None, header)  # Process first chunk with imghrd library
    if not format:
        return None
    return '.' + (format if format != 'jpeg' else 'jpg') 


@bp.route('/')
@bp.route('/index')
def index():
    
    # Render index page
    return render_template('easy-read-index.html')


@bp.route('/author-articles', methods=['GET'])
@login_required
def author_articles():
    
    articles = db.session.query(Article, Image) \
        .outerjoin(Image, Image.id == Article.image_id) \
        .filter(Article.author == current_user).all()
    
    # Render author's articles pages
    return render_template('easy-read-author-articles.html', articles=articles)


@bp.route('/add-image', methods=['POST'])
@login_required
def add_image():

    # Get image form data
    form = ImageForm()

    # If author posts valid article 
    if form.validate_on_submit():
        
        # Get image file
        file = form.article_image.data

        # Get validated filename
        filename = secure_filename(file.filename)

        # If a file is selected 
        if filename != '':
            
            # Get its extension
            file_ext = os.path.splitext(filename)[1]

            # if the file extension is not permitted or file is invalid (see function)
            if file_ext not in current_app.config.get('UPLOAD_EXTENSIONS') \
                    or file_ext != validate_image(file.stream):
                
                # Abort invalid image upload
                abort(400)

        # Generate image src attribute
        src = os.path.join(
            current_app.config.get('UPLOAD_PATH'), filename)

        # Save image to file
        file.save(os.path.join(basedir + '\\app\\' + src))

        # Create database object
        image = Image(src=src)
        
        # Add object to session 
        db.session.add(image)

        # Save changes to database
        db.session.commit()

        # return image ID
        return {"image_id": image.id}, 201

    # Abort invalid image upload
    abort(400)


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

        # Set image ID as foreign key
        article.image_id = form.article_image_id.data

        # Update article object with image alt
        db.session.execute(update(Image)
            .where(Image.id==form.article_image_id.data)
            .values(alt=form.article_image_alt.data))

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
        
        # Set image ID as foreign key
        article.image_id = form.article_image_id.data

        # Update image alt 
        db.session.execute(update(Image)
            .where(Image.id==form.article_image_id.data)
            .values(alt=form.article_image_alt.data))

        # Save changes to database
        db.session.commit()

        # Alert author 
        flash('Article successfully saved', 'success')

        # Return author to author's articles page
        return redirect(url_for('main.author_articles'))

    # Get article data
    source = article.source
    categories = article.categories
    article_image = db.session.query(Image).filter_by(id=article.image_id).one_or_none()

    # Render prefilled article form (edit mode)  
    return render_template('edit-article.html', form=form, article=article, source=source, categories=categories, article_image=article_image)


@bp.route('/delete-article')
@login_required
def delete_article():

    # Get article ID from URL 
    article_id = request.args.get('article-id')

    # Get article from article ID
    article = db.session.query(Article).filter_by(id=article_id).one()

    # If the author selects an article that is not theirs
    if current_user != article.author:

        # Alert author
        flash('You do not have access to delete that article.', 'error')

        # Return author to author's articles page
        return redirect(url_for('main.author_articles'))
    
    db.session.delete(article)
    db.session.commit()

    flash('Article successfully deleted', 'success')

    # Return author to author's articles page
    return redirect(url_for('main.author_articles'))

