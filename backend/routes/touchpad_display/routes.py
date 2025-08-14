from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from db.database import get_db
from models.call_number import CallNumber
from pydantic import BaseModel
from sqlalchemy import func
from typing import List, Optional
import datetime
import threading
import time
from websocket_backend.return_number.ws_handler import manager
import json

router = APIRouter(prefix="/call")

_generation_lock = threading.Lock()
_recent_requests = {}
_request_lock = threading.Lock()

class CallRequest(BaseModel):
    prefix: str
    services: List[str] = []  # List of selected service IDs

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

@router.get("/ticket-info/{number}")
def get_ticket_info(number: str, db: Session = Depends(get_db)):
    """
    Lấy thông tin phiếu in cho một số thứ tự cụ thể
    """
    today = datetime.date.today()

    call_number = db.query(CallNumber).filter(
        CallNumber.number == number.upper(),
        func.date(CallNumber.created_date) == today
    ).first()
    
    if not call_number:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy số {number} trong ngày hôm nay")

    service_map = {
        'visa': 'VISA',
        'passport': 'Hộ chiếu',
        'birth': 'Khai sinh',
        'marriage': 'Kết hôn', 
        'license': 'Bằng lái xe',
        'others': 'Các thủ tục khác',
        'authentication': 'CHỨNG THỰC', 
        'notarization': 'CÔNG CHỨNG',
        'civil_status': 'TÌNH TRẠNG DÂN SỰ',
        'other': 'DỊCH VỤ KHÁC'
    }
    
    service_type = 'VISA'
    if call_number.service_type:
        services = call_number.service_type.split(',')
        if len(services) == 1:
            service_type = service_map.get(services[0], 'VISA')
        else:
            # Việt Nam: Hiển thị tất cả dịch vụ đã chọn
            if call_number.prefix == 'V':
                service_names = [service_map.get(service.strip(), service.strip()) for service in services]
                service_type = ', '.join(service_names)
            else:
                service_type = 'NHIỀU DỊCH VỤ'
    elif call_number.prefix == 'V':
        service_type = 'VISA'
    elif call_number.prefix == 'N':
        service_type = 'GENERAL SERVICE'

    created_time = call_number.created_date
    day_names = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
    month_names = ['thg 1', 'thg 2', 'thg 3', 'thg 4', 'thg 5', 'thg 6',
                   'thg 7', 'thg 8', 'thg 9', 'thg 10', 'thg 11', 'thg 12']
    
    day_of_week = day_names[created_time.weekday() + 1] if created_time.weekday() < 6 else day_names[0]
    day = created_time.day
    month = month_names[created_time.month - 1]
    year = created_time.year
    time_str = created_time.strftime('%H:%M:%S')
    
    formatted_date = f"{day_of_week}, {day} {month}, {year}"
    timestamp = f"{time_str}"
    
    return {
        "number": call_number.number,
        "prefix": call_number.prefix,
        "service_type": service_type,
        "services": call_number.service_type.split(',') if call_number.service_type else [],
        "timestamp": timestamp,
        "formatted_date": formatted_date,
        "created_date": call_number.created_date.isoformat(),
        "status": call_number.status
    }
