#!/usr/bin/env python3
import win32print
import sys

def test_printer():
    """Test máy in"""
    try:
        # Lấy danh sách máy in
        printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        
        print(f"Found {len(printers)} printers:")
        for printer in printers:
            print(f"  - {printer}")
            
        # Tìm máy in target
        target_printers = [
            ["PRP-085", "PRP 085"],
            ["TASKalfa", "taskalfa", "task"],
        ]
        
        target_printer = None
        for printer in printers:
            for target_group in target_printers:
                if any(target.lower() in printer.lower() for target in target_group):
                    target_printer = printer
                    break
            if target_printer:
                break
                
        if target_printer:
            print(f"Target printer found: {target_printer}")
            return True
        else:
            print("No target printer found")
            return False
            
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_printer()
