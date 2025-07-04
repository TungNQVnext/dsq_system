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

  useEffect(() => {
    // Kiểm tra đăng nhập qua cookie
    fetch(`${API_URL}/auth/me`, { credentials: "include" })
      .then(async res => {
        if (!res.ok) {
          window.location.href = "/";
        } else {
          const data = await res.json();
          setUser(data);
        }
      });
  }, []);

  const handleNavigate = (path) => {
    navigate("/" + path);
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    window.location.href = "/";
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
    <Footer />
    </>
  );
};

export default Menu;
