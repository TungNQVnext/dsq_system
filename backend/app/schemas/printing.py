"""
Printing management schemas
"""
from pydantic import BaseModel
from typing import Optional, List


class PrinterCheckResponse(BaseModel):
    """Printer availability check response"""
    success: bool
    available: bool
    printers_info: Optional[str] = None
    error: Optional[str] = None


class PrintRequest(BaseModel):
    """Print request schema"""
    number: str
    service_type: str
    timestamp: str
    formatted_date: str
    services: List[str] = []
    prefix: str = ""


class ThermalPrintRequest(BaseModel):
    """Thermal print request"""
    content: str
    printer_name: Optional[str] = None
