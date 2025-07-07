import os
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Request, HTTPException, status, Depends, Response
from dotenv import load_dotenv
from pathlib import Path

# Load SECRET_KEY từ .env
backend_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(backend_env_path)
SECRET_KEY = os.getenv("SECRET_KEY", "your-very-strong-secret-key")
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
