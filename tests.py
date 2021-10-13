import unittest
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

        self.assertTrue(len(users) > 0)

    def test_hash_user_password(self):
        u = User(username='Andrew', email='andrew@email.com')
        u.set_password('password')

        self.assertTrue(u.check_password('password'))
        self.assertFalse(u.check_password('not the password'))


if __name__ == '__main__':
    unittest.main(verbosity=2)
