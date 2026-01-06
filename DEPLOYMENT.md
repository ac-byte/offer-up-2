# Deployment Guide

This guide explains how to deploy the trading card game to different hosting platforms.

## Environment Variables

### Frontend Environment Variables

Set these in your frontend hosting service:

- `REACT_APP_SERVER_URL` - The base URL of your backend server (without `/api`)
  - Example: `https://your-backend.herokuapp.com`
  - If not set, will auto-detect or use localhost for development

### Backend Environment Variables

Set these in your backend hosting service:

- `CLIENT_URL` - The URL of your frontend application
  - Example: `https://your-frontend.netlify.app`
  - Used for CORS and generating join URLs
  - If not set, defaults to `http://localhost:3001`

- `PORT` - The port your server should listen on (usually set automatically by hosting platforms)

## Platform-Specific Setup

### Railway

**Frontend Service:**
- Root Directory: `/`
- Build Command: `npm run build`
- Start Command: `npx serve -s build -p $PORT`
- Environment Variables:
  - `CI=false`
  - `REACT_APP_SERVER_URL=https://your-backend-service.railway.app`

**Backend Service:**
- Root Directory: `/server`
- Build Command: `npm run build`
- Start Command: `npm start`
- Environment Variables:
  - `CLIENT_URL=https://your-frontend-service.railway.app`

### Render

**Frontend (Static Site):**
- Build Command: `npm run build`
- Publish Directory: `build`
- Environment Variables:
  - `REACT_APP_SERVER_URL=https://your-backend.onrender.com`
  - `DANGEROUSLY_DISABLE_HOST_CHECK=true` (fixes "Invalid Host header" error)

**Backend (Web Service):**
- Root Directory: `server`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment Variables:
  - `CLIENT_URL=https://your-frontend.onrender.com`

**Important for Render:**
- Frontend: Use Static Site service type, not Web Service
- Backend: Make sure "Root Directory" is set to `server`
- The "Invalid Host header" error is fixed by the DANGEROUSLY_DISABLE_HOST_CHECK variable

### Netlify + Heroku

**Netlify (Frontend):**
- Build Command: `npm run build`
- Publish Directory: `build`
- Environment Variables:
  - `REACT_APP_SERVER_URL=https://your-app.herokuapp.com`

**Heroku (Backend):**
- Root Directory: `server`
- Environment Variables:
  - `CLIENT_URL=https://your-app.netlify.app`

### DigitalOcean Droplet

1. Set up Node.js on your droplet
2. Clone the repository
3. Set environment variables in a `.env` file or system environment
4. Use PM2 or similar to manage the processes
5. Set up nginx as a reverse proxy

## Local Development

For local development, no environment variables are needed. The app will automatically use:
- Frontend: `http://localhost:3001`
- Backend: `http://localhost:3000`

## Testing Your Deployment

1. **Frontend loads**: Visit your frontend URL
2. **Backend health**: Visit `https://your-backend-url/api/health`
3. **Create game**: Try creating an online game
4. **Join URL**: Check that the join URL is correct (no double slashes)
5. **Multiplayer**: Test with multiple browser tabs/devices