from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    username: str
    email: EmailStr
    avatarUrl: Optional[str] = '/avatars/avatar-1.png'


class UserCreate(UserBase):
    userId: str


class UserUpdate(BaseModel):
    username: Optional[str] = None
    avatarUrl: Optional[str] = None


class User(UserBase):
    userId: str
    createdAt: str

    class Config:
        from_attributes = True
