import React from 'react'
import { useGameContext } from '../contexts'
import { PerspectiveSelector } from './PerspectiveSelector'
import { PlayerArea } from './PlayerArea'
import { GameAction, GamePhase, Card } from '../types'
import './GameBoard.css'

export const GameBoard: React.FC = () => {
  const { gameState, dispatch } = useGameContext()

  const handlePerspectiveChange = (playerId: number) => {
    const action: GameAction = { type: 'CHANGE_PERSPECTIVE', playerId }
    dispatch(action)
  }

  const handleToggleAutoFollow = () => {
    const action: GameAction = { type: 'TOGGLE_AUTO_FOLLOW' }
    dispatch(action)
  }

  const handleStartGame = () => {
    const players = ['Alice', 'Bob', 'Charlie', 'Diana'] // Example 4-player game
    const action: GameAction = { type: 'START_GAME', players }
    dispatch(action)
  }

  const handleAdvancePhase = () => {
    const action: GameAction = { type: 'ADVANCE_PHASE' }
    dispatch(action)
  }

  const handleDealCards = () => {
    const action: GameAction = { type: 'DEAL_CARDS' }
    dispatch(action)
  }

  const handleOfferPlace = (playerId: number, cards: Card[], faceUpIndex: number) => {
    const action: GameAction = { type: 'PLACE_OFFER', playerId, cards, faceUpIndex }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error placing offer:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleCardPlay = (playerId: number, card: Card) => {
    const action: GameAction = { type: 'PLAY_ACTION_CARD', playerId, cardId: card.id }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error playing action card:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleCardFlip = (offerId: number, cardIndex: number) => {
    const action: GameAction = { type: 'FLIP_CARD', offerId, cardIndex }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error flipping card:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleOfferSelect = (sellerId: number) => {
    const buyerId = gameState.currentBuyerIndex
    const action: GameAction = { type: 'SELECT_OFFER', buyerId, sellerId }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error selecting offer:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const formatPhaseName = (phase: GamePhase): string => {
    return phase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getCurrentBuyer = () => {
    return gameState.players[gameState.currentBuyerIndex]
  }

  const getCurrentPlayer = () => {
    return gameState.players[gameState.currentPlayerIndex]
  }

  const getGameStatus = () => {
    if (gameState.winner !== null) {
      const winner = gameState.players[gameState.winner]
      return `🏆 ${winner.name} wins with ${winner.points} points!`
    }
    
    const buyer = getCurrentBuyer()
    const currentPlayer = getCurrentPlayer()
    
    return `💰 Buyer: ${buyer?.name} | 🎯 Current Player: ${currentPlayer?.name}`
  }

  const getPhaseActions = () => {
    switch (gameState.currentPhase) {
      case GamePhase.DEAL:
        return (
          <button onClick={handleDealCards} className="action-button primary">
            Deal Cards
          </button>
        )
      
      case GamePhase.OFFER_SELECTION:
        const buyer = getCurrentBuyer()
        const sellersWithOffers = gameState.players.filter((player, index) => 
          index !== gameState.currentBuyerIndex && player.offer.length > 0
        )
        
        if (sellersWithOffers.length === 0) {
          return (
            <div className="phase-waiting">
              <span>No offers available to select</span>
              <button onClick={handleAdvancePhase} className="action-button secondary">
                Skip Phase (Debug)
              </button>
            </div>
          )
        }
        
        return (
          <div className="offer-selection-controls">
            <div className="offer-selection-header">
              <strong>{buyer?.name}</strong> (Buyer): Select one offer to purchase
            </div>
            <div className="offer-selection-buttons">
              {sellersWithOffers.map((seller) => (
                <button
                  key={seller.id}
                  onClick={() => handleOfferSelect(seller.id)}
                  className="action-button offer-select-button"
                >
                  Select {seller.name}'s Offer
                </button>
              ))}
            </div>
          </div>
        )
      
      case GamePhase.BUYER_ASSIGNMENT:
      case GamePhase.OFFER_DISTRIBUTION:
      case GamePhase.GOTCHA_TRADEINS:
      case GamePhase.THING_TRADEINS:
      case GamePhase.WINNER_DETERMINATION:
        return (
          <button onClick={handleAdvancePhase} className="action-button">
            Continue to Next Phase
          </button>
        )
      
      default:
        return (
          <div className="phase-waiting">
            <span>Waiting for player actions...</span>
            <button onClick={handleAdvancePhase} className="action-button secondary">
              Skip Phase (Debug)
            </button>
          </div>
        )
    }
  }

  if (!gameState.gameStarted) {
    return (
      <div className="game-board">
        <div className="game-setup">
          <h1>Trading Card Game</h1>
          <p>A strategic card game for 3-6 players featuring buying, selling, and set collection mechanics.</p>
          <div className="setup-info">
            <h3>Game Features:</h3>
            <ul>
              <li>10-phase round system with buyer-seller mechanics</li>
              <li>Strategic offers with hidden information</li>
              <li>Action cards for dynamic gameplay</li>
              <li>Set collection and point scoring</li>
            </ul>
          </div>
          <button onClick={handleStartGame} className="start-button">
            Start Game (4 Players)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-board">
      {/* Game Header with Title and Status */}
      <div className="game-header">
        <div className="game-title">
          <h1>Trading Card Game</h1>
          <div className="round-info">Round {gameState.round}</div>
        </div>
        <div className="game-status">
          {getGameStatus()}
        </div>
      </div>

      {/* Phase Display and Instructions */}
      <div className="phase-display">
        <div className="phase-info">
          <div className="phase-name">
            <strong>Current Phase:</strong> {formatPhaseName(gameState.currentPhase)}
          </div>
          <div className="phase-instructions">
            {gameState.phaseInstructions}
          </div>
        </div>
        <div className="phase-progress">
          <div className="phase-indicator">
            Phase {Object.values(GamePhase).indexOf(gameState.currentPhase) + 1} of 10
          </div>
        </div>
      </div>

      {/* Game Controls */}
      <div className="game-controls">
        <div className="control-section">
          <label>View Perspective:</label>
          <PerspectiveSelector
            players={gameState.players}
            selectedPerspective={gameState.selectedPerspective}
            autoFollowPerspective={gameState.autoFollowPerspective}
            onPerspectiveChange={handlePerspectiveChange}
            onToggleAutoFollow={handleToggleAutoFollow}
          />
        </div>
        
        <div className="control-section">
          <div className="deck-info">
            <span>Draw Pile: {gameState.drawPile.length} cards</span>
            <span>Discard Pile: {gameState.discardPile.length} cards</span>
          </div>
        </div>
      </div>

      {/* Player Areas */}
      <div className="player-areas">
        {gameState.players.map((player, index) => (
          <PlayerArea
            key={player.id}
            player={player}
            isCurrentPlayer={index === gameState.currentPlayerIndex}
            isBuyer={index === gameState.currentBuyerIndex}
            perspective={gameState.selectedPerspective}
            phase={gameState.currentPhase}
            onCardPlay={(card) => handleCardPlay(player.id, card)}
            onOfferPlace={(cards, faceUpIndex) => handleOfferPlace(player.id, cards, faceUpIndex)}
            onCardFlip={(cardIndex) => handleCardFlip(index, cardIndex)} // index is the player index (offerId)
            onOfferSelect={() => handleOfferSelect(player.id)}
            canFlipCards={gameState.currentPhase === GamePhase.BUYER_FLIP && gameState.selectedPerspective === gameState.currentBuyerIndex}
            canSelectOffer={gameState.currentPhase === GamePhase.OFFER_SELECTION && gameState.selectedPerspective === gameState.currentBuyerIndex && index !== gameState.currentBuyerIndex && player.offer.length > 0}
          />
        ))}
      </div>

      {/* Game Actions */}
      <div className="game-actions">
        <div className="actions-header">
          <h3>Game Actions</h3>
        </div>
        <div className="actions-content">
          {getPhaseActions()}
        </div>
      </div>

      {/* Game Footer with Additional Info */}
      {gameState.winner === null && (
        <div className="game-footer">
          <div className="game-stats">
            <div className="stat-item">
              <strong>Players:</strong> {gameState.players.length}
            </div>
            <div className="stat-item">
              <strong>Cards in Play:</strong> {gameState.players.reduce((total, player) => 
                total + player.hand.length + player.collection.length + player.offer.length, 0
              )}
            </div>
            <div className="stat-item">
              <strong>Highest Score:</strong> {Math.max(...gameState.players.map(p => p.points), 0)} points
            </div>
          </div>
        </div>
      )}
    </div>
  )
}