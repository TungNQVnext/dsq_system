import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/GetNumberOption.css";
import { API_URL } from "../setting";
import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

const GetNumberOption = () => {
  useAuthGuard();

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
    </>
  );
};

export default GetNumberOption;
