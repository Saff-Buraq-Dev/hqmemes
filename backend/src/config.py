import os
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # AWS (AWS_REGION is auto-set by Lambda, use it directly)
    aws_region: str = os.getenv('AWS_REGION', 'ca-central-1')
    aws_account_id: str = os.getenv('AWS_ACCOUNT_ID', '')

    # DynamoDB Tables
    users_table: str = os.getenv('USERS_TABLE', 'hqmemes-users')
    memes_table: str = os.getenv('MEMES_TABLE', 'hqmemes-memes')
    likes_table: str = os.getenv('LIKES_TABLE', 'hqmemes-likes')
    categories_table: str = os.getenv('CATEGORIES_TABLE', 'hqmemes-categories')
    upload_jobs_table: str = os.getenv(
        'UPLOAD_JOBS_TABLE', 'hqmemes-upload-jobs')

    # S3
    memes_bucket: str = os.getenv('MEMES_BUCKET', 'hqmemes-assets')
    frontend_bucket: str = os.getenv('FRONTEND_BUCKET', 'hqmemes-frontend')

    # Cognito
    cognito_user_pool_id: str = os.getenv('COGNITO_USER_POOL_ID', '')
    cognito_client_id: str = os.getenv('COGNITO_CLIENT_ID', '')
    cognito_region: str = os.getenv('COGNITO_REGION', 'ca-central-1')

    # CORS (parsed from comma-separated string)
    cors_origins_str: str = os.getenv(
        'CORS_ORIGINS',
        'https://hqmemes.dev.gharbidev.com,http://localhost:5173,http://localhost:5174'
    )

    # Environment
    environment: str = os.getenv('ENVIRONMENT', 'production')

    class Config:
        env_file = '.env'
        case_sensitive = False

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins_str.split(',')]


settings = Settings()
