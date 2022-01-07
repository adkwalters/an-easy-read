from flask import render_template, flash, redirect, url_for, request
from flask_login import current_user, login_user, logout_user
from werkzeug.urls import url_parse

from app import db
from app.auth import bp
from app.auth.forms import LoginForm, RegisterForm 
from app.models import User


@bp.route('/register', methods=['GET', 'POST'])
def register():

    # If user is already logged in, redirect to index
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    # Get user data 
    form = RegisterForm()
    
    # If user data is valid 
    if form.validate_on_submit():

        # Instantiate user and set password
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        
        # Add user to database and commit
        db.session.add(user)
        db.session.commit()

        # Log user in
        login_user(user)

        # Alert user 
        flash('You are successfully registered.', 'success')

        # Redirect user to index page
        return redirect(url_for('main.index'))

    # Render user registration page
    return render_template('/auth/register.html', form=form)


@bp.route('/login', methods=['GET', 'POST'])
def login():
    
    # If user is already logged in, redirect to index
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    # Get user data
    form = LoginForm()

    # If user data is valid 
    if form.validate_on_submit():  
        
        # Get user's username
        user = User.query.filter_by(username=form.username.data).first()

        # If user does not exist or password is incorrect
        if user is None or not user.check_password(form.password.data):

            # Alert user
            flash('The email or password is incorrect. Please try again.', 'error')
            
            # Refresh login page
            return redirect(url_for('auth.login'))

        # Login user in with 'remember me' preference
        login_user(user, remember=form.remember_me.data)

        # Get user's target page from URL parameters
        target_page = request.args.get('next')

        # If no query string exists
        # or if a network location is parsed (== not relative)
        if not target_page or url_parse(target_page).netloc != '':

            # Reassign author's articles page as index
            target_page = url_for('main.display_author_articles')

        # Redirect user to target page
        return redirect(target_page)

    # Render login page
    return render_template('/auth/login.html', form=form)


@bp.route('/logout')
def logout():

    # Log user out
    logout_user()

    flash('You have logged out successfully.', 'success')

    # Render index page
    return redirect(url_for('main.index'))
