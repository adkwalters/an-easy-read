import os
import imghdr
import functools

from flask import render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import login_required, current_user
from flask_mail import Message
from sqlalchemy import update
from werkzeug.utils import secure_filename

from app import db, mail
from app.main import bp
from app.main.forms import ArticleForm, ImageForm
from app.models import Article, Source, Category, Image, Paragraph, Summary
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


def author_or_admin_access(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):

        # Get list of admin email addresses from app config
        admins = current_app.config.get('ADMINS')

        # Get article ID from URL parameters 
        article_id = request.args.get('article-id')

        # Get article from article ID
        article = db.session.query(Article).filter_by(id=article_id).one()

        # If the author selects an article that is not theirs
        if current_user != article.author and current_user.email not in admins:
            
            # Alert author
            flash('You do not have access to edit that article.', 'error')

            # Redirect author to their own articles page
            return redirect(url_for('main.author_articles'))

        return func(*args, **kwargs)
    return wrapper


@bp.route('/')
@bp.route('/index')
def index():
    
    # Render index page
    return render_template('index.html')


@bp.route('/author-articles', methods=['GET'])
@login_required
def author_articles():
    
    articles = db.session.query(Article, Image) \
        .outerjoin(Image, Image.id == Article.image_id) \
        .filter(Article.author == current_user).all()
    
    # Render author's articles pages
    return render_template('author-articles.html', articles=articles)


@bp.route('/add-image', methods=['POST'])
@login_required
def add_image():

    # Get image form data
    form = ImageForm()

    # If author posts valid article 
    if form.validate_on_submit():
        
        # Get image file
        file = form.upload_image.data

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
    
    # Article meta
        # Create article object
        article = Article(
            title=form.article_title.data,
            description=form.article_desc.data,
            user_id=current_user.id)
        
        # Add and flush article object to get article ID
        db.session.add(article)
        db.session.flush()

    # Source
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

    # Categories
        # Get submitted categories
        categories_in_form = form.article_category.data

        # For each category
        for category in categories_in_form:

            # Check if category exists in database
            category_in_database = db.session.query(Category) \
                .filter_by(name=category).one_or_none()
            
            if category_in_database is None:
                
                # Instantiate new category
                category_in_database = Category(name=category)

            # Append category to article collection
            article.categories.append(category_in_database)

    # Article Image
        # Set image ID as foreign key
        article.image_id = form.article_image_id.data

        # Update image object with image alt
        db.session.execute(update(Image)
            .where(Image.id==form.article_image_id.data)
            .values(alt=form.article_image_alt.data))
        
    # Paragraphs
        # Get submitted paragraphs
        paragraphs_in_form = form.paragraph.data
        
        # For each paragraph
        for paragraph in paragraphs_in_form:

            # Instantiate new paragraph
            paragraph_in_database = Paragraph(
                index=paragraph['paragraph_index'],
                header=paragraph['paragraph_header'],
                image_id=paragraph['paragraph_image_id'])
            
            # Update image object with image alt
            db.session.execute(update(Image)
                .where(Image.id==paragraph['paragraph_image_id'])
                .values(alt=paragraph['paragraph_image_alt']))
            
            # Append paragraph to article collection
            article.paragraphs.append(paragraph_in_database)

        # Summaries
            # Get submitted paragraphs
            summaries_in_form = paragraph['summary']

            # For each summary
            for summary in summaries_in_form:

                # Instantiate new level object
                summary_in_database = Summary(
                    article_id=article.id,
                    paragraph_index=paragraph['paragraph_index'],
                    level=summary['level'],
                    text=summary['text'])
                           
                # Append summary to article collection
                article.summaries.append(summary_in_database)

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
@author_or_admin_access
def edit_article():

    # Get article form data
    form = ArticleForm() 

    # Get article ID from URL 
    article_id = request.args.get('article-id')

    # Get article from article ID
    article = db.session.query(Article).filter_by(id=article_id).one()

    # If author posts valid article 
    if form.validate_on_submit():

    # Article meta data
        # Update article object
        db.session.execute(update(Article)
            .where(Article.id==article.id)
            .values(
                id=article.id,
                title=form.article_title.data,
                description=form.article_desc.data))

    # Source data
        # Update source object
        db.session.execute(update(Source)
            .where(Source.article_id==article.id)
            .values(
                article_id=article_id,
                title=form.source_title.data,
                author=form.source_author.data,
                link=form.source_link.data,
                name=form.source_name.data,
                contact=form.source_contact.data))
        
    # Categories
        # In order to reset categories, delete and reinsert     
        # Delete category collection
        article.categories = [] 

        # Flush to ensure delete query emitted before insert query 
        db.session.flush()

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

    # Paragraphs
        # In order to reset paragraph data, delete and reinsert
        # Delete paragraphs collection
        article.paragraphs = []
        article.summaries = [] 
        
        # Flush to ensure delete query emitted before insert query 
        db.session.flush()

        # Get submitted paragraphs
        paragraphs_in_form = form.paragraph.data
        
        # For each paragraph
        for paragraph in paragraphs_in_form:

            # Instantiate new paragraph
            paragraph_in_database = Paragraph(
                index=paragraph['paragraph_index'],
                header=paragraph['paragraph_header'],
                image_id=paragraph['paragraph_image_id'])

            # Update image object with image alt
            db.session.execute(update(Image)
                .where(Image.id==paragraph['paragraph_image_id'])
                .values(alt=paragraph['paragraph_image_alt']))
            
            # Append paragraph to article collection
            article.paragraphs.append(paragraph_in_database)

        # Summaries
            # Get submitted summaries
            summaries_in_form = paragraph['summary']

            # For each summary
            for summary in summaries_in_form:

                # Instantiate new level object
                summary_in_database = Summary(
                    article_id=article.id,
                    paragraph_index=paragraph['paragraph_index'],
                    level=summary['level'],
                    text=summary['text'])
                            
                # Append summary to article collection
                article.summaries.append(summary_in_database)

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
    paragraphs = db.session.query(Paragraph, Image) \
        .outerjoin(Image, Image.id == Paragraph.image_id) \
        .filter(Paragraph.article_id == article.id).all()
    summaries = article.summaries
    
    # Render prefilled article form (edit mode)  
    return render_template('edit-article.html', 
        form=form, 
        article=article, 
        source=source, 
        categories=categories, 
        article_image=article_image,
        paragraphs=paragraphs,
        summaries=summaries)


@bp.route('/preview-article')
@login_required
@author_or_admin_access
def preview_article():

    # Get article ID from URL 
    article_id = request.args.get('article-id')

    # Get article from article ID
    article = db.session.query(Article).filter_by(id=article_id).one()

    # Get article data
    source = article.source
    categories = article.categories
    article_image = db.session.query(Image).filter_by(id=article.image_id).one_or_none()
    paragraphs = db.session.query(Paragraph, Image) \
        .outerjoin(Image, Image.id == Paragraph.image_id) \
        .filter(Paragraph.article_id == article.id).all()
    summaries = article.summaries
    
    # Render article  
    return render_template('preview-article.html', 
        article=article, 
        source=source, 
        categories=categories, 
        article_image=article_image,
        paragraphs=paragraphs,
        summaries=summaries)


@bp.route('/publish-article')
@login_required
@author_or_admin_access
def publish_article():

    # Get article ID from URL 
    article_id = request.args.get('article-id')

    # Get article from article ID
    article = db.session.query(Article).filter_by(id=article_id).one()

    # Compose message to publisher
    msg = Message('Request to publish article', sender=current_app.config['ADMINS'][0],
        recipients=['adkwalters@gmail.com'])
    msg.html = f"""
        <h3>Request To Publish Article</h3>
        <p><b>{current_user.username}</b> has made a request to publish the following article:</p>
        <p>ID: {article.id}</p>
        <p>Title: {article.title}</p>"""
    
    mail.send(msg)

    flash('Your article has been sent to your publisher for approval. Please await a response.', 'success')

    # Return author to author's articles page
    return redirect(url_for('main.author_articles'))

@bp.route('/delete-article')
@login_required
@author_or_admin_access
def delete_article():

    # Get article ID from URL 
    article_id = request.args.get('article-id')

    # Get article from article ID
    article = db.session.query(Article).filter_by(id=article_id).one()
    
    db.session.delete(article)
    db.session.commit()

    flash('Article successfully deleted', 'success')

    # Return author to author's articles page
    return redirect(url_for('main.author_articles'))

