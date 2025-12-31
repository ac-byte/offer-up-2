import * as fc from 'fast-check'
import { GameState, GamePhase, Player, Card } from '../../types'
import { applyGotchaTwiceEffect, handleGotchaCardActionChoice } from '../../game-logic/gameReducer'

// Helper function to create a mock game state
function createMockGameState(players: Player[]): GameState {
  return {
    players,
    currentBuyerIndex: 0,
    nextBuyerIndex: 0,
    currentPhase: GamePhase.GOTCHA_TRADEINS,
    currentPlayerIndex: 0,
    round: 1,
    drawPile: [],
    discardPile: [],
    actionPhasePassesRemaining: 0,
    actionPhasePlayersWithActionCards: [],
    gotchaEffectState: null,
    selectedPerspective: 0,
    phaseInstructions: '',
    autoFollowPerspective: true,
    winner: null,
    gameStarted: true
  }
}

// Helper function to create a mock player
function createMockPlayer(id: number, name: string, collection: Card[] = []): Player {
  return {
    id,
    name,
    hand: [],
    offer: [],
    collection,
    points: 0,
    hasMoney: id === 0
  }
}

// Arbitrary for generating cards with unique IDs
const cardArbitrary = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
  type: fc.constantFrom('thing', 'gotcha', 'action'),
  subtype: fc.constantFrom('giant', 'big', 'medium', 'tiny', 'once', 'twice', 'bad', 'flip-one', 'add-one', 'remove-one', 'remove-two', 'steal-point'),
  name: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
  setSize: fc.integer({ min: 1, max: 4 })
}) as fc.Arbitrary<Card>

// Arbitrary for generating collections of cards
const collectionArbitrary = fc.array(cardArbitrary, { minLength: 0, maxLength: 20 })

describe('Feature: trading-card-game, Property 45: Gotcha Twice card selection', () => {
  test('Property 45: Gotcha Twice card selection - For any player trading in a set of 2 Gotcha Twice cards, the buyer should be able to select exactly two cards from that player\'s collection', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // affected player index (1-3 to ensure we have enough players)
        collectionArbitrary,
        (affectedPlayerIndex, collection) => {
          // Create players (buyer at 0, then 3 more players)
          const players = [
            createMockPlayer(0, 'Buyer'),
            createMockPlayer(1, 'Player1', affectedPlayerIndex === 1 ? collection : []),
            createMockPlayer(2, 'Player2', affectedPlayerIndex === 2 ? collection : []),
            createMockPlayer(3, 'Player3', affectedPlayerIndex === 3 ? collection : [])
          ]
          
          const state = createMockGameState(players)
          const newState = applyGotchaTwiceEffect(state, affectedPlayerIndex)
          
          if (collection.length === 0) {
            // When player has no cards, state should remain unchanged
            expect(newState).toBe(state)
            expect(newState.gotchaEffectState).toBe(null)
          } else if (collection.length === 1) {
            // When player has 1 card, should auto-select it and await buyer choice
            expect(newState.gotchaEffectState).not.toBe(null)
            expect(newState.gotchaEffectState?.type).toBe('twice')
            expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(affectedPlayerIndex)
            expect(newState.gotchaEffectState?.cardsToSelect).toBe(1)
            expect(newState.gotchaEffectState?.selectedCards).toHaveLength(1)
            expect(newState.gotchaEffectState?.selectedCards[0]).toEqual(collection[0])
            expect(newState.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
          } else if (collection.length === 2) {
            // When player has exactly 2 cards, should auto-select both and await buyer choice
            expect(newState.gotchaEffectState).not.toBe(null)
            expect(newState.gotchaEffectState?.type).toBe('twice')
            expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(affectedPlayerIndex)
            expect(newState.gotchaEffectState?.cardsToSelect).toBe(2)
            expect(newState.gotchaEffectState?.selectedCards).toHaveLength(2)
            expect(newState.gotchaEffectState?.selectedCards).toEqual(collection)
            expect(newState.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
          } else {
            // When player has more than 2 cards, should create selection state
            expect(newState.gotchaEffectState).not.toBe(null)
            expect(newState.gotchaEffectState?.type).toBe('twice')
            expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(affectedPlayerIndex)
            expect(newState.gotchaEffectState?.cardsToSelect).toBe(2)
            expect(newState.gotchaEffectState?.selectedCards).toHaveLength(0)
            expect(newState.gotchaEffectState?.awaitingBuyerChoice).toBe(false)
          }
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Feature: trading-card-game, Property 46: Gotcha Twice independent choices', () => {
  test('Property 46: Gotcha Twice independent choices - For any Gotcha Twice effect, the buyer should be able to choose independently for each card whether to steal it or discard it', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // affected player index (1-3 to ensure we have enough players)
        fc.tuple(cardArbitrary, cardArbitrary).filter(([card1, card2]) => card1.id !== card2.id), // exactly 2 cards with unique IDs
        fc.constantFrom('steal', 'discard'), // first choice
        fc.constantFrom('steal', 'discard'), // second choice
        (affectedPlayerIndex, [card1, card2], firstChoice, secondChoice) => {
          const collection = [card1, card2]
          
          // Create players (buyer at 0, then 3 more players)
          const players = [
            createMockPlayer(0, 'Buyer'),
            createMockPlayer(1, 'Player1', affectedPlayerIndex === 1 ? collection : []),
            createMockPlayer(2, 'Player2', affectedPlayerIndex === 2 ? collection : []),
            createMockPlayer(3, 'Player3', affectedPlayerIndex === 3 ? collection : [])
          ]
          
          const state = createMockGameState(players)
          
          // Apply Gotcha Twice effect to set up the initial state
          const stateWithEffect = applyGotchaTwiceEffect(state, affectedPlayerIndex)
          
          // Verify that the effect was set up correctly
          if (collection.length === 0) {
            expect(stateWithEffect).toBe(state)
            return true
          }
          
          // For this property test, we only test cases where both cards are auto-selected
          // (i.e., player has exactly 2 cards), to avoid the complexity of manual selection
          if (collection.length !== 2) {
            return true // Skip cases that don't have exactly 2 cards
          }
          
          // Verify initial state setup
          expect(stateWithEffect.gotchaEffectState).not.toBe(null)
          expect(stateWithEffect.gotchaEffectState?.type).toBe('twice')
          expect(stateWithEffect.gotchaEffectState?.selectedCards).toHaveLength(2)
          expect(stateWithEffect.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
          expect(stateWithEffect.gotchaEffectState?.cardChoices).toHaveLength(2)
          
          const cardChoices = stateWithEffect.gotchaEffectState!.cardChoices!
          
          // Make first choice
          const firstCardId = cardChoices[0].card.id
          const stateAfterFirst = handleGotchaCardActionChoice(stateWithEffect, firstCardId, firstChoice)
          
          // Verify first choice was recorded and we're waiting for second choice
          expect(stateAfterFirst.gotchaEffectState?.cardChoices?.[0].action).toBe(firstChoice)
          expect(stateAfterFirst.gotchaEffectState?.cardChoices?.[1].action).toBe(null)
          expect(stateAfterFirst.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
          
          // Make second choice
          const secondCardId = cardChoices[1].card.id
          const finalState = handleGotchaCardActionChoice(stateAfterFirst, secondCardId, secondChoice)
          
          // Verify effect is completed
          expect(finalState.gotchaEffectState).toBe(null)
          
          // Verify both cards were removed from affected player's collection
          expect(finalState.players[affectedPlayerIndex].collection).toHaveLength(0)
          
          // Verify choices were applied independently
          const isBuyerAffected = affectedPlayerIndex === 0 // Buyer is at index 0
          
          // Check first card outcome
          const firstCardInBuyerCollection = finalState.players[0].collection.some(card => card.id === firstCardId)
          const firstCardInDiscard = finalState.discardPile.some(card => card.id === firstCardId)
          
          if (firstChoice === 'steal' && !isBuyerAffected) {
            expect(firstCardInBuyerCollection).toBe(true)
            expect(firstCardInDiscard).toBe(false)
          } else {
            expect(firstCardInBuyerCollection).toBe(false)
            expect(firstCardInDiscard).toBe(true)
          }
          
          // Check second card outcome
          const secondCardInBuyerCollection = finalState.players[0].collection.some(card => card.id === secondCardId)
          const secondCardInDiscard = finalState.discardPile.some(card => card.id === secondCardId)
          
          if (secondChoice === 'steal' && !isBuyerAffected) {
            expect(secondCardInBuyerCollection).toBe(true)
            expect(secondCardInDiscard).toBe(false)
          } else {
            expect(secondCardInBuyerCollection).toBe(false)
            expect(secondCardInDiscard).toBe(true)
          }
          
          // Verify each card is in exactly one place
          expect(firstCardInBuyerCollection !== firstCardInDiscard).toBe(true)
          expect(secondCardInBuyerCollection !== secondCardInDiscard).toBe(true)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})