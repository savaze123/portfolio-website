import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ResumePage.css';

const ResumePage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [resumeData, setResumeData] = useState(null);
  const [loading, setLoading] = useState(true);

  // ... existing useEffect and handlers ...

  return (
    <div className="resume-page">
      {/* ... existing resume content ... */}

      {/* ✅ ADD SENTINEL DEBUGGER BUTTON - after main resume content */}
      <div className="sentinel-debugger-button-container">
        <button
          className="sentinel-debugger-btn"
          onClick={() => navigate('/debug')}
          title="Launch Sentinel-Debug AI Debugger"
        >
          ◆ SENTINEL-DEBUG ◆
        </button>
        <p className="debugger-subtitle">Analyze GitHub repos with AI</p>
      </div>
    </div>
  );
}

export default ResumePage;