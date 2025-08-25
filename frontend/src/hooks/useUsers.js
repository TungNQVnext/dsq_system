// User management hook
import { useState, useCallback } from 'react';
import { UserService } from '../services/api/userService';

/**
 * Custom hook for user management
 */
export const useUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await UserService.getAllUsers();
      setUsers(userData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      setError(null);
      const newUser = await UserService.createUser(userData);
      await fetchUsers(); // Refresh list
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (username, userData) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await UserService.updateUser(username, userData);
      await fetchUsers(); // Refresh list
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (username) => {
    try {
      setLoading(true);
      setError(null);
      await UserService.deleteUser(username);
      await fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const changeUserPassword = useCallback(async (username, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      await UserService.changeUserPassword(username, newPassword);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const changeUserRole = useCallback(async (username, role) => {
    try {
      setLoading(true);
      setError(null);
      await UserService.changeUserRole(username, role);
      await fetchUsers(); // Refresh list
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    changeUserPassword,
    changeUserRole,
    clearError: () => setError(null),
  };
};

export default useUsers;
