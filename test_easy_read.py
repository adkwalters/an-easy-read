import os
import unittest
import json

from flask import current_app
import boto3

# Configure tests to use separate PostgreSQL database
# Configure before local application to avoid triggering fallback in Config object
os.environ['DATABASE_URL'] = 'postgresql://postgres:adm@localhost:5432'

from app import create_app, db, mail
from app.models import User, Article, Image

# Get Amazon S3 cloud storage bucket
BUCKET = os.environ['FLASKS3_BUCKET_NAME']


# Clean database by dropping all tables
def clean_db(db):
    for table in reversed(db.metadata.sorted_tables):
        db.session.execute(table.delete())
        db.session.commit()


# Delete image saved to Amazon S3 cloud storage
def delete_image_from_storage(response):
    test_image = json.loads(response.data)['image_name']
    boto3.resource('s3').Object(BUCKET, test_image).delete()


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
        get_response = self.client.get('/display-author-articles', 
            follow_redirects=True)
        assert get_response.status_code == 200
        assert get_response.request.path == '/login'

    
class UserModelCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['WTF_CSRF_ENABLED'] = False # Disable CSRF during tests
        self.app.config['TESTING'] = True           # Enable testing > suppress emails
        self.appctx = self.app.app_context()
        self.appctx.push()
        self.client = self.app.test_client()
        clean_db(db)
        db.create_all()
        mail.init_app(current_app)                  # Initialise Flask-Mail to allow email suppression

    def tearDown(self):
        clean_db(db)
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
        post_registration = self.client.post('/register', 
            data=dict(
                username='Andrew',
                email='andrew@email.com',
                password='password',
                confirm_password='password'),
            follow_redirects=True)
        html = post_registration.get_data(as_text=True)
        assert post_registration.request.path == '/index'
        assert 'Welcome to An Easy Read, Andrew' in html
        assert 'Welcome to An Easy Read, David' not in html

    def test_log_user_in_and_out(self):
        user = User(username='Andrew', email='andrew@email.com')
        user.set_password('password')
        db.session.add(user)
        db.session.commit()
        post_login = self.client.post('/login', 
            data=dict(
                username='Andrew', 
                password='password'), 
            follow_redirects=True)
        html = post_login.get_data(as_text=True)
        assert post_login.request.path == '/display-author-articles'
        post_logout = self.client.get('/logout', 
            follow_redirects=True)
        html = post_logout.get_data(as_text=True)
        assert post_logout.request.path == '/index'
        assert 'You have logged out successfully.' in html            


class ArticleModelCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['WTF_CSRF_ENABLED'] = False   
        self.appctx = self.app.app_context()
        self.appctx.push()
        self.client = self.app.test_client()
        clean_db(db)
        db.create_all()
        self.populate_db()
        self.login()

    def tearDown(self):
        clean_db(db)
        self.appctx.pop()
        self.app = None
        self.appctx = None
        self.client = None
    
    def populate_db(self):
        andrew = User(username='Andrew', email='andrew@email.com')
        andrew.set_password('password')
        david = User(username='David', email='david@email.com')
        david.set_password('password')
        admin = User(username='Admin', email='adkwalters@gmail.com')
        admin.set_password('password')
        db.session.add(andrew)
        db.session.add(david)
        db.session.add(admin)
        db.session.commit()

    def login(self):
        self.client.post('/login', 
            data=dict(
                username='Andrew', 
                password='password'
        ))

    def test_setup(self):
        get_response = self.client.get('/display-author-articles', 
            follow_redirects=True)
        assert get_response.status_code == 200
        assert get_response.request.path == '/display-author-articles'

    def test_add_and_display_article(self):
        post_article = self.client.post('/create-article', 
            data=dict(
                article_title='Article Title',
                article_desc='Article description'),
            follow_redirects=True)
        assert post_article.request.path == '/display-author-articles'
        html = post_article.get_data(as_text=True)
        assert 'Article successfully saved' in html
        assert 'Article Title' in html

    def test_delete_article(self):
        # Post article
        post_article = self.client.post('/create-article', 
            data=dict(
                article_title='Title',
                article_desc='Description'),
            follow_redirects=True)
        articles_display = post_article.get_data(as_text=True)
        assert 'Title' in articles_display
        article = db.session.query(Article).filter_by(title="Title").one_or_none()
        # Delete article
        get_delete_article = self.client.get('/delete-article',
            query_string={
                'article-id': article.id},
            follow_redirects=True)
        updated_articles_display = get_delete_article.get_data(as_text=True)
        assert 'Title' not in updated_articles_display
  
    def test_edit_article(self):
        # Post original article
        original_title = 'Original Title'
        self.client.post('/create-article', 
            data=dict(
                article_title=original_title,
                article_desc='Article description'))
        original_article = db.session.query(Article).filter_by(title=original_title).one()
        assert original_article is not None
        # Get original article
        get_original_article = self.client.get('/edit-article', 
            query_string={
                'article-id': original_article.id}, 
            follow_redirects=True)    
        html = get_original_article.get_data(as_text=True)
        assert get_original_article.request.path == '/edit-article'
        assert original_title in html
        # Post edited article
        edited_title = 'This Is the Edited Title'
        post_edited_article = self.client.post('/edit-article', 
            query_string={
                'article-id': original_article.id}, 
            data=dict(
                article_title=edited_title,
                article_desc='Article description'),
            follow_redirects=True)
        html = post_edited_article.get_data(as_text=True)
        assert 'Article successfully saved' in html
        assert edited_title in html
        assert original_title not in html
        edited_article = db.session.query(Article).filter_by(title=edited_title).one()
        assert edited_article.id == original_article.id

    def test_restrict_article_access_to_author(self):     
        # Post article as Andrew
        self.client.post('/create-article',
            data=dict(
                article_title='Title',
                article_desc='Description'))
        andrews_article = db.session.query(Article).filter_by(title='Title').one()
        andrew = db.session.query(User).filter_by(username='Andrew').one()
        assert andrews_article.author == andrew
        # Get article as Andrew
        get_article_as_andrew = self.client.get('/edit-article',
            query_string={
                'article-id': andrews_article.id},
            follow_redirects=True)
        assert get_article_as_andrew.request.path == '/edit-article'
        # Log Andrew out and David in
        self.client.get('/logout')
        self.client.post('/login',
            data=dict(
                username='David',
                password='password'),
            follow_redirects=True)
        get_index_as_david = self.client.get('/')
        get_index_as_david_html = get_index_as_david.get_data(as_text=True)
        assert 'David' in get_index_as_david_html
        # get article as David
        get_article_as_david = self.client.get('/edit-article',
            query_string={
                'article-id': andrews_article.id},
            follow_redirects=True)
        assert get_article_as_david.request.path != '/edit-article'
        get_article_as_david_html = get_article_as_david.get_data(as_text=True)
        assert 'You do not have access to that article.' in get_article_as_david_html

    def test_allow_admins_to_read_and_write_all_articles(self):
        # Post initial article as user
        self.client.post('/create-article',
            data=dict(
                article_title='Title',
                article_desc='Description'))
        user_article = db.session.query(Article).filter_by(title='Title').one()
        user = db.session.query(User).filter_by(username='Andrew').one()
        assert user_article.author == user
        # Get initial article as user
        get_article_as_user = self.client.get('/edit-article',
            query_string={
                'article-id': user_article.id},
            follow_redirects=True)
        assert get_article_as_user.request.path == '/edit-article'
        # Log user out and admin in
        self.client.get('/logout')
        self.client.post('/login',
            data=dict(
                username='Admin',
                password='password'),
            follow_redirects=True)
        # Get initial article as Admin
        get_initial_article_as_admin = self.client.get('/edit-article',
            query_string={
                'article-id': user_article.id},
            follow_redirects=True)
        assert get_initial_article_as_admin.request.path == '/edit-article'
        # Post updated article as admin
        post_updated_article_as_admin = self.client.post('/edit-article',
            query_string={
                'article-id': user_article.id},
            data=dict(
                article_title='Updated Title',
                article_desc='Updated Description'),
            follow_redirects=True)
        assert post_updated_article_as_admin.request.path == '/display-author-articles'
        # Get updated article as admin
        get_updated_article_as_admin = self.client.post('/edit-article', 
            query_string={
                'article-id': user_article.id},
            follow_redirects=True)
        updated_article_html = get_updated_article_as_admin.get_data(as_text=True)
        assert 'updated Title' and 'Updated Description' in updated_article_html
        # Log admin out and user in
        self.client.get('/logout')
        self.client.post('/login',
            data=dict(
                username='Andrew',
                password='password'),
            follow_redirects=True)
        # Get updated article as user
        get_updated_article_as_user = self.client.get('/edit-article',
            query_string={
                'article-id': user_article.id},
            follow_redirects=True)
        admin_updated_article_html = get_updated_article_as_user.get_data(as_text=True)
        assert 'updated Title' and 'Updated Description' in admin_updated_article_html


class SourceModelCase(unittest.TestCase):    
    def setUp(self):
        self.app = create_app()
        self.app.config['WTF_CSRF_ENABLED'] = False   
        self.appctx = self.app.app_context()
        self.appctx.push()
        self.client = self.app.test_client()
        clean_db(db)
        db.create_all()

    def tearDown(self):
        clean_db(db)
        self.appctx.pop()
        self.app = None
        self.appctx = None
        self.client = None
    
    def test_add_and_edit_article_source_data(self):
        # Register and sign user in
        self.client.post('register',
            data=dict(
                username='Andrew',
                email='andrew@email.com',
                password='password',
                confirm_password='password'))
        self.client.post('/login', 
            data=dict(
                username='Andrew', 
                password='password'))
        # Post article with source data
        self.client.post('/create-article',
            data=dict(
                article_title='Article Title',
                article_desc='Article description',
                source_title='Source Article Title',
                source_author='Dr Source',
                source_link='https://www.source.com/source-article-title',
                source_name='The Source',
                source_contact='source@email.com'))
        article = db.session.query(Article).filter_by(title='Article Title').one()
        # Get article with source data
        get_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id})
        get_article_html = get_article.get_data(as_text=True)
        assert 'Source Article Title' in get_article_html
        # Post article with updated source data
        post_updated_artilce = self.client.post('/edit-article',
            query_string={
                'article-id': article.id},
            data=dict(
                article_title='Article Title',
                article_desc='Article description',
                source_title='Updated Source Article Title',
                source_author='Dr Updated Source',
                source_link='https://www.source.com/updated-source-article-title',
                source_name='The Updated Source',
                source_contact='updated_source@email.com'),
            follow_redirects=True)
        post_updated_artilce_html = post_updated_artilce.get_data(as_text=True)
        assert 'Article Title' in post_updated_artilce_html
        # Get article with updated source data
        get_updated_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id})
        get_updated_article_html = get_updated_article.get_data(as_text=True)
        assert 'Updated Source Article Title' in get_updated_article_html


class CategoryModelCase(unittest.TestCase):    
    def setUp(self):
        self.app = create_app()
        self.app.config['WTF_CSRF_ENABLED'] = False   
        self.appctx = self.app.app_context()
        self.appctx.push()
        self.client = self.app.test_client()
        clean_db(db)
        db.create_all()

    def tearDown(self):
        clean_db(db)
        self.appctx.pop()
        self.app = None
        self.appctx = None
        self.client = None
    
    def test_add_and_update_article_categories(self):
        # Register and sign user in
        self.client.post('register',
            data=dict(
                username='Andrew',
                email='andrew@email.com',
                password='password',
                confirm_password='password'))
        self.client.post('/login', 
            data=dict(
                username='Andrew', 
                password='password'))
        # Post article with category data
        self.client.post('/create-article',
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'article_category-1': 'Initial Category 1',
                'article_category-2': 'Initial Category 2'})
        article = db.session.query(Article).filter_by(title='Title').one()
        # Get article with category data
        get_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id})
        article_html = get_article.get_data(as_text=True)
        assert 'Category 1' in article_html
        # Post article with updated category data
        self.client.post('/edit-article',
            query_string={
                'article-id': article.id},
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'article_category-1': 'Updated Category A',
                'article_category-2': 'Updated Category B'},
            follow_redirects=True)
        # Get article with updated category data
        get_updated_article = self.client.get('/edit-article', 
            query_string={
                'article-id': article.id},
            follow_redirects=True)
        updated_article_html = get_updated_article.get_data(as_text=True)
        assert 'Updated Category A' and 'Updated Category B' in updated_article_html
        assert 'Initial Category 1' and 'Initial Category 2' not in updated_article_html


class ImageModelCase(unittest.TestCase):    
    def setUp(self):
        self.app = create_app()
        self.app.config['WTF_CSRF_ENABLED'] = False   
        self.appctx = self.app.app_context()
        self.appctx.push()
        self.client = self.app.test_client()
        clean_db(db)
        db.create_all()
        self.populate_db()
        self.login()

    def tearDown(self):
        clean_db(db)
        self.appctx.pop()
        self.app = None
        self.appctx = None
        self.client = None
    
    def populate_db(self):
        andrew = User(username='Andrew', email='andrew@email.com')
        andrew.set_password('password')
        db.session.add(andrew)
        db.session.commit()

    def login(self):
        self.client.post('/login', 
            data=dict(
                username='Andrew', 
                password='password'))
    
    def test_upload_and_validate_image(self):
        # Post valid image
        image = r'app\static\test_images\initial_image.jpg'
        post_valid_image = self.client.post('/add-image', 
            data={
            'upload_image': (open(image, 'rb'), image)})
        assert post_valid_image.status_code == 201    # success, created
        # Post false image (incorrect file extension)
        false_image = r'app\static\test_images\inorrect_ext_jpg.png'
        post_false_image = self.client.post('/add-image', 
            data={
            'upload_image': (open(false_image, 'rb'), false_image)})
        assert post_false_image.status_code == 400    # Bad request
        # Post oversized image
        oversized_image = r'app\static\test_images\oversized_image.jpg'
        post_oversized_image = self.client.post('/add-image', 
            data={
            'upload_image': (open(oversized_image, 'rb'), oversized_image)})
        assert post_oversized_image.status_code == 413    # Request entity too large
        # Post text file
        text_file = r'app\static\test_images\text_file.txt'
        post_text_file = self.client.post('/add-image', 
            data={
            'upload_image': (open(text_file, 'rb'), text_file)})
        assert post_text_file.status_code == 400    # Bad request
        # Delete test images from cloud storage
        delete_image_from_storage(post_valid_image)

    def test_add_and_update_article_image(self):
        # Post initial image 
        image_file = r'app\static\test_images\initial_image.jpg'
        post_image = self.client.post('/add-image', 
            data={
                'upload_image': (open(image_file, 'rb'), image_file)})
        image_id = json.loads(post_image.data)['image_id']
        image_src = json.loads(post_image.data)['image_name']
        image = db.session.query(Image).get(image_id)
        # Post article with initial image ID and alt
        post_initial_article = self.client.post('/create-article', 
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'article_image_id': image.id,
                'article_image_alt': 'Initial image description',
                'article_image_cite': 'Initial image citation'},
            follow_redirects=True)
        articles_display = post_initial_article.get_data(as_text=True)
        assert image_src in articles_display
        article = db.session.query(Article).filter_by(title='Title').one()
        # Get article with initial image, alt and citation
        get_initial_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id})
        initial_article_html = get_initial_article.get_data(as_text=True)
        assert image_src in initial_article_html
        assert 'Initial image description' in initial_article_html
        assert 'Initial image citation' in initial_article_html
        # Post updated image 
        updated_image_file = r'app\static\test_images\updated_image.jpg'
        post_updated_image = self.client.post('/add-image', 
            data={
                'upload_image': (open(updated_image_file, 'rb'), updated_image_file)})
        updated_image_id = json.loads(post_updated_image.data)['image_id']
        updated_image_src = json.loads(post_updated_image.data)['image_name']
        updated_image = db.session.query(Image).get(updated_image_id)
        # Post article with updated image ID, alt and citation
        post_updated_article = self.client.post('/edit-article',
            query_string={
                'article-id': article.id},
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'article_image_id': updated_image.id,
                'article_image_alt': 'Updated image description',
                'article_image_cite': 'Updated image citation'},
            follow_redirects=True)
        updated_articles_display = post_updated_article.get_data(as_text=True)
        assert updated_image_src in updated_articles_display
        # Get article with updated image ID, alt and citation
        get_updated_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id})
        updated_article_html = get_updated_article.get_data(as_text=True)
        assert updated_image_src in updated_article_html
        assert 'Updated image description' in updated_article_html
        assert 'Updated image citation' in updated_article_html
        # Delete test images from cloud storage
        delete_image_from_storage(post_image)
        delete_image_from_storage(post_updated_image)


class ParagraphModelCase(unittest.TestCase):    
    def setUp(self):
        self.app = create_app()
        self.app.config['WTF_CSRF_ENABLED'] = False   
        self.appctx = self.app.app_context()
        self.appctx.push()
        self.client = self.app.test_client()
        clean_db(db)
        db.create_all()
        self.populate_db()
        self.login()

    def tearDown(self):
        clean_db(db)
        self.appctx.pop()
        self.app = None
        self.appctx = None
        self.client = None
    
    def populate_db(self):
        andrew = User(username='Andrew', email='andrew@email.com')
        andrew.set_password('password')
        db.session.add(andrew)
        db.session.commit()

    def login(self):
        self.client.post('/login', 
            data=dict(
                username='Andrew', 
                password='password'))

    def test_add_and_update_paragraph_header(self):
        # Post article with initial headers
        self.client.post('/create-article',
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'paragraph-1-paragraph_index': '1',
                'paragraph-1-paragraph_header': 'Initial Paragraph 1 Header',
                'paragraph-2-paragraph_index': '2',
                'paragraph-2-paragraph_header': 'Initial Paragraph 2 Header',
                'paragraph-3-paragraph_index': '3',
                'paragraph-3-paragraph_header': 'Initial Paragraph 3 Header',
                })
        article = db.session.query(Article).filter_by(title='Title').one()
        # Get article with initial headers
        get_initial_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id}) 
        initial_article_html = get_initial_article.get_data(as_text=True)
        assert 'Initial Paragraph 1' and 'Initial Paragraph 2' \
            and 'Initial Paragraph 3' in initial_article_html
        # Post article with updated headers
        self.client.post('/edit-article',
            query_string={
                'article-id': article.id},
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'paragraph-1-paragraph_index': '1',
                'paragraph-1-paragraph_header': 'Updated Paragraph 1 Header',
                'paragraph-2-paragraph_index': '2',
                'paragraph-3-paragraph_index': '3',
                'paragraph-3-paragraph_header': 'Updated Paragraph 3 Header',
                })
        # Get article with updated headers
        get_updated_article = self.client.post('/edit-article',
            query_string={
                'article-id': article.id},
            follow_redirects=True)
        updated_article_html = get_updated_article.get_data(as_text=True)
        assert 'Updated Paragraph 1' and 'id="paragraph-2"' \
            and 'Updated Paragraph 3' in updated_article_html
        assert 'Initial' not in updated_article_html

    def test_add_and_update_paragraph_image(self):
        # Post initial image 
        image_file = r'app\static\test_images\initial_image.jpg'
        post_image = self.client.post('/add-image', 
            data={
                'upload_image': (open(image_file, 'rb'), image_file)})
        image_id = json.loads(post_image.data)['image_id']
        image_src = json.loads(post_image.data)['image_name']
        image = db.session.query(Image).get(image_id)
        # Post article with initial image ID, alt and citation
        self.client.post('/create-article', 
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'paragraph-1-paragraph_index': '1',
                'paragraph-1-paragraph_image_id': image.id,
                'paragraph-1-paragraph_image_alt': 'Initial image description',
                'paragraph-1-paragraph_image_cite': 'Initial image citation'})
        article = db.session.query(Article).filter_by(title='Title').one()
        # Get article with initial image, alt and citation
        get_initial_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id})
        initial_article_html = get_initial_article.get_data(as_text=True)
        assert image_src in initial_article_html
        assert 'Initial image description' in initial_article_html
        assert 'Initial image citation' in initial_article_html
        # Post updated image 
        updated_image_file = r'app\static\test_images\updated_image.jpg'
        post_updated_image = self.client.post('/add-image', 
            data={
                'upload_image': (open(updated_image_file, 'rb'), updated_image_file)})
        updated_image_id = json.loads(post_updated_image.data)['image_id']
        updated_image_src = json.loads(post_updated_image.data)['image_name']
        updated_image = db.session.query(Image).get(updated_image_id)
        # Post article with updated image ID and alt
        self.client.post('/edit-article',
            query_string={
                'article-id': article.id},
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'paragraph-1-paragraph_index': '1',
                'paragraph-1-paragraph_image_id': updated_image.id,
                'paragraph-1-paragraph_image_alt': 'Updated image description',
                'paragraph-1-paragraph_image_cite': 'Updated image citation'})
        # Get article with updated image ID and alt
        get_updated_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id})
        updated_article_html = get_updated_article.get_data(as_text=True)
        assert updated_image_src in updated_article_html
        assert 'Updated image description' in updated_article_html
        assert 'Updated image citation' in updated_article_html
        # Delete test images from cloud storage
        delete_image_from_storage(post_image)
        delete_image_from_storage(post_updated_image)


class LevelModelCase(unittest.TestCase):    
    def setUp(self):
        self.app = create_app()
        self.app.config['WTF_CSRF_ENABLED'] = False   
        self.appctx = self.app.app_context()
        self.appctx.push()
        self.client = self.app.test_client()
        clean_db(db)
        db.create_all()
        self.populate_db()
        self.login()

    def tearDown(self):
        clean_db(db)
        self.appctx.pop()
        self.app = None
        self.appctx = None
        self.client = None
    
    def populate_db(self):
        andrew = User(username='Andrew', email='andrew@email.com')
        andrew.set_password('password')
        db.session.add(andrew)
        db.session.commit()

    def login(self):
        self.client.post('/login', 
            data=dict(
                username='Andrew', 
                password='password'))

    def test_add_and_update_summaries(self):
        # Post article with initial summaries 
        self.client.post('/create-article',
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'paragraph-1-paragraph_index': '1',
                'paragraph-1-summary-1-level': '1',
                'paragraph-1-summary-1-text': 'Initial paragraph 1 level 1 summary',
                'paragraph-2-paragraph_index': '2',
                'paragraph-2-summary-1-level': '1',
                'paragraph-2-summary-1-text': 'Initial paragraph 2 level 1 summary',
                'paragraph-2-summary-2-level': '2',
                'paragraph-2-summary-2-text': 'Initial paragraph 2 level 2 summary',
                'paragraph-3-paragraph_index': '3',
                'paragraph-3-summary-1-level': '1',
                'paragraph-3-summary-1-text': 'Initial paragraph 3 level 1 summary',
                'paragraph-3-summary-2-level': '2',
                'paragraph-3-summary-2-text': 'Initial paragraph 3 level 2 summary',
                'paragraph-3-summary-3-level': '3',
                'paragraph-3-summary-3-text': 'Initial paragraph 3 level 3 summary'})
        article = db.session.query(Article).filter_by(title='Title').one()
        # Get article with initial summaries
        get_initial_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id}) 
        initial_article_html = get_initial_article.get_data(as_text=True)
        assert 'Initial paragraph 1 level 1 summary' \
            and 'Initial paragraph 2 level 1 summary' \
            and 'Initial paragraph 2 level 2 summary' \
            and 'Initial paragraph 3 level 1 summary' in initial_article_html
        # Post article with updated summaries
        self.client.post('/edit-article',
            query_string={
                'article-id': article.id},
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'paragraph-1-paragraph_index': '1',
                'paragraph-1-summary-1-level': '1',
                'paragraph-1-summary-1-text': 'Updated paragraph 1 level 1 summary',
                'paragraph-1-summary-2-level': '2',
                'paragraph-1-summary-2-text': 'Updated paragraph 1 level 2 summary',
                'paragraph-2-paragraph_index': '2',
                'paragraph-2-summary-1-level': '1',
                'paragraph-2-summary-1-text': 'Updated paragraph 2 level 1 summary',
                'paragraph-3-paragraph_index': '3',
                'paragraph-3-summary-1-level': '1',
                'paragraph-3-summary-1-text': 'Updated paragraph 3 level 1 summary'})
        # Get article with updated summaries
        get_updated_article = self.client.post('/edit-article',
            query_string={
                'article-id': article.id},
            follow_redirects=True)
        updated_article_html = get_updated_article.get_data(as_text=True)
        assert 'Updated paragraph 1 level 1 summary' \
            and 'Updated paragraph 1 level 2 summary' \
            and 'Updated paragraph 2 level 1 summary' \
            and 'Updated paragraph 3 level 1 summary' in updated_article_html
        assert 'Initial' not in updated_article_html
        assert 'paragraph-2-summary-2' \
            and 'paragraph-3-summary-2' \
            and 'paragraph-2-summary-3' not in updated_article_html

