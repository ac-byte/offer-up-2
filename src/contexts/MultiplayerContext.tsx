import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { MultiplayerApiClient, LobbyState, ConnectedPlayer, ServerSentEvent } from '../services/multiplayerApi'
import { ConnectionManager, ConnectionState, ConnectionMetrics } from '../services/ConnectionManager'

// Multiplayer state types
export interface MultiplayerState {
  mode: 'local' | 'multiplayer'
  isHost: boolean
  gameId: string | null
  gameCode: string | null
  joinUrl: string | null
  playerId: string | null
  playerName: string | null
  lobbyState: LobbyState | null
  connectionState: ConnectionState
  retryAttempt: number
  connectionMetrics: ConnectionMetrics | null
  showRetryButton: boolean
  error: string | null
  gameStarted: boolean
}

// Multiplayer actions
export type MultiplayerAction =
  | { type: 'SET_MODE'; mode: 'local' | 'multiplayer' }
  | { type: 'CONNECTION_STATE_CHANGED'; state: ConnectionState }
  | { type: 'RETRY_ATTEMPT'; attemptNumber: number }
  | { type: 'METRICS_UPDATED'; metrics: ConnectionMetrics }
  | { type: 'SHOW_RETRY_BUTTON'; show: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'GAME_CREATED'; gameId: string; gameCode: string; joinUrl: string; playerId: string; playerName: string }
  | { type: 'GAME_JOINED'; gameId: string; playerId: string; playerName: string; lobbyState: LobbyState }
  | { type: 'LOBBY_UPDATED'; lobbyState: LobbyState }
  | { type: 'GAME_STARTED' }
  | { type: 'PLAYER_JOINED'; player: ConnectedPlayer }
  | { type: 'PLAYER_LEFT'; playerId: string }
  | { type: 'RESET' }

const initialState: MultiplayerState = {
  mode: 'local',
  isHost: false,
  gameId: null,
  gameCode: null,
  joinUrl: null,
  playerId: null,
  playerName: null,
  lobbyState: null,
  connectionState: 'disconnected',
  retryAttempt: 0,
  connectionMetrics: null,
  showRetryButton: false,
  error: null,
  gameStarted: false
}

function multiplayerReducer(state: MultiplayerState, action: MultiplayerAction): MultiplayerState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    
    case 'CONNECTION_STATE_CHANGED':
      return { 
        ...state, 
        connectionState: action.state,
        // Show retry button when connection fails
        showRetryButton: action.state === 'failed'
      }
    
    case 'RETRY_ATTEMPT':
      return { ...state, retryAttempt: action.attemptNumber }
    
    case 'METRICS_UPDATED':
      return { ...state, connectionMetrics: action.metrics }
    
    case 'SHOW_RETRY_BUTTON':
      return { ...state, showRetryButton: action.show }
    
    case 'SET_ERROR':
      return { ...state, error: action.error }
    
    case 'GAME_CREATED':
      // Create initial lobby state for the host
      const hostLobbyState = {
        gameId: action.gameId,
        players: [{
          playerId: action.playerId,
          playerName: action.playerName,
          connected: true,
          joinedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        }],
        isHost: true,
        canStart: false, // Need at least 3 players
        maxPlayers: 6,
        minPlayers: 3
      }
      
      return {
        ...state,
        mode: 'multiplayer',
        isHost: true,
        gameId: action.gameId,
        gameCode: action.gameCode,
        joinUrl: action.joinUrl,
        playerId: action.playerId,
        playerName: action.playerName,
        lobbyState: hostLobbyState,
        connectionState: 'connected',
        error: null
      }
    
    case 'GAME_JOINED':
      return {
        ...state,
        mode: 'multiplayer',
        isHost: false,
        gameId: action.gameId,
        playerId: action.playerId,
        playerName: action.playerName,
        lobbyState: action.lobbyState,
        connectionState: 'connected',
        error: null
      }
    
    case 'LOBBY_UPDATED':
      return {
        ...state,
        lobbyState: action.lobbyState
      }
    
    case 'GAME_STARTED':
      return {
        ...state,
        gameStarted: true
      }
    
    case 'PLAYER_JOINED':
      if (!state.lobbyState) return state
      const updatedPlayers = [...state.lobbyState.players, action.player]
      return {
        ...state,
        lobbyState: {
          ...state.lobbyState,
          players: updatedPlayers,
          canStart: updatedPlayers.length >= state.lobbyState.minPlayers
        }
      }
    
    case 'PLAYER_LEFT':
      if (!state.lobbyState) return state
      const remainingPlayers = state.lobbyState.players.filter(p => p.playerId !== action.playerId)
      return {
        ...state,
        lobbyState: {
          ...state.lobbyState,
          players: remainingPlayers,
          canStart: remainingPlayers.length >= state.lobbyState.minPlayers
        }
      }
    
    case 'RESET':
      return initialState
    
    default:
      return state
  }
}

// Context
interface MultiplayerContextType {
  state: MultiplayerState
  dispatch: React.Dispatch<MultiplayerAction>
  apiClient: MultiplayerApiClient
  createGame: (hostName: string) => Promise<void>
  joinGame: (gameCode: string, playerName: string) => Promise<void>
  startGame: () => Promise<void>
  leaveGame: () => void
  submitAction: (action: any) => Promise<void>
  manualRetry: () => Promise<void>
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined)

// Provider component
export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(multiplayerReducer, initialState)
  const apiClient = useRef(new MultiplayerApiClient()).current
  const connectionManagerRef = useRef<ConnectionManager | null>(null)

  // Clean up connection manager on unmount
  useEffect(() => {
    return () => {
      if (connectionManagerRef.current) {
        connectionManagerRef.current.disconnect()
        connectionManagerRef.current = null
      }
    }
  }, [])

  // Set up ConnectionManager when we have gameId and playerId
  useEffect(() => {
    if (state.gameId && state.playerId && state.mode === 'multiplayer') {
      connectToGameEvents()
    }

    return () => {
      if (connectionManagerRef.current) {
        connectionManagerRef.current.disconnect()
        connectionManagerRef.current = null
      }
    }
  }, [state.gameId, state.playerId, state.mode])

  const connectToGameEvents = () => {
    if (!state.gameId || !state.playerId) return

    // Disconnect existing connection
    if (connectionManagerRef.current) {
      connectionManagerRef.current.disconnect()
    }

    // Create new ConnectionManager instance
    const connectionManager = new ConnectionManager(
      apiClient,
      state.gameId,
      state.playerId
    )

    // Wire up callbacks to dispatch actions
    connectionManager.onStateChange = (connectionState: ConnectionState) => {
      dispatch({ type: 'CONNECTION_STATE_CHANGED', state: connectionState })
      
      // Update retry attempt when retrying
      if (connectionState === 'retrying') {
        const metrics = connectionManager.getMetrics()
        dispatch({ type: 'RETRY_ATTEMPT', attemptNumber: metrics.totalAttempts })
      }
      
      // Update metrics
      const metrics = connectionManager.getMetrics()
      dispatch({ type: 'METRICS_UPDATED', metrics })
    }

    connectionManager.onMessage = (event: ServerSentEvent) => {
      handleServerEvent(event)
    }

    connectionManager.onError = (error: Error) => {
      console.error('Connection error:', error)
      dispatch({ type: 'SET_ERROR', error: error.message })
    }

    // Store reference
    connectionManagerRef.current = connectionManager

    // Initiate connection
    connectionManager.connect().catch((error) => {
      console.error('Failed to connect:', error)
    })
  }

  const handleServerEvent = (event: ServerSentEvent) => {
    switch (event.type) {
      case 'game-state-update':
        // Forward game state updates to the game context
        if (event.gameState) {
          // We need to dispatch this to the game context
          // For now, just log it - we'll need to connect this to the game context
          console.log('Game state update received:', event.gameState)
          
          // Dispatch a custom event that the game context can listen to
          window.dispatchEvent(new CustomEvent('multiplayer-game-state-update', {
            detail: event.gameState
          }))
        }
        break
      
      case 'player-joined':
        dispatch({ type: 'PLAYER_JOINED', player: event.player })
        break
      
      case 'player-left':
        dispatch({ type: 'PLAYER_LEFT', playerId: event.playerId })
        break
      
      case 'game-started':
        dispatch({ type: 'GAME_STARTED' })
        break
      
      case 'game-ended':
        // Handle game end
        console.log('Game ended:', event.reason)
        break
      
      case 'ping':
        // Just a keep-alive ping, no action needed
        break
      
      default:
        console.log('Unknown SSE event:', event)
    }
  }

  const createGame = async (hostName: string) => {
    try {
      dispatch({ type: 'CONNECTION_STATE_CHANGED', state: 'connecting' })
      dispatch({ type: 'SET_ERROR', error: null })
      
      const response = await apiClient.createGame(hostName)
      
      dispatch({
        type: 'GAME_CREATED',
        gameId: response.gameId,
        gameCode: response.joinUrl.split('game=')[1], // Extract code from URL
        joinUrl: response.joinUrl,
        playerId: response.hostPlayerId,
        playerName: hostName
      })
    } catch (error) {
      dispatch({ type: 'CONNECTION_STATE_CHANGED', state: 'failed' })
      dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error.message : 'Failed to create game' })
      throw error
    }
  }

  const joinGame = async (gameCode: string, playerName: string) => {
    try {
      dispatch({ type: 'CONNECTION_STATE_CHANGED', state: 'connecting' })
      dispatch({ type: 'SET_ERROR', error: null })
      
      const response = await apiClient.joinGame(gameCode, playerName)
      
      if (response.success && response.playerId && response.lobbyState) {
        dispatch({
          type: 'GAME_JOINED',
          gameId: response.lobbyState.gameId,
          playerId: response.playerId,
          playerName: playerName,
          lobbyState: response.lobbyState
        })
      } else {
        throw new Error(response.error || 'Failed to join game')
      }
    } catch (error) {
      dispatch({ type: 'CONNECTION_STATE_CHANGED', state: 'failed' })
      dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error.message : 'Failed to join game' })
      throw error
    }
  }

  const startGame = async () => {
    if (!state.gameCode || !state.playerId || !state.isHost) {
      throw new Error('Cannot start game: missing required data or not host')
    }

    try {
      const response = await apiClient.startGame(state.gameCode, state.playerId)
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to start game')
      }
      
      // Game started event will be received via SSE
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error.message : 'Failed to start game' })
      throw error
    }
  }

  const leaveGame = () => {
    if (connectionManagerRef.current) {
      connectionManagerRef.current.disconnect()
      connectionManagerRef.current = null
    }
    dispatch({ type: 'RESET' })
  }

  const submitAction = async (action: any) => {
    if (!state.gameId || !state.playerId) {
      throw new Error('Cannot submit action: not connected to game')
    }

    try {
      const response = await apiClient.submitAction(state.gameId, action, state.playerId)
      
      if (!response.success) {
        throw new Error(response.error || 'Action failed')
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error.message : 'Failed to submit action' })
      throw error
    }
  }

  const manualRetry = async () => {
    if (connectionManagerRef.current) {
      try {
        await connectionManagerRef.current.manualRetry()
      } catch (error) {
        console.error('Manual retry failed:', error)
        dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error.message : 'Manual retry failed' })
      }
    }
  }

  const contextValue: MultiplayerContextType = {
    state,
    dispatch,
    apiClient,
    createGame,
    joinGame,
    startGame,
    leaveGame,
    submitAction,
    manualRetry
  }

  return (
    <MultiplayerContext.Provider value={contextValue}>
      {children}
    </MultiplayerContext.Provider>
  )
}

// Hook to use the multiplayer context
export const useMultiplayer = () => {
  const context = useContext(MultiplayerContext)
  if (context === undefined) {
    throw new Error('useMultiplayer must be used within a MultiplayerProvider')
  }
  return context
}