import os
import time
import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, redirect, request, session, send_from_directory
from flask_cors import CORS
from flask_session import Session

load_dotenv()

# Validate required environment variables at startup
_REQUIRED_ENV_VARS = [
    "SECRET_KEY",
    "DISCORD_CLIENT_ID",
    "DISCORD_CLIENT_SECRET",
    "DISCORD_REDIRECT_URI",
]
_missing = [var for var in _REQUIRED_ENV_VARS if not os.getenv(var)]
if _missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(_missing)}")

# Initialize Flask app
app = Flask(__name__, static_folder="frontend/build")
app.secret_key = os.getenv("SECRET_KEY")

# Cache for crypto prices (60 second TTL)
crypto_cache = {"data": None, "timestamp": 0}


# Configure Flask-Session
app.config["SESSION_TYPE"] = "filesystem"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_USE_SIGNER"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False
app.config["SESSION_COOKIE_HTTPONLY"] = True
Session(app)

# Enable CORS
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://127.0.0.1:3000"]}}, supports_credentials=True)

# Discord API credentials
DISCORD_CLIENT_ID = os.getenv("DISCORD_CLIENT_ID")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET")
DISCORD_REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI")
DISCORD_API_BASE_URL = "https://discord.com/api"

# Discord OAuth2 Login Route
@app.route('/api/login', methods=['GET'])
def login():
    discord_auth_url = (
        f"{DISCORD_API_BASE_URL}/oauth2/authorize"
        f"?client_id={DISCORD_CLIENT_ID}"
        f"&redirect_uri={DISCORD_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=identify+guilds+connections"
    )
    return redirect(discord_auth_url)


# Discord OAuth2 Callback Route
@app.route('/api/callback', methods=['GET'])
def callback():
    """Handle the OAuth2 callback from Discord."""
    code = request.args.get('code')
    if not code:
        return jsonify({"error": "Authorization code not provided"}), 400

    token_url = f"{DISCORD_API_BASE_URL}/oauth2/token"
    data = {
        "client_id": DISCORD_CLIENT_ID,
        "client_secret": DISCORD_CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": DISCORD_REDIRECT_URI,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    response = requests.post(token_url, data=data, headers=headers)

    if response.status_code != 200:
        print("Token exchange failed:", response.json())
        print("Response text:", response.text)  # use .text instead of .json()
        return redirect("http://localhost:3000/login?error=token_failed")

    token_data = response.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    # Store tokens in the session
    session["access_token"] = access_token
    session["refresh_token"] = refresh_token
    session.modified = True
    print("Session after setting:", dict(session))

    return redirect("http://127.0.0.1:3000/callback")


# Fetch Discord Servers
@app.route('/api/servers', methods=['GET'])
def get_servers():
    """Fetch the user's servers using their access token."""
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "User not logged in"}), 401

    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{DISCORD_API_BASE_URL}/users/@me/guilds?with_counts=true", headers=headers)

    if response.status_code != 200:
        print("Token exchange failed:", response.json())
        return jsonify({"error": "Failed to fetch servers"}), response.status_code

    servers = response.json()
    # Add owner field to each server
    for server in servers:
        server["owner"] = server.get("owner", False)
    
    return jsonify(servers)


# Fetch User Profile
@app.route('/api/profile', methods=['GET'])
def get_profile():
    """Fetch the user's profile and connections using their access token."""
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "User not logged in"}), 401

    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Fetch user profile
    user_response = requests.get(f"{DISCORD_API_BASE_URL}/v10/users/@me", headers=headers)
    if user_response.status_code != 200:
        return jsonify({"error": "Failed to fetch user profile"}), user_response.status_code
    
    user_data = user_response.json()
    
    # Fetch user connections
    connections_response = requests.get(f"{DISCORD_API_BASE_URL}/v10/users/@me/connections", headers=headers)
    if connections_response.status_code != 200:
        return jsonify({"error": "Failed to fetch connections"}), connections_response.status_code
    
    connections_data = connections_response.json()
    
    # Format response with avatar URL
    profile = {
        "username": user_data.get("username"),
        "discriminator": user_data.get("discriminator"),
        "avatar": f"https://cdn.discordapp.com/avatars/{user_data.get('id')}/{user_data.get('avatar')}.png" if user_data.get("avatar") else None,
        "connections": [{"type": conn.get("type"), "name": conn.get("name")} for conn in connections_data]
    }
    
    return jsonify(profile)


# Fetch Cryptocurrency Prices
@app.route('/api/crypto', methods=['GET'])
def get_crypto_prices():
    """Fetch crypto prices from CoinGecko with 60-second cache."""
    global crypto_cache
    current_time = time.time()
    
    # Return cached data if still valid (within 60 seconds)
    if crypto_cache["data"] is not None and (current_time - crypto_cache["timestamp"]) < 60:
        return jsonify(crypto_cache["data"])
    
    try:
        response = requests.get(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin&vs_currencies=usd"
        )
        response.raise_for_status()
        data = response.json()
        
        # Extract prices into simple format
        prices = {
            "bitcoin": int(data.get("bitcoin", {}).get("usd", 0)),
            "ethereum": int(data.get("ethereum", {}).get("usd", 0)),
            "solana": int(data.get("solana", {}).get("usd", 0))
        }
        
        # Update cache
        crypto_cache["data"] = prices
        crypto_cache["timestamp"] = current_time
        
        return jsonify(prices)
    except requests.exceptions.RequestException as e:
        return jsonify({"error": "Failed to fetch crypto prices"}), 500


# Fetch Resume Data
@app.route('/api/resume', methods=['GET'])
def get_resume():
    """Return resume data."""
    resume_data = {
        'name': 'Savaze Khattak',
        'email': 'savazework@gmail.com',
        'linkedin': 'https://www.linkedin.com/in/savaze-khattak/',
        'summary': (
            'Software Developer with a strong foundation in Python, Bash, and SQL, '
            'and hands-on experience in data engineering workflows and pipeline development. '
            'Experienced in integrating complex third-party APIs and building modular automation tools. '
            'Leverages AI-assisted development and LLM-driven workflows to '
            'accelerate software delivery and implement automated testing. '
            'Seeking to apply technical curiosity and data expertise to modernize '
            'legacy systems and drive operational efficiency.'
        ),
        'education': {
            'degree': 'BA in Computer Science',
            'institution': 'CUNY Queens College',
            'graduation_date': 'Jan 2026',
            'coursework': [
                'Database Systems', 'Data Structures', 'Data Modeling',
                'Design and Analysis of Algorithms', 'Computer Organization and Assembly Language',
                'Operating Systems Principles', 'Numerical Methods', 'Linear Algebra',
                'Probability and Statistics', 'Discrete Mathematics for Computer Science'
            ]
        },
        'skills': {
            'ai_automation': [
                'LLM Prompt Engineering', 'AI-Assisted Development',
                'Model Context Protocol (MCP)', 'AI-Based Test Driven Development (TDD)'
            ],
            'languages': [
                'Python (Advanced)', 'Bash/Shell Scripting', 'SQL (PostgreSQL/MySQL)',
                'JavaScript', 'TypeScript', 'Java', 'C++'
            ],
            'data_engineering': [
                'ETL Pipelines', 'Data Modeling', 'Data Validation',
                'Relational Databases', 'Normalization'
            ],
            'tools_devops': [
                'Git & GitHub', 'Docker', 'Linux/Bash', 'CI/CD Principles', 'Agile Methodology'
            ]
        },
        'certifications': [
            {
                'name': 'Introduction to Data Engineering',
                'issuer': 'IBM',
                'year': 2025
            },
            {
                'name': 'Data Engineering Career Guide and Interview Preparation',
                'issuer': 'IBM',
                'year': 2025
            }
        ],
        'experience': [
            {
                'position': 'Customer Growth Engineer',
                'company': 'Marjan NYC Inc.',
                'start_date': 'Apr 2020',
                'end_date': 'Present',
                'description': [
                    'Built and maintained web applications using Shopify Liquid, JavaScript, HTML, and CSS.',
                    'Integrated third-party platforms including Amazon, eBay, and TikTok Shop to synchronize inventory and order data.',
                    'Leveraged AI tools to help prototype new features and refactor code, improving development speed and reliability.',
                    'Redesigned application layouts and backend logic to improve usability, navigation, and site performance.',
                    'Translated business requirements into technical features to drive online sales and user engagement.'
                ]
            },
            {
                'position': 'Schedule Coordinator I',
                'company': 'MT Sinai FPA Access Center',
                'start_date': 'Mar 2024',
                'end_date': 'May 2024',
                'description': [
                    'Managed structured application data and performed data entry using Epic Health Systems.',
                    'Conducted data validation and consistency checks across records to support real-time system operations.',
                    'Collaborated with care teams to streamline scheduling workflows and optimize data entry efficiency.'
                ]
            }
        ],
        'projects': [
            {
                'name': 'European Car Manufacturer Data Modeling',
                'tools': ['ERwin', 'SQL', 'DBeaver', 'Docker', 'PostgreSQL', 'SQL Server', 'MySQL'],
                'description': [
                    'Collaborated with a team to design a robust relational database schema.',
                    'Created subject-area diagrams and fully qualified objects using consistent naming conventions.',
                    'Applied domain-based modeling and enforced constraints for data integrity.',
                    'Built audit table triggers and implemented temporal versioning across SQL Server, PostgreSQL, and MySQL.',
                    'Designed reusable views and inline table-valued functions for structured querying.'
                ]
            },
            {
                'name': 'Python Discord Bot',
                'tools': ['Python', 'Discord API', 'discord.py'],
                'description': [
                    'Developed a Python-based Discord bot utilizing asynchronous programming to manage concurrent user requests.',
                    'Engineered a FIFO queuing system to ensure ordered execution of media playback and stable task processing.',
                    'Integrated external REST APIs and built a modular command architecture for scalable feature deployment.',
                    'Implemented comprehensive error handling and automated logging to ensure 24/7 runtime stability.'
                ]
            }
        ]
    }
    return jsonify(resume_data)


# Fetch Bitcoin Price
@app.route('/api/bitcoin-price', methods=['GET'])
def get_bitcoin_price():
    """Fetch Bitcoin price using CoinGecko API."""
    try:
        response = requests.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd")
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


# Serve React Frontend
@app.route('/', defaults={'path': ''}, methods=['GET'])
@app.route('/<path:path>', methods=['GET'])
def serve_react(path):
    """Serve React frontend files."""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


# Check Authentication Route
@app.route('/api/check-auth', methods=['GET'])
def check_auth():
    """Check if the user is authenticated."""
    access_token = session.get("access_token")
    return jsonify({"authenticated": access_token is not None})


if __name__ == "__main__":
    app.run(debug=True, port=5000)