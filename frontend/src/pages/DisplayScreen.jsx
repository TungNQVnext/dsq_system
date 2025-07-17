import React from "react";
import "../styles/DisplayScreen.css";
import logo from "../assets/Emblem_of_Vietnam.svg";
import vnext_logo from "../assets/vnext_logo.png";

export const DisplayScreen = () => {
  // Fake data for demonstration
  const currentServing = [
    { counter: 1, callNumber: "" },
    { counter: 2, callNumber: "V103" },
    { counter: 3, callNumber: "P108" },
  ];

  const previouslyCalled = [
    { callNumber: "V111" },
    { callNumber: "P106" },
    { callNumber: "C109" },
    { callNumber: "V102" },
    { callNumber: "P105" },
    { callNumber: "C108" },
    { callNumber: "V101" },
    { callNumber: "P104" },
  ];

  // Get serving number for specific counter
  const getServingNumber = (counterNumber) => {
    const serving = currentServing.find(s => s.counter === counterNumber);
    return serving ? serving.callNumber : "";
  };

  // Check if any counter is serving
  const hasServingNumbers = currentServing.some(s => s.callNumber && s.callNumber.trim() !== "");

  return (
    <div className="display-screen-container">
      {/* Logo Overlay */}
      <div className="display-logo-overlay">
        <img src={logo} alt="logo" />
      </div>

      {/* Header */}
      <div className="display-header">
        
        <div className="display-header-section">
          <div className="display-header-title">Quầy</div>
          <div className="display-header-subtitle">カウンター</div>
        </div>
        <div className="display-header-section">
          <div className="display-header-title">Đang phục vụ</div>
          <div className="display-header-subtitle">受付中</div>
        </div>
      </div>

      {/* Main content */}
      <div className="display-main">
     
        {/* Serving numbers (right side) */}
        <div className="display-serving">
          {[1, 2, 3].map((counter) => {
            const servingNumber = getServingNumber(counter);
            const displayNumber = hasServingNumbers ? (servingNumber || "準備中") : "準備中";
            const counterNumber = counter;
            
            return (
              <div 
                key={counter} 
                className="display-counter-item"
              >
                <div className="display-counter-number">
                  {counterNumber}
                </div>
                <div className="display-serving-item">
                  {displayNumber}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Previously called section */}
      <div className="display-previous">
        <div className="display-previous-title">
          <span>Số đã gọi qua </span>
          <span>(呼び出し済み番号)</span>
        </div>
 
        <div className="display-previous-numbers">
          {previouslyCalled.map((item, index) => (
            <span key={index} className="display-previous-number">
              {item.callNumber}
            </span>
          ))}
        </div>
        
      </div>
      <div className="footer-logo" style={{borderTop : "2px solid rgb(255, 255, 255 )"}}>
          <div className="footer-logo-text">
            <span> Hệ thống được phát triển bởi</span>
          </div>
        
          <img src={vnext_logo} alt="logo" />

        </div>
    </div>
  );
};

export default DisplayScreen;
