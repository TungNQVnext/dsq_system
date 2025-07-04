import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Menu.css'; 

const Menu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (!u) {
      window.location.href = "/";
    } else {
      setUser(JSON.parse(u));
    }
  }, []);

  const handleNavigate = (path) => {
    navigate("/" + path);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
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
                <button onClick={handleLogout}>Đăng xuất</button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="menu-container">
        <button onClick={() => handleNavigate("get-number-option")} className="menu-button">
          🧾 Lấy số thứ tự
        </button>
        <button onClick={() => handleNavigate("return-record-control")} className="menu-button">
          📑 Quản lý tiếp nhận hồ sơ
        </button>
        <button onClick={() =>{
          window.open("/return-record-control","_blank");
          window.open("/return-record-display","_blank")
        }} className="menu-button">
          📦 Quản lý trả hồ sơ
        </button>
      </div>
    </div>
  );
};

export default Menu;
