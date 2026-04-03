# Copilot Instructions — Sentinel-Debug AI Debugger

**Project:** Portfolio Website with Integrated GitHub AI Debugger  
**Repository:** `portfolio-website`  
**Branch:** `feature/sentinel-ai`  
**Owner:** `savaze123`  
**Last Updated:** April 2, 2026

---

## 1. Project Overview

This project is a **Flask + React portfolio website** with an integrated **Sentinel-Debug** feature — a two-phase GitHub Repository AI Debugger powered by Gemini 1.5 Flash.

### Architecture
- **Frontend:** React 18.3.1 (Vercel deployment)
- **Backend:** Flask with Flask-Limiter (Railway deployment)
- **Rate Limiting:** Upstash Redis (distributed)
- **AI Engine:** Google Gemini 1.5 Flash API
- **Theme:** Matrix cyberpunk with neon HUD panels

---

## 2. Protected Files (Do NOT Modify Without Permission)

### Backend Files
These files implement the two-phase AI debugging pipeline:

1. **`backend/scraper.py`** (261 lines)
   - GitHub URL validation (SSRF prevention)
   - File tree fetching via GitHub REST API
   - Secret file filtering (.env, *secret*, *key*, .pem, .cert, etc.)
   - Max 5 files per scrape, 200 lines per file
   - **Purpose:** SCOUTER phase file discovery

2. **`backend/ai_logic.py`** (377 lines)
   - Gemini 1.5 Flash integration
   - Context compression (at 80% threshold)
   - Token usage estimation
   - BYOK (Bring Your Own Key) support
   - Session history management (30,000 token limit)
   - **Purpose:** SURGEON phase AI analysis

3. **`backend/ai_routes.py`** (319 lines)
   - Flask Blueprint with `/api/ai/*` endpoints
   - Rate limiting: 3 per 10 minutes per IP
   - Endpoints: `/tree`, `/plan`, `/analyze`, `/compress`, `/status`
   - Terminal logging with [SYS], [WARNING], [ERROR], [SUCCESS] levels
   - BYOK header extraction: `X-User-Key`
   - **Purpose:** API router for both phases

### Frontend Components
Located in `frontend/my-portfolio/src/components/AI/`:

1. **`TerminalLog.js`** (91 lines) + **`TerminalLog.css`** (224 lines)
   - Scrolling terminal display with auto-scroll
   - Log levels: SYS, ERROR, WARNING, SUCCESS
   - HH:MM:SS timestamp formatting
   - **Used in:** AIDebugger main layout (left column)

2. **`ContextBar.js`** (123 lines) + **`ContextBar.css`** (345 lines)
   - Session stability indicator
   - Token usage tracking (30,000 limit)
   - Threshold warnings: 80% (yellow), 100% (red)
   - **Used in:** AIDebugger main layout (right column)

3. **`FileApproval.js`** (171 lines) + **`FileApproval.css`** (444 lines)
   - File checklist from SCOUTER phase
   - Approve/remove individual files
   - Replacement file input (when removing a file)
   - "INITIATE SCRAPE" button (enabled when ≥ 1 file approved)
   - **Used in:** AIDebugger Phase 2

4. **`DiffViewer.js`** (106 lines) + **`DiffViewer.css`** (366 lines)
   - GitHub-style side-by-side diff display (desktop)
   - Stacked vertical layout (mobile < 768px)
   - Shows old code (red) vs new code (green)
   - File paths and line ranges
   - **Used in:** AIDebugger Phase 3

5. **`BYOKModal.js`** (167 lines) + **`BYOKModal.css`** (511 lines)
   - User API key input modal
   - Format validation: must start with "AIza"
   - localStorage persistence: `sentinel_user_key`
   - Triggers when rate limit reached (429 error)
   - **Used in:** AIDebugger global rate limit fallback

6. **`SecurityGate.js`** (109 lines) + **`SecurityGate.css`** (327 lines)
   - Dual-input human verification gate
   - Visible input: human_verification (must match "I am human", case-insensitive)
   - Hidden honeypot: api_token_confirm (CSS display: none)
   - If honeypot filled → 24-hour IP block via Redis
   - Unlimited retries on human input failure (no IP block)
   - **Used in:** ProtectedDebugger wrapper in App.js

7. **`AIDebugger.js`** (433 lines) + **`AIDebugger.css`** (528 lines)
   - Main container combining all AI components
   - State management for both SCOUTER and SURGEON phases
   - 3-column responsive layout: TerminalLog | Input/Analysis | ContextBar
   - Session management (chat history, token tracking)
   - **Routes to:** `/debug` (protected by SecurityGate)

---

## 3. Protected Routes

These routes must NOT be modified or removed:

### Existing Routes (Do NOT Touch)
- `GET /` → ResumePage
- `GET /login` → LoginPage
- `GET /callback` → CallbackHandler (Discord OAuth)
- `GET /servers` → ServersPage
- `GET /api/check-auth` → Check Discord authentication
- `POST /api/login` → Initiate Discord OAuth
- `POST /api/callback` → Handle Discord OAuth callback
- `GET /api/profile` → Fetch user profile (Discord)
- `GET /api/resume` → Fetch resume data
- `GET /api/bitcoin-price` → Fetch Bitcoin price
- `GET /api/crypto` → Fetch crypto prices

### New AI Routes (Part of Blueprint)
- `GET /api/ai/tree` → Fetch GitHub file tree
- `POST /api/ai/plan` → SCOUTER: suggest files
- `POST /api/ai/analyze` → SURGEON: fetch + analyze code
- `POST /api/ai/compress` → Compress chat history (80% threshold)
- `GET /api/ai/status` → Check session/context status

### New Frontend Routes
- `GET /debug` → AIDebugger (protected by SecurityGate)

---

## 4. Matrix Theme Design System

### CSS Variables (defined in `App.css`)
```css
--green: #00ff41;           /* Primary HUD color */
--cyan: #00e5ff;            /* Secondary accent */
--pink: #ff33cc;            /* Tertiary accent */
--green-glow: 0 0 10px #00ff41;

/* Fonts */
--font-hud: 'Orbitron';
--font-mono: 'Share Tech Mono';
```

### Design Patterns
- **HUD Panels:** Corner brackets (::before/::after), neon glow box-shadow
- **Colors:** Green (#00ff41) for primary, Cyan (#00e5ff) for headers, Pink (#ff33cc) for badges
- **Animations:** slideIn (0.3s), pulse (1.5s), compress-bar (0.8s)
- **Responsive Breakpoints:** 768px (tablet), 480px (mobile)
- **Scrollbars:** Green thumb with cyan hover

### Key Components with HUD Styling
- All AI components (TerminalLog, ContextBar, FileApproval, DiffViewer, BYOKModal, SecurityGate)
- AIDebugger main container
- Form inputs with green borders and cyan focus states

---

## 5. Security Implementation

### SSRF Prevention (Scraper)
- GitHub URLs must match: `https://github.com/[owner]/[repo]`
- Regex validation in `validate_github_url()`
- Only HTTPS allowed, no file:// or localhost

### Secret Filtering (Scraper)
Blocked file patterns:
- `.env`, `*.secret*`, `*.config*`, `*.key*`, `*.pem`, `*.cert`, `*password*`, `.git/*`
- Function: `is_safe_file(filepath)`

### Rate Limiting (Backend)
- **Strategy:** 3 requests per 10 minutes per IP (distributed via Upstash Redis)
- **Applied to:** All `/api/ai/*` routes only
- **Fallback:** Memory-based limiter if Upstash credentials absent
- **Error Code:** 429 Too Many Requests
- **Bypass:** BYOK (Bring Your Own Key) via `X-User-Key` header

### Human Verification Gate (Frontend)
- **Visible Input:** Must match "I am human" (case-insensitive)
- **Hidden Honeypot:** If `api_token_confirm` field filled → bot detected
- **Action on Honeypot:** 24-hour IP block via Redis (backend handles)
- **Action on Wrong Input:** Unlimited retries, no IP block

### BYOK Implementation
- User provides own Gemini API key via modal
- Stored in browser localStorage: `sentinel_user_key`
- Sent in request header: `X-User-Key: [user_key]`
- Checked in `backend/ai_logic.py` before global `GEMINI_API_KEY`

### Context Management
- **Session Limit:** 30,000 tokens per session
- **Warning Threshold:** 80% (24,000 tokens) → UI warning
- **Critical Threshold:** 100% (30,000 tokens) → force new session
- **Compression:** At 80%, create 5-bullet summary, reset to 10%

---

## 6. Environment Variables

### Backend (Flask, Railway)
```bash
# Required
FLASK_APP=app.py
FLASK_ENV=production
SECRET_KEY=<secret_key>
DISCORD_CLIENT_ID=<discord_id>
DISCORD_CLIENT_SECRET=<discord_secret>
DISCORD_REDIRECT_URI=https://railway.app/api/callback

# AI Engine
GEMINI_API_KEY=AIza...

# GitHub API
GITHUB_TOKEN=ghp_...

# Rate Limiting (Upstash)
UPSTASH_REDIS_URL=https://...redis.upstash.io
UPSTASH_REDIS_TOKEN=<token>
```

### Frontend (React, Vercel)
```bash
REACT_APP_API_URL=https://railway-backend.app
```

### NEVER Hardcode
- API keys
- Database passwords
- Discord secrets
- GitHub tokens

---

## 7. API Rate Limiting Details

### Endpoints Affected
All routes under `/api/ai/*`:
- GET `/api/ai/tree`
- POST `/api/ai/plan`
- POST `/api/ai/analyze`
- POST `/api/ai/compress`
- GET `/api/ai/status`

### Rate Limits
- **SCOUTER Phase:** 3 requests per 10 minutes (fetch tree + plan)
- **SURGEON Phase:** 3 requests per 10 minutes (analyze)
- **Context Compress:** 3 requests per 10 minutes
- **Status Check:** 10 requests per 10 minutes (diagnostic)

### Response Code
- **200 OK:** Request successful
- **429 Too Many Requests:** Rate limit exceeded
  - Include `Retry-After` header
  - User should use BYOK modal to continue
- **500 Server Error:** AI engine failure (Gemini API issue)

---

## 8. Two-Phase Pipeline

### Phase 1: SCOUTER
**Input:** GitHub URL + Problem Description  
**Process:**
1. Fetch repository file tree via GitHub REST API
2. Send problem + file list to Gemini for analysis
3. Gemini returns up to 5 suggested files with reasons

**Output:** List of suggested files with:
- File path
- Selection reason (why it's relevant)
- Line range (start, end)

**UI:** FileApproval component for user selection

### Phase 2: SURGEON
**Input:** GitHub URL + Problem + Approved Files  
**Process:**
1. Fetch each approved file content from GitHub
2. Wrap code in `[CODE_BLOCK_START]` / `[CODE_BLOCK_END]` markers
3. Send problem + code blocks + chat history to Gemini
4. Gemini returns root cause + suggested changes

**Output:** Array of changes with:
- File path
- Old code (current)
- New code (suggested)
- Line range affected

**UI:** DiffViewer component showing side-by-side comparison

---

## 9. Deployment Targets

### Frontend
- **Platform:** Vercel
- **Build Command:** `npm run build`
- **Start Command:** `npm start`
- **Environment:** Node.js 18+
- **Main File:** `frontend/my-portfolio/src/App.js`

### Backend
- **Platform:** Railway
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `python backend/app.py`
- **Python Version:** 3.9+
- **Main File:** `backend/app.py`

### Rate Limiting Backend
- **Platform:** Upstash (Redis)
- **Plan:** Free tier (up to 10,000 requests/day)
- **Connection:** Environment variables `UPSTASH_REDIS_URL` + `UPSTASH_REDIS_TOKEN`

---

## 10. File Structure

```
portfolio_website/
├── .github/
│   └── copilot-instructions.md (THIS FILE)
├── backend/
│   ├── app.py (PROTECTED)
│   ├── scraper.py (PROTECTED)
│   ├── ai_logic.py (PROTECTED)
│   ├── ai_routes.py (PROTECTED)
│   ├── requirements.txt
│   ├── .env (SECRET - never commit)
│   └── flask_session/
├── frontend/my-portfolio/
│   ├── src/
│   │   ├── App.js (MODIFIED - /debug route added)
│   │   ├── App.css
│   │   ├── components/
│   │   │   └── AI/ (NEW DIRECTORY)
│   │   │       ├── TerminalLog.js (PROTECTED)
│   │   │       ├── TerminalLog.css (PROTECTED)
│   │   │       ├── ContextBar.js (PROTECTED)
│   │   │       ├── ContextBar.css (PROTECTED)
│   │   │       ├── FileApproval.js (PROTECTED)
│   │   │       ├── FileApproval.css (PROTECTED)
│   │   │       ├── DiffViewer.js (PROTECTED)
│   │   │       ├── DiffViewer.css (PROTECTED)
│   │   │       ├── BYOKModal.js (PROTECTED)
│   │   │       ├── BYOKModal.css (PROTECTED)
│   │   │       ├── SecurityGate.js (PROTECTED)
│   │   │       ├── SecurityGate.css (PROTECTED)
│   │   │       ├── AIDebugger.js (PROTECTED)
│   │   │       └── AIDebugger.css (PROTECTED)
│   │   └── [other existing components]
│   ├── package.json
│   └── public/
├── README.md
└── .env (SECRET)
```

---

## 11. Instructions for Copilot

### ✅ DO
- Suggest improvements to UI/UX within Matrix theme constraints
- Add new features to existing components (Terminal, Context, FileApproval, etc.)
- Optimize performance in AI logic
- Improve error handling and user feedback
- Create new non-core components (utilities, helpers)
- Update documentation and comments
- Fix bugs in protected files if explicitly requested by user with "critical bug" confirmation
- Suggest environment setup improvements

### ❌ DO NOT
- Modify protected file logic without explicit permission
- Change API endpoints or rate limiting strategy
- Remove SSRF validation or secret filtering
- Alter the two-phase pipeline structure
- Change authentication mechanism (stays human verification gate)
- Modify Discord OAuth routes
- Remove honeypot security gate
- Add new external dependencies without user approval
- Commit `.env` file or API keys
- Change deployment targets (Vercel/Railway)

### 📋 Validation Checklist Before Every Change
1. Is this file listed in "Protected Files"?
2. Does this change affect security (SSRF, secrets, rate limiting)?
3. Does this modify Discord OAuth or existing routes?
4. Does this add new dependencies?
5. Does this break Matrix theme consistency?

If YES to any above → **ASK USER FOR PERMISSION FIRST**

---

## 12. Common Tasks & Solutions

### Task: Add new AI command
**Solution:**
1. Add new POST endpoint in `ai_routes.py` with @limiter.limit decorator
2. Create corresponding frontend handler in `AIDebugger.js`
3. Add terminal logging with [SYS]/[WARNING]/[ERROR] format
4. Include in rate limiting (3 per 10 min)

### Task: Customize Gemini instructions
**Solution:**
1. Edit `backend/copilot-instructions/scouter.md` for Phase 1
2. Edit `backend/copilot-instructions/surgeon.md` for Phase 2
3. Load via `load_instructions()` in `ai_logic.py`
4. No need to modify AI routes

### Task: Change token limits
**Solution:**
1. Modify `SESSION_CONTEXT_LIMIT = 30000` in `ai_logic.py`
2. Update threshold percentages (80% warning, 100% critical)
3. Update ContextBar.js display values
4. Update `.github/copilot-instructions.md`

### Task: Add new log level
**Solution:**
1. Add level name to `getLogClass()` in `TerminalLog.js`
2. Add CSS styling in `TerminalLog.css`
3. Use `addLog(message, 'LEVEL_NAME')` in AIDebugger.js
4. Avoid modifying backend terminal logging format

### Task: Modify security gate behavior
**Solution:**
1. Edit `SecurityGate.js` for UI/logic changes
2. Frontend side: "I am human" validation handled locally
3. Backend side: Honeypot detection in Flask app (if adding IP block)
4. Update `.github/copilot-instructions.md` if rules change

---

## 13. Testing Checklist

Before deploying to production, verify:

- [ ] SCOUTER phase: GitHub URL validation works
- [ ] SCOUTER phase: File tree fetches correctly
- [ ] SCOUTER phase: Gemini suggests 5 files
- [ ] SURGEON phase: Files fetch without secrets
- [ ] SURGEON phase: Line limiting (200 max) enforced
- [ ] Rate limiting: 3 per 10 min enforced
- [ ] Rate limiting: BYOK allows bypass
- [ ] ContextBar: Tokens track correctly
- [ ] ContextBar: Threshold warnings at 80%/100%
- [ ] DiffViewer: Desktop shows side-by-side
- [ ] DiffViewer: Mobile shows stacked
- [ ] Terminal Log: All levels display with correct colors
- [ ] Security Gate: "I am human" validation works
- [ ] Security Gate: Honeypot detection works
- [ ] localStorage: BYOK key persists
- [ ] Responsive: 768px breakpoint works
- [ ] Responsive: 480px breakpoint works
- [ ] Matrix theme: All colors consistent
- [ ] No API keys in frontend code
- [ ] No secrets in git history

---

## 14. Contact & Questions

For questions about this implementation:
1. Check `.github/copilot-instructions.md` (this file)
2. Read inline code comments in protected files
3. Review backend `copilot-instructions/` folder (scouter.md, surgeon.md)
4. Ask user for clarification if rule is unclear

---

**Last Updated:** April 2, 2026  
**Maintained By:** GitHub Copilot  
**Version:** 1.0
