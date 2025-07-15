from fastapi import APIRouter, HTTPException, Depends, Response
from sqlalchemy.orm import Session
from db.database import SessionLocal
from models.user import User
from schemas.user import LoginInput, LoginResponse
from sqlalchemy import func
from models.call_number import CallNumber
import datetime
from routes.login.jwt_utils import create_access_token, get_current_user_from_cookie

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginInput, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not user.verify_password(login_data.password):
        raise HTTPException(status_code=401, detail="Sai tài khoản hoặc mật khẩu")
    access_token = create_access_token({"sub": user.username})
    response.set_cookie(key="access_token", value=access_token, httponly=True, samesite="lax", path="/")
    return LoginResponse(username=user.username,role=user.role)

@router.get("/me", response_model=LoginResponse)
def get_me(username: str = Depends(get_current_user_from_cookie), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return LoginResponse(username=user.username, role=user.role)

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"msg": "Logged out"}

