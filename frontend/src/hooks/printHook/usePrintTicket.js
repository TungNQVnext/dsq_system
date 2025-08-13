import { useState, useCallback } from 'react';
import { API_URL } from '../../setting';
import { autoPrintTicket, createTicketData } from '../../utils/printUtils';

/**
 * Custom hook để quản lý tính năng in phiếu
 */
export const usePrintTicket = () => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState(null);
  const [printSuccess, setPrintSuccess] = useState(false);

  /**
   * Lấy thông tin phiếu in từ server
   */
  const getTicketInfo = useCallback(async (number) => {
    try {
      const response = await fetch(`${API_URL}/call/ticket-info/${number}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching ticket info:', error);
      throw error;
    }
  }, []);

  /**
   * In phiếu với dữ liệu có sẵn
   */
  const printTicket = useCallback(async (ticketData) => {
    setIsPrinting(true);
    setPrintError(null);
    setPrintSuccess(false);

    try {
      await autoPrintTicket(ticketData);
      
      // Ghi log vào server (tùy chọn)
      try {
        await fetch(`${API_URL}/call/print-ticket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            number: ticketData.number
          })
        });
      } catch (logError) {
        console.warn('Failed to log print action:', logError);
        // Không ảnh hưởng đến việc in
      }

      setPrintSuccess(true);
      return true;
    } catch (error) {
      console.error('Print error:', error);
      setPrintError(error.message || 'Lỗi không xác định khi in');
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  /**
   * In phiếu bằng số thứ tự (lấy thông tin từ server)
   */
  const printTicketByNumber = useCallback(async (number) => {
    setIsPrinting(true);
    setPrintError(null);
    setPrintSuccess(false);

    try {
      // Lấy thông tin từ server
      const serverData = await getTicketInfo(number);
      
      // Tạo dữ liệu phiếu in
      const ticketData = {
        number: serverData.number,
        serviceType: serverData.service_type,
        timestamp: serverData.timestamp,
        formattedDate: serverData.formatted_date,
        services: serverData.services,
        prefix: serverData.prefix
      };

      return await printTicket(ticketData);
    } catch (error) {
      console.error('Print by number error:', error);
      setPrintError(error.message || 'Lỗi không xác định khi in');
      return false;
    }
  }, [getTicketInfo, printTicket]);

  /**
   * Reset trạng thái
   */
  const resetPrintStatus = useCallback(() => {
    setPrintError(null);
    setPrintSuccess(false);
    setIsPrinting(false);
  }, []);

  return {
    isPrinting,
    printError,
    printSuccess,
    printTicket,
    printTicketByNumber,
    getTicketInfo,
    resetPrintStatus
  };
};
