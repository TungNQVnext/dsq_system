import React, { useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ControlPanel } from "../components/ControlPanel";
import { NumberList } from "../components/NumberList";

import { useCallSystem } from "../hooks/returnNumberHook/useCallSystem";
import { useAuthGuard } from "../hooks/loginHook/useAuthGuard";
import "../styles/CallSystem.css";
import { getFilterCounts } from "../utils/utils";

/**
 * The main page component for the Call System application.
 * It orchestrates the overall layout and integrates all major components
 * (Header, Footer, ControlPanel, NumberList) and the core logic from the
 * `useCallSystem` hook.
 */
export default function CallSystem() {
  useAuthGuard();
  const navigate = useNavigate();

  const {
    // State
    profileCode,
    selectedSpin,
    selectedLanguage,
    counterNumber,
    activeFilter,
    searchTerm,
    isCalling,
    currentCallingRecord,
    filteredRecords,
    numberListRef,
    isSpeaking,
    numberRecords,

    // Setters
    setProfileCode,
    setSelectedSpin,
    setSelectedLanguage,
    setCounterNumber,
    setActiveFilter,
    setSearchTerm,

    // Actions
    handleCall,
    updateRecordStatus,
    handleCompleteCall,
    handleDeleteRecord,
    handleRevertToWaiting
  } = useCallSystem();

  const filterCounts = getFilterCounts(numberRecords);

  useEffect(() => {
    document.title = "Bảng điều khiển";
  }, []);

  return (
    <div className="call-system-container">
      <Header />

      {/* Main Title */}
      <div className="call-system-title-section">
        <h1 className="call-system-main-title">Hệ Thống Gọi Trả Kết Quả</h1>
      </div>

      <div className="call-system-main-layout">
        {/* Left Panel - Control Panel */}
        <div className="call-system-left-panel">
          <ControlPanel
            profileCode={profileCode}
            selectedSpin={selectedSpin}
            selectedLanguage={selectedLanguage}
            counterNumber={counterNumber}
            isCalling={isCalling}
            onProfileCodeChange={setProfileCode}
            onSpinChange={setSelectedSpin}
            onLanguageChange={setSelectedLanguage}
            onCounterChange={setCounterNumber}
            onCall={handleCall}
            isSpeaking={isSpeaking}
          />
        </div>

        {/* Right Panel - Number List */}
        <div className="call-system-right-panel" ref={numberListRef}>
          <NumberList
            filteredRecords={filteredRecords}
            searchTerm={searchTerm}
            activeFilter={activeFilter}
            filterCounts={filterCounts}
            isCalling={isCalling}
            currentCallingRecord={currentCallingRecord}
            onSearchChange={setSearchTerm}
            onFilterChange={setActiveFilter}
            onUpdateStatus={updateRecordStatus}
            onCompleteCall={handleCompleteCall}
            onDeleteRecord={handleDeleteRecord}
            isSpeaking={isSpeaking}
            onRevertToWaiting={handleRevertToWaiting}
          />
        </div>
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

      <Footer />
    </div>
  );
}
