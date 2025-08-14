import React from "react";
import "../styles/HeaderTouch.css";
import logo from "../assets/Emblem_of_Vietnam.svg";

export const HeaderTouch = () => {
  return (
    <>
      {/* Logo Overlay */}
      <div className="touch-logo-overlay">
        <img src={logo} alt="logo" />
      </div>

      {/* Header */}
      <div className="touch-header">
        <div className="touch-header-content">
          <h1 className="touch-main-title">Đại Sứ Quán Nước Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam Tại Nhật Bản</h1>
        </div>
      </div>
    </>
  );
};
