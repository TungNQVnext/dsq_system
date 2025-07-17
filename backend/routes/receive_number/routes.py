from fastapi import APIRouter, HTTPException, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date
from models.call_number import CallNumber
from db.database import get_db
from websocket_backend.return_number.ws_handler import manager
from textToSpeak.receiveNumber import add_to_queue as add_to_receive_queue
import json

router = APIRouter()

@router.get("/call-numbers")
def get_call_numbers(db: Session = Depends(get_db)):
    today = date.today()
    call_numbers = (
        db.query(CallNumber)
        .filter(
            CallNumber.status.in_(["ready", "serving", "completed", "cancel"]),
            func.date(CallNumber.created_date) == today
        )
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
            "counter": call_number.counter,
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
    
    # Only update updated_date when transitioning to final states
    if new_status in ["completed", "cancel"]:
        call_number.updated_date = datetime.now()
        call_number.counter = None  
        
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
    today = date.today()
    current_number = (
        db.query(CallNumber)
        .filter(
            CallNumber.status == "serving",
            func.date(CallNumber.created_date) == today
        )
        .order_by(CallNumber.updated_date.desc())
        .first()
    )
    
    if not current_number:
        current_number = (
            db.query(CallNumber)
            .filter(
                CallNumber.status == "ready",
                func.date(CallNumber.created_date) == today
            )
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

@router.get("/call-numbers/cancelled-today")
def get_cancelled_numbers_today(db: Session = Depends(get_db)):
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    end_of_day = datetime.combine(today, datetime.max.time())
    
    cancelled_numbers = (
        db.query(CallNumber)
        .filter(
            CallNumber.status == "cancel",
            CallNumber.updated_date >= start_of_day,
            CallNumber.updated_date <= end_of_day
        )
        .order_by(CallNumber.updated_date.asc())
        .all()
    )
    
    result = []
    for call_number in cancelled_numbers:
        result.append({
            "callNumber": call_number.number,
            "id": call_number.id,
            "prefix": call_number.prefix,
            "updated_date": call_number.updated_date.isoformat() if call_number.updated_date else None
        })
    
    return result

@router.post("/call")
def call_number(request_data: dict, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Call a number using TTS and update status to serving"""
    call_number_id = request_data.get("call_number_id")
    language = request_data.get("language", "vietnamese+japanese")
    counter = request_data.get("counter", "1")
    
    if not call_number_id:
        raise HTTPException(status_code=400, detail="call_number_id is required")
    
    # Find the call number
    call_number = db.query(CallNumber).filter(CallNumber.id == call_number_id).first()
    if not call_number:
        raise HTTPException(status_code=404, detail="Call number not found")
    
    # Allow calling numbers with any status - all can be recalled
    # When called, status will be changed to "serving"
    
    call_number.status = "serving"
    call_number.counter = counter
    db.commit()
    db.refresh(call_number)
    
    # Add to TTS queue
    add_to_receive_queue(call_number.number, language, counter)
    
    # Broadcast update via WebSocket
    background_tasks.add_task(broadcast_call_number_update, {
        "type": "call_number_updated",
        "data": {
            "id": call_number.id,
            "number": call_number.number,
            "status": call_number.status,
            "counter": counter
        }
    })
    
    return {
        "message": "Number called successfully",
        "call_number": {
            "id": call_number.id,
            "number": call_number.number,
            "status": call_number.status,
            "counter": counter
        }
    }

async def broadcast_call_number_update(data):
    """Broadcast call number updates to WebSocket clients"""
    try:
        await manager.broadcast(json.dumps(data))
    except Exception as e:
        print(f"Error broadcasting call number update: {e}")

@router.get("/serving")
def get_serving_numbers(db: Session = Depends(get_db)):
    """Get currently serving numbers by counter (today only)"""
    today = date.today()
    serving_numbers = (
        db.query(CallNumber)
        .filter(
            CallNumber.status == "serving",
            func.date(CallNumber.created_date) == today
        )
        .order_by(CallNumber.updated_date.desc())
        .all()
    )
    
    result = {}
    for call_number in serving_numbers:
        counter = call_number.counter or "1"  # Default to counter 1 if not set
        
        if not result.get(counter):
            result[counter] = {
                "id": call_number.id,
                "number": call_number.number,
                "prefix": call_number.prefix,
                "nationality": "Việt Nam" if call_number.prefix == "V" else "Quốc tịch khác",
                "status": call_number.status,
                "counter": counter,
                "updated_date": call_number.updated_date.isoformat() if call_number.updated_date else None
            }
    
    return result

@router.get("/counter/{counter}/status")
def get_counter_status(counter: str, db: Session = Depends(get_db)):
    """Check if a specific counter is currently serving (today only)"""
    today = date.today()
    serving_call = (
        db.query(CallNumber)
        .filter(
            CallNumber.status == "serving",
            CallNumber.counter == counter,
            func.date(CallNumber.created_date) == today
        )
        .first()
    )
    
    return {
        "counter": counter,
        "is_serving": serving_call is not None,
        "serving_number": serving_call.number if serving_call else None
    }
