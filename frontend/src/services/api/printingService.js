// Printing service
import { apiClient } from './client';

/**
 * Printing API service
 */
export class PrintingService {
  /**
   * Check printer availability
   */
  static async checkPrinter() {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.get('/api/v1/printing/check-printer');
      } catch (error) {
        return await apiClient.get('/print/check-printer');
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to check printer');
    }
  }

  /**
   * Run thermal print
   */
  static async runThermalPrint(content, printerName = null) {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.post('/api/v1/printing/thermal-print', {
          content,
          printer_name: printerName,
        });
      } catch (error) {
        return await apiClient.post('/simple_print/run-thermal-print', {
          content,
          printer_name: printerName,
        });
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to print');
    }
  }

  /**
   * List available printers
   */
  static async listPrinters() {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.get('/api/v1/printing/list-printers');
      } catch (error) {
        return await apiClient.get('/simple_print/list-printers');
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to list printers');
    }
  }

  /**
   * Test print route
   */
  static async testPrint() {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.get('/api/v1/printing/test');
      } catch (error) {
        return await apiClient.get('/print/test');
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to test print');
    }
  }
}

export default PrintingService;
