import { MultiplayerGameState, GameStatus, Player, LobbyState, GamePhase } from '../types'
import { GameStorage } from './GameStorage'
import config from '../config'

/**
 * Game lifecycle management service
 * Handles game creation, joining, starting, and state transitions
 */
export class GameManager {
  constructor(private gameStorage: GameStorage) {}

  /**
   * Create a new game
   */
  createGame(hostName: string): { gameId: string; gameCode: string; joinUrl: string } {
    const { gameId, gameCode } = this.gameStorage.createGame(hostName)
    const joinUrl = `${config.clientUrl}/join?game=${gameCode}`
    
    return { gameId, gameCode, joinUrl }
  }

  /**
   * Join an existing game
   */
  joinGame(gameCode: string, playerName: string): { success: boolean; playerId?: string; error?: string; lobbyState?: LobbyState } {
    // Validate inputs
    if (!playerName || playerName.trim().length === 0) {
      return { success: false, error: 'Player name is required' }
    }
    
    if (playerName.length > 20) {
      return { success: false, error: 'Player name too long (max 20 characters)' }
    }
    
    const result = this.gameStorage.addPlayerToGame(gameCode, playerName.trim())
    
    if (!result.success) {
      return result
    }
    
    // Get updated lobby state
    const game = this.gameStorage.getGameByCode(gameCode)
    if (!game) {
      return { success: false, error: 'Game not found after joining' }
    }
    
    const lobbyState = this.getLobbyState(game, result.playerId!)
    
    return {
      success: true,
      playerId: result.playerId,
      lobbyState
    }
  }

  /**
   * Start a game (host only)
   */
  startGame(gameCode: string, hostPlayerId: string): { success: boolean; error?: string } {
    const game = this.gameStorage.getGameByCode(gameCode)
    
    if (!game) {
      return { success: false, error: 'Game not found' }
    }
    
    if (game.hostPlayerId !== hostPlayerId) {
      return { success: false, error: 'Only the host can start the game' }
    }
    
    if (game.status !== GameStatus.LOBBY) {
      return { success: false, error: 'Game has already started' }
    }
    
    if (game.connectedPlayers.length < config.minPlayersPerGame) {
      return { success: false, error: `Need at least ${config.minPlayersPerGame} players to start` }
    }
    
    // Initialize the game state for actual gameplay
    this.initializeGameplay(game)
    
    return { success: true }
  }

  /**
   * Get lobby state for a player
   */
  getLobbyState(game: MultiplayerGameState, playerId: string): LobbyState {
    return {
      gameId: game.gameId,
      players: game.connectedPlayers,
      isHost: game.hostPlayerId === playerId,
      canStart: game.connectedPlayers.length >= config.minPlayersPerGame,
      maxPlayers: config.maxPlayersPerGame,
      minPlayers: config.minPlayersPerGame
    }
  }

  /**
   * Get game by code
   */
  getGameByCode(gameCode: string): MultiplayerGameState | null {
    return this.gameStorage.getGameByCode(gameCode)
  }

  /**
   * Get game by ID
   */
  getGameById(gameId: string): MultiplayerGameState | null {
    return this.gameStorage.getGameById(gameId)
  }

  /**
   * Update game state
   */
  updateGame(gameId: string, gameState: MultiplayerGameState): boolean {
    return this.gameStorage.updateGame(gameId, gameState)
  }

  /**
   * Remove player from game
   */
  removePlayer(gameId: string, playerId: string): boolean {
    return this.gameStorage.removePlayerFromGame(gameId, playerId)
  }

  /**
   * Get server statistics
   */
  getStats() {
    return this.gameStorage.getStats()
  }

  /**
   * Initialize game state for actual gameplay
   */
  private initializeGameplay(game: MultiplayerGameState): void {
    // Convert connected players to game players
    const players: Player[] = game.connectedPlayers.map((connectedPlayer, index) => ({
      id: index,
      name: connectedPlayer.playerName,
      hand: [],
      offer: [],
      collection: [],
      points: 0,
      hasMoney: index === 0 // First player (host) starts with money
    }))

    // Update game state for gameplay
    game.players = players
    game.currentBuyerIndex = 0
    game.nextBuyerIndex = 1
    game.currentPhase = GamePhase.DEAL
    game.currentPlayerIndex = 0
    game.round = 1
    game.actionPhaseDoneStates = new Array(players.length).fill(false)
    game.selectedPerspective = 0
    game.phaseInstructions = 'Game starting! Deal cards to begin.'
    game.gameStarted = true
    game.status = GameStatus.PLAYING
    
    // Initialize empty card piles (will be populated by game logic)
    game.drawPile = []
    game.discardPile = []
    
    console.log(`🎮 Started game ${game.gameId} with ${players.length} players`)
  }
}