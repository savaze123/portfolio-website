import os
import requests
from flask import Flask, jsonify, redirect, request, session, send_from_directory
from flask_cors import CORS
from flask_session import Session

# Initialize Flask app
app = Flask(__name__, static_folder="frontend/build")
app.secret_key = os.getenv("SECRET_KEY", "supersecretkey")

# Configure Flask-Session
app.config["SESSION_TYPE"] = "filesystem"  # Store session data in the filesystem
app.config["SESSION_PERMANENT"] = False    # Make sessions temporary
app.config["SESSION_USE_SIGNER"] = True    # Sign session cookies for security
Session(app)

# Enable CORS
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=False)

# Discord API credentials
DISCORD_CLIENT_ID = "1312997218659340288"
DISCORD_CLIENT_SECRET = "xpkrUqI75cNy_NRrBp0NsdqRHMRuZ7On"
DISCORD_REDIRECT_URI = "http://127.0.0.1:5000/api/callback"
DISCORD_API_BASE_URL = "https://discord.com/api"

# Discord OAuth2 Login Route
@app.route('/api/login', methods=['GET'])
def login():
    discord_auth_url = (
        f"{DISCORD_API_BASE_URL}/oauth2/authorize"
        f"?client_id={DISCORD_CLIENT_ID}"
        f"&redirect_uri={DISCORD_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=identify guilds"
    )
    return redirect(discord_auth_url)


# Discord OAuth2 Callback Route
@app.route('/api/callback', methods=['GET'])
def callback():
    """Handle the OAuth2 callback from Discord."""
    code = request.args.get('code')
    if not code:
        return jsonify({"error": "Authorization code not provided"}), 400

    # Exchange the authorization code for an access token
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
        return jsonify({"error": "Failed to fetch access token"}), response.status_code

    token_data = response.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")

    # Store tokens in the session
    session["access_token"] = access_token
    session["refresh_token"] = refresh_token

    return redirect("http://localhost:3000/servers")  # Redirect to your React frontend


# Fetch Discord Servers
@app.route('/api/servers', methods=['GET'])
def get_servers():
    """Fetch the user's servers using their access token."""
    access_token = session.get("access_token")
    if not access_token:
        return jsonify({"error": "User not logged in"}), 401

    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{DISCORD_API_BASE_URL}/users/@me/guilds", headers=headers)

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch servers"}), response.status_code

    return jsonify(response.json())


# Fetch Resume Data
@app.route('/api/resume', methods=['GET'])
def get_resume():
    """Return resume data."""
    resume_data = {
        'name': 'Savaze Khattak',
        'email': 'savazework@gmail.com',
        'phone': '+(929)-421-6655',
        'education': {
            'degree': 'Computer Science',
            'institution': 'CUNY Queens College',
            'graduation_date': '12/2024',
        },
        'skills': [
            'HTML', 'CSS', 'JavaScript', 'TypeScript', 'Java', 'SQL', 'C++',
            'Data Structures', 'Algorithms', 'Front-end and Back-end Development',
        ],
        'projects': [
            {
                'name': 'European Car Manufacturer Data Modeling',
                'tools': 'ERwin, SQL, DBeaver, Docker, PostgreSQL',
                'description': 'Executed as part of a collaborative team, focusing on database structure and data integrity.',
            },
            {
                'name': 'Python Discord Bot',
                'tools': 'Python, Discord API',
                'description': 'Developed with discord.py, implemented commands, error handling, and cloud deployment.',
            },
            {
                'name': 'Club Website',
                'tools': 'HTML, CSS, JavaScript',
                'description': 'Crafted a dynamic website and enhanced user engagement by 20%.',
            },
        ],
        'experience': [
            {
                'position': 'Junior Web Developer',
                'company': 'Marjan NycInc',
                'start_date': '05/2022',
                'end_date': 'Present',
                'description': 'Managed e-commerce website, customized Shopify apps, and developed front-end solutions.',
            },
        ],
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
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React frontend files."""
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


if __name__ == "__main__":
    app.run(debug=True, port=5000)
