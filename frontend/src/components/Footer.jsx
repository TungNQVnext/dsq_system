import React from "react";
import "../styles/Footer.css";
import vnext_logo from "../assets/vnext_logo.png";

export const Footer = () => {
  return (
    <>
    <div className="display-footer-container">
    <div className="display-footer">
        <div className="footer-content">
          <img src={vnext_logo} alt="VNEXT JAPAN logo" className="footer-logo" />
          <span className="footer-text">Hệ Thống Được Phát Triển Bởi VNEXT JAPAN</span>
        </div>
      </div>
    </div>
    </>
       
  );
};
