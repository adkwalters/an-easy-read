import os
import unittest

from flask import current_app, session

# Configure tests to use in-memory database
# Configure before local application to avoid triggering fallback in Config object
os.environ['DATABASE_URL'] = 'sqlite://'  

from app import create_app, db
from app.models import User, Article


class TestWebApp(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.appctx = self.app.app_context()
        self.appctx.push()
        self.client = self.app.test_client()

    def tearDown(self):
        self.appctx.pop()
        self.app = None
        self.appctx = None
        self.client = None

    def test_app(self):
        assert self.app is not None
        assert current_app == self.app

    def test_home_page_redirect(self):
        response = self.client.get('/author-articles', follow_redirects=True)
        assert response.status_code == 200
        assert response.request.path == '/login'

    
class UserModelCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['WTF_CSRF_ENABLED'] = False    # Disable CSRF during tests
        self.appctx = self.app.app_context()
        self.appctx.push()
        self.client = self.app.test_client()
        db.create_all()

    def tearDown(self):
        db.drop_all()
        self.appctx.pop()
        self.app = None
        self.appctx = None
        self.client = None

    def test_add_user(self):
        user = User(username='Andrew', email='andrew@email.com')
        db.session.add(user)
        db.session.commit()
        users = User.query.all()
        self.assertTrue(len(users) > 0)

    def test_hash_user_password(self):
        u = User(username='Andrew', email='andrew@email.com')
        u.set_password('password')
        self.assertTrue(u.check_password('password'))
        self.assertFalse(u.check_password('not the password'))

    def test_register_user(self):
        register = self.client.post('/register', data=dict(
            username='Andrew',
            email='andrew@email.com',
            password='password',
            confirm_password='password',
            remember_me=True), follow_redirects=True)
        html = register.get_data(as_text=True)
        assert register.request.path == '/index'
        assert 'Welcome to Easy Read, Andrew' in html
        assert 'Welcome to Easy Read, David' not in html

    def test_log_user_in_and_out(self):
        user = User(username='Andrew', email='andrew@email.com')
        user.set_password('password')
        db.session.add(user)
        db.session.commit()
        login = self.client.post('/login', data=dict(
            username='Andrew', 
            password='password'), 
            follow_redirects=True)
        html = login.get_data(as_text=True)
        assert login.request.path == '/author-articles'
        logout = self.client.get('/logout', follow_redirects=True)
        html = logout.get_data(as_text=True)
        assert logout.request.path == '/index'
        assert 'You have logged out successfully.' in html            


class ArticleModelCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['WTF_CSRF_ENABLED'] = False   
        self.appctx = self.app.app_context()
        self.appctx.push()
        self.client = self.app.test_client()
        db.create_all()
        self.populate_db()
        self.login()

    def tearDown(self):
        db.drop_all()
        self.appctx.pop()
        self.app = None
        self.appctx = None
        self.client = None
    
    def populate_db(self):
        user = User(username='Andrew', email='andrew@email.com')
        user.set_password('password')
        db.session.add(user)
        db.session.commit()

    def login(self):
        self.client.post('/login', data=dict(
            username='Andrew', 
            password='password'
        ))

    def test_setup(self):
        response = self.client.get('/author-articles', follow_redirects=True)
        assert response.status_code == 200
        assert response.request.path == '/author-articles'

    def test_add_and_display_article(self):
        article = self.client.post('/create-article', data=dict(
            article_title='Article Title',
            article_desc='Article description'),
            follow_redirects=True)
        assert article.status_code == 200
        assert article.request.path == '/author-articles'
        html = article.get_data(as_text=True)
        assert 'Article successfully saved' in html
        assert 'Article Title' in html
  
    def test_edit_article(self):
        # Post original article
        original_title = 'Original Title'
        self.client.post('/create-article', data=dict(
            article_title=original_title,
            article_desc='Article description'))
        original_article = Article.query.filter_by(title=original_title).first()
        assert original_article is not None
        # Get original article
        get_original_article = self.client.get('/create-article', 
            query_string={
                'article-id': original_article.id}, 
            follow_redirects=True)    
        html = get_original_article.get_data(as_text=True)
        assert get_original_article.request.path == '/create-article'
        assert original_title in html
        # Post edited article
        edited_title = 'This Is the Edited Title'
        post_edited_article = self.client.post('/create-article', 
            query_string={
                'article-id': original_article.id}, 
            data=dict(
                article_title=edited_title,
                article_desc='Article description'),
                follow_redirects=True)
        edited_article = Article.query.filter_by(title=edited_title).first()
        html = post_edited_article.get_data(as_text=True)
        assert edited_article.id == original_article.id
        assert 'Article successfully saved' in html
        assert edited_title in html
        assert original_title not in html

