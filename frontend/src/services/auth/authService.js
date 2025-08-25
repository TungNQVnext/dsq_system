// Authentication service
import { apiClient } from './client';

/**
 * Authentication API service
 */
export class AuthService {
  /**
   * Login with username and password
   */
  static async login(username, password) {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Login and get token
   */
  static async loginWithToken(username, password) {
    try {
      const response = await apiClient.post('/auth/login-token', {
        username,
        password,
      });
      
      if (response.access_token) {
        apiClient.setAuthToken(response.access_token);
      }
      
      return response;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Get current user info
   */
  static async getCurrentUser() {
    try {
      return await apiClient.get('/auth/me');
    } catch (error) {
      // Try token-based auth as fallback
      try {
        return await apiClient.get('/auth/me-token');
      } catch (tokenError) {
        throw new Error('Failed to get user info');
      }
    }
  }

  /**
   * Logout user
   */
  static async logout() {
    try {
      await apiClient.post('/auth/logout');
      apiClient.setAuthToken(null);
      return { success: true };
    } catch (error) {
      // Even if logout fails, clear local token
      apiClient.setAuthToken(null);
      throw new Error(error.message || 'Logout failed');
    }
  }

  /**
   * Change password
   */
  static async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return response;
    } catch (error) {
      // Try token-based change password as fallback
      try {
        return await apiClient.put('/auth/change-password-token', {
          current_password: currentPassword,
          new_password: newPassword,
        });
      } catch (tokenError) {
        throw new Error(error.message || 'Password change failed');
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  static async isAuthenticated() {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default AuthService;
