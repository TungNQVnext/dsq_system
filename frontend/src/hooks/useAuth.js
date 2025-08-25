// Authentication hook
import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/auth/authService';

/**
 * Custom hook for authentication management
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
      setError(null);
    } catch (err) {
      setUser(null);
      setError(null); // Don't set error for failed auth check
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username, password, useToken = false) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (useToken) {
        response = await AuthService.loginWithToken(username, password);
        setUser(response.user);
      } else {
        response = await AuthService.login(username, password);
        setUser(response);
      }
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await AuthService.logout();
      setUser(null);
      setError(null);
    } catch (err) {
      setError(err.message);
      // Still clear user even if logout fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      const response = await AuthService.changePassword(currentPassword, newPassword);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    changePassword,
    checkAuth,
    clearError: () => setError(null),
  };
};

export default useAuth;
