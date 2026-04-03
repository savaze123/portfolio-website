import React, { useState } from 'react';
import './FileApproval.css';

/**
 * FileApproval Component
 * Displays the 5 suggested files from SCOUTER phase.
 * User can approve/remove files before triggering SURGEON phase.
 * If file removed: input field for replacement file path appears.
 * "INITIATE SCRAPE" button appears only when ≥ 1 file approved.
 */
function FileApproval({
  suggestedFiles = [],
  onApprovalChange = () => {},
  onInitiateScrape = () => {},
  isLoading = false,
}) {
  const [approvedFiles, setApprovedFiles] = useState(
    suggestedFiles.map((file) => ({ ...file, approved: true }))
  );
  const [replacementInputs, setReplacementInputs] = useState({});

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
    // Clear replacement input for this file
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
      // Clear replacement input
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
                    <p className="file-lines">
                      Lines {file.line_start}–{file.line_end}
                    </p>
                  </div>
                </div>

                <div className="file-item-actions">
                  {!file.approved && (
                    <div className="replacement-input-wrapper">
                      <input
                        type="text"
                        placeholder="Enter replacement file path..."
                        value={replacementInputs[index] || ''}
                        onChange={(e) =>
                          handleReplacementInput(index, e.target.value)
                        }
                        className="replacement-input"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleReplaceFile(
                              index,
                              replacementInputs[index] || ''
                            );
                          }
                        }}
                      />
                      <button
                        onClick={() =>
                          handleReplaceFile(
                            index,
                            replacementInputs[index] || ''
                          )
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
