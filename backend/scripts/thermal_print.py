import win32print
import win32api
import sys

def list_all_printers():
    """Liệt kê tất cả máy in có sẵn"""
    try:
        # Local printers
        local_printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL)]
        print(f"Local printers: {local_printers}")
        
        # Network printers  
        network_printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_CONNECTIONS)]
        print(f"Network printers: {network_printers}")
        
        # All printers
        all_printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        print(f"All printers: {all_printers}")
        
        return all_printers
    except Exception as e:
        print(f"Error listing printers: {e}")
        return []

def print_to_thermal(content, printer_name=None):
    """
    In trực tiếp đến máy in thermal
    """
    try:
        # Lấy danh sách máy in
        printers = list_all_printers()
        
        # Tìm máy in PRP 085 hoặc sử dụng default
        if printer_name is None:
            # Tìm máy in có chứa "PRP", "085", hoặc "US"
            target_printer = None
            keywords = ["PRP", "085", "US", "PRP 085"]
            
            for p in printers:
                for keyword in keywords:
                    if keyword.upper() in p.upper():
                        target_printer = p
                        print(f"Found target printer with keyword '{keyword}': {p}")
                        break
                if target_printer:
                    break
            
            if target_printer is None:
                # Sử dụng default printer
                try:
                    target_printer = win32print.GetDefaultPrinter()
                    print(f"Using default printer: {target_printer}")
                except:
                    # Nếu không có default, dùng printer đầu tiên
                    if printers:
                        target_printer = printers[0]
                        print(f"Using first available printer: {target_printer}")
                    else:
                        print("No printers found!")
                        return False
            
            printer_name = target_printer
        
        print(f"Attempting to print to: {printer_name}")
        
        # Mở máy in
        hPrinter = win32print.OpenPrinter(printer_name)
        
        # Tạo job in
        hJob = win32print.StartDocPrinter(hPrinter, 1, ("Ticket Print", None, "RAW"))
        win32print.StartPagePrinter(hPrinter)
        
        # Gửi dữ liệu
        win32print.WritePrinter(hPrinter, content.encode('utf-8'))
        
        # Kết thúc
        win32print.EndPagePrinter(hPrinter)
        win32print.EndDocPrinter(hPrinter)
        win32print.ClosePrinter(hPrinter)
        
        print("Print successful")
        return True
    except Exception as e:
        print(f"Print error: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python thermal_print.py <content>")
        # Chỉ list printers nếu không có content
        list_all_printers()
        sys.exit(1)
    
    content = sys.argv[1]
    success = print_to_thermal(content)
    
    if success:
        print("Print completed successfully")
        sys.exit(0)
    else:
        print("Print failed")
        sys.exit(1)
