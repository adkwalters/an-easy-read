from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app
from flask_login import UserMixin
from slugify import slugify
from time import time
import jwt

from app import db, login


# Reload user object from session
@login.user_loader
def load_user(id):
    return User.query.get(int(id))    # Flask-Login requires int, not string


# Declare association tables first
article_category = db.Table('article_category',
    db.Column('article_id', db.ForeignKey('article.id')),
    db.Column('category_id', db.ForeignKey('category.id')))


class User(UserMixin, db.Model):
    """An object to store a base-level user 
    
    Users can:
     - create, save, and edit articles as author.
     - submit requests for their articles to be published.

    Methods
    -------
    set_password
        Generate a password hash from the user's inputted string
        to securely store the user's password
    check_password
        Check the user's inputted password against the stored hash
    send_token
        Encrypt the user's ID to be sent as JSON Web Token 
    check_token
        Decrypt the token and return the user's ID
    -------
    """
    # Attributes
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True)
    email = db.Column(db.String, unique=True)
    email_confirmed = db.Column(db.Boolean, default=False)
    password_hash = db.Column(db.String, unique=True)
    published_by = db.Column(db.ForeignKey('publisher.id',
        use_alter=True)) # Resolve dependency cycle to allow DROP emission
    # Relationships
    is_publisher = db.relationship('Publisher',
        backref='user',
        uselist=False,
        foreign_keys='Publisher.user_id')
    authored_articles = db.relationship('Article',
        backref='author',
        foreign_keys='Article.author_id')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def send_token(self, expires_in=600):
        return jwt.encode({
            'user_id': self.id, 
            'exp': time() + expires_in,},
            current_app.config['SECRET_KEY'], 
            algorithm = 'HS256')
            
    @staticmethod
    def check_token(token):
        try:
            id = jwt.decode(token,
                current_app.config['SECRET_KEY'],
                algorithms=['HS256'])['user_id']
        except:
            return
        return User.query.get(id)


class Publisher(db.Model):
    """An extension to the User object, added upon promotion

    Publishers can:
     - be assigned articles, affecting access
     - be associated to authors, affecting request recipience
     - display assigned articles on the site publically 

    Selected at admin discretion, publishers help quality control content. 
    They also help create communities by publishing language- or category-
    specific content.   
    """
    # Attributes
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.ForeignKey('user.id'))
    # Relationships
    writers = db.relationship('User',
        backref='publisher',
        foreign_keys='User.published_by')
    published_articles = db.relationship('Article',
        backref='publisher',
        foreign_keys='Article.publisher_id')


class Image(db.Model):
    """An object to store an image's source and description
    
    Images can be attached to articles and paragraphs.
    """
    # Attributes
    id = db.Column(db.Integer, primary_key=True)
    alt = db.Column(db.String)
    src = db.Column(db.String)
    cite = db.Column(db.String)
    # Relationships
    article = db.relationship('Article', 
        backref='image')
    paragraphs = db.relationship('Paragraph', 
        backref='image')


class Article(db.Model):
    """An object to store the content of an article

    Articles can only be accessed by their author.
    Articles with assigned publishers can also be accessed by the publisher.

    Deleting an Article model object cascade deletes the related model objects
    for Source, Paragraph, and Summary but not Category. 
    """
    # Attributes
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String)
    description = db.Column(db.String)
    image_id = db.Column(db.ForeignKey('image.id'))
    status = db.Column(db.String)
    author_id = db.Column(db.ForeignKey('user.id'))
    publisher_id = db.Column(db.ForeignKey('publisher.id'))
    # Relationships
    source = db.relationship('Source', 
        backref='summary', 
        uselist=False,
        cascade="all, delete, delete-orphan")          
    categories = db.relationship('Category', 
        secondary=article_category,
        back_populates='articles')
    paragraphs = db.relationship('Paragraph', 
        backref='article',
        cascade="all, delete, delete-orphan")
    summaries = db.relationship('Summary',
        backref='article',
        cascade="all, delete, delete-orphan")
    is_published = db.relationship('PublishingNote',
        backref='draft_article',
        uselist=False,
        foreign_keys='PublishingNote.draft_article_id')
    has_draft = db.relationship('PublishingNote',
        backref='published_article',
        uselist=False,
        foreign_keys='PublishingNote.published_article_id')


class Source(db.Model):
    """An object to store the metadata of an article's source content"""
    # Attributes
    article_id = db.Column(db.ForeignKey('article.id'), primary_key=True)
    title = db.Column(db.String)
    author = db.Column(db.String)
    link = db.Column(db.String)
    name = db.Column(db.String)
    contact = db.Column(db.String)


class Category(db.Model):
    """An object to store a label for an article's genre"""
    # Attributes
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    # Relationships
    articles = db.relationship('Article', 
        secondary=article_category,
        back_populates='categories')


class Paragraph(db.Model):
    """An object to store the content of an article paragraph

    Paragraph indices refer to their position within their articles.
    """
    # Attributes
    article_id = db.Column(db.ForeignKey('article.id'), primary_key=True)
    index = db.Column(db.Integer, primary_key=True)
    header = db.Column(db.String)
    image_id = db.Column(db.ForeignKey('image.id'))
    # Relationships
    summaries = db.relationship('Summary',
        backref='paragraph',
        cascade="all, delete, delete-orphan")


class Summary(db.Model):
    """An object to store an alternative version of a paragraph's text content

    Summary levels indicate the depth of summarisation from the original text.
    Low levels indicate higher reading levels due to less summarisation.
    """
    # Attributes
    article_id = db.Column(db.ForeignKey('article.id'), primary_key=True)
    paragraph_index = db.Column(db.ForeignKey('paragraph.index'), primary_key=True)
    level = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String)


class PublishingNote(db.Model):
    """An extension to the Article object, added upon article publication

    PublishingNotes can:
     - track the draft and published versions of published articles 
     - store the urls of the published versions of published articles
     - toggle the article on- and offline

    The publishing note serves as a form of version control, pointing to the 
    draft and most recently published versions of an article. 
    
    Currently, outdated versions of published articles are deleted during 
    publication. These could be saved to provide fuller version control if it 
    proves more valuable than the memory cost.
    
    Methods
    -------
    to_slug
        Generate a URL slug from the article title
    -------
    """
    # Attributes
    id = db.Column(db.Integer, primary_key=True)
    draft_article_id = db.Column(db.ForeignKey('article.id'))
    published_article_id = db.Column(db.ForeignKey('article.id'))
    slug = db.Column(db.String)
    date_published = db.Column(db.Date)
    date_updated = db.Column(db.Date)
    is_active = db.Column(db.Boolean)

    def to_slug(self, value):
        self.slug = slugify(value)


