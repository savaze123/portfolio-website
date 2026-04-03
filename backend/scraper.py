"""
GitHub Repository Scraper for Sentinel-Debug
Handles secure fetching of repository file trees and file contents via GitHub REST API
"""

import os
import re
import requests
from typing import Dict, List, Optional, Tuple


GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")
GITHUB_API_BASE = "https://api.github.com"
MAX_FILES_PER_SCRAPE = 5
MAX_LINES_PER_FILE = 200
UNSAFE_FILE_PATTERNS = [
    r'\.env$',
    r'.*secret.*',
    r'.*config.*',
    r'.*key.*',
    r'\.pem$',
    r'\.cert$',
    r'.*password.*',
    r'\.git/.*',
]


def validate_github_url(url: str) -> Tuple[bool, str, Optional[Tuple[str, str]]]:
    """
    Validate GitHub URL and extract owner/repo.
    
    Args:
        url: GitHub URL to validate
        
    Returns:
        Tuple of (is_valid: bool, error_message: str, (owner, repo) if valid else None)
    """
    if not url or not isinstance(url, str):
        return False, "URL must be a non-empty string", None
    
    if not url.startswith("https://github.com/"):
        return False, "URL must start with https://github.com/", None
    
    # Extract owner/repo from URL
    # Format: https://github.com/owner/repo or https://github.com/owner/repo/...
    match = re.match(r"https://github\.com/([a-zA-Z0-9\-_]+)/([a-zA-Z0-9\-_.]+)(?:/|$)", url)
    if not match:
        return False, "Invalid GitHub URL format", None
    
    owner, repo = match.groups()
    repo = repo.rstrip("/")  # Remove trailing slash if present
    
    return True, "", (owner, repo)


def is_safe_file(filepath: str) -> Tuple[bool, Optional[str]]:
    """
    Check if file is safe to scrape (not a secret, config, or system file).
    
    Args:
        filepath: File path to validate
        
    Returns:
        Tuple of (is_safe: bool, reason: Optional[str])
    """
    if not filepath:
        return False, "File path cannot be empty"
    
    filepath_lower = filepath.lower()
    
    for pattern in UNSAFE_FILE_PATTERNS:
        if re.search(pattern, filepath_lower):
            return False, f"File matches restricted pattern: {pattern}"
    
    return True, None


def get_file_tree(github_url: str) -> Dict:
    """
    Fetch repository file tree via GitHub REST API.
    
    Args:
        github_url: GitHub repository URL
        
    Returns:
        Dict with file tree structure or error information
    """
    is_valid, error_msg, parsed = validate_github_url(github_url)
    if not is_valid:
        return {"error": error_msg, "status": 400}
    
    owner, repo = parsed
    
    try:
        # Use recursive tree API to get full file structure
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/main?recursive=1"
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "Authorization": f"token {GITHUB_TOKEN}" if GITHUB_TOKEN else ""
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 404:
            # Try 'master' branch instead of 'main'
            url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/git/trees/master?recursive=1"
            response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return {
                "error": f"Failed to fetch tree: {response.status_code}",
                "status": response.status_code
            }
        
        data = response.json()
        
        # Filter and structure tree
        tree_items = []
        if "tree" in data:
            for item in data["tree"]:
                path = item.get("path", "")
                
                # Filter out unsafe files but include them in tree for display
                is_safe, _ = is_safe_file(path)
                
                tree_items.append({
                    "path": path,
                    "type": item.get("type"),  # "blob" for file, "tree" for directory
                    "size": item.get("size", 0),
                    "is_safe": is_safe
                })
        
        return {
            "owner": owner,
            "repo": repo,
            "tree": tree_items,
            "total_items": len(tree_items),
            "status": 200
        }
    
    except requests.exceptions.Timeout:
        return {"error": "Request timeout", "status": 504}
    except requests.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}", "status": 500}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}", "status": 500}


def get_file_content(
    github_url: str,
    filepath: str,
    line_start: int = 1,
    line_end: Optional[int] = None
) -> Dict:
    """
    Fetch specific file content from GitHub with optional line range.
    
    Args:
        github_url: GitHub repository URL
        filepath: Path to file within repo
        line_start: Starting line number (1-indexed)
        line_end: Ending line number (1-indexed), if None fetch until end
        
    Returns:
        Dict with file content or error information
    """
    is_valid, error_msg, parsed = validate_github_url(github_url)
    if not is_valid:
        return {"error": error_msg, "status": 400}
    
    # Check file safety
    is_safe, reason = is_safe_file(filepath)
    if not is_safe:
        return {"error": f"File access denied: {reason}", "status": 403}
    
    owner, repo = parsed
    
    try:
        # Fetch file contents
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/contents/{filepath}"
        headers = {
            "Accept": "application/vnd.github.v3.raw",
            "Authorization": f"token {GITHUB_TOKEN}" if GITHUB_TOKEN else ""
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 404:
            return {
                "error": f"File not found: {filepath}",
                "status": 404,
                "suggestion": "Check the file path and try again"
            }
        
        if response.status_code != 200:
            return {
                "error": f"Failed to fetch file: {response.status_code}",
                "status": response.status_code
            }
        
        content = response.text
        lines = content.split("\n")
        
        # Validate and normalize line numbers
        line_start = max(1, line_start)
        total_lines = len(lines)
        
        if line_end is None:
            line_end = total_lines
        else:
            line_end = min(line_end, total_lines)
        
        # Check if file is too large
        if total_lines > MAX_LINES_PER_FILE:
            return {
                "error": f"File too large ({total_lines} lines). Specify a range.",
                "status": 413,
                "total_lines": total_lines,
                "max_range": MAX_LINES_PER_FILE,
                "suggestions": [
                    f"Lines 1-{MAX_LINES_PER_FILE}",
                    f"Lines {MAX_LINES_PER_FILE + 1}-{min(total_lines, MAX_LINES_PER_FILE * 2)}",
                    f"Lines {total_lines - MAX_LINES_PER_FILE + 1}-{total_lines}"
                ]
            }
        
        # Extract requested line range
        extracted_lines = lines[line_start - 1:line_end]
        extracted_content = "\n".join(extracted_lines)
        
        return {
            "filepath": filepath,
            "owner": owner,
            "repo": repo,
            "content": extracted_content,
            "line_start": line_start,
            "line_end": line_end,
            "total_lines": total_lines,
            "status": 200
        }
    
    except requests.exceptions.Timeout:
        return {"error": "Request timeout", "status": 504}
    except requests.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}", "status": 500}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}", "status": 500}


def wrap_code_block(content: str) -> str:
    """
    Wrap code content in block markers for Gemini API.
    
    Args:
        content: Raw code content
        
    Returns:
        Wrapped content with markers
    """
    return f"[CODE_BLOCK_START]\n{content}\n[CODE_BLOCK_END]"
