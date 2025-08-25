"""
User management routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ...config.database import get_db
from ...models.user import User
from ...schemas.user import UserCreate, UserUpdate, UserResponse, PasswordChange
from ...core.security import hash_password, verify_password
from ...core.dependencies import get_current_user, get_admin_user

router = APIRouter()


@router.get("/debug", summary="Debug current user")
def debug_current_user(current_user: User = Depends(get_current_user)):
    """Debug endpoint to check current user"""
    return {
        "username": current_user.username,
        "role": current_user.role,
        "is_admin": current_user.role == "admin"
    }


@router.get("", response_model=List[UserResponse], summary="Get all users")
async def get_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Get all users - Admin only"""
    users = db.query(User).all()
    return users


@router.post("", response_model=UserResponse, summary="Create new user")
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Create new user - Admin only"""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Validate role
    valid_roles = ["admin", "staff"]
    if user_data.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {valid_roles}"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    new_user = User(
        username=user_data.username,
        password_hash=hashed_password,
        role=user_data.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.put("/{username}", response_model=UserResponse, summary="Update user")
async def update_user(
    username: str,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Update user - Admin only"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password if provided
    if user_data.password:
        # Check if new password is the same as current password
        if verify_password(user_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password cannot be the same as current password"
            )
        user.password_hash = hash_password(user_data.password)
    
    # Update role if provided
    if user_data.role:
        valid_roles = ["admin", "staff"]
        if user_data.role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {valid_roles}"
            )
        user.role = user_data.role
    
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{username}", summary="Delete user")
async def delete_user(
    username: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Delete user - Admin only"""
    # Prevent admin from deleting themselves
    if current_user.username == username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


@router.put("/{username}/password", summary="Change user password")
async def change_user_password(
    username: str,
    password_data: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Change user password - Admin only"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if new password is the same as current password
    if verify_password(password_data.new_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password cannot be the same as current password"
        )
    
    # Update password
    user.password_hash = hash_password(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}


@router.put("/{username}/role", summary="Change user role")
async def change_user_role(
    username: str,
    role_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """Change user role - Admin only"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate role
    valid_roles = ["admin", "staff"]
    new_role = role_data.get("role")
    if new_role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {valid_roles}"
        )
    
    # Prevent admin from changing their own role to staff
    if current_user.username == username and new_role == "staff":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role from admin to staff"
        )
    
    # Update role
    user.role = new_role
    db.commit()
    
    return {"message": "Role changed successfully"}
