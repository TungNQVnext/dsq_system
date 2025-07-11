import React, { useState, useEffect } from 'react';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { LANGUAGES } from "../constants/constants";
import { API_URL } from "../setting";
import { useWebSocket } from "../hooks/useWebSocket";
import "../styles/ReceiveNumber.css";

const ReceiveNumber = () => {
  const [currentNumber, setCurrentNumber] = useState(null);
  const [queueItems, setQueueItems] = useState([]);
  const [allItems, setAllItems] = useState([]); // Store all items for filtering
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // For button actions
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ready'); // 'ready', 'cancel', 'completed'
  
  const [waitingCount, setWaitingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [finishedCount, setFinishedCount] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("vietnamese+japanese");
  
  // Initialize selectedDoor from localStorage or default to "1"
  const [selectedDoor, setSelectedDoor] = useState(() => {
    return localStorage.getItem('selectedDoor') || "1";
  });
  
  // Initialize selectedNationality based on localStorage or selectedDoor
  const [selectedNationality, setSelectedNationality] = useState(() => {
    const savedNationality = localStorage.getItem('selectedNationality');
    if (savedNationality) {
      return savedNationality;
    }
    // Fallback to door-based default
    const savedDoor = localStorage.getItem('selectedDoor') || "1";
    if (savedDoor === "1" || savedDoor === "2") {
      return "vietnam";
    } else if (savedDoor === "3") {
      return "other";
    }
    return "vietnam";
  });

  // WebSocket for real-time updates
  const { subscribe } = useWebSocket();

  // Calculate counts based on current filter
  const calculateCounts = (data = allItems) => {
    // Filter and count by status
    const waitingItems = data.filter(item => item.status === 'ready');
    const completedItems = data.filter(item => item.status === 'completed');
    const skippedItems = data.filter(item => item.status === 'cancel');
    
    // Apply nationality filter for counts
    const getFilteredItems = (items) => {
      if (selectedNationality === "all") return items;
      if (selectedNationality === "vietnam") {
        return items.filter(item => 
          item.nationality && item.nationality.toLowerCase().includes("việt nam")
        );
      }
      if (selectedNationality === "other") {
        return items.filter(item => 
          !item.nationality || !item.nationality.toLowerCase().includes("việt nam")
        );
      }
      return items;
    };
    
    // Set counts with nationality filter applied
    setWaitingCount(getFilteredItems(waitingItems).length);
    setCompletedCount(getFilteredItems(skippedItems).length);
    setFinishedCount(getFilteredItems(completedItems).length);
  };

  // Fetch call numbers from API
  const fetchCallNumbers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/receive_number/call-numbers`);
      if (!response.ok) {
        throw new Error('Failed to fetch call numbers');
      }
      const data = await response.json();
      
      // Store all data
      setAllItems(data);
      
      // Calculate counts based on current filter
      calculateCounts(data);
      
      // Update queue items based on active tab
      updateQueueItemsForTab(activeTab, data);
      
      // Set current serving number (first serving item or first ready item)
      const waitingItems = data.filter(item => item.status === 'ready');
      const servingItem = data.find(item => item.status === 'serving') || waitingItems[0];
      if (servingItem) {
        setCurrentNumber({
          id: servingItem.id, 
          number: servingItem.number,
          nationality: servingItem.nationality,
          startTime: new Date(servingItem.updated_date).toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: servingItem.status
        });
      } else {
        setCurrentNumber(null); 
      }
      
      setError(null);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update call number status
  const updateCallNumberStatus = async (callNumberId, newStatus) => {
    try {
      if (!callNumberId) {
        throw new Error('Call number ID is required');
      }
      
      const response = await fetch(`${API_URL}/receive_number/call-numbers/${callNumberId}/status?new_status=${newStatus}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update status: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      // Refresh data after update
      await fetchCallNumbers();
      
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  // Update queue items based on active tab
  const updateQueueItemsForTab = (tab, data = allItems) => {
    let filteredItems = [];
    switch (tab) {
      case 'ready':
        filteredItems = data.filter(item => item.status === 'ready');
        break;
      case 'cancel':
        filteredItems = data.filter(item => item.status === 'cancel');
        break;
      case 'completed':
        filteredItems = data.filter(item => item.status === 'completed');
        break;
      default:
        filteredItems = data.filter(item => item.status === 'ready');
    }
    
    // Apply nationality filter
    if (selectedNationality !== "all") {
      if (selectedNationality === "vietnam") {
        filteredItems = filteredItems.filter(item => 
          item.nationality && item.nationality.toLowerCase().includes("việt nam")
        );
      } else if (selectedNationality === "other") {
        filteredItems = filteredItems.filter(item => 
          !item.nationality || !item.nationality.toLowerCase().includes("việt nam")
        );
      }
    }
    
    setQueueItems(filteredItems);
  };

  // Handle door change
  const handleDoorChange = (doorNumber) => {
    setSelectedDoor(doorNumber);
    

    localStorage.setItem('selectedDoor', doorNumber);
    

    let newNationality;
    if (doorNumber === "1" || doorNumber === "2") {
      newNationality = "vietnam";
    } else if (doorNumber === "3") {
      newNationality = "other";
    }
    
    setSelectedNationality(newNationality);
    localStorage.setItem('selectedNationality', newNationality);
  };

  // Handle tab click
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    updateQueueItemsForTab(tab);
  };

  // Handle button actions
  const handleCallAgain = () => {
    if (currentNumber) {

    }
  };

  const handleSkip = async () => {
    if (currentNumber && currentNumber.id) {
      setActionLoading(true);
      try {
        await updateCallNumberStatus(currentNumber.id, 'cancel');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleComplete = async () => {
    if (currentNumber && currentNumber.id) {
      setActionLoading(true);
      try {
        await updateCallNumberStatus(currentNumber.id, 'completed');
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleCallNext = async () => {
    if (actionLoading) return;
    
    const readyItems = allItems.filter(item => item.status === 'ready');
    const nextWaiting = readyItems[0]; 
    if (nextWaiting && nextWaiting.id) {
      setActionLoading(true);
      try {
        await updateCallNumberStatus(nextWaiting.id, 'serving');
      } finally {
        setActionLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCallNumbers();
  }, []);

  useEffect(() => {
    // WebSocket real-time updates - remove dependency to prevent re-subscription
    if (!subscribe) return;
    
    const unsubscribe = subscribe("call_number_updated", (message) => {
      console.log("📡 Real-time update received:", message);
      // Auto-update when call numbers change
      fetchCallNumbers();
    });

    return () => {
      unsubscribe();
    };
  }, []); 



  // Update queue items when activeTab changes
  useEffect(() => {
    if (allItems.length > 0) {
      updateQueueItemsForTab(activeTab);
    }
  }, [activeTab, allItems, selectedNationality, selectedDoor]); 

  // Update counts when nationality filter changes
  useEffect(() => {
    if (allItems.length > 0) {
      calculateCounts();
    }
  }, [selectedNationality]); // Chỉ theo dõi selectedNationality để cập nhật số lượng 

 

    return (
    <div className='receive-number-container'>
      <Header/>
      
      {/* Title Section */}
      <div className="title-section">
        <div className="title-wrapper">
          <div className="title-header">
            <h1 className="title-text">
              Hệ thống nhận hồ sơ
            </h1>
          </div>
          
          <div className="controls-section">
            <div className="control-group">
              <span className="control-label">Cửa:</span>
              <select 
                value={selectedDoor}
                onChange={(e) => handleDoorChange(e.target.value)}
                className="control-select"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>
            
            <div className="control-group">
              <span className="control-label">Giọng nói:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="control-select"
              >
                {Object.entries(LANGUAGES).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content - Takes remaining space */}
      <div className="main-content">
        {/* Content Area */}
        <div className="content-area">
          {/* Left Panel - Queue List */}
          <div className="left-panel">
            <div className="queue-container">
              {/* Header */}
              <div className="queue-header">
                <h2 className="queue-title">
                  Danh sách số
                </h2>
                <div className="nationality-filter">
                  <select 
                    value={selectedNationality}
                    onChange={(e) => {
                      setSelectedNationality(e.target.value);
                      localStorage.setItem('selectedNationality', e.target.value);
                    }}
                    className="nationality-select"
                  >
                    <option value="all">Tất cả quốc tịch</option>
                    <option value="vietnam">Việt Nam</option>
                    <option value="other">Quốc tịch khác</option>
                  </select>
                </div>
              </div>

              {/* Tabs */}
              <div className="tabs-container">
                <button 
                  onClick={() => handleTabClick('ready')}
                  className={`tab-button ${activeTab === 'ready' ? 'active' : ''}`}
                >
                  Hàng đợi sẵn sàng ({waitingCount})
                </button>
                <button 
                  onClick={() => handleTabClick('cancel')}
                  className={`tab-button ${activeTab === 'cancel' ? 'active' : ''}`}
                >
                  Đã bỏ qua ({completedCount})
                </button>
                <button 
                  onClick={() => handleTabClick('completed')}
                  className={`tab-button ${activeTab === 'completed' ? 'active' : ''}`}
                >
                  Đã hoàn tất ({finishedCount})
                </button>
              </div>

              {/* Queue Items */}
              <div className="queue-items">
                {loading ? (
                  <div className="loading-state">
                    <div className="loading-text">Đang tải...</div>
                  </div>
                ) : error ? (
                  <div className="error-state">
                    <div className="error-text">{error}</div>
                  </div>
                ) : queueItems.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-text">Không có số nào trong hàng đợi</div>
                  </div>
                ) : (
                  queueItems.map((item, index) => (
                    <div key={item.id || index} className="queue-item">
                      <div className="queue-item-content">
                        <div className="queue-number">
                          {item.number}
                        </div>
                        <div className="queue-details">
                          <div className="queue-nationality">
                            {item.nationality}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Current Serving */}
          <div className="right-panel">
            <div className="current-serving-container">
              <h2 className="current-serving-title">
                Số đang xử lý
              </h2>
              
              {/* Current Number Display */}
              <div className="current-number-display">
                {currentNumber ? (
                  <div className="current-number">
                    {currentNumber.number}
                  </div>
                ) : (
                  <div className="no-number">
                    Chưa có số nào
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button 
                  onClick={handleCallAgain}
                  disabled={!currentNumber || actionLoading}
                  className="action-button btn-secondary"
                >
                  Gọi lại
                </button>
                <button 
                  onClick={handleSkip}
                  disabled={!currentNumber || actionLoading}
                  className="action-button btn-secondary"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Bỏ qua'}
                </button>
                <button 
                  onClick={handleComplete}
                  disabled={!currentNumber || actionLoading}
                  className="action-button btn-primary"
                >
                  {actionLoading ? 'Đang xử lý...' : 'Hoàn tất'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bottom-controls">
          <button 
            disabled={waitingCount === 0}
            className="bottom-button btn-success"
          >
            Gọi tiếp
          </button>
          
         
          <button className="bottom-button btn-outline">
            Gọi thủ công
          </button>
        </div>
      </div>
      
      {/* Footer - Always at bottom */}
      <Footer/>
    </div>
    
  );
};

export default ReceiveNumber;

