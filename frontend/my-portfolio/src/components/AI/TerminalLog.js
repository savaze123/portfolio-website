import React, { useEffect, useRef } from 'react';
import './TerminalLog.css';

/**
 * TerminalLog Component
 * Displays timestamped technical logs in a scrolling Matrix-themed terminal box.
 * Auto-scrolls to bottom on new entries.
 * Max 100 entries, then clears oldest.
 */
function TerminalLog({ logs = [] }) {
  const terminalRef = useRef(null);

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  /**
   * Format timestamp as HH:MM:SS
   */
  const formatTime = (date = new Date()) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  /**
   * Get CSS class based on log level
   */
  const getLogClass = (level) => {
    switch (level) {
      case 'ERROR':
        return 'log-error';
      case 'WARNING':
        return 'log-warning';
      case 'SUCCESS':
        return 'log-success';
      case 'SYS':
      default:
        return 'log-sys';
    }
  };

  /**
   * Format a log entry with timestamp and level
   */
  const renderLog = (log, index) => {
    const time = formatTime(log.timestamp);
    const level = log.level || 'SYS';
    const message = log.message || '';

    return (
      <div key={index} className={`log-entry ${getLogClass(level)}`}>
        <span className="log-time">[{time}]</span>
        <span className="log-level">[{level}]:</span>
        <span className="log-message">{message}</span>
      </div>
    );
  };

  return (
    <div className="terminal-log-container">
      <div className="terminal-log-header">
        <span className="terminal-title">◆ TERMINAL LOG ◆</span>
        <span className="terminal-count">{logs.length > 0 ? logs.length : '∅'}</span>
      </div>
      <div className="terminal-log" ref={terminalRef}>
        {logs.length === 0 ? (
          <div className="log-entry log-empty">
            <span className="log-time">[--:--:--]</span>
            <span className="log-level">[SYS]:</span>
            <span className="log-message">Awaiting initialization...</span>
          </div>
        ) : (
          logs.map((log, index) => renderLog(log, index))
        )}
      </div>
      <div className="terminal-log-footer">
        <span className="footer-text">▲ scroll to view ▼</span>
      </div>
    </div>
  );
}

export default TerminalLog;
