from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MemeBase(BaseModel):
    name: str
    url: str
    categories: List[str] = Field(default_factory=list)


class MemeCreate(MemeBase):
    memeId: str
    uploaderId: Optional[str] = None  # Set automatically from JWT token

    model_config = {
        'extra': 'allow'
    }


class MemeUpdate(BaseModel):
    name: Optional[str] = None
    categories: Optional[List[str]] = None


class Meme(MemeBase):
    memeId: str
    uploaderId: str
    likesCount: int = 0
    createdAt: str
    uploader: Optional[dict] = None
    likes: Optional[List[dict]] = None
    isLiked: Optional[bool] = False

    model_config = {
        'from_attributes': True
    }
