import { GameState, GameAction, GamePhase, Player, Card, OfferCard, OfferCreationState } from '../types'
import { createShuffledDeck, shuffleArray, identifyGotchaSetsInOrder, identifyThingSets } from './cards'

/**
 * Randomly selects a buyer from the players
 */
export function selectRandomBuyer(playerCount: number): number {
  return Math.floor(Math.random() * playerCount)
}

/**
 * Initializes offer creation for a seller during offer phase
 */
export function initializeOfferCreation(state: GameState, playerId: number): GameState {
  const player = state.players[playerId]
  
  // Handle edge case: if player has 3 or fewer cards, auto-move all to offer and go to flipping mode
  if (player.hand.length <= 3) {
    const newState = { ...state }
    newState.players = state.players.map((p, index) => {
      if (index !== playerId) {
        return p
      }
      
      // Move all cards from hand to offer as face-down
      const newOffer = p.hand.map((card, cardIndex) => ({
        ...card,
        faceUp: false,
        position: cardIndex
      }))
      
      return {
        ...p,
        hand: [],
        offer: newOffer
      }
    })
    
    // Set offer creation state to flipping mode
    newState.offerCreationState = {
      playerId,
      mode: 'flipping'
    }
    
    return newState
  } else {
    // Normal case: enter selecting mode
    return {
      ...state,
      offerCreationState: {
        playerId,
        mode: 'selecting'
      }
    }
  }
}

/**
 * Checks if offer creation is complete for all sellers
 */
export function areAllOfferCreationsComplete(state: GameState): boolean {
  if (state.currentPhase !== GamePhase.OFFER_PHASE) {
    return false
  }
  
  // Get all sellers (players who are not the buyer)
  const sellers = state.players.filter((_, index) => index !== state.currentBuyerIndex)
  
  // Check if all sellers have completed offers (offer array has 3 cards and at least one is face up)
  return sellers.every(seller => 
    seller.offer.length === 3 && seller.offer.some(card => card.faceUp)
  )
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
      return advanceToNextPhaseWithInitialization(state)
    
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
    
    case 'MOVE_CARD_TO_OFFER':
      return moveCardToOffer(state, action.playerId, action.cardId)
    
    case 'MOVE_CARD_TO_HAND':
      return moveCardToHand(state, action.playerId, action.cardId)
    
    case 'LOCK_OFFER_FOR_FLIPPING':
      return lockOfferForFlipping(state, action.playerId)
    
    case 'FLIP_OFFER_CARD':
      return flipOfferCard(state, action.playerId, action.cardIndex)
    
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
    
    case 'MOVE_CARD_TO_OFFER':
    case 'MOVE_CARD_TO_HAND':
    case 'LOCK_OFFER_FOR_FLIPPING':
    case 'FLIP_OFFER_CARD':
      return phase === GamePhase.OFFER_PHASE
    
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
  newState.players = state.players.map(player => ({ ...player, hand: [...player.hand] }))
  newState.drawPile = [...state.drawPile]
  newState.discardPile = [...state.discardPile]

  // Calculate how many cards each player needs (bring to 5 cards)
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
          console.warn('No more cards available for dealing')
          break
        }
        
        // Reshuffle discard pile into draw pile
        console.log('Reshuffling discard pile into draw pile:', newState.discardPile.length, 'cards')
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
  
  // Advance to next phase
  newState.currentPhase = GamePhase.OFFER_PHASE
  newState.phaseInstructions = 'Place your offers (3 cards, 1 face up)'
  
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

  // Generate previous round summary
  const buyer = state.players[buyerId]
  const selectedOfferCards = selectedSeller.offer.map(card => card.name)
  
  // Get all other sellers and their returned cards
  const otherSellers = state.players
    .map((player, index) => ({ player, index }))
    .filter(({ index, player }) => index !== buyerId && index !== sellerId && player.offer.length > 0)
  
  let summaryParts = [
    `• ${buyer.name} gave ${selectedSeller.name} the money bag and received: ${selectedOfferCards.join(', ')}.`
  ]
  
  otherSellers.forEach(({ player }) => {
    const returnedCards = player.offer.map(card => card.name)
    summaryParts.push(`• ${player.name} got ${returnedCards.join(', ')}.`)
  })
  
  const previousRoundSummary = summaryParts.join('\n')

  const newState = { ...state, previousRoundSummary }
  
  // Process all players according to their role in the transaction
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

  // Advance to next phase using proper initialization
  return advanceToNextPhaseWithInitialization(newState)
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

  // Validate that only current player can play
  if (playerId !== state.currentPlayerIndex) {
    throw new Error('Only the current player can play action cards')
  }

  const newState = { ...state }
  const playerIndex = newState.players.findIndex(p => p.id === playerId)
  
  if (playerIndex === -1) {
    return state
  }

  // Find and remove the card from player's collection
  const cardIndex = newState.players[playerIndex].collection.findIndex(c => c.id === cardId)
  if (cardIndex === -1) {
    throw new Error('Action card not found in player\'s collection')
  }

  const card = newState.players[playerIndex].collection[cardIndex]
  
  // Validate that it's an action card
  if (card.type !== 'action') {
    throw new Error('Card is not an action card')
  }
  
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
      // Check if there are any valid targets (players with more points)
      const currentPlayer = newState.players[playerId]
      const validTargets = newState.players.filter(p => 
        p.id !== playerId && p.points > currentPlayer.points
      )
      
      if (validTargets.length === 0) {
        // No valid targets - clear effect and advance player immediately
        // Check if player has no more action cards (auto-mark as done)
        const isBuyer = playerId === newState.currentBuyerIndex
        
        if (!playerHasValidActions(currentPlayer, GamePhase.ACTION_PHASE, isBuyer)) {
          // Player has no more action cards, mark as done
          const stateWithPlayerDone = markPlayerAsDone(newState, playerId)
          
          // Check if action phase should end
          if (shouldEndActionPhase(stateWithPlayerDone)) {
            return endActionPhaseAndAdvance(stateWithPlayerDone)
          }
          
          // Advance to next eligible player
          return advanceToNextEligiblePlayerInActionPhase(stateWithPlayerDone)
        }

        // Advance to next eligible player since the effect had no impact
        return advanceToNextEligiblePlayerInActionPhase(newState)
      } else {
        // Valid targets exist - set up effect state
        newState.stealAPointEffectState = {
          playerId,
          awaitingTargetSelection: true
        }
      }
      break
    
    default:
      // Unknown action card, just discard it
      break
  }
  
  // Reset the done states since someone played an action card
  const stateWithResetDoneStates = resetDoneStates(newState)
  
  // Check if action phase should end (no more players with action cards)
  if (shouldEndActionPhase(stateWithResetDoneStates)) {
    return endActionPhaseAndAdvance(stateWithResetDoneStates)
  }
  
  // Return state without advancing player - let effect completion handle advancement
  return stateWithResetDoneStates
}

/**
 * Declare done for action phase
 */
function declareDone(state: GameState, playerId: number): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE) {
    return state
  }

  // Validate that only current player can declare done
  if (playerId !== state.currentPlayerIndex) {
    throw new Error('Only the current player can declare done')
  }

  // Use the proper action phase done handling
  return handleActionPhasePlayerDone(state, playerId)
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
    const affectedPlayerName = newState.players[state.gotchaEffectState.affectedPlayerIndex].name
    const cardNames = newState.gotchaEffectState.selectedCards.map(c => c.name).join(', ')
    newState.phaseInstructions = `Buyer must choose to steal or discard ${cardNames} from ${affectedPlayerName}'s collection`
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

  return handleGotchaActionChoice(state, action)
}

/**
 * Select a card for Flip One effect
 */
function selectFlipOneCard(state: GameState, offerId: number, cardIndex: number): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE || !state.flipOneEffectState) {
    return state
  }

  const newState = { ...state }
  const playerId = state.flipOneEffectState.playerId
  
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

  // Check if player has no more action cards (auto-mark as done)
  const player = newState.players[playerId]
  const isBuyer = playerId === newState.currentBuyerIndex
  
  if (!playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)) {
    // Player has no more action cards, mark as done
    const stateWithPlayerDone = markPlayerAsDone(newState, playerId)
    
    // Check if action phase should end
    if (shouldEndActionPhase(stateWithPlayerDone)) {
      return endActionPhaseAndAdvance(stateWithPlayerDone)
    }
    
    // Advance to next eligible player
    return advanceToNextEligiblePlayerInActionPhase(stateWithPlayerDone)
  }

  // Advance to next eligible player since the effect is complete
  return advanceToNextEligiblePlayerInActionPhase(newState)
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

  // Update phase instructions without revealing card name
  newState.phaseInstructions = `${player.name} selected a card. Now select an offer to add it to.`

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
  const playerId = state.addOneEffectState.playerId
  
  // Remove card from player's hand
  newState.players[playerId].hand = newState.players[playerId].hand.filter(c => c.id !== selectedCard.id)
  
  // Add card to the selected offer (face down and hidden from owner)
  if (offerId < newState.players.length) {
    const offerCard: OfferCard = {
      ...selectedCard,
      faceUp: false,
      position: newState.players[offerId].offer.length,
      hiddenFromOwner: true
    }
    
    newState.players[offerId].offer.push(offerCard)
  }

  // Clear the effect
  newState.addOneEffectState = null

  // Check if player has no more action cards (auto-mark as done)
  const player = newState.players[playerId]
  const isBuyer = playerId === newState.currentBuyerIndex
  
  if (!playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)) {
    // Player has no more action cards, mark as done
    const stateWithPlayerDone = markPlayerAsDone(newState, playerId)
    
    // Check if action phase should end
    if (shouldEndActionPhase(stateWithPlayerDone)) {
      return endActionPhaseAndAdvance(stateWithPlayerDone)
    }
    
    // Advance to next eligible player
    return advanceToNextEligiblePlayerInActionPhase(stateWithPlayerDone)
  }

  // Advance to next eligible player since the effect is complete
  return advanceToNextEligiblePlayerInActionPhase(newState)
}

/**
 * Select a card for Remove One effect
 */
function selectRemoveOneCard(state: GameState, offerId: number, cardIndex: number): GameState {
  if (state.currentPhase !== GamePhase.ACTION_PHASE || !state.removeOneEffectState) {
    return state
  }

  const newState = { ...state }
  const playerId = state.removeOneEffectState.playerId
  
  // Remove the selected card
  if (offerId < newState.players.length && cardIndex < newState.players[offerId].offer.length) {
    const removedCard = newState.players[offerId].offer[cardIndex]
    newState.players[offerId].offer.splice(cardIndex, 1)
    newState.discardPile.push(removedCard)
  }

  // Clear the effect
  newState.removeOneEffectState = null

  // Check if player has no more action cards (auto-mark as done)
  const player = newState.players[playerId]
  const isBuyer = playerId === newState.currentBuyerIndex
  
  if (!playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)) {
    // Player has no more action cards, mark as done
    const stateWithPlayerDone = markPlayerAsDone(newState, playerId)
    
    // Check if action phase should end
    if (shouldEndActionPhase(stateWithPlayerDone)) {
      return endActionPhaseAndAdvance(stateWithPlayerDone)
    }
    
    // Advance to next eligible player
    return advanceToNextEligiblePlayerInActionPhase(stateWithPlayerDone)
  }

  // Advance to next eligible player since the effect is complete
  return advanceToNextEligiblePlayerInActionPhase(newState)
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
      // Clear the effect
      const playerId = newState.removeTwoEffectState.playerId
      newState.removeTwoEffectState = null
      
      // Check if player has no more action cards (auto-mark as done)
      const player = newState.players[playerId]
      const isBuyer = playerId === newState.currentBuyerIndex
      
      if (!playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)) {
        // Player has no more action cards, mark as done
        const stateWithPlayerDone = markPlayerAsDone(newState, playerId)
        
        // Check if action phase should end
        if (shouldEndActionPhase(stateWithPlayerDone)) {
          return endActionPhaseAndAdvance(stateWithPlayerDone)
        }
        
        // Advance to next eligible player
        return advanceToNextEligiblePlayerInActionPhase(stateWithPlayerDone)
      }

      // Advance to next eligible player since the effect is complete
      return advanceToNextEligiblePlayerInActionPhase(newState)
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
  const playerId = state.stealAPointEffectState.playerId
  const sourcePlayer = newState.players[playerId]
  const targetPlayer = newState.players.find(p => p.id === targetPlayerId)
  
  if (!targetPlayer || targetPlayer.points <= sourcePlayer.points) {
    return state // Invalid target
  }

  // Transfer one point
  newState.players[playerId].points += 1
  newState.players.find(p => p.id === targetPlayerId)!.points -= 1

  // Clear the effect
  newState.stealAPointEffectState = null

  // Check if player has no more action cards (auto-mark as done)
  const player = newState.players[playerId]
  const isBuyer = playerId === newState.currentBuyerIndex
  
  if (!playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)) {
    // Player has no more action cards, mark as done
    const stateWithPlayerDone = markPlayerAsDone(newState, playerId)
    
    // Check if action phase should end
    if (shouldEndActionPhase(stateWithPlayerDone)) {
      return endActionPhaseAndAdvance(stateWithPlayerDone)
    }
    
    // Advance to next eligible player
    return advanceToNextEligiblePlayerInActionPhase(stateWithPlayerDone)
  }

  // Advance to next eligible player since the effect is complete
  return advanceToNextEligiblePlayerInActionPhase(newState)
}

/**
 * Move a card from player's hand to their offer area
 */
function moveCardToOffer(state: GameState, playerId: number, cardId: string): GameState {
  if (state.currentPhase !== GamePhase.OFFER_PHASE) {
    return state
  }

  const playerIndex = state.players.findIndex(p => p.id === playerId)
  
  if (playerIndex === -1 || playerIndex === state.currentBuyerIndex) {
    return state // Invalid player or buyer can't place offers
  }

  // If no offer creation state exists, or it's for a different player, initialize it for this player
  // This allows multiple sellers to create offers simultaneously
  let workingState = state
  if (!state.offerCreationState || state.offerCreationState.playerId !== playerId) {
    // Check if this player is eligible (is a seller and hasn't completed their offer)
    const player = state.players[playerIndex]
    if (player.offer.length === 0 || (player.offer.length < 3 && !player.offer.some(card => card.faceUp))) {
      // Initialize offer creation for this player
      workingState = initializeOfferCreation(state, playerId)
    } else {
      return state // Player has already completed their offer
    }
  }

  // Validate that we're in selecting mode
  if (workingState.offerCreationState?.mode !== 'selecting') {
    return state
  }

  const newState = { ...workingState }
  const player = newState.players[playerIndex]
  const cardIndex = player.hand.findIndex(c => c.id === cardId)
  
  if (cardIndex === -1) {
    return state // Card not found in hand
  }

  // Check if offer already has 3 cards
  if (player.offer.length >= 3) {
    return state // Offer is full
  }

  const card = player.hand[cardIndex]
  
  // Remove card from hand
  newState.players[playerIndex].hand = player.hand.filter(c => c.id !== cardId)
  
  // Add card to offer as face-down
  const offerCard = {
    ...card,
    faceUp: false,
    position: player.offer.length
  }
  
  newState.players[playerIndex].offer = [...player.offer, offerCard]

  return newState
}

/**
 * Move a card from player's offer area back to their hand
 */
function moveCardToHand(state: GameState, playerId: number, cardId: string): GameState {
  if (state.currentPhase !== GamePhase.OFFER_PHASE) {
    return state
  }

  // Validate that offer creation is active for this player and in selecting mode
  if (!state.offerCreationState || state.offerCreationState.playerId !== playerId || state.offerCreationState.mode !== 'selecting') {
    return state
  }

  const newState = { ...state }
  const playerIndex = newState.players.findIndex(p => p.id === playerId)
  
  if (playerIndex === -1 || playerIndex === state.currentBuyerIndex) {
    return state // Invalid player or buyer can't place offers
  }

  const player = newState.players[playerIndex]
  const cardIndex = player.offer.findIndex(c => c.id === cardId)
  
  if (cardIndex === -1) {
    return state // Card not found in offer
  }

  const offerCard = player.offer[cardIndex]
  
  // Convert back to regular card (remove offer-specific properties)
  const card = {
    id: offerCard.id,
    type: offerCard.type,
    subtype: offerCard.subtype,
    name: offerCard.name,
    setSize: offerCard.setSize,
    effect: offerCard.effect
  }
  
  // Remove card from offer
  newState.players[playerIndex].offer = player.offer.filter(c => c.id !== cardId)
  
  // Reposition remaining cards
  newState.players[playerIndex].offer = newState.players[playerIndex].offer.map((card, index) => ({
    ...card,
    position: index
  }))
  
  // Add card back to hand
  newState.players[playerIndex].hand = [...player.hand, card]

  return newState
}

/**
 * Lock the offer for flipping (transition from selecting to flipping mode)
 */
function lockOfferForFlipping(state: GameState, playerId: number): GameState {
  if (state.currentPhase !== GamePhase.OFFER_PHASE) {
    return state
  }

  const playerIndex = state.players.findIndex(p => p.id === playerId)
  
  if (playerIndex === -1 || playerIndex === state.currentBuyerIndex) {
    return state // Invalid player or buyer can't place offers
  }

  const player = state.players[playerIndex]
  
  // Validate that player has exactly 3 cards in offer
  if (player.offer.length !== 3) {
    return state
  }

  // If no offer creation state exists for this player, or it's for a different player,
  // initialize it in selecting mode first, then transition to flipping
  let workingState = state
  if (!state.offerCreationState || state.offerCreationState.playerId !== playerId) {
    workingState = {
      ...state,
      offerCreationState: {
        playerId,
        mode: 'selecting'
      }
    }
  }

  // Validate that we're in selecting mode
  if (workingState.offerCreationState?.mode !== 'selecting') {
    return state
  }

  // Transition to flipping mode
  return {
    ...workingState,
    offerCreationState: {
      playerId,
      mode: 'flipping'
    }
  }
}

/**
 * Flip a card in the player's offer during offer creation
 */
function flipOfferCard(state: GameState, playerId: number, cardIndex: number): GameState {
  if (state.currentPhase !== GamePhase.OFFER_PHASE) {
    return state
  }

  // Validate that offer creation is active for this player and in flipping mode
  if (!state.offerCreationState || state.offerCreationState.playerId !== playerId || state.offerCreationState.mode !== 'flipping') {
    return state
  }

  const newState = { ...state }
  const playerIndex = newState.players.findIndex(p => p.id === playerId)
  
  if (playerIndex === -1 || playerIndex === state.currentBuyerIndex) {
    return state // Invalid player or buyer can't place offers
  }

  const player = newState.players[playerIndex]
  
  // Validate card index
  if (cardIndex < 0 || cardIndex >= player.offer.length) {
    return state
  }

  // Flip the selected card
  const updatedOffer = [...player.offer]
  updatedOffer[cardIndex] = {
    ...updatedOffer[cardIndex],
    faceUp: true
  }
  
  newState.players[playerIndex].offer = updatedOffer

  // Complete the offer creation
  newState.offerCreationState = {
    playerId,
    mode: 'complete'
  }

  // Check if all sellers have completed their offers
  if (areAllOfferCreationsComplete(newState)) {
    // Clear offer creation state and advance to buyer flip phase
    newState.offerCreationState = null
    newState.currentPhase = GamePhase.BUYER_FLIP
    newState.phaseInstructions = 'Buyer: Flip cards to see what you want to buy'
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
    offerCreationState: null,
    selectedPerspective: 0,
    phaseInstructions: 'Game starting...',
    autoFollowPerspective: true,
    previousRoundSummary: null,
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
  
  // Clear previousRoundSummary when leaving OFFER_PHASE
  const shouldClearSummary = state.currentPhase === GamePhase.OFFER_PHASE
  
  // Create state with advanced phase
  const stateWithNewPhase = {
    ...state,
    currentPhase: nextPhase,
    round: nextRound,
    phaseInstructions: getPhaseInstructions(nextPhase),
    ...(shouldClearSummary && { previousRoundSummary: null })
  }
  
  // Initialize special phases if we're entering them
  let stateWithInitializedPhase = stateWithNewPhase
  if (nextPhase === GamePhase.ACTION_PHASE) {
    stateWithInitializedPhase = initializeActionPhase(stateWithNewPhase)
  } else if (nextPhase === GamePhase.OFFER_PHASE) {
    // Initialize offer creation for the first eligible seller
    const sellers = stateWithNewPhase.players.filter((_, index) => index !== stateWithNewPhase.currentBuyerIndex)
    if (sellers.length > 0) {
      // Find first seller and initialize their offer creation
      const firstSellerIndex = stateWithNewPhase.players.findIndex((_, index) => index !== stateWithNewPhase.currentBuyerIndex)
      if (firstSellerIndex !== -1) {
        stateWithInitializedPhase = initializeOfferCreation(stateWithNewPhase, firstSellerIndex)
      }
    }
  } else if (nextPhase === GamePhase.DEAL) {
    // Automatically handle deal phase
    stateWithInitializedPhase = handleDealPhase(stateWithNewPhase)
  } else if (nextPhase === GamePhase.OFFER_DISTRIBUTION) {
    // Automatically handle offer distribution phase
    stateWithInitializedPhase = handleOfferDistributionPhase(stateWithNewPhase)
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
  
  // Find first eligible player and set as current player
  const rotationOrder = getRotationOrder(stateWithDoneSystem.currentBuyerIndex, stateWithDoneSystem.players.length, true)
  const firstEligiblePlayer = findNextEligiblePlayerInActionPhase(stateWithDoneSystem, 0, rotationOrder)
  
  return firstEligiblePlayer
}

/**
 * Checks if a player has valid actions in the current phase
 * @param player Player to check
 * @param phase Current game phase
 * @param isBuyer Whether the player is the buyer
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
 * Gets the next player index (with wraparound)
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
 * Gets array of player indices who have action cards
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
 * Marks a player as done in the action phase
 * @param state Current game state
 * @param playerId Player ID to mark as done
 * @returns Updated state with player marked as done
 */
export function markPlayerAsDone(state: GameState, playerId: number): GameState {
  const newDoneStates = [...state.actionPhaseDoneStates]
  newDoneStates[playerId] = true
  
  return {
    ...state,
    actionPhaseDoneStates: newDoneStates
  }
}

/**
 * Updates perspective to follow active player if auto-follow is enabled
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
 * Initialize action phase done system
 */
function initializeActionPhaseDoneSystem(state: GameState): GameState {
  const doneStates = state.players.map((player, index) => {
    // Players with no action cards are automatically done (checked and disabled)
    const isBuyer = index === state.currentBuyerIndex
    return !playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)
  })
  
  return {
    ...state,
    actionPhaseDoneStates: doneStates
  }
}

/**
 * Resets the done states when someone plays an action card
 * All players who still have action cards get their checkbox unchecked
 * Players who played their last action card get automatically marked as done
 * @param state Current game state
 * @returns Updated state with reset done states
 */
export function resetDoneStates(state: GameState): GameState {
  const doneStates = state.players.map((player, index) => {
    const isBuyer = index === state.currentBuyerIndex
    // Players with no action cards are done (checked and disabled)
    return !playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)
  })
  
  return {
    ...state,
    actionPhaseDoneStates: doneStates
  }
}

/**
 * Checks if the action phase should end based on done system
 * @param state Current game state
 * @returns True if action phase should end
 */
export function shouldEndActionPhase(state: GameState): boolean {
  // If a Flip One effect is active, don't end the action phase
  if (state.flipOneEffectState && state.flipOneEffectState.awaitingCardSelection) {
    return false
  }
  
  // If an Add One effect is active, don't end the action phase
  if (state.addOneEffectState && (state.addOneEffectState.awaitingHandCardSelection || state.addOneEffectState.awaitingOfferSelection)) {
    return false
  }
  
  // If a Remove One effect is active, don't end the action phase
  if (state.removeOneEffectState && state.removeOneEffectState.awaitingCardSelection) {
    return false
  }
  
  // If a Remove Two effect is active, don't end the action phase
  if (state.removeTwoEffectState && state.removeTwoEffectState.awaitingCardSelection) {
    return false
  }
  
  // If a Steal A Point effect is active, don't end the action phase
  if (state.stealAPointEffectState && state.stealAPointEffectState.awaitingTargetSelection) {
    return false
  }
  
  // If no players have action cards, end the phase
  const playersWithActionCards = getPlayersWithActionCards(state)
  if (playersWithActionCards.length === 0) {
    return true
  }
  
  // If all checkboxes are checked (all players are done), end the phase
  if (state.actionPhaseDoneStates.length > 0 && state.actionPhaseDoneStates.every(done => done)) {
    return true
  }
  
  return false
}

/**
 * Handles player declaring done during action phase (using done system)
 * @param state Current game state
 * @param playerId Player who declared done
 * @returns Updated game state
 */
export function handleActionPhasePlayerDone(state: GameState, playerId: number): GameState {
  // Validate that the player has action cards (only players with action cards can declare done)
  const player = state.players[playerId]
  const isBuyer = playerId === state.currentBuyerIndex
  
  if (!playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)) {
    // Player has no action cards, they should be automatically done already
    return advanceToNextEligiblePlayerInActionPhase(state)
  }
  
  // Mark the player as done
  const stateWithPlayerDone = markPlayerAsDone(state, playerId)
  
  // Check if action phase should end
  if (shouldEndActionPhase(stateWithPlayerDone)) {
    return endActionPhaseAndAdvance(stateWithPlayerDone)
  }
  
  // Advance to next eligible player in action phase
  return advanceToNextEligiblePlayerInActionPhase(stateWithPlayerDone)
}

/**
 * Advances to the next eligible player specifically for action phase with done system logic
 * Only players who are not done participate in rotation
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
 * Only players who are not done and have action cards can be active
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
    
    // Check if this player has valid actions (action cards) and is not done
    const hasActionCards = playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)
    const isDone = state.actionPhaseDoneStates[playerIndex] || false
    
    if (hasActionCards && !isDone) {
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
  // Clear action phase done system state
  const clearedState: GameState = {
    ...state,
    actionPhaseDoneStates: []
  }
  
  // Advance to next phase
  return advanceToNextPhaseWithInitialization(clearedState)
}
/**
 * Applies Gotcha Bad effect to a player
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
  const stateAfterProcessing = processGotchaTradeins(newState)
  
  // If there's still a pending Gotcha effect, wait for buyer interaction
  if (stateAfterProcessing.gotchaEffectState !== null) {
    return stateAfterProcessing
  }
  
  // No more Gotcha effects - advance to next phase with automatic processing
  return advanceToNextPhaseWithInitialization(stateAfterProcessing)
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
  
  // Continue processing iteratively until no complete Gotcha sets remain
  while (true) {
    let foundGotchaSet = false
    
    // Process in priority order: Bad, Twice, Once (across all players)
    for (const subtype of ['bad', 'twice', 'once']) {
      // Check all players for this subtype
      for (let playerIndex = 0; playerIndex < newState.players.length; playerIndex++) {
        const player = newState.players[playerIndex]
        const setsBySubtype = identifyGotchaSetsInOrder(player.collection)
        const completeSets = setsBySubtype[subtype]
        
        if (completeSets.length > 0) {
          // Found a Gotcha set of this subtype - process the first one
          const set = completeSets[0]
          foundGotchaSet = true
          
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
          } else if (subtype === 'twice') {
            // Apply Gotcha Twice effect: buyer selects 2 cards to steal/discard
            newState = applyGotchaTwiceEffect(newState, playerIndex)
            
            // If buyer interaction is needed, return state with pending effect
            if (newState.gotchaEffectState !== null) {
              return newState
            }
          } else if (subtype === 'once') {
            // Apply Gotcha Once effect: buyer selects 1 card to steal/discard
            newState = applyGotchaOnceEffect(newState, playerIndex)
            
            // If buyer interaction is needed, return state with pending effect
            if (newState.gotchaEffectState !== null) {
              return newState
            }
          }
          
          // Break out of both loops to restart checking from the beginning
          // This ensures we always process in priority order after each set
          break
        }
      }
      
      // If we found a set, break out of subtype loop to restart from 'bad'
      if (foundGotchaSet) {
        break
      }
    }
    
    // If no Gotcha sets were found in any player's collection, we're done
    if (!foundGotchaSet) {
      break
    }
  }
  
  return newState
}

/**
 * Processes automatic Thing trade-ins for all players
 * Removes complete Thing sets from collections and awards points
 */
export function processThingTradeins(state: GameState): GameState {
  const newState = { ...state }
  const tradeInSummaryParts: string[] = []
  
  newState.players = state.players.map(player => {
    const playerCopy = { ...player, collection: [...player.collection] }
    
    // Identify complete Thing sets
    const completeSets = identifyThingSets(playerCopy.collection)
    
    if (completeSets.length === 0) {
      return playerCopy
    }
    
    // Calculate points for complete sets and generate summary
    const pointsEarned = completeSets.length // Each complete set = 1 point
    
    // Group sets by type for summary
    const setsByType: { [key: string]: number } = {}
    completeSets.forEach(set => {
      const setType = set[0].subtype
      const setCount = set.length
      const key = `${setCount} ${setType} thing${setCount > 1 ? 's' : ''}`
      setsByType[key] = (setsByType[key] || 0) + 1
    })
    
    // Generate summary for this player
    if (pointsEarned > 0) {
      const setDescriptions = Object.entries(setsByType).map(([setType, count]) => 
        count === 1 ? setType : `${count} sets of ${setType}`
      )
      const pointText = pointsEarned === 1 ? '1 point' : `${pointsEarned} points`
      const totalPoints = playerCopy.points + pointsEarned
      const totalPointsText = totalPoints === 1 ? '1 point' : `${totalPoints} points`
      tradeInSummaryParts.push(`• ${player.name} turned in ${setDescriptions.join(' and ')} for ${pointText}. They now have ${totalPointsText}.`)
    }
    
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
  
  // Append trade-in summary to previousRoundSummary if there were any trade-ins
  if (tradeInSummaryParts.length > 0) {
    const existingSummary = newState.previousRoundSummary || ''
    const tradeInSummary = tradeInSummaryParts.join('\n')
    newState.previousRoundSummary = existingSummary ? `${existingSummary}\n${tradeInSummary}` : tradeInSummary
  }
  
  return newState
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
 * Handles the offer distribution phase automatically
 * Offer distribution is already complete (handled in SELECT_OFFER action)
 * Just automatically advance to next phase
 */
function handleOfferDistributionPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.OFFER_DISTRIBUTION) {
    return state
  }

  // Offer distribution is already complete (handled in SELECT_OFFER action)
  // Just automatically advance to next phase
  return advanceToNextPhaseWithInitialization(state)
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

  // Process Gotcha trade-ins for all players
  const newState = processGotchaTradeins(state)
  
  // If there's a pending Gotcha effect, wait for buyer interaction
  if (newState.gotchaEffectState !== null) {
    return newState
  }
  
  // No pending effects - processing is complete, but don't auto-advance
  // Let the caller (advanceToNextPhaseWithInitialization) handle phase advancement
  return newState
}

/**
 * Handles the Thing trade-ins phase automatically
 */
function handleThingTradeinsPhase(state: GameState): GameState {
  if (state.currentPhase !== GamePhase.THING_TRADEINS) {
    return state
  }

  // Process Thing trade-ins for all players
  const newState = processThingTradeins(state)
  
  // Processing is complete, but don't auto-advance
  // Let the caller (advanceToNextPhaseWithInitialization) handle phase advancement
  return newState
}