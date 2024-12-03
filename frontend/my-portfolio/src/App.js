import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import LoginPage from "./LoginPage";
import ServersPage from "./ServersPage";
import ResumePage from "./ResumePage";
import Background from "./background/Background";

function App() {
  return (
    <div className="App">
      {/* Background Animation */}
      <Background />

      {/* Main Content */}
      <Router>
        <Routes>
          <Route path="/" element={<ResumePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/servers" element={<ServersPage />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
