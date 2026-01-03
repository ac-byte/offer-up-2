import express from 'express'
import cors from 'cors'
import { gamesRouter } from './routes/games'
import config from './config'

const app = express()
const PORT = config.port

// Middleware
app.use(cors({
  origin: config.clientUrl,
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

app.listen(PORT, () => {
  console.log(`🚀 Offer Up server running on port ${PORT}`)
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`)
  console.log(`🎮 Game API: http://localhost:${PORT}/api/games`)
  console.log(`🌐 Client URL: ${config.clientUrl}`)
})