// Call number management service
import { apiClient } from './client';

/**
 * Call number API service
 */
export class CallNumberService {
  /**
   * Generate new call number
   */
  static async generateNumber(prefix, services = []) {
    try {
      const requestId = Date.now().toString();
      
      // Try new API first, fallback to legacy
      try {
        return await apiClient.request('/api/v1/call-numbers/generate', {
          method: 'POST',
          headers: {
            'X-Request-ID': requestId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefix, services }),
        });
      } catch (error) {
        return await apiClient.request('/call/number', {
          method: 'POST',
          headers: {
            'X-Request-ID': requestId,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prefix, services }),
        });
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to generate number');
    }
  }

  /**
   * Get ticket information
   */
  static async getTicketInfo(number) {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.get(`/api/v1/call-numbers/ticket-info/${number}`);
      } catch (error) {
        return await apiClient.get(`/call/ticket-info/${number}`);
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to get ticket info');
    }
  }
}

export default CallNumberService;
