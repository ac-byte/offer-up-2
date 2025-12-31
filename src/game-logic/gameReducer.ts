import { GameState, GameAction, GamePhase, Player, Card, GotchaEffectState } from '../types'
import { createShuffledDeck, shuffleArray, identifyGotchaSets, identifyThingSets, identifyGotchaSetsInOrder } from './cards'

/**
 * Creates initial game state
 */
export function createInitialGameState(): GameState {
  return {
    players: [],
    currentBuyerIndex: 0,
    nextBuyerIndex: 0,
    currentPhase: GamePhase.BUYER_ASSIGNMENT,
    currentPlayerIndex: 0,
    round: 1,
    drawPile: [],
    discardPile: [],
    actionPhasePassesRemaining: 0,
    actionPhasePlayersWithActionCards: [],
    gotchaEffectState: null,
    selectedPerspective: 0,
    phaseInstructions: 'Waiting for game to start...',
    autoFollowPerspective: true,
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
    
    case 'ADVANCE_PLAYER':
      // Player advancement is always allowed (controlled by game logic)
      return true
    
    case 'DEAL_CARDS':
      // Can only deal cards during deal phase
      return phase === GamePhase.DEAL
    
    case 'CHANGE_PERSPECTIVE':
      // Perspective changes are always allowed
      return true
    
    case 'TOGGLE_AUTO_FOLLOW':
      // Auto-follow toggle is always allowed
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
    
    case 'SELECT_GOTCHA_CARD':
    case 'CHOOSE_GOTCHA_ACTION':
      // Gotcha actions are only allowed during Gotcha trade-ins phase
      return phase === GamePhase.GOTCHA_TRADEINS
    
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
 * Checks for players with 5 or more points
 */
export function getPlayersWithFiveOrMorePoints(players: Player[]): Player[] {
  return players.filter(player => player.points >= 5)
}

/**
 * Determines if there's a clear winner (one player with 5+ points and more than any other)
 */
export function determineWinner(players: Player[]): number | null {
  const playersWithFiveOrMore = getPlayersWithFiveOrMorePoints(players)
  
  // No players with 5+ points - no winner yet
  if (playersWithFiveOrMore.length === 0) {
    return null
  }
  
  // Find the maximum points among all players
  const maxPoints = Math.max(...players.map(player => player.points))
  
  // Find all players with the maximum points
  const playersWithMaxPoints = players.filter(player => player.points === maxPoints)
  
  // If there's a tie for the most points, continue the game
  if (playersWithMaxPoints.length > 1) {
    return null
  }
  
  // If exactly one player has the most points and they have 5+, they win
  const potentialWinner = playersWithMaxPoints[0]
  if (potentialWinner.points >= 5) {
    return potentialWinner.id
  }
  
  // No clear winner yet
  return null
}

/**
 * Handles the winner determination phase
 */
export function handleWinnerDeterminationPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.WINNER_DETERMINATION) {
    return state
  }

  // Check for winner
  const winnerId = determineWinner(state.players)
  
  if (winnerId !== null) {
    // Winner found - declare winner and end game
    return {
      ...state,
      winner: winnerId,
      phaseInstructions: `Game Over! ${state.players.find(p => p.id === winnerId)?.name} wins with ${state.players.find(p => p.id === winnerId)?.points} points!`
    }
  } else {
    // No winner yet - continue to next round
    const { nextPhase, nextRound } = advanceToNextPhase(state.currentPhase, state.round)
    
    // Create state with advanced phase
    const stateWithNewPhase = {
      ...state,
      currentPhase: nextPhase,
      round: nextRound,
      phaseInstructions: getPhaseInstructions(nextPhase)
    }
    
    // Set current player to first eligible player for the new phase
    const firstEligiblePlayer = getNextEligiblePlayer(-1, stateWithNewPhase, new Set())
    
    let finalState = {
      ...stateWithNewPhase,
      currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
    }
    
    // Apply automatic perspective following if enabled
    if (firstEligiblePlayer !== null) {
      finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
    }
    
    return finalState
  }
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
 * Handles the action phase advancement
 */
export function handleActionPhaseAdvancement(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE) {
    return state
  }

  // Initialize the pass system if not already initialized
  let newState = state
  if (state.actionPhasePassesRemaining === 0 && state.actionPhasePlayersWithActionCards.length === 0) {
    newState = initializeActionPhasePassSystem(state)
  }

  // Check if action phase should end
  if (shouldEndActionPhase(newState)) {
    return endActionPhaseAndAdvance(newState)
  }
  
  // Continue action phase - find next eligible player
  return advanceToNextEligiblePlayerInActionPhase(newState)
}

/**
 * Handles the buyer assignment phase automatically
 * Transfers buyer role to the player holding the money bag
 */
export function handleBuyerAssignmentPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.BUYER_ASSIGNMENT) {
    return state
  }

  // Transfer buyer role to the player holding the money bag (nextBuyerIndex)
  const newState = {
    ...state,
    currentBuyerIndex: state.nextBuyerIndex
  }
  
  // Automatically advance to next phase after buyer assignment
  const { nextPhase, nextRound } = advanceToNextPhase(newState.currentPhase, newState.round)
  
  // Create state with advanced phase
  const stateWithNewPhase = {
    ...newState,
    currentPhase: nextPhase,
    round: nextRound,
    phaseInstructions: getPhaseInstructions(nextPhase)
  }
  
  // Set current player to first eligible player for the new phase
  const firstEligiblePlayer = getNextEligiblePlayer(-1, stateWithNewPhase, new Set())
  
  let finalState = {
    ...stateWithNewPhase,
    currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
  }
  
  // Apply automatic perspective following if enabled
  if (firstEligiblePlayer !== null) {
    finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
  }
  
  return finalState
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
  
  // Create state with advanced phase
  const stateWithNewPhase = {
    ...newState,
    currentPhase: nextPhase,
    round: nextRound,
    phaseInstructions: getPhaseInstructions(nextPhase)
  }
  
  // Set current player to first eligible player for the new phase
  const firstEligiblePlayer = getNextEligiblePlayer(-1, stateWithNewPhase, new Set())
  
  let finalState = {
    ...stateWithNewPhase,
    currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
  }
  
  // Apply automatic perspective following if enabled
  if (firstEligiblePlayer !== null) {
    finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
  }
  
  return finalState
}

/**
 * Game reducer function
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  // Prevent any actions if game is over (winner declared)
  if (state.winner !== null && action.type !== 'CHANGE_PERSPECTIVE') {
    // Only allow perspective changes after game ends
    return state
  }

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
      
      // Create initial state
      const initialState = {
        ...state,
        players,
        currentBuyerIndex: buyerIndex,
        nextBuyerIndex: buyerIndex, // Initially same as current buyer
        currentPhase: GamePhase.DEAL,
        currentPlayerIndex: 0,
        round: 1,
        drawPile,
        discardPile: [],
        actionPhasePassesRemaining: 0,
        actionPhasePlayersWithActionCards: [],
        selectedPerspective: 0,
        phaseInstructions: getPhaseInstructions(GamePhase.DEAL),
        autoFollowPerspective: true,
        winner: null,
        gameStarted: true
      }
      
      // Set current player to first eligible player for the deal phase
      const firstEligiblePlayer = getNextEligiblePlayer(-1, initialState, new Set())
      
      let finalState: GameState = {
        ...initialState,
        currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
      }
      
      // Apply automatic perspective following if enabled
      if (firstEligiblePlayer !== null) {
        finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
      }
      
      return finalState
    }
    
    case 'ADVANCE_PHASE': {
      // Don't advance if game is over
      if (!shouldContinueGame(state)) {
        return state
      }
      
      // Handle automatic phases
      if (state.currentPhase === GamePhase.BUYER_ASSIGNMENT) {
        return handleBuyerAssignmentPhase(state)
      } else if (state.currentPhase === GamePhase.DEAL) {
        return handleDealPhase(state)
      } else if (state.currentPhase === GamePhase.ACTION_PHASE) {
        return handleActionPhaseAdvancement(state)
      } else if (state.currentPhase === GamePhase.GOTCHA_TRADEINS) {
        return handleGotchaTradeinsPhase(state)
      } else if (state.currentPhase === GamePhase.THING_TRADEINS) {
        return handleThingTradeinsPhase(state)
      } else if (state.currentPhase === GamePhase.WINNER_DETERMINATION) {
        return handleWinnerDeterminationPhase(state)
      }
      
      const { nextPhase, nextRound } = advanceToNextPhase(state.currentPhase, state.round)
      
      // Create new state with advanced phase
      const newState = {
        ...state,
        currentPhase: nextPhase,
        round: nextRound,
        phaseInstructions: getPhaseInstructions(nextPhase)
      }
      
      // Set current player to first eligible player for the new phase
      const firstEligiblePlayer = getNextEligiblePlayer(-1, newState, new Set())
      
      let finalState = {
        ...newState,
        currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
      }
      
      // Apply automatic perspective following if enabled
      if (firstEligiblePlayer !== null) {
        finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
      }
      
      return finalState
    }
    
    case 'ADVANCE_PLAYER': {
      // Advance to next eligible player with automatic skipping
      return advanceToNextEligiblePlayer(state)
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
        selectedPerspective: playerId,
        // Temporarily disable auto-follow when user manually changes perspective
        autoFollowPerspective: false
      }
    }
    
    case 'TOGGLE_AUTO_FOLLOW': {
      const newAutoFollow = !state.autoFollowPerspective
      let newState = {
        ...state,
        autoFollowPerspective: newAutoFollow
      }
      
      // If enabling auto-follow, immediately update perspective to current active player
      if (newAutoFollow) {
        newState = updatePerspectiveForActivePlayer(newState, state.currentPlayerIndex)
      }
      
      return newState
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
        
        // Create state with advanced phase
        const stateWithNewPhase = {
          ...newState,
          currentPhase: nextPhase,
          round: nextRound,
          phaseInstructions: getPhaseInstructions(nextPhase)
        }
        
        // Set current player to first eligible player for the new phase
        const firstEligiblePlayer = getNextEligiblePlayer(-1, stateWithNewPhase, new Set())
        
        let finalState = {
          ...stateWithNewPhase,
          currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
        }
        
        // Apply automatic perspective following if enabled
        if (firstEligiblePlayer !== null) {
          finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
        }
        
        return finalState
      } else {
        // Not all offers complete yet - advance to next eligible player
        return advanceToNextEligiblePlayer(newState)
      }
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
      
      // Create state with advanced phase
      const stateWithNewPhase = {
        ...newState,
        currentPhase: nextPhase,
        round: nextRound,
        phaseInstructions: getPhaseInstructions(nextPhase)
      }
      
      // Set current player to first eligible player for the new phase
      const firstEligiblePlayer = getNextEligiblePlayer(-1, stateWithNewPhase, new Set())
      
      let finalState = {
        ...stateWithNewPhase,
        currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
      }
      
      // Apply automatic perspective following if enabled
      if (firstEligiblePlayer !== null) {
        finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
      }
      
      return finalState
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
      
      // Reset the pass counter since someone played an action card
      const stateWithResetPasses = resetPassCounter(stateAfterEffect)
      
      // Check if action phase should end (no more players with action cards)
      if (shouldEndActionPhase(stateWithResetPasses)) {
        return endActionPhaseAndAdvance(stateWithResetPasses)
      }
      
      // Advance to next eligible player for action phase
      return advanceToNextEligiblePlayerInActionPhase(stateWithResetPasses)
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
      
      // Update next buyer index to the selected seller (money bag holder)
      // But keep current buyer index unchanged for this round
      newState.nextBuyerIndex = sellerId
      
      // Automatically advance to offer distribution phase
      const { nextPhase, nextRound } = advanceToNextPhase(newState.currentPhase, newState.round)
      
      // Create state with advanced phase
      const stateWithNewPhase = {
        ...newState,
        currentPhase: nextPhase,
        round: nextRound,
        phaseInstructions: getPhaseInstructions(nextPhase)
      }
      
      // Set current player to first eligible player for the new phase
      const firstEligiblePlayer = getNextEligiblePlayer(-1, stateWithNewPhase, new Set())
      
      let finalState = {
        ...stateWithNewPhase,
        currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
      }
      
      // Apply automatic perspective following if enabled
      if (firstEligiblePlayer !== null) {
        finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
      }
      
      return finalState
    }
    
    case 'DECLARE_DONE': {
      const { playerId } = action
      
      // Validate player exists
      if (playerId < 0 || playerId >= state.players.length) {
        throw new Error(`Invalid player ID: ${playerId}`)
      }
      
      // Validate that it's the current player's turn
      if (playerId !== state.currentPlayerIndex) {
        throw new Error('Only the current player can declare done')
      }
      
      // Handle action phase pass system
      if (state.currentPhase === GamePhase.ACTION_PHASE) {
        return handleActionPhasePlayerPass(state, playerId)
      }
      
      // Advance to next eligible player with automatic skipping for other phases
      return advanceToNextEligiblePlayer(state)
    }
    
    case 'SELECT_GOTCHA_CARD': {
      const { cardId } = action
      
      // Validate that we're in a Gotcha effect state
      if (!state.gotchaEffectState) {
        throw new Error('No Gotcha effect is currently active')
      }
      
      // Validate that we're waiting for card selection (not action choice)
      if (state.gotchaEffectState.awaitingBuyerChoice) {
        throw new Error('Buyer must choose action for already selected cards')
      }
      
      return handleGotchaCardSelection(state, cardId)
    }
    
    case 'CHOOSE_GOTCHA_ACTION': {
      const { action: gotchaAction } = action
      
      // Validate that we're in a Gotcha effect state
      if (!state.gotchaEffectState) {
        throw new Error('No Gotcha effect is currently active')
      }
      
      // Validate that we're waiting for action choice (not card selection)
      if (!state.gotchaEffectState.awaitingBuyerChoice) {
        throw new Error('Buyer must select cards before choosing action')
      }
      
      return handleGotchaActionChoice(state, gotchaAction)
    }
    
    
    default:
      return state
  }
}

/**
 * Applies Gotcha Bad effects to a player
 * Reduces player points by 1 if they have points, transfers point to buyer if applicable
 */
export function applyGotchaBadEffect(state: GameState, playerIndex: number): GameState {
  const newState = { ...state }
  newState.players = [...state.players]
  
  const player = newState.players[playerIndex]
  const buyer = newState.players[state.currentBuyerIndex]
  
  // Only apply penalty if player has at least one point
  if (player.points > 0) {
    // Reduce player's points by 1
    newState.players[playerIndex] = {
      ...player,
      points: player.points - 1
    }
    
    // Transfer point to buyer if affected player is not the buyer
    if (playerIndex !== state.currentBuyerIndex) {
      newState.players[state.currentBuyerIndex] = {
        ...buyer,
        points: buyer.points + 1
      }
    }
    // If affected player is the buyer, the point is discarded (no transfer)
  }
  
  return newState
}

/**
 * Processes automatic Gotcha trade-ins for all players
 * Removes complete Gotcha sets from collections and applies their effects
 * Processes sets in order: Bad first, then Twice, then Once
 * Returns state with pending Gotcha Once/Twice effects if buyer interaction is needed
 */
export function processGotchaTradeins(state: GameState): GameState {
  let newState = { ...state }
  newState.players = state.players.map(player => ({ ...player, collection: [...player.collection] }))
  newState.discardPile = [...state.discardPile]
  
  // Process each player's Gotcha sets in the correct order
  for (let playerIndex = 0; playerIndex < newState.players.length; playerIndex++) {
    const player = newState.players[playerIndex]
    const setsBySubtype = identifyGotchaSetsInOrder(player.collection)
    
    // Process in order: Bad, Twice, Once
    for (const subtype of ['bad', 'twice', 'once']) {
      const completeSets = setsBySubtype[subtype]
      
      for (const set of completeSets) {
        // Remove the set from player's collection
        const tradedInCardIds = new Set(set.map(card => card.id))
        newState.players[playerIndex].collection = newState.players[playerIndex].collection.filter(
          card => !tradedInCardIds.has(card.id)
        )
        
        // Add traded-in cards to discard pile
        newState.discardPile.push(...set)
        
        // Apply Gotcha effects based on subtype
        if (subtype === 'bad') {
          // Apply Gotcha Bad effect: point penalty and transfer
          newState = applyGotchaBadEffect(newState, playerIndex)
        } else if (subtype === 'once') {
          // Apply Gotcha Once effect: buyer selects 1 card to steal/discard
          newState = applyGotchaOnceEffect(newState, playerIndex)
          
          // If buyer interaction is needed, return state with pending effect
          if (newState.gotchaEffectState !== null) {
            return newState
          }
        } else if (subtype === 'twice') {
          // Apply Gotcha Twice effect: buyer selects 2 cards to steal/discard
          newState = applyGotchaTwiceEffect(newState, playerIndex)
          
          // If buyer interaction is needed, return state with pending effect
          if (newState.gotchaEffectState !== null) {
            return newState
          }
        }
      }
    }
  }
  
  return newState
}

/**
 * Applies Gotcha Once effect to a player
 * Buyer selects 1 card from the affected player's collection to steal or discard
 */
export function applyGotchaOnceEffect(state: GameState, affectedPlayerIndex: number): GameState {
  const affectedPlayer = state.players[affectedPlayerIndex]
  
  // If player has no cards, no effect can be applied
  if (affectedPlayer.collection.length === 0) {
    return state
  }
  
  // If player has only 1 card, automatically select it
  if (affectedPlayer.collection.length === 1) {
    const cardToSelect = affectedPlayer.collection[0]
    
    // Create effect state for buyer to choose steal or discard
    return {
      ...state,
      gotchaEffectState: {
        type: 'once',
        affectedPlayerIndex,
        cardsToSelect: 1,
        selectedCards: [cardToSelect],
        awaitingBuyerChoice: true
      },
      phaseInstructions: `Buyer must choose to steal or discard ${cardToSelect.name} from ${affectedPlayer.name}'s collection`
    }
  }
  
  // Player has multiple cards - buyer needs to select one
  return {
    ...state,
    gotchaEffectState: {
      type: 'once',
      affectedPlayerIndex,
      cardsToSelect: 1,
      selectedCards: [],
      awaitingBuyerChoice: false
    },
    phaseInstructions: `Buyer must select 1 card from ${affectedPlayer.name}'s collection`
  }
}

/**
 * Applies Gotcha Twice effect to a player
 * Buyer selects 2 cards from the affected player's collection to steal or discard independently
 */
export function applyGotchaTwiceEffect(state: GameState, affectedPlayerIndex: number): GameState {
  const affectedPlayer = state.players[affectedPlayerIndex]
  
  // If player has no cards, no effect can be applied
  if (affectedPlayer.collection.length === 0) {
    return state
  }
  
  // Start the first iteration of Gotcha Twice (works like Gotcha Once)
  return applyGotchaTwiceIteration(state, affectedPlayerIndex, 1)
}

/**
 * Applies one iteration of Gotcha Twice effect (like a single Gotcha Once)
 */
export function applyGotchaTwiceIteration(state: GameState, affectedPlayerIndex: number, iteration: number): GameState {
  const affectedPlayer = state.players[affectedPlayerIndex]
  
  // If player has no cards, skip this iteration
  if (affectedPlayer.collection.length === 0) {
    if (iteration === 1) {
      // If first iteration has no cards, try second iteration
      return applyGotchaTwiceIteration(state, affectedPlayerIndex, 2)
    } else {
      // Second iteration with no cards - effect is complete
      return state
    }
  }
  
  // If player has only 1 card, automatically select it
  if (affectedPlayer.collection.length === 1) {
    const cardToSelect = affectedPlayer.collection[0]
    
    // Create effect state for buyer to choose steal or discard
    return {
      ...state,
      gotchaEffectState: {
        type: 'twice',
        affectedPlayerIndex,
        cardsToSelect: 1,
        selectedCards: [cardToSelect],
        awaitingBuyerChoice: true,
        twiceIteration: iteration
      },
      phaseInstructions: `Buyer must choose to steal or discard ${cardToSelect.name} from ${affectedPlayer.name}'s collection (${iteration} of 2)`
    }
  }
  
  // Player has multiple cards - buyer needs to select one
  return {
    ...state,
    gotchaEffectState: {
      type: 'twice',
      affectedPlayerIndex,
      cardsToSelect: 1,
      selectedCards: [],
      awaitingBuyerChoice: false,
      twiceIteration: iteration
    },
    phaseInstructions: `Buyer must select 1 card from ${affectedPlayer.name}'s collection (${iteration} of 2)`
  }
}

/**
 * Handles buyer selecting a card for Gotcha Once effect
 */
export function handleGotchaCardSelection(state: GameState, cardId: string): GameState {
  if (!state.gotchaEffectState || state.gotchaEffectState.awaitingBuyerChoice) {
    return state // Invalid state for card selection
  }
  
  const { affectedPlayerIndex, cardsToSelect, selectedCards, type } = state.gotchaEffectState
  const affectedPlayer = state.players[affectedPlayerIndex]
  
  // Find the selected card in the affected player's collection
  const selectedCard = affectedPlayer.collection.find(card => card.id === cardId)
  if (!selectedCard) {
    return state // Card not found in collection
  }
  
  // Add card to selected cards
  const newSelectedCards = [...selectedCards, selectedCard]
  
  // Check if we have selected enough cards
  if (newSelectedCards.length >= cardsToSelect) {
    // All cards selected - now buyer needs to choose action
    if (type === 'once') {
      // For Gotcha Once, use the existing single-action system
      return {
        ...state,
        gotchaEffectState: {
          ...state.gotchaEffectState,
          selectedCards: newSelectedCards,
          awaitingBuyerChoice: true
        },
        phaseInstructions: `Buyer must choose to steal or discard ${selectedCard.name}`
      }
    } else if (type === 'twice') {
      // For Gotcha Twice, initialize per-card choices
      const cardChoices = newSelectedCards.map(card => ({ card, action: null as 'steal' | 'discard' | null }))
      return {
        ...state,
        gotchaEffectState: {
          ...state.gotchaEffectState,
          selectedCards: newSelectedCards,
          awaitingBuyerChoice: true,
          cardChoices,
          currentChoiceIndex: 0
        },
        phaseInstructions: `Buyer must choose to steal or discard ${newSelectedCards[0].name} (1 of ${newSelectedCards.length})`
      }
    }
  }
  
  // Still need to select more cards
  return {
    ...state,
    gotchaEffectState: {
      ...state.gotchaEffectState,
      selectedCards: newSelectedCards
    },
    phaseInstructions: `Buyer must select ${cardsToSelect - newSelectedCards.length} more card(s) from ${affectedPlayer.name}'s collection`
  }
}

/**
 * Handles buyer choosing to steal or discard selected cards
 */
export function handleGotchaActionChoice(state: GameState, action: 'steal' | 'discard'): GameState {
  if (!state.gotchaEffectState || !state.gotchaEffectState.awaitingBuyerChoice) {
    return state // Invalid state for action choice
  }
  
  const { type, affectedPlayerIndex, selectedCards, twiceIteration } = state.gotchaEffectState
  
  // Process the selected card(s)
  const isBuyerAffected = affectedPlayerIndex === state.currentBuyerIndex
  
  let newState = { ...state }
  newState.players = [...state.players]
  newState.discardPile = [...state.discardPile]
  
  // Process each selected card
  for (const selectedCard of selectedCards) {
    // Remove card from affected player's collection
    newState.players[affectedPlayerIndex] = {
      ...newState.players[affectedPlayerIndex],
      collection: newState.players[affectedPlayerIndex].collection.filter(card => card.id !== selectedCard.id)
    }
    
    if (action === 'steal' && !isBuyerAffected) {
      // Steal card to buyer's collection (only if not affecting own collection)
      newState.players[state.currentBuyerIndex] = {
        ...newState.players[state.currentBuyerIndex],
        collection: [...newState.players[state.currentBuyerIndex].collection, selectedCard]
      }
    } else {
      // Discard card (either buyer chose discard, or buyer is affecting own collection)
      newState.discardPile.push(selectedCard)
    }
  }
  
  // Clear current Gotcha effect state
  newState.gotchaEffectState = null
  newState.phaseInstructions = getPhaseInstructions(state.currentPhase)
  
  // For Gotcha Twice, check if we need to do the second iteration
  if (type === 'twice' && twiceIteration === 1) {
    // Start the second iteration
    return applyGotchaTwiceIteration(newState, affectedPlayerIndex, 2)
  }
  
  // Effect is complete - continue processing any remaining Gotcha sets
  return processGotchaTradeins(newState)
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
  
  // If there's a pending Gotcha effect, wait for buyer interaction
  if (newState.gotchaEffectState !== null) {
    return newState
  }
  
  // Automatically advance to next phase after trade-ins
  const { nextPhase, nextRound } = advanceToNextPhase(newState.currentPhase, newState.round)
  
  // Create state with advanced phase
  const stateWithNewPhase = {
    ...newState,
    currentPhase: nextPhase,
    round: nextRound,
    phaseInstructions: getPhaseInstructions(nextPhase)
  }
  
  // Set current player to first eligible player for the new phase
  const firstEligiblePlayer = getNextEligiblePlayer(-1, stateWithNewPhase, new Set())
  
  let finalState = {
    ...stateWithNewPhase,
    currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
  }
  
  // Apply automatic perspective following if enabled
  if (firstEligiblePlayer !== null) {
    finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
  }
  
  return finalState
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
  
  // Create state with advanced phase
  const stateWithNewPhase = {
    ...newState,
    currentPhase: nextPhase,
    round: nextRound,
    phaseInstructions: getPhaseInstructions(nextPhase)
  }
  
  // Set current player to first eligible player for the new phase
  const firstEligiblePlayer = getNextEligiblePlayer(-1, stateWithNewPhase, new Set())
  
  let finalState = {
    ...stateWithNewPhase,
    currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
  }
  
  // Apply automatic perspective following if enabled
  if (firstEligiblePlayer !== null) {
    finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
  }
  
  return finalState
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
 * Gets the next player index in clockwise rotation
 * @param currentIndex Current player index
 * @param playerCount Total number of players
 * @returns Next player index (with wraparound)
 */
export function getNextPlayerIndex(currentIndex: number, playerCount: number): number {
  return (currentIndex + 1) % playerCount
}

/**
 * Gets the player to the right of the buyer (next in clockwise order)
 * @param buyerIndex Current buyer index
 * @param playerCount Total number of players
 * @returns Index of player to buyer's right
 */
export function getPlayerToRightOfBuyer(buyerIndex: number, playerCount: number): number {
  return getNextPlayerIndex(buyerIndex, playerCount)
}

/**
 * Gets the starting player index for a rotation based on phase type
 * @param buyerIndex Current buyer index
 * @param playerCount Total number of players
 * @param buyerIncluded Whether the buyer participates in this phase
 * @returns Starting player index for rotation
 */
export function getRotationStartIndex(buyerIndex: number, playerCount: number, buyerIncluded: boolean): number {
  if (buyerIncluded) {
    // Standard rotation: start with buyer
    return buyerIndex
  } else {
    // Buyer-excluded phases: start with player to buyer's right
    return getPlayerToRightOfBuyer(buyerIndex, playerCount)
  }
}

/**
 * Gets the full rotation order for a phase
 * @param buyerIndex Current buyer index
 * @param playerCount Total number of players
 * @param buyerIncluded Whether the buyer participates in this phase
 * @returns Array of player indices in rotation order
 */
export function getRotationOrder(buyerIndex: number, playerCount: number, buyerIncluded: boolean): number[] {
  const startIndex = getRotationStartIndex(buyerIndex, playerCount, buyerIncluded)
  const rotationOrder: number[] = []
  
  let currentIndex = startIndex
  const playersToInclude = buyerIncluded ? playerCount : playerCount - 1
  
  for (let i = 0; i < playersToInclude; i++) {
    // Skip buyer if not included
    if (!buyerIncluded && currentIndex === buyerIndex) {
      currentIndex = getNextPlayerIndex(currentIndex, playerCount)
      i-- // Don't count this iteration
      continue
    }
    
    rotationOrder.push(currentIndex)
    currentIndex = getNextPlayerIndex(currentIndex, playerCount)
  }
  
  return rotationOrder
}

/**
 * Determines if the buyer should be included in the rotation for a given phase
 * @param phase Current game phase
 * @returns True if buyer participates in this phase
 */
export function isBuyerIncludedInPhase(phase: GamePhase): boolean {
  switch (phase) {
    case GamePhase.BUYER_ASSIGNMENT:
    case GamePhase.DEAL:
    case GamePhase.BUYER_FLIP:
    case GamePhase.OFFER_SELECTION:
    case GamePhase.OFFER_DISTRIBUTION:
    case GamePhase.GOTCHA_TRADEINS:
    case GamePhase.THING_TRADEINS:
    case GamePhase.WINNER_DETERMINATION:
      // These phases don't involve player rotation or buyer participates
      return true
    
    case GamePhase.OFFER_PHASE:
      // Buyer doesn't place offers, only sellers do
      return false
    
    case GamePhase.ACTION_PHASE:
      // All players including buyer can play action cards
      return true
    
    default:
      return true
  }
}

/**
 * Determines if a player has valid actions in the current phase
 * @param player The player to check
 * @param phase Current game phase
 * @param isBuyer Whether this player is the current buyer
 * @returns True if player has valid actions in this phase
 */
export function playerHasValidActions(player: Player, phase: GamePhase, isBuyer: boolean): boolean {
  switch (phase) {
    case GamePhase.OFFER_PHASE:
      // Only sellers (non-buyers) can place offers, and only if they haven't already
      return !isBuyer && player.offer.length === 0 && player.hand.length >= 3
    
    case GamePhase.ACTION_PHASE:
      // Players can act if they have action cards in their collection
      return player.collection.some(card => card.type === 'action')
    
    case GamePhase.BUYER_FLIP:
      // Only buyer can flip cards
      return isBuyer
    
    case GamePhase.OFFER_SELECTION:
      // Only buyer can select offers
      return isBuyer
    
    case GamePhase.BUYER_ASSIGNMENT:
    case GamePhase.DEAL:
    case GamePhase.OFFER_DISTRIBUTION:
    case GamePhase.GOTCHA_TRADEINS:
    case GamePhase.THING_TRADEINS:
    case GamePhase.WINNER_DETERMINATION:
      // These phases are automatic or don't require player actions
      return false
    
    default:
      return false
  }
}

/**
 * Gets the next eligible player in rotation, automatically skipping players with no valid actions
 * @param currentPlayerIndex Current player index (-1 to start from beginning of rotation)
 * @param state Current game state
 * @param visitedPlayers Set of player indices already visited in this rotation
 * @returns Next eligible player index, or null if no eligible players remain
 */
export function getNextEligiblePlayer(
  currentPlayerIndex: number, 
  state: GameState, 
  visitedPlayers: Set<number> = new Set()
): number | null {
  const { players, currentBuyerIndex, currentPhase } = state
  const playerCount = players.length
  
  // Get the rotation order for this phase
  const buyerIncluded = isBuyerIncludedInPhase(currentPhase)
  const rotationOrder = getRotationOrder(currentBuyerIndex, playerCount, buyerIncluded)
  
  if (rotationOrder.length === 0) {
    return null
  }
  
  // If starting from beginning (-1), start from first position
  if (currentPlayerIndex === -1) {
    return getNextEligiblePlayerFromRotation(rotationOrder, 0, state, visitedPlayers)
  }
  
  // Find current position in rotation order
  const currentPositionInRotation = rotationOrder.indexOf(currentPlayerIndex)
  if (currentPositionInRotation === -1) {
    // Current player not in rotation for this phase, start from beginning
    return getNextEligiblePlayerFromRotation(rotationOrder, 0, state, visitedPlayers)
  }
  
  // Start checking from next position in rotation
  const nextPosition = (currentPositionInRotation + 1) % rotationOrder.length
  return getNextEligiblePlayerFromRotation(rotationOrder, nextPosition, state, visitedPlayers)
}

/**
 * Helper function to find next eligible player from rotation order
 * @param rotationOrder Array of player indices in rotation order
 * @param startPosition Position to start checking from
 * @param state Current game state
 * @param visitedPlayers Set of player indices already visited
 * @returns Next eligible player index, or null if none found
 */
function getNextEligiblePlayerFromRotation(
  rotationOrder: number[], 
  startPosition: number, 
  state: GameState, 
  visitedPlayers: Set<number>
): number | null {
  const { players, currentBuyerIndex, currentPhase } = state
  
  // Check each player in rotation order starting from startPosition
  for (let i = 0; i < rotationOrder.length; i++) {
    const positionToCheck = (startPosition + i) % rotationOrder.length
    const playerIndex = rotationOrder[positionToCheck]
    
    // Skip if we've already visited this player in this rotation
    if (visitedPlayers.has(playerIndex)) {
      continue
    }
    
    const player = players[playerIndex]
    const isBuyer = playerIndex === currentBuyerIndex
    
    // Check if this player has valid actions
    if (playerHasValidActions(player, currentPhase, isBuyer)) {
      return playerIndex
    }
  }
  
  // No eligible players found
  return null
}

/**
 * Checks if all eligible players have had their opportunity in the current phase
 * @param state Current game state
 * @param visitedPlayers Set of player indices that have been visited/skipped
 * @returns True if all eligible players have been processed
 */
export function allEligiblePlayersProcessed(state: GameState, visitedPlayers: Set<number>): boolean {
  const { players, currentBuyerIndex, currentPhase } = state
  const playerCount = players.length
  
  // Get the rotation order for this phase
  const buyerIncluded = isBuyerIncludedInPhase(currentPhase)
  const rotationOrder = getRotationOrder(currentBuyerIndex, playerCount, buyerIncluded)
  
  // Check if all players in rotation have been visited or have no valid actions
  for (const playerIndex of rotationOrder) {
    const player = players[playerIndex]
    const isBuyer = playerIndex === currentBuyerIndex
    
    // If player has valid actions but hasn't been visited, not all are processed
    if (playerHasValidActions(player, currentPhase, isBuyer) && !visitedPlayers.has(playerIndex)) {
      return false
    }
  }
  
  return true
}

/**
 * Gets all players who currently have action cards in their collection
 * @param state Current game state
 * @returns Array of player indices who have action cards
 */
export function getPlayersWithActionCards(state: GameState): number[] {
  const { players, currentBuyerIndex } = state
  const playersWithActionCards: number[] = []
  
  for (let i = 0; i < players.length; i++) {
    const player = players[i]
    const isBuyer = i === currentBuyerIndex
    
    if (playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)) {
      playersWithActionCards.push(i)
    }
  }
  
  return playersWithActionCards
}

/**
 * Initializes the pass system for action phase
 * @param state Current game state
 * @returns Updated state with pass system initialized
 */
export function initializeActionPhasePassSystem(state: GameState): GameState {
  const playersWithActionCards = getPlayersWithActionCards(state)
  
  return {
    ...state,
    actionPhasePassesRemaining: playersWithActionCards.length,
    actionPhasePlayersWithActionCards: playersWithActionCards
  }
}

/**
 * Resets the pass counter when someone plays an action card
 * @param state Current game state
 * @returns Updated state with reset pass counter
 */
export function resetPassCounter(state: GameState): GameState {
  const playersWithActionCards = getPlayersWithActionCards(state)
  
  return {
    ...state,
    actionPhasePassesRemaining: playersWithActionCards.length,
    actionPhasePlayersWithActionCards: playersWithActionCards
  }
}

/**
 * Decrements the pass counter when a player passes
 * @param state Current game state
 * @returns Updated state with decremented pass counter
 */
export function decrementPassCounter(state: GameState): GameState {
  return {
    ...state,
    actionPhasePassesRemaining: Math.max(0, state.actionPhasePassesRemaining - 1)
  }
}

/**
 * Checks if the action phase should end based on pass system
 * @param state Current game state
 * @returns True if action phase should end
 */
export function shouldEndActionPhase(state: GameState): boolean {
  // If no players have action cards, end the phase
  const playersWithActionCards = getPlayersWithActionCards(state)
  if (playersWithActionCards.length === 0) {
    return true
  }
  
  // If all players with action cards have passed, end the phase
  if (state.actionPhasePassesRemaining <= 0) {
    return true
  }
  
  return false
}

/**
 * Handles player passing during action phase (using pass system)
 * @param state Current game state
 * @param playerId Player who passed
 * @returns Updated game state
 */
export function handleActionPhasePlayerPass(state: GameState, playerId: number): GameState {
  // Validate that the player has action cards (only players with action cards can pass)
  const player = state.players[playerId]
  const isBuyer = playerId === state.currentBuyerIndex
  
  if (!playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)) {
    // Player has no action cards, they should be automatically skipped
    return advanceToNextEligiblePlayerInActionPhase(state)
  }
  
  // Decrement the pass counter
  const stateWithDecrementedPasses = decrementPassCounter(state)
  
  // Check if action phase should end
  if (shouldEndActionPhase(stateWithDecrementedPasses)) {
    return endActionPhaseAndAdvance(stateWithDecrementedPasses)
  }
  
  // Advance to next eligible player in action phase
  return advanceToNextEligiblePlayerInActionPhase(stateWithDecrementedPasses)
}

/**
 * Advances to the next eligible player specifically for action phase with pass system logic
 * @param state Current game state
 * @returns Updated game state with next eligible player
 */
export function advanceToNextEligiblePlayerInActionPhase(state: GameState): GameState {
  const { players, currentBuyerIndex, currentPlayerIndex } = state
  const playerCount = players.length
  
  // Get rotation order for action phase (includes buyer)
  const rotationOrder = getRotationOrder(currentBuyerIndex, playerCount, true)
  
  // Find current position in rotation
  const currentPositionInRotation = rotationOrder.indexOf(currentPlayerIndex)
  if (currentPositionInRotation === -1) {
    // Current player not in rotation, start from beginning
    return findNextEligiblePlayerInActionPhase(state, 0, rotationOrder)
  }
  
  // Start checking from next position in rotation
  const nextPosition = (currentPositionInRotation + 1) % rotationOrder.length
  return findNextEligiblePlayerInActionPhase(state, nextPosition, rotationOrder)
}

/**
 * Finds the next eligible player in action phase rotation
 * @param state Current game state
 * @param startPosition Position to start checking from
 * @param rotationOrder Array of player indices in rotation order
 * @returns Updated game state with next eligible player
 */
function findNextEligiblePlayerInActionPhase(
  state: GameState, 
  startPosition: number, 
  rotationOrder: number[]
): GameState {
  const { players, currentBuyerIndex } = state
  
  // Check each player in rotation order starting from startPosition
  for (let i = 0; i < rotationOrder.length; i++) {
    const positionToCheck = (startPosition + i) % rotationOrder.length
    const playerIndex = rotationOrder[positionToCheck]
    
    const player = players[playerIndex]
    const isBuyer = playerIndex === currentBuyerIndex
    
    // Check if this player has valid actions (action cards)
    if (playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)) {
      let newState = {
        ...state,
        currentPlayerIndex: playerIndex
      }
      
      // Apply automatic perspective following if enabled
      newState = updatePerspectiveForActivePlayer(newState, playerIndex)
      
      return newState
    }
  }
  
  // No eligible players found - action phase should end
  if (shouldEndActionPhase(state)) {
    return endActionPhaseAndAdvance(state)
  }
  
  // This shouldn't happen, but return current state as fallback
  return state
}

/**
 * Ends the action phase and advances to the next phase
 * @param state Current game state
 * @returns Updated game state with next phase
 */
function endActionPhaseAndAdvance(state: GameState): GameState {
  // Clear action phase pass system state
  const clearedState: GameState = {
    ...state,
    actionPhasePassesRemaining: 0,
    actionPhasePlayersWithActionCards: []
  }
  
  // Advance to next phase
  const { nextPhase, nextRound } = advanceToNextPhase(clearedState.currentPhase, clearedState.round)
  
  // Create state with advanced phase
  const stateWithNewPhase: GameState = {
    ...clearedState,
    currentPhase: nextPhase,
    round: nextRound,
    phaseInstructions: getPhaseInstructions(nextPhase)
  }
  
  // Set current player to first eligible player for the new phase
  const firstEligiblePlayer = getNextEligiblePlayer(-1, stateWithNewPhase, new Set())
  
  let finalState: GameState = {
    ...stateWithNewPhase,
    currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
  }
  
  // Apply automatic perspective following if enabled
  if (firstEligiblePlayer !== null) {
    finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
  }
  
  return finalState
}

/**
 * Automatically advances the current player to the next eligible player
 * @param state Current game state
 * @param visitedPlayers Set of player indices already processed in this phase
 * @returns Updated game state with next eligible player, or phase advancement if all done
 */
export function advanceToNextEligiblePlayer(state: GameState, visitedPlayers: Set<number> = new Set()): GameState {
  // Mark current player as visited
  const newVisitedPlayers = new Set(visitedPlayers)
  newVisitedPlayers.add(state.currentPlayerIndex)
  
  // Find next eligible player
  const nextPlayerIndex = getNextEligiblePlayer(state.currentPlayerIndex, state, newVisitedPlayers)
  
  if (nextPlayerIndex !== null) {
    // Found next eligible player
    let newState = {
      ...state,
      currentPlayerIndex: nextPlayerIndex
    }
    
    // Apply automatic perspective following if enabled
    newState = updatePerspectiveForActivePlayer(newState, nextPlayerIndex)
    
    return newState
  } else {
    // No more eligible players - check if we should advance phase
    if (allEligiblePlayersProcessed(state, newVisitedPlayers)) {
      // All eligible players have been processed - advance phase
      const { nextPhase, nextRound } = advanceToNextPhase(state.currentPhase, state.round)
      
      // Create state with advanced phase
      const stateWithNewPhase = {
        ...state,
        currentPhase: nextPhase,
        round: nextRound,
        phaseInstructions: getPhaseInstructions(nextPhase)
      }
      
      // Set current player to first eligible player for the new phase
      const firstEligiblePlayer = getNextEligiblePlayer(-1, stateWithNewPhase, new Set())
      
      let finalState = {
        ...stateWithNewPhase,
        currentPlayerIndex: firstEligiblePlayer !== null ? firstEligiblePlayer : 0
      }
      
      // Apply automatic perspective following if enabled
      if (firstEligiblePlayer !== null) {
        finalState = updatePerspectiveForActivePlayer(finalState, firstEligiblePlayer)
      }
      
      return finalState
    } else {
      // This shouldn't happen, but return current state as fallback
      return state
    }
  }
}

/**
 * Automatically updates perspective to follow the active player if auto-follow is enabled
 * @param state Current game state
 * @param newPlayerIndex New active player index
 * @returns Updated state with perspective following active player if enabled
 */
export function updatePerspectiveForActivePlayer(state: GameState, newPlayerIndex: number): GameState {
  if (!state.autoFollowPerspective) {
    return state
  }
  
  // Only update perspective if the new player index is valid and different from current perspective
  if (newPlayerIndex >= 0 && newPlayerIndex < state.players.length && newPlayerIndex !== state.selectedPerspective) {
    return {
      ...state,
      selectedPerspective: newPlayerIndex
    }
  }
  
  return state
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