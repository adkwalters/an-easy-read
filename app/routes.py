from flask import render_template, flash, redirect
from flask.helpers import url_for
from flask_login import current_user, login_user, logout_user
from app import app
from app.forms import LoginForm 
from app.models import User


@app.route('/')
@app.route('/index')
def index():

    # TEST mock user
    test_user = {'username': 'Andrew'}
    # test_user = None
    
    # Render index page
    return render_template('easy-read-index.html', test_user=test_user)


@app.route('/login', methods=['GET', 'POST'])
def login():
    
    # Redirect user if logged in
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    # Get user login data from login form
    form = LoginForm()

    # If user submits valid login data 
    if form.validate_on_submit():  
        
        # Get user's username
        user = User.query.filter_by(username=form.username.data).first()

        # If user does not exist or password is incorrect
        if user is None or not user.check_password(form.password.data):

            # Alert user
            flash('The email or password is incorrect. Please try again.', 'error')
            
            # Refresh login page
            return redirect(url_for('login'))

        # Login user in with 'remember me' preference
        login_user(user, remember=form.remember_me.data)

        # Redirect user to index page
        return redirect(url_for('index'))

    # Render login page
    return render_template('easy-read-login.html', form=form)



@app.route('/logout')
def logout():

    # Log user out
    logout_user()

    # Render index page
    return redirect(url_for('index'))

