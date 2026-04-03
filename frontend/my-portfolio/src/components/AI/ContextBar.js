import React, { useEffect, useState } from 'react';
import './ContextBar.css';

/**
 * ContextBar Component
 * Displays SESSION STABILITY with token usage percentage.
 * Color coded: green (0-49%), yellow (50-79%), red (80-99%), critical (100%)
 * Flashes and shows "MEMORY OPTIMIZED" label when reaching 80%.
 * Shows "INITIATE NEW SESSION" button at 100%.
 */
function ContextBar({
  tokensUsed = 0,
  tokensLimit = 30000,
  onNewSession = () => {},
  isCompressing = false,
}) {
  const [percentage, setPercentage] = useState(0);
  const [status, setStatus] = useState('normal');
  const [showMemoryLabel, setShowMemoryLabel] = useState(false);

  useEffect(() => {
    const percent = (tokensUsed / tokensLimit) * 100;
    setPercentage(Math.min(percent, 100));

    // Determine status
    if (percent >= 100) {
      setStatus('critical');
    } else if (percent >= 80) {
      setStatus('warning');
    } else {
      setStatus('normal');
    }

    // Show memory label when crossing 80%
    if (percent >= 80 && percent < 100) {
      setShowMemoryLabel(true);
      const timer = setTimeout(() => setShowMemoryLabel(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowMemoryLabel(false);
    }
  }, [tokensUsed, tokensLimit]);

  const getStatusLabel = () => {
    if (status === 'critical') {
      return 'CRITICAL';
    } else if (status === 'warning') {
      return 'WARNING';
    }
    return 'NORMAL';
  };

  const getStatusColor = () => {
    if (status === 'critical') {
      return 'var(--red, #ff4c4c)';
    } else if (status === 'warning') {
      return 'var(--orange, #ffaa00)';
    }
    return 'var(--green)';
  };

  return (
    <div className="context-bar-container">
      {/* Header */}
      <div className="context-bar-header">
        <span className="header-label">◆ SESSION STABILITY ◆</span>
        <span className={`status-badge status-${status}`}>
          {getStatusLabel()}
        </span>
      </div>

      {/* Progress bar */}
      <div className="context-bar-wrapper">
        <div className="context-bar-background">
          <div
            className={`context-bar-fill ${status} ${isCompressing ? 'compressing' : ''}`}
            style={{
              width: `${percentage}%`,
              backgroundColor: getStatusColor(),
            }}
          />
        </div>

        {/* Memory optimized label - shows when crossing 80% */}
        {showMemoryLabel && (
          <div className="memory-label flash-animation">
            MEMORY OPTIMIZED
          </div>
        )}

        {/* New session button - shows at 100% */}
        {status === 'critical' && (
          <button className="new-session-button" onClick={onNewSession}>
            INITIATE NEW SESSION
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="context-bar-stats">
        <span className="stat-item">
          <span className="stat-label">Tokens:</span>
          <span className="stat-value">{tokensUsed.toLocaleString()}</span>
        </span>
        <span className="stat-divider">·</span>
        <span className="stat-item">
          <span className="stat-label">Limit:</span>
          <span className="stat-value">{tokensLimit.toLocaleString()}</span>
        </span>
        <span className="stat-divider">·</span>
        <span className="stat-item">
          <span className="stat-label">Stability:</span>
          <span className={`stat-value stat-percent-${status}`}>
            {Math.round(percentage)}%
          </span>
        </span>
      </div>
    </div>
  );
}

export default ContextBar;
