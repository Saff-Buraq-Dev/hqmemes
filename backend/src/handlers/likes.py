from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from ..services import like_service, meme_service, user_service
from ..utils.auth import get_current_user

router = APIRouter(prefix='/memes', tags=['likes'])


@router.post('/{meme_id}/like', response_model=Dict)
async def toggle_like(
    meme_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Toggle like on a meme"""
    # Check if meme exists
    meme = meme_service.get_meme(meme_id)
    if not meme:
        raise HTTPException(status_code=404, detail='Meme not found')

    # Toggle like
    is_liked = like_service.toggle_like(meme_id, current_user['userId'])

    # Update meme likes count
    increment = 1 if is_liked else -1
    meme_service.increment_likes_count(meme_id, increment)

    # Get updated count
    updated_meme = meme_service.get_meme(meme_id)

    return {
        'isLiked': is_liked,
        'likesCount': updated_meme.likesCount if updated_meme else 0
    }


@router.get('/{meme_id}/likes', response_model=List[Dict])
async def get_meme_likes(
    meme_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get all likes for a meme"""
    likes = like_service.get_meme_likes(meme_id)

    # Enrich with user info
    result = []
    for like in likes:
        user = user_service.get_user(like.userId)
        if user:
            result.append({
                'userId': user.userId,
                'username': user.username,
                'avatarUrl': user.avatarUrl,
                'createdAt': like.createdAt,
            })

    return result
