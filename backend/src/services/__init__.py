from .user_service import UserService
from .meme_service import MemeService
from .like_service import LikeService
from .category_service import CategoryService
from .upload_service import UploadService

user_service = UserService()
meme_service = MemeService()
like_service = LikeService()
category_service = CategoryService()
upload_service = UploadService()

__all__ = [
    'user_service',
    'meme_service',
    'like_service',
    'category_service',
    'upload_service',
]
