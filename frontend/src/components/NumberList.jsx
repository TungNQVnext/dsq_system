import React from "react";
import { RecordItem } from "./RecordItem";
import "../styles/NumberList.css";

/**
 * A component that displays the list of called numbers.
 * It includes functionality for searching, filtering by status,
 * and rendering the list of RecordItem components.
 *
 * @param {object} props - The component's props.
 * @param {Array<object>} props.filteredRecords - The records to display after filtering and searching.
 * @param {string} props.searchTerm - The current search term.
 * @param {string} props.activeFilter - The currently active status filter ('all', 'waiting_to_receive', etc.).
 * @param {object} props.filterCounts - An object containing the count for each status.
 * @param {boolean} props.isCalling - Flag indicating if a call is in progress.
 * @param {function} props.onSearchChange - Callback for when the search input changes.
 * @param {function} props.onFilterChange - Callback for when a filter button is clicked.
 * @param {function} props.onUpdateStatus - Callback to update a record's status.
 * @param {function} props.onCompleteCall - Callback to mark a record as complete.
 * @param {function} props.onDeleteRecord - Callback to delete a record.
 * @param {function} props.onRevertToWaiting
 * @returns {JSX.Element} The rendered NumberList component.
 */
export const NumberList = ({
  filteredRecords,
  searchTerm,
  activeFilter,
  filterCounts,
  isCalling,
  onSearchChange,
  onFilterChange,
  onUpdateStatus,
  onCompleteCall,
  onDeleteRecord,
  isSpeaking,
  onRevertToWaiting
}) => {
  const { all, waiting_to_receive, completed } = filterCounts;

  /**
   * Determines the CSS class for a filter button based on whether it's active.
   * @param {string} filter - The filter name associated with the button.
   * @returns {string} The CSS class string.
   */
  const getFilterButtonClass = (filter) => {
    return activeFilter === filter
      ? "filter-btn filter-btn-active"
      : "filter-btn filter-btn-inactive";
  };

  return (
    <div className="number-list-container">
      <div className="number-list">
        <h2 className="number-list-title">Danh sách hồ sơ trả kết quả</h2>

        {/* Display statistics for the number of records */}
        <div className="number-list-stats">
          <span>Tổng số hồ sơ: {all} • </span>
          <span className="stat-waiting" style={{ color: "#FFC107" }}>
            Chờ nhận : {waiting_to_receive} •{" "}
          </span>
          <span className="stat-completed" style={{ color: "green" }}>
            Đã hoàn thành : {completed}
          </span>
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Nhập mã hồ sơ cần tìm (vd: 1234)"
          className="search-input"
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            const numbersOnly = value.replace(/[^0-9]/g, "");
            if (numbersOnly.length <= 4) {
              onSearchChange(numbersOnly);
            }
          }}
        />
        <br />
        {/* Filter Buttons */}
        <div className="filter-buttons">
          <button
            onClick={() => onFilterChange("all")}
            className={getFilterButtonClass("all")}
          >
            Tất Cả
          </button>
          <button
            onClick={() => onFilterChange("waiting_to_receive")}
            className={getFilterButtonClass("waiting_to_receive")}
          >
            Chờ nhận
          </button>
          <button
            onClick={() => onFilterChange("completed")}
            className={getFilterButtonClass("completed")}
          >
            Hoàn thành
          </button>
        </div>

        {/* Conditional rendering for the list or an empty state message */}
        {filteredRecords.length > 0 ? (
          <div className="records-container">
            {filteredRecords.map((record) => (
              <RecordItem
                key={record.id}
                record={record}
                isCalling={isCalling}
                onUpdateStatus={onUpdateStatus}
                onCompleteCall={onCompleteCall}
                onDeleteRecord={onDeleteRecord}
                isSpeaking={isSpeaking}
                onRevertToWaiting={onRevertToWaiting}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>
              {searchTerm
                ? "Không tìm thấy kết quả phù hợp"
                : "Không có hồ sơ nào"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
