from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import subprocess
import sys
import os
from typing import Optional

router = APIRouter()

# Test route để debug
@router.get("/test")
async def test_print_route():
    return {"message": "Print route is working!", "status": "OK"}

class PrintRequest(BaseModel):
    number: str
    service_type: str
    timestamp: str
    formatted_date: str
    services: list = []
    prefix: str = ""

def create_thermal_content(data: PrintRequest) -> str:
    """
    Tạo nội dung in cho máy in thermal theo format ESC/POS
    Kích thước giấy: 80mm x 80mm
    """
    content = ""
    
    # ESC/POS commands
    ESC = chr(27)
    INIT = ESC + "@"  # Initialize printer
    CENTER = ESC + "a" + chr(1)  # Center alignment
    LEFT = ESC + "a" + chr(0)  # Left alignment
    BOLD_ON = ESC + "E" + chr(1)  # Bold on
    BOLD_OFF = ESC + "E" + chr(0)  # Bold off
    SMALL_FONT = ESC + "!" + chr(0)  # Normal font
    LARGE_FONT = ESC + "!" + chr(16)  # Double height
    EXTRA_LARGE = ESC + "!" + chr(48)  # Double width + height
    CUT_PAPER = chr(29) + "V" + chr(66) + chr(0)  # Cut paper
    LINE_FEED = "\n"
    
    # Bắt đầu tạo nội dung
    content += INIT  # Initialize
    content += CENTER  # Center alignment
    
    # Header
    content += BOLD_ON + SMALL_FONT
    content += "VIETNAM EMBASSY JAPAN" + LINE_FEED
    content += "=" * 32 + LINE_FEED
    content += BOLD_OFF
    
    # Service info
    content += "Phieu so thu tu" + LINE_FEED
    content += LINE_FEED
    
    # Số thứ tự (lớn nhất)
    content += BOLD_ON + EXTRA_LARGE
    content += data.number + LINE_FEED
    content += BOLD_OFF + SMALL_FONT
    content += LINE_FEED
    
    # Loại dịch vụ
    content += BOLD_ON
    content += data.service_type + LINE_FEED
    content += BOLD_OFF
    content += LINE_FEED
    
    # Thời gian
    content += "-" * 32 + LINE_FEED
    content += data.timestamp + LINE_FEED
    content += data.formatted_date + LINE_FEED
    content += LINE_FEED
    
    # Footer
    content += CENTER
    content += "VNC System" + LINE_FEED
    content += "Xin cam on!" + LINE_FEED
    content += LINE_FEED + LINE_FEED
    
    # Cut paper
    content += CUT_PAPER
    
    return content

@router.post("/print-ticket")
async def print_ticket(request: PrintRequest):
    """
    Endpoint để in phiếu số thứ tự trực tiếp ra máy in thermal
    """
    try:
        # Tạo nội dung in
        thermal_content = create_thermal_content(request)
        
        # Đường dẫn đến script Python
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "scripts", "thermal_print.py")
        
        # Chạy script in
        result = subprocess.run(
            [sys.executable, script_path, thermal_content],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if result.returncode == 0:
            return {
                "success": True,
                "message": "In thành công",
                "stdout": result.stdout
            }
        else:
            return {
                "success": False,
                "message": "Lỗi khi in",
                "error": result.stderr,
                "stdout": result.stdout
            }
            
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=408, detail="Timeout khi in - kiểm tra máy in")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi server: {str(e)}")

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
