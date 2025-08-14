// Utility functions for print ticket

// Service mapping configuration - cập nhật theo serviceUtils.js
const SERVICE_MAP = {
  'visa': 'VISA',
  'passport': 'Hộ chiếu',
  'birth': 'Khai sinh',
  'marriage': 'Kết hôn', 
  'license': 'Bằng lái xe',
  'others': 'Các thủ tục khác',
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
  const timestamp = `${time}`;
  
  // Xác định loại dịch vụ dựa trên services array hoặc prefix
  let serviceType = 'VISA'; // Mặc định
  
  console.log('[DEBUG] createTicketData - services:', services);
  console.log('[DEBUG] createTicketData - prefix:', prefix);
  
  if (services && services.length > 0) {
    console.log('[DEBUG] Processing services array:', services);
    if (services.length === 1) {
      serviceType = SERVICE_MAP[services[0]] || services[0];
      console.log('[DEBUG] Single service mapped:', services[0], '->', serviceType);
    } else {
      // Việt Nam: Hiển thị tất cả dịch vụ đã chọn
      if (prefix === 'V') {
        const serviceNames = services.map(service => {
          const mapped = SERVICE_MAP[service] || service;
          console.log('[DEBUG] Service mapping:', service, '->', mapped);
          return mapped;
        }).filter(Boolean);
        serviceType = serviceNames.join(', ');
        console.log('[DEBUG] Multiple services for Vietnam:', serviceType);
      } else {
        serviceType = 'NHIỀU DỊCH VỤ';
        console.log('[DEBUG] Multiple services for non-Vietnam:', serviceType);
      }
    }
  } else if (prefix === 'V') {
    serviceType = 'VISA';
  } else if (prefix === 'N') {
    serviceType = 'GENERAL SERVICE';
  }
  
  console.log('[DEBUG] Final serviceType:', serviceType);
  
  return {
    number,
    serviceType,
    timestamp,
    formattedDate,
    services: services || [],
    prefix
  };
};
