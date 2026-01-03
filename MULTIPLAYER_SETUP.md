# Multiplayer Development Setup

This document explains how to set up and run the multiplayer version of Offer Up.

## Prerequisites

- Node.js (v16 or higher)
- npm

## Quick Start

1. **Install dependencies for both client and server:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Run both servers concurrently:**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:3000
   - Frontend client on http://localhost:3001

## Manual Setup (Alternative)

If you prefer to run servers separately:

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```

2. **In a new terminal, start the frontend:**
   ```bash
   npm run client:dev
   ```

## How to Play Multiplayer

1. Open http://localhost:3001 in your browser
2. Click "Create Online Game"
3. Enter your name and create the game
4. Share the game code or URL with friends
5. Friends can join by:
   - Using the join URL directly
   - Going to the homepage and clicking "Join Online Game"
   - Entering the 6-character game code

## Testing with Multiple Players

To test locally with multiple players:

1. Open multiple browser tabs or different browsers
2. Use incognito/private browsing mode for additional players
3. Create a game in one tab, join from others

## Architecture

- **Backend**: Node.js/Express server with TypeScript
- **Frontend**: React with TypeScript
- **Real-time Communication**: Server-Sent Events (SSE)
- **Storage**: In-memory (suitable for development and small-scale deployment)

## Configuration

### Server Configuration
- Port: 3000 (configurable via PORT environment variable)
- Max Games: 10 (configurable via MAX_GAMES environment variable)
- Max Players per Game: 6
- Min Players per Game: 3

### Client Configuration
- Port: 3001
- Proxy: Configured to proxy API requests to backend on port 3000

## Troubleshooting

### Port Conflicts
If you get port conflicts:
- Backend: Set `PORT=3001` environment variable
- Frontend: Set `PORT=3002` environment variable

### Connection Issues
- Ensure both servers are running
- Check that the proxy configuration in package.json points to the correct backend port
- Verify firewall settings allow connections on the specified ports

### Browser Compatibility
- Server-Sent Events are supported in all modern browsers
- For older browsers, consider using a polyfill

## Production Deployment

For production deployment:

1. **Build both client and server:**
   ```bash
   npm run build:all
   ```

2. **Set environment variables:**
   ```bash
   export PORT=3000
   export CLIENT_URL=https://your-domain.com
   export MAX_GAMES=50
   ```

3. **Start the server:**
   ```bash
   cd server && npm start
   ```

4. **Serve the client build** using a web server like nginx or serve the build folder statically.