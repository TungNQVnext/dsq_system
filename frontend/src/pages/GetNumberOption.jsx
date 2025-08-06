import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GetNumberOption.css";
import { API_URL } from "../setting";
import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";
import { Header } from "../components/Header";
import vnext_logo_orange from "../assets/vnext_logo_orange.png";

const GetNumberOption = () => {
  useAuthGuard();
  useEffect(() => {
    document.title = "Lấy số thứ tự"; 
  }, []);
  // useAuthGuard();

  const navigate = useNavigate();

  const handleSelect = (prefix) => {
    if (prefix === "V") {
      navigate("/get-number-service", { state: { prefix } });
    } else {
      navigate("/get-number", { state: { prefix } });
    }
  };

  return (
    <>
    <Header />
    <div className="get-number-container">
      <h1 className="get-number-title">Hệ Thống Lấy Số</h1>
      <p className="get-number-subtitle">番号発券システム</p>

      <div className="get-number-options">
        <p className="get-number-label">Chọn thủ tục / 手続きの選択</p>

        <button
          className="get-number-button"
          onClick={() => handleSelect("V")}
        >
          Thủ tục dành cho người Việt Nam
          <br />
          <span className="japanese-label">ベトナム国籍者向けの手続き</span>
        </button>

        <button
          className="get-number-button"
          onClick={() => handleSelect("N")}
        >
          日本人およびその他の国籍の方の手続き
          <br />
          <span className="japanese-label">Queue Number for Japanese and Other Nationalities</span>
        </button>
      </div>
    </div>
    <div className="footer-logo-get-number">
          <div className="footer-logo-text-get-number">
            <span> Hệ thống được phát triển bởi</span>
          </div>

          <img sizes="(max-width: 25000px) 100vw, 600px" src={vnext_logo_orange} alt="logo" />

        </div>
    </>
  );
};

export default GetNumberOption;
