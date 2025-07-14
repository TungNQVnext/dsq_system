from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from db.database import get_db
from models.call_number import CallNumber
from pydantic import BaseModel
from sqlalchemy import func
import datetime
import threading
import time
from websocket_backend.ws_handler import manager
import json

router = APIRouter(prefix="/call")

_generation_lock = threading.Lock()
_recent_requests = {}
_request_lock = threading.Lock()

class CallRequest(BaseModel):
    prefix: str

@router.post("/number")
def generate_number(req: CallRequest, request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    request_id = request.headers.get("X-Request-ID", "unknown")
    current_time = time.time()
    
    with _request_lock:
        if request_id in _recent_requests:
            last_time = _recent_requests[request_id]
            if current_time - last_time < 2.0:  
                raise HTTPException(status_code=429, detail="Duplicate request blocked")
        
        _recent_requests[request_id] = current_time
        
        # Cleanup old requests (older than 10 seconds)
        to_remove = [k for k, v in _recent_requests.items() if current_time - v > 10.0]
        for k in to_remove:
            del _recent_requests[k]
    
    prefix = req.prefix.upper()
    if prefix not in ["V", "N"]:
        raise HTTPException(status_code=400, detail="Prefix không hợp lệ")

    today = datetime.date.today()
    now = datetime.datetime.now()
    
    with _generation_lock:
        print(f"Lock acquired for Request-ID: {request_id}")
        
        try:
            # Find the maximum number for this prefix in today only
            max_number_query = db.query(func.max(CallNumber.number)).filter(
                CallNumber.prefix == prefix,
                func.date(CallNumber.created_date) == today
            ).scalar()
            
            if max_number_query:
                last_seq = int(max_number_query[1:])
            else:
                last_seq = 0

            new_seq = last_seq + 1
            new_number = prefix + str(new_seq).zfill(3)
            
            # Kiểm tra xem số này đã tồn tại trong ngày hôm nay chưa
            existing_number = db.query(CallNumber).filter(
                CallNumber.number == new_number,
                func.date(CallNumber.created_date) == today
            ).first()
            
            if existing_number:
                raise HTTPException(status_code=409, detail=f"Số {new_number} đã tồn tại trong ngày hôm nay")
            
            new_call = CallNumber(
                number=new_number,
                prefix=prefix,
                created_date=now,
                status="ready"
            )
            
            db.add(new_call)
            db.commit()
            db.refresh(new_call)
            
            # Prepare broadcast message
            new_call_message = {
                "type": "call_number_updated",
                "data": {
                    "id": new_call.id,
                    "number": new_call.number,
                    "prefix": new_call.prefix,
                    "nationality": "Việt Nam" if new_call.prefix == "V" else "Quốc tịch khác",
                    "status": new_call.status,
                    "created_date": new_call.created_date.isoformat() if new_call.created_date else None,
                    "updated_date": new_call.updated_date.isoformat() if new_call.updated_date else None
                }
            }
            
            # Send broadcast as background task
            background_tasks.add_task(manager.broadcast, json.dumps(new_call_message))
            
            return {"number": new_number}

        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Lỗi tạo số: {str(e)}")
        
        finally:
            print(f"🔓 Lock released for Request-ID: {request_id}")
