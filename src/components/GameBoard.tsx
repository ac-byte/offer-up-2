import React, { useReducer } from 'react'
import { gameReducer, createInitialGameState } from '../game-logic/gameReducer'
import { PerspectiveSelector } from './PerspectiveSelector'
import { PlayerArea } from './PlayerArea'
import { GameAction } from '../types'
import './GameBoard.css'

export const GameBoard: React.FC = () => {
  const [gameState, dispatch] = useReducer(gameReducer, createInitialGameState())

  const handlePerspectiveChange = (playerId: number) => {
    const action: GameAction = { type: 'CHANGE_PERSPECTIVE', playerId }
    dispatch(action)
  }

  const handleStartGame = () => {
    const players = ['Alice', 'Bob', 'Charlie', 'Diana'] // Example 4-player game
    const action: GameAction = { type: 'START_GAME', players }
    dispatch(action)
  }

  const handleDealCards = () => {
    const action: GameAction = { type: 'DEAL_CARDS' }
    dispatch(action)
  }

  if (!gameState.gameStarted) {
    return (
      <div className="game-board">
        <div className="game-setup">
          <h2>Trading Card Game</h2>
          <p>Ready to start a new game?</p>
          <button onClick={handleStartGame} className="start-button">
            Start Game (4 Players)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-board">
      <div className="game-header">
        <h2>Trading Card Game - Round {gameState.round}</h2>
        <div className="game-controls">
          <PerspectiveSelector
            players={gameState.players}
            selectedPerspective={gameState.selectedPerspective}
            onPerspectiveChange={handlePerspectiveChange}
          />
          <div className="phase-info">
            <strong>Phase:</strong> {gameState.currentPhase.replace('_', ' ').toUpperCase()}
          </div>
          <div className="phase-instructions">
            {gameState.phaseInstructions}
          </div>
        </div>
      </div>

      <div className="player-areas">
        {gameState.players.map((player, index) => (
          <PlayerArea
            key={player.id}
            player={player}
            isCurrentPlayer={index === gameState.currentPlayerIndex}
            isBuyer={index === gameState.currentBuyerIndex}
            perspective={gameState.selectedPerspective}
            phase={gameState.currentPhase}
            onCardPlay={() => {}} // Placeholder
            onOfferPlace={() => {}} // Placeholder
          />
        ))}
      </div>

      <div className="game-actions">
        {gameState.currentPhase === 'deal' && (
          <button onClick={handleDealCards} className="action-button">
            Deal Cards
          </button>
        )}
      </div>
    </div>
  )
}