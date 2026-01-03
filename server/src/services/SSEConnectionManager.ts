import { Response } from 'express'
import { MultiplayerGameState, ServerSentEvent, GameStateUpdateEvent, ConnectedPlayer } from '../types'

/**
 * Connection information for a single SSE client
 */
interface SSEConnection {
  playerId: string
  gameId: string
  response: Response
  connectedAt: Date
  lastPing: Date
}

/**
 * Manages Server-Sent Events connections for real-time game updates
 */
export class SSEConnectionManager {
  private connections: Map<string, SSEConnection> = new Map()
  private pingInterval: NodeJS.Timeout

  constructor() {
    // Send ping every 30 seconds to keep connections alive
    this.pingInterval = setInterval(() => {
      this.sendPingToAllConnections()
    }, 30000)
  }

  /**
   * Add a new SSE connection
   */
  addConnection(playerId: string, gameId: string, response: Response, onDisconnect?: (playerId: string, gameId: string) => void): void {
    const connectionId = `${gameId}-${playerId}`
    
    // Remove existing connection if any
    this.removeConnection(playerId, gameId)
    
    const connection: SSEConnection = {
      playerId,
      gameId,
      response,
      connectedAt: new Date(),
      lastPing: new Date()
    }
    
    this.connections.set(connectionId, connection)
    
    // Set up cleanup on client disconnect
    response.on('close', () => {
      this.removeConnection(playerId, gameId)
      // Notify about disconnection
      if (onDisconnect) {
        onDisconnect(playerId, gameId)
      }
    })
    
    console.log(`📡 SSE connection added for player ${playerId} in game ${gameId}`)
  }

  /**
   * Remove an SSE connection
   */
  removeConnection(playerId: string, gameId: string): void {
    const connectionId = `${gameId}-${playerId}`
    const connection = this.connections.get(connectionId)
    
    if (connection) {
      try {
        connection.response.end()
      } catch (error) {
        // Connection might already be closed
      }
      
      this.connections.delete(connectionId)
      console.log(`📡 SSE connection removed for player ${playerId} in game ${gameId}`)
    }
  }

  /**
   * Send event to a specific player
   */
  sendToPlayer(playerId: string, gameId: string, event: ServerSentEvent): boolean {
    const connectionId = `${gameId}-${playerId}`
    const connection = this.connections.get(connectionId)
    
    if (!connection) {
      return false
    }
    
    try {
      const eventData = JSON.stringify(event)
      connection.response.write(`data: ${eventData}\n\n`)
      return true
    } catch (error) {
      console.error(`Failed to send event to player ${playerId}:`, error)
      this.removeConnection(playerId, gameId)
      return false
    }
  }

  /**
   * Send event to all players in a game
   */
  sendToGame(gameId: string, event: ServerSentEvent): number {
    let sentCount = 0
    
    for (const [connectionId, connection] of this.connections) {
      if (connection.gameId === gameId) {
        if (this.sendToPlayer(connection.playerId, gameId, event)) {
          sentCount++
        }
      }
    }
    
    return sentCount
  }

  /**
   * Send game state update to all players in a game with player-specific filtering
   */
  sendGameStateUpdate(gameState: MultiplayerGameState): number {
    let sentCount = 0
    
    for (const [connectionId, connection] of this.connections) {
      if (connection.gameId === gameState.gameId) {
        // Filter game state for this specific player
        const filteredGameState = this.filterGameStateForPlayer(gameState, connection.playerId)
        
        const event: GameStateUpdateEvent = {
          type: 'game-state-update',
          gameState: filteredGameState,
          timestamp: new Date().toISOString()
        }
        
        if (this.sendToPlayer(connection.playerId, gameState.gameId, event)) {
          sentCount++
        }
      }
    }
    
    return sentCount
  }

  /**
   * Get all connected players for a game
   */
  getConnectedPlayersForGame(gameId: string): string[] {
    const connectedPlayers: string[] = []
    
    for (const [connectionId, connection] of this.connections) {
      if (connection.gameId === gameId) {
        connectedPlayers.push(connection.playerId)
      }
    }
    
    return connectedPlayers
  }

  /**
   * Check if a player is connected via SSE
   */
  isPlayerConnected(playerId: string, gameId: string): boolean {
    const connectionId = `${gameId}-${playerId}`
    return this.connections.has(connectionId)
  }

  /**
   * Get connection statistics
   */
  getStats() {
    const gameConnections: { [gameId: string]: number } = {}
    
    for (const connection of this.connections.values()) {
      gameConnections[connection.gameId] = (gameConnections[connection.gameId] || 0) + 1
    }
    
    return {
      totalConnections: this.connections.size,
      gameConnections
    }
  }

  /**
   * Filter game state to show only what a specific player should see
   */
  private filterGameStateForPlayer(gameState: MultiplayerGameState, playerId: string): any {
    // Find the connected player
    const connectedPlayer = gameState.connectedPlayers.find(p => p.playerId === playerId)
    
    if (!connectedPlayer) {
      // Player not found, return minimal state
      return {
        gameId: gameState.gameId,
        status: gameState.status,
        error: 'Player not found in game'
      }
    }

    // If game is still in lobby, return full lobby state
    if (gameState.status === 'lobby') {
      return {
        gameId: gameState.gameId,
        status: gameState.status,
        connectedPlayers: gameState.connectedPlayers,
        hostPlayerId: gameState.hostPlayerId
      }
    }

    // For playing games, filter sensitive information
    const gamePlayerIndex = connectedPlayer.gamePlayerIndex ?? 0
    
    const filteredState = {
      ...gameState,
      // Set perspective to this player's game index
      selectedPerspective: gamePlayerIndex,
      // Hide other players' hands (keep only this player's hand visible)
      players: gameState.players?.map((player, index) => ({
        ...player,
        hand: index === gamePlayerIndex ? player.hand : [] // Hide other players' hands
      }))
    }

    return filteredState
  }

  /**
   * Send ping to all connections to keep them alive
   */
  private sendPingToAllConnections(): void {
    const now = new Date()
    
    for (const [connectionId, connection] of this.connections) {
      try {
        const pingEvent = {
          type: 'ping' as const,
          timestamp: now.toISOString()
        }
        
        connection.response.write(`data: ${JSON.stringify(pingEvent)}\n\n`)
        connection.lastPing = now
      } catch (error) {
        console.error(`Failed to ping connection ${connectionId}:`, error)
        this.connections.delete(connectionId)
      }
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
    }
    
    // Close all connections
    for (const [connectionId, connection] of this.connections) {
      try {
        connection.response.end()
      } catch (error) {
        // Ignore errors when closing
      }
    }
    
    this.connections.clear()
  }
}