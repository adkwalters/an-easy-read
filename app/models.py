from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

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
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True)
    email = db.Column(db.String, unique=True)
    password_hash = db.Column(db.String, unique=True)
    articles = db.relationship('Article', backref='author')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Image(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    alt = db.Column(db.String)
    src = db.Column(db.String)
    article = db.relationship('Article', backref='article')
    paragraphs = db.relationship('Paragraph', backref='paragraph')


class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String)
    description = db.Column(db.String)
    user_id = db.Column(db.ForeignKey('user.id'))
    image_id = db.Column(db.ForeignKey('image.id'))
    source = db.relationship('Source', 
        backref='summary', 
        uselist=False,    # 1:1 relationship
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


class Source(db.Model):
    title = db.Column(db.String)
    author = db.Column(db.String)
    link = db.Column(db.String)
    name = db.Column(db.String)
    contact = db.Column(db.String)
    article_id = db.Column(db.ForeignKey('article.id'), primary_key=True)


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String)
    articles = db.relationship('Article', 
        secondary=article_category,
        back_populates='categories')


class Paragraph(db.Model):
    article_id = db.Column(db.ForeignKey('article.id'), primary_key=True)
    index = db.Column(db.Integer, primary_key=True)
    header = db.Column(db.String)
    image_id = db.Column(db.ForeignKey('image.id'))


class Summary(db.Model):
    article_id = db.Column(db.ForeignKey('article.id'), primary_key=True)
    paragraph_index = db.Column(db.ForeignKey('paragraph.index'), primary_key=True)
    level = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String)

