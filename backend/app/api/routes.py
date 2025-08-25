"""
Main API router that combines all API endpoints
"""
from fastapi import APIRouter

from .auth.routes import router as auth_router
from .users.routes import router as users_router
from .call_numbers.routes import router as call_numbers_router
from .printing.routes import router as printing_router

# Create main API router
api_router = APIRouter()

# Include all sub-routers
api_router.include_router(
    auth_router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    users_router,
    prefix="/users",
    tags=["User Management"]
)

api_router.include_router(
    call_numbers_router,
    prefix="/call-numbers",
    tags=["Call Numbers"]
)

api_router.include_router(
    printing_router,
    prefix="/printing",
    tags=["Printing"]
)
