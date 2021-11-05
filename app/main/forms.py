from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import IntegerField, StringField, SubmitField, FieldList, HiddenField, FormField, TextAreaField, Form
from wtforms.validators import DataRequired


class SummaryForm(Form):
    level = HiddenField('Level')
    text = TextAreaField('Summary') 


class ParagraphForm(Form):
    paragraph_index = HiddenField('Paragraph ID')
    paragraph_header = TextAreaField('Paragraph Header') 
    paragraph_image_id = HiddenField('Paragraph Image ID')
    paragraph_image_alt = StringField('Paragraph Image Description')
    summary = FieldList(FormField(SummaryForm))


class ArticleForm(FlaskForm):
    
    article_id = IntegerField('Id')
    article_title = StringField('Title', validators=[DataRequired()])
    article_desc = StringField('Description', validators=[DataRequired()])

    article_category = FieldList(StringField('Article Category'))
    
    source_title = StringField('Source Title')
    source_author = StringField('Source Author')
    source_link = StringField('Source Link')
    source_name = StringField('Source Name')
    source_contact = StringField('Source Contact Details')

    article_image_id = IntegerField('Article Image ID')
    # ?? How to make image alt required ONLY when image ID exists
    article_image_alt = StringField('Article Image Description') 

    paragraph = FieldList(FormField(ParagraphForm))

    submit = SubmitField('Save Article')
    

class ImageForm(FlaskForm):
    upload_image = FileField('Article Image', validators=[
        FileAllowed(['jpg', 'png', 'gif'], 'Please select an image.')
    ])

