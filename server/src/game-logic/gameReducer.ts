import { GameState, GameAction, GamePhase, Player, Card } from '../types'
import { createShuffledDeck, shuffleArray } from './cards'

/**
 * Server-side game reducer for processing multiplayer game actions
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  // For now, we'll implement a basic version that handles the most common actions
  // This will be expanded as we implement more of the game logic
  
  switch (action.type) {
    case 'DEAL_CARDS':
      return dealCards(state)
    
    case 'ADVANCE_PHASE':
      return advancePhase(state)
    
    case 'PLACE_OFFER':
      return placeOffer(state, action.playerId, action.cards, action.faceUpIndex)
    
    case 'SELECT_OFFER':
      return selectOffer(state, action.buyerId, action.sellerId)
    
    case 'FLIP_CARD':
      return flipCard(state, action.offerId, action.cardIndex)
    
    case 'PLAY_ACTION_CARD':
      return playActionCard(state, action.playerId, action.cardId)
    
    case 'DECLARE_DONE':
      return declareDone(state, action.playerId)
    
    // Add more actions as needed
    default:
      console.warn(`Unhandled action type: ${action.type}`)
      return state
  }
}

/**
 * Deal cards to all players
 */
function dealCards(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.DEAL) {
    return state
  }

  const newState = { ...state }
  const cardsPerPlayer = 7

  // Deal cards to each player
  newState.players = newState.players.map(player => ({
    ...player,
    hand: newState.drawPile.slice(0, cardsPerPlayer)
  }))

  // Remove dealt cards from draw pile
  newState.drawPile = newState.drawPile.slice(cardsPerPlayer * newState.players.length)
  
  // Advance to next phase
  newState.currentPhase = GamePhase.OFFER_PHASE
  
  return newState
}

/**
 * Advance to the next game phase
 */
function advancePhase(state: GameState): GameState {
  const newState = { ...state }
  
  switch (state.currentPhase) {
    case GamePhase.BUYER_ASSIGNMENT:
      newState.currentPhase = GamePhase.DEAL
      break
    
    case GamePhase.DEAL:
      newState.currentPhase = GamePhase.OFFER_PHASE
      break
    
    case GamePhase.OFFER_PHASE:
      newState.currentPhase = GamePhase.OFFER_SELECTION
      break
    
    case GamePhase.OFFER_SELECTION:
      newState.currentPhase = GamePhase.BUYER_FLIP
      break
    
    case GamePhase.BUYER_FLIP:
      newState.currentPhase = GamePhase.OFFER_DISTRIBUTION
      break
    
    case GamePhase.OFFER_DISTRIBUTION:
      newState.currentPhase = GamePhase.THING_TRADEINS
      break
    
    case GamePhase.THING_TRADEINS:
      newState.currentPhase = GamePhase.GOTCHA_TRADEINS
      break
    
    case GamePhase.GOTCHA_TRADEINS:
      newState.currentPhase = GamePhase.ACTION_PHASE
      break
    
    case GamePhase.ACTION_PHASE:
      newState.currentPhase = GamePhase.WINNER_DETERMINATION
      break
    
    case GamePhase.WINNER_DETERMINATION:
      // Check if game should end or continue to next round
      const maxPoints = Math.max(...newState.players.map(p => p.points))
      if (maxPoints >= 10) {
        // Game ends
        const winnerIndex = newState.players.findIndex(p => p.points === maxPoints)
        newState.winner = winnerIndex
      } else {
        // Next round
        newState.round += 1
        newState.currentPhase = GamePhase.BUYER_ASSIGNMENT
        newState.currentBuyerIndex = (newState.currentBuyerIndex + 1) % newState.players.length
      }
      break
    
    default:
      break
  }
  
  return newState
}

/**
 * Place an offer for a player
 */
function placeOffer(state: GameState, playerId: number, cards: Card[], faceUpIndex: number): GameState {
  if (state.currentPhase !== GamePhase.OFFER_PHASE) {
    return state
  }

  const newState = { ...state }
  const playerIndex = newState.players.findIndex(p => p.id === playerId)
  
  if (playerIndex === -1) {
    return state
  }

  // Set the offer
  newState.players[playerIndex] = {
    ...newState.players[playerIndex],
    offer: cards.map((card, index) => ({
      ...card,
      faceUp: index === faceUpIndex
    }))
  }

  // Remove cards from hand
  const cardIds = cards.map(c => c.id)
  newState.players[playerIndex].hand = newState.players[playerIndex].hand.filter(
    card => !cardIds.includes(card.id)
  )

  return newState
}

/**
 * Select an offer (buyer chooses which offer to buy)
 */
function selectOffer(state: GameState, buyerId: number, sellerId: number): GameState {
  if (state.currentPhase !== GamePhase.OFFER_SELECTION) {
    return state
  }

  const newState = { ...state }
  const sellerIndex = newState.players.findIndex(p => p.id === sellerId)
  
  if (sellerIndex === -1) {
    return state
  }

  // Mark the selected offer (this would be used in subsequent phases)
  // For now, just advance the phase
  newState.currentPhase = GamePhase.BUYER_FLIP
  
  return newState
}

/**
 * Flip a card in an offer
 */
function flipCard(state: GameState, offerId: number, cardIndex: number): GameState {
  if (state.currentPhase !== GamePhase.BUYER_FLIP) {
    return state
  }

  const newState = { ...state }
  
  if (offerId < newState.players.length && cardIndex < newState.players[offerId].offer.length) {
    newState.players[offerId].offer[cardIndex] = {
      ...newState.players[offerId].offer[cardIndex],
      faceUp: true
    }
  }

  return newState
}

/**
 * Play an action card
 */
function playActionCard(state: GameState, playerId: number, cardId: string): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE) {
    return state
  }

  const newState = { ...state }
  const playerIndex = newState.players.findIndex(p => p.id === playerId)
  
  if (playerIndex === -1) {
    return state
  }

  // Find and remove the card from player's collection
  const cardIndex = newState.players[playerIndex].collection.findIndex(c => c.id === cardId)
  if (cardIndex === -1) {
    return state
  }

  const card = newState.players[playerIndex].collection[cardIndex]
  newState.players[playerIndex].collection.splice(cardIndex, 1)
  
  // Add to discard pile
  newState.discardPile.push(card)

  // Handle specific action card effects (simplified for now)
  // This would need to be expanded with the full action card logic
  
  return newState
}

/**
 * Declare done for action phase
 */
function declareDone(state: GameState, playerId: number): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE) {
    return state
  }

  const newState = { ...state }
  const playerIndex = newState.players.findIndex(p => p.id === playerId)
  
  if (playerIndex === -1) {
    return state
  }

  // Mark player as done
  newState.actionPhaseDoneStates[playerIndex] = true

  // Check if all players are done
  const allDone = newState.actionPhaseDoneStates.every(done => done)
  if (allDone) {
    newState.currentPhase = GamePhase.WINNER_DETERMINATION
  }

  return newState
}

/**
 * Initialize game state for multiplayer
 */
export function initializeMultiplayerGame(playerNames: string[]): GameState {
  const players = playerNames.map((name, index) => ({
    id: index,
    name,
    hand: [],
    offer: [],
    collection: [],
    points: 0,
    hasMoney: false
  }))

  const deck = createShuffledDeck()
  
  return {
    players,
    currentBuyerIndex: 0,
    nextBuyerIndex: 1,
    currentPhase: GamePhase.BUYER_ASSIGNMENT,
    currentPlayerIndex: 0,
    round: 1,
    drawPile: deck,
    discardPile: [],
    actionPhaseDoneStates: new Array(players.length).fill(false),
    gotchaEffectState: null,
    flipOneEffectState: null,
    addOneEffectState: null,
    removeOneEffectState: null,
    removeTwoEffectState: null,
    stealAPointEffectState: null,
    selectedPerspective: 0,
    phaseInstructions: 'Game starting...',
    autoFollowPerspective: true,
    winner: null,
    gameStarted: true
  }
}