// Multiplayer API client for communicating with the backend

export interface CreateGameRequest {
  hostName: string
}

export interface CreateGameResponse {
  gameId: string
  joinUrl: string
  hostPlayerId: string
}

export interface JoinGameRequest {
  playerName: string
}

export interface JoinGameResponse {
  success: boolean
  playerId?: string
  error?: string
  lobbyState?: LobbyState
}

export interface StartGameRequest {
  hostPlayerId: string
}

export interface StartGameResponse {
  success: boolean
  error?: string
}

export interface GameActionRequest {
  action: any // GameAction from types
  playerId: string
}

export interface GameActionResponse {
  success: boolean
  error?: string
}

export interface GameStatusResponse {
  gameId: string
  status: 'lobby' | 'playing' | 'finished' | 'abandoned'
  playerCount: number
  maxPlayers: number
  canJoin: boolean
}

export interface LobbyState {
  gameId: string
  players: ConnectedPlayer[]
  isHost: boolean
  canStart: boolean
  maxPlayers: number
  minPlayers: number
}

export interface ConnectedPlayer {
  playerId: string
  playerName: string
  connected: boolean
  joinedAt: string
  lastSeen: string
}

// Server-Sent Events types
export interface GameStateUpdateEvent {
  type: 'game-state-update'
  gameState: any
  timestamp: string
}

export interface PlayerJoinedEvent {
  type: 'player-joined'
  player: ConnectedPlayer
  timestamp: string
}

export interface PlayerLeftEvent {
  type: 'player-left'
  playerId: string
  playerName: string
  timestamp: string
}

export interface GameStartedEvent {
  type: 'game-started'
  timestamp: string
}

export interface GameEndedEvent {
  type: 'game-ended'
  winner?: any
  reason: 'completed' | 'abandoned' | 'disconnections'
  timestamp: string
}

export type ServerSentEvent = 
  | GameStateUpdateEvent
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | GameStartedEvent
  | GameEndedEvent
  | { type: 'ping'; timestamp: string }

/**
 * Multiplayer API client
 */
export class MultiplayerApiClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    // Auto-detect API URL based on environment
    if (baseUrl) {
      this.baseUrl = baseUrl
    } else if (process.env.REACT_APP_SERVER_URL) {
      // Use explicit server URL environment variable
      this.baseUrl = `${process.env.REACT_APP_SERVER_URL}/api`
    } else if (process.env.NODE_ENV === 'production') {
      // Production fallback - try to detect from current domain
      this.baseUrl = `${window.location.protocol}//${window.location.hostname}/api`
    } else {
      // Development fallback
      this.baseUrl = 'http://localhost:3000/api'
    }
  }

  /**
   * Create a new multiplayer game
   */
  async createGame(hostName: string): Promise<CreateGameResponse> {
    const response = await fetch(`${this.baseUrl}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostName }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create game')
    }

    return response.json()
  }

  /**
   * Join an existing game
   */
  async joinGame(gameCode: string, playerName: string): Promise<JoinGameResponse> {
    const response = await fetch(`${this.baseUrl}/games/${gameCode}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerName }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to join game')
    }

    return response.json()
  }

  /**
   * Start a game (host only)
   */
  async startGame(gameCode: string, hostPlayerId: string): Promise<StartGameResponse> {
    const response = await fetch(`${this.baseUrl}/games/${gameCode}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostPlayerId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to start game')
    }

    return response.json()
  }

  /**
   * Get game status
   */
  async getGameStatus(gameCode: string): Promise<GameStatusResponse> {
    const response = await fetch(`${this.baseUrl}/games/${gameCode}/status`)

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get game status')
    }

    return response.json()
  }

  /**
   * Submit a player action
   */
  async submitAction(gameId: string, action: any, playerId: string): Promise<GameActionResponse> {
    const response = await fetch(`${this.baseUrl}/games/${gameId}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, playerId }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to submit action')
    }

    return response.json()
  }

  /**
   * Connect to Server-Sent Events stream
   */
  connectToGameEvents(gameId: string, playerId: string): EventSource {
    const url = `${this.baseUrl}/games/${gameId}/events?playerId=${playerId}`
    return new EventSource(url)
  }

  /**
   * Extract game code from URL or return the code directly
   */
  static extractGameCode(input: string): string | null {
    // If it's already a game code (6 characters, alphanumeric)
    if (/^[A-Z0-9]{6}$/.test(input.toUpperCase())) {
      return input.toUpperCase()
    }

    // Try to extract from URL
    try {
      const url = new URL(input)
      const gameParam = url.searchParams.get('game')
      if (gameParam && /^[A-Z0-9]{6}$/.test(gameParam.toUpperCase())) {
        return gameParam.toUpperCase()
      }
    } catch {
      // Not a valid URL, continue
    }

    return null
  }
}