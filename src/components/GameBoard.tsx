import React from 'react'
import { useGameContext } from '../contexts'
import { useMultiplayer } from '../contexts/MultiplayerContext'
import { PerspectiveSelector } from './PerspectiveSelector'
import { PlayerArea } from './PlayerArea'
import { HomeScreen } from './HomeScreen'
import { AdminFooter } from './AdminFooter'
import { GameAction, GamePhase, Card } from '../types'
import './GameBoard.css'

export const GameBoard: React.FC = () => {
  const { gameState, dispatch } = useGameContext()
  const { state: multiplayerState, submitAction } = useMultiplayer()
  const [localGameStarting, setLocalGameStarting] = React.useState(false)

  // Auto-set perspective for multiplayer mode
  React.useEffect(() => {
    if (multiplayerState.mode === 'multiplayer' && multiplayerState.playerId) {
      // In multiplayer mode, the server should be setting the correct perspective
      // via the REPLACE_STATE action, so we don't need to override it here.
      // The server filters the game state to show the correct perspective for each player.
      console.log('Multiplayer mode - perspective managed by server')
    }
  }, [multiplayerState.mode, multiplayerState.playerId])

  // Reset localGameStarting when game actually starts
  React.useEffect(() => {
    if (gameState.gameStarted) {
      setLocalGameStarting(false)
    }
  }, [gameState.gameStarted])

  // Helper function to handle actions - either dispatch locally or send to server
  const handleAction = async (action: GameAction) => {
    if (multiplayerState.mode === 'multiplayer') {
      try {
        await submitAction(action)
      } catch (error) {
        console.error('Failed to submit action to server:', error)
        // In a real app, show error to user
      }
    } else {
      dispatch(action)
    }
  }

  const handlePerspectiveChange = (playerId: number) => {
    // Only allow perspective changes in local mode or for host
    if (multiplayerState.mode === 'local' || multiplayerState.isHost) {
      const action: GameAction = { type: 'CHANGE_PERSPECTIVE', playerId }
      dispatch(action) // Always local for perspective changes
    }
  }

  const handleToggleAutoFollow = () => {
    // Only allow in local mode or for host
    if (multiplayerState.mode === 'local' || multiplayerState.isHost) {
      const action: GameAction = { type: 'TOGGLE_AUTO_FOLLOW' }
      dispatch(action) // Always local for perspective changes
    }
  }

  const handleStartGame = (action: GameAction) => {
    setLocalGameStarting(true) // Set flag immediately to prevent re-showing HomeScreen
    dispatch(action) // Local game start
  }

  const handleResetGame = () => {
    if (multiplayerState.mode === 'multiplayer') {
      // In multiplayer mode, reset by leaving the game and going back to home
      // This will trigger the multiplayer context to reset and show the home screen
      window.location.reload() // Simple solution: reload the page to reset everything
    } else {
      // Local mode: reset the game state
      const action: GameAction = { type: 'RESET_GAME' }
      dispatch(action) // Always local for reset
    }
  }

  const handleAdvancePhase = async () => {
    const action: GameAction = { type: 'ADVANCE_PHASE' }
    await handleAction(action)
  }

  const handleDealCards = async () => {
    const action: GameAction = { type: 'DEAL_CARDS' }
    await handleAction(action)
  }

  const handleOfferPlace = async (playerId: number, cards: Card[], faceUpIndex: number) => {
    const action: GameAction = { type: 'PLACE_OFFER', playerId, cards, faceUpIndex }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error placing offer:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleCardPlay = async (playerId: number, card: Card) => {
    const action: GameAction = { type: 'PLAY_ACTION_CARD', playerId, cardId: card.id }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error playing action card:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleCardFlip = async (offerId: number, cardIndex: number) => {
    const action: GameAction = { type: 'FLIP_CARD', offerId, cardIndex }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error flipping card:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleOfferSelect = async (sellerId: number) => {
    const buyerId = gameState.currentBuyerIndex
    const action: GameAction = { type: 'SELECT_OFFER', buyerId, sellerId }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error selecting offer:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleGotchaCardSelect = async (cardId: string) => {
    const action: GameAction = { type: 'SELECT_GOTCHA_CARD', cardId }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error selecting Gotcha card:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleGotchaActionChoice = async (actionChoice: 'steal' | 'discard') => {
    const action: GameAction = { type: 'CHOOSE_GOTCHA_ACTION', action: actionChoice }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error choosing Gotcha action:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleFlipOneCardSelect = async (offerId: number, cardIndex: number) => {
    const action: GameAction = { type: 'SELECT_FLIP_ONE_CARD', offerId, cardIndex }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error selecting card for Flip One:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleAddOneHandCardSelect = async (cardId: string) => {
    const action: GameAction = { type: 'SELECT_ADD_ONE_HAND_CARD', cardId }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error selecting hand card for Add One:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleAddOneOfferSelect = async (offerId: number) => {
    const action: GameAction = { type: 'SELECT_ADD_ONE_OFFER', offerId }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error selecting offer for Add One:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleRemoveOneCardSelect = async (offerId: number, cardIndex: number) => {
    const action: GameAction = { type: 'SELECT_REMOVE_ONE_CARD', offerId, cardIndex }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error selecting card for Remove One:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleRemoveTwoCardSelect = async (offerId: number, cardIndex: number) => {
    const action: GameAction = { type: 'SELECT_REMOVE_TWO_CARD', offerId, cardIndex }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error selecting card for Remove Two:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleDeclareDone = async (playerId: number) => {
    const action: GameAction = { type: 'DECLARE_DONE', playerId }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error declaring done:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const handleStealAPointTargetSelect = async (targetPlayerId: number) => {
    const action: GameAction = { type: 'SELECT_STEAL_A_POINT_TARGET', targetPlayerId }
    try {
      await handleAction(action)
    } catch (error) {
      console.error('Error selecting target for Steal A Point:', error)
      // In a real app, you'd show this error to the user
    }
  }

  const formatPhaseName = (phase: GamePhase): string => {
    const words = phase.replace(/_/g, ' ').split(' ')
    return words.map((word, index) => 
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()
    ).join(' ')
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

  // Function to determine if game actions should be visible
  const shouldShowGameActions = (): boolean => {
    switch (gameState.currentPhase) {
      case GamePhase.DEAL:
        return true // Show deal cards button
      
      case GamePhase.OFFER_SELECTION:
        // Show if there are offers to select
        const sellersWithOffers = gameState.players.filter((player, index) => 
          index !== gameState.currentBuyerIndex && player.offer.length > 0
        )
        return sellersWithOffers.length > 0
      
      case GamePhase.GOTCHA_TRADEINS:
        // Show if there's an active Gotcha effect requiring user input
        return gameState.gotchaEffectState !== null
      
      case GamePhase.ACTION_PHASE:
        // Show if there's any pending action card effect requiring user input
        return !!(
          gameState.flipOneEffectState?.awaitingCardSelection ||
          gameState.addOneEffectState?.awaitingHandCardSelection ||
          gameState.addOneEffectState?.awaitingOfferSelection ||
          gameState.removeOneEffectState?.awaitingCardSelection ||
          gameState.removeTwoEffectState?.awaitingCardSelection ||
          gameState.stealAPointEffectState?.awaitingTargetSelection
        )
      
      case GamePhase.BUYER_ASSIGNMENT:
      case GamePhase.OFFER_DISTRIBUTION:
      case GamePhase.THING_TRADEINS:
      case GamePhase.WINNER_DETERMINATION:
      case GamePhase.OFFER_PHASE:
      case GamePhase.BUYER_FLIP:
      default:
        return false // No user interaction required
    }
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
        return null // Debug controls moved to AdminFooter
      
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
          return null // Debug controls moved to AdminFooter
        }
      
      case GamePhase.ACTION_PHASE:
        // Check if there's a pending Flip One effect
        if (gameState.flipOneEffectState && gameState.flipOneEffectState?.awaitingCardSelection === true) {
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
          
          if (gameState.addOneEffectState?.awaitingHandCardSelection === true) {
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
          
          if (gameState.addOneEffectState?.awaitingOfferSelection === true) {
            const selectedCard = gameState.addOneEffectState?.selectedHandCard
            return (
              <div className="add-one-effect-controls">
                <div className="add-one-effect-header">
                  <strong>{addOnePlayer?.name}</strong> selected a card: Now select an offer to add it to
                </div>
                <div className="add-one-selection-info">
                  <span>Click on any offer below to add the card face-down</span>
                </div>
              </div>
            )
          }
        }
        
        // Check if there's a pending Remove One effect
        if (gameState.removeOneEffectState && gameState.removeOneEffectState?.awaitingCardSelection === true) {
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
        
        // Check if there's a pending Remove Two effect
        if (gameState.removeTwoEffectState && gameState.removeTwoEffectState?.awaitingCardSelection === true) {
          const removeTwoPlayer = gameState.players[gameState.removeTwoEffectState.playerId]
          const cardsRemaining = gameState.removeTwoEffectState.cardsToSelect
          const cardsSelected = 2 - cardsRemaining
          
          return (
            <div className="remove-two-effect-controls">
              <div className="remove-two-effect-header">
                <strong>{removeTwoPlayer?.name}</strong> played Remove Two: Select exactly 2 cards from any offers to remove
              </div>
              <div className="remove-two-selection-info">
                <span>Cards selected: {cardsSelected} / 2</span>
                <span>Click on cards in the offers below to discard them</span>
              </div>
            </div>
          )
        }
        
        // Check if there's a pending Steal A Point effect
        if (gameState.stealAPointEffectState && gameState.stealAPointEffectState?.awaitingTargetSelection === true) {
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
        
        return null // No interactive actions needed
      
      default:
        return null // No interactive actions needed
    }
  }

  const getDebugControls = () => {
    const needsContinueButton = [
      GamePhase.BUYER_ASSIGNMENT,
      GamePhase.OFFER_DISTRIBUTION,
      GamePhase.THING_TRADEINS,
      GamePhase.WINNER_DETERMINATION
    ].includes(gameState.currentPhase)

    const needsSkipButton = [
      GamePhase.OFFER_SELECTION,
      GamePhase.ACTION_PHASE
    ].includes(gameState.currentPhase)

    const needsGotchaContinue = gameState.currentPhase === GamePhase.GOTCHA_TRADEINS && !gameState.gotchaEffectState

    return (
      <div className="debug-controls">
        {/* Only show perspective selector in local mode or for host in multiplayer */}
        {(multiplayerState.mode === 'local' || multiplayerState.isHost) && (
          <div className="debug-section">
            <label>View Perspective:</label>
            <PerspectiveSelector
              players={gameState.players}
              selectedPerspective={gameState.selectedPerspective}
              autoFollowPerspective={gameState.autoFollowPerspective}
              onPerspectiveChange={handlePerspectiveChange}
              onToggleAutoFollow={handleToggleAutoFollow}
            />
          </div>
        )}
        
        {/* Only show debug buttons for host in multiplayer mode or in local mode */}
        {(multiplayerState.mode === 'local' || multiplayerState.isHost) && (
          <div className="debug-section">
            <div className="debug-buttons">
              {(needsContinueButton || needsGotchaContinue) && (
                <button onClick={handleAdvancePhase} className="action-button debug-button">
                  Continue to Next Phase
                </button>
              )}
              {needsSkipButton && (
                <button onClick={handleAdvancePhase} className="action-button secondary debug-button">
                  Skip Phase (Debug)
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Show connection status in multiplayer mode */}
        {multiplayerState.mode === 'multiplayer' && (
          <div className="debug-section">
            <div className="connection-status">
              <span className={`status-indicator ${multiplayerState.connectionStatus}`}>
                {multiplayerState.connectionStatus === 'connected' ? '🟢' : 
                 multiplayerState.connectionStatus === 'connecting' ? '🟡' : 
                 multiplayerState.connectionStatus === 'error' ? '🔴' : '⚫'}
              </span>
              <span>Connection: {multiplayerState.connectionStatus}</span>
              {multiplayerState.error && (
                <span className="error-message"> - {multiplayerState.error}</span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Check if game has started - consider both local and multiplayer contexts
  const isGameStarted = multiplayerState.mode === 'multiplayer' 
    ? multiplayerState.gameStarted 
    : (gameState.gameStarted || localGameStarting) // Include local starting flag

  if (!isGameStarted) {
    return <HomeScreen 
      onStartGame={handleStartGame} 
      onEnterLobby={() => {
        // This shouldn't be called from GameBoard context since we're already in a game
        console.warn('onEnterLobby called from GameBoard context - this should not happen')
      }} 
    />
  }

  return (
    <div className="game-board">
      {/* Enhanced Game Header with Three-Column Layout */}
      <div className="game-header">
        {/* Left Column: Title + Round */}
        <div className="header-left-column">
          <div className="header-title">
            <h1>Offer Up</h1>
          </div>
          <div className="header-round">
            Round {gameState.round}
          </div>
        </div>
        
        {/* Center Column: Phase Name + Buyer/Player Status */}
        <div className="header-center-column">
          <div className="header-phase-name">
            <strong>{formatPhaseName(gameState.currentPhase)}</strong>
          </div>
          <div className="header-game-status">
            {getGameStatus()}
          </div>
        </div>
        
        {/* Right Column: Draw/Discard Counts + Cards in Play/Highest Score */}
        <div className="header-right-column">
          <div className="header-card-counts">
            <div className="count-item">
              <span>Draw Pile: {gameState.drawPile.length}</span>
            </div>
            <div className="count-item">
              <span>Discard Pile: {gameState.discardPile.length}</span>
            </div>
          </div>
          <div className="header-game-stats">
            <div className="stat-item">
              <span>Cards in Play: {gameState.players.reduce((total, player) => 
                total + player.hand.length + player.collection.length + player.offer.length, 0
              )}</span>
            </div>
            <div className="stat-item">
              <span>Highest Score: {Math.max(...gameState.players.map(p => p.points), 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Winner Display */}
      {gameState.winner !== null && (
        <div className="winner-display">
          <div className="winner-announcement">
            <h2>🏆 Game Over! 🏆</h2>
            <div className="winner-info">
              <strong>{gameState.players[gameState.winner].name}</strong> wins with <strong>{gameState.players[gameState.winner].points} points!</strong>
            </div>
            <div className="final-scores">
              <h3>Final Scores:</h3>
              <div className="score-list">
                {gameState.players
                  .map((player, index) => ({ ...player, originalIndex: index }))
                  .sort((a, b) => b.points - a.points)
                  .map((player, rank) => (
                    <div key={player.id} className={`score-item ${player.originalIndex === gameState.winner ? 'winner' : ''}`}>
                      <span className="rank">#{rank + 1}</span>
                      <span className="player-name">{player.name}</span>
                      <span className="player-points">{player.points} points</span>
                      {player.originalIndex === gameState.winner && <span className="crown">👑</span>}
                    </div>
                  ))}
              </div>
            </div>
            <button onClick={handleResetGame} className="new-game-button">
              Start a New Game
            </button>
          </div>
        </div>
      )}

      {/* Contextual Game Actions - Only show when user interaction is required */}
      {shouldShowGameActions() && (
        <div className="game-actions">
          <div className="actions-header">
            <h3>Game Actions</h3>
          </div>
          <div className="actions-content">
            {getPhaseActions()}
          </div>
        </div>
      )}

      {/* Split Player Areas Layout */}
      <div className="player-areas-split">
        {/* Active Player Area (Left Side) */}
        <div className="active-player-area">
          {(() => {
            const activePlayer = gameState.players[gameState.selectedPerspective];
            const activePlayerIndex = gameState.selectedPerspective;
            return (
              <PlayerArea
                key={activePlayer.id}
                player={activePlayer}
                isCurrentPlayer={activePlayerIndex === gameState.currentPlayerIndex}
                isBuyer={activePlayerIndex === gameState.currentBuyerIndex}
                perspective={gameState.selectedPerspective}
                phase={gameState.currentPhase}
                isActivePlayer={true}
                onCardPlay={(card) => handleCardPlay(activePlayer.id, card)}
                onOfferPlace={(cards, faceUpIndex) => handleOfferPlace(activePlayer.id, cards, faceUpIndex)}
                onCardFlip={(cardIndex) => handleCardFlip(activePlayerIndex, cardIndex)}
                onOfferSelect={() => handleOfferSelect(activePlayer.id)}
                onGotchaCardSelect={handleGotchaCardSelect}
                onFlipOneCardSelect={(cardIndex) => handleFlipOneCardSelect(activePlayerIndex, cardIndex)}
                onAddOneHandCardSelect={handleAddOneHandCardSelect}
                onAddOneOfferSelect={() => handleAddOneOfferSelect(activePlayerIndex)}
                canFlipCards={gameState.currentPhase === GamePhase.BUYER_FLIP && gameState.selectedPerspective === gameState.currentBuyerIndex}
                canSelectOffer={gameState.currentPhase === GamePhase.OFFER_SELECTION && gameState.selectedPerspective === gameState.currentBuyerIndex && activePlayerIndex !== gameState.currentBuyerIndex && activePlayer.offer.length > 0}
                canSelectGotchaCards={
                  gameState.currentPhase === GamePhase.GOTCHA_TRADEINS &&
                  gameState.gotchaEffectState !== null &&
                  !gameState.gotchaEffectState?.awaitingBuyerChoice &&
                  gameState.gotchaEffectState.affectedPlayerIndex === activePlayerIndex &&
                  gameState.selectedPerspective === gameState.currentBuyerIndex
                }
                canSelectFlipOneCards={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.flipOneEffectState !== null &&
                  gameState.flipOneEffectState?.awaitingCardSelection === true &&
                  activePlayerIndex !== gameState.currentBuyerIndex &&
                  activePlayer.offer.length > 0
                }
                canSelectAddOneHandCards={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.addOneEffectState !== null &&
                  gameState.addOneEffectState?.awaitingHandCardSelection === true &&
                  activePlayerIndex === gameState.addOneEffectState.playerId &&
                  gameState.selectedPerspective === gameState.addOneEffectState.playerId
                }
                canSelectAddOneOffers={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.addOneEffectState !== null &&
                  gameState.addOneEffectState?.awaitingOfferSelection === true &&
                  activePlayerIndex !== gameState.currentBuyerIndex &&
                  activePlayer.offer.length > 0
                }
                onRemoveOneCardSelect={(cardIndex) => handleRemoveOneCardSelect(activePlayerIndex, cardIndex)}
                canSelectRemoveOneCards={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.removeOneEffectState !== null &&
                  gameState.removeOneEffectState?.awaitingCardSelection === true &&
                  activePlayerIndex !== gameState.currentBuyerIndex &&
                  activePlayer.offer.length > 0
                }
                onRemoveTwoCardSelect={(cardIndex) => handleRemoveTwoCardSelect(activePlayerIndex, cardIndex)}
                canSelectRemoveTwoCards={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.removeTwoEffectState !== null &&
                  gameState.removeTwoEffectState?.awaitingCardSelection === true &&
                  activePlayerIndex !== gameState.currentBuyerIndex &&
                  activePlayer.offer.length > 0
                }
                onDeclareDone={() => handleDeclareDone(activePlayer.id)}
                isDone={gameState.actionPhaseDoneStates[activePlayerIndex] || false}
                canDeclareDone={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.selectedPerspective === activePlayer.id &&
                  activePlayer.collection.some(card => card.type === 'action') &&
                  !(gameState.actionPhaseDoneStates[activePlayerIndex] || false)
                }
              />
            );
          })()}
        </div>

        {/* Other Players Area (Right Side) */}
        <div className="other-players-area">
          {gameState.players
            .map((player, index) => ({ player, index }))
            .filter(({ index }) => index !== gameState.selectedPerspective)
            .map(({ player, index }) => (
              <PlayerArea
                key={player.id}
                player={player}
                isCurrentPlayer={false}
                isBuyer={index === gameState.currentBuyerIndex}
                perspective={gameState.selectedPerspective}
                phase={gameState.currentPhase}
                isActivePlayer={false}
                onCardPlay={(card) => handleCardPlay(player.id, card)}
                onOfferPlace={(cards, faceUpIndex) => handleOfferPlace(player.id, cards, faceUpIndex)}
                onCardFlip={(cardIndex) => handleCardFlip(index, cardIndex)}
                onOfferSelect={() => handleOfferSelect(player.id)}
                onGotchaCardSelect={handleGotchaCardSelect}
                onFlipOneCardSelect={(cardIndex) => handleFlipOneCardSelect(index, cardIndex)}
                onAddOneHandCardSelect={handleAddOneHandCardSelect}
                onAddOneOfferSelect={() => handleAddOneOfferSelect(index)}
                canFlipCards={gameState.currentPhase === GamePhase.BUYER_FLIP && gameState.selectedPerspective === gameState.currentBuyerIndex}
                canSelectOffer={gameState.currentPhase === GamePhase.OFFER_SELECTION && gameState.selectedPerspective === gameState.currentBuyerIndex && index !== gameState.currentBuyerIndex && player.offer.length > 0}
                canSelectGotchaCards={
                  gameState.currentPhase === GamePhase.GOTCHA_TRADEINS &&
                  gameState.gotchaEffectState !== null &&
                  !gameState.gotchaEffectState?.awaitingBuyerChoice &&
                  gameState.gotchaEffectState.affectedPlayerIndex === index &&
                  gameState.selectedPerspective === gameState.currentBuyerIndex
                }
                canSelectFlipOneCards={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.flipOneEffectState !== null &&
                  gameState.flipOneEffectState?.awaitingCardSelection === true &&
                  index !== gameState.currentBuyerIndex &&
                  player.offer.length > 0
                }
                canSelectAddOneHandCards={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.addOneEffectState !== null &&
                  gameState.addOneEffectState?.awaitingHandCardSelection === true &&
                  index === gameState.addOneEffectState.playerId &&
                  gameState.selectedPerspective === gameState.addOneEffectState.playerId
                }
                canSelectAddOneOffers={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.addOneEffectState !== null &&
                  gameState.addOneEffectState?.awaitingOfferSelection === true &&
                  index !== gameState.currentBuyerIndex &&
                  player.offer.length > 0
                }
                onRemoveOneCardSelect={(cardIndex) => handleRemoveOneCardSelect(index, cardIndex)}
                canSelectRemoveOneCards={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.removeOneEffectState !== null &&
                  gameState.removeOneEffectState?.awaitingCardSelection === true &&
                  index !== gameState.currentBuyerIndex &&
                  player.offer.length > 0
                }
                onRemoveTwoCardSelect={(cardIndex) => handleRemoveTwoCardSelect(index, cardIndex)}
                canSelectRemoveTwoCards={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.removeTwoEffectState !== null &&
                  gameState.removeTwoEffectState?.awaitingCardSelection === true &&
                  index !== gameState.currentBuyerIndex &&
                  player.offer.length > 0
                }
                onDeclareDone={() => handleDeclareDone(player.id)}
                isDone={gameState.actionPhaseDoneStates[index] || false}
                canDeclareDone={
                  gameState.currentPhase === GamePhase.ACTION_PHASE &&
                  gameState.selectedPerspective === player.id &&
                  player.collection.some(card => card.type === 'action') &&
                  !(gameState.actionPhaseDoneStates[index] || false)
                }
              />
            ))}
        </div>
      </div>



      {/* Admin Footer with Debug Controls */}
      <AdminFooter>
        {getDebugControls()}
      </AdminFooter>
    </div>
  )
}