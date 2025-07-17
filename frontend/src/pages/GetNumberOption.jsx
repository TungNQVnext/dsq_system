import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GetNumberOption.css";
import { API_URL } from "../setting";
// import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import vnext_logo from "../assets/vnext_logo.png";
const GetNumberOption = () => {
  useEffect(() => {
    document.title = "Lấy số thứ tự"; 
  }, []);
  // useAuthGuard();

  const navigate = useNavigate();

  const handleSelect = (prefix) => {
    navigate("/get-number", { state: { prefix } });
  };

  return (
    <>
    <Header />
    <div className="get-number-container">
      <h1 className="get-number-title">Hệ Thống Lấy Số</h1>
      <p className="get-number-subtitle">番号発券システム</p>

      <div className="get-number-options">
        <p className="get-number-label">Chọn quốc tịch / 国籍を選択</p>

        <button
          className="get-number-button"
          onClick={() => handleSelect("V")}
        >
          🇻🇳 Công dân Việt Nam
          <br />
          <span className="japanese-label">ベトナム国民</span>
        </button>

        <button
          className="get-number-button"
          onClick={() => handleSelect("N")}
        >
          🌐 Quốc tịch khác
          <br />
          <span className="japanese-label">その他の国籍</span>
        </button>
      </div>
    </div>
    <div className="footer-logo">
          <div className="footer-logo-text">
            <span> Hệ thống được phát triển bởi</span>
          </div>
        
          <img src={vnext_logo} alt="logo" />

        </div>
    </>
  );
};

export default GetNumberOption;
