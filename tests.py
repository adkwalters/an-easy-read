import unittest
from app import app, db
from app.models import User

class UserModelCase(unittest.TestCase):
    def setUp(self):
        
        # Use in-memory SQLite database
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'
        
        # Create tables
        db.create_all()

    def tearDown(self):

        # Clear Session object
        db.session.remove()

        # Delete tables
        db.drop_all()
    
    def test_add_user(self):
        
        u = User(username='Andrew', email='andrew@email.com')
        db.session.add(u)
        db.session.commit()

        users = User.query.all()

        self.assertTrue(len(users) > 0)


if __name__ == '__main__':
    unittest.main(verbosity=2)
