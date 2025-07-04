from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from datetime import datetime
from models.record import Record
from db.database import get_db
import re

from textToSpeak import add_to_queue

router = APIRouter()

@router.post("/call")
def call_record(record_number: str, request: Request, db: Session = Depends(get_db)):    
    numbers = re.findall(r'\d+', record_number)
    if not numbers:
        raise HTTPException(status_code=400, detail="Không có số hợp lệ")
    current_user = request.headers.get("X-Username","anonymous")
    updated = []
    for number in numbers:
        record = db.query(Record).filter(Record.record_number == int(number)).first()
        if not record:
            continue
        if record.status == "in_progress":
            continue
        elif record.status == "done":
            record.status = "waiting_to_receive"
        elif record.status == "waiting_to_receive":
            pass
        else:
            continue
        record.updated_at = datetime.utcnow()
        record.updated_by = current_user
        updated.append(record)
        
    
    db.commit()
    add_to_queue(record_number, "vietnamese+japanese")

    return{
        "message" : "Đã cập nhật trạng thái hồ sơ",
        "record": [
            {
                "record_number": r.record_number,
                "full_name": r.full_name,
                "status": r.status,
                "updated_at": r.updated_at
            } for r in updated
        ]
    }

@router.get("/list")
def get_record_list(db: Session = Depends(get_db)):
    records = (
        db.query(Record)
        .filter(Record.status.in_(["waiting_to_receive","completed"]))
        .order_by(Record.updated_at.desc())
        .all()
    )
    return records

@router.put("/{record_id}/status")
def update_record_status(record_id: int, new_status: str, db: Session = Depends(get_db)):
    valid_statuses = ["waiting_to_receive","completed","cancel"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")
    
    record = db.query(Record).filter(Record.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ")
    
    record.status = new_status
    db.commit()
    db.refresh(record)
    return record

@router.get("/waiting")
def get_waiting_records(db: Session = Depends(get_db)):
    records = (
        db.query(Record)
        .filter(Record.status == "waiting_to_receive")
        .order_by(Record.updated_at.desc())
        .all()
    )
    return records

@router.post("/call_by_profile_codes")
def call_by_profile_codes(payload: dict, db: Session = Depends(get_db)):
    profile_codes = payload.get("profile_codes","")
    codes = [code.strip() for code in profile_codes if isinstance(code,str) and code.strip().isdigit()]
    if not codes:
        raise HTTPException(status_code=400, detail="No valid profile codes provided")
    
    updated_records = []

    for code in codes:
        record_number = int(code.lstrip("0") or "0")
        record = db.query(Record).filter(Record.record_number == record_number).first()
        if record and record.status != "waiting_to_receive":
            record.status = "waiting_to_receive"
            record.updated_at = datetime.now()
            updated_records.append(record)

    db.commit()

    return [
        {
            "id": r.id,
            "record_number": r.record_number,
            "status": r.status,
            "updated_at": r.updated_at.isoformat()
        }
        for r in updated_records
    ]