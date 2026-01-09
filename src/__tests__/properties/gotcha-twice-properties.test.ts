import * as fc from 'fast-check'
import { GameState, GamePhase, Player, Card } from '../../types'
import { applyGotchaTwiceEffect, handleGotchaActionChoice } from '../../game-logic/gameReducer'

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
    actionPhaseDoneStates: [],
    offerCreationStates: [],
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
  type: fc.constantFrom('thing' as const, 'gotcha' as const, 'action' as const),
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
            // When player has 1 card, should auto-select it and await buyer choice for first iteration
            expect(newState.gotchaEffectState).not.toBe(null)
            expect(newState.gotchaEffectState?.type).toBe('twice')
            expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(affectedPlayerIndex)
            expect(newState.gotchaEffectState?.cardsToSelect).toBe(1)
            expect(newState.gotchaEffectState?.selectedCards).toHaveLength(1)
            expect(newState.gotchaEffectState?.selectedCards[0]).toEqual(collection[0])
            expect(newState.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
            expect(newState.gotchaEffectState?.twiceIteration).toBe(1)
          } else {
            // When player has multiple cards, should create selection state for first iteration
            expect(newState.gotchaEffectState).not.toBe(null)
            expect(newState.gotchaEffectState?.type).toBe('twice')
            expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(affectedPlayerIndex)
            expect(newState.gotchaEffectState?.cardsToSelect).toBe(1)
            expect(newState.gotchaEffectState?.selectedCards).toHaveLength(0)
            expect(newState.gotchaEffectState?.awaitingBuyerChoice).toBe(false)
            expect(newState.gotchaEffectState?.twiceIteration).toBe(1)
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
        fc.integer({ min: 1, max: 3 }), // affected player index (1-3, excluding buyer)
        fc.constantFrom('steal' as const, 'discard' as const), // first choice
        fc.constantFrom('steal' as const, 'discard' as const), // second choice
        (affectedPlayerIndex, firstChoice, secondChoice) => {
          // Create a simple test case with exactly 2 cards
          const collection: Card[] = [
            { id: 'card1', type: 'thing' as const, subtype: 'giant', name: 'Card 1', setSize: 1 },
            { id: 'card2', type: 'thing' as const, subtype: 'big', name: 'Card 2', setSize: 2 }
          ]
          
          // Create players (buyer at 0, then 3 more players)
          const players = [
            createMockPlayer(0, 'Buyer'),
            createMockPlayer(1, 'Player1', affectedPlayerIndex === 1 ? collection : []),
            createMockPlayer(2, 'Player2', affectedPlayerIndex === 2 ? collection : []),
            createMockPlayer(3, 'Player3', affectedPlayerIndex === 3 ? collection : [])
          ]
          
          const state = createMockGameState(players)
          
          // Start first iteration
          const firstIterationState = applyGotchaTwiceEffect(state, affectedPlayerIndex)
          
          // Should start with first iteration requiring manual selection
          expect(firstIterationState.gotchaEffectState?.twiceIteration).toBe(1)
          expect(firstIterationState.gotchaEffectState?.selectedCards).toHaveLength(0)
          expect(firstIterationState.gotchaEffectState?.awaitingBuyerChoice).toBe(false)
          
          // Simulate manual card selection for first iteration
          const firstCardSelected = {
            ...firstIterationState,
            gotchaEffectState: {
              ...firstIterationState.gotchaEffectState!,
              selectedCards: [collection[0]],
              awaitingBuyerChoice: true
            }
          }
          
          // Make first choice
          const afterFirstChoice = handleGotchaActionChoice(firstCardSelected, firstChoice)
          
          // Should start second iteration with remaining card auto-selected
          expect(afterFirstChoice.gotchaEffectState?.twiceIteration).toBe(2)
          expect(afterFirstChoice.gotchaEffectState?.selectedCards).toHaveLength(1)
          expect(afterFirstChoice.gotchaEffectState?.selectedCards[0]).toEqual(collection[1])
          expect(afterFirstChoice.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
          
          // Make second choice
          const finalState = handleGotchaActionChoice(afterFirstChoice, secondChoice)
          
          // Effect should be completed
          expect(finalState.gotchaEffectState).toBe(null)
          
          // Both cards should be removed from affected player's collection
          expect(finalState.players[affectedPlayerIndex].collection).toHaveLength(0)
          
          // Verify choices were applied independently
          // Since affectedPlayerIndex is never 0 (buyer), buyer self-effect rules don't apply
          const buyerCollectionCount = finalState.players[0].collection.length
          const discardPileCount = finalState.discardPile.length
          
          // Calculate expected outcomes
          let expectedInBuyer = 0
          let expectedInDiscard = 0
          
          if (firstChoice === 'steal') {
            expectedInBuyer++
          } else {
            expectedInDiscard++
          }
          
          if (secondChoice === 'steal') {
            expectedInBuyer++
          } else {
            expectedInDiscard++
          }
          
          // Verify the outcomes match expectations
          expect(buyerCollectionCount).toBe(expectedInBuyer)
          expect(discardPileCount).toBe(expectedInDiscard)
          
          // Verify total cards are conserved (2 cards processed)
          expect(buyerCollectionCount + discardPileCount).toBe(2)
          
          return true
        }
      ),
      { numRuns: 100 }
    )
  })
})