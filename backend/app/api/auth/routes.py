"""
Authentication routes
"""
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ...config.database import get_db
from ...models.user import User
from ...schemas.user import LoginInput, LoginResponse
from ...core.auth import create_access_token, get_current_user_from_cookie, verify_access_token
from ...core.security import verify_password, hash_password

router = APIRouter()
security = HTTPBearer()


@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginInput, response: Response, db: Session = Depends(get_db)):
    """Login with username and password, returns user info and sets cookie"""
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not user.verify_password(login_data.password):
        raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu")
    
    access_token = create_access_token({"sub": user.username})
    
    # Set cookie with very long expiration (100 years) for permanent login
    response.set_cookie(
        key="access_token", 
        value=access_token, 
        httponly=True, 
        samesite="lax", 
        path="/",
        max_age=36500 * 24 * 60 * 60  # 100 years in seconds
    )
    
    return LoginResponse(username=user.username, role=user.role)


@router.post("/login-token")
def login_token(login_data: LoginInput, db: Session = Depends(get_db)):
    """Login endpoint that returns token in response body"""
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not user.verify_password(login_data.password):
        raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu")
    
    access_token = create_access_token({"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"username": user.username, "role": user.role}
    }


@router.get("/me", response_model=LoginResponse)
def get_me(username: str = Depends(get_current_user_from_cookie), db: Session = Depends(get_db)):
    """Get current user info using cookie authentication"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return LoginResponse(username=user.username, role=user.role)


@router.get("/me-token", response_model=LoginResponse)
def get_me_with_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    """Get current user info using Authorization token"""
    username = verify_access_token(credentials.credentials)
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return LoginResponse(username=user.username, role=user.role)


@router.post("/logout")
def logout(response: Response):
    """Logout user by clearing cookie"""
    response.delete_cookie(key="access_token")
    return {"msg": "Logged out"}


@router.put("/change-password")
def change_password_cookie(
    request: dict,
    username: str = Depends(get_current_user_from_cookie), 
    db: Session = Depends(get_db)
):
    """Change password using cookie authentication"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    current_password = request.get("current_password")
    new_password = request.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current password and new password are required")
    
    # Verify current password
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Check if new password is the same as current password
    if verify_password(new_password, user.password_hash):
        raise HTTPException(status_code=400, detail="New password cannot be the same as current password")
    
    # Update password
    user.password_hash = hash_password(new_password)
    db.commit()
    
    return {"msg": "Password changed successfully"}


@router.put("/change-password-token")  
def change_password_token(
    request: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Change password using token authentication"""
    username = verify_access_token(credentials.credentials)
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    current_password = request.get("current_password")
    new_password = request.get("new_password")
    
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="Current password and new password are required")
    
    # Verify current password
    if not verify_password(current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Check if new password is the same as current password
    if verify_password(new_password, user.password_hash):
        raise HTTPException(status_code=400, detail="New password cannot be the same as current password")
    
    # Update password
    user.password_hash = hash_password(new_password)
    db.commit()
    
    return {"msg": "Password changed successfully"}
