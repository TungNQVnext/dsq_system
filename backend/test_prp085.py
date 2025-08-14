#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script cho máy in PRP-085 USB
"""
import win32print
import sys
import os

def list_all_printers():
    """Liệt kê tất cả máy in có sẵn"""
    try:
        # Local printers
        local_printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL)]
        
        # Network printers  
        network_printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_CONNECTIONS)]
        
        # All printers
        all_printers = [printer[2] for printer in win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        
        print("=== DANH SÁCH MÁY IN ===")
        print(f"Tổng số máy in: {len(all_printers)}")
        print()
        
        for i, printer in enumerate(all_printers, 1):
            print(f"{i}. {printer}")
            
            # Kiểm tra PRP-085
            if "PRP" in printer.upper() and "085" in printer:
                print(f"   *** PHÁT HIỆN PRP-085: {printer} ***")
                
        return all_printers
    except Exception as e:
        print(f"Error listing printers: {e}")
        return []

def find_prp085():
    """Tìm máy in PRP-085"""
    printers = list_all_printers()
    
    # Tìm PRP-085 specific
    for printer in printers:
        if "PRP" in printer.upper() and ("085" in printer or "85" in printer):
            print(f"\n=== TÌM THẤY PRP-085: {printer} ===")
            return printer
            
    print("\n=== KHÔNG TÌM THẤY PRP-085 ===")
    return None

def test_print_simple(printer_name):
    """Test in đơn giản"""
    try:
        print(f"Đang test in với máy: {printer_name}")
        
        hPrinter = win32print.OpenPrinter(printer_name)
        
        try:
            # Tạo job in
            job_info = ("VNEXT Test Print", None, "RAW")
            job_id = win32print.StartDocPrinter(hPrinter, 1, job_info)
            
            # Bắt đầu page
            win32print.StartPagePrinter(hPrinter)
            
            # Nội dung test đơn giản
            test_content = """
TEST PRINT PRP-085

DAI SU QUAN VIET NAM TAI NHAT BAN

Phieu in

035

Ten dich vu
VISA

VNEXT -- 14:30   Thu Nam, 7 thg 8, 2025

VNEXT - He thong lay so tu dong


"""
            
            # Gửi dữ liệu
            data = test_content.encode('utf-8', errors='replace')
            bytes_written = win32print.WritePrinter(hPrinter, data)
            print(f"Đã gửi {bytes_written} bytes tới máy in")
            
            # Kết thúc job
            win32print.EndPagePrinter(hPrinter)
            win32print.EndDocPrinter(hPrinter)
            
            print("✓ Test in thành công!")
            return True
            
        finally:
            win32print.ClosePrinter(hPrinter)
            
    except Exception as e:
        print(f"✗ Lỗi test in: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=== TEST MÁY IN PRP-085 ===\n")
    
    # Liệt kê tất cả máy in
    printers = list_all_printers()
    
    if not printers:
        print("Không tìm thấy máy in nào!")
        sys.exit(1)
        
    # Tìm PRP-085
    prp085 = find_prp085()
    
    if prp085:
        print(f"\nBắt đầu test in với {prp085}...")
        success = test_print_simple(prp085)
        
        if success:
            print("\n🎉 PRP-085 hoạt động bình thường!")
        else:
            print("\n❌ PRP-085 có vấn đề!")
    else:
        print("\n⚠️  Không tìm thấy máy in PRP-085.")
        print("Vui lòng kiểm tra:")
        print("1. Máy in đã được cài đặt driver")
        print("2. Máy in đã được kết nối USB")
        print("3. Tên máy in có chứa 'PRP' và '085'")
        
        if printers:
            print(f"\nCó thể thử với máy in đầu tiên: {printers[0]}")
            choice = input("Có muốn test với máy in đầu tiên không? (y/n): ")
            if choice.lower() == 'y':
                test_print_simple(printers[0])
