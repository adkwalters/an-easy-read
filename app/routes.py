from flask import render_template, flash, redirect
from flask.helpers import url_for
from app import app
from app.forms import LoginForm 


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
    
    # Get login form
    form = LoginForm()

    # TEST mock value (for article-edit mode)
    test_value = "This is a test value"
    
    # If form is posted and validated
    if form.validate_on_submit():    

        # TEST flashed messages and form submission
        flash('Login request: {}, remember_me: {}'.format(
            form.username.data, form.remember_me.data))

        # Redirect user to index page
        return redirect(url_for('index'))

    # Render login page
    return render_template('easy-read-login.html', form=form, test_value=test_value)