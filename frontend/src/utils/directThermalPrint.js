// Direct thermal printing utility without API
import { API_URL } from "../setting";

/**
 * Format service text để phù hợp với khổ giấy 80mm
 * @param {string} serviceText - Text dịch vụ cần format
 * @param {number} maxWidth - Độ rộng tối đa mỗi dòng
 * @returns {Array} - Mảng các dòng
 */
const formatServiceForPrint = (serviceText, maxWidth = 40) => {
  if (!serviceText) {
    return [""];
  }
  
  // Không thêm "Dịch vụ:" prefix nữa, chỉ format text services
  // Nếu đủ ngắn, return luôn
  if (serviceText.length <= maxWidth) {
    return [serviceText];
  }
  
  // Nếu quá dài, tách thành nhiều dòng
  const services = serviceText.split(', ');
  const lines = [];
  let currentLine = "";
  
  services.forEach((service, index) => {
    const separator = index === 0 ? "" : ", ";
    const testLine = currentLine + separator + service;
    
    if (testLine.length <= maxWidth) {
      currentLine = testLine;
    } else {
      // Dòng hiện tại đã đầy, push và bắt đầu dòng mới
      if (currentLine !== "") {
        lines.push(currentLine);
      }
      
      // Kiểm tra nếu service đơn lẻ vẫn quá dài
      if (service.length <= maxWidth) {
        currentLine = service;
      } else {
        // Service name quá dài, cắt theo từ
        const words = service.split(' ');
        let tempLine = "";
        words.forEach(word => {
          if ((tempLine + " " + word).length <= maxWidth) {
            tempLine += (tempLine === "" ? "" : " ") + word;
          } else {
            if (tempLine !== "") {
              lines.push(tempLine);
            }
            tempLine = word;
          }
        });
        currentLine = tempLine;
      }
    }
  });
  
  // Push dòng cuối
  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }
  
  // Nếu không có dòng nào, return default
  if (lines.length === 0) {
    lines.push(serviceText.substring(0, maxWidth));
  }
  
  return lines;
};

/**
 * Xử lý tiếng Việt có dấu cho máy in thermal PRP-085
 * Chuyển đổi thành dạng mà máy in có thể hiển thị được
 * @param {string} text - Text cần xử lý
 * @returns {string} - Text đã được xử lý
 */
const processVietnameseForPrinter = (text) => {
  if (!text) return text;
  
  // Map các ký tự tiếng Việt có dấu thành ASCII cho máy in PRP-085
  const vietnameseMap = {
    // Chữ thường
    'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    
    'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    
    'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    
    'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    
    'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    
    'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
    
    'đ': 'd',
    
    // Chữ hoa
    'Á': 'A', 'À': 'A', 'Ả': 'A', 'Ã': 'A', 'Ạ': 'A',
    'Ă': 'A', 'Ắ': 'A', 'Ằ': 'A', 'Ẳ': 'A', 'Ẵ': 'A', 'Ặ': 'A',
    'Â': 'A', 'Ấ': 'A', 'Ầ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ậ': 'A',
    
    'É': 'E', 'È': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ẹ': 'E',
    'Ê': 'E', 'Ế': 'E', 'Ề': 'E', 'Ể': 'E', 'Ễ': 'E', 'Ệ': 'E',
    
    'Í': 'I', 'Ì': 'I', 'Ỉ': 'I', 'Ĩ': 'I', 'Ị': 'I',
    
    'Ó': 'O', 'Ò': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ọ': 'O',
    'Ô': 'O', 'Ố': 'O', 'Ồ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ộ': 'O',
    'Ơ': 'O', 'Ớ': 'O', 'Ờ': 'O', 'Ở': 'O', 'Ỡ': 'O', 'Ợ': 'O',
    
    'Ú': 'U', 'Ù': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ụ': 'U',
    'Ư': 'U', 'Ứ': 'U', 'Ừ': 'U', 'Ử': 'U', 'Ữ': 'U', 'Ự': 'U',
    
    'Ý': 'Y', 'Ỳ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y', 'Ỵ': 'Y',
    
    'Đ': 'D'
  };
  
  let result = text;
  for (const [vietnamese, replacement] of Object.entries(vietnameseMap)) {
    result = result.replace(new RegExp(vietnamese, 'g'), replacement);
  }
  
  return result;
};

/**
 * Tạo nội dung in với encoding phù hợp cho PRP-085
 * @param {string} content - Nội dung cần in
 * @returns {string} - Nội dung đã được xử lý
 */
const prepareContentForThermalPrint = (content) => {
  // Đảm bảo content được encode đúng cách
  // PRP-085 hỗ trợ UTF-8, nhưng một số ký tự có thể cần xử lý đặc biệt
  
  return content;
};

/**
 * In trực tiếp bằng cách gọi script Python qua API hoặc local command
 * Ưu tiên PRP-085 (production), fallback TASKalfa (testing)
 * @param {Object} ticketData 
 */
export const printDirectThermal = async (ticketData) => {
  // Kiểm tra trạng thái máy in trước
  try {
    const statusResponse = await fetch(`${API_URL}/printer-status`);
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      if (statusData.available_printers && statusData.available_printers.length > 0) {
        // Available printers detected
      }
    }
  } catch (error) {
    // Could not check printer status
  }
  
  // Tạo nội dung in theo format thermal
  const thermalContent = createThermalContent(ticketData);
  
  try {
    // Thử gọi backend script trực tiếp qua fetch tới backend
    const response = await fetch(`${API_URL}/run-thermal-print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: thermalContent,
        printer_name: null // Auto-select: PRP-085 preferred, TASKalfa fallback
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      // Hiển thị thông tin debug
      if (result.stdout) {
        // Print stdout available
      }
      
      if (result.success) {
        // Print job sent successfully
        setTimeout(() => {
          // Check printer status silently
        }, 1000);
      }
      
      return result.success;
    } else {
      const errorText = await response.text();
      return false;
    }
    
  } catch (error) {
    return false;
  }
};

/**
 * Tạo nội dung in cho máy thermal với ESC/POS commands
 * Tối ưu cho PRP-085 (production) và TASKalfa (testing)
 */
const createThermalContent = (ticketData) => {
  // Detect printer type và tạo content phù hợp
  // PRP-085 là máy in thermal thực sự, cần ESC/POS commands
  const isOfficePrinter = false; // Chuyển về false để sử dụng format thermal cho PRP-085
  
  // Xác định ngôn ngữ dựa trên prefix
  const isVietnamese = ticketData.prefix === 'V';
  const isJapanese = ticketData.prefix === 'N';
  
  if (isOfficePrinter) {
    // Format đơn giản cho máy in office (TASKalfa)
    let content = "";
    
    content += "==========================================\n";
    
    // Tạo thời gian theo ngôn ngữ
    const now = new Date();
    let timestamp, formattedDate;
    
    if (isJapanese) {
      // Format thời gian tiếng Nhật
      timestamp = now.toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      formattedDate = now.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit'
      });
    } else {
      // Dùng thời gian từ ticketData (tiếng Việt)
      timestamp = ticketData.timestamp;
      formattedDate = ticketData.formattedDate;
    }
    
    if (isVietnamese) {
      content += "     ĐẠI SỨ QUÁN VIỆT NAM TẠI NHẬT BẢN\n\n";
      content += "              Phiếu in\n\n\n";
      
      // Số thứ tự TO và ở giữa - sử dụng spacing để tạo hiệu ứng to
      content += `                ${ticketData.number}\n\n`;
      
      // Tên dịch vụ
      content += `           Tên dịch vụ\n`;
      
      // Format loại dịch vụ với xuống dòng nếu cần (chỉ cho Vietnamese)
      const serviceLines = formatServiceForPrint(ticketData.serviceType, 40);
      serviceLines.forEach(line => {
        content += `           ${line}\n`;
      });
      content += "\n";
      
      // Thời gian ngày tháng size nhỏ
      content += `VNEXT -- ${timestamp}   ${formattedDate}\n\n`;
      
      // VNEXT text size nhỏ
      content += "        VNEXT - Hệ thống lấy số tự động\n";
    } else if (isJapanese) {
      content += "     在日ベトナム社会主義共和国大使館\n\n";
      content += "              整理券\n\n\n";
      
      // Số thứ tự TO và ở giữa cho tiếng Nhật - sử dụng spacing
      content += `                ${ticketData.number}\n\n\n`;
      
      // Thời gian ngày tháng size nhỏ cho tiếng Nhật
      content += `VNEXT -- ${timestamp}   ${formattedDate}\n\n`;
      
      // VNEXT text size nhỏ cho tiếng Nhật
      content += "           VNEXT - 整理券発行システム\n";
    } else {
      // Fallback to Vietnamese
      content += "     ĐẠI SỨ QUÁN VIỆT NAM TẠI NHẬT BẢN\n\n";
      content += "              Phiếu in\n\n\n";
      
      // Số thứ tự TO và ở giữa - sử dụng spacing
      content += `                ${ticketData.number}\n\n`;
      
      // Tên dịch vụ
      content += `           Tên dịch vụ\n`;
      
      // Format loại dịch vụ với xuống dòng nếu cần
      const serviceLines = formatServiceForPrint(ticketData.serviceType, 40);
      serviceLines.forEach(line => {
        content += `           ${line}\n`;
      });
      content += "\n";
      
      // Thời gian ngày tháng size nhỏ
      content += `VNEXT -- ${timestamp}   ${formattedDate}\n\n`;
      
      // VNEXT text size nhỏ
      content += "        VNEXT - Hệ thống lấy số tự động\n";
    }
    
    return content;
  } else {
    // ESC/POS commands for thermal printer (PRP-085)
    const ESC = String.fromCharCode(27);
    const GS = String.fromCharCode(29);  // Group Separator for more commands
    const INIT = ESC + "@";  // Initialize
    const CENTER = ESC + "a" + String.fromCharCode(1);  // Center
    const LEFT = ESC + "a" + String.fromCharCode(0);   // Left
    const BOLD_ON = ESC + "E" + String.fromCharCode(1);  // Bold on
    const BOLD_OFF = ESC + "E" + String.fromCharCode(0); // Bold off
    const LARGE_FONT = ESC + "!" + String.fromCharCode(16); // Double height
    const EXTRA_LARGE = ESC + "!" + String.fromCharCode(48); // Double width + height
    const MEGA_LARGE = ESC + "!" + String.fromCharCode(112); // Maximum size (quadruple)
    
    // Thử GS commands cho font size (có thể hiệu quả hơn cho PRP-085)
    const GS_FONT_3X = GS + "!" + String.fromCharCode(34); // 3x width, 3x height
    const GS_FONT_4X = GS + "!" + String.fromCharCode(51); // 4x width, 4x height  
    const GS_FONT_MAX = GS + "!" + String.fromCharCode(68); // Maximum size
    
    const NORMAL_FONT = ESC + "!" + String.fromCharCode(0);  // Normal
    const SMALL_FONT = ESC + "!" + String.fromCharCode(1);   // Small font
    const CUT_PAPER = String.fromCharCode(29) + "V" + String.fromCharCode(66) + String.fromCharCode(0);
    
    /**
     * Tạo số thứ tự to hơn bằng nhiều phương pháp
     * @param {string} number - Số cần in to
     * @returns {string} - Chuỗi ESC/POS với số to
     */
    const createLargeNumber = (number) => {
      // Chỉ sử dụng GS commands cho số to - không lặp lại
      return GS_FONT_MAX + BOLD_ON + number + BOLD_OFF + NORMAL_FONT;
    };
    
    // Tạo thời gian theo ngôn ngữ cho thermal printer
    const now = new Date();
    let timestamp, formattedDate;
    
    if (isJapanese) {
      // Format thời gian ASCII cho máy in PRP-085
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      timestamp = `${hours}:${minutes}`;
      
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      formattedDate = `${year}/${month}/${day}`;
    } else {
      // Dùng thời gian từ ticketData nhưng xử lý để tương thích máy in
      timestamp = ticketData.timestamp;
      formattedDate = processVietnameseForPrinter(ticketData.formattedDate);
    }
    
    let content = "";
    
    // Initialize printer
    content += INIT;
    content += CENTER;
    
    if (isVietnamese) {
      // Header - Vietnamese embassy format
      content += BOLD_ON + LARGE_FONT;
      content += "DAI SU QUAN VIET NAM TAI NHAT BAN\n";
      content += BOLD_OFF + NORMAL_FONT;
      
      content += "\nPhieu in\n\n";
      
      // Số thứ tự với font size CỰC LỚN - sử dụng hàm createLargeNumber
      content += CENTER;
      content += createLargeNumber(ticketData.number);
      content += "\n";
      
      // Tên dịch vụ - cũng căn giữa
      content += CENTER;
      content += NORMAL_FONT;
      content += "Ten dich vu\n";
      
      const serviceLines = formatServiceForPrint(processVietnameseForPrinter(ticketData.serviceType), 32);
      serviceLines.forEach(line => {
        content += CENTER; // Căn giữa từng dòng tên dịch vụ
        content += BOLD_ON + LARGE_FONT;
        content += line + "\n";
        content += BOLD_OFF + NORMAL_FONT;
      });
      content += "\n";
      
      // Thời gian ngày tháng size nhỏ - căn giữa
      content += CENTER;
      content += NORMAL_FONT;
      content += timestamp + "   " + formattedDate + "\n";
      
      // Footer size RẤT NHỎ
      content += CENTER;
      content += SMALL_FONT;
      content += "VNEXT - He thong lay so tu dong\n";
      content += NORMAL_FONT;
      content += "\n";
    } else if (isJapanese) {
      // Header - Japanese format (ASCII cho máy in PRP-085)
      content += BOLD_ON + LARGE_FONT;
      content += "VIETNAM EMBASSY IN JAPAN\n";
      content += BOLD_OFF + NORMAL_FONT;
      
      content += "\nTicket\n\n";
      
      // Số thứ tự với font size CỰC LỚN cho tiếng Nhật - sử dụng hàm createLargeNumber
      content += CENTER;
      content += createLargeNumber(ticketData.number);
      content += "\n";
      
      // Thời gian ngày tháng size nhỏ cho tiếng Nhật - căn giữa
      content += CENTER;
      content += NORMAL_FONT;
      content += timestamp + "   " + formattedDate + "\n";
      
      // Footer size RẤT NHỎ cho tiếng Nhật
      content += CENTER;
      content += SMALL_FONT;
      content += "VNEXT - Ticket System\n";
      content += NORMAL_FONT;
      content += "\n";
    } else {
      // Fallback - Việt Nam với thermal printer
      // Header - Vietnamese embassy format  
      content += BOLD_ON + LARGE_FONT;
      content += "DAI SU QUAN VIET NAM TAI NHAT BAN\n";
      content += BOLD_OFF + NORMAL_FONT;
      
      content += "\nPhieu in\n\n";
      
      // Số thứ tự với font size CỰC LỚN - fallback sử dụng hàm createLargeNumber
      content += CENTER;
      content += createLargeNumber(ticketData.number);
      content += "\n";
      
      // Tên dịch vụ - căn giữa
      content += CENTER;
      content += NORMAL_FONT;
      content += "Ten dich vu\n";
      
      const serviceLines = formatServiceForPrint(processVietnameseForPrinter(ticketData.serviceType), 32);
      serviceLines.forEach(line => {
        content += CENTER; // Căn giữa từng dòng tên dịch vụ
        content += BOLD_ON + LARGE_FONT;
        content += line + "\n";
        content += BOLD_OFF + NORMAL_FONT;
      });
      content += "\n";
      
      // Thời gian ngày tháng size nhỏ - căn giữa
      content += CENTER;
      content += NORMAL_FONT;
      content += timestamp + "   " + formattedDate + "\n";
      
      // Footer size RẤT NHỎ
      content += CENTER;
      content += SMALL_FONT;
      content += "VNEXT - He thong lay so tu dong\n";
      content += NORMAL_FONT;
      content += "\n";
    }
    
    // Cut paper (for thermal printers like PRP-085)
    content += CUT_PAPER;
    
    return content;
  }
};

export default {
  printDirectThermal
};
