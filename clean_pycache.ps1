# PowerShell script để xóa tất cả các thư mục __pycache__
param(
    [string]$Path = $PSScriptRoot
)

Write-Host "🧹 Bắt đầu dọn dẹp các file __pycache__..." -ForegroundColor Green
Write-Host "📁 Thư mục gốc: $Path" -ForegroundColor Cyan
Write-Host ("-" * 50) -ForegroundColor Gray

$removedCount = 0

try {
    # Tìm tất cả các thư mục __pycache__
    $pycacheDirs = Get-ChildItem -Path $Path -Recurse -Directory -Name "__pycache__" -ErrorAction SilentlyContinue
    
    foreach ($dir in $pycacheDirs) {
        $fullPath = Join-Path $Path $dir
        try {
            Remove-Item $fullPath -Recurse -Force
            Write-Host "Đã xóa: $fullPath" -ForegroundColor Yellow
            $removedCount++
        }
        catch {
            Write-Host "Lỗi khi xóa $fullPath : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
catch {
    Write-Host "Lỗi khi tìm kiếm: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ("-" * 50) -ForegroundColor Gray

if ($removedCount -gt 0) {
    Write-Host "✅ Đã xóa thành công $removedCount thư mục __pycache__" -ForegroundColor Green
} else {
    Write-Host "✅ Không tìm thấy thư mục __pycache__ nào" -ForegroundColor Green
}

Write-Host "🎉 Hoàn thành!" -ForegroundColor Green

# Tạm dừng để xem kết quả
if ($Host.Name -eq "ConsoleHost") {
    Write-Host "Nhấn phím bất kỳ để tiếp tục..." -ForegroundColor Cyan
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
