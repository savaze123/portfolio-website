import React from 'react';
import './App.css';

function LoginPage() {
  const handleLogin = () => {
    // Discord will redirect back to http://localhost:3000/callback
    window.location.href = "http://127.0.0.1:5000/api/login";
  };

  return (
    <div className="login-page">
      <h1>Log in with Discord</h1>
      <button className="neon-sign" onClick={handleLogin}>
        Log in with Discord
      </button>
    </div>
  );
}

export default LoginPage;
