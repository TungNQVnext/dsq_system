import win32print
import win32api
import win32con
import win32gui
import win32process
import sys
import socket
import time
import tempfile
import os
import subprocess

def list_all_printers():
    """Liệt kê tất cả máy in có sẵn"""
    try:
        # Local printers
        local_printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL)]
        
        # Network printers  
        network_printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_CONNECTIONS)]
        
        # All printers
        all_printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        
        return all_printers
    except Exception as e:
        print(f"Error listing printers: {e}")
        return []

def find_target_printer(printers):
    """Tìm máy in mục tiêu theo thứ tự ưu tiên"""
    # Thứ tự ưu tiên tìm kiếm - ưu tiên TASKalfa cho testing WiFi
    priority_keywords = [
        ["TASKalfa", "TASK"],       # Máy in WiFi hiện tại cho testing
        ["PRP-085", "PRP 085"],      # Máy in chính cho production  
        ["PRP-058US", "PRP 058US"],  # Máy in thermal khác
        ["PRP", "058", "US", "085"], # Từ khóa model PRP
        ["thermal", "receipt"],      # Loại máy in thermal
        ["80mm", "58mm"],           # Kích thước giấy
        ["USB", "WiFi", "Network"],  # Kết nối
        ["Epson", "Star", "Citizen", "Bixolon"], # Thương hiệu thermal phổ biến
    ]
    
    for keywords in priority_keywords:
        for printer in printers:
            for keyword in keywords:
                if keyword.upper() in printer.upper():
                    return printer
    
    return None

def print_via_silent_notepad(content, printer_name):
    """In hoàn toàn im lặng bằng notepad với /p parameter"""
    try:
        # Tạo temp file với extension .txt và UTF-8-BOM để hỗ trợ tiếng Nhật
        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt', encoding='utf-8-sig') as temp_file:
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        # Set printer tạm thời
        current_default = win32print.GetDefaultPrinter()
        win32print.SetDefaultPrinter(printer_name)
        
        # In bằng notepad với /p (print và đóng ngay)
        # Sử dụng subprocess với STARTUPINFO để ẩn cửa sổ
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = win32con.SW_HIDE
        
        notepad_cmd = ['notepad.exe', '/p', temp_file_path]
        
        process = subprocess.Popen(
            notepad_cmd,
            startupinfo=startupinfo,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        
        # Chờ notepad hoàn thành việc in
        process.wait(timeout=15)  # Tăng timeout cho in tiếng Nhật
        
        # Wait thêm cho print spooler
        time.sleep(3)  # Tăng thời gian chờ cho in tiếng Nhật
        
        # Restore default printer
        win32print.SetDefaultPrinter(current_default)
        
        # Cleanup
        try:
            time.sleep(1)
            os.unlink(temp_file_path)
        except Exception as cleanup_error:
            pass
        
        return True
        
    except Exception as e:
        print(f"Silent notepad print error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

def print_via_raw_data(content, printer_name):
    """In qua raw data cho máy in thermal như PRP-085"""
    try:
        # Kiểm tra printer có sẵn không
        try:
            printer_info = win32print.GetPrinter(win32print.OpenPrinter(printer_name), 2)
        except Exception as e:
            pass
        
        # Mở máy in với retry logic
        max_retries = 3
        for attempt in range(max_retries):
            try:
                hPrinter = win32print.OpenPrinter(printer_name)
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                time.sleep(1)
        
        try:
            # Tạo print job với thông tin chi tiết
            job_info = (f"DSQ Ticket Print", None, "RAW")
            job_id = win32print.StartDocPrinter(hPrinter, 1, job_info)
            
            # Bắt đầu page
            win32print.StartPagePrinter(hPrinter)
            
            # Gửi dữ liệu 
            content_bytes = content.encode('utf-8')
            bytes_written = win32print.WritePrinter(hPrinter, content_bytes)
            
            # Kết thúc job
            win32print.EndPagePrinter(hPrinter)
            win32print.EndDocPrinter(hPrinter)
            
        finally:
            # Đảm bảo đóng printer handle
            win32print.ClosePrinter(hPrinter)
        
        return True
        
    except Exception as e:
        print(f"Raw data print error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

def print_to_thermal(content, printer_name=None):
    """
    In trực tiếp đến máy in thermal hoặc office printer
    Hỗ trợ PRP-085 USB và TASKalfa WiFi (SILENT MODE)
    """
    try:
        # Lấy danh sách máy in
        printers = list_all_printers()
        
        if printer_name is None:
            # Tìm máy in target theo thứ tự ưu tiên
            target_printer = find_target_printer(printers)
            
            if target_printer is None:
                # Sử dụng default printer
                try:
                    target_printer = win32print.GetDefaultPrinter()
                except:
                    # Nếu không có default, dùng printer đầu tiên
                    if printers:
                        target_printer = printers[0]
                    else:
                        print("No printers found!")
                        return False
            
            printer_name = target_printer
        
        # Kiểm tra nếu là máy in TASKalfa -> dùng silent notepad
        if "taskalfa" in printer_name.lower() or "task" in printer_name.lower():
            return print_via_silent_notepad(content, printer_name)
        else:
            return print_via_raw_data(content, printer_name)
        
    except Exception as e:
        print(f"Print error: {e}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python thermal_print_silent.py <content> or python thermal_print_silent.py @<file_path> or python thermal_print_silent.py --check")
        # Chỉ list printers nếu không có content
        list_all_printers()
        sys.exit(1)
    
    content_arg = sys.argv[1]
    
    # Kiểm tra nếu argument là --check thì chỉ kiểm tra máy in
    if content_arg == "--check":
        printers = list_all_printers()
        target_printer = find_target_printer(printers)
        
        if target_printer:
            print(f"Printer found: {target_printer}")
            print(f"Available printers: {', '.join(printers)}")
            sys.exit(0)
        else:
            print("No target printer found")
            print(f"Available printers: {', '.join(printers)}")
            sys.exit(1)
    
    # Kiểm tra nếu argument bắt đầu với @ thì đọc từ file
    if content_arg.startswith('@'):
        file_path = content_arg[1:]
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            print(f"Read content from file: {file_path}")
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            sys.exit(1)
    else:
        content = content_arg
    
    success = print_to_thermal(content)
    
    if success:
        print("Print completed successfully (SILENT MODE)")
        sys.exit(0)
    else:
        print("Print failed")
        sys.exit(1)
