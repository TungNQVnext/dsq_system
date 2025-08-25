// User management service
import { apiClient } from '../api/client';

/**
 * User management API service
 */
export class UserService {
  /**
   * Get all users
   */
  static async getAllUsers() {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.get('/api/v1/users');
      } catch (error) {
        return await apiClient.get('/admin/users');
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch users');
    }
  }

  /**
   * Create new user
   */
  static async createUser(userData) {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.post('/api/v1/users', userData);
      } catch (error) {
        return await apiClient.post('/admin/users', userData);
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to create user');
    }
  }

  /**
   * Update user
   */
  static async updateUser(username, userData) {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.put(`/api/v1/users/${username}`, userData);
      } catch (error) {
        return await apiClient.put(`/admin/users/${username}`, userData);
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to update user');
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(username) {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.delete(`/api/v1/users/${username}`);
      } catch (error) {
        return await apiClient.delete(`/admin/users/${username}`);
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to delete user');
    }
  }

  /**
   * Change user password
   */
  static async changeUserPassword(username, newPassword) {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.put(`/api/v1/users/${username}/password`, {
          new_password: newPassword,
        });
      } catch (error) {
        return await apiClient.put(`/admin/users/${username}/password`, {
          new_password: newPassword,
        });
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to change password');
    }
  }

  /**
   * Change user role
   */
  static async changeUserRole(username, role) {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.put(`/api/v1/users/${username}/role`, { role });
      } catch (error) {
        return await apiClient.put(`/admin/users/${username}/role`, { role });
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to change role');
    }
  }

  /**
   * Get current user debug info
   */
  static async getDebugInfo() {
    try {
      // Try new API first, fallback to legacy
      try {
        return await apiClient.get('/api/v1/users/debug');
      } catch (error) {
        return await apiClient.get('/admin/debug-user');
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to get debug info');
    }
  }
}

export default UserService;
