import React from 'react';
import './App.css'; // Ensure this file includes styling for the login page

function LoginPage() {
  // Redirects user to the Discord login endpoint on button click
  const handleLogin = () => {
    window.location.href = "http://127.0.0.1:5000/api/login";
  };

  return (
    <div className="login-page">
      <h1>Log in with Discord</h1>
      {/* Button for Discord login */}
      <button className="neon-sign" onClick={handleLogin}>
        Log in with Discord
      </button>
    </div>
  );
}

export default LoginPage;
