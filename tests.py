import unittest
from app import app, db
from app.models import User


class UserModelCase(unittest.TestCase):
    def set_up(self):
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'    # Use in-memory SQLite database
        db.create_all()

    def tear_down(self):
        db.session.remove()
        db.drop_all()

    def test_add_user(self):
        u = User(username='Andrew', email='andrew@email.com')
        db.session.add(u)
        db.session.commit()
        users = User.query.all()

        self.assertTrue(len(users) > 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
