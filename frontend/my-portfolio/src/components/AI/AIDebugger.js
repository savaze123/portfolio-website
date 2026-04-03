import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AIDebugger.css';
import TerminalLog from './TerminalLog';
import ContextBar from './ContextBar';
import FileApproval from './FileApproval';
import DiffViewer from './DiffViewer';
import BYOKModal from './BYOKModal';

/**
 * AIDebugger Component
 * Main container for Sentinel-Debug two-phase GitHub AI debugger.
 * Combines all AI components: input, file approval, terminal log, context bar, diff viewer.
 * Phase 1 (SCOUTER): Analyze problem → suggest files
 * Phase 2 (SURGEON): Fetch approved files → analyze code → suggest fixes
 */
function AIDebugger() {
  const navigate = useNavigate();
  
  // Input state
  const [githubUrl, setGithubUrl] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  
  // Phase 1 (SCOUTER) state
  const [scouterLoading, setScouterLoading] = useState(false);
  const [suggestedFiles, setSuggestedFiles] = useState([]);
  const [scouterError, setScouterError] = useState('');
  
  // Phase 2 (SURGEON) state
  const [approvedFiles, setApprovedFiles] = useState([]);
  const [surgeonLoading, setSurgeonLoading] = useState(false);
  const [suggestedChanges, setSuggestedChanges] = useState([]);
  const [surgeonError, setSurgeonError] = useState('');
  
  // UI state
  const [logs, setLogs] = useState([]);
  const [tokensUsed, setTokensUsed] = useState(0);
  const [sessionStatus, setSessionStatus] = useState('active'); // active, warning, critical
  const [byokModalOpen, setByokModalOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Session state
  const [chatHistory, setChatHistory] = useState([]);
  const [phase, setPhase] = useState('input'); // input, file-approval, analysis, complete
  const logsEndRef = useRef(null);

  /**
   * Add log entry with timestamp and level
   */
  const addLog = (message, level = 'SYS') => {
    const newLog = {
      timestamp: new Date(),
      level,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  /**
   * Validate GitHub URL format
   */
  const validateGithubUrl = (url) => {
    const regex = /^https:\/\/github\.com\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/;
    return regex.test(url);
  };

  /**
   * Phase 1: SCOUTER - Analyze problem and suggest files
   */
  const handleScouterPhase = async () => {
    // Validation
    if (!githubUrl.trim()) {
      addLog('GitHub URL required', 'ERROR');
      setScouterError('Please enter a valid GitHub URL');
      return;
    }

    if (!validateGithubUrl(githubUrl)) {
      addLog('Invalid GitHub URL format', 'ERROR');
      setScouterError('URL must be: https://github.com/owner/repo');
      return;
    }

    if (!problemDescription.trim()) {
      addLog('Problem description required', 'ERROR');
      setScouterError('Please describe the problem');
      return;
    }

    setScouterLoading(true);
    setScouterError('');
    addLog('[SCOUTER PHASE] Initializing...', 'SYS');

    try {
      // Step 1: Fetch file tree
      addLog('[SCOUTER] Fetching repository file tree...', 'SYS');
      const treeResponse = await axios.post('/api/ai/tree', {
        github_url: githubUrl
      }, {
        withCredentials: true
      });

      if (!treeResponse.data.tree) {
        throw new Error('Failed to fetch file tree');
      }

      const fileTree = treeResponse.data.tree;
      addLog(`[SCOUTER] Found ${fileTree.length} files in repository`, 'SYS');

      // Step 2: Analyze problem and get suggested files
      addLog('[SCOUTER] Analyzing problem...', 'SYS');
      const planResponse = await axios.post('/api/ai/plan', {
        github_url: githubUrl,  // ← ADD THIS LINE
        problem: problemDescription,
        file_tree: fileTree,
      }, {
        withCredentials: true
      });

      if (!planResponse.data.suggested_files) {
        throw new Error('Failed to get file suggestions');
      }

      const files = planResponse.data.suggested_files;
      setSuggestedFiles(files);
      setApprovedFiles([]);
      setChatHistory([
        {
          role: 'user',
          content: `Problem: ${problemDescription}`,
        },
      ]);

      addLog(`[SCOUTER] Suggested ${files.length} files for analysis`, 'SUCCESS');
      addLog(`[SCOUTER] Awaiting user approval...`, 'SYS');
      setPhase('file-approval');
      setTokensUsed(planResponse.data.tokens_used || 0);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      addLog(`[SCOUTER] Error: ${errorMsg}`, 'ERROR');
      setScouterError(errorMsg);
    } finally {
      setScouterLoading(false);
    }
  };

  /**
   * Phase 2: SURGEON - Fetch files and analyze code
   */
  const handleSurgeonPhase = async () => {
    if (approvedFiles.length === 0) {
      addLog('No files approved', 'ERROR');
      return;
    }

    setSurgeonLoading(true);
    setSurgeonError('');
    addLog('[SURGEON PHASE] Initializing...', 'SYS');

    try {
      // Step 1: Fetch approved files
      addLog(`[SURGEON] Fetching ${approvedFiles.length} approved files...`, 'SYS');
      const codeBlocks = {};

      for (const file of approvedFiles) {
        try {
          const fileResponse = await axios.post('/api/ai/analyze', {
            github_url: githubUrl,
            filepath: file.path,
            line_start: file.line_start || 1,
            line_end: file.line_end || 200,
            problem: problemDescription,
            code_blocks: codeBlocks,
            chat_history: chatHistory,
          });

          codeBlocks[file.path] = fileResponse.data.code || '';
          addLog(`[SURGEON] Fetched: ${file.path}`, 'SYS');
        } catch (fileError) {
          addLog(`[SURGEON] Failed to fetch ${file.path}`, 'WARNING');
        }
      }

      if (Object.keys(codeBlocks).length === 0) {
        throw new Error('Failed to fetch any file contents');
      }

      // Step 2: Run AI analysis on collected code
      addLog('[SURGEON] Running AI analysis...', 'SYS');
      const analysisResponse = await axios.post('/api/ai/analyze', {
        github_url: githubUrl,
        problem: problemDescription,
        code_blocks: codeBlocks,
        chat_history: chatHistory,
      });

      const analysis = analysisResponse.data;
      setSuggestedChanges(analysis.suggested_changes || []);
      
      // Update session context
      const updatedHistory = [
        ...chatHistory,
        {
          role: 'user',
          content: `Approved files: ${approvedFiles.map((f) => f.path).join(', ')}`,
        },
        {
          role: 'assistant',
          content: analysis.root_cause || 'Analysis complete',
        },
      ];
      setChatHistory(updatedHistory);

      addLog('[SURGEON] Analysis complete', 'SUCCESS');
      if (analysis.suggested_changes?.length > 0) {
        addLog(`[SURGEON] Found ${analysis.suggested_changes.length} suggested change(s)`, 'SUCCESS');
      }

      setPhase('complete');
      setTokensUsed(analysis.tokens_used || tokensUsed);

      // Check context threshold
      if (analysis.context_status === 'warning') {
        addLog('[CONTEXT] Memory at 80% - compression recommended', 'WARNING');
      } else if (analysis.context_status === 'critical') {
        addLog('[CONTEXT] Memory critical - start new session', 'ERROR');
        setSessionStatus('critical');
      }
    } catch (error) {
      if (error.response?.status === 429) {
        addLog('[SURGEON] Rate limit reached - BYOK required', 'ERROR');
        setByokModalOpen(true);
      } else {
        const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
        addLog(`[SURGEON] Error: ${errorMsg}`, 'ERROR');
        setSurgeonError(errorMsg);
      }
    } finally {
      setSurgeonLoading(false);
    }
  };

  /**
   * Handle file approval change
   */
  const handleApprovalChange = (approved) => {
    setApprovedFiles(approved);
  };

  /**
   * Handle new session
   */
  const handleNewSession = () => {
    setGithubUrl('');
    setProblemDescription('');
    setSuggestedFiles([]);
    setApprovedFiles([]);
    setSuggestedChanges([]);
    setLogs([]);
    setTokensUsed(0);
    setChatHistory([]);
    setPhase('input');
    setSessionStatus('active');
    addLog('[SYSTEM] New session initiated', 'SYS');
  };

  /**
   * Handle BYOK submission
   */
  const handleByokSubmit = (apiKey) => {
    addLog('[BYOK] User API key configured', 'SUCCESS');
    setByokModalOpen(false);
    // Retry SURGEON phase with user's API key
    // (The X-User-Key header will be used in subsequent requests)
    setTimeout(() => handleSurgeonPhase(), 500);
  };

  /**
   * Handle back to resume
   */
  const handleBackToResume = () => {
    navigate('/');
  };

  return (
    <div className="debugger-container">
      {/* Header */}
      <div className="debugger-header">
        <div className="header-content">
          <h1>◆ SENTINEL-DEBUG ◆</h1>
          <p className="header-subtitle">GitHub Repository AI Debugger</p>
        </div>
        <button
          onClick={handleBackToResume}
          className="back-to-resume-btn"
          title="Return to portfolio"
        >
          ◀ RESUME
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="debugger-layout">
        {/* Left Column: Terminal Log */}
        <div className="debugger-column-left">
          <TerminalLog logs={logs} />
        </div>

        {/* Center Column: Input and Analysis */}
        <div className="debugger-column-center">
          {/* GitHub URL Input */}
          {phase === 'input' && (
            <div className="input-section">
              <div className="input-section-header">
                <h3>◆ PHASE 1: SCOUTER ◆</h3>
              </div>
              <div className="input-form">
                {/* GitHub URL Input */}
                <div className="form-group">
                  <label htmlFor="github-url" className="form-label">
                    GitHub Repository URL
                  </label>
                  <input
                    id="github-url"
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="form-input"
                    disabled={scouterLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && problemDescription.trim()) {
                        handleScouterPhase();
                      }
                    }}
                  />
                </div>

                {/* Problem Description */}
                <div className="form-group">
                  <label htmlFor="problem-desc" className="form-label">
                    Problem Description
                  </label>
                  <textarea
                    id="problem-desc"
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="Describe the issue, bug, or feature request..."
                    className="form-textarea"
                    disabled={scouterLoading}
                    rows="6"
                  />
                </div>

                {/* Error Message */}
                {scouterError && (
                  <div className="error-message">
                    <span>✗</span> {scouterError}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleScouterPhase}
                  disabled={scouterLoading || !githubUrl.trim() || !problemDescription.trim()}
                  className={`submit-btn ${scouterLoading ? 'loading' : ''}`}
                >
                  {scouterLoading ? '◆ ANALYZING... ◆' : '► RUN SCOUTER ◄'}
                </button>
              </div>
            </div>
          )}

          {/* File Approval */}
          {phase === 'file-approval' && (
            <div className="approval-section">
              <div className="approval-section-header">
                <h3>◆ PHASE 2: FILE APPROVAL ◆</h3>
              </div>
              <FileApproval
                suggestedFiles={suggestedFiles}
                onApprovalChange={handleApprovalChange}
                onInitiateScrape={handleSurgeonPhase}
                isLoading={surgeonLoading}
              />
              <button
                onClick={() => setPhase('input')}
                className="back-btn"
                disabled={surgeonLoading}
              >
                ◀ BACK
              </button>
            </div>
          )}

          {/* Analysis Results */}
          {phase === 'complete' && (
            <div className="results-section">
              <div className="results-section-header">
                <h3>◆ PHASE 3: ANALYSIS COMPLETE ◆</h3>
              </div>
              <DiffViewer changes={suggestedChanges} />
              <div className="results-footer">
                <button
                  onClick={handleNewSession}
                  className="new-session-btn"
                >
                  ✦ NEW SESSION ✦
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Context Bar */}
        <div className="debugger-column-right">
          <ContextBar
            tokensUsed={tokensUsed}
            tokensLimit={30000}
            onNewSession={handleNewSession}
            isCompressing={isCompressing}
          />
        </div>
      </div>

      {/* BYOK Modal */}
      <BYOKModal
        isOpen={byokModalOpen}
        onClose={() => setByokModalOpen(false)}
        onSubmit={handleByokSubmit}
      />
    </div>
  );
}

export default AIDebugger;
