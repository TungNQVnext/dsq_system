# backend/call/routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.call_number import CallNumber
from pydantic import BaseModel
from sqlalchemy import func
import datetime

router = APIRouter(prefix="/call")

class CallRequest(BaseModel):
    prefix: str

@router.post("/number")
def generate_number(req: CallRequest, db: Session = Depends(get_db)):
    prefix = req.prefix.upper()
    if prefix not in ["V", "N"]:
        raise HTTPException(status_code=400, detail="Prefix không hợp lệ")

    today = datetime.date.today()
    now = datetime.datetime.now()
    
    try:
        max_number_query = db.query(func.max(CallNumber.number)).filter(
            CallNumber.prefix == prefix,
            func.date(CallNumber.created_date) == today
        ).scalar()
        
        if max_number_query:
            last_seq = int(max_number_query[1:])
        else:
            last_seq = 0

        new_seq = str(last_seq + 1).zfill(3)
        new_number = prefix + new_seq
        
        new_call = CallNumber(
            number=new_number,
            prefix=prefix,
            created_date=now,
            status="ready"
        )
        
        db.add(new_call)
        db.commit()
        db.refresh(new_call)
        
        return {"number": new_number}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi tạo số: {str(e)}")
