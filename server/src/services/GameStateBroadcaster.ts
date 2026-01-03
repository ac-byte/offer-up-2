import { MultiplayerGameState, ServerSentEvent, PlayerJoinedEvent, PlayerLeftEvent, GameStartedEvent, GameEndedEvent, ConnectedPlayer } from '../types'
import { SSEConnectionManager } from './SSEConnectionManager'

/**
 * Handles broadcasting game state changes to all connected players
 */
export class GameStateBroadcaster {
  constructor(private sseManager: SSEConnectionManager) {}

  /**
   * Broadcast game state update to all players in the game
   */
  broadcastGameState(gameState: MultiplayerGameState): void {
    const sentCount = this.sseManager.sendGameStateUpdate(gameState)
    console.log(`📡 Broadcasted game state update to ${sentCount} players in game ${gameState.gameId}`)
  }

  /**
   * Broadcast player joined event
   */
  broadcastPlayerJoined(gameId: string, player: ConnectedPlayer): void {
    const event: PlayerJoinedEvent = {
      type: 'player-joined',
      player,
      timestamp: new Date().toISOString()
    }
    
    const sentCount = this.sseManager.sendToGame(gameId, event)
    console.log(`📡 Broadcasted player joined (${player.playerName}) to ${sentCount} players in game ${gameId}`)
  }

  /**
   * Broadcast player left event
   */
  broadcastPlayerLeft(gameId: string, playerId: string, playerName: string): void {
    const event: PlayerLeftEvent = {
      type: 'player-left',
      playerId,
      playerName,
      timestamp: new Date().toISOString()
    }
    
    const sentCount = this.sseManager.sendToGame(gameId, event)
    console.log(`📡 Broadcasted player left (${playerName}) to ${sentCount} players in game ${gameId}`)
  }

  /**
   * Broadcast game started event
   */
  broadcastGameStarted(gameId: string): void {
    const event: GameStartedEvent = {
      type: 'game-started',
      timestamp: new Date().toISOString()
    }
    
    const sentCount = this.sseManager.sendToGame(gameId, event)
    console.log(`📡 Broadcasted game started to ${sentCount} players in game ${gameId}`)
  }

  /**
   * Broadcast game ended event
   */
  broadcastGameEnded(gameId: string, winner?: any, reason: 'completed' | 'abandoned' | 'disconnections' = 'completed'): void {
    const event: GameEndedEvent = {
      type: 'game-ended',
      winner,
      reason,
      timestamp: new Date().toISOString()
    }
    
    const sentCount = this.sseManager.sendToGame(gameId, event)
    console.log(`📡 Broadcasted game ended (${reason}) to ${sentCount} players in game ${gameId}`)
  }

  /**
   * Send custom event to specific player
   */
  sendToPlayer(playerId: string, gameId: string, event: ServerSentEvent): boolean {
    return this.sseManager.sendToPlayer(playerId, gameId, event)
  }

  /**
   * Send custom event to all players in a game
   */
  sendToGame(gameId: string, event: ServerSentEvent): number {
    return this.sseManager.sendToGame(gameId, event)
  }

  /**
   * Update player connection status and broadcast if needed
   */
  updatePlayerConnectionStatus(gameState: MultiplayerGameState): void {
    const connectedPlayerIds = this.sseManager.getConnectedPlayersForGame(gameState.gameId)
    let stateChanged = false
    
    // Update connection status for all players
    for (const player of gameState.connectedPlayers) {
      const wasConnected = player.connected
      const isConnected = connectedPlayerIds.includes(player.playerId)
      
      if (wasConnected !== isConnected) {
        player.connected = isConnected
        player.lastSeen = new Date()
        stateChanged = true
        
        if (!isConnected) {
          console.log(`🔌 Player ${player.playerName} disconnected from game ${gameState.gameId}`)
        } else {
          console.log(`🔌 Player ${player.playerName} reconnected to game ${gameState.gameId}`)
        }
      }
    }
    
    // Broadcast updated state if connections changed
    if (stateChanged) {
      this.broadcastGameState(gameState)
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats() {
    return this.sseManager.getStats()
  }
}