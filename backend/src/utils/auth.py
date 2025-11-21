import json
import base64
import requests
from jose import jwt, JWTError
from typing import Optional, Dict
from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..config import settings

security = HTTPBearer()

# Cache for Cognito public keys
_jwks_cache: Optional[dict] = None


def get_cognito_public_keys() -> dict:
    """Fetch Cognito public keys (JWKS)"""
    global _jwks_cache
    if _jwks_cache:
        return _jwks_cache

    jwks_url = f'https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}/.well-known/jwks.json'
    response = requests.get(jwks_url)
    _jwks_cache = response.json()
    return _jwks_cache


def verify_token(token: str) -> Dict[str, any]:
    """Verify JWT token from Cognito"""
    try:
        # Get the kid from the headers
        headers = jwt.get_unverified_headers(token)
        kid = headers['kid']

        # Get the public key
        jwks = get_cognito_public_keys()
        key = None
        for k in jwks['keys']:
            if k['kid'] == kid:
                key = k
                break

        if not key:
            raise HTTPException(status_code=401, detail='Public key not found')

        # Verify the token
        payload = jwt.decode(
            token,
            key,
            algorithms=['RS256'],
            audience=settings.cognito_client_id,
            issuer=f'https://cognito-idp.{settings.cognito_region}.amazonaws.com/{settings.cognito_user_pool_id}'
        )

        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f'Invalid token: {str(e)}')


async def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, any]:
    """Get current user from JWT token"""
    token = credentials.credentials
    payload = verify_token(token)

    # Extract user information
    user_id = payload.get('sub')
    email = payload.get('email')
    username = payload.get(
        'preferred_username') or payload.get('cognito:username')

    if not user_id:
        raise HTTPException(status_code=401, detail='Invalid token payload')

    return {
        'userId': user_id,
        'email': email,
        'username': username,
    }
