"""
Call number service layer
"""
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, BackgroundTasks
import datetime
import threading
import time
import json

from ..models.call_number import CallNumber
from ..schemas.call_number import CallRequest
from ..websocket_backend.return_number.ws_handler import manager

# Thread locks for number generation
_generation_lock = threading.Lock()
_recent_requests = {}
_request_lock = threading.Lock()


class CallNumberService:
    """Service for managing call numbers"""
    
    @staticmethod
    def generate_number(
        req: CallRequest, 
        request_id: str, 
        background_tasks: BackgroundTasks, 
        db: Session
    ) -> dict:
        """Generate a new call number"""
        current_time = time.time()
        
        # Duplicate request prevention
        with _request_lock:
            if request_id in _recent_requests:
                last_time = _recent_requests[request_id]
                if current_time - last_time < 2.0:  
                    raise HTTPException(status_code=429, detail="Duplicate request blocked")
            
            _recent_requests[request_id] = current_time
            
            # Clean old requests
            to_remove = [k for k, v in _recent_requests.items() if current_time - v > 10.0]
            for k in to_remove:
                del _recent_requests[k]
        
        prefix = req.prefix.upper()
        if prefix not in ["V", "N"]:
            raise HTTPException(status_code=400, detail="Prefix không hợp lệ")

        today = datetime.date.today()
        now = datetime.datetime.now()
        
        with _generation_lock:
            try:
                # Get max number for today
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
                
                # Check if number already exists
                existing_number = db.query(CallNumber).filter(
                    CallNumber.number == new_number,
                    func.date(CallNumber.created_date) == today
                ).first()
                
                if existing_number:
                    raise HTTPException(status_code=409, detail=f"Số {new_number} đã tồn tại trong ngày hôm nay")
                
                service_type = ",".join(req.services) if req.services else None
                
                new_call = CallNumber(
                    number=new_number,
                    prefix=prefix,
                    created_date=now,
                    status="ready",
                    service_type=service_type
                )
                
                db.add(new_call)
                db.commit()
                db.refresh(new_call)
                
                # Broadcast websocket message
                new_call_message = {
                    "type": "call_number_updated",
                    "data": {
                        "id": new_call.id,
                        "number": new_call.number,
                        "prefix": new_call.prefix,
                        "nationality": "Việt Nam" if new_call.prefix == "V" else "Quốc tịch khác",
                        "status": new_call.status,
                        "service_type": new_call.service_type,
                        "created_date": new_call.created_date.isoformat() if new_call.created_date else None,
                        "updated_date": new_call.updated_date.isoformat() if new_call.updated_date else None
                    }
                }
                
                background_tasks.add_task(manager.broadcast, json.dumps(new_call_message))
                
                return {"number": new_number}

            except Exception as e:
                db.rollback()
                raise HTTPException(status_code=500, detail=f"Lỗi tạo số: {str(e)}")
    
    @staticmethod
    def get_ticket_info(number: str, db: Session) -> dict:
        """Get ticket information for printing"""
        today = datetime.date.today()
        
        call_number = db.query(CallNumber).filter(
            CallNumber.number == number.upper(),
            func.date(CallNumber.created_date) == today
        ).first()
        
        if not call_number:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy số {number} trong ngày hôm nay")
        
        # Format date and time using helpers
        from ..utils.helpers import format_datetime_vietnamese, format_service_type, parse_services_list
        
        formatted_date, timestamp = format_datetime_vietnamese(call_number.created_date)
        service_type = format_service_type(call_number.service_type, call_number.prefix)
        
        return {
            "number": call_number.number,
            "prefix": call_number.prefix,
            "service_type": service_type,
            "services": parse_services_list(call_number.service_type),
            "timestamp": timestamp,
            "formatted_date": formatted_date,
            "created_date": call_number.created_date.isoformat(),
            "status": call_number.status
        }
