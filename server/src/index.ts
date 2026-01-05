import express from 'express'
import cors from 'cors'
import { gamesRouter, gameManager } from './routes/games'
import config from './config'

const app = express()
const PORT = config.port

// Middleware
app.use(cors({
  origin: [
    'https://offer-up-2-frontend-production.up.railway.app',
    'http://localhost:3001'
  ],
  credentials: true
}))
app.use(express.json())

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    config: {
      maxGames: config.maxGames,
      maxPlayersPerGame: config.maxPlayersPerGame,
      minPlayersPerGame: config.minPlayersPerGame
    }
  })
})

// Game management routes
app.use('/api/games', gamesRouter)

// Basic error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Start periodic cleanup job for stale games
const cleanupInterval = setInterval(() => {
  const cleanedCount = gameManager.cleanupStaleGames()
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} stale games`)
  }
}, 5 * 60 * 1000) // Run every 5 minutes

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully')
  clearInterval(cleanupInterval)
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully')
  clearInterval(cleanupInterval)
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`🚀 Offer Up server running on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🎮 Game API: http://localhost:${PORT}/api/games`)
  console.log(`🌐 Client URL: ${config.clientUrl}`)
  console.log(`🧹 Cleanup job running every 5 minutes`)
})