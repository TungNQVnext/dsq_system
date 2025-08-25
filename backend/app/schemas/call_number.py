"""
Call number management schemas
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class CallRequest(BaseModel):
    """Request to generate a new call number"""
    prefix: str
    services: List[str] = []


class CallNumberResponse(BaseModel):
    """Call number response schema"""
    id: int
    number: str
    prefix: str
    status: str
    counter: Optional[str] = None
    service_type: Optional[str] = None
    created_date: Optional[datetime] = None
    updated_date: Optional[datetime] = None


class TicketInfoResponse(BaseModel):
    """Ticket information response"""
    number: str
    prefix: str
    service_type: Optional[str] = None
    formatted_date: str
    timestamp: str
