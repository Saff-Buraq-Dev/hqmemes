from pydantic import BaseModel
from typing import Optional


class LikeBase(BaseModel):
    memeId: str
    userId: str


class LikeCreate(LikeBase):
    pass


class Like(LikeBase):
    createdAt: str
    user: Optional[dict] = None

    class Config:
        from_attributes = True
