import React, { useState, useEffect, useCallback } from 'react';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { LANGUAGES } from "../constants/constants";
import { API_URL } from "../setting";
import { useWebSocket } from "../hooks/returnNumberHook/useWebSocket";
import { useReceiveWebSocket } from "../hooks/receiveNumberHook/useReceiveWebSocket";
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
  const [isCalling, setIsCalling] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCounterServing, setIsCounterServing] = useState(false); // Track if current counter is serving
  
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

  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchInputFocused, setSearchInputFocused] = useState(false);

  // WebSocket for real-time updates
  const { subscribe } = useWebSocket();
  const { subscribe: subscribeReceive, sendCallNotification } = useReceiveWebSocket();

  // Helper function to create currentNumber object
  const createCurrentNumberObject = (item) => {
    if (!item) return null;
    return {
      id: item.id,
      number: item.number,
      prefix: item.prefix,
      nationality: item.nationality,
      startTime: new Date(item.updated_date).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      status: item.status
    };
  };

  // Helper function to get display number (handle prefix duplication)
  const getDisplayNumber = (item) => {
    if (!item) return '';
    
    const prefix = item.prefix || '';
    const number = item.number || '';
    
    // If number already starts with prefix, don't duplicate
    if (prefix && number.startsWith(prefix)) {
      return number;
    }
    
    // Otherwise, concatenate prefix + number
    return prefix + number;
  };

  // Helper function to check if date is today
  const isToday = (dateString) => {
    const today = new Date();
    const itemDate = new Date(dateString);
    return today.toDateString() === itemDate.toDateString();
  };

  // Fetch serving status for current counter
  // Fetch counter status for current counter
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

  // Check if current counter is serving
  const isCurrentCounterServing = () => {
    return isCounterServing;
  };

  // Check if calling is allowed (same logic as the main call button)
  const isCallingAllowed = () => {
    return currentNumber && 
           !isCalling && 
           !isSpeaking && 
           !actionLoading && 
           !(currentNumber && currentNumber.status === 'serving') && 
           !isCurrentCounterServing();
  };

  // Check if current counter can control the selected number (for skip/complete actions)
  const canControlCurrentNumber = () => {
    if (!currentNumber) return false;
    
    // If the number is serving, only the counter that is serving it can control it
    if (currentNumber.status === 'serving') {
      // Find the item in allItems to get the counter information
      const todayItems = allItems.filter(item => isToday(item.created_date || item.updated_date));
      const servingItem = todayItems.find(item => item.id === currentNumber.id);
      
      if (servingItem && servingItem.counter) {
        return servingItem.counter === selectedDoor;
      }
    }
    
    // For non-serving numbers, any counter can control
    return true;
  };

  // Calculate counts based on current filter
  const calculateCounts = (data = allItems) => {
    // Note: API already filters by today's date, but keeping client-side filter for extra safety
    const todayItems = data.filter(item => isToday(item.created_date || item.updated_date));
    
    // Filter and count by status
    const waitingItems = todayItems.filter(item => item.status === 'ready' || item.status === 'serving');
    const completedItems = todayItems.filter(item => item.status === 'completed');
    const skippedItems = todayItems.filter(item => item.status === 'cancel');
    
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
      
      // Only set current number from serving/ready items if we're on ready tab
      if (activeTab === 'ready') {
        // Note: API already filters by today's date, but keeping client-side filter for extra safety
        const todayItems = data.filter(item => isToday(item.created_date || item.updated_date));
        
        // Check if current counter is serving any number
        const currentCounterServingItem = todayItems.find(item => 
          item.status === 'serving' && item.counter === selectedDoor
        );
        
        if (currentCounterServingItem) {
          // If current counter is serving, show that number
          setCurrentNumber(createCurrentNumberObject(currentCounterServingItem));
        } else {
          // If current counter is not serving, show next ready number
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
      await fetchCounterStatus(); // Also refresh counter status
      
    } catch (err) {
      setError('Lỗi khi cập nhật trạng thái: ' + err.message);
    }
  };

  // Update queue items based on active tab
  const updateQueueItemsForTab = (tab, data = allItems) => {
    // Note: API already filters by today's date, but keeping client-side filter for extra safety
    const todayItems = data.filter(item => isToday(item.created_date || item.updated_date));
    
    let filteredItems = [];
    switch (tab) {
      case 'ready':
        // Include both ready and serving items in the ready tab
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
    
    // Update current number based on active tab
    if (tab === 'ready') {
      // For ready tab, show serving item for selected counter or first ready item
      let servingItems = todayItems.filter(item => item.status === 'serving');
      let readyItems = todayItems.filter(item => item.status === 'ready');
      
      // Apply nationality filter to both serving and ready items
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
      
      // PRIORITY 1: Check if selected counter is serving any number
      const currentCounterServingItem = servingItems.find(item => 
        item.counter === selectedDoor
      );
      
      let currentItem;
      if (currentCounterServingItem) {
        // ALWAYS show what this counter is serving (keep the current serving number)
        currentItem = currentCounterServingItem;
      } else {
        // PRIORITY 2: Only show next ready item if counter is not serving anything
        currentItem = readyItems[0];
      }
      
      if (currentItem) {
        setCurrentNumber(createCurrentNumberObject(currentItem));
      } else {
        setCurrentNumber(null); 
      }
    } else {
      // For cancel/completed tabs, show first item in the filtered list
      if (filteredItems.length > 0) {
        const firstItem = filteredItems[0];
        setCurrentNumber(createCurrentNumberObject(firstItem));
      } else {
        setCurrentNumber(null);
      }
    }
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
    
    // Refresh data to update currentNumber for new counter
    fetchCallNumbers();
  };

  // Handle tab click
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    updateQueueItemsForTab(tab);
  };

  // Handle queue item click
  const handleQueueItemClick = (item) => {
    setCurrentNumber(createCurrentNumberObject(item));
  };

  // Handle button actions
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
      console.log("Call number result:", result);
      
      // Refresh data after calling
      await fetchCallNumbers();
      await fetchCounterStatus(); // Also refresh counter status
      
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
    
    // Filter by today's date first
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

  // Get display title based on active tab
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
    fetchCounterStatus(); // Fetch counter status on mount
  }, []);

  // Fetch counter status when selectedDoor changes
  useEffect(() => {
    fetchCounterStatus();
    // Also refresh call numbers to update currentNumber for the new counter
    if (allItems.length > 0) {
      // Use existing data to update currentNumber for new counter
      const todayItems = allItems.filter(item => isToday(item.created_date || item.updated_date));
      
      if (activeTab === 'ready') {
        // PRIORITY 1: Check if new counter is serving any number
        const newCounterServingItem = todayItems.find(item => 
          item.status === 'serving' && item.counter === selectedDoor
        );
        
        if (newCounterServingItem) {
          // ALWAYS show what this counter is serving (keep the current serving number)
          setCurrentNumber(createCurrentNumberObject(newCounterServingItem));
        } else {
          // PRIORITY 2: Only show next ready number if counter is not serving anything
          const readyItems = todayItems.filter(item => item.status === 'ready');
          const nextReady = readyItems[0];
          if (nextReady) {
            setCurrentNumber(createCurrentNumberObject(nextReady));
          } else {
            setCurrentNumber(null); 
          }
        }
      }
    }
  }, [selectedDoor, allItems, activeTab]);

  useEffect(() => {
    // WebSocket real-time updates - remove dependency to prevent re-subscription
    if (!subscribe) return;
    
    const unsubscribe = subscribe("call_number_updated", (message) => {
      console.log("Real-time update received:", message);
      // Auto-update when call numbers change
      fetchCallNumbers();
      fetchCounterStatus(); // Also refresh counter status
    });

    return () => {
      unsubscribe();
    };
  }, []); 

  useEffect(() => {
    // Receive WebSocket for speaking status
    if (!subscribeReceive) return;
    
    const unsubscribe = subscribeReceive("all", (message) => {
      if (message.type === "reading_start") {
        setIsSpeaking(true);
      } else if (message.type === "reading_end") {
        setIsSpeaking(false);
        // Refresh data when speaking ends
        fetchCallNumbers();
        fetchCounterStatus(); // Also refresh counter status
      } else if (message.type === "call") {
        // Refresh data when call is made
        fetchCallNumbers();
        fetchCounterStatus(); // Also refresh counter status
      }
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeReceive, fetchCallNumbers]);



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
  }, [selectedNationality]);

  // Handle click outside to close search dropdown
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

  // Handle search functionality
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }
    
    // Search through all today's items
    const todayItems = allItems.filter(item => isToday(item.created_date || item.updated_date));
    const queryLower = query.trim().toLowerCase();
    
    const results = todayItems.filter(item => {
      // Get the properly formatted display number
      const displayNumber = getDisplayNumber(item);
      const numberOnly = item.number ? item.number.toString() : '';
      const prefixOnly = item.prefix ? item.prefix.toString() : '';
      
      // Search in display number, number only, or prefix only
      return displayNumber.toLowerCase().includes(queryLower) ||
             numberOnly.toLowerCase().includes(queryLower) ||
             prefixOnly.toLowerCase().includes(queryLower);
    });
    
    setSearchResults(results);
    setShowSearchDropdown(true);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      // Only call if calling is allowed (same conditions as main call button)
      if (isCallingAllowed()) {
        const firstResult = searchResults[0];
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
    // Delay hiding dropdown to allow clicking on results
    setTimeout(() => {
      if (!searchInputFocused) {
        setShowSearchDropdown(false);
      }
    }, 200);
  };

  const handleSearchResultClick = (result) => {
    // Only call if calling is allowed (same conditions as main call button)
    if (isCallingAllowed()) {
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
                <div className="header-controls">
                  <div className="search-container">
                    <input 
                      type="text"
                      placeholder="Tìm kiếm số..."
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
                            {!isCallingAllowed() && (
                              <div className="search-warning">
                                Không thể gọi số khi quầy đang phục vụ
                              </div>
                            )}
                            {searchResults.map((result, index) => (
                              <div 
                                key={result.id || index}
                                className={`search-result-item ${!isCallingAllowed() ? 'disabled' : ''}`}
                                onMouseDown={() => handleSearchResultClick(result)}
                                title={!isCallingAllowed() ? 'Không thể gọi số khi quầy đang phục vụ' : ''}
                              >
                                <span className="search-result-number">
                                  {getDisplayNumber(result)}
                                </span>
                                <span className="search-result-nationality">{result.nationality}</span>
                                <span className="search-result-status">{
                                  result.status === 'ready' ? 'Sẵn sàng' :
                                  result.status === 'serving' ? 'Đang phục vụ' :
                                  result.status === 'completed' ? 'Hoàn tất' :
                                  result.status === 'cancel' ? 'Đã bỏ qua' : result.status
                                }</span>
                              </div>
                            ))}
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
                  queueItems.map((item, index) => (
                    <div 
                      key={item.id || index} 
                      className={`queue-item ${currentNumber && currentNumber.id === item.id ? 'selected' : ''} ${item.status === 'serving' ? 'serving' : ''}`}
                      onClick={() => handleQueueItemClick(item)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="queue-item-content">
                        <div className="queue-number">
                          {getDisplayNumber(item)}
                          {item.status === 'serving' && <span className="serving-indicator">đang phục vụ</span>}
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

          <div className="right-panel">
            <div className="number-display-container">
              <h2 className="number-display-title">
                {getDisplayTitle()}
              </h2>
              
              <div className="current-number-display">
                {currentNumber ? (
                  <div className="current-number">
                    {getDisplayNumber(currentNumber)}
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
            disabled={!currentNumber || isCalling || isSpeaking || actionLoading || (currentNumber && currentNumber.status === 'serving') || isCurrentCounterServing()}
            className={`bottom-button ${isCalling || isSpeaking || (currentNumber && currentNumber.status === 'serving') || isCurrentCounterServing() ? 'btn-disabled' : 'btn-success'}`}
          >
            {isCalling ? 'Đang gọi...' : 
             isSpeaking ? 'Đang phát âm thanh...' : 
             (currentNumber && currentNumber.status === 'serving') ? 'Đang phục vụ' : 
             isCurrentCounterServing() ? 'Đang phục vụ' : 'Gọi'}
          </button>
        </div>
      </div>
      
      {/* Footer - Always at bottom */}
      <Footer/>
    </div>
    
  );
};

export default ReceiveNumber;

