import { gameReducer, createInitialGameState } from '../../game-logic/gameReducer'
import { GamePhase, GameState, Card, OfferCard } from '../../types'

describe('Flip One Action Card Effects', () => {
  let initialState: GameState

  beforeEach(() => {
    initialState = createInitialGameState()
    
    // Initialize game with 3 players
    initialState = gameReducer(initialState, {
      type: 'START_GAME',
      players: ['Alice', 'Bob', 'Charlie']
    })
    
    // Set up action phase
    initialState.currentPhase = GamePhase.ACTION_PHASE
    initialState.currentBuyerIndex = 0 // Alice is buyer
    initialState.currentPlayerIndex = 0
    
    // Give Bob and Charlie offers with face down cards
    initialState.players[1].offer = [
      { id: 'card1', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2, faceUp: false, position: 0 },
      { id: 'card2', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3, faceUp: true, position: 1 },
      { id: 'card3', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, faceUp: false, position: 2 }
    ]
    
    initialState.players[2].offer = [
      { id: 'card4', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4, faceUp: false, position: 0 },
      { id: 'card5', type: 'action', subtype: 'add-one', name: 'Add One', setSize: 1, faceUp: true, position: 1 },
      { id: 'card6', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1, faceUp: false, position: 2 }
    ]
    
    // Give Alice a Flip One action card
    initialState.players[0].collection = [
      { id: 'flip-one-1', type: 'action', subtype: 'flip-one', name: 'Flip One', setSize: 1, effect: 'Flip 1 card in any offer face up' }
    ]
  })

  describe('PLAY_ACTION_CARD with flip-one', () => {
    test('sets up Flip One effect state when played', () => {
      const newState = gameReducer(initialState, {
        type: 'PLAY_ACTION_CARD',
        playerId: 0,
        cardId: 'flip-one-1'
      })
      
      // Card should be removed from collection and added to discard pile
      expect(newState.players[0].collection).toHaveLength(0)
      expect(newState.discardPile).toHaveLength(1)
      expect(newState.discardPile[0].id).toBe('flip-one-1')
      
      // Flip One effect state should be set up
      expect(newState.flipOneEffectState).toEqual({
        playerId: 0,
        awaitingCardSelection: true
      })
      
      // Phase instructions should be updated
      expect(newState.phaseInstructions).toContain('Alice played Flip One')
      expect(newState.phaseInstructions).toContain('Select a face-down card')
    })
  })

  describe('SELECT_FLIP_ONE_CARD action', () => {
    let stateWithFlipOneActive: GameState

    beforeEach(() => {
      // Play the Flip One card first
      stateWithFlipOneActive = gameReducer(initialState, {
        type: 'PLAY_ACTION_CARD',
        playerId: 0,
        cardId: 'flip-one-1'
      })
    })

    test('successfully flips a face down card to face up', () => {
      // Verify initial state
      expect(stateWithFlipOneActive.players[1].offer[0].faceUp).toBe(false)
      
      const newState = gameReducer(stateWithFlipOneActive, {
        type: 'SELECT_FLIP_ONE_CARD',
        offerId: 1, // Bob's offer
        cardIndex: 0 // First card (face down)
      })
      
      // Card should now be face up
      expect(newState.players[1].offer[0].faceUp).toBe(true)
      expect(newState.players[1].offer[0].id).toBe('card1')
      
      // Other cards should remain unchanged
      expect(newState.players[1].offer[1].faceUp).toBe(true) // Was already face up
      expect(newState.players[1].offer[2].faceUp).toBe(false) // Should remain face down
      
      // Flip One effect state should be cleared
      expect(newState.flipOneEffectState).toBeNull()
    })

    test('can flip cards from different players offers', () => {
      // Flip Charlie's first card instead
      const newState = gameReducer(stateWithFlipOneActive, {
        type: 'SELECT_FLIP_ONE_CARD',
        offerId: 2, // Charlie's offer
        cardIndex: 0 // First card (face down)
      })
      
      // Charlie's card should now be face up
      expect(newState.players[2].offer[0].faceUp).toBe(true)
      expect(newState.players[2].offer[0].id).toBe('card4')
      
      // Bob's cards should remain unchanged
      expect(newState.players[1].offer[0].faceUp).toBe(false)
      expect(newState.players[1].offer[2].faceUp).toBe(false)
    })

    test('can flip different positions in the same offer', () => {
      // Flip Bob's third card (position 2)
      const newState = gameReducer(stateWithFlipOneActive, {
        type: 'SELECT_FLIP_ONE_CARD',
        offerId: 1, // Bob's offer
        cardIndex: 2 // Third card (face down)
      })
      
      // Third card should now be face up
      expect(newState.players[1].offer[2].faceUp).toBe(true)
      expect(newState.players[1].offer[2].id).toBe('card3')
      
      // Other cards should remain unchanged
      expect(newState.players[1].offer[0].faceUp).toBe(false) // Should remain face down
      expect(newState.players[1].offer[1].faceUp).toBe(true) // Was already face up
    })

    test('throws error when no Flip One effect is active', () => {
      expect(() => {
        gameReducer(initialState, {
          type: 'SELECT_FLIP_ONE_CARD',
          offerId: 1,
          cardIndex: 0
        })
      }).toThrow('No Flip One effect is currently active')
    })

    test('throws error when trying to flip already face up card', () => {
      expect(() => {
        gameReducer(stateWithFlipOneActive, {
          type: 'SELECT_FLIP_ONE_CARD',
          offerId: 1, // Bob's offer
          cardIndex: 1 // Second card (already face up)
        })
      }).toThrow('Cannot flip a card that is already face up')
    })

    test('throws error for invalid offer ID', () => {
      expect(() => {
        gameReducer(stateWithFlipOneActive, {
          type: 'SELECT_FLIP_ONE_CARD',
          offerId: 5, // Invalid player index
          cardIndex: 0
        })
      }).toThrow('Invalid offer ID: 5')
    })

    test('throws error when trying to flip buyer offer', () => {
      expect(() => {
        gameReducer(stateWithFlipOneActive, {
          type: 'SELECT_FLIP_ONE_CARD',
          offerId: 0, // Alice is buyer, has no offer
          cardIndex: 0
        })
      }).toThrow('Cannot flip cards from buyer\'s offer (buyer has no offer)')
    })

    test('throws error when player has no offer', () => {
      // Clear Bob's offer
      const stateWithNoOffer = {
        ...stateWithFlipOneActive,
        players: stateWithFlipOneActive.players.map((player, index) => 
          index === 1 ? { ...player, offer: [] } : player
        )
      }
      
      expect(() => {
        gameReducer(stateWithNoOffer, {
          type: 'SELECT_FLIP_ONE_CARD',
          offerId: 1,
          cardIndex: 0
        })
      }).toThrow('Player has no offer to flip cards from')
    })

    test('throws error for invalid card index', () => {
      expect(() => {
        gameReducer(stateWithFlipOneActive, {
          type: 'SELECT_FLIP_ONE_CARD',
          offerId: 1,
          cardIndex: 5 // Invalid index (offer only has 3 cards)
        })
      }).toThrow('Invalid card index: 5')
    })

    test('does not mutate original state', () => {
      const originalOffer = [...stateWithFlipOneActive.players[1].offer]
      
      gameReducer(stateWithFlipOneActive, {
        type: 'SELECT_FLIP_ONE_CARD',
        offerId: 1,
        cardIndex: 0
      })
      
      // Original state should be unchanged
      expect(stateWithFlipOneActive.players[1].offer).toEqual(originalOffer)
      expect(stateWithFlipOneActive.players[1].offer[0].faceUp).toBe(false)
    })
  })

  describe('Phase validation', () => {
    test('allows SELECT_FLIP_ONE_CARD only during action phase', () => {
      // Set up Flip One effect in action phase
      const stateWithFlipOne = gameReducer(initialState, {
        type: 'PLAY_ACTION_CARD',
        playerId: 0,
        cardId: 'flip-one-1'
      })
      
      // Change to different phase
      const stateInWrongPhase = {
        ...stateWithFlipOne,
        currentPhase: GamePhase.OFFER_PHASE
      }
      
      expect(() => {
        gameReducer(stateInWrongPhase, {
          type: 'SELECT_FLIP_ONE_CARD',
          offerId: 1,
          cardIndex: 0
        })
      }).toThrow('Action SELECT_FLIP_ONE_CARD is not allowed during phase offer_phase')
    })
  })
})