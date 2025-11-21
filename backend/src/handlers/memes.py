from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Dict, List, Optional
from ..models.meme import Meme, MemeCreate, MemeUpdate
from ..services import meme_service, user_service, like_service, category_service
from ..utils.auth import get_current_user

router = APIRouter(prefix='/memes', tags=['memes'])


@router.get('', response_model=Dict)
async def get_memes(
    uploaderId: Optional[str] = Query(None),
    categories: Optional[str] = Query(None),
    sortBy: str = Query('recent', regex='^(recent|popular)$'),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    current_user: Dict = Depends(get_current_user)
):
    """Get memes with filters and pagination"""
    category_list = categories.split(',') if categories else None

    result = meme_service.get_memes(
        uploader_id=uploaderId,
        categories=category_list,
        sort_by=sortBy,
        page=page,
        limit=limit
    )

    # Enrich memes with uploader info and like status
    for meme in result['data']:
        # Get uploader info
        uploader = user_service.get_user(meme.uploaderId)
        if uploader:
            meme.uploader = {
                'userId': uploader.userId,
                'username': uploader.username,
                'avatarUrl': uploader.avatarUrl,
            }

        # Check if current user liked this meme
        meme.isLiked = like_service.check_user_liked(
            meme.memeId, current_user['userId'])

        # Get likes (limited to avoid overhead)
        likes = like_service.get_meme_likes(meme.memeId)
        meme.likes = []
        for like in likes[:10]:  # Limit to 10 likes
            user = user_service.get_user(like.userId)
            if user:
                meme.likes.append({
                    'userId': user.userId,
                    'username': user.username,
                    'avatarUrl': user.avatarUrl,
                    'createdAt': like.createdAt,
                })

    return result


@router.get('/{meme_id}', response_model=Meme)
async def get_meme(
    meme_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Get single meme"""
    meme = meme_service.get_meme(meme_id)
    if not meme:
        raise HTTPException(status_code=404, detail='Meme not found')

    # Enrich with uploader info
    uploader = user_service.get_user(meme.uploaderId)
    if uploader:
        meme.uploader = {
            'userId': uploader.userId,
            'username': uploader.username,
            'avatarUrl': uploader.avatarUrl,
        }

    # Check if liked
    meme.isLiked = like_service.check_user_liked(
        meme_id, current_user['userId'])

    return meme


@router.post('', response_model=Meme, status_code=201)
async def create_meme(
    meme_data: MemeCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Create a new meme (called after S3 upload)"""
    # Ensure uploaderId matches current user
    meme_data.uploaderId = current_user['userId']

    meme = meme_service.create_meme(meme_data)

    # Increment category counts
    for category_name in meme_data.categories:
        category_id = category_service._slugify(category_name)
        category = category_service.get_category(category_id)
        if category:
            category_service.increment_count(category_id, 1)

    return meme


@router.delete('/{meme_id}', status_code=204)
async def delete_meme(
    meme_id: str,
    current_user: Dict = Depends(get_current_user)
):
    """Delete a meme (only by uploader)"""
    meme = meme_service.get_meme(meme_id)
    if not meme:
        raise HTTPException(status_code=404, detail='Meme not found')

    if meme.uploaderId != current_user['userId']:
        raise HTTPException(
            status_code=403, detail='Not authorized to delete this meme')

    # Decrement category counts
    for category_name in meme.categories:
        category_id = category_service._slugify(category_name)
        category_service.increment_count(category_id, -1)

    meme_service.delete_meme(meme_id)
    return None
