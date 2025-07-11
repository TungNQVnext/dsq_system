#!/usr/bin/env python3
"""
Script để xóa tất cả các thư mục __pycache__ trong dự án
"""
import os
import shutil
import sys

def find_and_remove_pycache(root_dir):
    """
    Tìm và xóa tất cả các thư mục __pycache__ trong thư mục gốc
    """
    removed_count = 0
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Tạo một bản sao của dirnames để có thể thay đổi trong vòng lặp
        dirs_to_remove = []
        
        for dirname in dirnames:
            if dirname == "__pycache__":
                full_path = os.path.join(dirpath, dirname)
                try:
                    shutil.rmtree(full_path)
                    print(f"Đã xóa: {full_path}")
                    removed_count += 1
                    dirs_to_remove.append(dirname)
                except Exception as e:
                    print(f"Lỗi khi xóa {full_path}: {e}")
        
        # Loại bỏ các thư mục đã xóa khỏi dirnames để tránh lỗi
        for dirname in dirs_to_remove:
            dirnames.remove(dirname)
    
    return removed_count

def main():
    """
    Hàm chính
    """
    # Lấy thư mục gốc của dự án (thư mục chứa script này)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("🧹 Bắt đầu dọn dẹp các file __pycache__...")
    print(f"📁 Thư mục gốc: {script_dir}")
    print("-" * 50)
    
    # Xóa tất cả các thư mục __pycache__
    removed_count = find_and_remove_pycache(script_dir)
    
    print("-" * 50)
    if removed_count > 0:
        print(f"✅ Đã xóa thành công {removed_count} thư mục __pycache__")
    else:
        print("✅ Không tìm thấy thư mục __pycache__ nào")
    
    print("🎉 Hoàn thành!")

if __name__ == "__main__":
    main()
