from flask import render_template, flash, redirect, url_for, request, current_app
from flask_login import current_user, login_user, logout_user
from flask_mail import Message
from werkzeug.urls import url_parse

from app import db, mail
from app.auth import bp
from app.auth.forms import LoginForm, RegisterForm, RequestPasswordResetForm, PasswordResetForm
from app.models import User


@bp.route('/register', methods=['GET', 'POST'])
def register():
    """Register a new user and send email address confirmation"""

    # Return logged in users to index
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    # Get user form 
    form = RegisterForm()
    
    if form.validate_on_submit():

        # Create User object and set password
        user = User(
            username = form.username.data, 
            email = form.email.data)
        user.set_password(form.password.data)
        
        # Add user to database and commit
        db.session.add(user)
        db.session.commit()

        # Log user in
        login_user(user)

        # Send email confirmation with user token
        msg = Message(
            subject = 'Confirm your Email Address',
            sender = current_app.config['ADMIN'][0], 
            recipients = [user.email],
            html = render_template('/email/email-request-to-confirm-email.html',
                user=user,
                token=user.send_token()))
        mail.send(msg)

        # Alert user 
        flash('You are successfully registered. Please confirm your email address.', 'success')

        # Redirect user to index page
        return redirect(url_for('main.index'))

    # Render user registration page
    return render_template('/auth/register.html', form=form)


@bp.route('/resend-email-confirmation', methods=['GET', 'POST'])
def resent_email_confirmation():
    """Email the user a token to confirm their email address"""

    # Send email confirmation with user token
    msg = Message(
        subject = 'Confirm your Email Address',
        sender = current_app.config['ADMIN'][0], 
        recipients = [current_user.email],
        html = render_template('/email/email-request-to-confirm-email.html',
            user=current_user,
            token=current_user.send_token()))
    mail.send(msg)

    # Alert user 
    flash('Confirmation email resent. Please check your spam folder.', 'success')

    # Redirect user to index page
    return redirect(url_for('publish.display_author_articles'))


@bp.route('/confirm-email/<token>', methods=['GET', 'POST'])
def confirm_email(token):
    """Confirm the user's email address from their requested token"""

    # Return logged in users to index
    if current_user.is_authenticated and current_user.email_confirmed:
        flash('This address has already been confirmed.', 'info')
        return redirect(url_for('main.index'))

    # Verify user's JSON Web Token
    user = User.check_token(token)
    
    # Alert and redirect false tokens
    if not user:
        flash('Something went wrong.', 'error')
        return redirect(url_for('main.index'))
    
    # Confirm user's email address
    user.email_confirmed = True

    # Record, alert, and redirect
    db.session.commit()
    flash('You are fully registered. You may now make publication requests.', 'success')
    return redirect(url_for('main.index'))
    

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """Log user in and redirect to their target page"""
    
    # Return logged in users to index
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    # Get user form
    form = LoginForm()

    if form.validate_on_submit():  
        
        # Get user
        user = db.session.query(User) \
            .filter_by(username = form.username.data).first()
        
        # Alert and redirect false credentials
        if user is None or not user.check_password(form.password.data):
            flash('The email or password is incorrect. Please try again.', 'error')
            return redirect(url_for('auth.login'))

        # Login user in 
        login_user(user)

        # Get user's target page
        target_page = request.args.get('next')

        # If user has no target page or a network location is parsed (== not relative)
        if not target_page or url_parse(target_page).netloc != '':

            # Reassign author's articles page as index
            target_page = url_for('publish.display_author_articles')

        # Redirect user to target page
        return redirect(target_page)

    # Render login page
    return render_template('/auth/login.html', form=form)


@bp.route('/logout')
def logout():
    """Log user out"""

    # Log user out and alert
    logout_user()

    # Alert and redirect
    flash('You have logged out successfully.', 'success')
    return redirect(url_for('main.index'))


@bp.route('/request-password-reset', methods=['GET', 'POST'])
def request_password_reset():
    """Email the user a token to reset their password"""
    
    # Return logged in users to index
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    # Get user form
    form = RequestPasswordResetForm()

    if form.validate_on_submit(): 

        # Get user
        user = db.session.query(User) \
            .filter_by(email = form.email.data).first()
        
        if not user:
            flash('Please check the details you entered.', 'error')
            return redirect(url_for('auth.request_password_reset'))

            
        # Send email with user token
        msg = Message(
            subject = 'Reset your password',
            sender = current_app.config['ADMIN'][0], 
            recipients = [user.email],
            html = render_template('/email/email-request-to-reset-password.html',
                user=user,
                token=user.send_token()))
        mail.send(msg)
        
        # Alert and redirect user
        flash('Check your email for instructions to reset your password.', 'info')
        return redirect(url_for('auth.login'))

    # Render form to collect user's email address
    return render_template('/auth/request-password-reset.html', form=form)


@bp.route('/reset-password/<token>', methods=['GET', 'POST'])
def reset_password(token):
    """Reset the user's password
    
    Check the user's token to verify their identity.
    Hash and save the user's new password.
    """

    # Return logged in users to index
    if current_user.is_authenticated:
        flash('You are already logged in.', 'info')
        return redirect(url_for('main.index'))

    # Decode the user's token to get User object
    user = User.check_token(token)

    # Alert and redirect false tokens
    if not user:
        flash('Something went wrong.', 'error')
        return redirect(url_for('main.index'))

    # Get user form
    form = PasswordResetForm()

    if form.validate_on_submit():

        # Hash and record new password
        user.set_password(form.password.data)
        db.session.commit()

        # Alert and return user
        flash('Your password has been successfully reset.', 'success')
        return redirect(url_for('auth.login'))

    # Render form to collect user's new credentials
    return render_template('/auth/reset-password.html', form=form)