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

    last_entry = db.query(CallNumber).filter(
        CallNumber.prefix == prefix,
        CallNumber.created_date == today
    ).order_by(CallNumber.id.desc()).first()

    if last_entry:
        last_seq = int(last_entry.number[1:])
    else:
        last_seq = 0

    new_seq = str(last_seq + 1).zfill(3)
    new_number = prefix + new_seq

    new_call = CallNumber(number=new_number, prefix=prefix, created_date=today)
    db.add(new_call)
    db.commit()

    return { "number": new_number }
