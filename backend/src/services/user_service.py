from datetime import datetime
from typing import Optional
from ..models.user import User, UserCreate, UserUpdate
from ..utils.dynamodb import get_item, put_item, update_item
from ..config import settings


class UserService:
    def __init__(self):
        self.table_name = settings.users_table

    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        item = get_item(self.table_name, {'userId': user_id})
        return User(**item) if item else None

    def create_user(self, user_data: UserCreate) -> User:
        """Create new user"""
        now = datetime.utcnow().isoformat()

        item = {
            'userId': user_data.userId,
            'username': user_data.username,
            'email': user_data.email,
            'avatarUrl': user_data.avatarUrl or '/avatars/avatar-1.png',
            'createdAt': now,
        }

        put_item(self.table_name, item)
        return User(**item)

    def update_user(self, user_id: str, updates: UserUpdate) -> User:
        """Update user"""
        update_data = {k: v for k, v in updates.dict(
            exclude_unset=True).items() if v is not None}

        if not update_data:
            # No updates, just return existing user
            return self.get_user(user_id)

        updated_item = update_item(
            self.table_name,
            {'userId': user_id},
            update_data
        )
        return User(**updated_item)

    def get_or_create_user(self, user_id: str, email: str, username: str) -> User:
        """Get existing user or create if doesn't exist"""
        user = self.get_user(user_id)
        if user:
            return user

        user_data = UserCreate(
            userId=user_id,
            email=email,
            username=username,
        )
        return self.create_user(user_data)
