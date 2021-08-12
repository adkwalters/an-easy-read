# Import libraries
from flask import Flask, redirect, render_template, request
import sqlite3

# Configure application
app = Flask(__name__)

# Ensure templates are auto-reloaded
app.config["TEMPLATES_AUTO_RELOAD"] = True

# Connect SQLite database
connection = sqlite3.connect("easyRead.db")
cursor = connection.cursor()

# Test index page
@app.route("/")
def index():

    return render_template("easy-read-index.html")


@app.route("/create-article", methods=["GET", "POST"])
def createArticle():

    if request.method == "POST":
        
        source_website = request.form.get("source-website")
        source_author = request.form.get("source-author")
        source_title = request.form.get("source-title")
        source_hyperlink = request.form.get("source-hyperlink")
        article_title = request.form.get("article-title")
        article_date_published = request.form.get("article-date-pblished")
        article_date_updated = request.form.get("article-date-updated")
        article_categories = request.form.getlist("article-categories")
        article_summaries = request.form.getlist("article-summaries[]") 

        print(article_summaries)
        print(request.form.has_key(article_summaries))
        f = request.form
        for key in f.keys():
            for value in f.getlist(key):
                print(key,":",value)

        # cursor.execute()
        # Write data to db from form
        
        return redirect("/")
    
    else:
        return render_template("easy-read-create-article.html")


@app.route("/article")
def showArticle():

    # cursor.execute()

    # Read data from db to article

    return render_template("easy-read-article-para-social-relationships.html")

