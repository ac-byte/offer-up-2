import {
  applyGotchaTwiceEffect,
  handleGotchaCardSelection,
  handleGotchaActionChoice,
  gameReducer
} from '../../game-logic/gameReducer'
import { GameState, GamePhase, Player, Card, GameAction } from '../../types'

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

describe('Gotcha Twice Effects', () => {
  describe('applyGotchaTwiceEffect', () => {
    it('creates effect state when player has multiple cards', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'thing-3', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const state = createMockGameState(players)
      const newState = applyGotchaTwiceEffect(state, 1)
      
      expect(newState.gotchaEffectState).toEqual({
        type: 'twice',
        affectedPlayerIndex: 1,
        cardsToSelect: 1,
        selectedCards: [],
        awaitingBuyerChoice: false,
        twiceIteration: 1
      })
      expect(newState.phaseInstructions).toBe('Buyer must select 1 card from Player1\'s collection (1 of 2)')
    })

    it('auto-selects card when player has only one card', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const state = createMockGameState(players)
      const newState = applyGotchaTwiceEffect(state, 1)
      
      expect(newState.gotchaEffectState).toEqual({
        type: 'twice',
        affectedPlayerIndex: 1,
        cardsToSelect: 1,
        selectedCards: [player1Collection[0]],
        awaitingBuyerChoice: true,
        twiceIteration: 1
      })
      expect(newState.phaseInstructions).toBe('Buyer must choose to steal or discard Giant Thing from Player1\'s collection (1 of 2)')
    })

    it('creates effect state when player has exactly two cards', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const state = createMockGameState(players)
      const newState = applyGotchaTwiceEffect(state, 1)
      
      expect(newState.gotchaEffectState).toEqual({
        type: 'twice',
        affectedPlayerIndex: 1,
        cardsToSelect: 1,
        selectedCards: [],
        awaitingBuyerChoice: false,
        twiceIteration: 1
      })
      expect(newState.phaseInstructions).toBe('Buyer must select 1 card from Player1\'s collection (1 of 2)')
    })

    it('returns unchanged state when player has no cards', () => {
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', [])
      ]
      
      const state = createMockGameState(players)
      const newState = applyGotchaTwiceEffect(state, 1)
      
      expect(newState).toBe(state)
    })
  })

  describe('handleGotchaActionChoice for Gotcha Twice', () => {
    it('processes first iteration and starts second iteration', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const state = createMockGameState(players)
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'twice' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: [player1Collection[0]], // First card selected
          awaitingBuyerChoice: true,
          twiceIteration: 1
        }
      }
      
      // Choose steal for first card
      const stateAfterFirst = handleGotchaActionChoice(stateWithEffect, 'steal')
      
      // First card should be stolen and removed from player1's collection
      expect(stateAfterFirst.players[0].collection).toContainEqual(player1Collection[0])
      expect(stateAfterFirst.players[1].collection).toHaveLength(1) // One card remaining
      expect(stateAfterFirst.players[1].collection[0]).toEqual(player1Collection[1])
      
      // Should start second iteration
      expect(stateAfterFirst.gotchaEffectState).not.toBe(null)
      expect(stateAfterFirst.gotchaEffectState?.type).toBe('twice')
      expect(stateAfterFirst.gotchaEffectState?.twiceIteration).toBe(2)
      expect(stateAfterFirst.gotchaEffectState?.selectedCards).toHaveLength(1)
      expect(stateAfterFirst.gotchaEffectState?.selectedCards[0]).toEqual(player1Collection[1])
      expect(stateAfterFirst.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
    })

    it('completes effect after second iteration', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const state = createMockGameState(players)
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'twice' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: [player1Collection[0]], // Second iteration card selected
          awaitingBuyerChoice: true,
          twiceIteration: 2
        }
      }
      
      // Choose discard for second card
      const finalState = handleGotchaActionChoice(stateWithEffect, 'discard')
      
      // Card should be discarded
      expect(finalState.discardPile).toContainEqual(player1Collection[0])
      expect(finalState.players[1].collection).toHaveLength(0)
      
      // Effect should be completed
      expect(finalState.gotchaEffectState).toBe(null)
    })
  })

  describe('Game Reducer Integration', () => {
    it('handles CHOOSE_GOTCHA_ACTION action for Gotcha Twice', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const stateWithEffect = {
        ...createMockGameState(players),
        gotchaEffectState: {
          type: 'twice' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: [player1Collection[0]], // First card selected
          awaitingBuyerChoice: true,
          twiceIteration: 1
        }
      }
      
      const action: GameAction = { type: 'CHOOSE_GOTCHA_ACTION', action: 'steal' }
      const newState = gameReducer(stateWithEffect, action)
      
      // First iteration should be completed and second should start
      expect(newState.players[0].collection).toContainEqual(player1Collection[0])
      expect(newState.players[1].collection).toHaveLength(1) // One card remaining
      expect(newState.gotchaEffectState?.twiceIteration).toBe(2)
      expect(newState.gotchaEffectState?.selectedCards[0]).toEqual(player1Collection[1])
    })
  })
})