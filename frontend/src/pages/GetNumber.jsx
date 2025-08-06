import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import '../styles/GetNumber.css';
import { API_URL } from "../setting";
import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";
import { HeaderDisplay } from "../components/HeaderDisplay";
import { FooterDisplay } from "../components/FooterDisplay";
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
    <HeaderDisplay />
    <div className="get-number-wrapper">
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
    <FooterDisplay />
    </>
  );
};

export default GetNumber;
