"""
Call number management routes
"""
from fastapi import APIRouter, Depends, Request, BackgroundTasks
from sqlalchemy.orm import Session

from ...config.database import get_db
from ...schemas.call_number import CallRequest
from ...services.call_number_service import CallNumberService

router = APIRouter()


@router.post("/generate", summary="Generate new call number")
def generate_number(
    req: CallRequest, 
    request: Request, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    """Generate a new call number"""
    request_id = request.headers.get("X-Request-ID", "unknown")
    return CallNumberService.generate_number(req, request_id, background_tasks, db)


@router.get("/ticket-info/{number}", summary="Get ticket information")
def get_ticket_info(number: str, db: Session = Depends(get_db)):
    """Get ticket information for a specific call number"""
    return CallNumberService.get_ticket_info(number, db)
