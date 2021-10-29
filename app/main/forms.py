from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import IntegerField, StringField, SubmitField, FieldList
from wtforms.validators import DataRequired

from app.models import Article


class ArticleForm(FlaskForm):
    
    article_id = IntegerField('Id')
    article_title = StringField('Title', validators=[DataRequired()])
    article_desc = StringField('Description', validators=[DataRequired()])

    article_category = FieldList(StringField('Article Category'))
    
    source_title = StringField('Article Title')
    source_author = StringField('Article Author')
    source_link = StringField('Article Link')
    source_name = StringField('Source Name')
    source_contact = StringField('Source Contact Details')

    article_image_id = IntegerField('Article Image ID')
    # ?? How to make image alt required ONLY when image ID exists
    article_image_alt = StringField('Article Image Description') 

    submit = SubmitField('Save Article')
    

class ImageForm(FlaskForm):
    article_image = FileField('Article Image', validators=[
        FileAllowed(['jpg', 'png', 'gif'], 'Please select an image.')
    ])

