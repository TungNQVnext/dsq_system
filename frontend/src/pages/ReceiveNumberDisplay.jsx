import React, { useState, useEffect } from "react";
import "../styles/ReceiveNumberDisplay.css";
import logo from "../assets/Emblem_of_Vietnam.svg";
import { API_URL } from "../setting";
import { useWebSocket } from "../hooks/returnNumberHook/useWebSocket";
import { useReceiveWebSocket } from "../hooks/receiveNumberHook/useReceiveWebSocket";
import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";
import vnext_logo from "../assets/vnext_logo.png";
import { FooterDisplay } from "../components/FooterDisplay";
import { HeaderDisplay } from "../components/HeaderDisplay";

export const ReceiveNumberDisplay = () => {
  useAuthGuard();
  const [currentServing, setCurrentServing] = useState({
  });

  const [cancelledNumbers, setCancelledNumbers] = useState([
  ]);
  const { subscribe } = useWebSocket();
  const { subscribe: subscribeReceive } = useReceiveWebSocket();

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

  useEffect(() => {
    fetchServingNumbers();
    fetchCancelledNumbers();
  }, []);
  useEffect(() => {
    if (!subscribe) return;
    
    const unsubscribe = subscribe("call_number_updated", (message) => {
      console.log("Display screen received update:", message);
      fetchCancelledNumbers();
      fetchServingNumbers();
    });

    return () => {
      unsubscribe();
    };
  }, [subscribe]);

  useEffect(() => {
    if (!subscribeReceive) return;
    
    const unsubscribe = subscribeReceive("all", (message) => {
      console.log("Receive display screen received update:", message);
      if (message.type === "call" || message.type === "call_number_updated") {
        fetchServingNumbers();
      }
      if (message.type === "reading_end") {
        fetchServingNumbers();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeReceive]);

  const getServingNumber = (counterNumber) => {
    const servingData = currentServing[counterNumber.toString()];
    return servingData ? servingData.number : "";
  };

  const isCounterServing = (counterNumber) => {
    const servingData = currentServing[counterNumber.toString()];
    return servingData && servingData.number && servingData.number.trim() !== "";
  };

  return (
    <>
      <HeaderDisplay />

      {/* Main content - Counters */}
      <div className="display-main">
        <div className="display-counters-grid">
          {[1, 2, 3].map((counter) => {
            const servingNumber = getServingNumber(counter);
            const isServing = isCounterServing(counter);
            
            return (
              <div key={counter} className="display-counter-card">
                <div className="counter-header">
                <h2 className="counter-title">
                    Quầy {counter}
                  </h2>

                  <label className="counter-label">窓口{counter}</label>
                  
                </div>
                
                <div className={`counter-status ${isServing ? 'serving' : 'waiting'}`}>
                  <div className="status-icon">
                    {isServing ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="currentColor"/>
                        <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" fill="currentColor"/>
                      </svg>
                    )}
                  </div>
                  <span className="status-text">
                    {isServing ? 'Đang phục vụ / 受付中' : 'Đang chờ / 待機中'}
                  </span>
                </div>
                
                <div className="counter-number-section">
                  {/* <div className="number-label">処理中の番号</div> */}
                  
                  <div className="serving-number">
                    {servingNumber || '---'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Absent Numbers Section */}
      <div className="display-absent">
        <div className="absent-header">
          <h2 className="absent-title">Số đã gọi qua / 呼び出し済み番号</h2>
        </div>
        <div className="absent-numbers">
          {cancelledNumbers.length > 0 ? (
            cancelledNumbers.map((item, index) => (
              <span key={index} className="absent-number">
                {item.callNumber}
              </span>
            ))
          ) : (
            <span className="no-absent-numbers"></span>
          )}
        </div>
      </div>
      <FooterDisplay />
    </>
  );
};

export default ReceiveNumberDisplay;
