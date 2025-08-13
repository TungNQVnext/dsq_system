// Utility functions for print ticket

// Service mapping configuration
const SERVICE_MAP = {
  'visa': 'VISA',
  'passport': 'HỘ CHIẾU',
  'authentication': 'CHỨNG THỰC', 
  'notarization': 'CÔNG CHỨNG',
  'civil_status': 'TÌNH TRẠNG DÂN SỰ',
  'other': 'DỊCH VỤ KHÁC'
};

// Vietnamese day names
const DAY_NAMES = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

// Vietnamese month names
const MONTH_NAMES = ['thg 1', 'thg 2', 'thg 3', 'thg 4', 'thg 5', 'thg 6', 
                     'thg 7', 'thg 8', 'thg 9', 'thg 10', 'thg 11', 'thg 12'];

/**
 * Tạo dữ liệu cho phiếu in
 * @param {string} number - Số thứ tự 
 * @param {Array} services - Danh sách dịch vụ đã chọn
 * @param {string} prefix - Prefix (V hoặc N)
 * @returns {Object} Dữ liệu phiếu in
 */
export const createTicketData = (number, services = [], prefix = '') => {
  const now = new Date();
  
  const dayOfWeek = DAY_NAMES[now.getDay()];
  const day = now.getDate();
  const month = MONTH_NAMES[now.getMonth()];
  const year = now.getFullYear();
  const time = now.toLocaleTimeString('vi-VN', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  
  const formattedDate = `${dayOfWeek}, ${day} ${month}, ${year}`;
  const timestamp = `VNC -- ${time}`;
  
  // Xác định loại dịch vụ dựa trên services array hoặc prefix
  let serviceType = 'VISA'; // Mặc định
  
  if (services && services.length > 0) {
    if (services.length === 1) {
      serviceType = SERVICE_MAP[services[0]] || 'VISA';
    } else {
      serviceType = 'NHIỀU DỊCH VỤ';
    }
  } else if (prefix === 'V') {
    serviceType = 'VISA';
  } else if (prefix === 'N') {
    serviceType = 'GENERAL SERVICE';
  }
  
  return {
    number,
    serviceType,
    timestamp,
    formattedDate,
    services: services || [],
    prefix
  };
};
