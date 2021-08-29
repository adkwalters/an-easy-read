# $env:FLASK_APP = "application.py"
# set FLASK_APP=application.py

# Import libraries
import os
import sqlite3
import imghdr # for file validation
from flask import Flask, redirect, render_template, request, make_response, abort
from werkzeug.utils import secure_filename
from flask.json import jsonify


# Set image constants
UPLOAD_IMAGE_FOLDER = os.path.abspath('static/images')
ALLOWED_FILE_EXTENSIONS = {'.jpg', '.png', '.gif'}


# Configure application
app = Flask(__name__)
app.config["TEMPLATES_AUTO_RELOAD"] = True  # Ensure templates are auto-reloaded
app.config['MAX_CONTENT_LENGTH'] = 1024 * 1024  # Set maximum file upload size to 1mb
app.config['UPLOAD_PATH'] = UPLOAD_IMAGE_FOLDER
app.config['UPLOAD_EXTENSIONS'] = ALLOWED_FILE_EXTENSIONS


# Image validation 
# thanks to Miguel Grinberg @ https://blog.miguelgrinberg.com/post/handling-file-uploads-with-flask
def validate_image(stream):
    header = stream.read(512)
    stream.seek(0) 
    format = imghdr.what(None, header)
    if not format:
        return None
    return '.' + (format if format != 'jpeg' else 'jpg')


# Connect SQLite database
connection = sqlite3.connect("easy_read.db", check_same_thread=False) # allows returned connection to be shared between multiple threads
cursor = connection.cursor()

# Test index page
@app.route("/")
def index():

    return render_template("easy-read-index.html")

@app.route("/add-image", methods=["POST"])
def add_image():
    
    # Get the user uploaded file
    uploaded_image = request.files['file']

    # If a file is uploaded...
    if uploaded_image.filename != '':

        #...sanitise its filename
        filename = secure_filename(uploaded_image.filename)
        
        #...get its file extension
        file_ext = os.path.splitext(filename)[1]   

        # If the file extension is not an accepted format or does not match...
        if file_ext not in app.config['UPLOAD_EXTENSIONS'] or file_ext != validate_image(uploaded_image.stream):
            print('invalid or incorrect file extension')
            abort(400)

        # Save image to file
        uploaded_image_path = os.path.join(app.config['UPLOAD_PATH'], filename)
        uploaded_image.save(uploaded_image_path)

        # Insert file path into database
        image_insert = cursor.execute("INSERT INTO image (src) VALUES (?)", 
                    (uploaded_image_path,))

        # BUG? The previous insert does not show in the database before the main form is posted
        #       If an image is deleted and reuploaded, it will be duplicate in the database after main form is posted


        # Get image ID to use as a foreign key in other tables
        image_id = image_insert.lastrowid

        # Send image ID to client
        image_response = make_response(jsonify({"message": "OK", "image_id": image_id}), 200)
        return image_response

@app.route("/create-article", methods=["GET", "POST"])
def create_article():

    if request.method == "POST":

        # Get static form content
        article_title = request.form.get("article-form-title").strip()
        article_description = request.form.get("article-form-description").strip()
        # article_updated = request.form.get("article-form-date-updated")
        source_name = request.form.get("article-form-source-name").strip()
        source_author = request.form.get("article-form-source-author").strip()
        source_title = request.form.get("article-form-source-title").strip()
        source_contact = request.form.get("article-form-source-contact").strip()
        source_hyperlink = request.form.get("article-form-source-hyperlink").strip()
        categories = request.form.getlist("article-form-categories-selected")
        # categories = request.get_json() # Required for alternative approach using fetch


        # # For testing request form:
        # for key in request.form.keys():
        #     print(key, ":", request.form[key])
    

        # Insert article metadata into database
        article_insert = cursor.execute("INSERT INTO article (title, description, published) VALUES (?, ?, datetime('now'))", 
            (article_title, article_description))

        # Get article ID primary key to use as a foreign key in other tables
        article_id = article_insert.lastrowid

        # Insert source metadata into database
        cursor.execute("INSERT INTO source (article_id, name, author, title, contact, hyperlink) VALUES (?, ?, ?, ?, ?, ?)",
            (article_id, source_name, source_author, source_title, source_contact, source_hyperlink ))        

        # Insert summary content into database
        for key in request.form.keys():
            
            # Get natural keys from html form name, eg: "paragraph-2-level-1"
            paragraph_id = "".join(filter(str.isdigit, key[:-1])) 

            # For each paragraph, insert a blank (no image or header) entry into database
            if paragraph_id and paragraph_id in key:
                cursor.execute("INSERT INTO article_paragraph (article_id, paragraph_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
                    (article_id, paragraph_id))

            if "image-id" in key:
                image_id = request.form[key]

                # Update image data for paragraph
                cursor.execute("UPDATE article_paragraph SET image_id = ? WHERE article_id = ? AND paragraph_id = ?",
                    (image_id, article_id, paragraph_id))

            if "alt" in key: 
                image_alt = request.form[key].strip()

                # Update image data for paragraph
                cursor.execute("UPDATE image SET alt = ? WHERE id = ?", (image_alt, image_id))
                        
            if "header" in key:
                header = request.form[key].strip()

                # Update header content for paragraph
                cursor.execute("UPDATE article_paragraph SET header = ? WHERE article_id = ? AND paragraph_id = ?",
                    (header, article_id, paragraph_id))                

            if "level" in key:          
                level_id = key[-1]
                content = request.form[key].strip()

                # Insert summary content into database
                cursor.execute("INSERT INTO level (article_id, paragraph_id, level, content) VALUES (?, ?, ?, ?)",
                    (article_id, paragraph_id, level_id, content))
 
        # Insert category data into databse
        for category in categories:

            # Check whether category exists
            cursor.execute("SELECT 1 FROM category WHERE category = (?)", 
                (category,))
            
            category_id = cursor.fetchone() # Cannot use .lastrowid as it always returns true
          
            if category_id is None: 

                # ...insert category into database
                cursor.execute("INSERT INTO category (category) VALUES (?)", 
                    (category,))

                # ...get its ID
                category_id = cursor.lastrowid

                # ...and insert it with article ID into database
                cursor.execute("INSERT INTO article_category (article_id, category_id) VALUES (?, ?)", 
                    (article_id, category_id))
            else:
                
                # ...and insert it with article ID into database
                cursor.execute("INSERT INTO article_category (article_id, category_id) VALUES (?, ?)", 
                    (article_id, category_id[0])) # indexing to get int within tuple


        connection.commit()
        # connection.close() Not needed?

        return redirect("/")
    
    else:
        return render_template("easy-read-create-article.html")


@app.route("/article")
def show_article():

    # cursor.execute()

    # Read data from db to article

    return render_template("easy-read-article-para-social-relationships.html")

