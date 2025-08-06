import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAllServiceTypes } from "../utils/serviceUtils";
import "../styles/GetNumberService.css";
// import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";
import { HeaderDisplay } from "../components/HeaderDisplay";
import { FooterDisplay } from "../components/FooterDisplay";

const GetNumberService = () => {
  // useAuthGuard();
  const navigate = useNavigate();
  const location = useLocation();
  const { prefix } = location.state || {};

  const [selectedServices, setSelectedServices] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    document.title = "Chọn loại dịch vụ";
  }, []);

  const services = getAllServiceTypes();

  const handleServiceToggle = (serviceId) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleComplete = () => {
    if (selectedServices.length === 0) {
      alert("Vui lòng chọn ít nhất một loại dịch vụ / 少なくとも1つのサービスを選択してください");
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    const selectedServiceNames = selectedServices.map(serviceId => {
      const service = services.find(s => s.id === serviceId);
      return `${service.vietnamese} / ${service.japanese}`;
    });
    
    navigate("/get-number", { 
      state: { 
        prefix,
        services: selectedServices,
        serviceNames: selectedServiceNames
      } 
    });
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  const handleGoBack = () => {
    navigate("/get-number-option");
  };

  const getSelectedServiceNames = () => {
    return selectedServices.map(serviceId => {
      const service = services.find(s => s.id === serviceId);
      return `${service.vietnamese} / ${service.japanese}`;
    });
  };

  return (
    <>
      <HeaderDisplay />
      <div className="get-number-service-container">
        <h1 className="get-number-service-title">Chọn Loại Dịch Vụ</h1>
        <p className="get-number-service-subtitle">サービスタイプの選択</p>

        <div className="service-options">
          <p className="service-label">Chọn các loại dịch vụ cần thiết / 必要なサービスを選択してください</p>

          <div className="service-buttons-grid">
            {services.map(service => (
              <button
                key={service.id}
                className={`service-button ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                onClick={() => handleServiceToggle(service.id)}
              >
                <span className="vietnamese-text">{service.vietnamese}</span>
                <br />
                <span className="japanese-text">{service.japanese}</span>
                {selectedServices.includes(service.id) && (
                  <span className="checkmark">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="action-buttons" style={{display: 'flex', flexDirection: 'row', gap: '15px'}}>
            <button
              className="complete-button"
              onClick={handleComplete}
              disabled={selectedServices.length === 0}
            >
              Hoàn Thành / 完了
            </button>
            
            <button
              className="back-button"
              onClick={handleGoBack}
            >
              Quay lại / 戻る
            </button>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Xác nhận lựa chọn / 選択の確認</h3>
            <p>Bạn đã chọn các dịch vụ sau / 以下のサービスを選択しました:</p>
            <ul className="selected-services-list">
              {getSelectedServiceNames().map((serviceName, index) => (
                <li key={index}>{serviceName}</li>
              ))}
            </ul>
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleConfirm}>
                Xác nhận / 確認
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                Hủy / キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterDisplay />
    </>
  );
};

export default GetNumberService;
