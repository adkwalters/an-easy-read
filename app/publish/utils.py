import os
import imghdr

import boto3

from app import db, scheduled_delete
from app.models import Image


# Image validation
# https://blog.miguelgrinberg.com/post/handling-file-uploads-with-flask
def validate_image(stream):
    header = stream.read(512)           # Read first chunk of data from stream
    stream.seek(0)                      # Reset stream for file save
    format = imghdr.what(None, header)  # Process first chunk with imghrd library
    if not format:
        return None
    return '.' + (format)


def delete_unused_image(image, job_id):
    """Delete uploaded but unused images from database and cloud storage
    
    4 hours after upload (controlled by APScheduler), check whether an uploaded
    image has been marked as 'used' in the database. If unused, delete the 
    Image model object from the database and delete the related image file from 
    Amazon S3 cloud storage.

    For convenience, the scheduling job ID is set to the same ID as the database
    image object ID. 
    """

    print("running")
    # Import app in order to access app context outside view function
    from easy_read import app

    with app.app_context():
        print("deleting")
        # Get image object from database
        db_image = db.session.query(Image).filter_by(id = job_id).first()
        if db_image:
            # If image is not used
            if db_image.used == False:
                # Delete image object from database
                db.session.delete(db_image)
                db.session.commit()
                # Delete image from cloud storage
                boto3.resource('s3').Object(
                    os.environ['FLASKS3_BUCKET_NAME'], image).delete()

    # Remove job from scheduler
    scheduled_delete.remove_job(str(job_id))
  
    return print(f'Scheduled job {job_id} deleted')