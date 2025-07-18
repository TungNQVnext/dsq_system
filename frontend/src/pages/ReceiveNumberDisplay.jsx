import React, { useState, useEffect } from "react";
import "../styles/ReceiveNumberDisplay.css";
import logo from "../assets/Emblem_of_Vietnam.svg";
import { API_URL } from "../setting";
import { useWebSocket } from "../hooks/returnNumberHook/useWebSocket";
import { useReceiveWebSocket } from "../hooks/receiveNumberHook/useReceiveWebSocket";
import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";
import vnext_logo from "../assets/vnext_logo.png";

export const ReceiveNumberDisplay = () => {
  useAuthGuard();
  const [currentServing, setCurrentServing] = useState({
    1: "",
    2: "",
    3: ""
  });

  const [cancelledNumbers, setCancelledNumbers] = useState([]);
  const { subscribe } = useWebSocket();
  const { subscribe: subscribeReceive } = useReceiveWebSocket();

  // Fetch serving numbers from API
  const fetchServingNumbers = async () => {
    try {
      const response = await fetch(`${API_URL}/receive_number/serving`);
      if (response.ok) {
        const data = await response.json();
        setCurrentServing(data);
      }
    } catch (error) {
      console.error('Error fetching serving numbers:', error);
    }
  };

  // Fetch cancelled numbers from API
  const fetchCancelledNumbers = async () => {
    try {
      const response = await fetch(`${API_URL}/receive_number/call-numbers/cancelled-today`);
      if (response.ok) {
        const data = await response.json();
        setCancelledNumbers(data);
      }
    } catch (error) {
      console.error('Error fetching cancelled numbers:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchServingNumbers();
    fetchCancelledNumbers();
  }, []);

  // Subscribe to WebSocket updates for real-time updates
  useEffect(() => {
    if (!subscribe) return;
    
    const unsubscribe = subscribe("call_number_updated", (message) => {
      console.log("Display screen received update:", message);
      // Refresh cancelled numbers when any number status changes
      // This ensures we get updates when numbers are cancelled from control screen
      fetchCancelledNumbers();
      fetchServingNumbers();
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  // Subscribe to receive WebSocket for call updates
  useEffect(() => {
    if (!subscribeReceive) return;
    
    const unsubscribe = subscribeReceive("all", (message) => {
      console.log("Receive display screen received update:", message);
      if (message.type === "call" || message.type === "call_number_updated") {
        // Refresh serving numbers when calls are made
        fetchServingNumbers();
      }
      if (message.type === "reading_end") {
        // When speaking ends, update serving numbers
        fetchServingNumbers();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeReceive]);

  // Get serving number for specific counter
  const getServingNumber = (counterNumber) => {
    const servingData = currentServing[counterNumber.toString()];
    return servingData ? servingData.number : "";
  };

  // Check if any counter is serving
  const hasServingNumbers = Object.values(currentServing).some(s => s && s.number && s.number.trim() !== "");

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
        {/* <div className="display-previous-subtitle">
          (vui lòng liên hệ nhân viên nếu thấy số của bạn)
        </div>
        <div className="display-previous-subtitle-jp">
          (お客様の番号が表示されている場合は、スタッフにお声がけください)
        </div> */}
        <div className="display-previous-numbers">
          {cancelledNumbers.length > 0 ? (
            cancelledNumbers.map((item, index) => (
              <span key={index} className="display-previous-number">
                {item.callNumber}
              </span>
            ))
          ) : (
            <span className="display-no-cancelled">
            </span>
          )}
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

export default ReceiveNumberDisplay;
