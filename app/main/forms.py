from flask_wtf import FlaskForm
from wtforms import IntegerField, StringField, SubmitField
from wtforms.validators import DataRequired

from app.models import Article


class ArticleForm(FlaskForm):
    
    article_id = IntegerField('Id')
    article_title = StringField('Title', validators=[DataRequired()])
    article_desc = StringField('Description', validators=[DataRequired()])
    
    source_title = StringField('Article Title')
    source_author = StringField('Article Author')
    source_link = StringField('Article Link')
    source_name = StringField('Source Name')
    source_contact = StringField('Source Contact Details')

    submit = SubmitField('Save Article')
    