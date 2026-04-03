import React, { useState } from 'react';
import './BYOKModal.css';

/**
 * BYOKModal Component (Bring Your Own Key)
 * Modal for users to input their own Gemini API key.
 * Appears when global rate limit is reached (100 sessions/day).
 * Key is saved to localStorage under 'sentinel_user_key'.
 * Allows continued debugging without waiting for daily reset.
 */
function BYOKModal({ isOpen = false, onClose = () => {}, onSubmit = () => {} }) {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');

    if (!apiKey.trim()) {
      setError('API key cannot be empty');
      return;
    }

    if (!apiKey.startsWith('AIza')) {
      setError('Invalid API key format. Gemini keys start with "AIza"');
      return;
    }

    setIsValidating(true);

    try {
      // Save to localStorage
      localStorage.setItem('sentinel_user_key', apiKey.trim());

      // Call parent callback
      onSubmit(apiKey.trim());

      // Reset form
      setApiKey('');
      setError('');
      setShowPassword(false);
    } catch (err) {
      setError('Failed to save key. Please try again.');
      console.error('BYOK Error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isValidating) {
      handleSubmit();
    }
  };

  const handleClose = () => {
    setApiKey('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="byok-overlay">
      <div className="byok-modal">
        {/* Header */}
        <div className="byok-header">
          <h2>◆ BRING YOUR OWN KEY ◆</h2>
          <button
            onClick={handleClose}
            className="byok-close"
            aria-label="Close modal"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="byok-content">
          <div className="byok-status">
            <p className="status-message">
              ⚠ Global rate limit reached (100 sessions/day)
            </p>
            <p className="status-hint">
              Provide your own Gemini API key to continue debugging
            </p>
          </div>

          <div className="byok-form">
            {/* API Key Input */}
            <div className="form-group">
              <label htmlFor="api-key-input" className="form-label">
                Gemini API Key
              </label>
              <div className="input-wrapper">
                <input
                  id="api-key-input"
                  type={showPassword ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError(''); // Clear error when typing
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="AIza..."
                  className="api-key-input"
                  disabled={isValidating}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password-btn"
                  type="button"
                  title={showPassword ? 'Hide key' : 'Show key'}
                  disabled={isValidating}
                >
                  {showPassword ? '◉' : '◎'}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && <div className="error-message">✗ {error}</div>}

            {/* Instructions */}
            <div className="byok-instructions">
              <p className="instruction-title">How to get your API key:</p>
              <ol className="instruction-list">
                <li>Visit Google AI Studio: aistudio.google.com/app</li>
                <li>Click "Get API key" button</li>
                <li>Create new API key (copy the generated key)</li>
                <li>Paste key above and click "AUTHORIZE"</li>
              </ol>
              <p className="instruction-footer">
                Your key is saved locally and never sent to our servers.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="byok-footer">
          <button
            onClick={handleClose}
            className="byok-btn byok-btn-cancel"
            disabled={isValidating}
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            className="byok-btn byok-btn-authorize"
            disabled={!apiKey.trim() || isValidating}
          >
            {isValidating ? '◆ VALIDATING... ◆' : '► AUTHORIZE ◄'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BYOKModal;
