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
    return ["Dịch vụ: "];
  }
  
  const fullText = `Dịch vụ: ${serviceText}`;
  
  // Nếu đủ ngắn, return luôn
  if (fullText.length <= maxWidth) {
    return [fullText];
  }
  
  // Nếu quá dài, tách thành nhiều dòng
  const services = serviceText.split(', ');
  const lines = [];
  let currentLine = "Dịch vụ: ";
  
  services.forEach((service, index) => {
    const separator = index === 0 ? "" : ", ";
    const testLine = currentLine + separator + service;
    
    if (testLine.length <= maxWidth) {
      currentLine = testLine;
    } else {
      // Dòng hiện tại đã đầy, push và bắt đầu dòng mới
      if (currentLine !== "Dịch vụ: ") {
        lines.push(currentLine);
      }
      
      // Kiểm tra nếu service đơn lẻ vẫn quá dài
      const newLine = "      " + service;
      if (newLine.length <= maxWidth) {
        currentLine = newLine;
      } else {
        // Service name quá dài, cắt theo từ
        const words = service.split(' ');
        let tempLine = "      ";
        words.forEach(word => {
          if ((tempLine + " " + word).length <= maxWidth) {
            tempLine += (tempLine === "      " ? "" : " ") + word;
          } else {
            if (tempLine !== "      ") {
              lines.push(tempLine);
            }
            tempLine = "      " + word;
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
    lines.push("Dịch vụ: " + serviceText.substring(0, maxWidth - 6));
  }
  
  return lines;
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
  const isOfficePrinter = true; // Tạm thời dùng format office cho TASKalfa
  
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
      content += "              PHIẾU SỐ THỨ TỰ\n\n\n";
      
      // Số thứ tự TO và ở giữa - sử dụng spacing để tạo hiệu ứng to
      content += `                ${ticketData.number}\n\n\n`;
      
      // Format loại dịch vụ với xuống dòng nếu cần (chỉ cho Vietnamese)
      const serviceLines = formatServiceForPrint(ticketData.serviceType, 40);
      serviceLines.forEach(line => {
        content += `${line}\n`;
      });
      content += "\n";
      
      // Thời gian ngày tháng size nhỏ
      content += `${timestamp}   ${formattedDate}\n\n`;
      
      // VNEXT text size nhỏ
      content += "        VNEXT - Hệ thống lấy số tự động\n";
    } else if (isJapanese) {
      content += "     在日ベトナム社会主義共和国大使館\n\n";
      content += "              整理券\n\n\n";
      
      // Số thứ tự TO và ở giữa cho tiếng Nhật - sử dụng spacing
      content += `                ${ticketData.number}\n\n\n`;
      
      // Thời gian ngày tháng size nhỏ cho tiếng Nhật
      content += `${timestamp}   ${formattedDate}\n\n`;
      
      // VNEXT text size nhỏ cho tiếng Nhật
      content += "           VNEXT - 整理券発行システム\n";
    } else {
      // Fallback to Vietnamese
      content += "     ĐẠI SỨ QUÁN VIỆT NAM TẠI NHẬT BẢN\n\n";
      content += "              PHIẾU SỐ THỨ TỰ\n\n\n";
      
      // Số thứ tự TO và ở giữa - sử dụng spacing
      content += `                ${ticketData.number}\n\n\n`;
      
      // Format loại dịch vụ với xuống dòng nếu cần
      const serviceLines = formatServiceForPrint(ticketData.serviceType, 40);
      serviceLines.forEach(line => {
        content += `         ${line}\n`;
      });
      content += "\n";
      
      // Thời gian ngày tháng size nhỏ
      content += `${timestamp}   ${formattedDate}\n\n`;
      
      // VNEXT text size nhỏ
      content += "        VNEXT - Hệ thống lấy số tự động\n";
    }
    
    return content;
  } else {
    // ESC/POS commands for thermal printer (PRP-085)
    const ESC = String.fromCharCode(27);
    const INIT = ESC + "@";  // Initialize
    const CENTER = ESC + "a" + String.fromCharCode(1);  // Center
    const LEFT = ESC + "a" + String.fromCharCode(0);   // Left
    const BOLD_ON = ESC + "E" + String.fromCharCode(1);  // Bold on
    const BOLD_OFF = ESC + "E" + String.fromCharCode(0); // Bold off
    const LARGE_FONT = ESC + "!" + String.fromCharCode(16); // Double height
    const EXTRA_LARGE = ESC + "!" + String.fromCharCode(48); // Double width + height
    const MEGA_LARGE = ESC + "!" + String.fromCharCode(112); // Maximum size (quadruple)
    const NORMAL_FONT = ESC + "!" + String.fromCharCode(0);  // Normal
    const CUT_PAPER = String.fromCharCode(29) + "V" + String.fromCharCode(66) + String.fromCharCode(0);
    
    let content = "";
    
    // Initialize printer
    content += INIT;
    content += CENTER;
    
    if (isVietnamese) {
      // Header - Vietnamese embassy format
      content += BOLD_ON + LARGE_FONT;
      content += "ĐẠI SỨ QUÁN VIỆT NAM TẠI NHẬT BẢN\n";
      content += BOLD_OFF + NORMAL_FONT;
      
      content += "\nPhiếu Số Thứ Tự\n\n\n";
      
      // Số thứ tự với font size LỚN NHẤT có thể
      content += BOLD_ON + MEGA_LARGE;
      content += ticketData.number + "\n";
      content += BOLD_OFF + NORMAL_FONT;
      content += "\n\n";
      
      const serviceLines = formatServiceForPrint(ticketData.serviceType, 32); // Thermal printer narrower
      serviceLines.forEach(line => {
        content += BOLD_ON + LARGE_FONT;
        content += line + "\n";
        content += BOLD_OFF + NORMAL_FONT;
      });
      content += "\n";
      
      // Thời gian ngày tháng size nhỏ
      content += NORMAL_FONT;
      content += timestamp + "   " + formattedDate + "\n\n";
      
      // Footer size nhỏ
      content += CENTER;
      content += "VNEXT - Hệ thống lấy số tự động\n";
      content += "\n\n";
    } else if (isJapanese) {
      // Header - Japanese format
      content += BOLD_ON + LARGE_FONT;
      content += "在日ベトナム社会主義共和国大使館\n";
      content += BOLD_OFF + NORMAL_FONT;
      
      content += "\n整理券\n\n\n";
      
      // Số thứ tự với font size LỚN NHẤT cho tiếng Nhật
      content += BOLD_ON + MEGA_LARGE;
      content += ticketData.number + "\n";
      content += BOLD_OFF + NORMAL_FONT;
      content += "\n\n";
      
      // Thời gian ngày tháng size nhỏ cho tiếng Nhật
      content += NORMAL_FONT;
      content += timestamp + "   " + formattedDate + "\n\n";
      
      // Footer size nhỏ cho tiếng Nhật
      content += CENTER;
      content += "VNEXT - 整理券発行システム\n";
      content += "\n\n";
    } else {
      // Fallback - Việt Nam với thermal printer
      // Header - Vietnamese embassy format  
      content += BOLD_ON + LARGE_FONT;
      content += "ĐẠI SỨ QUÁN VIỆT NAM TẠI NHẬT BẢN\n";
      content += BOLD_OFF + NORMAL_FONT;
      
      content += "\nPhiếu Số Thứ Tự\n\n\n";
      
      // Số thứ tự với font size LỚN NHẤT - fallback
      content += BOLD_ON + MEGA_LARGE;
      content += ticketData.number + "\n";
      content += BOLD_OFF + NORMAL_FONT;
      content += "\n\n";
      
      const serviceLines = formatServiceForPrint(ticketData.serviceType, 32);
      serviceLines.forEach(line => {
        content += BOLD_ON + LARGE_FONT;
        content += line + "\n";
        content += BOLD_OFF + NORMAL_FONT;
      });
      content += "\n";
      
      // Thời gian ngày tháng size nhỏ
      content += NORMAL_FONT;
      content += timestamp + "   " + formattedDate + "\n\n";
      
      // Footer size nhỏ
      content += CENTER;
      content += "VNEXT - Hệ thống lấy số tự động\n";
      content += "\n\n";
    }
    
    // Cut paper (for thermal printers like PRP-085)
    content += CUT_PAPER;
    
    return content;
  }
};

export default {
  printDirectThermal
};
