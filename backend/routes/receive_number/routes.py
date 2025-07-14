from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime
from models.call_number import CallNumber
from db.database import get_db
from websocket_backend.ws_handler import manager
import json

router = APIRouter()

@router.get("/call-numbers")
def get_call_numbers(db: Session = Depends(get_db)):
    call_numbers = (
        db.query(CallNumber)
        .filter(CallNumber.status.in_(["ready", "serving", "completed", "cancel"]))
        .order_by(CallNumber.updated_date)
        .all()
    )
    
    result = []
    for call_number in call_numbers:
        nationality = "Việt Nam" if call_number.prefix == "V" else "Quốc tịch khác"
        result.append({
            "id": call_number.id,
            "number": call_number.number,
            "prefix": call_number.prefix,
            "nationality": nationality,
            "status": call_number.status,
            "created_date": call_number.created_date,
            "updated_date": call_number.updated_date
        })
    
    return result

@router.put("/call-numbers/{call_number_id}/status")
def update_call_number_status(call_number_id: int, new_status: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Cập nhật trạng thái của call number"""
    valid_statuses = ["ready", "serving", "completed", "cancel"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")
    
    call_number = db.query(CallNumber).filter(CallNumber.id == call_number_id).first()
    if not call_number:
        raise HTTPException(status_code=404, detail="Không tìm thấy call number")
    
    call_number.status = new_status
    call_number.updated_date = datetime.now()
    db.commit()
    db.refresh(call_number)
    
    # Prepare broadcast message
    update_message = {
        "type": "call_number_updated",
        "data": {
            "id": call_number.id,
            "number": call_number.number,
            "prefix": call_number.prefix,
            "nationality": "Việt Nam" if call_number.prefix == "V" else "Quốc tịch khác",
            "status": call_number.status,
            "created_date": call_number.created_date.isoformat() if call_number.created_date else None,
            "updated_date": call_number.updated_date.isoformat() if call_number.updated_date else None
        }
    }
    
    # Send broadcast as background task
    background_tasks.add_task(manager.broadcast, json.dumps(update_message))
    
    nationality = "Việt Nam" if call_number.prefix == "V" else "Quốc tịch khác"
    return {
        "id": call_number.id,
        "number": call_number.number,
        "prefix": call_number.prefix,
        "nationality": nationality,
        "status": call_number.status,
        "created_date": call_number.created_date,
        "updated_date": call_number.updated_date
    }

@router.get("/call-numbers/current")
def get_current_serving_number(db: Session = Depends(get_db)):
    current_number = (
        db.query(CallNumber)
        .filter(CallNumber.status == "serving")
        .order_by(CallNumber.updated_date.desc())
        .first()
    )
    
    if not current_number:
        current_number = (
            db.query(CallNumber)
            .filter(CallNumber.status == "ready")
            .order_by(CallNumber.updated_date.asc())
            .first()
        )
    
    if current_number:
        nationality = "Việt Nam" if current_number.prefix == "V" else "Quốc tịch khác"
        return {
            "id": current_number.id,
            "number": current_number.number,
            "prefix": current_number.prefix,
            "nationality": nationality,
            "status": current_number.status,
            "created_date": current_number.created_date,
            "updated_date": current_number.updated_date
        }
    
    return None
