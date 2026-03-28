import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import axios from 'axios';
import MatrixBackground from './MatrixBackground';
import LoginPage from './LoginPage';
import ServersPage from './ServersPage';
import ResumePage from './ResumePage';

function CallbackHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/api/check-auth', {
          withCredentials: true,
        });
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

function App() {
  axios.defaults.baseURL = 'http://127.0.0.1:5000';
  axios.defaults.withCredentials = true;

  return (
    <>
      <MatrixBackground />
      <Router>
        <Routes>
          <Route path="/" element={<ResumePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/callback" element={<CallbackHandler />} />
          <Route path="/servers" element={<ServersPage />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
