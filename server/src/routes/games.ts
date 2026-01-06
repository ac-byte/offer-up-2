import express from 'express'
import { GameManager } from '../services/GameManager'
import { GameStorage } from '../services/GameStorage'
import { ActionValidator } from '../services/ActionValidator'
import { SSEConnectionManager } from '../services/SSEConnectionManager'
import { GameStateBroadcaster } from '../services/GameStateBroadcaster'
import { 
  validateCreateGame,
  validateJoinGame,
  validateStartGame,
  validateGameAction,
  validateGameCode,
  validateSSEParams
} from '../middleware/validation'
import { 
  CreateGameRequest, 
  CreateGameResponse, 
  JoinGameRequest, 
  JoinGameResponse,
  StartGameRequest,
  StartGameResponse,
  GameStatusResponse,
  GameActionRequest,
  GameActionResponse
} from '../types'
import config from '../config'

const router = express.Router()

// Initialize services
const gameStorage = new GameStorage(config)
const gameManager = new GameManager(gameStorage)
const actionValidator = new ActionValidator()
const sseConnectionManager = new SSEConnectionManager()
const gameStateBroadcaster = new GameStateBroadcaster(sseConnectionManager)

/**
 * POST /api/games
 * Create a new game
 */
router.post('/', validateCreateGame, (req, res) => {
  try {
    const { hostName }: CreateGameRequest = req.body
    
    if (!hostName || hostName.trim().length === 0) {
      return res.status(400).json({ error: 'Host name is required' })
    }
    
    if (hostName.length > 20) {
      return res.status(400).json({ error: 'Host name too long (max 20 characters)' })
    }
    
    // Check if we've reached the maximum number of games
    const stats = gameManager.getStats()
    if (stats.activeGames >= config.maxGames) {
      return res.status(503).json({ error: 'Server is at capacity. Please try again later.' })
    }
    
    const result = gameManager.createGame(hostName.trim())
    
    const response: CreateGameResponse = {
      gameId: result.gameId,
      joinUrl: result.joinUrl,
      hostPlayerId: result.gameId // We'll need to get the actual host player ID
    }
    
    // Get the actual host player ID from the created game
    const game = gameManager.getGameById(result.gameId)
    if (game) {
      response.hostPlayerId = game.hostPlayerId
    }
    
    res.status(201).json(response)
  } catch (error) {
    console.error('Error creating game:', error)
    res.status(500).json({ error: 'Failed to create game' })
  }
})

/**
 * POST /api/games/:gameCode/join
 * Join an existing game
 */
router.post('/:gameCode/join', validateJoinGame, (req, res) => {
  try {
    const { gameCode } = req.params
    const { playerName }: JoinGameRequest = req.body
    
    if (!gameCode) {
      return res.status(400).json({ error: 'Game code is required' })
    }
    
    const result = gameManager.joinGame(gameCode.toUpperCase(), playerName)
    
    const response: JoinGameResponse = result
    
    if (result.success) {
      // Broadcast player joined event to other players
      const game = gameManager.getGameByCode(gameCode.toUpperCase())
      if (game && result.playerId) {
        const joinedPlayer = game.connectedPlayers.find(p => p.playerId === result.playerId)
        if (joinedPlayer) {
          gameStateBroadcaster.broadcastPlayerJoined(game.gameId, joinedPlayer)
        }
      }
      
      res.status(200).json(response)
    } else {
      res.status(400).json(response)
    }
  } catch (error) {
    console.error('Error joining game:', error)
    res.status(500).json({ error: 'Failed to join game' })
  }
})

/**
 * POST /api/games/:gameCode/start
 * Start a game (host only)
 */
router.post('/:gameCode/start', validateStartGame, (req, res) => {
  try {
    const { gameCode } = req.params
    const { hostPlayerId } = req.body // We'll get this from authentication later
    
    if (!gameCode) {
      return res.status(400).json({ error: 'Game code is required' })
    }
    
    if (!hostPlayerId) {
      return res.status(400).json({ error: 'Host player ID is required' })
    }
    
    const result = gameManager.startGame(gameCode.toUpperCase(), hostPlayerId)
    
    const response: StartGameResponse = result
    
    if (result.success) {
      // Broadcast game started event to all players
      const game = gameManager.getGameByCode(gameCode.toUpperCase())
      if (game) {
        gameStateBroadcaster.broadcastGameStarted(game.gameId)
        gameStateBroadcaster.broadcastGameState(game)
      }
      
      res.status(200).json(response)
    } else {
      res.status(400).json(response)
    }
  } catch (error) {
    console.error('Error starting game:', error)
    res.status(500).json({ error: 'Failed to start game' })
  }
})

/**
 * GET /api/games/:gameCode/status
 * Get game status
 */
router.get('/:gameCode/status', validateGameCode, (req, res) => {
  try {
    const { gameCode } = req.params
    
    if (!gameCode) {
      return res.status(400).json({ error: 'Game code is required' })
    }
    
    const game = gameManager.getGameByCode(gameCode.toUpperCase())
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    
    const response: GameStatusResponse = {
      gameId: game.gameId,
      status: game.status,
      playerCount: game.connectedPlayers.length,
      maxPlayers: config.maxPlayersPerGame,
      canJoin: game.status === 'lobby' && game.connectedPlayers.length < config.maxPlayersPerGame
    }
    
    res.status(200).json(response)
  } catch (error) {
    console.error('Error getting game status:', error)
    res.status(500).json({ error: 'Failed to get game status' })
  }
})

/**
 * GET /api/games/stats
 * Get server statistics (for monitoring)
 */
router.get('/stats', (req, res) => {
  try {
    const gameStats = gameManager.getStats()
    const connectionStats = gameStateBroadcaster.getConnectionStats()
    
    const stats = {
      ...gameStats,
      connections: connectionStats
    }
    
    res.status(200).json(stats)
  } catch (error) {
    console.error('Error getting stats:', error)
    res.status(500).json({ error: 'Failed to get stats' })
  }
})

/**
 * POST /api/games/:gameId/reconnect
 * Handle player reconnection
 */
router.post('/:gameId/reconnect', (req, res) => {
  try {
    const { gameId } = req.params
    const { playerId } = req.body
    
    if (!gameId || !playerId) {
      return res.status(400).json({ error: 'Game ID and player ID are required' })
    }
    
    const result = gameManager.handlePlayerReconnection(gameId, playerId)
    
    if (result.success) {
      // Update connection status for all players
      const game = gameManager.getGameById(gameId)
      if (game) {
        gameStateBroadcaster.updatePlayerConnectionStatus(game)
      }
      
      console.log(`🔌 Player ${playerId} reconnected to game ${gameId}`)
      res.status(200).json({ success: true })
    } else {
      res.status(400).json({ error: result.error })
    }
  } catch (error) {
    console.error('Error handling reconnection:', error)
    res.status(500).json({ error: 'Failed to handle reconnection' })
  }
})

/**
 * POST /api/games/:gameId/actions
 * Submit a player action
 */
router.post('/:gameId/actions', validateGameAction, (req, res) => {
  try {
    const { gameId } = req.params
    const { action, playerId }: GameActionRequest = req.body
    
    if (!gameId || !action || !playerId) {
      return res.status(400).json({ error: 'Game ID, action, and player ID are required' })
    }
    
    const game = gameManager.getGameById(gameId)
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    
    // Validate the action
    const validation = actionValidator.validateAction(game, playerId, action)
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }
    
    if (!validation.canExecute) {
      return res.status(403).json({ error: 'Action not allowed at this time' })
    }
    
    // Process the action using the game manager
    const result = gameManager.processAction(gameId, action, playerId)
    
    if (!result.success) {
      return res.status(400).json({ error: result.error })
    }
    
    console.log(`🎮 Player ${playerId} in game ${gameId} performed action:`, action.type)
    
    // Get updated game state and broadcast to all players
    const updatedGame = gameManager.getGameById(gameId)
    if (updatedGame) {
      gameStateBroadcaster.broadcastGameState(updatedGame)
    }
    
    const response: GameActionResponse = {
      success: true
    }
    
    res.status(200).json(response)
  } catch (error) {
    console.error('Error processing action:', error)
    res.status(500).json({ error: 'Failed to process action' })
  }
})

/**
 * GET /api/games/:gameId/events
 * Server-Sent Events stream for real-time updates
 */
router.get('/:gameId/events', validateSSEParams, (req, res) => {
  try {
    const { gameId } = req.params
    const { playerId } = req.query as { playerId: string }
    
    if (!gameId || !playerId) {
      return res.status(400).json({ error: 'Game ID and player ID are required' })
    }
    
    const game = gameManager.getGameById(gameId)
    if (!game) {
      return res.status(404).json({ error: 'Game not found' })
    }
    
    // Verify player is in the game
    const player = game.connectedPlayers.find(p => p.playerId === playerId)
    if (!player) {
      return res.status(403).json({ error: 'Player not in this game' })
    }
    
    // Set up Server-Sent Events headers
    const getAllowedOrigins = () => {
      const origins = []
      
      // Add CLIENT_URL if set
      if (config.clientUrl) {
        origins.push(config.clientUrl)
      }
      
      // Add localhost for development
      origins.push('http://localhost:3001')
      
      // Add production fallback if no CLIENT_URL is set
      if (!process.env.CLIENT_URL && process.env.NODE_ENV === 'production') {
        origins.push('https://offer-up-2-frontend-production.up.railway.app')
      }
      
      return origins
    }
    
    const allowedOrigins = getAllowedOrigins()
    const origin = req.headers.origin
    const allowedOrigin = allowedOrigins.includes(origin || '') ? origin : allowedOrigins[0]
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Credentials': 'true'
    })
    
    // Add connection to SSE manager with disconnection callback
    sseConnectionManager.addConnection(playerId, gameId, res, (disconnectedPlayerId, disconnectedGameId) => {
      // Handle player disconnection
      const disconnectionResult = gameManager.handlePlayerDisconnection(disconnectedGameId, disconnectedPlayerId)
      
      if (disconnectionResult.success) {
        console.log(`🔌 Player ${disconnectedPlayerId} disconnected from game ${disconnectedGameId}`)
        
        // If game ended due to disconnection, broadcast to remaining players
        if (disconnectionResult.gameEnded) {
          const updatedGame = gameManager.getGameById(disconnectedGameId)
          if (updatedGame) {
            gameStateBroadcaster.broadcastGameState(updatedGame)
          }
        } else {
          // Update connection status for remaining players
          const updatedGame = gameManager.getGameById(disconnectedGameId)
          if (updatedGame) {
            gameStateBroadcaster.updatePlayerConnectionStatus(updatedGame)
          }
        }
      }
    })
    
    // Send initial game state (filtered for this player)
    gameStateBroadcaster.broadcastGameState(game)
    
    // Update player connection status
    gameStateBroadcaster.updatePlayerConnectionStatus(game)
    
    console.log(`📡 Player ${playerId} connected to game ${gameId} events`)
    
  } catch (error) {
    console.error('Error setting up SSE:', error)
    res.status(500).json({ error: 'Failed to set up event stream' })
  }
})

export { router as gamesRouter, gameManager, gameStorage, sseConnectionManager, gameStateBroadcaster }