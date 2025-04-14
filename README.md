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

2. Open a Bash console in PythonAnywhere and clone the repository:
   ```bash
   cd ~
   git clone https://github.com/kluferso/MesaDigital.git
   ```

3. Install Node.js:
   ```bash
   # Install Node Version Manager (nvm)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   
   # Install Node.js
   nvm install 14
   nvm use 14
   ```

4. Install project dependencies:
   ```bash
   cd ~/MesaDigital
   npm install
   
   cd server
   npm install
   ```

5. Build the React app:
   ```bash
   cd ~/MesaDigital
   npm run build
   ```

6. Configure your PythonAnywhere web app:
   - Go to the Web tab
   - Add a new web app
   - Choose Manual Configuration
   - Select Python 3.8
   - Set the following paths:
     - Source code: /home/$USERNAME/MesaDigital
     - Working directory: /home/$USERNAME/MesaDigital/server
     - WSGI configuration file: /home/$USERNAME/MesaDigital/server/wsgi.py

7. Configure static files:
   - Add a new static files mapping:
     - URL: /static/
     - Directory: /home/$USERNAME/MesaDigital/build/

8. Update WSGI configuration:
   - Click on the WSGI configuration file link
   - Replace the contents with the code from `server/wsgi.py`
   - Save the file

9. Start the web app:
   - Click the green "Reload" button
   - Your app should now be available at: http://$USERNAME.pythonanywhere.com

## Automated Deployment with GitHub Actions

MesaDigital now supports automated deployments to PythonAnywhere using GitHub Actions:

1. Configure GitHub Secrets:
   - Go to your GitHub repository Settings > Secrets and Variables > Actions
   - Add the following secrets:
     - `PYTHONANYWHERE_API_TOKEN`: Your PythonAnywhere API token
     - `PYTHONANYWHERE_USERNAME`: Your PythonAnywhere username

2. Push to main branch:
   - Any push to the main branch will automatically trigger a deployment
   - The GitHub Action will:
     - Pull the latest code from GitHub
     - Install any new dependencies
     - Reload the PythonAnywhere web app

3. Monitor deployments:
   - Check deployment status in the Actions tab of your GitHub repository
   - Detailed logs are available for each deployment run

This automated deployment ensures your MesaDigital application is always up-to-date with the latest features and improvements.

## Troubleshooting PythonAnywhere Deployment

1. Check the error logs:
   - Go to the Web tab
   - Click on the "Error log" link
   - Look for any error messages

2. Common issues:
   - If the Node.js server doesn't start, check the "Server log" file
   - If static files aren't loading, verify the paths in the Static Files section
   - If you get CORS errors, check the allowed hosts in `server/index.js`

3. Updating the deployment:
   ```bash
   cd ~/MesaDigital
   git pull
   npm install
   npm run build
   ```
   Then reload the web app from the Web tab.

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
