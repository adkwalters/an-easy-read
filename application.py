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
    return "hello, world"


@app.route("/create-article", methods=["GET", "POST"])
def createArticle():

    # cursor.execute()

    # Write data to db from form

    return render_template("easy-read-create-article.html")

@app.route("/article")
def showArticle():

    # cursor.execute()

    # Read data from db to article

    return render_template("easy-read-article-para-social-relationships.html")

