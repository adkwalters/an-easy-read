import os
import unittest
import json

from flask import current_app

# Configure tests to use in-memory database
# Configure before local application to avoid triggering fallback in Config object
os.environ['DATABASE_URL'] = 'sqlite://'  

from app import create_app, db
from app.models import User, Article, Image


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
        get_response = self.client.get('/author-articles', 
            follow_redirects=True)
        assert get_response.status_code == 200
        assert get_response.request.path == '/login'

    
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
        post_registration = self.client.post('/register', 
            data=dict(
                username='Andrew',
                email='andrew@email.com',
                password='password',
                confirm_password='password',
                remember_me=True), 
            follow_redirects=True)
        html = post_registration.get_data(as_text=True)
        assert post_registration.request.path == '/index'
        assert 'Welcome to Easy Read, Andrew' in html
        assert 'Welcome to Easy Read, David' not in html

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
        assert post_login.request.path == '/author-articles'
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
        andrew = User(username='Andrew', email='andrew@email.com')
        andrew.set_password('password')
        david = User(username='David', email='david@email.com')
        david.set_password('password')
        db.session.add(andrew)
        db.session.add(david)
        db.session.commit()

    def login(self):
        self.client.post('/login', 
            data=dict(
                username='Andrew', 
                password='password'
        ))

    def test_setup(self):
        get_response = self.client.get('/author-articles', 
            follow_redirects=True)
        assert get_response.status_code == 200
        assert get_response.request.path == '/author-articles'

    def test_add_and_display_article(self):
        post_article = self.client.post('/create-article', 
            data=dict(
                article_title='Article Title',
                article_desc='Article description'),
            follow_redirects=True)
        assert post_article.request.path == '/author-articles'
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
        assert 'You do not have access to edit that article.' in get_article_as_david_html


class SourceModelCase(unittest.TestCase):    
    def setUp(self):
        self.app = create_app()
        self.app.config['WTF_CSRF_ENABLED'] = False   
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
        db.create_all()

    def tearDown(self):
        db.drop_all()
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
        image = r'app\static\images\test_images\initial_image.jpg'
        response = self.client.post('/add-image', 
            data={
            'article_image': (open(image, 'rb'), image)})
        assert response.status_code == 201    # success, created
        # Post false image (incorrect file extension)
        false_image = r'app\static\images\test_images\inorrect_ext_jpg.png'
        post_false_image = self.client.post('/add-image', 
            data={
            'article_image': (open(false_image, 'rb'), false_image)})
        assert post_false_image.status_code == 400    # Bad request
        # Post oversized image
        oversized_image = r'app\static\images\test_images\oversized_image.jpg'
        post_oversized_image = self.client.post('/add-image', 
            data={
            'article_image': (open(oversized_image, 'rb'), oversized_image)})
        assert post_oversized_image.status_code == 413    # Request entity too large
        # Post text file
        text_file = r'app\static\images\test_images\text_file.txt'
        post_text_file = self.client.post('/add-image', 
            data={
            'article_image': (open(text_file, 'rb'), text_file)})
        assert post_text_file.status_code == 400    # Bad request

    def test_add_and_update_article_image(self):
        # Post initial image 
        image_file = r'app\static\images\test_images\initial_image.jpg'
        post_image = self.client.post('/add-image', 
            data={
                'article_image': (open(image_file, 'rb'), image_file)})
        post_image_response = json.loads(post_image.data.decode())    # binary object to json
        image_id = post_image_response['image_id']
        image = db.session.query(Image).get(image_id)
        # Post article with initial image ID and alt
        post_initial_article = self.client.post('/create-article', 
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'article_image_id': image.id,
                'article_image_alt': 'Initial image description'},
            follow_redirects=True)
        articles_display = post_initial_article.get_data(as_text=True)
        assert image.src in articles_display
        article = db.session.query(Article).filter_by(title='Title').one()
        # Get article with initial image and alt
        get_initial_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id})
        initial_article_html = get_initial_article.get_data(as_text=True)
        assert image.src in initial_article_html
        assert 'Initial image description' in initial_article_html
        # Post updated image 
        updated_image_file = r'app\static\images\test_images\updated_image.jpg'
        post_updated_image = self.client.post('/add-image', 
            data={
                'article_image': (open(updated_image_file, 'rb'), updated_image_file)})
        post_updated_image_response = json.loads(post_updated_image.data.decode())
        updated_image_id = post_updated_image_response['image_id']
        updated_image = db.session.query(Image).get(updated_image_id)
        # Post article with updated image ID and alt
        post_updated_article = self.client.post('/edit-article',
            query_string={
                'article-id': article.id},
            data={
                'article_title': 'Title',
                'article_desc': 'Description',
                'article_image_id': updated_image.id,
                'article_image_alt': 'Updated image description'},
            follow_redirects=True)
        updated_articles_display = post_updated_article.get_data(as_text=True)
        assert updated_image.src in updated_articles_display
        # Get article with updated image ID and alt
        get_updated_article = self.client.get('/edit-article',
            query_string={
                'article-id': article.id})
        updated_article_html = get_updated_article.get_data(as_text=True)
        assert updated_image.src in updated_article_html
        assert 'Updated image description' in updated_article_html


class ParagraphModelCase(unittest.TestCase):    
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
        # Get article with category data
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
