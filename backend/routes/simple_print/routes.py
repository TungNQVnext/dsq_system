from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import sys
import os
import tempfile

router = APIRouter()

class ThermalPrintRequest(BaseModel):
    content: str
    printer_name: str = None

@router.post("/run-thermal-print")
async def run_thermal_print(request: ThermalPrintRequest):
    """
    Endpoint đơn giản để chạy thermal print script
    """
    try:
        # Đường dẫn tới script
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "thermal_print.py")
        
        # Chạy script với content
        result = subprocess.run(
            [sys.executable, script_path, request.content],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        success = result.returncode == 0
        
        return {
            "success": success,
            "message": "Print completed" if success else "Print failed",
            "stdout": result.stdout,
            "stderr": result.stderr if not success else ""
        }
        
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Print timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Print error: {str(e)}")

@router.get("/list-printers")
async def list_printers():
    """
    Liệt kê máy in có sẵn
    """
    try:
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "thermal_print.py")
        
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        return {
            "success": True,
            "printers_output": result.stdout
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
