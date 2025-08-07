import React, { useState, useEffect, useCallback, use } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { LANGUAGES } from "../constants/constants";
import { API_URL } from "../setting";
import { useWebSocket } from "../hooks/returnNumberHook/useWebSocket";
import { useReceiveWebSocket } from "../hooks/receiveNumberHook/useReceiveWebSocket";
import { getServiceTypeName } from "../utils/serviceUtils";
import "../styles/ReceiveNumber.css";
import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";

const ReceiveNumber = () => {
  useAuthGuard();
  useEffect(() => {
    document.title = "Quản lý tiếp nhận hồ sơ";
  }, []);
  const navigate = useNavigate();
  
  const [currentNumber, setCurrentNumber] = useState(null);
  const [queueItems, setQueueItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ready');
  
  const [waitingCount, setWaitingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [finishedCount, setFinishedCount] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("vietnamese+japanese");
  const [isCalling, setIsCalling] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCounterServing, setIsCounterServing] = useState(false);

  const [selectedDoor, setSelectedDoor] = useState(() => {
    return localStorage.getItem('selectedDoor') || "1";
  });
  

  const [selectedNationality, setSelectedNationality] = useState(() => {
    const savedNationality = localStorage.getItem('selectedNationality');
    if (savedNationality) {
      return savedNationality;
    }

    const savedDoor = localStorage.getItem('selectedDoor') || "1";
    if (savedDoor === "1" || savedDoor === "2") {
      return "vietnam";
    } else if (savedDoor === "3") {
      return "other";
    }
    return "vietnam";
  });


  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);


  const { subscribe } = useWebSocket();
  const { subscribe: subscribeReceive, sendCallNotification } = useReceiveWebSocket();


  const createCurrentNumberObject = (item) => {
    if (!item) return null;
    return {
      id: item.id,
      number: item.number,
      prefix: item.prefix,
      nationality: item.nationality,
      service_type: item.service_type,
      startTime: new Date(item.updated_date).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      status: item.status
    };
  };


  const getDisplayNumber = (item) => {
    if (!item) return '';
    
    const prefix = item.prefix || '';
    const number = item.number || '';
    

    if (prefix && number.startsWith(prefix)) {
      return number;
    }
    

    return prefix + number;
  };


  const getNextCallableNumber = () => {
    if (activeTab !== 'ready') return null;
    

    const todayItems = allItems.filter(item => isToday(item.created_date || item.updated_date));
    

    let filteredItems = todayItems;
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
    

    const currentCounterServingItem = filteredItems.find(item => 
      item.status === 'serving' && item.counter === selectedDoor
    );
    
    if (currentCounterServingItem) {
      return null;
    }
    

    const readyItems = filteredItems.filter(item => item.status === 'ready');
    return readyItems[0] || null;
  };


  const isToday = (dateString) => {
    const today = new Date();
    const itemDate = new Date(dateString);
    return today.toDateString() === itemDate.toDateString();
  };


  const fetchCounterStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/receive_number/counter/${selectedDoor}/status`);
      if (response.ok) {
        const statusData = await response.json();
        setIsCounterServing(statusData.is_serving);
      }
    } catch (err) {
      console.error('Error fetching counter status:', err);
    }
  }, [selectedDoor]);


  const isCurrentCounterServing = () => {
    return isCounterServing;
  };


  const isCallingAllowed = () => {
    if (!currentNumber) return false;
    

    if (isCalling || isSpeaking || actionLoading) return false;

    if (!['ready', 'serving', 'cancel', 'completed'].includes(currentNumber.status)) return false;

    if (!canControlCurrentNumber()) return false;

    if (isCurrentCounterServing() && currentNumber.status === 'serving') {
      const todayItems = allItems.filter(item => isToday(item.created_date || item.updated_date));
      const servingItem = todayItems.find(item => item.id === currentNumber.id);
      return servingItem && servingItem.counter === selectedDoor;
    }

    if (isCurrentCounterServing()) return false;
    
    return true;
  };

  const isSearchCallingAllowed = () => {
    return !isCalling && 
           !isSpeaking && 
           !actionLoading && 
           !isCurrentCounterServing();
  };

  const canControlSpecificNumber = (item) => {
    if (!item) return false;

    if (item.status === 'serving') {
      return item.counter === selectedDoor;
    }
    return true;
  };

  const canControlCurrentNumber = () => {
    if (!currentNumber) return false;

    if (currentNumber.status === 'serving') {
      const todayItems = allItems.filter(item => isToday(item.created_date || item.updated_date));
      const servingItem = todayItems.find(item => item.id === currentNumber.id);
      
      if (servingItem && servingItem.counter) {
        return servingItem.counter === selectedDoor;
      }
    }
    return true;
  };

  const calculateCounts = (data = allItems) => {
    const todayItems = data.filter(item => isToday(item.created_date || item.updated_date));
    
    const waitingItems = todayItems.filter(item => item.status === 'ready' || item.status === 'serving');
    const completedItems = todayItems.filter(item => item.status === 'completed');
    const skippedItems = todayItems.filter(item => item.status === 'cancel');
    
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
    
    setWaitingCount(getFilteredItems(waitingItems).length);
    setCompletedCount(getFilteredItems(skippedItems).length);
    setFinishedCount(getFilteredItems(completedItems).length);
  };

  const fetchCallNumbers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/receive_number/call-numbers`);
      if (!response.ok) {
        throw new Error('Failed to fetch call numbers');
      }
      const data = await response.json();
      
      setAllItems(data);
      
      calculateCounts(data);
      
      updateQueueItemsForTab(activeTab, data);
      
      if (activeTab === 'ready') {
        const todayItems = data.filter(item => isToday(item.created_date || item.updated_date));
        
        const currentCounterServingItem = todayItems.find(item => 
          item.status === 'serving' && item.counter === selectedDoor
        );
        
        if (currentCounterServingItem) {
          setCurrentNumber(createCurrentNumberObject(currentCounterServingItem));
        } else {
          const readyItems = todayItems.filter(item => item.status === 'ready');
          const nextReady = readyItems[0];
          if (nextReady) {
            setCurrentNumber(createCurrentNumberObject(nextReady));
          } else {
            setCurrentNumber(null); 
          }
        }
      }
      
      setError(null);
    } catch (err) {
      setError('Lỗi khi tải dữ liệu: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

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

      await fetchCallNumbers();
      await fetchCounterStatus();
      
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  const updateQueueItemsForTab = (tab, data = allItems) => {
    const todayItems = data.filter(item => isToday(item.created_date || item.updated_date));
    
    let filteredItems = [];
    switch (tab) {
      case 'ready':
        filteredItems = todayItems.filter(item => item.status === 'ready' || item.status === 'serving');
        break;
      case 'cancel':
        filteredItems = todayItems.filter(item => item.status === 'cancel');
        break;
      case 'completed':
        filteredItems = todayItems.filter(item => item.status === 'completed');
        break;
      default:
        filteredItems = todayItems.filter(item => item.status === 'ready');
    }
    
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
    
    if (tab === 'ready') {
      let servingItems = todayItems.filter(item => item.status === 'serving');
      let readyItems = todayItems.filter(item => item.status === 'ready');
      
      if (selectedNationality !== "all") {
        if (selectedNationality === "vietnam") {
          servingItems = servingItems.filter(item => 
            item.nationality && item.nationality.toLowerCase().includes("việt nam")
          );
          readyItems = readyItems.filter(item => 
            item.nationality && item.nationality.toLowerCase().includes("việt nam")
          );
        } else if (selectedNationality === "other") {
          servingItems = servingItems.filter(item => 
            !item.nationality || !item.nationality.toLowerCase().includes("việt nam")
          );
          readyItems = readyItems.filter(item => 
            !item.nationality || !item.nationality.toLowerCase().includes("việt nam")
          );
        }
      }
      
      const currentCounterServingItem = servingItems.find(item => 
        item.counter === selectedDoor
      );
      
      let currentItem;
      if (currentCounterServingItem) {
        currentItem = currentCounterServingItem;
      } else {
        currentItem = readyItems[0];
      }
      
      if (currentItem) {
        setCurrentNumber(createCurrentNumberObject(currentItem));
      } else {
        setCurrentNumber(null); 
      }
    } else {
      if (filteredItems.length > 0) {
        const firstItem = filteredItems[0];
        setCurrentNumber(createCurrentNumberObject(firstItem));
      } else {
        setCurrentNumber(null);
      }
    }
  };

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
    fetchCallNumbers();
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    updateQueueItemsForTab(tab);
  };

  const handleQueueItemClick = (item) => {
    setCurrentNumber(createCurrentNumberObject(item));
  };

  const handleCallAgain = () => {
    if (currentNumber) {
      handleCallNumber(currentNumber.id);
    }
  };

  const handleCallNumber = async (callNumberId = null) => {
    const idToCall = callNumberId || (currentNumber && currentNumber.id);
    
    if (!idToCall) {
      console.warn("No call number ID to call");
      return;
    }

    setIsCalling(true);
    try {
      const requestPayload = {
        call_number_id: idToCall,
        language: selectedLanguage,
        counter: selectedDoor
      };
      
      const response = await fetch(`${API_URL}/receive_number/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to call number: ${response.status} - ${errorData}`);
      }

      const result = await response.json();

      await fetchCallNumbers();
      await fetchCounterStatus();
      
    } catch (err) {
      setError('Lỗi khi gọi số: ' + err.message);
      console.error("Call number error:", err);
    } finally {
      setIsCalling(false);
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

    const todayItems = allItems.filter(item => isToday(item.created_date || item.updated_date));
    const readyItems = todayItems.filter(item => item.status === 'ready');
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

  const getDisplayTitle = () => {
    switch (activeTab) {
      case 'ready':
        return 'Số đang xử lý';
      case 'cancel':
        return 'Số đã bỏ qua';
      case 'completed':
        return 'Số đã hoàn tất';
      default:
        return 'Số đang xử lý';
    }
  };

  useEffect(() => {
    fetchCallNumbers();
    fetchCounterStatus();
  }, []);

  useEffect(() => {
    fetchCounterStatus();

    if (allItems.length > 0) {

      const todayItems = allItems.filter(item => isToday(item.created_date || item.updated_date));
      
      if (activeTab === 'ready') {

        const newCounterServingItem = todayItems.find(item => 
          item.status === 'serving' && item.counter === selectedDoor
        );
        
        if (newCounterServingItem) {

          setCurrentNumber(createCurrentNumberObject(newCounterServingItem));
        } else {
          const callableItems = todayItems.filter(item => ['ready', 'serving', 'cancel', 'completed'].includes(item.status));
          const nextCallable = callableItems[0];
          if (nextCallable) {
            setCurrentNumber(createCurrentNumberObject(nextCallable));
          } else {
            setCurrentNumber(null); 
          }
        }
      }
    }
  }, [selectedDoor, allItems, activeTab]);

  useEffect(() => {
    if (!subscribe) return;
    
    const unsubscribe = subscribe("call_number_updated", (message) => {
      console.log("Real-time update received:", message);

      fetchCallNumbers();
      fetchCounterStatus();
    });

    return () => {
      unsubscribe();
    };
  }, []); 

  useEffect(() => {
    if (!subscribeReceive) return;
    
    const unsubscribe = subscribeReceive("all", (message) => {
      if (message.type === "reading_start") {
        setIsSpeaking(true);
      } else if (message.type === "reading_end") {
        setIsSpeaking(false);
        fetchCallNumbers();
        fetchCounterStatus();
      } else if (message.type === "call") {
        fetchCallNumbers();
        fetchCounterStatus();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeReceive, fetchCallNumbers]);

  useEffect(() => {
    if (allItems.length > 0) {
      updateQueueItemsForTab(activeTab);
    }
  }, [activeTab, allItems, selectedNationality, selectedDoor]); 

  useEffect(() => {
    if (allItems.length > 0) {
      calculateCounts();
    }
  }, [selectedNationality]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = document.querySelector('.search-container');
      if (searchContainer && !searchContainer.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };

    if (showSearchDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchDropdown]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const todayItems = allItems.filter(item => isToday(item.created_date || item.updated_date));
    const queryLower = query.trim().toLowerCase();
    
    const results = todayItems.filter(item => {
      if (!['ready', 'serving', 'cancel', 'completed'].includes(item.status)) return false;
      
      const displayNumber = getDisplayNumber(item);
      const numberOnly = item.number ? item.number.toString() : '';
      const prefixOnly = item.prefix ? item.prefix.toString() : '';
      
      return displayNumber.toLowerCase().includes(queryLower) ||
             numberOnly.toLowerCase().includes(queryLower) ||
             prefixOnly.toLowerCase().includes(queryLower);
    });
    
    setSearchResults(results);
    setShowSearchDropdown(true);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      const firstResult = searchResults[0];
      if (isSearchCallingAllowed() && canControlSpecificNumber(firstResult)) {
        handleCallNumber(firstResult.id);
        setSearchQuery('');
        setShowSearchDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  const handleSearchFocus = () => {
    setSearchInputFocused(true);
    if (searchQuery.trim() !== '' && searchResults.length >= 0) {
      setShowSearchDropdown(true);
    }
  };

  const handleSearchBlur = () => {
    setSearchInputFocused(false);
    setTimeout(() => {
      if (!searchInputFocused) {
        setShowSearchDropdown(false);
      }
    }, 200);
  };

  const handleSearchResultClick = (result) => {
    if (isSearchCallingAllowed() && canControlSpecificNumber(result)) {
      handleCallNumber(result.id);
    }
    setSearchQuery('');
    setShowSearchDropdown(false);
  };

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
              <span className="control-label">Quầy:</span>
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

      {/* Main Content */}
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
                <div className="header-controls">
                  <div className="search-container">
                    <input 
                      type="text"
                      placeholder="Tìm kiếm số / Gọi thủ công..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onKeyDown={handleSearchKeyDown}
                      onFocus={handleSearchFocus}
                      onBlur={handleSearchBlur}
                      className="search-input"
                    />
                    {showSearchDropdown && (
                      <div className="search-dropdown">
                        {searchResults.length === 0 ? (
                          <div className="search-no-results">
                            Không tìm thấy số
                          </div>
                        ) : (
                          <div>
                            {!isSearchCallingAllowed() && (
                              <div className="search-warning">
                                Không thể gọi số khi quầy đang phục vụ
                              </div>
                            )}
                            {searchResults.map((result, index) => {
                              const canControlResult = canControlSpecificNumber(result);
                              const isDisabled = !isSearchCallingAllowed() || !canControlResult;
                              const titleText = !isSearchCallingAllowed() ? 
                                'Không thể gọi số khi quầy đang phục vụ' : 
                                (!canControlResult ? 'Số này đang được phục vụ ở quầy khác' : '');
                              
                              return (
                                <div 
                                  key={result.id || index}
                                  className={`search-result-item ${isDisabled ? 'disabled' : ''}`}
                                  onMouseDown={() => handleSearchResultClick(result)}
                                  title={titleText}
                                >
                                  <span className="search-result-number">
                                    {getDisplayNumber(result)}
                                  </span>
                                  <span className="search-result-nationality">{result.nationality}</span>
                                  <span className="search-result-status">{
                                    result.status === 'ready' ? 'Sẵn sàng' :
                                    result.status === 'serving' ? (result.counter ? `Đang phục vụ ở quầy ${result.counter}` : 'Đang phục vụ') :
                                    result.status === 'completed' ? 'Hoàn tất' :
                                    result.status === 'cancel' ? 'Đã bỏ qua' : result.status
                                  }</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
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
                  queueItems.map((item, index) => {
                    const nextCallable = getNextCallableNumber();
                    const isSelected = currentNumber && currentNumber.id === item.id;
                    const isNextCallable = !isSelected && nextCallable && nextCallable.id === item.id;
                    const isServing = item.status === 'serving';
                    
                    return (
                      <div 
                        key={item.id || index} 
                        className={`queue-item ${isSelected ? 'selected' : ''} ${isServing ? 'serving' : ''} ${isNextCallable ? 'next-callable' : ''}`}
                        onClick={() => handleQueueItemClick(item)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="queue-item-content">
                          <div className="queue-number">
                            {getDisplayNumber(item)}
                            {item.status === 'serving' && (
                              <div className="serving-indicator">
                                {item.counter ? `đang phục vụ ở quầy ${item.counter}` : 'đang phục vụ'}
                              </div>
                            )}
                          </div>
                          <div className="queue-details">
                            <div className="queue-nationality">
                              {item.nationality}
                            </div>
                            {item.service_type && (
                              <div className="queue-service">
                                Dịch vụ: {getServiceTypeName(item.service_type)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="right-panel">
            <div className="number-display-container">
              <h2 className="number-display-title">
                {getDisplayTitle()}
              </h2>
              
              <div className="current-number-display">
                {currentNumber ? (
                  <div className="current-number-info">
                    <div className="current-number">
                      {getDisplayNumber(currentNumber)}
                    </div>
                    {currentNumber.service_type && (
                      <div className="current-service">
                        Dịch vụ: {getServiceTypeName(currentNumber.service_type)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-number">
                    Chưa có số nào
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                {activeTab !== 'cancel' && activeTab !== 'completed' && (
                  <button 
                    onClick={handleSkip}
                    disabled={!currentNumber || actionLoading || !canControlCurrentNumber()}
                    className="action-button btn-secondary"
                    title={currentNumber && currentNumber.status === 'serving' && !canControlCurrentNumber() ? 
                      `Chỉ quầy đang phục vụ số này mới có thể thao tác` : ''}
                  >
                    {actionLoading ? 'Đang xử lý...' : 'Bỏ qua'}
                  </button>
                )}
                {activeTab !== 'completed' && (
                  <button 
                    onClick={handleComplete}
                    disabled={!currentNumber || actionLoading || !canControlCurrentNumber()}
                    className="action-button btn-primary"
                    title={currentNumber && currentNumber.status === 'serving' && !canControlCurrentNumber() ? 
                      `Chỉ quầy đang phục vụ số này mới có thể thao tác` : ''}
                  >
                    {actionLoading ? 'Đang xử lý...' : 'Hoàn tất'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="bottom-controls">
          <button 
            onClick={() => handleCallNumber()}
            disabled={!isCallingAllowed()}
            className={`bottom-button ${!isCallingAllowed() ? 'btn-disabled' : 'btn-success'}`}
          >
            {isCalling ? 'Đang gọi...' : 
             isSpeaking ? 'Đang phát âm thanh...' : 
             (currentNumber && currentNumber.status === 'serving') ? 'Đang phục vụ' : 
             isCurrentCounterServing() ? 'Đang phục vụ' : 'Gọi'}
          </button>
        </div>

        {/* Back to Menu Button */}
        <div className="back-to-menu-container">
          <button 
            className="btn-back-to-menu"
            onClick={() => navigate('/menu')}
          >
            ← Quay về Menu
          </button>
        </div>
      </div>
      
      {/* Footer - Always at bottom */}
      <Footer/>
    </div>
    
  );
};

export default ReceiveNumber;

