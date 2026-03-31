import React from 'react';
import './App.css';
import MatrixBackButton from './MatrixBackButton';
function LoginPage() {
const handleLogin = () => {
window.location.href = "http://127.0.0.1:5000/api/login";
  };
return (
<div className="login-page">
  <div style={{
    position: 'fixed',
    bottom: '20px',
    left: '20px',
    zIndex: 1000
  }}>
    <MatrixBackButton label="BACK" onClick={() => window.location.href = 'http://localhost:3000'} />
  </div>
<button className="neon-sign" onClick={handleLogin}>
        Log in with Discord
</button>
</div>
  );
}
export default LoginPage;