import { useState, useRef, useEffect, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";

const API_BASE = import.meta.env.VITE_API_URL;

export const useCallSystem = () => {
  const [profileCode, setProfileCode] = useState("");
  const [selectedSpin, setSelectedSpin] = useState("spin1");
  const [selectedLanguage, setSelectedLanguage] = useState("vietnamese+japanese");
  const [counterNumber, setCounterNumber] = useState("3");

  const [activeFilter, setActiveFilter] = useState("all");
  const [numberRecords, setNumberRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCalling, setIsCalling] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const numberListRef = useRef(null);

  const { subscribe, sendCallNotification, sendCompletion } = useWebSocket();

  const handleCompleteCall = async (recordId) => {
    await updateRecordStatus(recordId, "completed");
    const completedRecord = numberRecords.find((r) => r.id === recordId);
    if (completedRecord?.record_number) {
      sendCompletion(counterNumber, String(completedRecord.record_number).padStart(4, "0"));
    }
    await fetchRecords();
  };

  const handleRevertToWaiting = async (recordId) => {
    await updateRecordStatus(recordId, "waiting_to_receive");
    const revertedRecord = numberRecords.find((r) => r.id === recordId);
    if (revertedRecord?.record_number) {
      sendCallNotification(
        String(revertedRecord.record_number).padStart(4, "0"),
        selectedSpin,
        selectedLanguage,
        counterNumber
      );
    }
    await fetchRecords();
  };

  //  Fetch records from backend
  const fetchRecords = useCallback(async () => {
    console.log(" Đang gọi API /return_record/list");
    try {
      const res = await fetch(`${API_BASE}/return_record/list`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("API không trả về mảng");
      console.log(" Records received:", data);
      setNumberRecords(data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách hồ sơ:", err);
      setNumberRecords([]);
    }
  }, []);

  // WebSocket to track speaking status
  useEffect(() => {
    const unsubscribe = subscribe("all", (message) => {
      if (message.type === "reading_start") {
        setIsSpeaking(true);
      } else if (message.type === "reading_end") {
        setIsSpeaking(false);
        fetchRecords();
      } else if (message.type === "call") {
        fetchRecords();
      }
    });
    return () => unsubscribe();
  }, [subscribe, fetchRecords]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  //  Update status via API
  const updateRecordStatus = async (recordId, newStatus) => {
    try {
      await fetch(`${API_BASE}/return_record/${recordId}/status?new_status=${newStatus}`, {
        method: "PUT",
      });
      fetchRecords();
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
    }
  };

  //  Handle call button (accepts recordId[] or profileCode string)
  const handleCall = async (recordIds = []) => {
    setIsCalling(true);
    let numbers = [];

    if (profileCode.trim()) {
      const tokens = profileCode
        .split(/[^0-9]/)
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch(`${API_BASE}/return_record/call_by_profile_codes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ profile_codes: tokens })
      });

      if (res.ok) {
        const updatedRecords = await res.json();
        console.log(" Records returned:", updatedRecords);
        numbers = updatedRecords.map(r => String(r.record_number).padStart(4, "0"));
      }
    } else if (recordIds.length > 0) {
      numbers = recordIds
        .map((id) => {
          const record = numberRecords.find((r) => String(r.id) === String(id));
          return record?.record_number?.toString().padStart(4, "0")
        })
        .filter(Boolean);
      await Promise.all(
        recordIds.map((id) => updateRecordStatus(id, "waiting_to_receive"))
      );
    }

    if (numbers.length === 0) {
      console.warn(" Không có số hợp lệ để gọi.");
      setIsCalling(false);
      return;
    }

    const joined = numbers.join(" ");
    console.log(" Gọi số:", joined);
    console.log(" Debug TTS → spin:", selectedSpin, "| lang:", selectedLanguage, "| counter:", counterNumber);
    if (joined && selectedSpin && selectedLanguage && counterNumber) {
      sendCallNotification(joined, selectedSpin, selectedLanguage, counterNumber);
    } else {
      console.warn(" Thiếu thông tin khi gọi TTS. Gọi bị hủy.");
    }

    await fetchRecords();
    setProfileCode("");
    setIsCalling(false);
  };

  const currentCallingRecord = null;

  const filteredRecords = numberRecords
    .filter((r) => ["waiting_to_receive", "completed"].includes(r.status))
    .filter((r) => {
      if (activeFilter === "all") return true;
      return r.status === activeFilter;
    })
    .filter((r) =>
      r.record_number?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );

  return {
    profileCode,
    selectedSpin,
    selectedLanguage,
    counterNumber,
    activeFilter,
    searchTerm,
    isCalling,
    isSpeaking,
    numberRecords,
    currentCallingRecord,
    filteredRecords,
    numberListRef,

    setProfileCode,
    setSelectedSpin,
    setSelectedLanguage,
    setCounterNumber,
    setActiveFilter,
    setSearchTerm,

    handleCall,
    updateRecordStatus,
    fetchRecords,
    handleCompleteCall,
    handleRevertToWaiting
  };
};
