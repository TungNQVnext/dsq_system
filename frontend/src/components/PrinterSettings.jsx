import { useState, useEffect } from 'react';
import { printDirectThermal } from '../utils/directThermalPrint';
import { createTicketData } from '../utils/printUtils';
import { API_URL } from '../setting';

const PrinterSettings = () => {
  const [printerStatus, setPrinterStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testPrinting, setTestPrinting] = useState(false);

  const checkPrinter = async () => {
    setLoading(true);
    try {
      // Sử dụng API kiểm tra máy in
      const response = await fetch(`${API_URL}/print/check-printer`);
      const status = await response.json();
      setPrinterStatus(status);
    } catch (error) {
      console.error('Error checking printer:', error);
      setPrinterStatus({
        success: false,
        error: error.message,
        available: false
      });
    }
    setLoading(false);
  };

  const testPrint = async () => {
    setTestPrinting(true);
    try {
      // Tạo dữ liệu test
      const testTicket = createTicketData(
        "TEST001", 
        ["visa"], 
        "V"
      );
      
      const success = await printDirectThermal(testTicket);
      
      if (success) {
        alert("✓ In thử nghiệm thành công!");
      } else {
        alert("✗ In thử nghiệm thất bại!");
      }
    } catch (error) {
      console.error('Test print error:', error);
      alert("✗ Lỗi khi in thử nghiệm!");
    }
    setTestPrinting(false);
  };

  useEffect(() => {
    checkPrinter();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      margin: '10px 0',
      backgroundColor: '#f9f9f9'
    }}>
      <h3>Cài đặt máy in Thermal</h3>
      
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={checkPrinter} 
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'wait' : 'pointer'
          }}
        >
          {loading ? 'Đang kiểm tra...' : 'Kiểm tra máy in'}
        </button>
      </div>

      {printerStatus && (
        <div style={{ marginBottom: '15px' }}>
          <h4>Trạng thái máy in:</h4>
          <div style={{
            padding: '10px',
            backgroundColor: printerStatus.available ? '#d4edda' : '#f8d7da',
            border: `1px solid ${printerStatus.available ? '#c3e6cb' : '#f5c6cb'}`,
            borderRadius: '4px',
            color: printerStatus.available ? '#155724' : '#721c24'
          }}>
            <strong>
              {printerStatus.available ? '✓ Máy in sẵn sàng' : '✗ Không tìm thấy máy in thermal'}
            </strong>
            {printerStatus.printers_info && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer' }}>Chi tiết máy in</summary>
                <pre style={{ 
                  fontSize: '12px', 
                  backgroundColor: 'white', 
                  padding: '10px',
                  marginTop: '5px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  overflow: 'auto'
                }}>
                  {printerStatus.printers_info}
                </pre>
              </details>
            )}
          </div>
        </div>
      )}

      <div>
        <button 
          onClick={testPrint}
          disabled={testPrinting || !printerStatus?.available}
          style={{
            padding: '8px 16px',
            backgroundColor: printerStatus?.available ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (testPrinting || !printerStatus?.available) ? 'not-allowed' : 'pointer'
          }}
        >
          {testPrinting ? 'Đang in...' : 'In thử nghiệm'}
        </button>
      </div>

      <div style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
        <strong>Lưu ý:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li>Hỗ trợ máy in PRP-058US qua USB hoặc WiFi</li>
          <li>Kích thước giấy: 80mm x 80mm tối đa</li>
          <li>Tự động in sau khi lấy số thứ tự</li>
          <li>Fallback sang browser print nếu thermal printer không khả dụng</li>
        </ul>
      </div>
    </div>
  );
};

export default PrinterSettings;