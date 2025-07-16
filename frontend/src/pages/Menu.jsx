import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../setting";
import '../styles/Menu.css'; 
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

const Menu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  const showForAdmin = user?.role === "admin";
  const showForStaff = user?.role === "staff";

  useEffect(() => {
    // Try to get user from localStorage first
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    // Fallback to cookie-based auth
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(async res => {
        if (!res.ok) {
          // If no token and cookie auth fails, redirect to login
          if (!token) {
            window.location.href = "/";
          }
        } else {
          const data = await res.json();
          setUser(data);
          // Update localStorage if we got user from cookie
          if (!storedUser) {
            localStorage.setItem('user', JSON.stringify(data));
          }
        }
      })
      .catch(() => {
        if (!token) {
          window.location.href = "/";
        }
      });
  }, []);

  useEffect(() => {
    document.title = "Menu";
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.user-dropdown')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showMenu]);

  const handleNavigate = (path) => {
    navigate("/" + path);
  };

  const handleLogout = async () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Call logout API to clear cookie
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    window.location.href = "/";
  };

  const openChangePasswordModal = () => {
    setChangePasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
    setShowChangePasswordModal(true);
    setShowMenu(false);
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setChangePasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordError('');
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordLoading) return;

    // Validation
    if (!changePasswordForm.currentPassword.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (!changePasswordForm.newPassword.trim()) {
      setPasswordError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (changePasswordForm.newPassword !== changePasswordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (changePasswordForm.newPassword.length < 4) {
      setPasswordError('Mật khẩu mới phải có ít nhất 4 ký tự');
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordError('');
      
      const token = localStorage.getItem('token');
      let response;
      
      if (token) {
        response = await fetch(`${API_URL}/auth/change-password-token`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            current_password: changePasswordForm.currentPassword,
            new_password: changePasswordForm.newPassword
          })
        });
      } else {
        response = await fetch(`${API_URL}/auth/change-password`, {
          method: 'PUT',
          credentials: "include",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            current_password: changePasswordForm.currentPassword,
            new_password: changePasswordForm.newPassword
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Không thể đổi mật khẩu');
      }

      // Show success message and redirect to login
      alert('Đổi mật khẩu thành công! Bạn cần đăng nhập lại với mật khẩu mới.');
      await handleLogout();
      
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
    <Header />
    <div className="menu-wrapper">
      <div className="menu-user">
        {user && (
          <div className="user-dropdown">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="user-button"
            >
              👤 {user.username} ▾
            </button>
            {showMenu && (
              <div className="dropdown-menu">
                <button onClick={openChangePasswordModal}>🔑 Đổi mật khẩu</button>
                <button onClick={handleLogout}>🚪 Đăng xuất</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="menu-container">
        {showForAdmin && (
          <button onClick={() => handleNavigate("get-number-option")} className="menu-button">
            🧾 Lấy số thứ tự
          </button>
        )}
        {(showForAdmin || showForStaff) && (
          <button onClick={() => {
            window.open("/receive-number-control","_blank")
          }} className="menu-button">
            📑 Quản lý tiếp nhận hồ sơ
          </button>
        )}
        {(showForAdmin || showForStaff) && (
          <button onClick={() =>{
            window.open("/return-record-control","_blank");
          }} className="menu-button">
            📦 Quản lý trả hồ sơ
          </button>
        )}
        {showForAdmin && (
          <button onClick={() =>{
            window.open("/return-record-display","_blank");
          }} className="menu-button">
            Màn hình thông báo trả kết quả
          </button>
        )}
        {showForAdmin && (
          <button onClick={() =>{
            window.open("/receive-number-display","_blank");
          }} className="menu-button">
            Màn hình thông báo nhận kết quả
          </button>
        )}
        {showForAdmin && (
          <button onClick={() => handleNavigate("user-management")} className="menu-button">
            👥 Quản lý người dùng
          </button>
        )}            
      </div>
    </div>

    {/* Change Password Modal */}
    {showChangePasswordModal && (
      <div className="modal-overlay">
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Đổi mật khẩu</h2>
            <button className="close-button" onClick={closeChangePasswordModal}>×</button>
          </div>
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label>Mật khẩu hiện tại:</label>
              <input
                type="password"
                value={changePasswordForm.currentPassword}
                onChange={(e) => setChangePasswordForm({...changePasswordForm, currentPassword: e.target.value})}
                required
                disabled={passwordLoading}
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu mới:</label>
              <input
                type="password"
                value={changePasswordForm.newPassword}
                onChange={(e) => setChangePasswordForm({...changePasswordForm, newPassword: e.target.value})}
                required
                disabled={passwordLoading}
                minLength="4"
              />
            </div>
            <div className="form-group">
              <label>Xác nhận mật khẩu mới:</label>
              <input
                type="password"
                value={changePasswordForm.confirmPassword}
                onChange={(e) => setChangePasswordForm({...changePasswordForm, confirmPassword: e.target.value})}
                required
                disabled={passwordLoading}
                minLength="4"
              />
            </div>
            {passwordError && (
              <div className="error-message">
                {passwordError}
              </div>
            )}
            <div className="modal-actions">
              <button type="button" onClick={closeChangePasswordModal} disabled={passwordLoading}>
                Hủy
              </button>
              <button type="submit" disabled={passwordLoading}>
                {passwordLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    <Footer />
    </>
  );
};

export default Menu;
