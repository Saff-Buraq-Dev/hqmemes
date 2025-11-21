import boto3
import uuid
from datetime import datetime
from typing import Dict
from ..config import settings


class UploadService:
    def __init__(self):
        self.s3_client = boto3.client('s3', region_name=settings.aws_region)
        self.bucket_name = settings.memes_bucket

    def generate_presigned_url(self, filename: str, content_type: str) -> Dict[str, str]:
        """Generate presigned URL for S3 upload"""
        # Generate unique meme ID
        meme_id = str(uuid.uuid4())

        # Extract file extension
        file_ext = filename.split('.')[-1] if '.' in filename else 'jpg'

        # Generate S3 key
        s3_key = f'memes/{meme_id}.{file_ext}'

        # Generate presigned URL
        presigned_url = self.s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': self.bucket_name,
                'Key': s3_key,
                'ContentType': content_type,
            },
            ExpiresIn=3600,  # 1 hour
        )

        # Public URL (will be available after upload)
        file_url = f'/{s3_key}'

        return {
            'uploadUrl': presigned_url,
            'fileUrl': file_url,
            'memeId': meme_id,
        }
