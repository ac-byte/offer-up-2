import { GameState, GameAction, GamePhase, Player, Card } from '../types'
import { createShuffledDeck, shuffleArray, identifyGotchaSets, identifyThingSets } from './cards'

/**
 * Creates initial game state
 */
export function createInitialGameState(): GameState {
  return {
    players: [],
    currentBuyerIndex: 0,
    currentPhase: GamePhase.BUYER_ASSIGNMENT,
    currentPlayerIndex: 0,
    round: 1,
    drawPile: [],
    discardPile: [],
    selectedPerspective: 0,
    phaseInstructions: 'Waiting for game to start...',
    winner: null,
    gameStarted: false
  }
}

/**
 * Creates a player with initial state
 */
export function createPlayer(id: number, name: string): Player {
  return {
    id,
    name,
    hand: [],
    offer: [],
    collection: [],
    points: 0,
    hasMoney: false
  }
}

/**
 * Validates player count for game initialization
 */
export function validatePlayerCount(playerCount: number): boolean {
  return playerCount >= 3 && playerCount <= 6
}

/**
 * Randomly selects a buyer from the players
 */
export function selectRandomBuyer(playerCount: number): number {
  return Math.floor(Math.random() * playerCount)
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
 * Validates if an action is allowed in the current phase
 */
export function validatePhaseAction(phase: GamePhase, action: GameAction): boolean {
  switch (action.type) {
    case 'START_GAME':
      // Can only start game when not started
      return true
    
    case 'ADVANCE_PHASE':
      // Phase advancement is always allowed (controlled by game logic)
      return true
    
    case 'DEAL_CARDS':
      // Can only deal cards during deal phase
      return phase === GamePhase.DEAL
    
    case 'CHANGE_PERSPECTIVE':
      // Perspective changes are always allowed
      return true
    
    case 'PLACE_OFFER':
      // Can only place offers during offer phase
      return phase === GamePhase.OFFER_PHASE
    
    case 'FLIP_CARD':
      // Can only flip cards during buyer-flip phase
      return phase === GamePhase.BUYER_FLIP
    
    case 'PLAY_ACTION_CARD':
      // Can only play action cards during action phase
      return phase === GamePhase.ACTION_PHASE
    
    case 'SELECT_OFFER':
      // Can only select offers during offer selection phase
      return phase === GamePhase.OFFER_SELECTION
    
    case 'DECLARE_DONE':
      // Can declare done during action phase or other interactive phases
      return phase === GamePhase.ACTION_PHASE || phase === GamePhase.OFFER_PHASE
    
    default:
      return false
  }
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
 * Checks if the game should continue (no winner yet)
 */
export function shouldContinueGame(state: GameState): boolean {
  // Game continues if no winner is declared
  return state.winner === null
}

/**
 * Checks if all sellers have completed their offers during offer phase
 */
export function areAllOffersComplete(state: GameState): boolean {
  if (state.currentPhase !== GamePhase.OFFER_PHASE) {
    return false
  }
  
  // Get all sellers (players who are not the buyer)
  const sellers = state.players.filter((_, index) => index !== state.currentBuyerIndex)
  
  // Check if all sellers have placed offers (offer array has 3 cards)
  return sellers.every(seller => seller.offer.length === 3)
}

/**
 * Deals cards to bring all players' hands to exactly 5 cards
 * Implements sequential dealing (one card per player at a time)
 * Handles draw pile exhaustion by reshuffling discard pile
 */
export function dealCards(state: GameState): GameState {
  const newState = { ...state }
  newState.players = state.players.map(player => ({ ...player, hand: [...player.hand] }))
  newState.drawPile = [...state.drawPile]
  newState.discardPile = [...state.discardPile]

  // Calculate how many cards each player needs
  const playersNeedingCards = newState.players.map((player, index) => ({
    playerIndex: index,
    cardsNeeded: Math.max(0, 5 - player.hand.length)
  })).filter(p => p.cardsNeeded > 0)

  // Deal cards sequentially (one card per player per round)
  let maxCardsNeeded = Math.max(...playersNeedingCards.map(p => p.cardsNeeded), 0)
  
  for (let round = 0; round < maxCardsNeeded; round++) {
    for (const playerInfo of playersNeedingCards) {
      const { playerIndex, cardsNeeded } = playerInfo
      
      // Skip if this player already has enough cards
      if (round >= cardsNeeded) {
        continue
      }

      // Check if we need to reshuffle
      if (newState.drawPile.length === 0) {
        if (newState.discardPile.length === 0) {
          // No more cards available - stop dealing
          break
        }
        
        // Reshuffle discard pile into draw pile
        newState.drawPile = shuffleArray(newState.discardPile)
        newState.discardPile = []
      }

      // Deal one card to this player
      if (newState.drawPile.length > 0) {
        const card = newState.drawPile.shift()! // Take from beginning of array
        newState.players[playerIndex].hand.push(card)
      }
    }
  }

  return newState
}

/**
 * Handles the deal phase automatically
 */
export function handleDealPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.DEAL) {
    return state
  }

  // Deal cards to all players
  const newState = dealCards(state)
  
  // Automatically advance to next phase after dealing
  const { nextPhase, nextRound } = advanceToNextPhase(newState.currentPhase, newState.round)
  
  return {
    ...newState,
    currentPhase: nextPhase,
    round: nextRound,
    phaseInstructions: getPhaseInstructions(nextPhase)
  }
}

/**
 * Game reducer function
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  // Validate phase-specific actions
  if (!validatePhaseAction(state.currentPhase, action)) {
    throw new Error(`Action ${action.type} is not allowed during phase ${state.currentPhase}`)
  }

  switch (action.type) {
    case 'START_GAME': {
      const playerNames = action.players
      
      // Validate player count
      if (!validatePlayerCount(playerNames.length)) {
        throw new Error(`Invalid player count: ${playerNames.length}. Must be between 3 and 6 players.`)
      }
      
      // Create players
      const players = playerNames.map((name, index) => createPlayer(index, name))
      
      // Select random buyer
      const buyerIndex = selectRandomBuyer(players.length)
      
      // Set money bag for buyer
      players[buyerIndex].hasMoney = true
      
      // Create shuffled deck
      const drawPile = createShuffledDeck()
      
      return {
        ...state,
        players,
        currentBuyerIndex: buyerIndex,
        currentPhase: GamePhase.DEAL,
        currentPlayerIndex: 0,
        round: 1,
        drawPile,
        discardPile: [],
        selectedPerspective: 0,
        phaseInstructions: getPhaseInstructions(GamePhase.DEAL),
        winner: null,
        gameStarted: true
      }
    }
    
    case 'ADVANCE_PHASE': {
      // Don't advance if game is over
      if (!shouldContinueGame(state)) {
        return state
      }
      
      // Handle automatic phases
      if (state.currentPhase === GamePhase.DEAL) {
        return handleDealPhase(state)
      } else if (state.currentPhase === GamePhase.GOTCHA_TRADEINS) {
        return handleGotchaTradeinsPhase(state)
      } else if (state.currentPhase === GamePhase.THING_TRADEINS) {
        return handleThingTradeinsPhase(state)
      }
      
      const { nextPhase, nextRound } = advanceToNextPhase(state.currentPhase, state.round)
      
      return {
        ...state,
        currentPhase: nextPhase,
        round: nextRound,
        phaseInstructions: getPhaseInstructions(nextPhase)
      }
    }
    
    case 'DEAL_CARDS': {
      return handleDealPhase(state)
    }
    
    case 'CHANGE_PERSPECTIVE': {
      const playerId = action.playerId
      
      // Validate player ID
      if (playerId < 0 || playerId >= state.players.length) {
        return state // Invalid player ID, no change
      }
      
      return {
        ...state,
        selectedPerspective: playerId
      }
    }
    
    case 'PLACE_OFFER': {
      const { playerId, cards, faceUpIndex } = action
      
      // Validate player exists
      if (playerId < 0 || playerId >= state.players.length) {
        throw new Error(`Invalid player ID: ${playerId}`)
      }
      
      // Validate player is not the buyer (only sellers can place offers)
      if (playerId === state.currentBuyerIndex) {
        throw new Error('Buyer cannot place offers')
      }
      
      // Validate offer has exactly 3 cards
      if (cards.length !== 3) {
        throw new Error(`Offer must contain exactly 3 cards, got ${cards.length}`)
      }
      
      // Validate face up index is valid (0, 1, or 2)
      if (faceUpIndex < 0 || faceUpIndex >= 3) {
        throw new Error(`Face up index must be 0, 1, or 2, got ${faceUpIndex}`)
      }
      
      const player = state.players[playerId]
      
      // Validate player has no existing offer
      if (player.offer.length > 0) {
        throw new Error('Player already has an offer placed')
      }
      
      // Validate all cards are in player's hand
      const playerHandIds = new Set(player.hand.map(card => card.id))
      for (const card of cards) {
        if (!playerHandIds.has(card.id)) {
          throw new Error(`Card ${card.name} is not in player's hand`)
        }
      }
      
      // Create new state with updated player
      const newState = { ...state }
      newState.players = state.players.map((p, index) => {
        if (index !== playerId) {
          return p
        }
        
        // Remove cards from hand
        const newHand = p.hand.filter(handCard => 
          !cards.some(offerCard => offerCard.id === handCard.id)
        )
        
        // Create offer cards with positions and face up/down state
        const newOffer = cards.map((card, cardIndex) => ({
          ...card,
          faceUp: cardIndex === faceUpIndex,
          position: cardIndex
        }))
        
        return {
          ...p,
          hand: newHand,
          offer: newOffer
        }
      })
      
      // Check if all sellers have now completed their offers
      if (areAllOffersComplete(newState)) {
        // Automatically advance to buyer-flip phase
        const { nextPhase, nextRound } = advanceToNextPhase(newState.currentPhase, newState.round)
        newState.currentPhase = nextPhase
        newState.round = nextRound
        newState.phaseInstructions = getPhaseInstructions(nextPhase)
      }
      
      return newState
    }
    
    case 'FLIP_CARD': {
      const { offerId, cardIndex } = action
      
      // Validate that current phase is buyer-flip
      if (state.currentPhase !== GamePhase.BUYER_FLIP) {
        throw new Error('Card flipping is only allowed during buyer-flip phase')
      }
      
      // Validate offerId (player index)
      if (offerId < 0 || offerId >= state.players.length) {
        throw new Error(`Invalid offer ID: ${offerId}`)
      }
      
      // Validate that the player is not the buyer (buyers don't have offers)
      if (offerId === state.currentBuyerIndex) {
        throw new Error('Cannot flip cards from buyer\'s offer (buyer has no offer)')
      }
      
      const targetPlayer = state.players[offerId]
      
      // Validate that the player has an offer
      if (targetPlayer.offer.length === 0) {
        throw new Error('Player has no offer to flip cards from')
      }
      
      // Validate cardIndex
      if (cardIndex < 0 || cardIndex >= targetPlayer.offer.length) {
        throw new Error(`Invalid card index: ${cardIndex}`)
      }
      
      const targetCard = targetPlayer.offer[cardIndex]
      
      // Validate that the card is face down (can only flip face down cards)
      if (targetCard.faceUp) {
        throw new Error('Cannot flip a card that is already face up')
      }
      
      // Create new state with the flipped card
      const newState = { ...state }
      newState.players = state.players.map((player, playerIndex) => {
        if (playerIndex !== offerId) {
          return player
        }
        
        // Update the specific card to be face up
        const newOffer = player.offer.map((card, index) => {
          if (index === cardIndex) {
            return { ...card, faceUp: true }
          }
          return card
        })
        
        return {
          ...player,
          offer: newOffer
        }
      })
      
      // Automatically advance to action phase after flip
      const { nextPhase, nextRound } = advanceToNextPhase(newState.currentPhase, newState.round)
      newState.currentPhase = nextPhase
      newState.round = nextRound
      newState.phaseInstructions = getPhaseInstructions(nextPhase)
      
      return newState
    }
    
    case 'PLAY_ACTION_CARD': {
      const { playerId, cardId } = action
      
      // Validate player exists
      if (playerId < 0 || playerId >= state.players.length) {
        throw new Error(`Invalid player ID: ${playerId}`)
      }
      
      // Validate that current phase is action phase
      if (state.currentPhase !== GamePhase.ACTION_PHASE) {
        throw new Error('Action cards can only be played during action phase')
      }
      
      const player = state.players[playerId]
      
      // Find the action card in player's collection
      const actionCard = player.collection.find(card => card.id === cardId && card.type === 'action')
      if (!actionCard) {
        throw new Error(`Action card with ID ${cardId} not found in player's collection`)
      }
      
      // Create new state with the action card removed from collection and added to discard pile
      const newState = { ...state }
      newState.players = state.players.map((p, index) => {
        if (index !== playerId) {
          return p
        }
        
        // Remove the action card from collection
        const newCollection = p.collection.filter(card => card.id !== cardId)
        
        return {
          ...p,
          collection: newCollection
        }
      })
      
      // Add the played card to discard pile
      newState.discardPile = [...state.discardPile, actionCard]
      
      // Execute the action card effect immediately
      const stateAfterEffect = executeActionCardEffect(newState, actionCard, playerId)
      
      return stateAfterEffect
    }
    
    case 'SELECT_OFFER': {
      const { buyerId, sellerId } = action
      
      // Validate that current phase is offer selection
      if (state.currentPhase !== GamePhase.OFFER_SELECTION) {
        throw new Error('Offer selection is only allowed during offer selection phase')
      }
      
      // Validate buyer ID
      if (buyerId < 0 || buyerId >= state.players.length) {
        throw new Error(`Invalid buyer ID: ${buyerId}`)
      }
      
      // Validate that the specified buyer is actually the current buyer
      if (buyerId !== state.currentBuyerIndex) {
        throw new Error('Only the current buyer can select offers')
      }
      
      // Validate seller ID
      if (sellerId < 0 || sellerId >= state.players.length) {
        throw new Error(`Invalid seller ID: ${sellerId}`)
      }
      
      // Validate that seller is not the buyer
      if (sellerId === state.currentBuyerIndex) {
        throw new Error('Buyer cannot select their own offer (buyer has no offer)')
      }
      
      const selectedSeller = state.players[sellerId]
      
      // Validate that the selected seller has an offer
      if (selectedSeller.offer.length === 0) {
        throw new Error('Selected seller has no offer to select')
      }
      
      // Create new state
      const newState = { ...state }
      newState.players = state.players.map((player, playerIndex) => {
        if (playerIndex === buyerId) {
          // Buyer: remove money bag, add selected offer to collection
          return {
            ...player,
            hasMoney: false,
            collection: [...player.collection, ...selectedSeller.offer.map(offerCard => ({
              id: offerCard.id,
              type: offerCard.type,
              subtype: offerCard.subtype,
              name: offerCard.name,
              setSize: offerCard.setSize,
              effect: offerCard.effect
            }))]
          }
        } else if (playerIndex === sellerId) {
          // Selected seller: receive money bag, clear offer
          return {
            ...player,
            hasMoney: true,
            offer: []
          }
        } else {
          // Non-selected sellers: return offer to collection, clear offer
          const returnedCards = player.offer.map(offerCard => ({
            id: offerCard.id,
            type: offerCard.type,
            subtype: offerCard.subtype,
            name: offerCard.name,
            setSize: offerCard.setSize,
            effect: offerCard.effect
          }))
          
          return {
            ...player,
            collection: [...player.collection, ...returnedCards],
            offer: []
          }
        }
      })
      
      // Update current buyer index to the selected seller
      newState.currentBuyerIndex = sellerId
      
      // Automatically advance to offer distribution phase
      const { nextPhase, nextRound } = advanceToNextPhase(newState.currentPhase, newState.round)
      newState.currentPhase = nextPhase
      newState.round = nextRound
      newState.phaseInstructions = getPhaseInstructions(nextPhase)
      
      return newState
    }
    
    case 'DECLARE_DONE': {
      // TODO: Implement in future tasks
      return state
    }
    
    default:
      return state
  }
}

/**
 * Processes automatic Gotcha trade-ins for all players
 * Removes complete Gotcha sets from collections and applies their effects
 */
export function processGotchaTradeins(state: GameState): GameState {
  const newState = { ...state }
  newState.players = state.players.map(player => {
    const playerCopy = { ...player, collection: [...player.collection] }
    
    // Identify complete Gotcha sets
    const completeSets = identifyGotchaSets(playerCopy.collection)
    
    if (completeSets.length === 0) {
      return playerCopy
    }
    
    // Remove traded-in cards from collection
    const tradedInCardIds = new Set(
      completeSets.flat().map(card => card.id)
    )
    
    playerCopy.collection = playerCopy.collection.filter(
      card => !tradedInCardIds.has(card.id)
    )
    
    // Apply Gotcha effects (for now, just remove the cards)
    // TODO: Implement specific Gotcha effects in future tasks
    
    return playerCopy
  })
  
  // Add traded-in cards to discard pile
  const tradedInCards = newState.players.flatMap(player => {
    const originalPlayer = state.players.find(p => p.id === player.id)!
    const originalCardIds = new Set(originalPlayer.collection.map(card => card.id))
    const currentCardIds = new Set(player.collection.map(card => card.id))
    
    return originalPlayer.collection.filter(card => 
      originalCardIds.has(card.id) && !currentCardIds.has(card.id)
    )
  })
  
  newState.discardPile = [...state.discardPile, ...tradedInCards]
  
  return newState
}

/**
 * Processes automatic Thing trade-ins for all players
 * Removes complete Thing sets from collections and awards points
 */
export function processThingTradeins(state: GameState): GameState {
  const newState = { ...state }
  newState.players = state.players.map(player => {
    const playerCopy = { ...player, collection: [...player.collection] }
    
    // Identify complete Thing sets
    const completeSets = identifyThingSets(playerCopy.collection)
    
    if (completeSets.length === 0) {
      return playerCopy
    }
    
    // Calculate points for complete sets
    // 1 Giant = 1 point, 2 Big = 1 point, 3 Medium = 1 point, 4 Tiny = 1 point
    const pointsEarned = completeSets.length // Each complete set = 1 point
    
    // Remove traded-in cards from collection
    const tradedInCardIds = new Set(
      completeSets.flat().map(card => card.id)
    )
    
    playerCopy.collection = playerCopy.collection.filter(
      card => !tradedInCardIds.has(card.id)
    )
    
    // Award points
    playerCopy.points += pointsEarned
    
    return playerCopy
  })
  
  // Add traded-in cards to discard pile
  const tradedInCards = newState.players.flatMap(player => {
    const originalPlayer = state.players.find(p => p.id === player.id)!
    const originalCardIds = new Set(originalPlayer.collection.map(card => card.id))
    const currentCardIds = new Set(player.collection.map(card => card.id))
    
    return originalPlayer.collection.filter(card => 
      originalCardIds.has(card.id) && !currentCardIds.has(card.id)
    )
  })
  
  newState.discardPile = [...state.discardPile, ...tradedInCards]
  
  return newState
}

/**
 * Handles the Gotcha trade-ins phase automatically
 */
export function handleGotchaTradeinsPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.GOTCHA_TRADEINS) {
    return state
  }

  // Process Gotcha trade-ins for all players
  const newState = processGotchaTradeins(state)
  
  // Automatically advance to next phase after trade-ins
  const { nextPhase, nextRound } = advanceToNextPhase(newState.currentPhase, newState.round)
  
  return {
    ...newState,
    currentPhase: nextPhase,
    round: nextRound,
    phaseInstructions: getPhaseInstructions(nextPhase)
  }
}

/**
 * Handles the Thing trade-ins phase automatically
 */
export function handleThingTradeinsPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.THING_TRADEINS) {
    return state
  }

  // Process Thing trade-ins for all players
  const newState = processThingTradeins(state)
  
  // Automatically advance to next phase after trade-ins
  const { nextPhase, nextRound } = advanceToNextPhase(newState.currentPhase, newState.round)
  
  return {
    ...newState,
    currentPhase: nextPhase,
    round: nextRound,
    phaseInstructions: getPhaseInstructions(nextPhase)
  }
}

/**
 * Executes the immediate effect of an action card
 */
function executeActionCardEffect(state: GameState, actionCard: Card, playerId: number): GameState {
  switch (actionCard.subtype) {
    case 'flip-one': {
      // Flip One: Allows player to flip one face-down card in any offer
      // For now, we'll just return the state as-is since the actual flipping
      // will be handled by subsequent FLIP_CARD actions
      // The effect is that the player gains the ability to flip a card
      return state
    }
    
    case 'add-one': {
      // Add One: Player draws one additional card from the draw pile
      const newState = { ...state }
      newState.players = [...state.players]
      newState.drawPile = [...state.drawPile]
      newState.discardPile = [...state.discardPile]
      
      // Check if we need to reshuffle (excluding the action card that was just played)
      if (newState.drawPile.length === 0) {
        if (newState.discardPile.length === 0) {
          // No cards available - effect cannot be executed
          return newState
        }
        
        // Reshuffle discard pile into draw pile (excluding the action card just played)
        const cardsToReshuffle = newState.discardPile.filter(card => card.id !== actionCard.id)
        if (cardsToReshuffle.length === 0) {
          // No cards available after filtering out the action card
          return newState
        }
        
        newState.drawPile = shuffleArray(cardsToReshuffle)
        newState.discardPile = [actionCard] // Keep only the played action card in discard
      }
      
      // Draw one card for the player
      if (newState.drawPile.length > 0) {
        const drawnCard = newState.drawPile.shift()!
        newState.players[playerId] = {
          ...newState.players[playerId],
          hand: [...newState.players[playerId].hand, drawnCard]
        }
      }
      
      return newState
    }
    
    case 'remove-one': {
      // Remove One: Player discards one card from their hand
      // For now, we'll just return the state as-is since the actual card selection
      // will be handled by subsequent actions or UI interactions
      // The effect is that the player must discard a card
      return state
    }
    
    case 'remove-two': {
      // Remove Two: Player discards two cards from their hand
      // For now, we'll just return the state as-is since the actual card selection
      // will be handled by subsequent actions or UI interactions
      // The effect is that the player must discard two cards
      return state
    }
    
    case 'steal-point': {
      // Steal A Point: Player steals one point from another player
      // For now, we'll just return the state as-is since the actual target selection
      // will be handled by subsequent actions or UI interactions
      // The effect is that the player can steal a point from another player
      return state
    }
    
    default:
      // Unknown action card subtype - no effect
      return state
  }
}

/**
 * Gets instructions for each phase
 */
function getPhaseInstructions(phase: GamePhase): string {
  switch (phase) {
    case GamePhase.BUYER_ASSIGNMENT:
      return 'Buyer assignment: Determining who has the money bag...'
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