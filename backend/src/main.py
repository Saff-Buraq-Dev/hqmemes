from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
from .config import settings
from .handlers import (
    auth_router,
    memes_router,
    likes_router,
    categories_router,
    upload_router,
)

# Create FastAPI app
app = FastAPI(
    title='HQ-Memes API',
    description='API pour l\'application HQ-Memes',
    version='1.0.0',
    docs_url='/docs',
    redoc_url='/redoc',
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Register routers
app.include_router(auth_router)
app.include_router(memes_router)
app.include_router(likes_router)
app.include_router(categories_router)
app.include_router(upload_router)

# Health check


@app.get('/health')
async def health_check():
    return {'status': 'healthy', 'environment': settings.environment}

# Root endpoint


@app.get('/')
async def root():
    return {
        'message': 'Welcome to HQ-Memes API',
        'version': '1.0.0',
        'docs': '/docs',
    }

# Lambda handler
handler = Mangum(app, lifespan='off')
