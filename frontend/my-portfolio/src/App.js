import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import MatrixBackground from './MatrixBackground';
import LoginPage from './LoginPage';
import ServersPage from './ServersPage';
import ResumePage from './ResumePage';
import AIDebugger from './components/AI/AIDebugger';
import SecurityGate from './components/AI/SecurityGate';

function CallbackHandler() {
  const navigate = useNavigate();
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const response = await axios.get('/api/check-auth', { withCredentials: true });
        if (response.data.authenticated) {
          navigate('/servers');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        navigate('/login');
      }
    };
    handleCallback();
  }, [navigate]);
  return <div>Processing login...</div>;
}

/**
 * ProtectedDebugger Component
 * Wraps AIDebugger with SecurityGate (dual-input verification)
 * Visible input: human_verification (Must match 'I am human')
 * Hidden honeypot: api_token_confirm
 */
function ProtectedDebugger() {
  const [isVerified, setIsVerified] = useState(false);

  if (!isVerified) {
    return <SecurityGate onVerified={() => setIsVerified(true)} />;
  }

  return <AIDebugger />;
}
axios.defaults.baseURL = '';
axios.defaults.withCredentials = true;

function App() {
  return (
    <>
      <MatrixBackground />
      <Router>
        <Routes>
          <Route path="/" element={<ResumePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackHandler />} />
          <Route path="/servers" element={<ServersPage />} />
          <Route path="/debug" element={<ProtectedDebugger />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
