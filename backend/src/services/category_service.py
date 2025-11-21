from datetime import datetime
from typing import List
from ..models.category import Category, CategoryCreate
from ..utils.dynamodb import get_item, put_item, update_item, scan_items
from ..config import settings
import re


class CategoryService:
    def __init__(self):
        self.table_name = settings.categories_table

    def _slugify(self, text: str) -> str:
        """Convert text to slug"""
        text = text.lower().strip()
        text = re.sub(r'[^\w\s-]', '', text)
        text = re.sub(r'[\s_-]+', '-', text)
        text = re.sub(r'^-+|-+$', '', text)
        return text

    def get_category(self, category_id: str) -> Category:
        """Get category by ID"""
        item = get_item(self.table_name, {'categoryId': category_id})
        return Category(**item) if item else None

    def create_category(self, category_data: CategoryCreate) -> Category:
        """Create category"""
        now = datetime.utcnow().isoformat()
        category_id = self._slugify(category_data.name)

        # Check if already exists
        existing = self.get_category(category_id)
        if existing:
            return existing

        item = {
            'categoryId': category_id,
            'name': category_data.name,
            'count': 0,
            'createdAt': now,
        }

        put_item(self.table_name, item)
        return Category(**item)

    def get_all_categories(self) -> List[Category]:
        """Get all categories"""
        response = scan_items(self.table_name)
        return [Category(**item) for item in response.get('Items', [])]

    def increment_count(self, category_id: str, increment: int = 1) -> None:
        """Increment category count"""
        category = self.get_category(category_id)
        if category:
            new_count = max(0, category.count + increment)
            update_item(
                self.table_name,
                {'categoryId': category_id},
                {'count': new_count}
            )
