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
        article_date_published = request.form.get("article-form-date-published")
        article_date_updated = request.form.get("article-form-date-updated")
        source_website = request.form.get("article-form-source-website")
        source_author = request.form.get("article-form-source-author")
        source_title = request.form.get("article-form-source-title")
        source_hyperlink = request.form.get("article-form-source-hyperlink")

        # Insert article content into database
        article_insert = cursor.execute("INSERT INTO article (article_title, article_description, date_published, date_updated) VALUES (?, ?, ?, ?)", 
            (article_title, article_description, article_date_published, article_date_updated))

        # Get article ID primary key to use as a foreign key in other tables
        article_id = article_insert.lastrowid
       
        # Insert source content into database
        cursor.execute("INSERT INTO source (article_id, website, source_author, source_title, hyperlink) VALUES (?, ?, ?, ?, ?)", 
            (article_id, source_website, source_author, source_title, source_hyperlink))
        
        # Get paragraph content into database
        for key in request.form.keys():
            if "paragraph" in key:

                # Get paragraph number from name, eg "paragraph-2-level-1"
                #    - filter all but the last number
                paragraph_id = "".join(filter(str.isdigit, key[:-1]))            

                # Insert summary content into database
                cursor.execute("INSERT INTO summary (article_id, paragraph, level, name, content) VALUES (?, ?, ?, ?, ?)",
                    (article_id, paragraph_id, key[-1], key, request.form[key]))


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

