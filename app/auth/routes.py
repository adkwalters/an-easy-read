from flask import render_template, flash, redirect, url_for, request
from flask_login import current_user, login_user, logout_user, login_required
from werkzeug.urls import url_parse
from app.auth.forms import LoginForm 
from app.models import User
from app.auth import bp


@bp.route('/login', methods=['GET', 'POST'])
def login():
    
    # Redirect user if logged in
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

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
            return redirect(url_for('auth.login'))

        # Login user in with 'remember me' preference
        login_user(user, remember=form.remember_me.data)

        # Get user's target page from URL parameters
        target_page = request.args.get('next')

        # If no query string exists
        # or if a network location is parsed (== not relative)
        if not target_page or url_parse(target_page).netloc != '':

            # Reassign target page as index
            target_page = url_for('main.index')

        # Redirect user to target page
        return redirect(target_page)

    # Render login page
    return render_template('easy-read-login.html', form=form)


@bp.route('/logout')
def logout():

    # Log user out
    logout_user()

    flash('You have logged out successfully.', 'success')

    # Render index page
    return redirect(url_for('main.index'))

