import os

# Configure tests to use in-memory database 
# Import before other imports to avoid database fallback
os.environ['DATABASE_URL'] = 'sqlite://'  

import unittest
from flask import current_app
from flask_login import current_user, login_user, logout_user
from app import create_app, db
from app.models import User


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
        u = User(username='Andrew', email='andrew@email.com')
        db.session.add(u)
        db.session.commit()
        users = User.query.all()
        self.assertTrue(len(users) > 0)

    def test_hash_user_password(self):
        u = User(username='Andrew', email='andrew@email.com')
        u.set_password('password')
        self.assertTrue(u.check_password('password'))
        self.assertFalse(u.check_password('not the password'))

    def test_log_user_in_and_out(self):
        u = User(username='Andrew', email='andrew@email.com')
        u.set_password('password')
        db.session.add(u)
        db.session.commit()
        login_response = self.client.post('/login', data=dict(
            username='Andrew', 
            password='password'), follow_redirects=True)
        html = login_response.get_data(as_text=True)
        assert login_response.request.path == '/index'
        assert 'Welcome to Easy Read, Andrew' in html
        assert 'Welcome to Easy Read, David' not in html
        logout_response = self.client.get('/logout', follow_redirects=True)
        html = logout_response.get_data(as_text=True)
        assert logout_response.request.path == '/index'
        assert 'You have logged out successfully.' in html

