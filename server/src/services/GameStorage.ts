import { MultiplayerGameState, GameStatus, ConnectedPlayer, ServerConfig } from '../types'
import { generateGameCode } from '../utils/gameCodeGenerator'

/**
 * In-memory game storage service
 * Manages game instances, cleanup, and player connections
 */
export class GameStorage {
  private games = new Map<string, MultiplayerGameState>()
  private gameCodeToId = new Map<string, string>() // Map game codes to internal IDs
  private cleanupInterval: NodeJS.Timeout | null = null
  
  constructor(private config: ServerConfig) {
    this.startCleanupTimer()
  }

  /**
   * Create a new game with a unique code
   */
  createGame(hostName: string): { gameId: string; gameCode: string } {
    const gameCode = this.generateUniqueGameCode()
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const hostPlayerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const now = new Date()
    const hostPlayer: ConnectedPlayer = {
      playerId: hostPlayerId,
      playerName: hostName,
      connected: true,
      joinedAt: now,
      lastSeen: now
    }

    const gameState: MultiplayerGameState = {
      // Basic game state (will be properly initialized when game starts)
      players: [],
      currentBuyerIndex: 0,
      nextBuyerIndex: 0,
      currentPhase: 'buyer_assignment' as any,
      currentPlayerIndex: 0,
      round: 1,
      drawPile: [],
      discardPile: [],
      actionPhaseDoneStates: [],
      gotchaEffectState: null,
      flipOneEffectState: null,
      addOneEffectState: null,
      removeOneEffectState: null,
      removeTwoEffectState: null,
      stealAPointEffectState: null,
      
      // Offer Creation State
      offerCreationState: null,
      
      // UI State
      selectedPerspective: 0,
      phaseInstructions: '',
      autoFollowPerspective: true,
      
      // Previous Round Summary
      previousRoundSummary: null,
      
      // Game Status
      winner: null,
      gameStarted: false,
      
      // Multiplayer-specific state
      gameId,
      status: GameStatus.LOBBY,
      hostPlayerId,
      connectedPlayers: [hostPlayer],
      createdAt: now,
      lastActivity: now
    }

    this.games.set(gameId, gameState)
    this.gameCodeToId.set(gameCode, gameId)
    
    console.log(`🎮 Created game ${gameCode} (${gameId}) with host ${hostName}`)
    
    return { gameId, gameCode }
  }

  /**
   * Get a game by its code
   */
  getGameByCode(gameCode: string): MultiplayerGameState | null {
    const gameId = this.gameCodeToId.get(gameCode)
    if (!gameId) {
      return null
    }
    return this.games.get(gameId) || null
  }

  /**
   * Get a game by its ID
   */
  getGameById(gameId: string): MultiplayerGameState | null {
    return this.games.get(gameId) || null
  }

  /**
   * Get game code by game ID
   */
  getGameCodeById(gameId: string): string | null {
    for (const [gameCode, id] of this.gameCodeToId.entries()) {
      if (id === gameId) {
        return gameCode
      }
    }
    return null
  }

  /**
   * Update a game's state
   */
  updateGame(gameId: string, gameState: MultiplayerGameState): boolean {
    if (!this.games.has(gameId)) {
      return false
    }
    
    gameState.lastActivity = new Date()
    this.games.set(gameId, gameState)
    return true
  }

  /**
   * Add a player to a game
   */
  addPlayerToGame(gameCode: string, playerName: string): { success: boolean; playerId?: string; error?: string } {
    const game = this.getGameByCode(gameCode)
    
    if (!game) {
      return { success: false, error: 'Game not found' }
    }
    
    if (game.status !== GameStatus.LOBBY) {
      return { success: false, error: 'Game has already started' }
    }
    
    if (game.connectedPlayers.length >= this.config.maxPlayersPerGame) {
      return { success: false, error: 'Game is full' }
    }
    
    // Check if player name is already taken
    if (game.connectedPlayers.some(p => p.playerName === playerName)) {
      return { success: false, error: 'Player name already taken' }
    }
    
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    
    const newPlayer: ConnectedPlayer = {
      playerId,
      playerName,
      connected: true,
      joinedAt: now,
      lastSeen: now
    }
    
    game.connectedPlayers.push(newPlayer)
    game.lastActivity = now
    
    console.log(`👤 Player ${playerName} joined game ${gameCode}`)
    
    return { success: true, playerId }
  }

  /**
   * Remove a player from a game
   */
  removePlayerFromGame(gameId: string, playerId: string): boolean {
    const game = this.getGameById(gameId)
    if (!game) {
      return false
    }
    
    const playerIndex = game.connectedPlayers.findIndex(p => p.playerId === playerId)
    if (playerIndex === -1) {
      return false
    }
    
    const player = game.connectedPlayers[playerIndex]
    game.connectedPlayers.splice(playerIndex, 1)
    game.lastActivity = new Date()
    
    console.log(`👤 Player ${player.playerName} left game ${gameId}`)
    
    // If host left and game is in lobby, mark as abandoned
    if (game.hostPlayerId === playerId && game.status === GameStatus.LOBBY) {
      game.status = GameStatus.ABANDONED
    }
    
    // If too few players remain during gameplay, mark as abandoned
    if (game.status === GameStatus.PLAYING && game.connectedPlayers.length < this.config.minPlayersPerGame) {
      game.status = GameStatus.ABANDONED
    }
    
    return true
  }

  /**
   * Get all active games (for debugging/monitoring)
   */
  getAllGames(): MultiplayerGameState[] {
    return Array.from(this.games.values())
  }

  /**
   * Get game statistics
   */
  getStats(): { totalGames: number; activeGames: number; playersOnline: number } {
    const allGames = this.getAllGames()
    const activeGames = allGames.filter(g => g.status === GameStatus.LOBBY || g.status === GameStatus.PLAYING)
    const playersOnline = activeGames.reduce((total, game) => total + game.connectedPlayers.length, 0)
    
    return {
      totalGames: allGames.length,
      activeGames: activeGames.length,
      playersOnline
    }
  }

  /**
   * Clean up old/abandoned games
   */
  private cleanup(): void {
    const now = new Date()
    const cutoffTime = now.getTime() - (60 * 60 * 1000) // 1 hour ago
    
    let cleanedCount = 0
    
    for (const [gameId, game] of this.games.entries()) {
      const shouldCleanup = 
        game.status === GameStatus.FINISHED ||
        game.status === GameStatus.ABANDONED ||
        game.lastActivity.getTime() < cutoffTime
      
      if (shouldCleanup) {
        // Find and remove the game code mapping
        for (const [code, id] of this.gameCodeToId.entries()) {
          if (id === gameId) {
            this.gameCodeToId.delete(code)
            break
          }
        }
        
        this.games.delete(gameId)
        cleanedCount++
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old games`)
    }
  }

  /**
   * Generate a unique game code that doesn't conflict with existing games
   */
  private generateUniqueGameCode(): string {
    let attempts = 0
    const maxAttempts = 100
    
    while (attempts < maxAttempts) {
      const code = generateGameCode()
      if (!this.gameCodeToId.has(code)) {
        return code
      }
      attempts++
    }
    
    throw new Error('Unable to generate unique game code after maximum attempts')
  }

  /**
   * Start the cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.gameCleanupInterval)
  }

  /**
   * Stop the cleanup timer (for graceful shutdown)
   */
  public stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }
}