"""Provide a platform for users to author and publish content online

Authors can create and edit articles privately, and request that these articles 
be published by other, empowered users: publishers. 

Publishers can review and edit articles that have been requested for 
publication, and select to display approved articles publically.

Publishers help improve content quality, and encourage community between users. 
To this end, publishers are assigned articles and associated with authors: 
- Assignment affects article access. Upon assignment, an article's publisher
  is given the same access as its author, allowing them to make direct changes.
- Association affects communication. Upon association, an author's publisher
  becomes the recipient of the author's publication requests.

Both assignment and association can be changed, allowing authors to write for
different publishers, and published articles to be transferred between 
publishers.

In order to protect against accidental or malicious deletion of content, 
published articles that are deleted are taken offline and reassigned to admin. 
Admin can then select to permanently delete or transfer these articles. Until
transfer, deleted articles will have public view access revoked.

Acting upon an article changes its status. An article's status helps to:
 - provide feedback to the user. Labels and alerts allow user actions to 
   succeed and fail gracefully.
 - support query filtering. Tabs provide a way for users to organise and filter 
   articles without requiring additional requests.
 - prevent race conditions. Preventing an article's author and publisher from 
   making simultaneous changes helps avoid the publication of unchecked changes.
 
This document is laid out in the following structure:
 - imports
    - standard library
    - 3rd party
    - local
 - decorators
    - admin
    - publisher
    - author and publisher
 - views
    - publishers
        - display
        - add
        - remove
    - writers
        - display
        - add
        - remove
    - requests
        - display
    - articles displays
        - admin
        - publisher
        - author
    - article actions
        - add image
        - create
        - edit
        - preview
        - request
        - review
        - reject
        - publish
        - activate
        - deactivate
        - update
        - transfer
        - delete
        - permadelete
        - view
"""

# || Imports

import os
import functools
import datetime
import requests

from flask import render_template, redirect, url_for, flash, request, current_app, abort
from flask_login import login_required, current_user
from flask_mail import Message
from sqlalchemy import update, or_, and_
from werkzeug.utils import secure_filename
import boto3
from botocore.client import Config

from app import db, mail, scheduled_delete
from app.publish import bp
from app.publish.forms import ArticleForm, ImageForm, EmailForm
from app.publish.utils import validate_image, delete_unused_image
from app.models import Article, Source, Category, Image, Paragraph, Summary, User, Publisher, PublishingNote


# || Decorators

def admin_access(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        """Grant access to admin only"""

        admin = current_app.config.get('ADMIN')
        
        if current_user.email not in admin:
            flash('You must have administrative access to do that.', 'error')
            return redirect(url_for('publish.display_author_articles'))

        return func(*args, **kwargs)
    return wrapper


def all_publishers_access(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        """Grant access to publishers and admin only"""

        admin = current_app.config.get('ADMIN')

        if current_user.is_publisher is None and current_user.email not in admin: 
            flash('You must have publishing access to do that.', 'error')
            return redirect(url_for('publish.display_author_articles'))

        return func(*args, **kwargs)
    return wrapper


def author_and_publisher_access(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        """Grant access to the selected article's author, publisher, and admin only
    
        Further restrict authors' access to:
         - live articles, to prevent unauthorised changes to live content.
         - draft articles that are undergoing review, to prevent race conditions 
           where unchecked changes are published.
        """

        admin = current_app.config.get('ADMIN')

        # Get article
        article_id = request.args.get('article-id')
        article = db.session.query(Article) \
            .filter_by(id = article_id).one()

        # Get article author
        article_author = db.session.query(User) \
            .filter_by(id = article.author_id).one()

        # Get user route
        user_route = request.args.get('user-route')

        # If article has an assigned publisher (nb. not author's publisher)
        if article.publisher_id:

            # Get article's publisher 
            article_publisher = db.session.query(Publisher, User) \
                .outerjoin(User, User.id == Publisher.user_id) \
                .filter(Publisher.id == article.publisher_id).one_or_none()
        
            # Grant access to author and article's publisher
            if current_user != article_author \
                    and current_user != article_publisher['User'] \
                    and current_user.email not in admin:
                # Report extra feedback to publishers upon access denial
                if user_route == 'display-requests':
                    flash('You do not have access to that article. To gain access, click "Review".', 'info')
                    return redirect(url_for('publish.display_requests'))
                else:
                    flash('You do not have access to that article.', 'error')
                    return redirect(url_for('publish.display_author_articles'))                
            
            # Grant access to article's publisher only
            if article.status in ('pending', 'pub_pending', 'pub_live') \
                    and current_user != article_publisher['User'] \
                    and current_user.email not in admin:
                # Report extra feedback to authors upon denial
                if article.status in ('pending', 'pub_pending'):
                    flash('That article is currently being reviewed. Changes cannot be made at this time.', 'info')
                elif article.status == 'pub_live':
                    flash('You do not have access to that article.', 'error')
                return redirect(url_for('publish.display_author_articles'))

        else: # Article is not published

            # Grant access to author and admin only
            if current_user != article_author and current_user.email not in admin:
                # Report extra feedback to publishers upon access denial
                if user_route == 'display-requests':
                    flash('You do not have access to that article. To gain access, click "Review".', 'info')
                    return redirect(url_for('publish.display_requests'))
                else:          
                    flash('You do not have access to that article.', 'error')
                    return redirect(url_for('publish.display_author_articles'))
        
        return func(*args, **kwargs)
    return wrapper


# || Views

@bp.route('/display-publishers', methods=['GET', 'POST'])
@admin_access
def display_publishers():
    """Display a list of publishers for administration
    
    Publishers can be promoted and demoted from this view."""

    # Get email form
    form = EmailForm()

    # Get publishers (excluding admin)
    publishers = db.session.query(Publisher, User) \
        .outerjoin(User, User.id == Publisher.user_id) \
        .filter(User.email.not_in(current_app.config['ADMIN'])).all()

    # Render admin page
    return render_template('/publish/admin-publishers.html', publishers=publishers, form=form)


@bp.route('/add-publisher', methods=['POST'])
@admin_access
def add_publisher():
    """Promote selected user from author to publisher
    
    Publishers can select to display approved articles publically, including 
    their own. They can also review and edit articles that have been requested
    for publication by other authors. 
    """

    # Get email form
    form = EmailForm()

    if form.validate_on_submit():
        
        # Get user
        user = db.session.query(User) \
            .filter_by(email = form.user_email.data).one_or_none()

        # Halt unknown users
        if user is None:
            flash('No user is associated with that email address.', 'error')
            return redirect(url_for('publish.display_publishers'))

        # Create new publisher
        publisher = Publisher(user_id = user.id)

        # Add and flush publisher object to get its ID
        db.session.add(publisher)
        db.session.flush()

        # Grant publisher self-publishing rights
        user.published_by = publisher.id 

        # Compose and send email to publisher
        msg = Message(
            subject = 'Invitation to become a publisher',
            reply_to = current_app.config['ADMIN'][1], # me
            sender = current_app.config['ADMIN'][0], 
            html = render_template('/email/email-request-to-become-publisher.html'),
            recipients = [user.email])
        mail.send(msg)

        # Record and alert
        db.session.commit()    
        flash('Publisher successfully added.', 'success')

        # Return publisher to publisher's articles page
        return redirect(url_for('publish.display_publishers'))

    # Return invalid input
    flash('No user is associated with that email address.', 'error')
    return redirect(url_for('publish.display_publishers'))


@bp.route('/remove-publisher')
@admin_access
def remove_publisher():
    """Demote selected user from publisher to author
    
    Remove the publisher's power to publish articles.
    Remove the publisher's access to assigned articles through publication, and
    reject any outstanding publication requests from their writers.
    Reassign any published articles to the primary admin.
    Disassociate the publisher from their writers.

    Any articles published with the current publisher remain live as default. 
    Permanent deletion, as well as transference to another publisher, can be 
    controlled via /admin-articles.
    """

    # Get publisher
    publisher = db.session.query(Publisher, User) \
        .outerjoin(User, User.id == Publisher.user_id) \
        .filter(User.id == request.args.get('publisher')).one()

    # Get admin as publisher
    admin = db.session.query(Publisher, User) \
        .outerjoin(User, User.id == Publisher.user_id) \
        .filter(User.email == current_app.config['ADMIN'][1]).one()

    print(admin['Publisher'].id)
    
    # Get publisher's articles (published and draft)
    for article in publisher['Publisher'].published_articles:
        # Reject outstanding publication requests
        if article.status in ('requested', 'pending'):
            article.status = 'draft'
        # Reassign published articles to admin
        elif article.status == 'pub_live':
            article.publisher_id = admin['Publisher'].id 

    # Delete publisher but keep user
    db.session.delete(publisher['Publisher'])
    
    # Record and alert
    db.session.commit()
    flash('Publisher successfully removed.', 'success')

    # Return author to author's articles page
    return redirect(url_for('publish.display_publishers'))


@bp.route('/display-writers', methods=['GET'])
@login_required
@all_publishers_access
def display_writers():
    """Display a list of writers associated to the current user as publisher

    Separate writers that have published articles with the current publisher 
    and those that have not. 

    Publishers can add and remove writers from this view. 
    """

    # Get email form
    form = EmailForm()

    # Get current user as publisher 
    publisher = db.session.query(Publisher) \
        .filter_by(id = current_user.is_publisher.id).one()

    # Get current publisher's writers
    writers = publisher.writers

    # Separate published writers from unpublished
    unpublished_writers = writers[:] # Copy all
    published_writers = []
    for writer in writers:
        if writer.id == current_user.id \
                and writer in unpublished_writers: 
            unpublished_writers.remove(writer) # Remove self
        for article in writer.authored_articles:
            if article.is_published \
                and article.publisher_id == current_user.is_publisher.id \
                and writer in unpublished_writers:
                    unpublished_writers.remove(writer) # Remove from unpub'd
                    published_writers.append(writer) # Add to pub'd
    
    # Render publisher's articles pages
    return render_template('/publish/publisher-writers.html',
        published_writers=published_writers,
        unpublished_writers=unpublished_writers,
        form=form)


@bp.route('/add-writer', methods=['GET', 'POST'])
@login_required
def add_writer():
    """Associate the selected author to the current user as publisher
    
    As an author's associated publisher, the publisher receives the author's 
    publication requests.

    Note that association alone is insufficient for a publisher to gain access 
    to the articles of their writers. An article must be assigned to a 
    publisher either through publication request or transference.
    """

    # Get email form
    form = EmailForm()

    if form.validate_on_submit():
        
        # Get user
        user = db.session.query(User) \
            .filter_by(email = form.user_email.data).one_or_none()

        # Halt unknown or invalid addresses
        if user is None:
            flash('No user is associated with that email address.', 'error')
            return redirect(url_for('publish.display_writers'))
        elif user.published_by:
            flash('You do not have access to add that writer.', 'error')
            return redirect(url_for('publish.display_writers'))

        # Assign author to current publisher
        user.published_by = current_user.is_publisher.id

        # Compose and send email to writer
        msg = Message(
            subject = 'Invitation to become a writer',
            reply_to = current_user.email, 
            sender = current_app.config['ADMIN'][0], 
            html = render_template('/email/email-request-to-become-writer.html',
                        publisher=current_user),
            recipients = [user.email])
        mail.send(msg)

        # Record and alert
        db.session.commit()    
        flash('Writer successfully added.', 'success')

        # Return publisher to publisher's articles page
        return redirect(url_for('publish.display_writers'))

    # Return invalid input
    flash('No user is associated with that email address.', 'error')
    return redirect(url_for('publish.display_writers'))


@bp.route('/remove-writer')
@login_required
def remove_writer():
    """Disassociate the selected author from the current user as publisher

    Reject the author's outstanding publication requests to the publisher.

    Remove the publisher's access to the author's articles not published with
    the publisher. Any published articles remain assigned to the publisher. 
    As such, they retain article access and recipience of publication requests.
    """

    # Get writer
    writer = db.session.query(User) \
        .filter_by(id = request.args.get('writer')).one()
    
    # Halt unassociated publishers
    if writer.published_by != current_user.is_publisher.id:
        flash('You are not the publisher of that writer.', 'error')
        return redirect(url_for('publish.display_writers'))

    # Get articles published by current publisher
    publisher_articles = db.session.query(Article) \
        .filter_by(publisher_id = current_user.is_publisher.id).all()

    # Disassociate non-published articles
    writers_articles = db.session.query(Article) \
        .filter_by(author_id = writer.id) \
        .filter_by(is_published = None) \
        .filter_by(publisher_id = current_user.is_publisher.id).all() 
    for article in writers_articles:
        article.publisher_id = None;
        if article.status in ('requested', 'pending'):
            article.status = 'draft';

    # Disassociate writer
    writer.published_by = None;

    # Reassign articles published by current publisher
    for article in publisher_articles:
        article.publisher_id = current_user.is_publisher.id
    
    # Record and alert
    db.session.commit()    
    flash('Writer successfully removed.', 'success')

    # Return publisher to publisher's articles page
    return redirect(url_for('publish.display_writers'))


@bp.route('/display-requests', methods=['GET', 'POST'])
@login_required
@all_publishers_access
def display_requests():
    """Display the publication requests from the selected user's writers
    
    Separate requests received from associated, disassociated, and unassociated
    writers:
     - associated writers are the recruited writers of the publisher.
     - disassociated writers are related by article only, such as published
       writers who were removed or published articles that were transferred.
     - unassociated writers do not have publishers. They can be recruited.
    """

    request_statuses = ['requested', 'pub_requested']

    requests = db.session.query(Article, Image, User) \
        .outerjoin(Image, Image.id == Article.image_id) \
        .outerjoin(User, User.id == Article.author_id) \
        .filter(Article.status.in_(request_statuses))
        
    associated = requests \
        .filter(User.published_by == current_user.is_publisher.id) \
        .filter(or_(Article.publisher_id == None, 
                    Article.publisher_id == current_user.is_publisher.id)).all()       

    disassociated = requests \
        .filter(or_(User.published_by == None, 
                    User.published_by != current_user.is_publisher.id)) \
        .filter(Article.publisher_id == current_user.is_publisher.id).all()

    unassociated = requests \
        .filter(and_(User.published_by == None,
                Article.publisher_id == None)).all()

    # Render requests to publish
    return render_template('/publish/publisher-requests.html',
        associated=associated,
        disassociated=disassociated,
        unassociated=unassociated) 


@bp.route('/display-admin-articles')
@admin_access
def display_admin_articles():
    """Display a list of published articles for administration
    
    Deleted articles can be permanently delete or transferred to another
    publisher from this view.
    """

    # Get email form
    form = EmailForm()

    display_admin_articles = ['pub_live', 'pub_deleted']

    articles = db.session.query(Article, Image, PublishingNote) \
        .outerjoin(Image, Image.id == Article.image_id) \
        .outerjoin(PublishingNote, PublishingNote.published_article_id == Article.id) \
        .filter(Article.status.in_(display_admin_articles)) \
        .order_by(PublishingNote.date_published.desc()).all()
            
    return render_template('/publish/admin-articles.html', 
        articles=articles, 
        form=form)


@bp.route('/display-publisher-articles', methods=['GET'])
@login_required
@all_publishers_access
def display_publisher_articles():
    """Display a list of articles published by the current user
    
    Publishers can edit, delete, link, and publish articles that are either
    live or pending publication from this view.
    """

    # List publisher's article statuses 
    display_publisher_articles = ['pending', 'pub_pending', 'pub_live']
    
    # Get publisher's articles
    articles = db.session.query(Article, Image, Publisher, User, PublishingNote) \
        .outerjoin(Image, Image.id == Article.image_id) \
        .join(Publisher, Publisher.id == Article.publisher_id) \
        .join(User, User.id == Publisher.user_id) \
        .outerjoin(PublishingNote, PublishingNote.published_article_id == Article.id) \
        .filter(Publisher.id == current_user.is_publisher.id) \
        .filter(Article.status.in_(display_publisher_articles)) \
        .order_by(PublishingNote.date_published.desc()).all()

    # Render author's articles page
    return render_template('/publish/publisher-articles.html', articles=articles)


@bp.route('/display-author-articles', methods=['GET'])
@login_required
def display_author_articles():
    """Display a list of articles written by the current user
    
    Authors can add, edit, delete, and request their articles for publication
    from this view.
    """

    # List publisher's article statuses to omit
    display_publisher_articles = ['pub_live', 'pub_deleted']
  
    # Get author's articles
    articles = db.session.query(Article, Image, PublishingNote) \
        .outerjoin(Image, Image.id == Article.image_id) \
        .outerjoin(PublishingNote, PublishingNote.draft_article_id == Article.id) \
        .filter(Article.author_id == current_user.id) \
        .filter(Article.status.not_in(display_publisher_articles)) \
        .order_by(PublishingNote.date_published.desc(),
                  Article.id.desc()).all()


    # Render author's articles pages
    return render_template('/publish/author-articles.html', articles=articles)


@bp.route('/add-image', methods=['POST'])
@login_required
def add_image():
    """Upload image to database and cloud storage and return image ID
    
    Schedule uploaded images for deletion if unused in an article. 
    """

    # Get image form data
    form = ImageForm()

    if form.validate_on_submit():
        
        # Get image file
        file = form.upload_image.data

        # If a file is selected 
        if file.filename != '':

            # Validate filename
            filename = secure_filename(file.filename)
            filename = str(current_user.id) + '-' + filename
            
            # Get its extension
            file_ext = os.path.splitext(filename)[1]

            # Convert .jpg to .jpeg for imghdr image validation
            if file_ext == ".jpg":
                file_ext = ".jpeg"

            # Abort if the file extension is not permitted or file is invalid (see function)
            if file_ext not in current_app.config.get('UPLOAD_EXTENSIONS') \
                    or file_ext != validate_image(file.stream):
                abort(400)

            # Get Amazon s3 bucket
            s3_bucket = current_app.config.get('FLASKS3_BUCKET_NAME')

            # Initialise s3 client
            s3 = boto3.client('s3', 'eu-west-2', 
                config = Config(signature_version = 's3v4'))

            # Generate s3 presigned URL
            presigned_post = s3.generate_presigned_post(
                Bucket = s3_bucket,
                Key = filename,
                Fields = {'Content-Type': file_ext, 'acl': 'public-read'},
                Conditions = [
                    {'acl': 'public-read'},
                    {'Content-Type': file_ext}],
                ExpiresIn = 3600)

            # Post presigned URL to upload media to Amazon s3
            http_response = requests.post(
                presigned_post['url'], 
                data=presigned_post['fields'], 
                files={'file': file.read()})

        # Create database object
        image = Image(
            src = 'https://an-easy-read.s3.amazonaws.com/%s' % (filename))
        
        # Add object to session 
        db.session.add(image)

        # Record changes
        db.session.commit()

        if not current_app.testing:
            # Schedule image for deletion if not used
            scheduled_delete.add_job(delete_unused_image, 'interval', hours=4,
                id=str(image.id), kwargs={'image': filename, 'job_id': image.id})

        # return image ID
        return {
            'image_id': image.id,
            'image_name': filename}, 201

    # Abort invalid image upload
    abort(400)


@bp.route('/create-article', methods=['GET', 'POST'])
@login_required
def create_article():
    """Create a new article with the current user as author
    
    Instantiate and serialise new objects for Article, Image, Source, Category, 
    Paragraph, and Summary models from the validated data submitted by the 
    author.
    
    For Category, Paragraph, and Summary models, which are related to the
    Article model many-to-one, iterate over the form FieldList in order to 
    access the data.
    """

    # Get article form data
    form = ArticleForm() 

    if form.validate_on_submit():         
    
        # Create Article object
        article = Article(
            title = form.article_title.data,
            description = form.article_desc.data,
            image_id = form.article_image_id.data,
            author_id = current_user.id,
            status = 'draft')
        
        # Add and flush Article object to get article ID
        db.session.add(article)
        db.session.flush()

        # Update Image object
        if form.article_image_id.data:
            db.session.execute(update(Image)
                .where(Image.id == form.article_image_id.data)
                .values(
                    alt = form.article_image_alt.data,
                    cite = form.article_image_cite.data,
                    used = True))

        # Create and add Source object
        source = Source(
            article_id = article.id,
            title = form.source_title.data,
            author = form.source_author.data,
            link = form.source_link.data,
            name = form.source_name.data,
            contact = form.source_contact.data)
        db.session.add(source)

        # Add categories
        for category in form.article_category.data:

            # Create new Category objects for new categories
            category_in_database = db.session.query(Category) \
                .filter_by(name = category).one_or_none()
            if category_in_database is None:
                category_in_database = Category(name = category)

            # Append categories to article
            article.categories.append(category_in_database)

        # Add paragraphs
        for paragraph in form.paragraph.data:

            # Create new Paragraph objects
            paragraph_in_database = Paragraph(
                index = paragraph['paragraph_index'],
                header = paragraph['paragraph_header'])
            if paragraph['paragraph_image_id']:
                paragraph_in_database.image_id = paragraph['paragraph_image_id']
            
            # Update Image object
            if paragraph['paragraph_image_id']:
                db.session.execute(update(Image)
                    .where(Image.id == paragraph['paragraph_image_id'])
                    .values(
                        alt = paragraph['paragraph_image_alt'],
                        cite = paragraph['paragraph_image_cite'],
                        used = True))
            
            # Append paragraphs to article
            article.paragraphs.append(paragraph_in_database)

            # Add summaries
            for summary in paragraph['summary']:

                # Create new Summary objects
                summary_in_database = Summary(
                    article_id = article.id,
                    paragraph_index = paragraph['paragraph_index'],
                    level = summary['level'],
                    text = summary['text'])
                           
                # Append summaries to article
                article.summaries.append(summary_in_database)

        # Record and alert
        db.session.commit()    
        flash('Article successfully saved.', 'success')

        # Return author to author's articles page
        return redirect(url_for('publish.display_author_articles'))

    # Render blank article form
    return render_template('/publish/create-article.html', form=form)


@bp.route('/edit-article', methods=['GET', 'POST'])
@login_required
@author_and_publisher_access
def edit_article():
    """Retrieve and update the selected article

    Update the Article, Image, Source, Category, Paragraph, and Summary model 
    objects from the validated data submitted by the author or publisher.
    
    For Category, Paragraph, and Summary models, which are related to the
    Article model many-to-one, first delete the article's collections, then 
    iterate over the form FieldList in order to access the updated data.
    This allows content to be added as well as removed.

    If an article is published, ensure that its draft version is not currently
    requested for publication. If the published version is edited, update 
    its publishing note, take it offline for admin approval, and update the
    status of both the published and draft versions.
    """

    # Get article form data
    form = ArticleForm() 

    # Get article
    article_id = request.args.get('article-id')
    article = db.session.query(Article) \
        .filter_by(id = article_id).one()

    # Protect requested, published articles
    if article.has_draft:
        draft_article = db.session.query(Article) \
            .filter_by(id = article.has_draft.draft_article_id).one()
        if draft_article.status == 'pub_requested':
            flash('The author of that article has requested an update. Please review the request before making changes.', 'info')
            return redirect(url_for('publish.display_publisher_articles'))
        if draft_article.status == 'pub_pending':
            flash('You are currently reviewing that article. Please publish or reject the requested changes.', 'info')
            return redirect(url_for('publish.display_publisher_articles'))

    # Alert user as to the function of form submission
    if request.method == 'GET':
        if article.status == 'published':
            flash('Changes must be saved and republished to be seen live.', 'info')
        elif article.status == 'pub_live':
            flash('Making changes to this article will take it offline. An administrator will reactivate it upon review.', 'info')

    if form.validate_on_submit():

        # Update article status 
        if article.status == 'published':
            article.status = 'pub_draft'
        if article.status == 'pub_live':
            draft_article = db.session.query(Article) \
                .filter_by(id = article.has_draft.draft_article_id).one_or_none()
            if draft_article:
                draft_article.status = 'pub_draft';
            
            # Deactivate published articles to allow admin review
            db.session.execute(update(PublishingNote)
                .where(PublishingNote.published_article_id == article.id)
                .values(
                    date_updated = datetime.date.today(),
                    is_active = False))

        # Update Article object
        article.title = form.article_title.data
        article.description = form.article_desc.data

        article.image_id = form.article_image_id.data

        # Update Image object
        if form.article_image_id.data:
            db.session.execute(update(Image)
                .where(Image.id == form.article_image_id.data)
                .values(
                    alt = form.article_image_alt.data,
                    cite = form.article_image_cite.data,
                    used = True))

        # Update Source object
        db.session.execute(update(Source)
            .where(Source.article_id == article.id)
            .values(
                title = form.source_title.data,
                author = form.source_author.data,
                link = form.source_link.data,
                name = form.source_name.data,
                contact = form.source_contact.data))
        
        # Delete article's collections
        article.categories = []
        article.paragraphs = []
        article.summaries = []

        # Flush to ensure deletion emitted before insertion 
        db.session.flush()

        # Update categories
        for category in form.article_category.data:

            # Create new Category objects for new categories
            category_in_database = db.session.query(Category) \
                .filter_by(name = category).one_or_none()
            if category_in_database is None:
                category_in_database = Category(name=category)

            # Append categories to article
            article.categories.append(category_in_database)

        # Update paragraphs
        for paragraph in form.paragraph.data:

            # Create new Paragraph objects
            paragraph_in_database = Paragraph(
                index = paragraph['paragraph_index'],
                header = paragraph['paragraph_header'])
            if paragraph['paragraph_image_id']:
                paragraph_in_database.image_id = paragraph['paragraph_image_id']

            # Update Image objects
            if paragraph['paragraph_image_id']:
                db.session.execute(update(Image)
                    .where(Image.id == paragraph['paragraph_image_id'])
                    .values(
                        alt = paragraph['paragraph_image_alt'],
                        cite = paragraph['paragraph_image_cite'],
                        used = True))

            # Append paragraphs to article
            article.paragraphs.append(paragraph_in_database)

            # Update summaries
            for summary in paragraph['summary']:

                # Create new Summary objects
                summary_in_database = Summary(
                    article_id = article.id,
                    paragraph_index = paragraph['paragraph_index'],
                    level = summary['level'],
                    text = summary['text'])
                            
                # Append summaries to article
                article.summaries.append(summary_in_database)

        # Record and alert
        db.session.commit()    
        flash('Article successfully saved.', 'success')

        # Return author to author's articles page
        return redirect(url_for('publish.display_author_articles'))

    # Get article data
    source = article.source
    categories = article.categories
    article_image = db.session.query(Image) \
        .filter_by(id = article.image_id).one_or_none()
    paragraphs = db.session.query(Paragraph, Image) \
        .outerjoin(Image, Image.id == Paragraph.image_id) \
        .filter(Paragraph.article_id == article.id) \
        .order_by(Paragraph.index).all()
    summaries = article.summaries

    # Render prefilled article form (edit mode)  
    return render_template('/publish/edit-article.html', 
        form=form, 
        article=article, 
        source=source, 
        categories=categories, 
        article_image=article_image,
        paragraphs=paragraphs,
        summaries=summaries)


@bp.route('/preview-article')
@login_required
@author_and_publisher_access
def preview_article():
    """Display the selected article as it would be seen live"""

    # Get article
    article_id = request.args.get('article-id')
    article = db.session.query(Article) \
        .filter_by(id = article_id).one()

    # Get article data
    source = article.source
    categories = article.categories
    article_image = db.session.query(Image) \
        .filter_by(id = article.image_id).one_or_none()
    paragraphs = db.session.query(Paragraph, Image) \
        .outerjoin(Image, Image.id == Paragraph.image_id) \
        .filter(Paragraph.article_id == article.id) \
        .order_by(Paragraph.index).all()
    summaries = article.summaries
    
    # Render article  
    return render_template('/publish/preview-article.html', 
        article=article, 
        source=source, 
        categories=categories, 
        article_image=article_image,
        paragraphs=paragraphs,
        summaries=summaries)


@bp.route('/request-article')
@login_required
@author_and_publisher_access
def request_article():
    """Request the selected article to be published

    Send an email requesting publication to the article's assigned publisher. 
    If none exists, email the author's associated publisher. If still none 
    exists, email admin. 

    Send the email from admin and set it to reply to the article's author. 
    BCC admin to keep a record of communiciation. 
    """

    if not current_user.email_confirmed:
        flash('<div>Please confirm your email address. Click to <a href="/resend-email-confirmation">resend confirmation</a>.</div>', 'info')
        return redirect(url_for('publish.display_author_articles'))

    # Get article 
    article_id = request.args.get('article-id')
    article = db.session.query(Article) \
        .filter_by(id = article_id).one()

    # Stop author from spamming requests
    if article.status in ('requested', 'pub_requested'): 
        flash('A request to publish has already been made.', 'info')
        return redirect(url_for('publish.display_author_articles'))

    # Get article author
    author = db.session.query(User) \
        .filter_by(id = article.author_id).one()

    # Compose email
    msg = Message(
        subject = 'Request to publish article',
        reply_to = [author.username, author.email],
        sender = current_app.config['ADMIN'][0], # email.easyread@gmail.com
        bcc = [current_app.config['ADMIN'][0], current_app.config['ADMIN'][1]], # me
        html = render_template('/email/email-request-to-publish-article.html', article=article))

    # Get article's assigned publisher and author's associated publisher
    article_publisher = db.session.query(Publisher, User) \
        .outerjoin(User, User.id == Publisher.user_id) \
        .filter(Publisher.id == article.publisher_id).one_or_none()
    author_publisher = db.session.query(Publisher, User) \
        .outerjoin(User, User.id == Publisher.user_id) \
        .filter(Publisher.id == author.published_by).one_or_none()

    # Send email to publisher 
    if article_publisher:
        msg.recipients = [article_publisher['User'].email]
    else:
        if author_publisher:
            msg.recipients = [author_publisher['User'].email]    
        else: 
            msg.recipients = [current_app.config['ADMIN'][1]] # me
    mail.send(msg)

    # Update article status
    if article.is_published:
        article.status = 'pub_requested'
    else: 
        article.status = 'requested'

    # Record and alert
    db.session.commit()    
    flash('Your article has been sent to a publisher for approval.', 'success')

    # Return author to author's articles page
    return redirect(url_for('publish.display_author_articles'))


@bp.route('/review-article', methods=['GET', 'POST'])
@login_required
@all_publishers_access
def review_article():
    """Review the selected article requested for publication
        
    Set the article's status to 'pending'. This triggers the removal of the 
    author's access to the article while it undergoes review. This prevents 
    race conditions where unchecked changes are published. Access is returned 
    upon publication or rejection.
    
    Upon selecting to review a request, assign the article to the publisher and 
    associate the author to the publisher.
    """

    # Get article
    article_id = request.args.get('article-id')
    article = db.session.query(Article) \
        .filter_by(id = article_id).one()

    # Get author
    author = db.session.query(User) \
        .filter_by(id = article.author_id).one()

    # Halt invalid review requests 
    # Article is not requested
    if article.status not in ('requested', 'pub_requested'): 
        flash('You do not have access to do that.', 'error')
        return redirect(url_for('publish.display_requests'))
    # Article is published but the current user is not the publisher
    if article.is_published and article.publisher_id != current_user.is_publisher.id:
        flash('You do not have access to do that.', 'error')
        return redirect(url_for('publish.display_requests'))

    # Update status
    if article.status == 'pub_requested':
        article.status = 'pub_pending'
    else:
        article.status = 'pending' 

    # Assign article to publisher
    article.publisher_id = current_user.is_publisher.id
 
    # Associate writer to publisher and report changes
    if article.is_published is None:
        if author.published_by != current_user.is_publisher.id:
            author.published_by = current_user.is_publisher.id

            db.session.commit()
            flash('<div>You are now reviewing a <a href="/display-publisher-articles">new article</a>. You have also recruited a <a href="/display-writers">new writer</a>.</div>', 'success')
            return redirect(url_for('publish.display_requests'))

        db.session.commit()        
        flash('<div>You are now reviewing a <a href="/display-publisher-articles">new article</a>.</div>', 'success')
        return redirect(url_for('publish.display_requests'))
    
    db.session.commit()        
    flash('<div>You are now reviewing a <a href="/display-publisher-articles">published article</a>.</div>', 'success')
    return redirect(url_for('publish.display_requests'))


@bp.route('/reject-article')
@login_required
@author_and_publisher_access
def reject_article():
    """Reject the selected article publication request

    Remove the article's 'pending' status and return write-access to the author.

    Do not remove the article's assigned publisher or the author's associated
    publisher, in order to encourage continuity and community.
    """

    # Get article
    article_id = request.args.get('article-id')
    article = db.session.query(Article) \
        .filter_by(id = article_id).one()

    # Update article status
    if article.is_published:
        article.status = 'pub_draft'
    else:
        article.status = 'draft'

    # Record and alert
    db.session.commit()    
    flash('Article successfully rejected.', 'success')

    # Return publisher to publisher's articles page
    return redirect(url_for('publish.display_publisher_articles'))


@bp.route('/publish-article', methods=['GET', 'POST'])
@login_required
@author_and_publisher_access
def publish_article():
    """Publish a copy of the selected article
    
    Create a deep copy* of the selected article, to be displayed live, under 
    the control of the publisher. 
    
    Create a publishing note to track the published and draft versions of a
    published article, record the date of publication and subsequent updates, 
    and slugify the article's title.
    
    If the article is already published, delete the outdated published version,
    update the publishing note with the newly published version, and track the
    date of update.

    Set the published article to inactive in preparation for admin approval.

    *Instantiate new objects for Article, Source, Category, Paragraph, and 
    Summary models, and serialise directly from the selected article, using 
    the article's collections where the data is related many-to-one.
    """

    # Get draft article
    draft_article_id = request.args.get('article-id')
    draft_article = db.session.query(Article) \
        .filter_by(id = draft_article_id).one()

    # Halt articles not under review
    if draft_article.status not in ("pending", "pub_pending"):
        flash('You do not have access to do that.', 'error')
        return redirect(url_for('publish.display_requests'))

    # Copy Article object 
    published_article = Article(
        title = draft_article.title,
        description = draft_article.description,
        author_id = draft_article.author_id,
        publisher_id = current_user.is_publisher.id,
        image_id = draft_article.image_id)

    # Add and flush Article object to get published article ID
    db.session.add(published_article)
    db.session.flush()

    # Copy article source
    source_copy = Source(
        title = draft_article.source.title,
        author = draft_article.source.author,
        link = draft_article.source.link,
        name = draft_article.source.name,
        contact = draft_article.source.contact)
    published_article.source = source_copy

    # Copy categories
    for category in draft_article.categories:
        published_article.categories.append(category)

    # Copy paragraphs
    for paragraph in draft_article.paragraphs:
        paragraph_copy = Paragraph(
            article_id = published_article.id,
            index = paragraph.index,
            header = paragraph.header,
            image_id = paragraph.image_id)
        published_article.paragraphs.append(paragraph_copy) 

    # Copy summaries
    for summary in draft_article.summaries:
        summary_copy = Summary(
            article_id = summary.article_id,
            paragraph_index = summary.paragraph_index,
            level = summary.level,
            text = summary.text)    
        published_article.summaries.append(summary_copy)

    if draft_article.is_published:

        # Delete outdated article
        outdated_article = db.session.query(Article) \
            .filter_by(id = draft_article.is_published.published_article_id).one()
        db.session.delete(outdated_article)
       
        # Update publishing note
        publishing_note = db.session.query(PublishingNote) \
            .filter_by(id = draft_article.is_published.id).one()
        publishing_note.published_article_id = published_article.id
        publishing_note.date_updated = datetime.date.today()
        publishing_note.to_slug(published_article.title)
        publishing_note.is_active = False

    else:

        # Create new publishing note
        publishing_note = PublishingNote(
            draft_article_id = draft_article.id,
            published_article_id = published_article.id,
            date_published = datetime.date.today(),
            is_active = False)
        publishing_note.to_slug(published_article.title)
        db.session.add(publishing_note)

    # Update article statuses
    draft_article.status = 'published'
    published_article.status = 'pub_live'
                    
    # Record and alert
    db.session.commit()    
    flash('Article successfully published. Please await activation.', 'success')

    # Return author to author's articles page
    return redirect(url_for('publish.display_publisher_articles'))


@bp.route('/activate-article', methods=['GET', 'POST'])
@admin_access
def activate_article():
    """Set published article to active"""

    # Get article
    article_id = request.args.get('article-id')
    article = db.session.query(Article, PublishingNote) \
        .join(PublishingNote, PublishingNote.published_article_id == Article.id) \
        .filter(Article.id == article_id).one()
    
    # Activate article
    article['PublishingNote'].is_active = True

    # Record and alert
    db.session.commit()    
    flash('Article successfully activated.', 'success')

    # Refresh page
    return redirect(url_for('publish.display_admin_articles'))


@bp.route('/deactivate-article', methods=['GET', 'POST'])
@admin_access
def deactivate_article():
    """Set published article to inactive"""

    # Get article
    article_id = request.args.get('article-id')
    article = db.session.query(Article, PublishingNote) \
        .join(PublishingNote, PublishingNote.published_article_id == Article.id) \
        .filter(Article.id == article_id).one()
    
    # Deactivate article
    article['PublishingNote'].is_active = False

    # Record and alert
    db.session.commit()    
    flash('Article successfully deactivated.', 'success')

    # Refresh page
    return redirect(url_for('publish.display_admin_articles'))


@bp.route('/update-article', methods=['GET'])
@login_required
@author_and_publisher_access
def update_article():
    """Update the selected draft article to its published version
    
    Update the draft's Article and Source models directly from the published
    version. For Category, Paragraph, and Summary models, which are related to 
    the Article model many-to-one, first delete the draft article's collections, 
    then reappend the content from the published article's collections.  
    """

    # Get draft and published articles
    draft_article_id = request.args.get('article-id')
    draft_article = db.session.query(Article) \
        .filter_by(id = draft_article_id).one()
    published_article = db.session.query(Article) \
        .filter_by(id = draft_article.is_published.published_article_id).one()

    # Update draft Article object
    db.session.execute(update(Article)
        .where(Article.id == draft_article.id)
        .values(
            title = published_article.title,
            description = published_article.description,
            image_id = published_article.image_id,
            status = 'published'))

    # Update draft Source object
    db.session.execute(update(Source)
        .where(Source.article_id == draft_article.id)
        .values(
            title = published_article.source.title,
            author = published_article.source.author,
            link = published_article.source.link,
            name = published_article.source.name,
            contact = published_article.source.contact))
        
    # Delete draft article's collections   
    draft_article.categories = []
    draft_article.paragraphs = []
    draft_article.summaries = [] 

    # Flush to ensure deletion emitted before insertion 
    db.session.flush()

    # Update draft categories
    for category in published_article.categories:
        draft_article.categories.append(category)

    # Copy paragraphs
    for paragraph in published_article.paragraphs:
        paragraph_copy = Paragraph(
            article_id = published_article.id,
            index = paragraph.index,
            header = paragraph.header,
            image_id = paragraph.image_id)
        draft_article.paragraphs.append(paragraph_copy) 

    # Copy summaries
    for summary in published_article.summaries:
        summary_copy = Summary(
            article_id = summary.article_id,
            paragraph_index = summary.paragraph_index,
            level = summary.level,
            text = summary.text)    
        draft_article.summaries.append(summary_copy)
    
    # Record and alert
    db.session.commit()    
    flash('Article successfully updated.', 'success')
    
    # Return author to author's articles page
    return redirect(url_for('publish.display_author_articles'))


@bp.route('/transfer-article', methods=['GET', 'POST'])
@admin_access
def transfer_article():
    """Reassign the selected published article to the selected publisher
    
    Do not reassociate the article's author. Transference is designed only for 
    republishing deleted articles. 
    """

    # Get email form
    form = EmailForm()

    if form.validate_on_submit():     

        # Get user
        user = db.session.query(User) \
            .filter_by(email = form.user_email.data).one_or_none()

        # Halt unknown users
        if user is None:
            flash('No user is associated with that email address.', 'error')
            return redirect(url_for('publish.display_publishers'))

        # Get target publisher
        publisher = db.session.query(Publisher) \
            .filter_by(user_id = user.id).one_or_none()

        if publisher is None:
            flash('No publisher is associated with that email address.', 'error')
            return redirect(url_for('publish.display_publishers'))

        # Get articles
        article = db.session.query(Article) \
            .filter_by(id = form.article_id.data).one()
        draft_article = db.session.query(Article) \
            .filter_by(id = article.has_draft.draft_article_id).one_or_none()
            
        # Reassign article to target publisher   
        article.publisher_id = publisher.id 
        if draft_article:
            draft_article.publisher_id = publisher.id

        # Reactivate publishing note
        publishingNote = db.session.query(PublishingNote) \
            .filter_by(published_article_id = article.id).one()
        publishingNote.is_active = True

        # Update article status
        article.status = 'pub_live'

        # Record and alert
        db.session.commit()    
        flash('Article successfully transferred.', 'success')
    
        # Return to admin's articles page
        return redirect(url_for('publish.display_admin_articles'))

    # Return invalid input
    flash('No user is associated with that email address.', 'error')
    return redirect(url_for('publish.display_admin_articles'))


@bp.route('/delete-article')
@login_required
@author_and_publisher_access
def delete_article():
    """Delete the selected article

    Delete the Article model object and cascade the deletion of the related 
    Source, Paragraph, and Summary model objects.

    If and article has no published version, delete all Image model objects 
    from the database and delete the related image file from Amazon S3 cloud 
    storage.

    If an article is published, create the appearance of deletion by taking
    the article offline and reassigning it to admin. This is in effort to 
    protect against the accidental or malicious deletion of content considered 
    to be of publishing quality.

    Permanent deletion, as well as transference to another publisher, can be 
    controlled via /admin-articles.
    """

    # Get article
    article_id = request.args.get('article-id')
    article = db.session.query(Article) \
        .filter_by(id = article_id).one()

    if article.has_draft: # Publisher's version of published article

        # Get admin as publisher
        admin = db.session.query(Publisher, User) \
            .outerjoin(User, User.id == Publisher.user_id) \
            .filter(User.email == current_app.config['ADMIN'][1]).one()

        # Reassign draft and published articles to publisher
        draft_article = db.session.query(Article) \
            .filter_by(id = article.has_draft.draft_article_id).one_or_none()
        if draft_article:
            draft_article.publisher_id = admin['Publisher'].id
        article.publisher_id = admin['Publisher'].id

        # Set published article to offline
        db.session.execute(update(PublishingNote)
            .where(PublishingNote.published_article_id == article.id)
            .values(is_active = False))

        # Update article status
        article.status = 'pub_deleted'

        # Record and alert
        db.session.commit()    
        flash('Article successfully deleted.', 'success')

        # Return author to author's articles page
        return redirect(url_for('publish.display_publisher_articles'))

    # Delete article images from database and cloud storage
    if not article.is_published:
        article_image = db.session.query(Image) \
            .filter_by(id = article.image_id).first()
        if article_image:
            db.session.delete(article_image)
            article_image_filename = os.path.basename(article_image.src)
            boto3.resource('s3').Object(
                os.environ['FLASKS3_BUCKET_NAME'], article_image_filename).delete()
        for paragraph in article.paragraphs:
            paragraph_image = db.session.query(Image) \
                .filter_by(id = paragraph.image_id).first()
            if paragraph_image:
                db.session.delete(paragraph_image)
                paragraph_image_filename = os.path.basename(paragraph_image.src)
                boto3.resource('s3').Object(
                    os.environ['FLASKS3_BUCKET_NAME'], paragraph_image_filename).delete()
    
    # Delete article
    db.session.delete(article)

    # Record and alert
    db.session.commit()    
    flash('Article successfully deleted.', 'success')

    # Return author to author's articles page
    return redirect(url_for('publish.display_author_articles'))


@bp.route('/permadelete-article')
@admin_access
def permadelete_article():
    """Permanently delete the selected article

    Delete the Article model object and cascade the deletion of the related 
    Source, Paragraph, and Summary model objects.

    If and article has no draft version, delete all Image model objects 
    from the database and delete the related image file from Amazon S3 cloud 
    storage.

    If an article is published, reset its draft version's status and assignment,
    and delete the related PublishingNote model object.
    """

    # Get article
    article_id = request.args.get('article-id')
    article = db.session.query(Article) \
        .filter_by(id = article_id).one()

    if article.has_draft: # Publisher's version of published article

        # Update draft article
        draft_article = db.session.query(Article) \
            .filter_by(id = article.has_draft.draft_article_id).one_or_none()
        if draft_article:
            draft_article.status = 'draft'
            draft_article.publisher_id = None

        # Delete publishing note
        pub_note = db.session.query(PublishingNote, Article) \
            .join(Article, Article.id == PublishingNote.published_article_id) \
            .filter(Article.id == article.id).one()
        db.session.delete(pub_note['PublishingNote'])

    else: # Published article has no draft version

        # Delete article images from database and cloud storage
        article_image = db.session.query(Image) \
            .filter_by(id = article.image_id).first()
        if article_image:
            db.session.delete(article_image)
            article_image_filename = os.path.basename(article_image.src)
            boto3.resource('s3').Object(
                os.environ['FLASKS3_BUCKET_NAME'], article_image_filename).delete()
        for paragraph in article.paragraphs:
            paragraph_image = db.session.query(Image) \
                .filter_by(id = paragraph.image_id).first()
            if paragraph_image:
                db.session.delete(paragraph_image)
                paragraph_image_filename = os.path.basename(paragraph_image.src)
                boto3.resource('s3').Object(
                    os.environ['FLASKS3_BUCKET_NAME'], paragraph_image_filename).delete()

    # Delete article
    db.session.delete(article)

    # Record and alert
    db.session.commit()    
    flash('Article successfully deleted.', 'success')
   
    # Return to admin's articles page
    return redirect(url_for('publish.display_admin_articles'))


@bp.route('/<int:id>/')
@bp.route('/<int:id>/<string:slug>', methods=['GET', 'POST'])
def view_article(id, slug=None):
    """Display the selected article for public view
    
    Display only active articles. An article marked inactive due to deletion
    is only be redisplayed if transferred to another publisher.  
    
    Restore a published article's partial, misspelt, or missing URL slug using 
    the article's publishing note.
    """

    # Get publishing note from URL
    publishing_note = db.session.query(PublishingNote) \
        .filter_by(id = id).first_or_404()
    
    # Restore full url
    if slug != publishing_note.slug:
        return redirect(url_for('publish.view_article', 
            id=id, 
            slug=publishing_note.slug))

    if publishing_note.is_active:

        # Get article and article data
        article = db.session.query(Article) \
            .filter_by(id = publishing_note.published_article_id).one()
        source = article.source
        categories = article.categories
        article_image = db.session.query(Image) \
            .filter_by(id = article.image_id).one_or_none()
        paragraphs = db.session.query(Paragraph, Image) \
            .outerjoin(Image, Image.id == Paragraph.image_id) \
            .filter(Paragraph.article_id == article.id) \
            .order_by(Paragraph.index).all()
        summaries = article.summaries
        
        # Render article  
        return render_template('/publish/view-article.html', 
            article=article,
            publishing_note=publishing_note,
            source=source, 
            categories=categories, 
            article_image=article_image,
            paragraphs=paragraphs,
            summaries=summaries)

    else: # Article marked inactive

        # Alert and return to index
        flash('That article is currently offline.', 'error')
        return redirect(url_for('main.index'))