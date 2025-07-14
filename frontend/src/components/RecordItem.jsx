import React from "react";
import { RefreshCw, CheckCircle, Trash2 } from "lucide-react";
import "../styles/RecordItem.css";

export const RecordItem = ({
  record,
  isCalling,
  isSpeaking,
  onUpdateStatus,
  onCompleteCall,
  onDeleteRecord,
  onRevertToWaiting
}) => {
  const getStatusBadge = (status) => {
    const badges = {
      waiting_to_receive: "status-badge status-badge-waiting",
      completed: "status-badge status-badge-completed",
      calling: "status-badge status-badge-calling",
    };

    const labels = {
      waiting_to_receive: "Chờ nhận",
      completed: "Đã hoàn thành",
      calling: "Đang gọi...",
    };

    return (
      <span className={badges[status] || "status-badge"}>
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="record-item">
      <div className="record-item-content">
        <div className="record-item-info">
          <div className="record-item-code">{record.record_number?.toString().padStart(4,"0")}</div>
          <div className="record-item-details">
            {new Date(record.updated_at).toLocaleDateString("vi-VN")}{" "}
            {new Date(record.updated_at).toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        <div className="record-item-actions">
          <div className="record-item-buttons">
            <div className="record-item-status-center">
              {getStatusBadge(record.status)}
            </div>

            {record.status === "waiting_to_receive" && (
              <button
                onClick={() => onCompleteCall(record.id)}
                className="action-btn action-btn-complete"
                disabled={isCalling || isSpeaking}
              >
                <CheckCircle className="action-btn-icon" />
                Hoàn thành
              </button>
            )}

            {record.status === "completed" && (
              <button
                onClick={() => onRevertToWaiting(record.id)}
                className="action-btn action-btn-revert"
                disabled={isCalling || isSpeaking}
              >
                <RefreshCw className="action-btn-icon" />
                Chờ nhận
              </button>
            )}

            {record.status !== "calling" && (
              <button
                onClick={() => onDeleteRecord(record.id)}
                className="action-btn action-btn-delete"
                disabled={isCalling || isSpeaking}
              >
                <Trash2 className="action-btn-icon" />
                Xóa
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
