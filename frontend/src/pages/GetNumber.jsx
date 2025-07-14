import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import '../styles/GetNumber.css';
import { API_URL } from "../setting";
import { useAuthGuard } from "../hooks/useAuthGuard";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

const GetNumber = () => {
  useAuthGuard();
  const [currentNumber, setCurrentNumber] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasCalledRef = useRef(false); 
  const [requestId] = useState(() => Math.random().toString(36)); 
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.state?.prefix;

  console.log(`🔵 GetNumber component mounted with requestId: ${requestId}, prefix: ${prefix}`);

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
  }, [prefix]); // Remove hasGenerated from dependencies

  const handleGetNumber = async () => {
    if (loading) {
      return;
    }
    
    setLoading(true);
    
    const startTime = Date.now();
    try {
      const res = await fetch(`${API_URL}/call/number`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Request-ID": requestId 
        },
        body: JSON.stringify({ prefix })
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
    <Header />
    <div className="get-number-wrapper">
      <h2 className="get-number-title">Số thứ tự của bạn là</h2>
      {loading && <p className="number-loading">Đang xử lý...</p>}
      {currentNumber && (
        <h1 className="number-display">{currentNumber}</h1>
      )}
      {currentNumber && (
        <button onClick={() => navigate("/get-number-option")} className="back-button">Quay lại</button>
      )}
    </div>
    </>
  );
};

export default GetNumber;
