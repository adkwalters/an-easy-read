from app import create_app, db
from app.models import User, Article, Image, Category, Paragraph, Summary, Publisher, PublishingNote
from app.publish.routes import display_admin_articles

app = create_app()


@app.shell_context_processor
def make_shell_context():
    return {
        'db': db, 
        'User': User, 
        'Article': Article,
        'Image': Image, 
        'Category': Category,
        'Paragraph': Paragraph,
        'Summary': Summary,
        'Publisher': Publisher, 
        'PublishingNote': PublishingNote,
        'display_admin_articles': display_admin_articles}