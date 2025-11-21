from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from pydantic import BaseModel
from ..services import upload_service
from ..utils.auth import get_current_user

router = APIRouter(prefix='/upload', tags=['upload'])


class PresignedUrlRequest(BaseModel):
    filename: str
    contentType: str

    model_config = {
        'extra': 'allow'
    }


@router.post('/presigned', response_model=Dict)
async def get_presigned_url(
    request: PresignedUrlRequest,
    current_user: Dict = Depends(get_current_user)
):
    """Get presigned URL for S3 upload"""
    try:
        result = upload_service.generate_presigned_url(
            request.filename,
            request.contentType
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
