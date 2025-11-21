from typing import Any, List, Optional
from fastapi.responses import JSONResponse


def success_response(data: Any, message: Optional[str] = None, status_code: int = 200) -> JSONResponse:
    """Standard success response"""
    response = {'data': data}
    if message:
        response['message'] = message
    return JSONResponse(content=response, status_code=status_code)


def error_response(message: str, status_code: int = 400, details: Optional[dict] = None) -> JSONResponse:
    """Standard error response"""
    response = {'error': message}
    if details:
        response['details'] = details
    return JSONResponse(content=response, status_code=status_code)


def paginated_response(
    data: List[Any],
    total: int,
    page: int,
    limit: int,
    status_code: int = 200
) -> JSONResponse:
    """Paginated response"""
    has_more = (page * limit) < total
    response = {
        'data': data,
        'total': total,
        'page': page,
        'limit': limit,
        'hasMore': has_more,
    }
    return JSONResponse(content=response, status_code=status_code)
