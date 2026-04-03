"""
AI Routes Blueprint for Sentinel-Debug
Flask routes for the SCOUTER and SURGEON phases of code analysis
Includes rate limiting via Flask-Limiter + Upstash Redis
"""

from flask import Blueprint, request, jsonify, session
from functools import wraps
import os
from scraper import (
    get_file_tree,
    get_file_content,
    validate_github_url,
    wrap_code_block,
)
from ai_logic import (
    analyze_problem,
    analyze_code,
    summarize_context,
    check_context_threshold,
    estimate_token_usage,
)


# Create blueprint
ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

# Rate limiting config (will be initialized in app.py)
limiter = None


def init_rate_limiter(limiter_instance):
    """Initialize the limiter for this blueprint."""
    global limiter
    limiter = limiter_instance


def rate_limit(limit_string):
    """
    Lazy-evaluated rate limit decorator.
    Allows limiter to be None at import time, evaluated at request time.
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            if limiter is not None:
                return limiter.limit(limit_string)(f)(*args, **kwargs)
            return f(*args, **kwargs)
        return wrapped
    return decorator


def get_user_key_from_headers():
    """Extract user's Gemini API key from request headers (BYOK)."""
    return request.headers.get('X-User-Key')


# ═══════════════════════════════════════════════════════════════
# PHASE A — SCOUTER ROUTES
# ═══════════════════════════════════════════════════════════════

@ai_bp.route('/tree', methods=['POST'])
@rate_limit("20 per day")
def get_tree():
    """
    Fetch GitHub repository file tree.
    
    Body:
        {
            "github_url": "https://github.com/owner/repo"
        }
    
    Returns:
        File tree structure or error
    """
    data = request.get_json() or {}
    github_url = data.get('github_url', '').strip()
    
    if not github_url:
        return jsonify({"error": "github_url parameter required"}), 400
    
    print("[SYS]: Validating GitHub URL...")
    
    result = get_file_tree(github_url)
    
    if result.get("status") != 200:
        print(f"[ERROR]: {result.get('error')}")
        return jsonify(result), result.get("status", 500)
    
    print(f"[SYS]: File tree mapped. {result.get('total_items')} nodes identified.")
    
    return jsonify(result), 200


@ai_bp.route('/plan', methods=['POST'])
@rate_limit("15 per day")
def create_plan():
    """
    Analyze problem and suggest files (SCOUTER Phase A).
    
    Body:
        {
            "github_url": "https://github.com/...",
            "problem": "Description of the problem",
            "file_tree": [list of file objects]
        }
    
    Returns:
        Suggested files with reasons and line ranges
    """
    data = request.get_json() or {}
    
    github_url = data.get('github_url')
    problem = data.get('problem', '').strip()
    file_tree = data.get('file_tree', [])
    
    if not github_url or not problem:
        return jsonify({
            "error": "github_url and problem required"
        }), 400
    
    if not file_tree:
        return jsonify({
            "error": "file_tree required"
        }), 400
    
    # Validate GitHub URL
    is_valid, error_msg, _ = validate_github_url(github_url)
    if not is_valid:
        return jsonify({"error": error_msg}), 400
    
    print("[SYS]: Analyzing problem statement...")
    
    # Get user key if provided (BYOK)
    user_key = get_user_key_from_headers()
    
    # Analyze problem
    result = analyze_problem(problem, file_tree, user_key=user_key)
    
    if result.get("status") != 200:
        print(f"[ERROR]: {result.get('error')}")
        return jsonify(result), result.get("status", 500)
    
    tokens_used = result.get("tokens_used", 0)
    print(f"[SYS]: POST /gemini-2.5-flash: 200 OK | Tokens: {tokens_used:,}")
    
    return jsonify(result), 200


# ═══════════════════════════════════════════════════════════════
# PHASE B — SURGEON ROUTES
# ═══════════════════════════════════════════════════════════════

@ai_bp.route('/analyze', methods=['POST'])
@rate_limit("15 per day")
def run_analysis():
    """
    Fetch approved files and run root cause analysis (SURGEON Phase B).
    
    Body:
        {
            "github_url": "https://github.com/...",
            "problem": "Original problem description",
            "files": [
                {
                    "path": "src/file.js",
                    "line_start": 1,
                    "line_end": 50
                }
            ],
            "chat_history": [optional previous turns]
        }
    
    Returns:
        Root cause analysis with suggested fixes
    """
    data = request.get_json() or {}
    
    github_url = data.get('github_url', '').strip()
    problem = data.get('problem', '').strip()
    files = data.get('files', [])
    chat_history = data.get('chat_history', [])
    
    print(f"[DEBUG] analyze called — files received: {files}") 
    
    if not github_url or not problem or not files:
        return jsonify({
            "error": "github_url, problem, and files required"
        }), 400
    
    # Validate GitHub URL
    is_valid, error_msg, _ = validate_github_url(github_url)
    if not is_valid:
        return jsonify({"error": error_msg}), 400
    
    # Limit to 5 files
    if len(files) > 5:
        return jsonify({
            "error": f"Maximum 5 files allowed. Got {len(files)}"
        }), 400
    
    print(f"[SYS]: Scraping {len(files)} approved files...")
    
    # Fetch all file contents
    code_blocks = []
    for file_item in files:
        filepath = file_item.get('path', '')
        line_start = file_item.get('line_start', 1)
        line_end = file_item.get('line_end')
        
        result = get_file_content(github_url, filepath, line_start, line_end)
        
        if result.get("status") != 200:
            print(f"[ERROR]: GET {github_url}/contents/{filepath}: {result.get('status')}")
            print(f"[DEBUG] Full result: {result}")
            return jsonify({
                "error": f"Failed to fetch {filepath}: {result.get('error')}"
            }), result.get("status", 500)
        
        print(f"[SYS]: Scraping {filepath}: Lines {result.get('line_start')}-{result.get('line_end')}")
        
        code_blocks.append({
            "path": filepath,
            "content": wrap_code_block(result.get("content", "")),
            "line_range": f"{result.get('line_start')}-{result.get('line_end')}"
        })
    
    print("[SYS]: Running AI analysis...")
    
    # Get user key if provided (BYOK)
    user_key = get_user_key_from_headers()
    
    # Run analysis
    result = analyze_code(problem, code_blocks, chat_history, user_key=user_key)
    
    if result.get("status") != 200:
        print(f"[ERROR]: {result.get('error')}")
        return jsonify(result), result.get("status", 500)
    
    tokens_used = result.get("tokens_used", 0)
    print(f"[SYS]: POST /gemini-2.5-flash: 200 OK | Tokens: {tokens_used:,}")
    print("[SYS]: Anomaly detected. Generating repair patch...")
    
    return jsonify(result), 200


@ai_bp.route('/compress', methods=['POST'])
@rate_limit("10 per day")
def compress_memory():
    """
    Compress chat history when context reaches 80% (Strategy B).
    
    Body:
        {
            "chat_history": [array of turns]
        }
    
    Returns:
        5-bullet summary and token savings
    """
    data = request.get_json() or {}
    chat_history = data.get('chat_history', [])
    
    if not chat_history:
        return jsonify({
            "error": "chat_history required"
        }), 400
    
    print("[WARNING]: Context threshold reached. Compressing memory...")
    
    result = summarize_context(chat_history)
    
    if result.get("status") != 200:
        print(f"[ERROR]: {result.get('error')}")
        return jsonify(result), result.get("status", 500)
    
    tokens_saved = result.get("tokens_saved", 0)
    print(f"[SYS]: Memory Optimized. Stability reset to 10%. Saved {tokens_saved:,} tokens.")
    
    return jsonify(result), 200


@ai_bp.route('/status', methods=['GET'])
@rate_limit("30 per day")
def check_status():
    """
    Check session stability and context usage.
    
    Query params:
        - tokens_used: Current token count (required)
    
    Returns:
        Status with threshold info and recommended actions
    """
    tokens_used_str = request.args.get('tokens_used', '0')
    
    try:
        tokens_used = int(tokens_used_str)
    except ValueError:
        return jsonify({
            "error": "tokens_used must be an integer"
        }), 400
    
    result = check_context_threshold(tokens_used)
    
    status_label = {
        "normal": "SESSION STABILITY: NORMAL",
        "warning": "SESSION STABILITY: WARNING — COMPRESS MEMORY",
        "critical": "SESSION STABILITY: CRITICAL — NEW SESSION REQUIRED"
    }
    
    print(f"[SYS]: {status_label.get(result['status'], 'UNKNOWN')} ({result['percentage']}%)")
    
    return jsonify(result), 200


# ═══════════════════════════════════════════════════════════════
# ERROR HANDLERS
# ═══════════════════════════════════════════════════════════════

@ai_bp.errorhandler(429)
def handle_rate_limit(e):
    print("[ERROR]: Rate limit exceeded. Cooling down...")
    return jsonify({
        "error": "Rate limit exceeded. Please wait a moment and try again.",
        "retry_after": 120  # 2 minutes 
    }), 429

@ai_bp.errorhandler(500)
def handle_internal_error(e):
    """Handle internal server errors."""
    print(f"[ERROR]: Internal server error: {str(e)}")
    return jsonify({
        "error": "Internal server error"
    }), 500
