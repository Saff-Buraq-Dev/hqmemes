from fastapi import APIRouter, Depends, HTTPException, Request
from typing import Dict
from ..models.user import User, UserCreate, UserUpdate
from ..services import user_service
from ..utils.auth import get_current_user

router = APIRouter(prefix='/auth', tags=['auth'])


@router.post('/signup', response_model=User, status_code=201)
async def signup(user_data: UserCreate):
    """Create a new user (called by frontend after Cognito signup)"""
    try:
        user = user_service.create_user(user_data)
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get('/me', response_model=User)
async def get_me(request: Request, current_user: Dict = Depends(get_current_user)):
    """Get current user profile"""
    user = user_service.get_user(current_user['userId'])
    if not user:
        # User doesn't exist in our DB, create it
        email = current_user.get(
            'email') or f"{current_user['userId']}@unknown.com"
        username = current_user.get('username') or (email.split(
            '@')[0] if '@' in email else current_user['userId'][:10])

        # Check for avatar from signup (passed via header)
        avatar_url = request.headers.get(
            'X-Avatar-Url', '/avatars/avatar-1.png')

        user_data = UserCreate(
            userId=current_user['userId'],
            email=email,
            username=username,
            avatarUrl=avatar_url,
        )
        user = user_service.create_user(user_data)
    return user


@router.put('/me', response_model=User)
async def update_me(
    updates: UserUpdate,
    current_user: Dict = Depends(get_current_user)
):
    """Update current user profile"""
    user = user_service.update_user(current_user['userId'], updates)
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return user
