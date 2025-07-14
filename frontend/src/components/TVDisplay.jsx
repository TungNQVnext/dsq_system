import React, { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { useAuthGuard } from "../hooks/useAuthGuard";
import "../styles/TVDisplay.css";
import logo from "../assets/Emblem_of_Vietnam.svg";

const chunkArray = (array, size) => {
  const chunkedArr = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArr.push(array.slice(i, i + size));
  }
  return chunkedArr;
};

export const TVDisplay = ({
  counterTitle = "QUẦY 3 - TRẢ KẾT QUẢ",
  counterTitleJA = "カウンター3 - 結果返却窓口",
}) => {
  useAuthGuard();

  const { subscribe } = useWebSocket();
  const [pendingCalls, setPendingCalls] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(0);

  const fetchInitialRecords = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/return_record/waiting`);
      const data = await res.json();
      const mapped = data.map((r) => ({
        profileCode: r.record_number?.toString(),
        timestamp: r.updated_at || new Date().toISOString(),
      }));
      setPendingCalls(mapped);
    } catch (err) {
      console.error("Lỗi khi tải danh sách hồ sơ chờ nhận:", err);
    }
  }, []);

  useEffect(() => {
    fetchInitialRecords();
  }, [fetchInitialRecords]);

  const filteredCalls = pendingCalls.filter(
    (r) => r && typeof r.profileCode === "string" && r.profileCode.trim() !== ""
  );

  const sortedCalls = [...filteredCalls].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const itemsPerPage = 8;
  const totalPages = Math.ceil(sortedCalls.length / itemsPerPage);
  const extendedTotalPages = totalPages + (sortedCalls.length > itemsPerPage ? 1 : 0);

  const currentPageCalls =
    currentPage < totalPages
      ? sortedCalls.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)
      : sortedCalls;

  const callRows =
    currentPage < totalPages
      ? chunkArray(currentPageCalls.map((r) => r.profileCode?.padStart(4, "0")), 4)
      : [];

  const handleAllMessages = useCallback((message) => {
    if (message.type === "call") {
      const raw = message.number;
      const numbers = typeof raw === "string"
        ? raw.split(/\s+/).filter(Boolean).map(n => n.padStart(4, "0"))
        : Array.isArray(raw)
          ? raw.map(n => String(n).padStart(4, "0"))
          : [];

      setPendingCalls((prev) => {
        const updated = [...prev];
        const existingSet = new Set(prev.map((r) => r.profileCode.padStart(4, "0")));
        numbers.reverse().forEach((n) => {
          const padded = n.padStart(4, "0")
          if (!existingSet.has(padded)){
            updated.push({
              profileCode: padded,
              timestamp: new Date().toISOString(),
            });
            existingSet.add(padded)
          }
        });
        return updated;
      });
    }

    if (message.type === "complete") {
      const raw = message.number;
      const numbers = Array.isArray(raw)
        ? raw.map(n => String(n).padStart(4, "0"))
        : [String(raw).padStart(4, "0")];

      setPendingCalls((prev) =>
        prev.filter((r) => !numbers.includes(r.profileCode?.padStart(4, "0")))
      );
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribe("all", handleAllMessages);
    return () => unsubscribe();
  }, [subscribe, handleAllMessages]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (extendedTotalPages > 1) {
      const interval = setInterval(() => {
        setCurrentPage((prev) => (prev + 1) % extendedTotalPages);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [extendedTotalPages]);

  useEffect(() => {
    if (currentPage >= extendedTotalPages && extendedTotalPages > 0) {
      setCurrentPage(0);
    }
  }, [currentPage, extendedTotalPages]);

  return (
    <div className="tv-display-container">
      <div className="tv-header" style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        paddingTop: "20px",
        paddingBottom: "20px",
        backgroundColor: "white",
        position: "relative",
        minHeight: "100px"
      }}>
        <div style={{
          position: "absolute",
          left: 36,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          paddingLeft: "20px"
        }}>
          <img src={logo} alt="Logo" style={{
            height: "100%",
            objectFit: "contain",
            maxHeight: "120px"
          }} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: "5rem", color: "black" }}>{counterTitle}</h1>
          <h2 style={{ margin: 0, fontSize: "4.5rem", color: "black" }}>{counterTitleJA}</h2>
        </div>
      </div>

      <div className="tv-called-list-section">
        <div className="tv-called-list-subtitle">
          SỐ HỒ SƠ HOÀN THÀNH (対応完了番号)
        </div>

        {currentPageCalls.length === 0 ? (
          <div className="tv-no-calls" style={{ padding: "60px 0", fontSize: "2.5rem", textAlign: "center", color: "#fff", fontStyle: "italic" }}>
            Không có số nào được gọi<br />(まだ呼び出しはありません)
          </div>
        ) : currentPage < totalPages ? (
          <div className="tv-called-grid">
            {callRows.map((row, rowIndex) => (
              <div className="tv-called-row" key={rowIndex}>
                {row.map((profileCode) => (
                  <div className="tv-called-item" key={profileCode}>
                    {profileCode}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="tv-called-autofit-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(8, minmax(160px, 1fr))",
              gap: "35px",
              padding: "20px 40px",
              height: "100%",
              overflow: "hidden",
              alignItems: "center",
              justifyItems: "center"
            }}>
            {currentPageCalls.map((r) => (
              <div className="tv-called-item" key={r.profileCode}
                style={{
                  fontSize: "clamp(1.8rem, 4.5vw, 4rem)",
                  height: "clamp(100px, 15vh, 140px)",
                  width: "100%",
                  maxWidth: "200px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1,
                  textAlign: "center",
                  letterSpacing: "0.05em",
                }}>
                {r.profileCode?.padStart(4, "0")}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
