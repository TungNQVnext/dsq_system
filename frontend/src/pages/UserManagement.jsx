import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { API_URL } from "../setting";
import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";
import "../styles/UserManagement.css";

const UserManagement = () => {
  useAuthGuard();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // Check if current user is admin
  const checkUserRole = useCallback(async () => {
    try {
      setRoleLoading(true);
      const token = localStorage.getItem('token');
      
      if (token) {
        const response = await fetch(`${API_URL}/auth/me-token`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
          
          // If not admin, redirect to menu
          if (userData.role !== 'admin') {
            setError('Bạn không có quyền truy cập trang này. Chỉ admin mới có thể quản lý user.');
            setTimeout(() => {
              navigate('/menu');
            }, 3000);
            return false;
          }
          return true;
        } else {
          throw new Error('Failed to get user info');
        }
      } else {
        // Fallback to cookie-based auth
        const response = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUserRole(userData.role);
          
          // If not admin, redirect to menu
          if (userData.role !== 'admin') {
            setError('Bạn không có quyền truy cập trang này. Chỉ admin mới có thể quản lý user.');
            setTimeout(() => {
              navigate('/menu');
            }, 3000);
            return false;
          }
          return true;
        } else {
          throw new Error('Failed to get user info with cookie auth');
        }
      }
    } catch (err) {
      setError('Lỗi khi kiểm tra quyền truy cập: ' + err.message);
      setTimeout(() => {
        navigate('/menu');
      }, 3000);
      return false;
    } finally {
      setRoleLoading(false);
    }
  }, [navigate]);

  // Form states
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    role: 'staff'
  });

  const [changePasswordForm, setChangePasswordForm] = useState({
    newPassword: ''
  });

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    // Don't fetch users if not admin
    if (userRole !== 'admin') {
      return;
    }
    
    try {
      setLoading(true);
      
      // Try token-based auth first
      const token = localStorage.getItem('token');
      
      if (token) {
        const response = await fetch(`${API_URL}/admin/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập trang này');
          }
          if (response.status === 401) {
            throw new Error('Vui lòng đăng nhập lại');
          }
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
        setError(null);
      } else {
        // Fallback to cookie-based auth
        const response = await fetch(`${API_URL}/admin/users`, {
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (!response.ok) {
          if (response.status === 403) {
            throw new Error('Bạn không có quyền truy cập trang này');
          }
          if (response.status === 401) {
            throw new Error('Vui lòng đăng nhập lại');
          }
          throw new Error('Failed to fetch users with cookie auth');
        }

        const data = await response.json();
        setUsers(data);
        setFilteredUsers(data);
        setError(null);
      }
    } catch (err) {
      setError('Lỗi khi tải danh sách user: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [userRole]);

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (actionLoading) return;

    // Validation
    if (!createForm.username.trim() || !createForm.password.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setActionLoading(true);
      
      // Try token-based auth first
      const token = localStorage.getItem('token');
      let response;
      
      if (token) {
        response = await fetch(`${API_URL}/admin/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createForm)
        });
      } else {
        // Fallback to cookie-based auth
        response = await fetch(`${API_URL}/admin/users`, {
          method: 'POST',
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createForm)
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create user');
      }

      await fetchUsers();
      setShowCreateModal(false);
      setCreateForm({ username: '', password: '', role: 'staff' });
      setError(null);
    } catch (err) {
      setError('Lỗi khi tạo user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (actionLoading) return;

    // Validation
    if (!changePasswordForm.newPassword.trim()) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }

    try {
      setActionLoading(true);
      
      const token = localStorage.getItem('token');
      let response;
      
      if (token) {
        response = await fetch(`${API_URL}/admin/users/${selectedUser.username}/password`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ new_password: changePasswordForm.newPassword })
        });
      } else {
        response = await fetch(`${API_URL}/admin/users/${selectedUser.username}/password`, {
          method: 'PUT',
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ new_password: changePasswordForm.newPassword })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to change password');
      }

      setShowChangePasswordModal(false);
      setChangePasswordForm({ newPassword: '' });
      setSelectedUser(null);
      setError(null);
    } catch (err) {
      setError('Lỗi khi đổi mật khẩu: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (actionLoading) return;

    try {
      setActionLoading(true);
      
      const token = localStorage.getItem('token');
      let response;
      
      if (token) {
        response = await fetch(`${API_URL}/admin/users/${selectedUser.username}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
      } else {
        response = await fetch(`${API_URL}/admin/users/${selectedUser.username}`, {
          method: 'DELETE',
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          }
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete user');
      }

      await fetchUsers();
      setShowDeleteModal(false);
      setSelectedUser(null);
      setError(null);
    } catch (err) {
      setError('Lỗi khi xóa user: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setCreateForm({ username: '', password: '', role: 'staff' });
    setShowCreateModal(true);
    setError(null);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowChangePasswordModal(false);
    setShowDeleteModal(false);
    setSelectedUser(null);
    setChangePasswordForm({ newPassword: '' });
    setError(null);
  };

  const openChangePasswordModal = (user) => {
    setSelectedUser(user);
    setChangePasswordForm({ newPassword: '' });
    setShowChangePasswordModal(true);
    setError(null);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setError(null);
  };

  // Filter users based on search term and role filter
  useEffect(() => {
    let filtered = users;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    const initializeUserManagement = async () => {
      const isAdmin = await checkUserRole();
      if (isAdmin) {
        await fetchUsers();
      }
    };
    
    initializeUserManagement();
  }, [checkUserRole, fetchUsers]); // Add dependencies

  return (
    <div className="user-management-container">
      <Header />
      
      <div className="user-management-content">
        {roleLoading ? (
          <div className="loading-state">Đang kiểm tra quyền truy cập...</div>
        ) : userRole !== 'admin' ? (
          <div className="access-denied">
            <h2>Truy cập bị từ chối</h2>
            <p>Bạn không có quyền truy cập trang này. Chỉ admin mới có thể quản lý user.</p>
            <p>Đang chuyển hướng về trang chính...</p>
          </div>
        ) : (
          <>
            <div className="user-management-header">
              <h1>Quản lý User</h1>
              <div>
                <button 
                  className="btn-primary"
                  onClick={openCreateModal}
                  disabled={actionLoading}
                >
                  Tạo User Mới
                </button>
              </div>
            </div>

        {/* Search and Filter Controls */}
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên đăng nhập..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-box">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="staff">Nhân viên</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="users-table-container">
          {loading ? (
            <div className="loading-state">Đang tải...</div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Tên đăng nhập</th>
                      <th>Vai trò</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.username}>
                        <td>{user.username}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role === 'admin' ? 'Quản trị viên' : 'Nhân viên'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-warning"
                              onClick={() => openChangePasswordModal(user)}
                              disabled={actionLoading}
                            >
                              🔑 Đổi mật khẩu
                            </button>
                            <button 
                              className="btn-danger"
                              onClick={() => openDeleteModal(user)}
                              disabled={actionLoading}
                            >
                              🗑️ Xóa người dùng
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="no-results">
                  {searchTerm || roleFilter !== 'all' 
                    ? 'Không tìm thấy user phù hợp với tiêu chí tìm kiếm.' 
                    : 'Chưa có user nào.'}
                </div>
              )}
            </>
          )}
        </div>

        {/* Back to Menu Button */}
        <div className="back-to-menu-container">
          <button 
            className="btn-back-to-menu"
            onClick={() => navigate('/menu')}
          >
            ← Quay về Menu
          </button>
        </div>
        </>
        )}
      </div>

      {/* Create User Modal */}
      {userRole === 'admin' && showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Tạo User Mới</h2>
              <button className="close-button" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Tên đăng nhập:</label>
                <input
                  type="text"
                  value={createForm.username}
                  onChange={(e) => setCreateForm({...createForm, username: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Mật khẩu:</label>
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Vai trò:</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                >
                  <option value="staff">Nhân viên</option>
                  <option value="admin">Quản trị viên</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModals}>Hủy</button>
                <button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Đang tạo...' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {userRole === 'admin' && showChangePasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Đổi mật khẩu cho {selectedUser?.username}</h2>
              <button className="close-button" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Mật khẩu mới:</label>
                <input
                  type="password"
                  value={changePasswordForm.newPassword}
                  onChange={(e) => setChangePasswordForm({newPassword: e.target.value})}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={closeModals}>Hủy</button>
                <button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Đang cập nhật...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {userRole === 'admin' && showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Xác nhận xóa user</h2>
              <button className="close-button" onClick={closeModals}>×</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa user <strong>{selectedUser?.username}</strong>?</p>
              <p>Hành động này không thể hoàn tác.</p>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={closeModals}>Hủy</button>
              <button 
                className="btn-danger" 
                onClick={handleDeleteUser}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default UserManagement;
