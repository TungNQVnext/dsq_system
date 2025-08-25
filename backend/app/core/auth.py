"""
Authentication and JWT utilities
"""
import os
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status
from dotenv import load_dotenv
from pathlib import Path
import logging

from ..config.settings import settings

# Load environment variables
env_path = Path(__file__).parent.parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

SECRET_KEY = os.getenv("SECRET_KEY", settings.SECRET_KEY)

# Security warnings
if SECRET_KEY == "your-secret-key-here":
    logging.warning("CẢNH BÁO BẢO MẬT: Đang sử dụng SECRET_KEY mặc định!")
    logging.warning("Tạo SECRET_KEY mới: python -c \"import secrets; print(secrets.token_hex(32))\"")

if len(SECRET_KEY) < 32:
    logging.warning(f"CẢNH BÁO BẢO MẬT: SECRET_KEY quá ngắn ({len(SECRET_KEY)} ký tự). Khuyến nghị ít nhất 32 ký tự")


def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    # Set expiration to a very long time (100 years) for permanent login
    expire = datetime.now() + timedelta(days=36500)  # ~100 years
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str) -> str:
    """Verify JWT token and return username"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user_from_cookie(request: Request) -> str:
    """Get current user from cookie"""
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    username = verify_access_token(token)
    return username
