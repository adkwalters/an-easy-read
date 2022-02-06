from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import IntegerField, StringField, SubmitField, FieldList, HiddenField, FormField, TextAreaField, Form
from wtforms.validators import DataRequired, Email


class SummaryForm(Form):
    """A field enclosure of summary text to be added to a paragraph
    
    Summaries are nested within paragraphs nested within an article.
    """
    level   = HiddenField('Level')
    text    = TextAreaField('Summary') 


class ParagraphForm(Form):
    """A field enclosure of paragraph content to be added to an article
    
    Paragraphs are nested within an article.
    """
    paragraph_index     = HiddenField('Paragraph ID')
    paragraph_header    = TextAreaField('Paragraph Header') 
    paragraph_image_id  = HiddenField('Paragraph Image ID')
    paragraph_image_alt = StringField('Paragraph Image Description')
    paragraph_image_cite= StringField('Paragraph Image Credit')
    summary             = FieldList(FormField(SummaryForm))


class ArticleForm(FlaskForm):
    """A form to collect and validate an article's content"""
    article_id          = IntegerField('Id')
    article_title       = StringField('Title', validators=[DataRequired()])
    article_desc        = StringField('Description', validators=[DataRequired()])
    article_category    = FieldList(StringField('Article Category'))
    source_title        = StringField('Source Title')
    source_author       = StringField('Source Author')
    source_link         = StringField('Source Link')
    source_name         = StringField('Source Name')
    source_contact      = StringField('Source Contact Details')
    article_image_id    = IntegerField('Article Image ID')
    article_image_alt   = StringField('Article Image Description')
    article_image_cite  = StringField('Article Image Credit')
    paragraph           = FieldList(FormField(ParagraphForm))
    submit              = SubmitField('Save Article')
    

class ImageForm(FlaskForm):
    """A form to collect and validate an article image"""
    upload_image        = FileField('Article Image', validators=[FileAllowed(['jpg', 'png', 'gif'], 'Please select an image.')])


class EmailForm(FlaskForm):
    """A form to collect and validate an email address"""
    article_id          = IntegerField('Id')
    user_email          = StringField('Email', validators=[DataRequired(), Email()])