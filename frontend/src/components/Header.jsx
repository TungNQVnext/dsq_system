import React from "react";
import { User, LogIn } from "lucide-react";
import "../styles/Header.css";
import logo from "../assets/Emblem_of_Vietnam.svg";

export const Header = () => {
  return (
    <><div
    style={{
        // alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
    }}
    className="header"
  >
    <img src={logo} alt="Logo" className="header-logo" />
    <p style={{ fontSize: "1.6rem", color: "#1C6BC3" }}>
      ĐẠI SỨ QUÁN NƯỚC CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM TẠI NHẬT BẢN
    </p>

    <div className="header-actions">
      {/* <button className="header-button header-button-secondary">
        <User className="header-button-icon" />
        <span>Đăng Ký</span>
      </button>
      <button className="header-button header-button-primary">
        <LogIn className="header-button-icon" />
        <span>Đăng Nhập</span>
      </button> */}
    </div>
  </div></>
    
  );
};
