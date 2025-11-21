from .auth import router as auth_router
from .memes import router as memes_router
from .likes import router as likes_router
from .categories import router as categories_router
from .upload import router as upload_router

__all__ = [
    'auth_router',
    'memes_router',
    'likes_router',
    'categories_router',
    'upload_router',
]
