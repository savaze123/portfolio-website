"""
AI Logic for Sentinel-Debug
Handles code analysis, refactoring, and context compression using Gemini 1.5 Flash
"""

import os
import json
from typing import Dict, List, Optional
from google import genai


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SCOUTER_INSTRUCTIONS_PATH = "/backend/copilot-instructions/scouter.md"
SURGEON_INSTRUCTIONS_PATH = "/backend/copilot-instructions/surgeon.md"

# API Constants
NO_API_KEY_MSG = "No API key available"
SCOUTER_MODEL = "gemini-2.5-flash-lite"
SURGEON_MODEL = "gemini-2.5-flash"

# Context limits
SESSION_CONTEXT_LIMIT = 30000
CONTEXT_THRESHOLD_WARNING = 0.8  # 80% = 24000 tokens
CONTEXT_THRESHOLD_CRITICAL = 1.0  # 100% = 30000 tokens


def load_instructions(filepath: str) -> str:
    """
    Load instruction template from file, with fallback to defaults.
    
    Args:
        filepath: Path to instruction file
        
    Returns:
        Instruction text or default if file not found
    """
    try:
        # Try to load from file if it exists
        if os.path.exists(filepath):
            with open(filepath, 'r') as f:
                return f.read()
    except Exception:
        pass
    
    # Return defaults
    if "scouter" in filepath.lower():
        return "# SCOUTER INSTRUCTIONS\nAnalyze the problem and suggest 5 relevant files from the repository."
    else:
        return "# SURGEON INSTRUCTIONS\nAnalyze the code and provide a detailed fix with side-by-side diff."


def analyze_problem(problem: str, file_tree: List[Dict], user_key: Optional[str] = None) -> Dict:
    """
    Analyze a problem description and suggest 5 relevant files.
    
    Args:
        problem: Problem description from user
        file_tree: List of file objects from repository
        user_key: Optional user's own Gemini API key (BYOK)
        
    Returns:
        Dict with suggested files and analysis
    """
    if not problem or not isinstance(problem, str):
        return {"error": "Problem description required", "status": 400}
    
    if not file_tree:
        return {"error": "File tree is empty", "status": 400}
    
    # Configure API client
    api_key = user_key or GEMINI_API_KEY
    if not api_key:
        return {"error": NO_API_KEY_MSG, "status": 500}
    
    client = genai.Client(api_key=api_key)
    
    # Prepare file list for context
    safe_files = [f for f in file_tree if f.get("type") == "blob" and f.get("is_safe")]
    file_names = "\n".join([f["path"] for f in safe_files[:50]])  # Limit to 50 files
    
    scouter_prompt = load_instructions(SCOUTER_INSTRUCTIONS_PATH)
    
    prompt = f"""
{scouter_prompt}

PROBLEM DESCRIPTION:
{problem}

AVAILABLE FILES IN REPOSITORY:
{file_names}

Based on the problem above, suggest up to 5 most relevant files that would help diagnose the issue.
For each file, provide:
1. File path
2. One sentence reason why it's relevant
3. Suggested line range (if known)

Respond in JSON format:
{{
  "analysis": "Brief analysis of the problem",
  "suggested_files": [
    {{
      "path": "file/path.js",
      "reason": "One sentence explanation",
      "line_range": "1-50"
    }}
  ]
}}
"""
    
    try:
        response = client.models.generate_content(
            model=SCOUTER_MODEL,
            contents=prompt
        )
        
        # Parse response
        response_text = response.text
        
        # Extract JSON from response
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                result = json.loads(json_str)
            else:
                result = {
                    "analysis": response_text,
                    "suggested_files": []
                }
        except json.JSONDecodeError:
            result = {
                "analysis": response_text,
                "suggested_files": []
            }
        
        # Count tokens (estimate: roughly 4 chars = 1 token)
        estimated_tokens = len(prompt) // 4 + len(response_text) // 4
        
        return {
            "analysis": result.get("analysis", ""),
            "suggested_files": result.get("suggested_files", []),
            "tokens_used": estimated_tokens,
            "status": 200
        }
    
    except Exception as e:
        return {
            "error": f"Analysis failed: {str(e)}",
            "status": 500
        }


def analyze_code(
    code_blocks: List[Dict],
    problem: str,
    chat_history: Optional[List[Dict]] = None,
    user_key: Optional[str] = None
) -> Dict:
    """
    Send code blocks to Gemini for root cause analysis.
    
    Args:
        code_blocks: List of code blocks with path, content, line_range
        problem: Original problem description
        chat_history: Previous conversation turns for context
        user_key: Optional user's own Gemini API key (BYOK)
        
    Returns:
        Dict with analysis, suggested fixes, and token usage
    """
    if not code_blocks:
        return {"error": "No code blocks provided", "status": 400}
    
    # Configure API client
    api_key = user_key or GEMINI_API_KEY
    if not api_key:
        return {"error": NO_API_KEY_MSG, "status": 500}
    
    client = genai.Client(api_key=api_key)
    
    # Wrap code blocks properly
    formatted_blocks = []
    for block in code_blocks:
        # block should already be a dict from ai_routes.py
        if isinstance(block, str):
            # Fallback: if somehow string is passed, create dict
            formatted_blocks.append({
                'path': 'unknown',
                'content': block
            })
        else:
            # Normal path: dict is already correct
            formatted_blocks.append({
                'path': block.get('path', 'unknown'),
                'content': block.get('content', ''),
                'line_start': block.get('line_start', 1),
                'line_end': block.get('line_end', 200)
            })
    
    # Build prompt with wrapped code blocks
    code_section = "\n".join([
        f"[CODE_BLOCK_START: {block['path']} (Lines {block.get('line_start', 1)}-{block.get('line_end', 200)})]\n"
        f"{block['content']}\n"
        f"[CODE_BLOCK_END: {block['path']}]"
        for block in formatted_blocks
    ])
    
    # Build chat history context
    history_context = ""
    if chat_history:
        history_context = "\nPREVIOUS CONVERSATION:\n"
        for turn in chat_history[-3:]:  # Last 3 turns
            history_context += f"User: {turn.get('user', '')}\n"
            history_context += f"Assistant: {turn.get('assistant', '')}\n"
    
    surgeon_prompt = load_instructions(SURGEON_INSTRUCTIONS_PATH)
    
    prompt = f"""
{surgeon_prompt}

ORIGINAL PROBLEM:
{problem}

{history_context}

CODE TO ANALYZE:
{code_section}

Based on the code above, provide:
1. Root cause analysis
2. Specific line numbers where issues occur
3. Detailed fix with explanation
4. Side-by-side code changes

Respond in JSON format:
{{
  "root_cause": "Detailed explanation of the root cause",
  "severity": "critical|high|medium|low",
  "affected_lines": [line_numbers],
  "explanation": "Detailed explanation of the issue",
  "fix": "Step-by-step fix instructions",
  "suggested_changes": [
    {{
      "file": "path/to/file",
      "line_start": 10,
      "line_end": 15,
      "old_code": "original code",
      "new_code": "fixed code"
    }}
  ]
}}
"""
    
    try:
        response = client.models.generate_content(
            model=SURGEON_MODEL,
            contents=prompt
        )
        
        response_text = response.text
        
        # Extract JSON from response
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                result = json.loads(json_str)
            else:
                result = {"raw_response": response_text}
        except json.JSONDecodeError:
            result = {"raw_response": response_text}
        
        # Estimate tokens
        estimated_tokens = len(prompt) // 4 + len(response_text) // 4
        
        return {
            "analysis": result,
            "tokens_used": estimated_tokens,
            "status": 200
        }
    
    except Exception as e:
        return {
            "error": f"Code analysis failed: {str(e)}",
            "status": 500
        }


def summarize_context(chat_history: List[Dict]) -> Dict:
    """
    Compress chat history into a summary when context reaches 80%.
    Uses Gemini to create intelligent 5-bullet summary.
    
    Args:
        chat_history: Full conversation history
        
    Returns:
        Dict with summary and token savings
    """
    if not chat_history:
        return {"error": "No chat history to summarize", "status": 400}
    
    # Configure API client
    api_key = GEMINI_API_KEY
    if not api_key:
        return {"error": NO_API_KEY_MSG, "status": 500}
    
    client = genai.Client(api_key=api_key)
    
    # Build conversation text
    conversation = ""
    for turn in chat_history:
        conversation += f"User: {turn.get('user', '')}\n"
        conversation += f"Assistant: {turn.get('assistant', '')}\n\n"
    
    prompt = f"""
You are summarizing a technical debugging session. Create a concise 5-bullet summary capturing:
1. The main problem being debugged
2. Key files examined
3. Root causes identified
4. Fixes attempted
5. Current status

CONVERSATION:
{conversation}

Provide ONLY the 5 bullet points, no other text.
"""
    
    try:
        response = client.models.generate_content(
            model=SCOUTER_MODEL,
            contents=prompt
        )
        
        summary_text = response.text
        bullets = [line.strip() for line in summary_text.split('\n') if line.strip()][:5]
        
        # Estimate tokens saved (original context vs summary)
        original_tokens = len(conversation) // 4
        summary_tokens = sum(len(b) for b in bullets) // 4
        tokens_saved = original_tokens - summary_tokens
        
        return {
            "summary": bullets,
            "tokens_saved": tokens_saved,
            "status": 200
        }
    
    except Exception as e:
        return {
            "error": f"Summarization failed: {str(e)}",
            "status": 500
        }


def estimate_token_usage(text: str) -> int:
    """
    Estimate token count for text (rough approximation: 4 chars ≈ 1 token).
    
    Args:
        text: Text to estimate
        
    Returns:
        Estimated token count
    """
    return max(1, len(text) // 4)


def check_context_threshold(current_tokens: int) -> Dict:
    """
    Check if context usage is approaching limits and recommend actions.
    
    Args:
        current_tokens: Current token usage in session
        
    Returns:
        Dict with threshold info and recommendations
    """
    percentage = (current_tokens / SESSION_CONTEXT_LIMIT) * 100
    
    result = {
        "current_tokens": current_tokens,
        "limit": SESSION_CONTEXT_LIMIT,
        "percentage": round(percentage, 1),
        "status": "normal"
    }
    
    if percentage >= 100:
        result["status"] = "critical"
        result["message"] = "SESSION LIMIT REACHED. Start new session."
        result["action"] = "new_session"
    elif percentage >= 80:
        result["status"] = "warning"
        result["message"] = "Context approaching limit. Memory optimization recommended."
        result["action"] = "compress"
    
    return result
