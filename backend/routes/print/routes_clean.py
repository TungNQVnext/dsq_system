from fastapi import APIRouter, HTTPException
import subprocess
import sys
import os

router = APIRouter()

# Test route để debug
@router.get("/test")
async def test_print_route():
    return {"message": "Print route is working!", "status": "OK"}

@router.get("/check-printer")
async def check_printer():
    """
    Kiểm tra máy in có sẵn
    """
    try:
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "thermal_print.py")
        
        # Chạy script chỉ để list printers (không có argument)
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        return {
            "success": True,
            "printers_info": result.stdout,
            "available": "PRP" in result.stdout or "085" in result.stdout
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "available": False
        }
