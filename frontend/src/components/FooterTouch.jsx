import React from "react";
import "../styles/FooterTouch.css";
import vnext_logo from "../assets/vnext_logo.png";

export const FooterTouch = () => {
  return (
    <>
      {/* Footer */}
      <div className="touch-display-footer-container" style={{backgroundColor: "#f5f5f5"}}>
        <div className="touch-display-footer">
          <div className="footer-content">
            <img src={vnext_logo} alt="VNEXT JAPAN logo" className="footer-logo" />
            <span className="footer-text">Hệ Thống Được Phát Triển Bởi VNEXT JAPAN</span>
          </div>
        </div>
      </div>
    </>
  );
};
