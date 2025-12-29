import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import { GameState, GameAction } from '../types'
import { gameReducer, createInitialGameState } from '../game-logic/gameReducer'

// Context interface
interface GameContextType {
  gameState: GameState
  dispatch: React.Dispatch<GameAction>
}

// Create the context
const GameContext = createContext<GameContextType | undefined>(undefined)

// Provider component props
interface GameProviderProps {
  children: ReactNode
}

// Provider component
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialGameState())

  const contextValue: GameContextType = {
    gameState,
    dispatch
  }

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  )
}

// Custom hook to use the game context
export const useGameContext = (): GameContextType => {
  const context = useContext(GameContext)
  
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider')
  }
  
  return context
}

// Export the context for advanced use cases
export { GameContext }