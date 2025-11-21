from datetime import datetime
from typing import List, Optional, Dict, Any
from boto3.dynamodb.conditions import Key, Attr
from ..models.meme import Meme, MemeCreate, MemeUpdate
from ..utils.dynamodb import get_item, put_item, update_item, delete_item, query_items, scan_items
from ..config import settings


class MemeService:
    def __init__(self):
        self.table_name = settings.memes_table

    def get_meme(self, meme_id: str) -> Optional[Meme]:
        """Get meme by ID"""
        item = get_item(self.table_name, {'memeId': meme_id})
        return Meme(**item) if item else None

    def create_meme(self, meme_data: MemeCreate) -> Meme:
        """Create new meme"""
        now = datetime.utcnow().isoformat()

        item = {
            'memeId': meme_data.memeId,
            'name': meme_data.name,
            'url': meme_data.url,
            'uploaderId': meme_data.uploaderId,
            'categories': meme_data.categories,
            'likesCount': 0,
            'createdAt': now,
        }

        put_item(self.table_name, item)
        return Meme(**item)

    def update_meme(self, meme_id: str, updates: MemeUpdate) -> Optional[Meme]:
        """Update meme"""
        update_data = {k: v for k, v in updates.dict(
            exclude_unset=True).items() if v is not None}

        if not update_data:
            return self.get_meme(meme_id)

        updated_item = update_item(
            self.table_name,
            {'memeId': meme_id},
            update_data
        )
        return Meme(**updated_item)

    def delete_meme(self, meme_id: str) -> None:
        """Delete meme"""
        delete_item(self.table_name, {'memeId': meme_id})

    def get_memes(
        self,
        uploader_id: Optional[str] = None,
        categories: Optional[List[str]] = None,
        sort_by: str = 'recent',
        page: int = 1,
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get memes with filters and pagination"""

        # Build filter expression
        filter_expr = None
        if categories:
            # Filter by categories (any match)
            category_filters = [Attr('categories').contains(cat)
                                for cat in categories]
            filter_expr = category_filters[0]
            for f in category_filters[1:]:
                filter_expr = filter_expr | f

        # Query or scan based on filters
        if uploader_id:
            # Query by uploader
            response = query_items(
                self.table_name,
                key_condition_expression=Key('uploaderId').eq(uploader_id),
                index_name='uploaderId-createdAt-index',
                filter_expression=filter_expr,
                scan_index_forward=(sort_by != 'recent'),
            )
        elif sort_by == 'popular':
            # Query popular (by likes)
            response = scan_items(
                self.table_name,
                filter_expression=filter_expr,
            )
            # Sort by likesCount in memory
            items = sorted(response.get('Items', []),
                           key=lambda x: x.get('likesCount', 0), reverse=True)
            response['Items'] = items
        else:
            # Scan for recent
            response = scan_items(
                self.table_name,
                filter_expression=filter_expr,
            )
            # Sort by createdAt in memory
            items = sorted(response.get('Items', []),
                           key=lambda x: x.get('createdAt', ''), reverse=True)
            response['Items'] = items

        items = response.get('Items', [])

        # Pagination
        total = len(items)
        start = (page - 1) * limit
        end = start + limit
        paginated_items = items[start:end]

        return {
            'data': [Meme(**item) for item in paginated_items],
            'total': total,
            'page': page,
            'limit': limit,
            'hasMore': end < total,
        }

    def increment_likes_count(self, meme_id: str, increment: int = 1) -> None:
        """Increment or decrement likes count"""
        meme = self.get_meme(meme_id)
        if meme:
            new_count = max(0, meme.likesCount + increment)
            update_item(
                self.table_name,
                {'memeId': meme_id},
                {'likesCount': new_count}
            )
