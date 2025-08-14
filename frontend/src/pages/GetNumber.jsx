import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import '../styles/GetNumber.css';
import { API_URL } from "../setting";
import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";
import { HeaderTouch } from "../components/HeaderTouch";
import { FooterTouch } from "../components/FooterTouch";
import { createTicketData } from "../utils/printUtils";
import { printDirectThermal } from "../utils/directThermalPrint";
const GetNumber = () => {
  useAuthGuard();
  useEffect(() => {
    document.title = "Lấy số thứ tự";
  }, []);
  useAuthGuard();
  const [currentNumber, setCurrentNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasCalledRef = useRef(false); 
  const [requestId] = useState(() => Math.random().toString(36)); 
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.state?.prefix;
  const services = location.state?.services;

  useEffect(() => {
    if (!prefix) {
      navigate("/get-number-option");
      return;
    }
    
    // Only generate number once using ref
    if (prefix && !hasCalledRef.current) {
      hasCalledRef.current = true; // Set immediately to prevent double calls
      handleGetNumber();
    }
  }, [prefix]);

  const handleGetNumber = async () => {
    if (loading) {
      return;
    }
    
    setLoading(true);
    
    const startTime = Date.now();
    try {
      const requestBody = { 
        prefix,
        services: services || []
      };
      
      const res = await fetch(`${API_URL}/call/number`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Request-ID": requestId 
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await res.json();
      const endTime = Date.now();
      setCurrentNumber(data.number);

      // Tự động in phiếu số thứ tự - sử dụng direct thermal print
      console.log('Auto printing ticket via direct thermal print...');
      
      try {
        const ticket = createTicketData(data.number, services, prefix);
        console.log('Ticket data created:', ticket);
        
        // In trực tiếp qua thermal printer
        setTimeout(async () => {
          console.log('Executing direct thermal print...');
          const printSuccess = await printDirectThermal(ticket);
          
          if (printSuccess) {
            console.log('✓ Direct thermal print successful');
          } else {
            console.log('✗ Direct thermal print failed');
          }
        }, 500);
        
      } catch (error) {
        console.error('Print preparation error:', error);
      }

      setTimeout(() => {
        navigate("/get-number-option");
      }, 20000);
    } catch (err) {
      alert("Lỗi lấy số, vui lòng thử lại.");
      hasCalledRef.current = false; 
    }
    setLoading(false);
  };

  return (
    <>
    <HeaderTouch />
    <div className="get-number-container">
      <h2 className="get-number-title">
        {prefix === "V" ? "Số thứ tự của bạn là" : "あなたの番号は"}
      </h2>
      {loading && <p className="number-loading">{prefix === "V" ? "Đang xử lý..." : "処理中..."}</p>}
      {currentNumber && (
        <h1 className="number-display">{currentNumber}</h1>
      )}
      {currentNumber && (
        <button onClick={() => navigate("/get-number-option")} className="complete-button-get-number">
          {prefix === "V" ? "Hoàn thành" : "完了"}
        </button>
      )}
    </div>
    <FooterTouch />
    </>
  );
};

export default GetNumber;
