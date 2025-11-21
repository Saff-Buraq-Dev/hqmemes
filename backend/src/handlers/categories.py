from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, List
from ..models.category import Category, CategoryCreate
from ..services import category_service
from ..utils.auth import get_current_user

router = APIRouter(prefix='/categories', tags=['categories'])


@router.get('', response_model=List[Category])
async def get_categories(current_user: Dict = Depends(get_current_user)):
    """Get all categories"""
    categories = category_service.get_all_categories()
    return categories


@router.post('', response_model=Category, status_code=201)
async def create_category(
    category_data: CategoryCreate,
    current_user: Dict = Depends(get_current_user)
):
    """Create a new category"""
    category = category_service.create_category(category_data)
    return category
