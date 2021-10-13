import unittest
from flask_login import current_user, login_user, logout_user
from app import app, db
from app.models import User


class UserModelCase(unittest.TestCase):
    def setUp(self):
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'    # Use in-memory SQLite database
        db.create_all()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    def test_add_user(self):
        u = User(username='Andrew', email='andrew@email.com')
        db.session.add(u)
        db.session.commit()
        users = User.query.all()

        self.assertTrue(len(users) > 0)    # User in database

    def test_hash_user_password(self):
        u = User(username='Andrew', email='andrew@email.com')
        u.set_password('password')

        self.assertTrue(u.check_password('password'))    # Correct password
        self.assertFalse(u.check_password('not the password'))    # Incorrect password

    def test_log_user_in_and_out(self):
        u = User(username='Andrew', email='andrew@email.com')
        u.set_password('password')
        db.session.add(u)
        db.session.commit()
        user = User.query.filter_by(username='Andrew').first()

        self.assertFalse(current_user)    # No user logged in

        with app.test_request_context():
            login_user(user)

        self.assertTrue(current_user)    # User logged in

        with app.test_request_context():
            logout_user(user)

        self.assertFalse(current_user)    # No user logged in


if __name__ == '__main__':
    unittest.main(verbosity=2)
