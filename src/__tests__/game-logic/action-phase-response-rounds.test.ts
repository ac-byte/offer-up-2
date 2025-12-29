import { 
  gameReducer, 
  createInitialGameState,
  initializeActionPhasePassSystem,
  resetPassCounter,
  decrementPassCounter,
  shouldEndActionPhase,
  handleActionPhasePlayerPass,
  advanceToNextEligiblePlayerInActionPhase,
  getPlayersWithActionCards
} from '../../game-logic/gameReducer'
import { GamePhase } from '../../types'

describe('Action Phase Pass System', () => {
  let initialState: ReturnType<typeof createInitialGameState>

  beforeEach(() => {
    initialState = createInitialGameState()
  })

  describe('Pass System Management', () => {
    test('getPlayersWithActionCards identifies players with action cards', () => {
      const state = {
        ...initialState,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false }
        ],
        currentBuyerIndex: 0
      }
      
      const playersWithActionCards = getPlayersWithActionCards(state)
      
      expect(playersWithActionCards).toEqual([0, 2]) // Alice and Charlie have action cards
    })

    test('initializeActionPhasePassSystem sets up pass counter correctly', () => {
      const state = {
        ...initialState,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false }
        ],
        currentBuyerIndex: 0
      }
      
      const newState = initializeActionPhasePassSystem(state)
      
      expect(newState.actionPhasePassesRemaining).toBe(2)
      expect(newState.actionPhasePlayersWithActionCards).toEqual([0, 1])
    })

    test('resetPassCounter updates counter when action card played', () => {
      const state = {
        ...initialState,
        actionPhasePassesRemaining: 1,
        actionPhasePlayersWithActionCards: [0, 1],
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false }
        ],
        currentBuyerIndex: 0
      }
      
      const newState = resetPassCounter(state)
      
      expect(newState.actionPhasePassesRemaining).toBe(2) // Reset to full count
      expect(newState.actionPhasePlayersWithActionCards).toEqual([0, 1])
    })

    test('decrementPassCounter reduces counter when player passes', () => {
      const state = {
        ...initialState,
        actionPhasePassesRemaining: 2,
        actionPhasePlayersWithActionCards: [0, 1]
      }
      
      const newState = decrementPassCounter(state)
      
      expect(newState.actionPhasePassesRemaining).toBe(1)
    })

    test('decrementPassCounter does not go below zero', () => {
      const state = {
        ...initialState,
        actionPhasePassesRemaining: 0,
        actionPhasePlayersWithActionCards: []
      }
      
      const newState = decrementPassCounter(state)
      
      expect(newState.actionPhasePassesRemaining).toBe(0)
    })
  })

  describe('Action Phase End Conditions', () => {
    test('shouldEndActionPhase returns true when no players have action cards', () => {
      const state = {
        ...initialState,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ],
        currentBuyerIndex: 0
      }
      
      expect(shouldEndActionPhase(state)).toBe(true)
    })

    test('shouldEndActionPhase returns true when passes remaining reaches zero', () => {
      const state = {
        ...initialState,
        actionPhasePassesRemaining: 0,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false }
        ],
        currentBuyerIndex: 0
      }
      
      expect(shouldEndActionPhase(state)).toBe(true)
    })

    test('shouldEndActionPhase returns false when players have action cards and passes remain', () => {
      const state = {
        ...initialState,
        actionPhasePassesRemaining: 2,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false }
        ],
        currentBuyerIndex: 0
      }
      
      expect(shouldEndActionPhase(state)).toBe(false)
    })
  })

  describe('PLAY_ACTION_CARD with Pass System', () => {
    let gameState: ReturnType<typeof createInitialGameState>

    beforeEach(() => {
      // Create a game state with 3 players in action phase
      gameState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
      gameState = { ...gameState, currentPhase: GamePhase.ACTION_PHASE, currentBuyerIndex: 0, currentPlayerIndex: 0 }
      
      // Give players action cards
      const actionCards = [
        { id: 'add-one-0', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1, effect: 'This card has an effect' },
        { id: 'remove-one-0', type: 'action' as const, subtype: 'remove-one', name: 'Remove One', setSize: 1, effect: 'This card has an effect' },
        { id: 'flip-one-0', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1, effect: 'This card has an effect' }
      ]
      
      gameState.players[0].collection = [actionCards[0]] // Alice has Add One
      gameState.players[1].collection = [actionCards[1]] // Bob has Remove One
      gameState.players[2].collection = [actionCards[2]] // Charlie has Flip One
      
      // Initialize pass system
      gameState = initializeActionPhasePassSystem(gameState)
      
      // Add some cards to draw pile for Add One effect
      gameState.drawPile = [
        { id: 'giant-0', type: 'thing' as const, subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
    })

    test('playing action card resets pass counter', () => {
      // Set passes remaining to 1 (as if 2 players already passed)
      gameState.actionPhasePassesRemaining = 1
      
      const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
      
      const newState = gameReducer(gameState, action)
      
      // Pass counter should be reset to 2 (Bob and Charlie still have action cards)
      expect(newState.actionPhasePassesRemaining).toBe(2)
    })

    test('playing action card advances to next eligible player', () => {
      const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
      
      const newState = gameReducer(gameState, action)
      
      // Should advance to next player with action cards (Bob at index 1)
      expect(newState.currentPlayerIndex).toBe(1)
    })

    test('action phase ends when no players have action cards after play', () => {
      // Remove action cards from Bob and Charlie so only Alice has one
      gameState.players[1].collection = []
      gameState.players[2].collection = []
      gameState = initializeActionPhasePassSystem(gameState) // Reinitialize with new state
      
      // Alice plays her only action card
      const state = gameReducer(gameState, { type: 'PLAY_ACTION_CARD', playerId: 0, cardId: 'add-one-0' })
      
      // Since no other players have action cards, the action phase should end
      expect(state.currentPhase).toBe(GamePhase.OFFER_SELECTION)
    })

    test('pass counter resets correctly after action card removes player from eligible list', () => {
      // Alice plays her action card
      let state = gameReducer(gameState, { type: 'PLAY_ACTION_CARD', playerId: 0, cardId: 'add-one-0' })
      
      // Pass counter should be reset to count of remaining players with action cards (Bob and Charlie)
      expect(state.actionPhasePassesRemaining).toBe(2)
      expect(state.actionPhasePlayersWithActionCards).toEqual([1, 2])
    })
  })

  describe('DECLARE_DONE in Action Phase (Pass System)', () => {
    let gameState: ReturnType<typeof createInitialGameState>

    beforeEach(() => {
      gameState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
      gameState = { ...gameState, currentPhase: GamePhase.ACTION_PHASE, currentBuyerIndex: 0, currentPlayerIndex: 0 }
      
      gameState.players[0].collection = [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }]
      gameState.players[1].collection = [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }]
      gameState.players[2].collection = []
      
      gameState = initializeActionPhasePassSystem(gameState)
    })

    test('DECLARE_DONE decrements pass counter', () => {
      const initialPasses = gameState.actionPhasePassesRemaining
      
      const newState = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 0 })
      
      expect(newState.actionPhasePassesRemaining).toBe(initialPasses - 1)
    })

    test('DECLARE_DONE advances to next eligible player', () => {
      const newState = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 0 })
      
      // Should advance to Bob (index 1) who has action cards
      expect(newState.currentPlayerIndex).toBe(1)
    })

    test('DECLARE_DONE can end action phase when passes remaining reaches zero', () => {
      // Set up state where only one pass remains
      gameState.actionPhasePassesRemaining = 1
      
      const newState = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 0 })
      
      // Action phase should end since passes remaining reached zero
      expect(newState.currentPhase).toBe(GamePhase.OFFER_SELECTION)
    })

    test('players without action cards cannot pass (are automatically skipped)', () => {
      // Charlie has no action cards, so trying to make him pass should just advance
      gameState.currentPlayerIndex = 2
      
      const newState = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 2 })
      
      // Should advance to next eligible player without decrementing pass counter
      expect(newState.currentPlayerIndex).toBe(0) // Back to Alice
      expect(newState.actionPhasePassesRemaining).toBe(gameState.actionPhasePassesRemaining) // Unchanged
    })
  })

  describe('Player Skipping in Pass System', () => {
    let gameState: ReturnType<typeof createInitialGameState>

    beforeEach(() => {
      gameState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie', 'David'] })
      gameState = { ...gameState, currentPhase: GamePhase.ACTION_PHASE, currentBuyerIndex: 0, currentPlayerIndex: 0 }
    })

    test('players without action cards are automatically skipped', () => {
      // Only Alice and Charlie have action cards
      gameState.players[0].collection = [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }]
      gameState.players[1].collection = [] // Bob has no action cards
      gameState.players[2].collection = [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }]
      gameState.players[3].collection = [] // David has no action cards
      
      gameState = initializeActionPhasePassSystem(gameState)
      
      // Alice passes
      let state = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 0 })
      
      // Should skip Bob (no action cards) and go to Charlie
      expect(state.currentPlayerIndex).toBe(2)
      
      // Charlie passes
      state = gameReducer(state, { type: 'DECLARE_DONE', playerId: 2 })
      
      // Should end action phase since all players with action cards have passed
      expect(state.currentPhase).toBe(GamePhase.OFFER_SELECTION)
    })

    test('pass system correctly counts only players with action cards', () => {
      // Only Alice has action cards
      gameState.players[0].collection = [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }]
      gameState.players[1].collection = []
      gameState.players[2].collection = []
      gameState.players[3].collection = []
      
      const newState = initializeActionPhasePassSystem(gameState)
      
      expect(newState.actionPhasePassesRemaining).toBe(1) // Only Alice
      expect(newState.actionPhasePlayersWithActionCards).toEqual([0])
    })

    test('action phase ends immediately when no players have action cards', () => {
      // No players have action cards
      gameState.players[0].collection = []
      gameState.players[1].collection = []
      gameState.players[2].collection = []
      gameState.players[3].collection = []
      
      const newState = initializeActionPhasePassSystem(gameState)
      
      expect(shouldEndActionPhase(newState)).toBe(true)
    })
  })

  describe('Pass System Integration', () => {
    let gameState: ReturnType<typeof createInitialGameState>

    beforeEach(() => {
      gameState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
      gameState = { ...gameState, currentPhase: GamePhase.ACTION_PHASE, currentBuyerIndex: 0, currentPlayerIndex: 0 }
      
      gameState.players[0].collection = [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }]
      gameState.players[1].collection = [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }]
      gameState.players[2].collection = [{ id: 'action-3', type: 'action' as const, subtype: 'remove-one', name: 'Remove One', setSize: 1 }]
      
      gameState = initializeActionPhasePassSystem(gameState)
    })

    test('complete pass cycle ends action phase', () => {
      // All players pass without playing cards
      let state = gameState
      
      // Alice passes
      state = gameReducer(state, { type: 'DECLARE_DONE', playerId: 0 })
      expect(state.actionPhasePassesRemaining).toBe(2)
      expect(state.currentPlayerIndex).toBe(1)
      
      // Bob passes
      state = gameReducer(state, { type: 'DECLARE_DONE', playerId: 1 })
      expect(state.actionPhasePassesRemaining).toBe(1)
      expect(state.currentPlayerIndex).toBe(2)
      
      // Charlie passes - should end action phase
      state = gameReducer(state, { type: 'DECLARE_DONE', playerId: 2 })
      expect(state.currentPhase).toBe(GamePhase.OFFER_SELECTION)
    })

    test('playing action card resets pass cycle', () => {
      // Alice passes
      let state = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 0 })
      expect(state.actionPhasePassesRemaining).toBe(2)
      
      // Bob plays action card - should reset passes
      state = gameReducer(state, { type: 'PLAY_ACTION_CARD', playerId: 1, cardId: 'action-2' })
      expect(state.actionPhasePassesRemaining).toBe(2) // Reset to count of remaining players with action cards
      
      // Should continue with Charlie
      expect(state.currentPlayerIndex).toBe(2)
    })
  })
})