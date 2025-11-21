from datetime import datetime
from typing import List, Optional
from boto3.dynamodb.conditions import Key
from ..models.like import Like, LikeCreate
from ..utils.dynamodb import get_item, put_item, delete_item, query_items
from ..config import settings


class LikeService:
    def __init__(self):
        self.table_name = settings.likes_table

    def get_like(self, meme_id: str, user_id: str) -> Optional[Like]:
        """Get like"""
        item = get_item(self.table_name, {
                        'memeId#userId': f'{meme_id}#{user_id}'})
        if item:
            item['memeId'] = meme_id
            item['userId'] = user_id
            return Like(**item)
        return None

    def create_like(self, like_data: LikeCreate) -> Like:
        """Create like"""
        now = datetime.utcnow().isoformat()

        item = {
            'memeId#userId': f'{like_data.memeId}#{like_data.userId}',
            'memeId': like_data.memeId,
            'userId': like_data.userId,
            'createdAt': now,
        }

        put_item(self.table_name, item)
        return Like(**{
            'memeId': like_data.memeId,
            'userId': like_data.userId,
            'createdAt': now,
        })

    def delete_like(self, meme_id: str, user_id: str) -> None:
        """Delete like"""
        delete_item(self.table_name, {'memeId#userId': f'{meme_id}#{user_id}'})

    def toggle_like(self, meme_id: str, user_id: str) -> bool:
        """Toggle like (returns True if liked, False if unliked)"""
        existing_like = self.get_like(meme_id, user_id)

        if existing_like:
            self.delete_like(meme_id, user_id)
            return False
        else:
            like_data = LikeCreate(memeId=meme_id, userId=user_id)
            self.create_like(like_data)
            return True

    def get_meme_likes(self, meme_id: str) -> List[Like]:
        """Get all likes for a meme"""
        response = query_items(
            self.table_name,
            key_condition_expression=Key('memeId').eq(meme_id),
            index_name='memeId-index',
        )

        likes = []
        for item in response.get('Items', []):
            likes.append(Like(**{
                'memeId': item['memeId'],
                'userId': item['userId'],
                'createdAt': item['createdAt'],
            }))

        return likes

    def check_user_liked(self, meme_id: str, user_id: str) -> bool:
        """Check if user liked a meme"""
        return self.get_like(meme_id, user_id) is not None
