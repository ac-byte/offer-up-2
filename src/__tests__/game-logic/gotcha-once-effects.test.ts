import { 
  gameReducer, 
  createInitialGameState, 
  applyGotchaBadEffect,
  applyGotchaOnceEffect,
  handleGotchaCardSelection,
  handleGotchaActionChoice
} from '../../game-logic/gameReducer'
import { GameState, GamePhase, Player, Card, GameAction } from '../../types'

// Helper function to create a mock game state
function createMockGameState(players: Player[]): GameState {
  return {
    ...createInitialGameState(),
    players,
    currentBuyerIndex: 0,
    nextBuyerIndex: 0,
    currentPhase: GamePhase.GOTCHA_TRADEINS,
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
    points: 2,
    hasMoney: id === 0
  }
}

describe('Gotcha Once Effects', () => {
  describe('applyGotchaOnceEffect', () => {
    it('creates effect state when player has multiple cards', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      
      const player1 = createMockPlayer(1, 'Player 1', player1Collection)
      const state = createMockGameState([createMockPlayer(0, 'Buyer'), player1])
      
      const newState = applyGotchaOnceEffect(state, 1)
      
      expect(newState.gotchaEffectState).not.toBeNull()
      expect(newState.gotchaEffectState?.type).toBe('once')
      expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(1)
      expect(newState.gotchaEffectState?.cardsToSelect).toBe(1)
      expect(newState.gotchaEffectState?.selectedCards).toHaveLength(0)
      expect(newState.gotchaEffectState?.awaitingBuyerChoice).toBe(false)
    })

    it('auto-selects card when player has only one card', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
      
      const player1 = createMockPlayer(1, 'Player 1', player1Collection)
      const state = createMockGameState([createMockPlayer(0, 'Buyer'), player1])
      
      const newState = applyGotchaOnceEffect(state, 1)
      
      expect(newState.gotchaEffectState).not.toBeNull()
      expect(newState.gotchaEffectState?.selectedCards).toHaveLength(1)
      expect(newState.gotchaEffectState?.selectedCards[0].id).toBe('thing-1')
      expect(newState.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
    })

    it('returns unchanged state when player has no cards', () => {
      const player1 = createMockPlayer(1, 'Player 1', [])
      const state = createMockGameState([createMockPlayer(0, 'Buyer'), player1])
      
      const newState = applyGotchaOnceEffect(state, 1)
      
      expect(newState).toBe(state) // Should be unchanged
    })
  })

  describe('handleGotchaCardSelection', () => {
    it('selects card and moves to buyer choice when enough cards selected', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      
      const player1 = createMockPlayer(1, 'Player 1', player1Collection)
      const state = createMockGameState([createMockPlayer(0, 'Buyer'), player1])
      
      // Set up initial Gotcha effect state
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'once' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: [],
          awaitingBuyerChoice: false
        }
      }
      
      const newState = handleGotchaCardSelection(stateWithEffect, 'thing-1')
      
      expect(newState.gotchaEffectState?.selectedCards).toHaveLength(1)
      expect(newState.gotchaEffectState?.selectedCards[0].id).toBe('thing-1')
      expect(newState.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
    })

    it('returns unchanged state when card not found', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
      
      const player1 = createMockPlayer(1, 'Player 1', player1Collection)
      const state = createMockGameState([createMockPlayer(0, 'Buyer'), player1])
      
      // Set up initial Gotcha effect state
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'once' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: [],
          awaitingBuyerChoice: false
        }
      }
      
      const newState = handleGotchaCardSelection(stateWithEffect, 'nonexistent-card')
      
      expect(newState).toBe(stateWithEffect) // Should be unchanged
    })
  })

  describe('handleGotchaActionChoice', () => {
    it('steals card to buyer collection when steal is chosen', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
      
      const buyer = createMockPlayer(0, 'Buyer', [])
      const player1 = createMockPlayer(1, 'Player 1', player1Collection)
      const state = createMockGameState([buyer, player1])
      
      // Set up Gotcha effect state with selected card
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'once' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: [player1Collection[0]],
          awaitingBuyerChoice: true
        }
      }
      
      const newState = handleGotchaActionChoice(stateWithEffect, 'steal')
      
      // Card should be moved from player1 to buyer
      expect(newState.players[1].collection).toHaveLength(0)
      expect(newState.players[0].collection).toHaveLength(1)
      expect(newState.players[0].collection[0].id).toBe('thing-1')
      expect(newState.gotchaEffectState).toBeNull()
    })

    it('discards card when discard is chosen', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
      
      const buyer = createMockPlayer(0, 'Buyer', [])
      const player1 = createMockPlayer(1, 'Player 1', player1Collection)
      const state = createMockGameState([buyer, player1])
      
      // Set up Gotcha effect state with selected card
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'once' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: [player1Collection[0]],
          awaitingBuyerChoice: true
        }
      }
      
      const newState = handleGotchaActionChoice(stateWithEffect, 'discard')
      
      // Card should be moved from player1 to discard pile
      expect(newState.players[1].collection).toHaveLength(0)
      expect(newState.players[0].collection).toHaveLength(0)
      expect(newState.discardPile).toHaveLength(1)
      expect(newState.discardPile[0].id).toBe('thing-1')
      expect(newState.gotchaEffectState).toBeNull()
    })

    it('forces discard when buyer affects own collection', () => {
      const buyerCollection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
      
      const buyer = createMockPlayer(0, 'Buyer', buyerCollection)
      const state = createMockGameState([buyer])
      
      // Set up Gotcha effect state where buyer affects own collection
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'once' as const,
          affectedPlayerIndex: 0, // Buyer affecting themselves
          cardsToSelect: 1,
          selectedCards: [buyerCollection[0]],
          awaitingBuyerChoice: true
        }
      }
      
      const newState = handleGotchaActionChoice(stateWithEffect, 'steal')
      
      // Card should be discarded even though steal was chosen
      expect(newState.players[0].collection).toHaveLength(0)
      expect(newState.discardPile).toHaveLength(1)
      expect(newState.discardPile[0].id).toBe('thing-1')
      expect(newState.gotchaEffectState).toBeNull()
    })
  })

  describe('Game Reducer Integration', () => {
    it('handles SELECT_GOTCHA_CARD action', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      
      const player1 = createMockPlayer(1, 'Player 1', player1Collection)
      const state = createMockGameState([createMockPlayer(0, 'Buyer'), player1])
      
      // Set up initial Gotcha effect state
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'once' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: [],
          awaitingBuyerChoice: false
        }
      }
      
      const action: GameAction = { type: 'SELECT_GOTCHA_CARD', cardId: 'thing-1' }
      const newState = gameReducer(stateWithEffect, action)
      
      expect(newState.gotchaEffectState?.selectedCards).toHaveLength(1)
      expect(newState.gotchaEffectState?.selectedCards[0].id).toBe('thing-1')
      expect(newState.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
    })

    it('handles CHOOSE_GOTCHA_ACTION action', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
      
      const buyer = createMockPlayer(0, 'Buyer', [])
      const player1 = createMockPlayer(1, 'Player 1', player1Collection)
      const state = createMockGameState([buyer, player1])
      
      // Set up Gotcha effect state with selected card
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'once' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: [player1Collection[0]],
          awaitingBuyerChoice: true
        }
      }
      
      const action: GameAction = { type: 'CHOOSE_GOTCHA_ACTION', action: 'steal' }
      const newState = gameReducer(stateWithEffect, action)
      
      // Card should be moved from player1 to buyer
      expect(newState.players[1].collection).toHaveLength(0)
      expect(newState.players[0].collection).toHaveLength(1)
      expect(newState.players[0].collection[0].id).toBe('thing-1')
      expect(newState.gotchaEffectState).toBeNull()
    })

    it('throws error when no Gotcha effect is active', () => {
      const state = createMockGameState([createMockPlayer(0, 'Buyer')])
      
      const action: GameAction = { type: 'SELECT_GOTCHA_CARD', cardId: 'thing-1' }
      
      expect(() => gameReducer(state, action)).toThrow('No Gotcha effect is currently active')
    })

    it('throws error when trying to select card while awaiting buyer choice', () => {
      const state = createMockGameState([createMockPlayer(0, 'Buyer')])
      
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'once' as const,
          affectedPlayerIndex: 0,
          cardsToSelect: 1,
          selectedCards: [],
          awaitingBuyerChoice: true
        }
      }
      
      const action: GameAction = { type: 'SELECT_GOTCHA_CARD', cardId: 'thing-1' }
      
      expect(() => gameReducer(stateWithEffect, action)).toThrow('Buyer must choose action for already selected cards')
    })
  })
})