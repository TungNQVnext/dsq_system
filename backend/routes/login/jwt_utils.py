import os
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status, Depends, Response
from dotenv import load_dotenv
from pathlib import Path
import logging

env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Lấy SECRET_KEY từ environment variable
SECRET_KEY = os.getenv("SECRET_KEY", "your-very-strong-secret-key")

# Kiểm tra và cảnh báo nếu đang sử dụng SECRET_KEY mặc định
if SECRET_KEY == "your-very-strong-secret-key":
    logging.warning("🔥 CẢNH BÁO BẢO MẬT: Đang sử dụng SECRET_KEY mặc định!")
    logging.warning("Tạo SECRET_KEY mới: python -c \"import secrets; print(secrets.token_hex(32))\"")

# Kiểm tra độ dài SECRET_KEY
if len(SECRET_KEY) < 32:
    logging.warning(f"🔥 CẢNH BÁO BẢO MẬT: SECRET_KEY quá ngắn ({len(SECRET_KEY)} ký tự). Khuyến nghị ít nhất 32 ký tự")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now() + (expires_delta or timedelta(hours=10))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def get_current_user_from_cookie(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    username = verify_access_token(token)
    return username
