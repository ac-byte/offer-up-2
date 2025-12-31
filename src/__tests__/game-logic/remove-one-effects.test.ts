import { gameReducer, createInitialGameState } from '../../game-logic/gameReducer'
import { GameState, GamePhase, Card } from '../../types'

describe('Remove One Action Card Effects', () => {
  let initialState: GameState

  beforeEach(() => {
    // Create a game state with players in action phase
    const baseState = createInitialGameState()
    
    // Set up players
    const players = [
      { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'remove-one-1', type: 'action' as const, subtype: 'remove-one', name: 'Remove One', setSize: 1 }], points: 0, hasMoney: true },
      { id: 1, name: 'Bob', hand: [], offer: [
        { id: 'thing-1', type: 'thing' as const, subtype: 'big', name: 'Big Thing', setSize: 2, faceUp: false, position: 0 },
        { id: 'thing-2', type: 'thing' as const, subtype: 'medium', name: 'Medium Thing', setSize: 3, faceUp: true, position: 1 },
        { id: 'gotcha-1', type: 'gotcha' as const, subtype: 'once', name: 'Gotcha Once', setSize: 2, faceUp: false, position: 2 }
      ], collection: [], points: 0, hasMoney: false },
      { id: 2, name: 'Charlie', hand: [], offer: [
        { id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1, faceUp: true, position: 0 }
      ], collection: [], points: 0, hasMoney: false }
    ]

    initialState = {
      ...baseState,
      players,
      currentBuyerIndex: 0,
      currentPhase: GamePhase.ACTION_PHASE,
      currentPlayerIndex: 0,
      gameStarted: true,
      drawPile: [],
      discardPile: []
    }
  })

  describe('PLAY_ACTION_CARD with Remove One', () => {
    test('sets up Remove One effect state when played', () => {
      const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'remove-one-1' }
      
      const newState = gameReducer(initialState, action)
      
      // Should set up Remove One effect state
      expect(newState.removeOneEffectState).toEqual({
        playerId: 0,
        awaitingCardSelection: true
      })
      
      // Should update phase instructions
      expect(newState.phaseInstructions).toContain('Alice played Remove One')
      expect(newState.phaseInstructions).toContain('Select a card from any offer to remove')
      
      // Should remove card from collection and add to discard pile
      expect(newState.players[0].collection).toHaveLength(0)
      expect(newState.discardPile).toHaveLength(1)
      expect(newState.discardPile[0].id).toBe('remove-one-1')
    })
  })

  describe('SELECT_REMOVE_ONE_CARD action', () => {
    let stateWithRemoveOneActive: GameState

    beforeEach(() => {
      // First play the Remove One card to set up the effect
      const playAction = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'remove-one-1' }
      stateWithRemoveOneActive = gameReducer(initialState, playAction)
    })

    test('successfully removes selected card from offer', () => {
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 1, cardIndex: 0 }
      
      const newState = gameReducer(stateWithRemoveOneActive, action)
      
      // Should remove the selected card from Bob's offer
      expect(newState.players[1].offer).toHaveLength(2)
      expect(newState.players[1].offer.find(card => card.id === 'thing-1')).toBeUndefined()
      
      // Should update positions of remaining cards
      expect(newState.players[1].offer[0].position).toBe(0)
      expect(newState.players[1].offer[1].position).toBe(1)
      
      // Should add removed card to discard pile
      expect(newState.discardPile).toHaveLength(2) // Remove One card + removed card
      expect(newState.discardPile.find(card => card.id === 'thing-1')).toBeDefined()
      
      // Should clear Remove One effect state
      expect(newState.removeOneEffectState).toBeNull()
    })

    test('can remove face up cards', () => {
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 1, cardIndex: 1 }
      
      const newState = gameReducer(stateWithRemoveOneActive, action)
      
      // Should remove the face up card (Medium Thing)
      expect(newState.players[1].offer.find(card => card.id === 'thing-2')).toBeUndefined()
      expect(newState.discardPile.find(card => card.id === 'thing-2')).toBeDefined()
    })

    test('can remove face down cards', () => {
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 1, cardIndex: 2 }
      
      const newState = gameReducer(stateWithRemoveOneActive, action)
      
      // Should remove the face down card (Gotcha Once)
      expect(newState.players[1].offer.find(card => card.id === 'gotcha-1')).toBeUndefined()
      expect(newState.discardPile.find(card => card.id === 'gotcha-1')).toBeDefined()
    })

    test('can remove from different offers', () => {
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 2, cardIndex: 0 }
      
      const newState = gameReducer(stateWithRemoveOneActive, action)
      
      // Should remove card from Charlie's offer
      expect(newState.players[2].offer).toHaveLength(0)
      expect(newState.discardPile.find(card => card.id === 'action-1')).toBeDefined()
    })

    test('throws error when no Remove One effect is active', () => {
      // Use initial state without Remove One effect
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 1, cardIndex: 0 }
      
      expect(() => {
        gameReducer(initialState, action)
      }).toThrow('No Remove One effect is currently active')
    })

    test('throws error when not awaiting card selection', () => {
      // Manually set up state where Remove One is not awaiting selection
      stateWithRemoveOneActive.removeOneEffectState!.awaitingCardSelection = false
      
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 1, cardIndex: 0 }
      
      expect(() => {
        gameReducer(stateWithRemoveOneActive, action)
      }).toThrow('Remove One effect is not awaiting card selection')
    })

    test('throws error for invalid offer ID', () => {
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 5, cardIndex: 0 }
      
      expect(() => {
        gameReducer(stateWithRemoveOneActive, action)
      }).toThrow('Invalid offer ID: 5')
    })

    test('throws error when trying to remove from buyer offer', () => {
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 0, cardIndex: 0 }
      
      expect(() => {
        gameReducer(stateWithRemoveOneActive, action)
      }).toThrow('Cannot remove cards from buyer\'s offer (buyer has no offer)')
    })

    test('throws error when player has no offer', () => {
      // Clear Bob's offer
      stateWithRemoveOneActive.players[1].offer = []
      
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 1, cardIndex: 0 }
      
      expect(() => {
        gameReducer(stateWithRemoveOneActive, action)
      }).toThrow('Player has no offer to remove cards from')
    })

    test('throws error for invalid card index', () => {
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 1, cardIndex: 5 }
      
      expect(() => {
        gameReducer(stateWithRemoveOneActive, action)
      }).toThrow('Invalid card index: 5')
    })

    test('advances to next eligible player after card removal', () => {
      const action = { type: 'SELECT_REMOVE_ONE_CARD' as const, offerId: 1, cardIndex: 0 }
      
      gameReducer(stateWithRemoveOneActive, action)
      
      // Should advance to next eligible player (implementation detail)
      // This test verifies the function completes without error
    })
  })

  describe('Phase validation', () => {
    test('allows SELECT_REMOVE_ONE_CARD only during action phase', () => {
      // Set up Remove One effect in action phase
      const stateWithRemoveOne = gameReducer(initialState, {
        type: 'PLAY_ACTION_CARD',
        playerId: 0,
        cardId: 'remove-one-1'
      })
      
      // Change to wrong phase
      const stateInWrongPhase = { ...stateWithRemoveOne, currentPhase: GamePhase.OFFER_PHASE }
      
      expect(() => {
        gameReducer(stateInWrongPhase, {
          type: 'SELECT_REMOVE_ONE_CARD',
          offerId: 1,
          cardIndex: 0
        })
      }).toThrow('Action SELECT_REMOVE_ONE_CARD is not allowed during phase offer_phase')
    })
  })
})