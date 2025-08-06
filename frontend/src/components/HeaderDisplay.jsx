import React from "react";
import "../styles/Header.css";
import logo from "../assets/Emblem_of_Vietnam.svg";

export const HeaderDisplay = () => {
  return (
    <>
{/* Logo Overlay */}
<div className="display-logo-overlay" style={{top: "20px"}}>
        <img src={logo} alt="logo" />
      </div>

      {/* Header */}
      <div className="display-header" style={{height: "160px"}}>
        <div className="display-header-content">
          <h1 className="display-main-title">Đại Sứ Quán Nước Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam Tại Nhật Bản</h1>
        </div>
      </div>
    </>
  );
};
