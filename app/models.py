from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin

from app import db, login


# Reload user object from session
@login.user_loader
def load_user(id):
    return User.query.get(int(id))    # Flask-Login requires int, not string


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


class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String)
    description = db.Column(db.String)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    source = db.relationship('Source', backref='summary', uselist=False)    # uselist for 1:1 relationship


class Source(db.Model):
    title = db.Column(db.String)
    author = db.Column(db.String)
    link = db.Column(db.String)
    name = db.Column(db.String)
    contact = db.Column(db.String)
    article_id = db.Column(db.Integer, db.ForeignKey('article.id'), primary_key=True)


