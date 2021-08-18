# $env:FLASK_APP = "application.py"
# set FLASK_APP=application.py

# Import libraries
from flask import Flask, redirect, render_template, request
import sqlite3

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Connect SQLite database
connection = sqlite3.connect("easy_read.db", check_same_thread=False) # allows returned connection to be shared between multiple threads
cursor = connection.cursor()

# Test index page
@app.route("/")
def index():

    return render_template("easy-read-index.html")


@app.route("/create-article", methods=["GET", "POST"])
def createArticle():

    if request.method == "POST":

        # Get static form content
        article_title = request.form.get("article-form-title")
        article_description = request.form.get("article-form-description")
        # article_updated = request.form.get("article-form-date-updated")
        source_name = request.form.get("article-form-source-name")
        source_author = request.form.get("article-form-source-author")
        source_title = request.form.get("article-form-source-title")
        source_contact = request.form.get("article-form-source-contact")
        source_hyperlink = request.form.get("article-form-source-hyperlink")
        categories = request.form.getlist("article-form-categories-selected")
        # categories = request.get_json() # Required for alternative approach using fetch


        # For testing request form:

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

        # Get paragraph content into database
        for key in request.form.keys():
            if "paragraph" in key:

                # Get paragraph number from name, eg "paragraph-2-level-1"
                #    - filter all but the last number
                paragraph_id = "".join(filter(str.isdigit, key[:-1]))            

                # Insert summary content into database
                cursor.execute("INSERT INTO summary (article_id, paragraph, level, name, content) VALUES (?, ?, ?, ?, ?)",
                    (article_id, paragraph_id, key[-1], key, request.form[key]))

        # Insert category data into databse
        for category in categories:

            # Check whether category exists
            cursor.execute("SELECT 1 FROM category WHERE category = (?)", 
                (category,))
            
            category_id = cursor.fetchone() # Cannot use .lastrowid as it is always truthy
          
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
def showArticle():

    # cursor.execute()

    # Read data from db to article

    return render_template("easy-read-article-para-social-relationships.html")

