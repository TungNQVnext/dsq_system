"""
Printing service layer
"""
import subprocess
import sys
import os
from fastapi import HTTPException


class PrintingService:
    """Service for handling printing operations"""
    
    @staticmethod
    def check_printer() -> dict:
        """Check if printer is available"""
        try:
            script_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                "scripts", 
                "thermal_print.py"
            )
            
            # Run script to list printers (no arguments)
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
    
    @staticmethod
    def run_thermal_print(content: str, printer_name: str = None) -> dict:
        """Run thermal print with given content"""
        try:
            # Get script path
            script_path = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                "scripts", 
                "thermal_print_silent.py"
            )
            
            # Prepare command
            cmd = [sys.executable, script_path, content]
            if printer_name:
                cmd.append(printer_name)
            
            # Run printing script
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0:
                return {
                    "success": True,
                    "message": "Print completed successfully",
                    "output": result.stdout
                }
            else:
                return {
                    "success": False,
                    "error": result.stderr or "Print failed",
                    "output": result.stdout
                }
                
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=408, detail="Print timeout")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Print error: {str(e)}")
    
    @staticmethod
    def list_printers() -> dict:
        """List available printers"""
        try:
            # This would typically query the system for available printers
            # For now, return a simple implementation
            result = subprocess.run(
                ["wmic", "printer", "get", "name"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                printers = [line.strip() for line in result.stdout.split('\n') 
                           if line.strip() and line.strip() != 'Name']
                return {
                    "success": True,
                    "printers": printers
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to list printers",
                    "printers": []
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "printers": []
            }
