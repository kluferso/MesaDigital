from flask import Flask, send_from_directory, request, Response
from dotenv import load_dotenv
import os
import requests
from flask_cors import CORS
from flask_socketio import SocketIO

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__, static_folder='../build', static_url_path='/')
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")

# Node.js server URL
NODE_SERVER = 'http://localhost:5000'

# Proxy API requests to Node.js server
@app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_api(path):
    url = f'{NODE_SERVER}/api/{path}'
    
    # Forward the request to the Node.js server
    resp = requests.request(
        method=request.method,
        url=url,
        headers={key: value for (key, value) in request.headers if key != 'Host'},
        data=request.get_data(),
        cookies=request.cookies,
        allow_redirects=False
    )

    # Create Flask Response object
    excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
    headers = [(name, value) for (name, value) in resp.raw.headers.items()
               if name.lower() not in excluded_headers]

    response = Response(resp.content, resp.status_code, headers)
    return response

# Serve static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Use a different port for Flask
    socketio.run(app, debug=True, port=3000)
