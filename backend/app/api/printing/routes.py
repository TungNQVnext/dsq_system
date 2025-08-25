"""
Printing management routes
"""
from fastapi import APIRouter

from ...schemas.printing import PrinterCheckResponse, ThermalPrintRequest
from ...services.printing_service import PrintingService

router = APIRouter()


@router.get("/test", summary="Test printing route")
async def test_print_route():
    """Test endpoint for printing functionality"""
    return {"message": "Print route is working!", "status": "OK"}


@router.get("/check-printer", response_model=PrinterCheckResponse, summary="Check printer availability")
async def check_printer():
    """Check if printer is available"""
    return PrintingService.check_printer()


@router.post("/thermal-print", summary="Run thermal print")
async def run_thermal_print(request: ThermalPrintRequest):
    """Run thermal print with given content"""
    return PrintingService.run_thermal_print(request.content, request.printer_name)


@router.get("/list-printers", summary="List available printers")
async def list_printers():
    """List all available printers"""
    return PrintingService.list_printers()
