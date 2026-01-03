import { GameState, GameAction, GamePhase, Player, Card, OfferCard } from '../types'
import { createShuffledDeck, shuffleArray } from './cards'

/**
 * Randomly selects a buyer from the players
 */
export function selectRandomBuyer(playerCount: number): number {
  return Math.floor(Math.random() * playerCount)
}

/**
 * Server-side game reducer for processing multiplayer game actions
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  // Prevent any actions if game is over (winner declared), except perspective changes and reset
  if (state.winner !== null && action.type !== 'CHANGE_PERSPECTIVE' && action.type !== 'RESET_GAME') {
    return state
  }

  // Validate phase-specific actions
  if (!validatePhaseAction(state.currentPhase, action)) {
    throw new Error(`Action ${action.type} is not allowed during phase ${state.currentPhase}`)
  }
  
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
    
    case 'SELECT_GOTCHA_CARD':
      return selectGotchaCard(state, action.cardId)
    
    case 'CHOOSE_GOTCHA_ACTION':
      return chooseGotchaAction(state, action.action)
    
    case 'SELECT_FLIP_ONE_CARD':
      return selectFlipOneCard(state, action.offerId, action.cardIndex)
    
    case 'SELECT_ADD_ONE_HAND_CARD':
      return selectAddOneHandCard(state, action.cardId)
    
    case 'SELECT_ADD_ONE_OFFER':
      return selectAddOneOffer(state, action.offerId)
    
    case 'SELECT_REMOVE_ONE_CARD':
      return selectRemoveOneCard(state, action.offerId, action.cardIndex)
    
    case 'SELECT_REMOVE_TWO_CARD':
      return selectRemoveTwoCard(state, action.offerId, action.cardIndex)
    
    case 'SELECT_STEAL_A_POINT_TARGET':
      return selectStealAPointTarget(state, action.targetPlayerId)
    
    // Add more actions as needed
    default:
      console.warn(`Unhandled action type: ${action.type}`)
      return state
  }
}

/**
 * Validates if an action is allowed in the current phase
 */
function validatePhaseAction(phase: GamePhase, action: GameAction): boolean {
  switch (action.type) {
    case 'DEAL_CARDS':
      return phase === GamePhase.DEAL
    
    case 'ADVANCE_PHASE':
      return true // Always allowed
    
    case 'PLACE_OFFER':
      return phase === GamePhase.OFFER_PHASE
    
    case 'FLIP_CARD':
      return phase === GamePhase.BUYER_FLIP
    
    case 'PLAY_ACTION_CARD':
      return phase === GamePhase.ACTION_PHASE
    
    case 'SELECT_OFFER':
      return phase === GamePhase.OFFER_SELECTION
    
    case 'DECLARE_DONE':
      return phase === GamePhase.ACTION_PHASE || phase === GamePhase.OFFER_PHASE
    
    case 'SELECT_GOTCHA_CARD':
    case 'CHOOSE_GOTCHA_ACTION':
      return phase === GamePhase.GOTCHA_TRADEINS
    
    case 'SELECT_FLIP_ONE_CARD':
    case 'SELECT_ADD_ONE_HAND_CARD':
    case 'SELECT_ADD_ONE_OFFER':
    case 'SELECT_REMOVE_ONE_CARD':
    case 'SELECT_REMOVE_TWO_CARD':
    case 'SELECT_STEAL_A_POINT_TARGET':
      return phase === GamePhase.ACTION_PHASE
    
    default:
      return true
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
  const cardsPerPlayer = 5 // Deal 5 cards per player initially

  // Deal cards sequentially to each player
  let cardIndex = 0
  newState.players = newState.players.map(player => {
    const playerCards = newState.drawPile.slice(cardIndex, cardIndex + cardsPerPlayer)
    cardIndex += cardsPerPlayer
    return {
      ...player,
      hand: playerCards
    }
  })

  // Remove dealt cards from draw pile
  newState.drawPile = newState.drawPile.slice(cardIndex)
  
  // Advance to next phase
  newState.currentPhase = GamePhase.OFFER_PHASE
  newState.phaseInstructions = 'Place your offers (3 cards, 1 face up)'
  
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
      newState.phaseInstructions = 'Dealing cards to all players...'
      break
    
    case GamePhase.DEAL:
      newState.currentPhase = GamePhase.OFFER_PHASE
      newState.phaseInstructions = 'Place your offers (3 cards, 1 face up)'
      break
    
    case GamePhase.OFFER_PHASE:
      newState.currentPhase = GamePhase.BUYER_FLIP
      newState.phaseInstructions = 'Buyer: Flip cards to see what you want to buy'
      break
    
    case GamePhase.BUYER_FLIP:
      newState.currentPhase = GamePhase.ACTION_PHASE
      newState.phaseInstructions = 'Play action cards or declare done'
      break
    
    case GamePhase.ACTION_PHASE:
      newState.currentPhase = GamePhase.OFFER_SELECTION
      newState.phaseInstructions = 'Buyer: Select which offer to purchase'
      break
    
    case GamePhase.OFFER_SELECTION:
      newState.currentPhase = GamePhase.OFFER_DISTRIBUTION
      newState.phaseInstructions = 'Distributing purchased offer...'
      break
    
    case GamePhase.OFFER_DISTRIBUTION:
      newState.currentPhase = GamePhase.GOTCHA_TRADEINS
      newState.phaseInstructions = 'Processing Gotcha card effects...'
      break
    
    case GamePhase.GOTCHA_TRADEINS:
      newState.currentPhase = GamePhase.THING_TRADEINS
      newState.phaseInstructions = 'Processing Thing card sets...'
      break
    
    case GamePhase.THING_TRADEINS:
      newState.currentPhase = GamePhase.WINNER_DETERMINATION
      newState.phaseInstructions = 'Checking for winner...'
      break
    
    case GamePhase.WINNER_DETERMINATION:
      // Check if game should end or continue to next round
      const maxPoints = Math.max(...newState.players.map(p => p.points))
      if (maxPoints >= 5) {
        // Game ends
        const winnerIndex = newState.players.findIndex(p => p.points === maxPoints)
        newState.winner = winnerIndex
        newState.phaseInstructions = `Game Over! ${newState.players[winnerIndex].name} wins!`
      } else {
        // Next round
        newState.round += 1
        newState.currentPhase = GamePhase.BUYER_ASSIGNMENT
        newState.currentBuyerIndex = (newState.currentBuyerIndex + 1) % newState.players.length
        newState.phaseInstructions = 'Starting next round...'
        
        // Reset action phase done states
        newState.actionPhaseDoneStates = new Array(newState.players.length).fill(false)
        
        // Clear all offers
        newState.players = newState.players.map(player => ({
          ...player,
          offer: []
        }))
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
  
  if (playerIndex === -1 || playerIndex === state.currentBuyerIndex) {
    return state // Invalid player or buyer can't place offers
  }

  // Validate offer has exactly 3 cards
  if (cards.length !== 3) {
    return state
  }

  // Set the offer with face up/down state
  const offer: OfferCard[] = cards.map((card, index) => ({
    ...card,
    faceUp: index === faceUpIndex,
    position: index
  }))

  newState.players[playerIndex] = {
    ...newState.players[playerIndex],
    offer
  }

  // Remove cards from hand
  const cardIds = cards.map(c => c.id)
  newState.players[playerIndex].hand = newState.players[playerIndex].hand.filter(
    card => !cardIds.includes(card.id)
  )

  // Check if all sellers have placed offers
  const sellers = newState.players.filter((_, index) => index !== state.currentBuyerIndex)
  const allOffersPlaced = sellers.every(seller => seller.offer.length === 3)
  
  if (allOffersPlaced) {
    // Automatically advance to buyer flip phase
    newState.currentPhase = GamePhase.BUYER_FLIP
    newState.phaseInstructions = 'Buyer: Flip cards to see what you want to buy'
  }

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
  const buyerIndex = newState.players.findIndex(p => p.id === buyerId)
  
  if (sellerIndex === -1 || buyerIndex === -1 || buyerIndex !== state.currentBuyerIndex) {
    return state
  }

  const seller = newState.players[sellerIndex]
  const buyer = newState.players[buyerIndex]

  // Transfer offer to buyer's collection
  newState.players[buyerIndex] = {
    ...buyer,
    collection: [...buyer.collection, ...seller.offer.map(offerCard => ({
      id: offerCard.id,
      type: offerCard.type,
      subtype: offerCard.subtype,
      name: offerCard.name,
      setSize: offerCard.setSize,
      effect: offerCard.effect
    }))]
  }

  // Clear seller's offer
  newState.players[sellerIndex] = {
    ...seller,
    offer: []
  }

  // Advance to next phase
  newState.currentPhase = GamePhase.OFFER_DISTRIBUTION
  newState.phaseInstructions = 'Distributing purchased offer...'
  
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
    const offer = [...newState.players[offerId].offer]
    offer[cardIndex] = {
      ...offer[cardIndex],
      faceUp: true
    }
    
    newState.players[offerId] = {
      ...newState.players[offerId],
      offer
    }
  }

  // Automatically advance to action phase after flip with proper initialization
  return advanceToNextPhaseWithInitialization(newState)
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

  // Handle specific action card effects
  switch (card.name) {
    case 'Flip One':
      newState.flipOneEffectState = {
        playerId,
        awaitingCardSelection: true
      }
      break
    
    case 'Add One':
      newState.addOneEffectState = {
        playerId,
        awaitingHandCardSelection: true,
        awaitingOfferSelection: false
      }
      break
    
    case 'Remove One':
      newState.removeOneEffectState = {
        playerId,
        awaitingCardSelection: true
      }
      break
    
    case 'Remove Two':
      newState.removeTwoEffectState = {
        playerId,
        awaitingCardSelection: true,
        selectedCards: [],
        cardsToSelect: 2
      }
      break
    
    case 'Steal A Point':
      newState.stealAPointEffectState = {
        playerId,
        awaitingTargetSelection: true
      }
      break
    
    default:
      // Unknown action card, just discard it
      break
  }
  
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
    newState.currentPhase = GamePhase.OFFER_SELECTION
    newState.phaseInstructions = 'Buyer: Select which offer to purchase'
  }

  return newState
}

/**
 * Select a Gotcha card from a player's collection
 */
function selectGotchaCard(state: GameState, cardId: string): GameState {
  if (state.currentPhase !== GamePhase.GOTCHA_TRADEINS || !state.gotchaEffectState) {
    return state
  }

  const newState = { ...state }
  const affectedPlayer = newState.players[state.gotchaEffectState.affectedPlayerIndex]
  const card = affectedPlayer.collection.find(c => c.id === cardId)
  
  if (!card) {
    return state
  }

  // Add card to selected cards
  newState.gotchaEffectState = {
    ...state.gotchaEffectState,
    selectedCards: [...state.gotchaEffectState.selectedCards, card]
  }

  // Check if we have enough cards selected
  if (newState.gotchaEffectState.selectedCards.length >= newState.gotchaEffectState.cardsToSelect) {
    newState.gotchaEffectState.awaitingBuyerChoice = true
  }

  return newState
}

/**
 * Choose what to do with selected Gotcha cards
 */
function chooseGotchaAction(state: GameState, action: 'steal' | 'discard'): GameState {
  if (state.currentPhase !== GamePhase.GOTCHA_TRADEINS || !state.gotchaEffectState) {
    return state
  }

  const newState = { ...state }
  const buyer = newState.players[state.currentBuyerIndex]
  const affectedPlayer = newState.players[state.gotchaEffectState.affectedPlayerIndex]

  // Process the selected cards
  for (const card of state.gotchaEffectState.selectedCards) {
    // Remove from affected player's collection
    const cardIndex = affectedPlayer.collection.findIndex(c => c.id === card.id)
    if (cardIndex !== -1) {
      newState.players[state.gotchaEffectState.affectedPlayerIndex].collection.splice(cardIndex, 1)
      
      if (action === 'steal' && state.gotchaEffectState.affectedPlayerIndex !== state.currentBuyerIndex) {
        // Add to buyer's collection
        newState.players[state.currentBuyerIndex].collection.push(card)
      } else {
        // Discard the card
        newState.discardPile.push(card)
      }
    }
  }

  // Clear the Gotcha effect
  newState.gotchaEffectState = null

  return newState
}

/**
 * Select a card for Flip One effect
 */
function selectFlipOneCard(state: GameState, offerId: number, cardIndex: number): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE || !state.flipOneEffectState) {
    return state
  }

  const newState = { ...state }
  
  // Flip the selected card
  if (offerId < newState.players.length && cardIndex < newState.players[offerId].offer.length) {
    const offer = [...newState.players[offerId].offer]
    offer[cardIndex] = {
      ...offer[cardIndex],
      faceUp: true
    }
    
    newState.players[offerId] = {
      ...newState.players[offerId],
      offer
    }
  }

  // Clear the effect
  newState.flipOneEffectState = null

  return newState
}

/**
 * Select a hand card for Add One effect
 */
function selectAddOneHandCard(state: GameState, cardId: string): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE || !state.addOneEffectState) {
    return state
  }

  const newState = { ...state }
  const player = newState.players[state.addOneEffectState.playerId]
  const card = player.hand.find(c => c.id === cardId)
  
  if (!card) {
    return state
  }

  // Store the selected card and move to offer selection
  newState.addOneEffectState = {
    ...state.addOneEffectState,
    selectedHandCard: card,
    awaitingHandCardSelection: false,
    awaitingOfferSelection: true
  }

  return newState
}

/**
 * Select an offer for Add One effect
 */
function selectAddOneOffer(state: GameState, offerId: number): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE || !state.addOneEffectState || !state.addOneEffectState.selectedHandCard) {
    return state
  }

  const newState = { ...state }
  const selectedCard = state.addOneEffectState.selectedHandCard
  
  // Remove card from player's hand
  const playerIndex = state.addOneEffectState.playerId
  newState.players[playerIndex].hand = newState.players[playerIndex].hand.filter(c => c.id !== selectedCard.id)
  
  // Add card to the selected offer (face down)
  if (offerId < newState.players.length) {
    const offerCard: OfferCard = {
      ...selectedCard,
      faceUp: false,
      position: newState.players[offerId].offer.length
    }
    
    newState.players[offerId].offer.push(offerCard)
  }

  // Clear the effect
  newState.addOneEffectState = null

  return newState
}

/**
 * Select a card for Remove One effect
 */
function selectRemoveOneCard(state: GameState, offerId: number, cardIndex: number): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE || !state.removeOneEffectState) {
    return state
  }

  const newState = { ...state }
  
  // Remove the selected card
  if (offerId < newState.players.length && cardIndex < newState.players[offerId].offer.length) {
    const removedCard = newState.players[offerId].offer[cardIndex]
    newState.players[offerId].offer.splice(cardIndex, 1)
    newState.discardPile.push(removedCard)
  }

  // Clear the effect
  newState.removeOneEffectState = null

  return newState
}

/**
 * Select a card for Remove Two effect
 */
function selectRemoveTwoCard(state: GameState, offerId: number, cardIndex: number): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE || !state.removeTwoEffectState) {
    return state
  }

  const newState = { ...state }
  
  // Remove the selected card
  if (offerId < newState.players.length && cardIndex < newState.players[offerId].offer.length) {
    const removedCard = newState.players[offerId].offer[cardIndex]
    newState.players[offerId].offer.splice(cardIndex, 1)
    newState.discardPile.push(removedCard)
    
    // Update the effect state
    newState.removeTwoEffectState = {
      ...state.removeTwoEffectState,
      selectedCards: [...state.removeTwoEffectState.selectedCards, { offerId, cardIndex }],
      cardsToSelect: state.removeTwoEffectState.cardsToSelect - 1
    }
    
    // Check if we're done
    if (newState.removeTwoEffectState.cardsToSelect <= 0) {
      newState.removeTwoEffectState = null
    }
  }

  return newState
}

/**
 * Select a target for Steal A Point effect
 */
function selectStealAPointTarget(state: GameState, targetPlayerId: number): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE || !state.stealAPointEffectState) {
    return state
  }

  const newState = { ...state }
  const sourcePlayer = newState.players[state.stealAPointEffectState.playerId]
  const targetPlayer = newState.players.find(p => p.id === targetPlayerId)
  
  if (!targetPlayer || targetPlayer.points <= sourcePlayer.points) {
    return state // Invalid target
  }

  // Transfer one point
  newState.players[state.stealAPointEffectState.playerId].points += 1
  newState.players.find(p => p.id === targetPlayerId)!.points -= 1

  // Clear the effect
  newState.stealAPointEffectState = null

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

  // Select random buyer
  const buyerIndex = selectRandomBuyer(players.length)
  
  // Set money bag for buyer
  players[buyerIndex].hasMoney = true

  const deck = createShuffledDeck()
  
  return {
    players,
    currentBuyerIndex: buyerIndex,
    nextBuyerIndex: buyerIndex, // Initially same as current buyer
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
/**
 * Gets the correct phase order for the 10-phase round system
 */
export function getPhaseOrder(): GamePhase[] {
  return [
    GamePhase.BUYER_ASSIGNMENT,
    GamePhase.DEAL,
    GamePhase.OFFER_PHASE,
    GamePhase.BUYER_FLIP,
    GamePhase.ACTION_PHASE,
    GamePhase.OFFER_SELECTION,
    GamePhase.OFFER_DISTRIBUTION,
    GamePhase.GOTCHA_TRADEINS,
    GamePhase.THING_TRADEINS,
    GamePhase.WINNER_DETERMINATION
  ]
}

/**
 * Advances to the next phase in the sequence
 */
export function advanceToNextPhase(currentPhase: GamePhase, currentRound: number): { nextPhase: GamePhase; nextRound: number } {
  const phaseOrder = getPhaseOrder()
  const currentIndex = phaseOrder.indexOf(currentPhase)
  
  if (currentIndex === -1) {
    throw new Error(`Invalid current phase: ${currentPhase}`)
  }
  
  const nextIndex = (currentIndex + 1) % phaseOrder.length
  const nextPhase = phaseOrder[nextIndex]
  
  // If we're going back to buyer assignment, increment round
  const nextRound = nextPhase === GamePhase.BUYER_ASSIGNMENT ? currentRound + 1 : currentRound
  
  return { nextPhase, nextRound }
}

/**
 * Gets instructions for each phase
 */
function getPhaseInstructions(phase: GamePhase): string {
  switch (phase) {
    case GamePhase.BUYER_ASSIGNMENT:
      return 'Buyer assignment: Transferring buyer role to money bag holder...'
    case GamePhase.DEAL:
      return 'Deal phase: Dealing cards to all players...'
    case GamePhase.OFFER_PHASE:
      return 'Offer phase: Sellers place their 3-card offers...'
    case GamePhase.BUYER_FLIP:
      return 'Buyer-flip phase: Buyer flips one face-down card...'
    case GamePhase.ACTION_PHASE:
      return 'Action phase: Players may play action cards...'
    case GamePhase.OFFER_SELECTION:
      return 'Offer selection: Buyer selects one offer...'
    case GamePhase.OFFER_DISTRIBUTION:
      return 'Offer distribution: Distributing cards and money bag...'
    case GamePhase.GOTCHA_TRADEINS:
      return 'Gotcha trade-ins: Processing Gotcha card effects...'
    case GamePhase.THING_TRADEINS:
      return 'Thing trade-ins: Converting complete sets to points...'
    case GamePhase.WINNER_DETERMINATION:
      return 'Winner determination: Checking for game winner...'
    default:
      return 'Unknown phase'
  }
}

/**
 * Advance to the next phase with proper initialization
 * @param state Current game state
 * @returns Updated state with advanced phase and action phase initialized if needed
 */
export function advanceToNextPhaseWithInitialization(state: GameState): GameState {
  const { nextPhase, nextRound } = advanceToNextPhase(state.currentPhase, state.round)
  
  // Create state with advanced phase
  const stateWithNewPhase = {
    ...state,
    currentPhase: nextPhase,
    round: nextRound,
    phaseInstructions: getPhaseInstructions(nextPhase)
  }
  
  // Initialize special phases if we're entering them
  let stateWithInitializedPhase = stateWithNewPhase
  if (nextPhase === GamePhase.ACTION_PHASE) {
    stateWithInitializedPhase = initializeActionPhase(stateWithNewPhase)
  } else if (nextPhase === GamePhase.DEAL) {
    // Automatically handle deal phase
    stateWithInitializedPhase = handleDealPhase(stateWithNewPhase)
  } else if (nextPhase === GamePhase.GOTCHA_TRADEINS) {
    // Process Gotcha trade-ins
    const stateAfterGotcha = handleGotchaTradeinsPhase(stateWithNewPhase)
    
    // If there's a pending Gotcha effect, wait for buyer interaction
    if (stateAfterGotcha.gotchaEffectState !== null) {
      stateWithInitializedPhase = stateAfterGotcha
    } else {
      // No pending effects - automatically advance to Thing trade-ins
      stateWithInitializedPhase = advanceToNextPhaseWithInitialization(stateAfterGotcha)
    }
  } else if (nextPhase === GamePhase.THING_TRADEINS) {
    // Process Thing trade-ins and automatically advance to next phase
    const stateAfterThings = handleThingTradeinsPhase(stateWithNewPhase)
    stateWithInitializedPhase = advanceToNextPhaseWithInitialization(stateAfterThings)
  } else if (nextPhase === GamePhase.WINNER_DETERMINATION) {
    // Automatically handle winner determination
    stateWithInitializedPhase = handleWinnerDeterminationPhase(stateWithNewPhase)
  } else if (nextPhase === GamePhase.BUYER_ASSIGNMENT) {
    // Automatically handle buyer assignment
    stateWithInitializedPhase = handleBuyerAssignmentPhase(stateWithNewPhase)
  }
  
  return stateWithInitializedPhase
}

/**
 * Initializes the action phase with proper done system setup
 * @param state Current game state that should be in action phase
 * @returns Updated state with done system initialized, or advanced to next phase if action phase should end immediately
 */
export function initializeActionPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE) {
    return state
  }
  
  // Initialize the done system immediately when entering action phase
  const stateWithDoneSystem = initializeActionPhaseDoneSystem(state)
  
  // Check if any players have action cards
  const playersWithActionCards = stateWithDoneSystem.players.filter(player => 
    player.collection.some(card => card.type === 'action')
  )
  
  // If no players have action cards, skip action phase
  if (playersWithActionCards.length === 0) {
    return advanceToNextPhaseWithInitialization(stateWithDoneSystem)
  }
  
  return stateWithDoneSystem
}

/**
 * Initialize action phase done system
 */
function initializeActionPhaseDoneSystem(state: GameState): GameState {
  return {
    ...state,
    actionPhaseDoneStates: new Array(state.players.length).fill(false)
  }
}
/**
 * Handles the deal phase automatically
 */
function handleDealPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.DEAL) {
    return state
  }

  // Deal cards to all players
  return dealCards(state)
}

/**
 * Transfers buyer role to the player holding the money bag
 */
function handleBuyerAssignmentPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.BUYER_ASSIGNMENT) {
    return state
  }

  const newState = { ...state }
  
  // Find player with money bag (hasMoney = true)
  const moneyBagHolderIndex = newState.players.findIndex(player => player.hasMoney)
  
  if (moneyBagHolderIndex !== -1) {
    newState.currentBuyerIndex = moneyBagHolderIndex
  }
  
  // Automatically advance to next phase
  return advanceToNextPhaseWithInitialization(newState)
}

/**
 * Handles the winner determination phase
 */
function handleWinnerDeterminationPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.WINNER_DETERMINATION) {
    return state
  }

  const newState = { ...state }
  
  // Check for winner (player with 5+ points)
  const maxPoints = Math.max(...newState.players.map(p => p.points))
  
  if (maxPoints >= 5) {
    // Game ends - find winner
    const winnerIndex = newState.players.findIndex(p => p.points === maxPoints)
    newState.winner = winnerIndex
    newState.phaseInstructions = `Game Over! ${newState.players[winnerIndex].name} wins!`
    return newState
  } else {
    // Continue to next round
    return advanceToNextPhaseWithInitialization(newState)
  }
}

/**
 * Handles the Gotcha trade-ins phase automatically (simplified version)
 */
function handleGotchaTradeinsPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.GOTCHA_TRADEINS) {
    return state
  }

  // For now, just advance to next phase (full Gotcha logic can be added later)
  return advanceToNextPhaseWithInitialization(state)
}

/**
 * Handles the Thing trade-ins phase automatically (simplified version)
 */
function handleThingTradeinsPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.THING_TRADEINS) {
    return state
  }

  // For now, just advance to next phase (full Thing logic can be added later)
  return advanceToNextPhaseWithInitialization(state)
}