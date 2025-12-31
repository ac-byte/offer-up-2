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

  const handleGotchaCardSelect = (cardId: string) => {
    const action: GameAction = { type: 'SELECT_GOTCHA_CARD', cardId }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error selecting Gotcha card:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleGotchaActionChoice = (actionChoice: 'steal' | 'discard') => {
    const action: GameAction = { type: 'CHOOSE_GOTCHA_ACTION', action: actionChoice }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error choosing Gotcha action:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleFlipOneCardSelect = (offerId: number, cardIndex: number) => {
    const action: GameAction = { type: 'SELECT_FLIP_ONE_CARD', offerId, cardIndex }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error selecting card for Flip One:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleAddOneHandCardSelect = (cardId: string) => {
    const action: GameAction = { type: 'SELECT_ADD_ONE_HAND_CARD', cardId }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error selecting hand card for Add One:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleAddOneOfferSelect = (offerId: number) => {
    const action: GameAction = { type: 'SELECT_ADD_ONE_OFFER', offerId }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error selecting offer for Add One:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleRemoveOneCardSelect = (offerId: number, cardIndex: number) => {
    const action: GameAction = { type: 'SELECT_REMOVE_ONE_CARD', offerId, cardIndex }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error selecting card for Remove One:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleStealAPointTargetSelect = (targetPlayerId: number) => {
    const action: GameAction = { type: 'SELECT_STEAL_A_POINT_TARGET', targetPlayerId }
    try {
      dispatch(action)
    } catch (error) {
      console.error('Error selecting target for Steal A Point:', error)
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
      case GamePhase.THING_TRADEINS:
      case GamePhase.WINNER_DETERMINATION:
        return (
          <button onClick={handleAdvancePhase} className="action-button">
            Continue to Next Phase
          </button>
        )
      
      case GamePhase.GOTCHA_TRADEINS:
        // Check if there's a pending Gotcha effect
        if (gameState.gotchaEffectState) {
          const { type, affectedPlayerIndex, selectedCards, awaitingBuyerChoice } = gameState.gotchaEffectState
          const affectedPlayer = gameState.players[affectedPlayerIndex]
          const buyer = getCurrentBuyer()
          
          if (awaitingBuyerChoice) {
            // Buyer needs to choose steal or discard for selected cards
            return (
              <div className="gotcha-effect-controls">
                <div className="gotcha-effect-header">
                  <strong>{buyer?.name}</strong> (Buyer): Choose action for selected card(s)
                </div>
                <div className="selected-cards">
                  <strong>Selected Cards:</strong>
                  {selectedCards.map(card => (
                    <span key={card.id} className="selected-card-name">{card.name}</span>
                  ))}
                </div>
                <div className="gotcha-action-buttons">
                  {affectedPlayerIndex !== gameState.currentBuyerIndex && (
                    <button
                      onClick={() => handleGotchaActionChoice('steal')}
                      className="action-button gotcha-steal-button"
                    >
                      Steal to Collection
                    </button>
                  )}
                  <button
                    onClick={() => handleGotchaActionChoice('discard')}
                    className="action-button gotcha-discard-button"
                  >
                    Discard
                  </button>
                </div>
                {affectedPlayerIndex === gameState.currentBuyerIndex && (
                  <div className="gotcha-self-effect-note">
                    <em>Note: Cards from your own collection must be discarded</em>
                  </div>
                )}
              </div>
            )
          } else {
            // Buyer needs to select cards from affected player's collection
            return (
              <div className="gotcha-effect-controls">
                <div className="gotcha-effect-header">
                  <strong>{buyer?.name}</strong> (Buyer): Select {gameState.gotchaEffectState.cardsToSelect} card(s) from {affectedPlayer.name}'s collection
                </div>
                <div className="gotcha-selection-info">
                  <span>Gotcha {type.charAt(0).toUpperCase() + type.slice(1)} effect</span>
                  <span>Cards selected: {selectedCards.length} / {gameState.gotchaEffectState.cardsToSelect}</span>
                </div>
              </div>
            )
          }
        } else {
          // No pending Gotcha effect - continue processing
          return (
            <button onClick={handleAdvancePhase} className="action-button">
              Continue to Next Phase
            </button>
          )
        }
      
      case GamePhase.ACTION_PHASE:
        // Check if there's a pending Flip One effect
        if (gameState.flipOneEffectState && gameState.flipOneEffectState.awaitingCardSelection) {
          const flipOnePlayer = gameState.players[gameState.flipOneEffectState.playerId]
          return (
            <div className="flip-one-effect-controls">
              <div className="flip-one-effect-header">
                <strong>{flipOnePlayer?.name}</strong> played Flip One: Select a face-down card from any offer to flip
              </div>
              <div className="flip-one-selection-info">
                <span>Click on any face-down card in the offers below</span>
              </div>
            </div>
          )
        }
        
        // Check if there's a pending Add One effect
        if (gameState.addOneEffectState) {
          const addOnePlayer = gameState.players[gameState.addOneEffectState.playerId]
          
          if (gameState.addOneEffectState.awaitingHandCardSelection) {
            return (
              <div className="add-one-effect-controls">
                <div className="add-one-effect-header">
                  <strong>{addOnePlayer?.name}</strong> played Add One: Select a card from your hand to add to an offer
                </div>
                <div className="add-one-selection-info">
                  <span>Click on a card in your hand below</span>
                </div>
              </div>
            )
          }
          
          if (gameState.addOneEffectState.awaitingOfferSelection) {
            const selectedCard = gameState.addOneEffectState.selectedHandCard
            return (
              <div className="add-one-effect-controls">
                <div className="add-one-effect-header">
                  <strong>{addOnePlayer?.name}</strong> selected <strong>{selectedCard?.name}</strong>: Now select an offer to add it to
                </div>
                <div className="add-one-selection-info">
                  <span>Click on any offer below to add the card face-down</span>
                </div>
              </div>
            )
          }
        }
        
        // Check if there's a pending Remove One effect
        if (gameState.removeOneEffectState && gameState.removeOneEffectState.awaitingCardSelection) {
          const removeOnePlayer = gameState.players[gameState.removeOneEffectState.playerId]
          return (
            <div className="remove-one-effect-controls">
              <div className="remove-one-effect-header">
                <strong>{removeOnePlayer?.name}</strong> played Remove One: Select a card from any offer to remove
              </div>
              <div className="remove-one-selection-info">
                <span>Click on any card in the offers below to discard it</span>
              </div>
            </div>
          )
        }
        
        // Check if there's a pending Steal A Point effect
        if (gameState.stealAPointEffectState && gameState.stealAPointEffectState.awaitingTargetSelection) {
          const stealAPointPlayer = gameState.players[gameState.stealAPointEffectState.playerId]
          const validTargets = gameState.players.filter((player, index) => 
            index !== gameState.stealAPointEffectState!.playerId && 
            player.points > stealAPointPlayer.points
          )
          
          if (validTargets.length === 0) {
            return (
              <div className="steal-a-point-effect-controls">
                <div className="steal-a-point-effect-header">
                  <strong>{stealAPointPlayer?.name}</strong> played Steal A Point, but no valid targets exist
                </div>
                <div className="steal-a-point-no-targets">
                  <span>No players have more points than you. The card effect has no impact.</span>
                  <button onClick={handleAdvancePhase} className="action-button secondary">
                    Continue
                  </button>
                </div>
              </div>
            )
          }
          
          return (
            <div className="steal-a-point-effect-controls">
              <div className="steal-a-point-effect-header">
                <strong>{stealAPointPlayer?.name}</strong> played Steal A Point: Select a player with more points than you
              </div>
              <div className="steal-a-point-targets">
                <div className="steal-a-point-info">
                  Your points: {stealAPointPlayer.points}
                </div>
                <div className="target-buttons">
                  {validTargets.map((target) => (
                    <button
                      key={target.id}
                      onClick={() => handleStealAPointTargetSelect(target.id)}
                      className="action-button steal-target-button"
                    >
                      Steal from {target.name} ({target.points} points)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        }
        
        return (
          <div className="phase-waiting">
            <span>Players can play action cards from their collections...</span>
            <button onClick={handleAdvancePhase} className="action-button secondary">
              Skip Phase (Debug)
            </button>
          </div>
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
            onGotchaCardSelect={handleGotchaCardSelect}
            onFlipOneCardSelect={(cardIndex) => handleFlipOneCardSelect(index, cardIndex)} // New handler for Flip One
            onAddOneHandCardSelect={handleAddOneHandCardSelect} // New handler for Add One hand card selection
            onAddOneOfferSelect={() => handleAddOneOfferSelect(index)} // New handler for Add One offer selection
            canFlipCards={gameState.currentPhase === GamePhase.BUYER_FLIP && gameState.selectedPerspective === gameState.currentBuyerIndex}
            canSelectOffer={gameState.currentPhase === GamePhase.OFFER_SELECTION && gameState.selectedPerspective === gameState.currentBuyerIndex && index !== gameState.currentBuyerIndex && player.offer.length > 0}
            canSelectGotchaCards={
              gameState.currentPhase === GamePhase.GOTCHA_TRADEINS &&
              gameState.gotchaEffectState !== null &&
              !gameState.gotchaEffectState.awaitingBuyerChoice &&
              gameState.gotchaEffectState.affectedPlayerIndex === index &&
              gameState.selectedPerspective === gameState.currentBuyerIndex
            }
            canSelectFlipOneCards={
              gameState.currentPhase === GamePhase.ACTION_PHASE &&
              gameState.flipOneEffectState !== null &&
              gameState.flipOneEffectState.awaitingCardSelection &&
              index !== gameState.currentBuyerIndex && // Can't flip buyer's cards (buyer has no offer)
              player.offer.length > 0 // Player must have an offer
            }
            canSelectAddOneHandCards={
              gameState.currentPhase === GamePhase.ACTION_PHASE &&
              gameState.addOneEffectState !== null &&
              gameState.addOneEffectState.awaitingHandCardSelection &&
              index === gameState.addOneEffectState.playerId && // Only the player who played Add One can select from their hand
              gameState.selectedPerspective === gameState.addOneEffectState.playerId
            }
            canSelectAddOneOffers={
              gameState.currentPhase === GamePhase.ACTION_PHASE &&
              gameState.addOneEffectState !== null &&
              gameState.addOneEffectState.awaitingOfferSelection &&
              index !== gameState.currentBuyerIndex && // Can't add to buyer's offer (buyer has no offer)
              player.offer.length > 0 // Player must have an offer
            }
            onRemoveOneCardSelect={(cardIndex) => handleRemoveOneCardSelect(index, cardIndex)} // New handler for Remove One
            canSelectRemoveOneCards={
              gameState.currentPhase === GamePhase.ACTION_PHASE &&
              gameState.removeOneEffectState !== null &&
              gameState.removeOneEffectState.awaitingCardSelection &&
              index !== gameState.currentBuyerIndex && // Can't remove from buyer's offer (buyer has no offer)
              player.offer.length > 0 // Player must have an offer
            }
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