# MesaDigital - Real-time Music Collaboration Platform

MesaDigital is a web-based platform that enables musicians to collaborate remotely through video, audio, and chat features. Musicians can create or join virtual rooms where they can perform music together with low latency communication.

## Features

- Real-time video and audio streaming
- Multiple input support (camera, microphone, and instrument)
- Professional audio mixer with individual channel controls
- Real-time chat with participant status
- Room creation and management
- Device selection and configuration
- Modern and responsive UI

## Technical Stack

- **Frontend**: React.js with Material-UI
- **Backend**: Node.js with Socket.io
- **Media Streaming**: WebRTC
- **State Management**: React Hooks
- **Styling**: Material-UI theming and styled-components

## Prerequisites

- Node.js 14.0 or later
- npm or yarn
- Modern web browser with WebRTC support
- Audio/Video input devices

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd mesa-digital
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This will start both the backend server (port 5000) and the frontend development server (port 3000).

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Enter your name, select your instrument, and choose your media devices
3. Create a new room or join an existing one using a room ID
4. Share the room ID with other musicians to collaborate

## Features Details

### Video/Audio Streaming
- Support for multiple video and audio inputs
- Device selection for camera, microphone, and instrument
- Quality control and network status monitoring

### Audio Mixer
- Individual volume controls
- Pan controls
- Mute/unmute capabilities
- VU meters
- EQ controls (coming soon)

### Chat
- Real-time messaging
- Participant status
- Message history
- System notifications

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Deployment on PythonAnywhere

1. Create a PythonAnywhere account at https://www.pythonanywhere.com
2. Upload the project:
   ```bash
   # Clone the repository in your PythonAnywhere home directory
   cd ~
   git clone https://github.com/kluferso/MesaDigital.git
   ```

3. Create a virtual environment and install dependencies:
   ```bash
   # Navigate to project directory
   cd ~/MesaDigital
   
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Try installing dependencies (will try both possible locations)
   pip install -r requirements.txt || pip install -r server/requirements.txt
   
   # Verify installation was successful
   python -c "import flask; print('Flask installed successfully!')"
   ```

4. Configure Web App on PythonAnywhere:
   - Go to Web tab
   - Add a new web app
   - Choose Manual Configuration
   - Select Python version (3.8 or later)
   - Set source code directory: /home/kluferso/MesaDigital
   - Set working directory: /home/kluferso/MesaDigital/server
   - In the "Code" section, set WSGI configuration file path to: /home/kluferso/MesaDigital/server/wsgi.py

5. Set up environment variables in PythonAnywhere:
   - Go to the Files tab
   - Create a .env file in the server directory
   - Add your environment variables

6. Reload the web app

## GitHub Configuration

1. Create a new repository on GitHub

2. Push the code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/kluferso/MesaDigital.git
   git push -u origin main
   ```

3. For updates:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and Material-UI
- WebRTC for real-time communication
- Socket.io for signaling and data exchange
