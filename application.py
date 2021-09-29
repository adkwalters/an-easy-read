# $env:FLASK_APP = "application.py"
# set FLASK_APP=application.py

# Import libraries
import os
import sqlite3
import imghdr # for file validation
from flask import Flask, redirect, render_template, request, make_response, abort, session, flash
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
from flask.json import jsonify
from tempfile import mkdtemp
from flask_session import Session
from functools import wraps


# Configure application
app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True  # Ensure templates are auto-reloaded
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024  # Set maximum file upload size to 1mb
app.config['UPLOAD_PATH'] = 'static\images' # Set file upload folder
app.config['UPLOAD_EXTENSIONS'] = {'.jpg', '.png', '.gif'} # Set permitted file types

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = mkdtemp()
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Connect SQLite database
connection = sqlite3.connect("easy_read.db", check_same_thread=False) # Allow returned connection to be shared between multiple threads
connection.row_factory = sqlite3.Row # Allow row access by column name
cursor = connection.cursor()


# Image validation 
#   https://blog.miguelgrinberg.com/post/handling-file-uploads-with-flask
def validate_image(stream):
    header = stream.read(512)
    stream.seek(0) 
    format = imghdr.what(None, header)
    if not format:
        return None
    return '.' + (format if format != 'jpeg' else 'jpg')


# Decorate routes to require login
#   https://flask.palletsprojects.com/en/2.0.x/patterns/viewdecorators/
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


# Register user
@app.route("/register", methods=["GET", "POST"])
def register():

    # If user requests to register account
    if request.method == "POST":

        # Get new user details
        email = request.form.get("register-email")
        password = request.form.get("register-password")
        confirmation = request.form.get("register-password-confirmation")

        # If passwords match 
        if confirmation != password:
            flash("The passwords do not match. Please try again.", "error")

        else:    
            # Confirm user does not already exist
            existing_user = cursor.execute("SELECT 1 from author WHERE email = ?", 
                (email,)).fetchone()
        
            if existing_user:

                # Alert user
                flash('The email address entered already exists. Did you want to <a href="/login"><strong>log in</strong></a>?', 'error')

            else:
                # Insert author
                cursor.execute("INSERT INTO author (email, password) VALUES (?, ?)", 
                    (email, generate_password_hash(password)))

                # Save user to session
                session["user"] = email

                # Commit database connection        
                connection.commit()

                # Notify user
                flash(f"You have successfully registered. Welcome, {email}", "success")

                # Redirect to homepage
                return redirect("/")     

    # Else, render user registration page
    return render_template("easy-read-register.html")
    

# Log user in
@app.route("/login", methods=["GET", "POST"])
def login():

    # Start new session
    session.clear()

    # If user requests to log in
    if request.method == "POST":

        # Get login details
        email = request.form.get("login-email")
        password = request.form.get("login-password")

        # Query database for user
        user = cursor.execute("SELECT password from author WHERE email = ?", 
            (email,)).fetchone()
        
        if user:
            
            # Check password hash
            password_matches = check_password_hash(user['password'], password)

            if password_matches:
            
                # Save user to session
                session["user"] = email
                
                # Notify user
                flash(f"You are successfully logged in. Welcome, {email}", "success")

                # Redirect to homepage
                return redirect("/")
            
        # Else throw error
        flash("The email or password is incorrect. Please try again.", "error")

    # Else, render user login page
    return render_template("easy-read-login.html")


# Log user out
@app.route("/logout")
def logout():

    # Clear session
    session.clear()
    
    # Notify user
    flash("You are successfully logged out.", "success")

    # Redirect to index page
    return redirect("/")


# Index page
@app.route("/")
def index():
    
    # !! TODO

    return render_template("easy-read-index.html")


@app.route("/add-image", methods=["POST"])
def add_image():
    
    # Get user uploaded file
    uploaded_image = request.files['file']

    # If file exists
    if uploaded_image.filename != '':

        # Sanitise filename
        filename = secure_filename(uploaded_image.filename)
        
        # Get file extension
        file_ext = os.path.splitext(filename)[1]   

        # If file type is not accepted or file extension is not valid
        if file_ext not in app.config['UPLOAD_EXTENSIONS'] or file_ext != validate_image(uploaded_image.stream):
            
            # Abort operation
            abort(400)

        # Save image to file
        uploaded_image_path = os.path.join(app.config['UPLOAD_PATH'], filename)
        uploaded_image.save(uploaded_image_path)

        # Insert file path
        image_insert = cursor.execute("INSERT INTO image (src) VALUES (?)", 
                    (uploaded_image_path,))

        # Get image ID
        image_id = image_insert.lastrowid

        # Commit database connection    
        connection.commit()

        # Attach image ID to response
        image_response = make_response(jsonify({"message": "OK", "image_id": image_id}), 200)

        # Send image ID to client
        return image_response


@app.route("/create-article", methods=["GET", "POST"])
@login_required
def create_article():

    # If user requests to create article
    if request.method == "POST":

        # Get source data and article metadata
        article_title = request.form.get("article-form-title").strip()
        article_description = request.form.get("article-form-description").strip()
        source_name = request.form.get("article-form-source-name").strip()
        source_author = request.form.get("article-form-source-author").strip()
        source_title = request.form.get("article-form-source-title").strip()
        source_contact = request.form.get("article-form-source-contact").strip()
        source_hyperlink = request.form.get("article-form-source-hyperlink").strip()
        categories = request.form.getlist("article-form-categories-selected")


        # !! For testing request form:
        for key in request.form.keys():
            print(key, ":", request.form[key])
    

        # Insert article metadata
        article_insert = cursor.execute("INSERT INTO article (title, description, published) VALUES (?, ?, datetime('now'))", 
            (article_title, article_description))

        # Get article ID
        article_id = article_insert.lastrowid

        # Join author to article via intermediary table
        cursor.execute("INSERT INTO article_author (article_id, author_email) VALUES (?, ?)", 
            (article_id, session["user"]))

        # Insert source data
        cursor.execute("INSERT INTO source (article_id, name, author, title, contact, hyperlink) VALUES (?, ?, ?, ?, ?, ?)",
            (article_id, source_name, source_author, source_title, source_contact, source_hyperlink))     

        # Insert category data
        for category in categories:

            # Query database for category ID
            category_id = cursor.execute("SELECT * FROM category WHERE category = (?)", 
                (category,)).fetchone()

            if category_id: 

                # Join category to article via intermediary table
                cursor.execute("INSERT INTO article_category (article_id, category_id) VALUES (?, ?)", 
                    (article_id, category_id['id']))
                
            else:
                
                # Insert new category
                cursor.execute("INSERT INTO category (category) VALUES (?)", 
                    (category,))

                # Get category ID
                category_id = cursor.lastrowid

                # Join category to article via intermediary table
                cursor.execute("INSERT INTO article_category (article_id, category_id) VALUES (?, ?)", 
                    (article_id, category_id))   

        # Insert summary content
        for key in request.form.keys():

            if "article-image" in key:

                if "image-id" in key:

                    # Get image ID
                    image_id = request.form[key]

                    # Update article with image ID 
                    cursor.execute("UPDATE article SET image_id = ? WHERE id = ?",
                        (image_id, article_id))

                if "image-alt" in key: 

                    # Get image alt
                    image_alt = request.form[key].strip()

                    # Update image with alt
                    cursor.execute("UPDATE image SET alt = ? WHERE id = ?", 
                        (image_alt, image_id))
            
            if "paragraph" in key:

                # Get paragraph ID from key (eg. "paragraph-2-level-1")
                paragraph_id = "".join(filter(str.isdigit, key[:-1])) 

                if paragraph_id in key:

                    # Insert placeholder for paragraph 
                    cursor.execute("INSERT INTO article_paragraph (article_id, paragraph_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                        (article_id, paragraph_id))

                if "image-id" in key:

                    # Get image ID
                    image_id = request.form[key]

                    # Update placeholder with image ID 
                    cursor.execute("UPDATE article_paragraph SET image_id = ? WHERE article_id = ? AND paragraph_id = ?",
                        (image_id, article_id, paragraph_id))

                if "image-alt" in key: 

                    # Get image alt
                    image_alt = request.form[key].strip()

                    # Update placeholder with image alt
                    cursor.execute("UPDATE image SET alt = ? WHERE id = ?", 
                        (image_alt, image_id))
                            
                if "header" in key:

                    # Get header content
                    header = request.form[key].strip()

                    # Update placeholder with header
                    cursor.execute("UPDATE article_paragraph SET header = ? WHERE article_id = ? AND paragraph_id = ?",
                        (header, article_id, paragraph_id))                
         
            if "level" in key:   

                # Get level ID from key (eg. "paragraph-2-level-1")
                level_id = key[-1]

                # Get summary content
                content = request.form[key].strip()

                # Insert summary
                cursor.execute("INSERT INTO level (article_id, paragraph_id, level, content) VALUES (?, ?, ?, ?)",
                    (article_id, paragraph_id, level_id, content))

        # Commit database connection      
        connection.commit()

        # Redirect to homepage
        return redirect("/")
    
    # User requests to create new article or edit existing article
    else:

        # Get artice UD from URL parameters
        article_id = request.args.get("article_id")
        
        # Query database for article data 
        article = cursor.execute("SELECT * FROM article WHERE id = (?)", 
            (article_id,)).fetchone()

        source = cursor.execute("SELECT * FROM source WHERE article_id = (?)", 
            (article_id,)).fetchone()

        article_image = cursor.execute("SELECT * FROM image JOIN article ON image.id = article.image_id WHERE article.id = (?)", 
            (article_id,)).fetchone()

        categories = cursor.execute("SELECT * FROM category JOIN article_category ON category.id = article_category.category_id WHERE article_id = (?)", 
            (article_id,)).fetchall()

        paragraph_images = cursor.execute("SELECT * FROM image JOIN article_paragraph ON image.id = article_paragraph.image_id WHERE article_id = (?)", 
            (article_id,)).fetchall()

        paragraphs = cursor.execute("SELECT * FROM article_paragraph WHERE article_id = (?)", 
            (article_id,)).fetchall()

        levels = cursor.execute("SELECT * FROM level WHERE article_id = (?)", 
            (article_id,)).fetchall()

        # Render new article form or render existing article if it exists  
        return render_template("easy-read-create-article.html", article=article, source=source, article_image=article_image, categories=categories, paragraph_images=paragraph_images, paragraphs=paragraphs, levels=levels)


@app.route("/author-articles", methods=["GET", "POST"])
@login_required
def author_articles():

    # Author requests ??
    if request.method == "POST":

        return
    
    # Author requests to view thier articles
    else:

        # Query database for author's articles
        articles = cursor.execute("SELECT * FROM article JOIN article_author ON article.id = article_author.article_id WHERE author_email = (?)", 
            (session["user"],))

        return render_template("easy-read-author-articles.html", articles=articles)


@app.route("/article")
def show_article():

    # !! TODO

    return render_template("easy-read-article-para-social-relationships.html")

