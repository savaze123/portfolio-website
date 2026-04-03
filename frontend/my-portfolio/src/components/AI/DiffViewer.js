import React, { useState, useEffect } from 'react';
import './DiffViewer.css';

/**
 * DiffViewer Component
 * Displays code changes in GitHub-style side-by-side diff format.
 * Desktop (>= 768px): side by side (Red left = old, Green right = new)
 * Mobile (< 768px): stacked vertically (old on top, new on bottom)
 * Syntax highlighting matching Matrix dark theme.
 */
function DiffViewer({ changes = [] }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!changes || changes.length === 0) {
    return (
      <div className="diff-viewer-container">
        <div className="diff-empty">
          <span className="empty-icon">∅</span>
          <p>No changes suggested</p>
        </div>
      </div>
    );
  }

  return (
    <div className="diff-viewer-container">
      <div className="diff-header">
        <span className="diff-title">◆ SUGGESTED CHANGES ◆</span>
        <span className="diff-count">{changes.length} file(s)</span>
      </div>

      <div className={`diff-content ${isMobile ? 'mobile' : 'desktop'}`}>
        {changes.map((change, idx) => (
          <div key={idx} className="diff-file-block">
            {/* File header */}
            <div className="diff-file-header">
              <span className="file-path">{change.file}</span>
              <span className="file-range">
                Lines {change.line_start}-{change.line_end}
              </span>
            </div>

            {/* Desktop: Side by side */}
            {!isMobile && (
              <div className="diff-side-by-side">
                {/* Old code (left/red) */}
                <div className="diff-pane diff-old">
                  <div className="pane-label">Original</div>
                  <pre className="code-block old-code">
                    <code>{change.old_code}</code>
                  </pre>
                </div>

                {/* New code (right/green) */}
                <div className="diff-pane diff-new">
                  <div className="pane-label">Updated</div>
                  <pre className="code-block new-code">
                    <code>{change.new_code}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Mobile: Stacked vertically */}
            {isMobile && (
              <div className="diff-stacked">
                {/* Old code (top/red) */}
                <div className="diff-pane diff-old">
                  <div className="pane-label">Original</div>
                  <pre className="code-block old-code">
                    <code>{change.old_code}</code>
                  </pre>
                </div>

                {/* Arrow indicator */}
                <div className="stacked-arrow">⟹</div>

                {/* New code (bottom/green) */}
                <div className="diff-pane diff-new">
                  <div className="pane-label">Updated</div>
                  <pre className="code-block new-code">
                    <code>{change.new_code}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="diff-footer">
        <span className="footer-icon">✓</span>
        <span className="footer-text">Review changes carefully before applying</span>
      </div>
    </div>
  );
}

export default DiffViewer;
