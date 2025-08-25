"""
Common dependencies for API routes
"""
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..models.user import User
from ..core.auth import verify_access_token, get_current_user_from_cookie

security = HTTPBearer(auto_error=False)


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
) -> User:
    """Get current user from Authorization header or cookie"""
    
    # Try token auth first
    if credentials and credentials.credentials:
        username = verify_access_token(credentials.credentials)
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    
    # Fallback to cookie auth
    try:
        username = get_current_user_from_cookie(request)
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication required")


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Verify user has admin permissions"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin permission required"
        )
    return current_user
