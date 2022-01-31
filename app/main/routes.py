# || Imports

from flask import render_template, redirect, url_for, flash, current_app
from flask_mail import Message
from sqlalchemy import func

from app import db, mail
from app.main import bp
from app.main.forms import ContactForm
from app.models import Article, Category, Image, PublishingNote


# || VIews

@bp.route('/')
@bp.route('/index')
def index():
    """Display live, published articles"""

    articles = db.session.query(Article, Image, PublishingNote) \
        .outerjoin(Image, Image.id == Article.image_id) \
        .outerjoin(PublishingNote, PublishingNote.published_article_id == Article.id) \
        .filter(Article.status == 'pub_live') \
        .filter(PublishingNote.is_active == True).all()
        
    # Render index page
    return render_template('index.html', articles=articles)


@bp.route('/filter-articles')
def filter_articles():
    """Display a list of live, published articles to be filtered"""

    categories = db.session.query(Category).all()

    dates = db.session.query(PublishingNote) \
        .group_by(func.strftime("%Y-%m", PublishingNote.date_published)).all()

    articles = db.session.query(Article, Image, PublishingNote) \
        .outerjoin(Image, Image.id == Article.image_id) \
        .outerjoin(PublishingNote, PublishingNote.published_article_id == Article.id) \
        .filter(Article.status == 'pub_live') \
        .filter(PublishingNote.is_active == True).all()

    # Render articles filter page
    return render_template('articles.html', 
        categories=categories,
        dates=dates,
        articles=articles)


@bp.route('/about')
def about():
    """Display an article about Easy Read"""

    # Render about page
    return render_template('about.html')


@bp.route('/privacy-policy')
def privacy_policy():
    """Display the privacy policy of Easy Read"""

    # Render privacy policy page
    return render_template('privacy-policy.html')


@bp.route('/terms-and-conditions')
def terms_and_conditions():
    """Display the terms and conditions of Easy Read"""

    # Render terms and conditions page
    return render_template('terms-and-conditions.html')


@bp.route('/contact', methods=['GET', 'POST'])
def contact():
    """Display a form to contact Easy Read"""

    # Get contact form
    form = ContactForm()

    if form.validate_on_submit():
    
        # Compose and send email to admin
        msg = Message(
            subject = form.subject.data,
            sender = form.name.data,
            reply_to = form.email.data,
            recipients = [current_app.config['ADMIN'][0]],
            bcc = [current_app.config['ADMIN'][1]], # me
            body = f'{form.name.data} has sent the following message: \n\n { form.message.data}')
        mail.send(msg)

        # Report message sent
        flash('Message successfully sent. Please await a response.', 'success')

        # Refresh page
        return redirect(url_for('main.contact'))

    # Render contact page
    return render_template('contact.html', form=form)

