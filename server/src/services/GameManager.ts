import { MultiplayerGameState, GameStatus, Player, LobbyState, GamePhase, GameAction } from '../types'
import { GameStorage } from './GameStorage'
import { gameReducer, initializeMultiplayerGame } from '../game-logic/gameReducer'
import { shuffleArray } from '../game-logic/cards'
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
   * Process a game action
   */
  processAction(gameId: string, action: GameAction, playerId: string): { success: boolean; error?: string } {
    const game = this.getGameById(gameId)
    
    if (!game) {
      return { success: false, error: 'Game not found' }
    }
    
    if (game.status !== GameStatus.PLAYING) {
      return { success: false, error: 'Game is not in playing state' }
    }
    
    // Validate that the player is in the game
    const playerExists = game.connectedPlayers.some(p => p.playerId === playerId)
    if (!playerExists) {
      return { success: false, error: 'Player not in game' }
    }
    
    try {
      // Process the action using the game reducer
      const newGameState = gameReducer(game, action)
      
      // Merge the updated game state back into the multiplayer game state
      Object.assign(game, newGameState)
      
      // Update the game in storage
      this.updateGame(gameId, game)
      
      return { success: true }
    } catch (error) {
      console.error('Error processing game action:', error)
      return { success: false, error: 'Failed to process action' }
    }
  }

  /**
   * Handle player disconnection
   */
  handlePlayerDisconnection(gameId: string, playerId: string): { success: boolean; gameEnded?: boolean; error?: string } {
    const game = this.getGameById(gameId)
    
    if (!game) {
      return { success: false, error: 'Game not found' }
    }
    
    // Update player connection status
    const player = game.connectedPlayers.find(p => p.playerId === playerId)
    if (player) {
      player.connected = false
      player.lastSeen = new Date()
    }
    
    // Check if game should continue
    const connectedPlayers = game.connectedPlayers.filter(p => p.connected)
    
    if (game.status === 'lobby') {
      // In lobby, just remove the player
      game.connectedPlayers = game.connectedPlayers.filter(p => p.playerId !== playerId)
      
      // If host disconnected, assign new host
      if (game.hostPlayerId === playerId && game.connectedPlayers.length > 0) {
        game.hostPlayerId = game.connectedPlayers[0].playerId
      }
      
      // If no players left, mark game as abandoned
      if (game.connectedPlayers.length === 0) {
        game.status = GameStatus.ABANDONED
        return { success: true, gameEnded: true }
      }
      
      return { success: true }
    }
    
    if (game.status === 'playing') {
      // Check if we have enough players to continue
      if (connectedPlayers.length < config.minPlayersPerGame) {
        // Not enough players, end the game
        game.status = GameStatus.ABANDONED
        game.winner = null // No winner due to disconnections
        return { success: true, gameEnded: true }
      }
      
      // Game can continue with remaining players
      // Mark disconnected player as "done" in action phase to prevent blocking
      if (game.currentPhase === GamePhase.ACTION_PHASE) {
        const gamePlayerIndex = game.players?.findIndex(p => p.id.toString() === playerId)
        if (gamePlayerIndex !== -1 && game.actionPhaseDoneStates) {
          game.actionPhaseDoneStates[gamePlayerIndex] = true
        }
      }
      
      return { success: true }
    }
    
    return { success: true }
  }

  /**
   * Handle player reconnection
   */
  handlePlayerReconnection(gameId: string, playerId: string): { success: boolean; error?: string } {
    const game = this.getGameById(gameId)
    
    if (!game) {
      return { success: false, error: 'Game not found' }
    }
    
    // Update player connection status
    const player = game.connectedPlayers.find(p => p.playerId === playerId)
    if (player) {
      player.connected = true
      player.lastSeen = new Date()
      return { success: true }
    }
    
    return { success: false, error: 'Player not found in game' }
  }

  /**
   * Check for stale games and clean them up
   */
  cleanupStaleGames(): number {
    const now = new Date()
    const staleThreshold = 30 * 60 * 1000 // 30 minutes
    let cleanedCount = 0
    
    const allGames = this.gameStorage.getAllGames()
    
    for (const game of allGames) {
      const timeSinceActivity = now.getTime() - game.lastActivity.getTime()
      
      if (timeSinceActivity > staleThreshold) {
        // Mark game as abandoned
        game.status = GameStatus.ABANDONED
        this.gameStorage.updateGame(game.gameId, game)
        cleanedCount++
      }
    }
    
    return cleanedCount
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
    // Get player names from connected players
    const playerNames = game.connectedPlayers.map(p => p.playerName)
    
    // Initialize the game state using the game reducer
    const initialGameState = initializeMultiplayerGame(playerNames)
    
    // Copy the initialized state to the multiplayer game
    Object.assign(game, initialGameState)
    
    // Set multiplayer-specific properties
    game.status = GameStatus.PLAYING
    
    // Create mapping between multiplayer player IDs and game player indices
    // The game players are created in the same order as connectedPlayers
    game.connectedPlayers.forEach((connectedPlayer, index) => {
      // Store the game player index in the connected player object
      connectedPlayer.gamePlayerIndex = index
    })
    
    // Automatically advance through buyer assignment and deal phases
    // This matches the client-side behavior in START_GAME action
    if (game.currentPhase === GamePhase.BUYER_ASSIGNMENT) {
      // Advance to DEAL phase
      game.currentPhase = GamePhase.DEAL
      
      // Then advance to OFFER_PHASE (deal phase auto-advances)
      game.currentPhase = GamePhase.OFFER_PHASE
      
      // Deal cards to all players (bring hands to 5 cards)
      this.dealCardsToPlayers(game)
    }
    
    console.log(`🎮 Started game ${game.gameId} with ${playerNames.length} players`)
  }

  /**
   * Deal cards to bring all players' hands to exactly 5 cards
   */
  private dealCardsToPlayers(game: MultiplayerGameState): void {
    // Calculate how many cards each player needs
    const playersNeedingCards = game.players.map((player, index) => ({
      playerIndex: index,
      cardsNeeded: Math.max(0, 5 - player.hand.length)
    })).filter(p => p.cardsNeeded > 0)

    // Deal cards sequentially (one card per player per round)
    let maxCardsNeeded = Math.max(...playersNeedingCards.map(p => p.cardsNeeded), 0)
    
    for (let round = 0; round < maxCardsNeeded; round++) {
      for (const playerInfo of playersNeedingCards) {
        const { playerIndex, cardsNeeded } = playerInfo
        
        // Skip if this player already has enough cards
        if (round >= cardsNeeded) {
          continue
        }

        // Check if we need to reshuffle
        if (game.drawPile.length === 0) {
          if (game.discardPile.length === 0) {
            // No more cards available - stop dealing
            break
          }
          
          // Reshuffle discard pile into draw pile
          game.drawPile = shuffleArray(game.discardPile)
          game.discardPile = []
        }

        // Deal one card to this player
        if (game.drawPile.length > 0) {
          const card = game.drawPile.shift()! // Take from beginning of array
          game.players[playerIndex].hand.push(card)
        }
      }
    }
  }
}