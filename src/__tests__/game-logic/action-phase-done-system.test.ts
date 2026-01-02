import { 
  gameReducer, 
  createInitialGameState,
  initializeActionPhaseDoneSystem,
  initializeActionPhase,
  resetDoneStates,
  markPlayerAsDone,
  shouldEndActionPhase,
  handleActionPhasePlayerDone,
  advanceToNextEligiblePlayerInActionPhase,
  getPlayersWithActionCards
} from '../../game-logic/gameReducer'
import { GamePhase } from '../../types'

describe('Action Phase Done System', () => {
  let initialState: ReturnType<typeof createInitialGameState>

  beforeEach(() => {
    initialState = createInitialGameState()
  })

  describe('Done System Management', () => {
    test('getPlayersWithActionCards identifies players with action cards', () => {
      const state = {
        ...initialState,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ]
      }
      
      const playersWithActionCards = getPlayersWithActionCards(state)
      
      expect(playersWithActionCards).toEqual([0, 1])
    })

    test('initializeActionPhaseDoneSystem sets up done states correctly', () => {
      const state = {
        ...initialState,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ]
      }
      
      const newState = initializeActionPhaseDoneSystem(state)
      
      expect(newState.actionPhaseDoneStates).toEqual([false, false, true]) // Alice and Bob not done, Charlie done (no action cards)
    })

    test('resetDoneStates updates done states when action card played', () => {
      const state = {
        ...initialState,
        actionPhaseDoneStates: [true, true, true], // All players were done
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ]
      }
      
      const newState = resetDoneStates(state)
      
      expect(newState.actionPhaseDoneStates).toEqual([false, false, true]) // Alice and Bob reset to not done, Charlie remains done
    })

    test('markPlayerAsDone marks specific player as done', () => {
      const state = {
        ...initialState,
        actionPhaseDoneStates: [false, false, true],
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ]
      }
      
      const newState = markPlayerAsDone(state, 0) // Mark Alice as done
      
      expect(newState.actionPhaseDoneStates).toEqual([true, false, true])
    })
  })

  describe('Action Phase End Conditions', () => {
    test('shouldEndActionPhase returns true when no players have action cards', () => {
      const state = {
        ...initialState,
        actionPhaseDoneStates: [true, true, true],
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ]
      }
      
      expect(shouldEndActionPhase(state)).toBe(true)
    })

    test('shouldEndActionPhase returns true when all players are done', () => {
      const state = {
        ...initialState,
        actionPhaseDoneStates: [true, true, true],
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ]
      }
      
      expect(shouldEndActionPhase(state)).toBe(true)
    })

    test('shouldEndActionPhase returns false when players have action cards and are not done', () => {
      const state = {
        ...initialState,
        actionPhaseDoneStates: [false, false, true],
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ]
      }
      
      expect(shouldEndActionPhase(state)).toBe(false)
    })
  })

  describe('PLAY_ACTION_CARD with Done System', () => {
    let gameState: ReturnType<typeof createInitialGameState>

    beforeEach(() => {
      gameState = {
        ...initialState,
        currentPhase: GamePhase.ACTION_PHASE,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'add-one-0', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [{ id: 'action-3', type: 'action' as const, subtype: 'remove-one', name: 'Remove One', setSize: 1 }], points: 0, hasMoney: false }
        ]
      }

      // Initialize done system
      gameState = initializeActionPhaseDoneSystem(gameState)
      
      // Add some cards to draw pile for Add One effect
      gameState.drawPile = [
        { id: 'card-1', type: 'thing' as const, subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
    })

    test('playing action card resets done states', () => {
      // Set some players as done
      gameState.actionPhaseDoneStates = [true, false, false]
      
      const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
      const newState = gameReducer(gameState, action)
      
      // Done states should be reset based on who has action cards
      // Alice played her last action card, so she's now done
      // Bob and Charlie still have action cards, so they're not done
      expect(newState.actionPhaseDoneStates).toEqual([true, false, false])
    })

    test('playing interactive action card does NOT advance player immediately', () => {
      const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
      const newState = gameReducer(gameState, action)
      
      // Should NOT advance player immediately for interactive action cards
      // Player advancement happens only after the Add One effect is complete
      expect(newState.currentPlayerIndex).toBe(0) // Alice should still be current player
      expect(newState.addOneEffectState).not.toBeNull() // Add One effect should be active
    })

    test('action phase ends when no players have action cards after play', () => {
      // Set up state where Alice has the only action card, and use a card that doesn't create effect state
      gameState.players[0].collection = [{ id: 'steal-point-0', type: 'action' as const, subtype: 'steal-point', name: 'Steal A Point', setSize: 1 }]
      gameState.players[1].collection = []
      gameState.players[2].collection = []
      
      // Add a target player with more points for Steal A Point to work
      gameState.players[1].points = 2
      
      const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'steal-point-0' }
      const newState = gameReducer(gameState, action)
      
      // Should stay in action phase because Steal A Point creates an effect state
      // Let's complete the effect by selecting a target
      const selectTargetAction = { type: 'SELECT_STEAL_A_POINT_TARGET' as const, targetPlayerId: 1 }
      const finalState = gameReducer(newState, selectTargetAction)
      
      // Now should advance to next phase since no players have action cards
      expect(finalState.currentPhase).toBe(GamePhase.OFFER_SELECTION)
    })

    test('done states reset correctly after action card removes player from eligible list', () => {
      // Alice plays her only action card
      const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
      const state = gameReducer(gameState, action)
      
      // Done states should be reset to count of remaining players with action cards (Bob and Charlie)
      expect(state.actionPhaseDoneStates).toEqual([true, false, false]) // Alice now done (no action cards), Bob and Charlie not done
    })
  })

  describe('DECLARE_DONE in Action Phase (Done System)', () => {
    let gameState: ReturnType<typeof createInitialGameState>

    beforeEach(() => {
      gameState = {
        ...initialState,
        currentPhase: GamePhase.ACTION_PHASE,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ]
      }
      
      gameState = initializeActionPhaseDoneSystem(gameState)
    })

    test('DECLARE_DONE marks player as done', () => {
      const initialDoneStates = [...gameState.actionPhaseDoneStates]
      
      const newState = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 0 })
      
      expect(newState.actionPhaseDoneStates[0]).toBe(true) // Alice is now done
      expect(newState.actionPhaseDoneStates[1]).toBe(initialDoneStates[1]) // Bob unchanged
      expect(newState.actionPhaseDoneStates[2]).toBe(initialDoneStates[2]) // Charlie unchanged
    })

    test('DECLARE_DONE advances to next eligible player', () => {
      const newState = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 0 })
      
      expect(newState.currentPlayerIndex).toBe(1) // Should advance to Bob
    })

    test('DECLARE_DONE can end action phase when all players are done', () => {
      // Set up state where only Alice is not done
      gameState.actionPhaseDoneStates = [false, true, true]
      
      const newState = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 0 })
      
      // Should advance to next phase since all players are now done
      expect(newState.currentPhase).toBe(GamePhase.OFFER_SELECTION)
    })

    test('players without action cards cannot declare done (are automatically done)', () => {
      // Charlie has no action cards, so should already be done
      expect(gameState.actionPhaseDoneStates[2]).toBe(true)
      
      // Set Charlie as the current player to test the behavior
      gameState.currentPlayerIndex = 2
      
      // Trying to declare done for Charlie should just advance to next player
      const newState = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 2 })
      
      // Should advance player without changing done state (Charlie was already done)
      expect(newState.currentPlayerIndex).toBe(0) // Back to Alice
      expect(newState.actionPhaseDoneStates[2]).toBe(gameState.actionPhaseDoneStates[2]) // Unchanged
    })
  })

  describe('Player Skipping in Done System', () => {
    let gameState: ReturnType<typeof createInitialGameState>

    beforeEach(() => {
      gameState = {
        ...initialState,
        currentPhase: GamePhase.ACTION_PHASE,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [{ id: 'action-3', type: 'action' as const, subtype: 'remove-one', name: 'Remove One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 3, name: 'David', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ]
      }
      
      gameState = initializeActionPhaseDoneSystem(gameState)
    })

    test('players without action cards are automatically done', () => {
      expect(gameState.actionPhaseDoneStates).toEqual([false, false, false, true]) // David is automatically done
    })

    test('done system correctly counts only players with action cards', () => {
      // Remove action cards from Bob and Charlie
      gameState.players[1].collection = []
      gameState.players[2].collection = []
      
      const newState = initializeActionPhaseDoneSystem(gameState)
      
      expect(newState.actionPhaseDoneStates).toEqual([false, true, true, true]) // Only Alice not done
    })

    test('action phase ends immediately when no players have action cards', () => {
      // Remove all action cards
      gameState.players[0].collection = []
      gameState.players[1].collection = []
      gameState.players[2].collection = []
      
      const newState = initializeActionPhaseDoneSystem(gameState)
      
      expect(shouldEndActionPhase(newState)).toBe(true)
    })
  })

  describe('Done System Integration', () => {
    let gameState: ReturnType<typeof createInitialGameState>

    beforeEach(() => {
      gameState = {
        ...initialState,
        currentPhase: GamePhase.ACTION_PHASE,
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [{ id: 'action-1', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1 }], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [{ id: 'action-2', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1 }], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [{ id: 'action-3', type: 'action' as const, subtype: 'remove-one', name: 'Remove One', setSize: 1 }], points: 0, hasMoney: false }
        ]
      }
      
      gameState = initializeActionPhaseDoneSystem(gameState)
    })

    test('complete done cycle ends action phase', () => {
      // Alice declares done
      let state = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 0 })
      expect(state.actionPhaseDoneStates[0]).toBe(true)
      expect(state.currentPlayerIndex).toBe(1)
      
      // Bob declares done
      state = gameReducer(state, { type: 'DECLARE_DONE', playerId: 1 })
      expect(state.actionPhaseDoneStates[1]).toBe(true)
      expect(state.currentPlayerIndex).toBe(2)
      
      // Charlie declares done - should end action phase
      state = gameReducer(state, { type: 'DECLARE_DONE', playerId: 2 })
      expect(state.currentPhase).toBe(GamePhase.OFFER_SELECTION)
    })

    test('playing action card resets done cycle', () => {
      // Alice declares done
      let state = gameReducer(gameState, { type: 'DECLARE_DONE', playerId: 0 })
      expect(state.actionPhaseDoneStates[0]).toBe(true)
      
      // Bob plays action card - should reset done states
      state = gameReducer(state, { type: 'PLAY_ACTION_CARD', playerId: 1, cardId: 'action-2' })
      expect(state.actionPhaseDoneStates[0]).toBe(false) // Alice reset to not done
      expect(state.actionPhaseDoneStates[1]).toBe(true) // Bob now done (no more action cards)
      
      // Should NOT advance player immediately for interactive action cards (Add One)
      // Player advancement happens only after the Add One effect is complete
      expect(state.currentPlayerIndex).toBe(1) // Bob should still be current player
      expect(state.addOneEffectState).not.toBeNull() // Add One effect should be active
    })
  })

  describe('Action Phase Auto-Advancement', () => {
    test('automatically advances to next phase when no players have action cards at start', () => {
      // Create a state where no players have action cards
      const state: GameState = {
        ...createInitialGameState(),
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ],
        currentPhase: GamePhase.ACTION_PHASE,
        currentBuyerIndex: 0,
        currentPlayerIndex: 0,
        gameStarted: true
      }

      // Initialize the action phase
      const newState = initializeActionPhase(state)

      // Should automatically advance to offer selection phase since no one has action cards
      expect(newState.currentPhase).toBe(GamePhase.OFFER_SELECTION)
      expect(newState.actionPhaseDoneStates).toEqual([]) // Should be cleared when advancing
    })

    test('stays in action phase when some players have action cards at start', () => {
      // Create a state where some players have action cards
      const state: GameState = {
        ...createInitialGameState(),
        players: [
          { id: 0, name: 'Alice', hand: [], offer: [], collection: [
            { id: 'action1', type: 'action', subtype: 'flip_one', name: 'Flip One', setSize: 1, effect: 'flip_one' }
          ], points: 0, hasMoney: true },
          { id: 1, name: 'Bob', hand: [], offer: [], collection: [], points: 0, hasMoney: false },
          { id: 2, name: 'Charlie', hand: [], offer: [], collection: [], points: 0, hasMoney: false }
        ],
        currentPhase: GamePhase.ACTION_PHASE,
        currentBuyerIndex: 0,
        currentPlayerIndex: 0,
        gameStarted: true
      }

      // Initialize the action phase
      const newState = initializeActionPhase(state)

      // Should stay in action phase since Alice has an action card
      expect(newState.currentPhase).toBe(GamePhase.ACTION_PHASE)
      expect(newState.actionPhaseDoneStates).toEqual([false, true, true]) // Alice not done, others done
    })
  })
})