from pydantic import BaseModel
from typing import Optional

class LoginInput(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    username: str
    role: str

# New schemas for user management
class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class UserUpdate(BaseModel):
    password: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    username: str
    role: str

class PasswordChange(BaseModel):
    new_password: str