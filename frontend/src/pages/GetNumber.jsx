import { useEffect, useState } from "react";
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
  const navigate = useNavigate();
  const location = useLocation();
  const prefix = location.state?.prefix;

  useEffect(() => {
    if (!prefix) {
      navigate("/get-number-option");
    }
  }, []);

  useEffect(() => {
    if (prefix)
      handleGetNumber();
  }, [prefix]);

  const handleGetNumber = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/call/number`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix })
      });
      const data = await res.json();
      console.log("Dữ liệu từ backend:", data);
      setCurrentNumber(data.number);

      setTimeout(() => {
        navigate("/get-number-option");
      }, 20000);
    } catch (err) {
      alert("Lỗi lấy số, vui lòng thử lại.");
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
