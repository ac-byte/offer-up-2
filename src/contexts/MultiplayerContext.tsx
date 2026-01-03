import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { MultiplayerApiClient, LobbyState, ConnectedPlayer, ServerSentEvent } from '../services/multiplayerApi'

// Multiplayer state types
export interface MultiplayerState {
  mode: 'local' | 'multiplayer'
  isHost: boolean
  gameId: string | null
  gameCode: string | null
  playerId: string | null
  playerName: string | null
  lobbyState: LobbyState | null
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
  error: string | null
  gameStarted: boolean
}

// Multiplayer actions
export type MultiplayerAction =
  | { type: 'SET_MODE'; mode: 'local' | 'multiplayer' }
  | { type: 'SET_CONNECTION_STATUS'; status: 'disconnected' | 'connecting' | 'connected' | 'error' }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'GAME_CREATED'; gameId: string; gameCode: string; playerId: string; playerName: string }
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
  playerId: null,
  playerName: null,
  lobbyState: null,
  connectionStatus: 'disconnected',
  error: null,
  gameStarted: false
}

function multiplayerReducer(state: MultiplayerState, action: MultiplayerAction): MultiplayerState {
  switch (action.type) {
    case 'SET_MODE':
      return { ...state, mode: action.mode }
    
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.status }
    
    case 'SET_ERROR':
      return { ...state, error: action.error }
    
    case 'GAME_CREATED':
      return {
        ...state,
        mode: 'multiplayer',
        isHost: true,
        gameId: action.gameId,
        gameCode: action.gameCode,
        playerId: action.playerId,
        playerName: action.playerName,
        connectionStatus: 'connected',
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
        connectionStatus: 'connected',
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
      return {
        ...state,
        lobbyState: {
          ...state.lobbyState,
          players: [...state.lobbyState.players, action.player]
        }
      }
    
    case 'PLAYER_LEFT':
      if (!state.lobbyState) return state
      return {
        ...state,
        lobbyState: {
          ...state.lobbyState,
          players: state.lobbyState.players.filter(p => p.playerId !== action.playerId)
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
}

const MultiplayerContext = createContext<MultiplayerContextType | undefined>(undefined)

// Provider component
export const MultiplayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(multiplayerReducer, initialState)
  const apiClient = useRef(new MultiplayerApiClient()).current
  const eventSourceRef = useRef<EventSource | null>(null)

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [])

  // Set up SSE connection when we have gameId and playerId
  useEffect(() => {
    if (state.gameId && state.playerId && state.mode === 'multiplayer') {
      connectToGameEvents()
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [state.gameId, state.playerId, state.mode])

  const connectToGameEvents = () => {
    if (!state.gameId || !state.playerId) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connecting' })

    const eventSource = apiClient.connectToGameEvents(state.gameId, state.playerId)
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connected' })
      dispatch({ type: 'SET_ERROR', error: null })
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'error' })
      dispatch({ type: 'SET_ERROR', error: 'Connection lost. Attempting to reconnect...' })
    }

    eventSource.onmessage = (event) => {
      try {
        const data: ServerSentEvent = JSON.parse(event.data)
        handleServerEvent(data)
      } catch (error) {
        console.error('Failed to parse SSE message:', error)
      }
    }
  }

  const handleServerEvent = (event: ServerSentEvent) => {
    switch (event.type) {
      case 'game-state-update':
        // This will be handled by the game context
        // For now, just log it
        console.log('Game state update received:', event.gameState)
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
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connecting' })
      dispatch({ type: 'SET_ERROR', error: null })
      
      const response = await apiClient.createGame(hostName)
      
      dispatch({
        type: 'GAME_CREATED',
        gameId: response.gameId,
        gameCode: response.joinUrl.split('game=')[1], // Extract code from URL
        playerId: response.hostPlayerId,
        playerName: hostName
      })
    } catch (error) {
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'error' })
      dispatch({ type: 'SET_ERROR', error: error instanceof Error ? error.message : 'Failed to create game' })
      throw error
    }
  }

  const joinGame = async (gameCode: string, playerName: string) => {
    try {
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'connecting' })
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
      dispatch({ type: 'SET_CONNECTION_STATUS', status: 'error' })
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
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
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

  const contextValue: MultiplayerContextType = {
    state,
    dispatch,
    apiClient,
    createGame,
    joinGame,
    startGame,
    leaveGame,
    submitAction
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