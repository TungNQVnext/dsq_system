"""
User schemas for request/response data
"""
from pydantic import BaseModel
from typing import Optional


class LoginInput(BaseModel):
    """Login request schema"""
    username: str
    password: str


class LoginResponse(BaseModel):
    """Login response schema"""
    username: str
    role: str


class UserCreate(BaseModel):
    """User creation schema"""
    username: str
    password: str
    role: str


class UserUpdate(BaseModel):
    """User update schema"""
    password: Optional[str] = None
    role: Optional[str] = None


class UserResponse(BaseModel):
    """User response schema"""
    username: str
    role: str


class PasswordChange(BaseModel):
    """Password change schema"""
    new_password: str
