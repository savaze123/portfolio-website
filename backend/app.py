from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='build')
CORS(app, resources={r"/*": {"origins": "*"}})  # Adjust CORS as needed

# API route
@app.route('/api/resume', methods=['GET'])
def get_resume():
    resume_data = {
        'name': 'Savaze Khattak',
        'email': 'savazework@gmail.com',
        'phone': '+(929)-421-6655',
        'education': {
            'degree': 'Computer Science',
            'institution': 'CUNY Queens College',
            'graduation_date': '12/2024'
        },
        'skills': [
            'HTML', 'CSS', 'JavaScript', 'TypeScript', 'Java', 'SQL', 'C++',
            'Data Structures', 'Algorithms', 'Front-end and Back-end Development'
        ],
        'projects': [
            {
                'name': 'European Car Manufacturer Data Modeling',
                'tools': 'ERwin, SQL, DBeaver, Docker, PostgreSQL',
                'description': 'Executed as part of a collaborative team, focusing on database structure and data integrity.'
            },
            {
                'name': 'Python Discord Bot',
                'tools': 'Python, Discord API',
                'description': 'Developed with discord.py, implemented commands, error handling, and cloud deployment.'
            },
            {
                'name': 'Club Website',
                'tools': 'HTML, CSS, JavaScript',
                'description': 'Crafted a dynamic website and enhanced user engagement by 20%.'
            }
        ],
        'experience': [
            {
                'position': 'Junior Web Developer',
                'company': 'Marjan NycInc',
                'start_date': '05/2022',
                'end_date': 'Present',
                'description': 'Managed e-commerce website, customized Shopify apps, and developed front-end solutions.'
            }
        ]
    }
    return jsonify(resume_data)

# Serve React build files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
