import { gameReducer, createInitialGameState } from '../../game-logic/gameReducer'
import { GameState, GamePhase, Card } from '../../types'

describe('Add One Effects', () => {
  let initialState: GameState

  beforeEach(() => {
    initialState = createInitialGameState()
    
    // Set up a basic game state with players and action phase
    initialState.players = [
      {
        id: 0,
        name: 'Alice',
        hand: [
          { id: 'thing-1', type: 'thing' as const, subtype: 'big', name: 'Big Thing', setSize: 2 },
          { id: 'thing-2', type: 'thing' as const, subtype: 'medium', name: 'Medium Thing', setSize: 3 }
        ],
        offer: [],
        collection: [],
        points: 0,
        hasMoney: true
      },
      {
        id: 1,
        name: 'Bob',
        hand: [],
        offer: [
          { id: 'offer-1', type: 'thing' as const, subtype: 'tiny', name: 'Tiny Thing', setSize: 4, faceUp: true, position: 0 },
          { id: 'offer-2', type: 'thing' as const, subtype: 'big', name: 'Big Thing', setSize: 2, faceUp: false, position: 1 }
        ],
        collection: [],
        points: 0,
        hasMoney: false
      },
      {
        id: 2,
        name: 'Charlie',
        hand: [],
        offer: [
          { id: 'offer-3', type: 'thing' as const, subtype: 'giant', name: 'Giant Thing', setSize: 1, faceUp: false, position: 0 }
        ],
        collection: [],
        points: 0,
        hasMoney: false
      }
    ]
    
    initialState.currentBuyerIndex = 0
    initialState.currentPhase = GamePhase.ACTION_PHASE
    initialState.currentPlayerIndex = 0
    initialState.gameStarted = true
    
    // Set up Add One effect state
    initialState.addOneEffectState = {
      playerId: 0,
      awaitingHandCardSelection: true,
      awaitingOfferSelection: false
    }
  })

  describe('SELECT_ADD_ONE_HAND_CARD action', () => {
    test('successfully selects hand card and transitions to offer selection', () => {
      const action = { type: 'SELECT_ADD_ONE_HAND_CARD' as const, cardId: 'thing-1' }
      
      const newState = gameReducer(initialState, action)
      
      // Should transition to awaiting offer selection
      expect(newState.addOneEffectState).not.toBeNull()
      expect(newState.addOneEffectState?.awaitingHandCardSelection).toBe(false)
      expect(newState.addOneEffectState?.awaitingOfferSelection).toBe(true)
      expect(newState.addOneEffectState?.selectedHandCard?.id).toBe('thing-1')
      
      // Hand should remain unchanged at this point
      expect(newState.players[0].hand).toHaveLength(2)
    })

    test('throws error when no Add One effect is active', () => {
      initialState.addOneEffectState = null
      
      const action = { type: 'SELECT_ADD_ONE_HAND_CARD' as const, cardId: 'thing-1' }
      
      expect(() => {
        gameReducer(initialState, action)
      }).toThrow('No Add One effect is currently active')
    })

    test('throws error when not awaiting hand card selection', () => {
      initialState.addOneEffectState!.awaitingHandCardSelection = false
      initialState.addOneEffectState!.awaitingOfferSelection = true
      
      const action = { type: 'SELECT_ADD_ONE_HAND_CARD' as const, cardId: 'thing-1' }
      
      expect(() => {
        gameReducer(initialState, action)
      }).toThrow('Add One effect is not awaiting hand card selection')
    })

    test('throws error when card not found in hand', () => {
      const action = { type: 'SELECT_ADD_ONE_HAND_CARD' as const, cardId: 'nonexistent' }
      
      expect(() => {
        gameReducer(initialState, action)
      }).toThrow('Card with ID nonexistent not found in player\'s hand')
    })
  })

  describe('SELECT_ADD_ONE_OFFER action', () => {
    beforeEach(() => {
      // Set up state for offer selection
      initialState.addOneEffectState = {
        playerId: 0,
        awaitingHandCardSelection: false,
        selectedHandCard: { id: 'thing-1', type: 'thing' as const, subtype: 'big', name: 'Big Thing', setSize: 2 },
        awaitingOfferSelection: true
      }
    })

    test('successfully adds card to selected offer', () => {
      const action = { type: 'SELECT_ADD_ONE_OFFER' as const, offerId: 1 }
      
      const newState = gameReducer(initialState, action)
      
      // Card should be removed from Alice's hand
      expect(newState.players[0].hand).toHaveLength(1)
      expect(newState.players[0].hand[0].id).toBe('thing-2')
      
      // Card should be added face down to Bob's offer
      expect(newState.players[1].offer).toHaveLength(3)
      const addedCard = newState.players[1].offer[2]
      expect(addedCard.id).toBe('thing-1')
      expect(addedCard.faceUp).toBe(false)
      expect(addedCard.position).toBe(2)
      
      // Add One effect should be cleared
      expect(newState.addOneEffectState).toBeNull()
    })

    test('can add to different offers', () => {
      const action = { type: 'SELECT_ADD_ONE_OFFER' as const, offerId: 2 }
      
      const newState = gameReducer(initialState, action)
      
      // Card should be added to Charlie's offer
      expect(newState.players[2].offer).toHaveLength(2)
      const addedCard = newState.players[2].offer[1]
      expect(addedCard.id).toBe('thing-1')
      expect(addedCard.faceUp).toBe(false)
      expect(addedCard.position).toBe(1)
    })

    test('throws error when no Add One effect is active', () => {
      initialState.addOneEffectState = null
      
      const action = { type: 'SELECT_ADD_ONE_OFFER' as const, offerId: 1 }
      
      expect(() => {
        gameReducer(initialState, action)
      }).toThrow('No Add One effect is currently active')
    })

    test('throws error when not awaiting offer selection', () => {
      initialState.addOneEffectState!.awaitingOfferSelection = false
      initialState.addOneEffectState!.awaitingHandCardSelection = true
      
      const action = { type: 'SELECT_ADD_ONE_OFFER' as const, offerId: 1 }
      
      expect(() => {
        gameReducer(initialState, action)
      }).toThrow('Add One effect is not awaiting offer selection')
    })

    test('throws error when no hand card selected', () => {
      initialState.addOneEffectState!.selectedHandCard = undefined
      
      const action = { type: 'SELECT_ADD_ONE_OFFER' as const, offerId: 1 }
      
      expect(() => {
        gameReducer(initialState, action)
      }).toThrow('No hand card selected for Add One effect')
    })

    test('throws error for invalid offer ID', () => {
      const action = { type: 'SELECT_ADD_ONE_OFFER' as const, offerId: 5 }
      
      expect(() => {
        gameReducer(initialState, action)
      }).toThrow('Invalid offer ID: 5')
    })

    test('throws error when trying to add to buyer offer', () => {
      const action = { type: 'SELECT_ADD_ONE_OFFER' as const, offerId: 0 }
      
      expect(() => {
        gameReducer(initialState, action)
      }).toThrow('Cannot add cards to buyer\'s offer (buyer has no offer)')
    })

    test('throws error when player has no offer', () => {
      // Remove Bob's offer
      initialState.players[1].offer = []
      
      const action = { type: 'SELECT_ADD_ONE_OFFER' as const, offerId: 1 }
      
      expect(() => {
        gameReducer(initialState, action)
      }).toThrow('Player has no offer to add cards to')
    })
  })

  describe('Phase validation', () => {
    test('allows Add One actions only during action phase', () => {
      initialState.currentPhase = GamePhase.OFFER_PHASE
      
      const handCardAction = { type: 'SELECT_ADD_ONE_HAND_CARD' as const, cardId: 'thing-1' }
      const offerAction = { type: 'SELECT_ADD_ONE_OFFER' as const, offerId: 1 }
      
      expect(() => {
        gameReducer(initialState, handCardAction)
      }).toThrow('Action SELECT_ADD_ONE_HAND_CARD is not allowed during phase offer_phase')
      
      expect(() => {
        gameReducer(initialState, offerAction)
      }).toThrow('Action SELECT_ADD_ONE_OFFER is not allowed during phase offer_phase')
    })
  })
})