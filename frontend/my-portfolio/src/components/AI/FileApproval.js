import React, { useState, useEffect } from 'react';
import './FileApproval.css';

/**
 * FileApproval Component
 * Displays the 5 suggested files from SCOUTER phase.
 * User can approve/remove files before triggering SURGEON phase.
 * If file removed: input field for replacement file path appears.
 * "INITIATE SCRAPE" button appears only when ≥ 1 file approved.
 * Line range selector for files > 200 lines.
 */
function FileApproval({
  suggestedFiles = [],
  onApprovalChange = () => {},
  onInitiateScrape = () => {},
  isLoading = false,
  onLineRangeChange = () => {},
}) {
  // FIX: Initialize with approved: true but track properly
  const [approvedFiles, setApprovedFiles] = useState(() =>
    suggestedFiles.map((file, index) => ({
      ...file,
      approved: true,
      id: `file-${index}`, // Add unique ID for tracking
    }))
  );
  const [replacementInputs, setReplacementInputs] = useState({});
  const [lineRanges, setLineRanges] = useState({});

  // FIX: Call onApprovalChange immediately when component mounts
  useEffect(() => {
    const approved = approvedFiles.filter((f) => f.approved);
    onApprovalChange(approved);
  }, []); // Empty dependency - only on mount

  const handleToggleApproval = (index) => {
    const updated = [...approvedFiles];
    updated[index].approved = !updated[index].approved;
    setApprovedFiles(updated);
    onApprovalChange(updated.filter((f) => f.approved));
  };

  const handleRemoveFile = (index) => {
    const updated = [...approvedFiles];
    updated.splice(index, 1);
    setApprovedFiles(updated);
    onApprovalChange(updated.filter((f) => f.approved));
    const newReplacements = { ...replacementInputs };
    delete newReplacements[index];
    setReplacementInputs(newReplacements);
  };

  const handleReplaceFile = (index, newPath) => {
    if (newPath.trim()) {
      const updated = [...approvedFiles];
      const removed = updated.splice(index, 1)[0];
      updated.push({
        path: newPath.trim(),
        reason: `User replacement for ${removed.path}`,
        line_start: 1,
        line_end: 200,
        approved: true,
      });
      setApprovedFiles(updated);
      onApprovalChange(updated.filter((f) => f.approved));
      const newReplacements = { ...replacementInputs };
      delete newReplacements[index];
      setReplacementInputs(newReplacements);
    }
  };

  const handleReplacementInput = (index, value) => {
    setReplacementInputs({
      ...replacementInputs,
      [index]: value,
    });
  };

  const handleLineRangeSelect = (index, rangeString) => {
    const [start, end] = rangeString.split('-').map(Number);
    setLineRanges({
      ...lineRanges,
      [index]: { line_start: start, line_end: end },
    });
    onLineRangeChange(index, start, end);
  };

  const handleCustomRangeChange = (index, field, value) => {
    const numValue = parseInt(value) || 0;
    const current = lineRanges[index] || {
      line_start: approvedFiles[index]?.line_start || 1,
      line_end: approvedFiles[index]?.line_end || 200,
    };

    if (field === 'start') {
      const updated = { ...current, line_start: numValue };
      setLineRanges({ ...lineRanges, [index]: updated });
      onLineRangeChange(index, numValue, updated.line_end);
    } else {
      const updated = { ...current, line_end: numValue };
      setLineRanges({ ...lineRanges, [index]: updated });
      onLineRangeChange(index, updated.line_start, numValue);
    }
  };

  const approvedCount = approvedFiles.filter((f) => f.approved).length;
  const canInitiate = approvedCount >= 1;

  return (
    <div className="file-approval-container">
      <div className="file-approval-header">
        <h3>◆ FILE APPROVAL ◆</h3>
        <span className="file-count-badge">{approvedCount}</span>
      </div>

      <div className="file-approval-content">
        {suggestedFiles.length === 0 ? (
          <div className="approval-empty">
            <p>No files suggested yet.</p>
            <span className="empty-hint">Run SCOUTER phase first</span>
          </div>
        ) : (
          <div className="file-list">
            {approvedFiles.map((file, index) => (
              <div key={index} className="file-item">
                <div className="file-item-header">
                  <input
                    type="checkbox"
                    checked={file.approved}
                    onChange={() => handleToggleApproval(index)}
                    className="file-checkbox"
                    aria-label={`Approve ${file.path}`}
                  />
                  <div className="file-info">
                    <p className="file-path">{file.path}</p>
                    <p className="file-reason">{file.reason}</p>
                  </div>
                </div>

                {/* Line Range Selector - MOVED HERE (within file-item) */}
                {file.approved && file.suggested_ranges && file.suggested_ranges.length > 0 && (
                  <div className="file-item-ranges">
                    <div className="range-selector">
                      <label className="range-label">📍 Line Range (max 200 lines):</label>
                      
                      <div className="range-controls">
                        {/* Preset dropdown */}
                        <select
                          value={
                            lineRanges[index]
                              ? `${lineRanges[index].line_start}-${lineRanges[index].line_end}`
                              : file.line_range || file.suggested_ranges[0] || '1-200'
                          }
                          onChange={(e) => handleLineRangeSelect(index, e.target.value)}
                          className="range-select"
                        >
                          <option value="" disabled>
                            Choose preset...
                          </option>
                          {file.suggested_ranges.map((range) => (
                            <option key={range} value={range}>
                              Lines {range}
                            </option>
                          ))}
                        </select>

                        {/* Custom inputs */}
                        <div className="range-input-group">
                          <input
                            type="number"
                            placeholder="Start"
                            min="1"
                            value={lineRanges[index]?.line_start || file.line_start || 1}
                            onChange={(e) => handleCustomRangeChange(index, 'start', e.target.value)}
                            className="custom-input"
                          />
                          <span className="range-separator">–</span>
                          <input
                            type="number"
                            placeholder="End"
                            min="1"
                            value={lineRanges[index]?.line_end || file.line_end || 200}
                            onChange={(e) => handleCustomRangeChange(index, 'end', e.target.value)}
                            className="custom-input"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="file-item-actions">
                  {!file.approved && (
                    <div className="replacement-input-wrapper">
                      <input
                        type="text"
                        placeholder="Enter replacement file path..."
                        value={replacementInputs[index] || ''}
                        onChange={(e) => handleReplacementInput(index, e.target.value)}
                        className="replacement-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleReplaceFile(index, replacementInputs[index] || '');
                          }
                        }}
                      />
                      <button
                        onClick={() =>
                          handleReplaceFile(index, replacementInputs[index] || '')
                        }
                        className="replacement-btn"
                        disabled={!replacementInputs[index]?.trim()}
                      >
                        Replace
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="remove-btn"
                    title="Remove this file"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="file-approval-footer">
        <button
          onClick={onInitiateScrape}
          disabled={!canInitiate || isLoading}
          className={`initiate-scrape-btn ${canInitiate ? 'active' : 'disabled'}`}
        >
          {isLoading ? '◆ SCANNING... ◆' : '► INITIATE SCRAPE ◄'}
        </button>
        <p className="footer-hint">
          {approvedCount === 0
            ? 'Select at least 1 file to proceed'
            : `${approvedCount} file${approvedCount !== 1 ? 's' : ''} approved`}
        </p>
      </div>
    </div>
  );
}

export default FileApproval;
