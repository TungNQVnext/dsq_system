import React, { useState, useRef, useEffect } from "react";
import { Phone, NotebookText, Volume2, ArchiveRestore, X } from "lucide-react";
import { LANGUAGES } from "../constants/constants";
import "../styles/ControlPanel.css";

export const ControlPanel = ({
  profileCode,
  selectedSpin,
  selectedLanguage,
  counterNumber,
  isCalling,
  isSpeaking,
  onProfileCodeChange,
  onSpinChange,
  onLanguageChange,
  onCounterChange,
  onCall,
}) => {
  const [validationError, setValidationError] = useState("");
  const inputRef = useRef(null);
  const pendingCallRef = useRef(null);

  useEffect(() => {
    if (!isCalling && !isSpeaking && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isCalling, isSpeaking]);

  useEffect(() => {
    if (pendingCallRef.current !== null) {
      const numbers = pendingCallRef.current.split(/[\s,]+/).filter(Boolean);
      onCall(numbers);
      pendingCallRef.current = null;
    }
  }, [profileCode]);

  const handleProfileCodeChange = (value) => {
    const invalidPattern = /[^0-9,\s]/g;
    if (invalidPattern.test(value)) {
      setValidationError(
        "Chỉ được nhập chữ số (0-9), dấu cách hoặc dấu phẩy (,)"
      );
      return;
    } else {
      setValidationError("");
    }

    const cleanedValue = value.replace(/[^0-9,\s]/g, "").trimStart();
    const tokens = cleanedValue.match(/(\d+)([,\s]*)/g) || [];

    const processedTokens = tokens.map((token) => {
      const match = token.match(/(\d+)([,\s]*)/);
      const numberPart = match[1];
      const limitedNumberPart = numberPart.slice(0, 4);
      const separatorPart = match[2];
      return limitedNumberPart + separatorPart;
    });

    const finalValue = processedTokens.join("");
    onProfileCodeChange(finalValue);
  };

  const handleClear = () => {
    setValidationError("");
    onProfileCodeChange("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatProfileCode = (
    profileCode,
    isEnter,
    isSeparatorKey,
    pressedSeparator = ""
  ) => {
    const tokens = profileCode.match(/(\d+)([,\s]*)/g) || [];

    const formattedTokens = tokens.map((token, index) => {
      const match = token.match(/(\d+)([,\s]*)/);
      const numberPart = match[1];
      const separatorPart = match[2];
      const paddedNum = numberPart.padStart(4, "0");

      if (index === tokens.length - 1) {
        if (isEnter) {
          return paddedNum + (separatorPart || ",");
        } else if (isSeparatorKey) {
          return paddedNum + pressedSeparator;
        } else {
          return paddedNum + separatorPart;
        }
      } else {
        return paddedNum + separatorPart;
      }
    });

    return formattedTokens.join("");
  };

  const handleKeyDown = (e) => {
    if (
      (e.key === " " || e.key === "," || e.key === "Enter") &&
      profileCode.trim().length > 0
    ) {
      const isEnter = e.key === "Enter";
      const isSeparatorKey = e.key === " " || e.key === ",";
      const pressedSeparator = isSeparatorKey
        ? e.key === " "
          ? " "
          : ","
        : "";

      const tokens = profileCode.match(/(\d+)([,\s]*)/g) || [];
      const lastToken = tokens[tokens.length - 1] || "";
      const match = lastToken.match(/(\d+)([,\s]*)/);
      const separatorPart = match ? match[2] : "";

      const finalValue = formatProfileCode(
        profileCode,
        isEnter,
        isSeparatorKey,
        pressedSeparator
      );

      if (isEnter && counterNumber && !isCalling && !isSpeaking) {
        const hasSeparator = separatorPart.length > 0;
        if (hasSeparator) {
          const numbers = finalValue.split(/[\s,]+/).filter(Boolean);
          onCall(numbers);
          e.preventDefault();
          return;
        } else {
          pendingCallRef.current = finalValue;
          handleProfileCodeChange(finalValue);
          e.preventDefault();
          return;
        }
      } else {
        handleProfileCodeChange(finalValue);
        if (isSeparatorKey) {
          e.preventDefault();
        }
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData("text");
    const cleanedValue = pasteText.replace(/[^0-9,\s]/g, "").trim();
    const finalValue = formatProfileCode(cleanedValue, true, false, "");
    setValidationError("");
    onProfileCodeChange(finalValue);
  };

  return (
    <div className="control-panel">
      <div className="control-panel-header">
        {/* <Phone className="control-panel-icon" /> */}
        <h2 className="control-panel-title">Bảng Điều Khiển</h2>
      </div>

      {/* Profile Code */}
      <div className="form-section">
        <div className="control-panel-header">
          <NotebookText className="control-panel-icon" />
          <h3 className="form-label">Mã Hồ Sơ</h3>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Nhập mã hồ sơ (vd: 1234 5678)"
            value={profileCode}
            onChange={(e) => handleProfileCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={`form-input ${
              validationError ? "form-input-error" : ""
            }`}
            disabled={isCalling || isSpeaking}
          />
        </div>
        {validationError && (
          <div className="validation-error">{validationError}</div>
        )}
      </div>

      {/* Counter Number */}
      <div className="form-section">
        <div className="control-panel-header">
          <ArchiveRestore className="control-panel-icon" />
          <h3 className="form-label">Số Quầy</h3>
        </div>
        <input
          type="number"
          placeholder="Nhập số quầy"
          value={counterNumber}
          onChange={(e) => onCounterChange(e.target.value)}
          className="form-input"
          disabled={true}
          min="1"
          max="20"
        />
      </div>

      {/* Voice Configuration */}
      <div className="form-section">
        <div className="control-panel-header">
          <Volume2 className="control-panel-icon" />
          <h3 className="form-label">Cấu Hình Giọng Nói</h3>
        </div>
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={isCalling || isSpeaking}
          className="form-select"
        >
          {Object.entries(LANGUAGES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Call Button */}
      <button
        onClick={() => {
          const tokens = profileCode.match(/(\d+)([,\s]*)/g) || [];
          const lastToken = tokens[tokens.length - 1] || "";
          const match = lastToken.match(/(\d+)([,\s]*)/);
          const separatorPart = match ? match[2] : "";

          const formattedValue = formatProfileCode(
            profileCode,
            true,
            false,
            ""
          );

          const hasSeparator = separatorPart.length > 0;

          if (hasSeparator) {
            const numbers = formattedValue.split(/[\s,]+/).filter(Boolean);
            onCall(numbers);
          } else {
            pendingCallRef.current = formattedValue;
            onProfileCodeChange(formattedValue);
          }
        }}
        disabled={
          !profileCode.trim() || !counterNumber || isCalling || isSpeaking
        }
        className="call-button"
      >
        <Phone className="call-button-icon" />
        {isSpeaking ? "Đang đọc..." : isCalling ? "Đang gọi..." : "Gọi"}
      </button>
    </div>
  );
};
