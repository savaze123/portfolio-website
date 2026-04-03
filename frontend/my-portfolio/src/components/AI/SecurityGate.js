import React, { useState } from 'react';
import './SecurityGate.css';

/**
 * SecurityGate Component
 * Dual-input security verification for debug page access.
 * Visible input: human_verification (Must match 'I am human', case-insensitive)
 * Hidden honeypot: api_token_confirm (CSS display: none)
 * If honeypot filled: 24-hour IP block via Redis
 * If human input wrong: unlimited retries without blocking
 */
function SecurityGate({ onVerified = () => {} }) {
  const [humanInput, setHumanInput] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async () => {
    setError('');

    // Check honeypot (hidden field) - indicates bot activity
    if (honeypot.trim() !== '') {
      setError('🚨 SECURITY VIOLATION DETECTED - IP BLOCKED FOR 24 HOURS');
      // In production, the backend would handle the IP block via Redis
      // Here we're just showing the error
      console.error('Honeypot triggered - bot detected');
      return;
    }

    // Validate human input (case-insensitive)
    if (humanInput.toLowerCase() !== 'i am human') {
      setAttempts((prev) => prev + 1);
      setError(`Invalid verification. Please try again. (Attempt ${attempts + 1})`);
      return;
    }

    // Verification successful
    setIsSubmitting(true);
    onVerified();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting && humanInput.trim()) {
      handleSubmit();
    }
  };

  return (
    <div className="security-gate-overlay">
      <div className="security-gate-container">
        {/* Header */}
        <div className="security-gate-header">
          <h2>◆ SECURITY VERIFICATION ◆</h2>
          <p className="security-subtitle">Prove you are human</p>
        </div>

        {/* Content */}
        <div className="security-gate-content">
          <div className="verification-section">
            <p className="verification-instruction">
              Type the following phrase exactly to gain access:
            </p>
            <div className="phrase-box">
              <code className="phrase-text">I am human</code>
            </div>

            {/* Visible Input: Human Verification */}
            <div className="form-group">
              <label htmlFor="human-input" className="form-label">
                Your Input
              </label>
              <input
                id="human-input"
                type="text"
                value={humanInput}
                onChange={(e) => {
                  setHumanInput(e.target.value);
                  setError(''); // Clear error on new input
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type 'I am human'..."
                className="security-input"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Hidden Honeypot: Bot Detection */}
            <input
              id="api-token-confirm"
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ display: 'none' }}
              aria-hidden="true"
              tabIndex="-1"
            />

            {/* Error Message */}
            {error && (
              <div className={`error-message ${error.includes('VIOLATION') ? 'violation' : ''}`}>
                <span className="error-icon">✗</span>
                {error}
              </div>
            )}

            {/* Attempt Counter */}
            {attempts > 0 && !error.includes('VIOLATION') && (
              <div className="attempts-counter">
                <span className="attempts-text">Attempts: {attempts}</span>
              </div>
            )}

            {/* Info Box */}
            <div className="info-box">
              <p className="info-text">
                💡 <strong>Hint:</strong> Type exactly what appears above, case-insensitive.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="security-gate-footer">
          <button
            onClick={handleSubmit}
            disabled={!humanInput.trim() || isSubmitting}
            className={`verify-btn ${isSubmitting ? 'loading' : ''}`}
          >
            {isSubmitting ? '◆ VERIFYING... ◆' : '► VERIFY ◄'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SecurityGate;
