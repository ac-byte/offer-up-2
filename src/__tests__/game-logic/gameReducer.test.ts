import { 
  gameReducer, 
  createInitialGameState, 
  createPlayer, 
  validatePlayerCount, 
  selectRandomBuyer,
  getPhaseOrder,
  validatePhaseAction,
  advanceToNextPhase,
  shouldContinueGame
} from '../../game-logic/gameReducer'
import { GamePhase } from '../../types'

describe('Game Reducer', () => {
  describe('createInitialGameState', () => {
    test('creates initial state with correct default values', () => {
      const state = createInitialGameState()
      
      expect(state.players).toEqual([])
      expect(state.currentBuyerIndex).toBe(0)
      expect(state.currentPhase).toBe(GamePhase.BUYER_ASSIGNMENT)
      expect(state.currentPlayerIndex).toBe(0)
      expect(state.round).toBe(1)
      expect(state.drawPile).toEqual([])
      expect(state.discardPile).toEqual([])
      expect(state.selectedPerspective).toBe(0)
      expect(state.phaseInstructions).toBe('Waiting for game to start...')
      expect(state.winner).toBeNull()
      expect(state.gameStarted).toBe(false)
    })
  })

  describe('createPlayer', () => {
    test('creates player with correct initial values', () => {
      const player = createPlayer(1, 'Alice')
      
      expect(player.id).toBe(1)
      expect(player.name).toBe('Alice')
      expect(player.hand).toEqual([])
      expect(player.offer).toEqual([])
      expect(player.collection).toEqual([])
      expect(player.points).toBe(0)
      expect(player.hasMoney).toBe(false)
    })
  })

  describe('validatePlayerCount', () => {
    test('returns true for valid player counts (3-6)', () => {
      expect(validatePlayerCount(3)).toBe(true)
      expect(validatePlayerCount(4)).toBe(true)
      expect(validatePlayerCount(5)).toBe(true)
      expect(validatePlayerCount(6)).toBe(true)
    })

    test('returns false for invalid player counts', () => {
      expect(validatePlayerCount(2)).toBe(false)
      expect(validatePlayerCount(7)).toBe(false)
      expect(validatePlayerCount(0)).toBe(false)
      expect(validatePlayerCount(-1)).toBe(false)
    })
  })

  describe('selectRandomBuyer', () => {
    test('returns valid buyer index for different player counts', () => {
      for (let playerCount = 3; playerCount <= 6; playerCount++) {
        const buyerIndex = selectRandomBuyer(playerCount)
        expect(buyerIndex).toBeGreaterThanOrEqual(0)
        expect(buyerIndex).toBeLessThan(playerCount)
      }
    })

    test('returns different buyers across multiple calls (probabilistic)', () => {
      const results = new Set()
      const playerCount = 4
      
      // Run multiple times to check randomness
      for (let i = 0; i < 20; i++) {
        results.add(selectRandomBuyer(playerCount))
      }
      
      // Should have at least 2 different results with high probability
      expect(results.size).toBeGreaterThan(1)
    })
  })

  describe('getPhaseOrder', () => {
    test('returns correct 10-phase sequence', () => {
      const phases = getPhaseOrder()
      
      expect(phases).toHaveLength(10)
      expect(phases).toEqual([
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
      ])
    })
  })

  describe('validatePhaseAction', () => {
    test('allows START_GAME in any phase', () => {
      const action = { type: 'START_GAME' as const, players: ['Alice', 'Bob', 'Charlie'] }
      
      expect(validatePhaseAction(GamePhase.BUYER_ASSIGNMENT, action)).toBe(true)
      expect(validatePhaseAction(GamePhase.DEAL, action)).toBe(true)
    })

    test('allows ADVANCE_PHASE in any phase', () => {
      const action = { type: 'ADVANCE_PHASE' as const }
      
      expect(validatePhaseAction(GamePhase.BUYER_ASSIGNMENT, action)).toBe(true)
      expect(validatePhaseAction(GamePhase.DEAL, action)).toBe(true)
    })

    test('allows CHANGE_PERSPECTIVE in any phase', () => {
      const action = { type: 'CHANGE_PERSPECTIVE' as const, playerId: 0 }
      
      expect(validatePhaseAction(GamePhase.BUYER_ASSIGNMENT, action)).toBe(true)
      expect(validatePhaseAction(GamePhase.DEAL, action)).toBe(true)
    })

    test('only allows PLACE_OFFER during offer phase', () => {
      const action = { type: 'PLACE_OFFER' as const, playerId: 0, cards: [], faceUpIndex: 0 }
      
      expect(validatePhaseAction(GamePhase.OFFER_PHASE, action)).toBe(true)
      expect(validatePhaseAction(GamePhase.DEAL, action)).toBe(false)
      expect(validatePhaseAction(GamePhase.BUYER_FLIP, action)).toBe(false)
    })

    test('only allows FLIP_CARD during buyer-flip phase', () => {
      const action = { type: 'FLIP_CARD' as const, offerId: 0, cardIndex: 0 }
      
      expect(validatePhaseAction(GamePhase.BUYER_FLIP, action)).toBe(true)
      expect(validatePhaseAction(GamePhase.OFFER_PHASE, action)).toBe(false)
      expect(validatePhaseAction(GamePhase.ACTION_PHASE, action)).toBe(false)
    })

    test('only allows PLAY_ACTION_CARD during action phase', () => {
      const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'card1' }
      
      expect(validatePhaseAction(GamePhase.ACTION_PHASE, action)).toBe(true)
      expect(validatePhaseAction(GamePhase.OFFER_PHASE, action)).toBe(false)
      expect(validatePhaseAction(GamePhase.BUYER_FLIP, action)).toBe(false)
    })

    test('only allows SELECT_OFFER during offer selection phase', () => {
      const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 1 }
      
      expect(validatePhaseAction(GamePhase.OFFER_SELECTION, action)).toBe(true)
      expect(validatePhaseAction(GamePhase.OFFER_PHASE, action)).toBe(false)
      expect(validatePhaseAction(GamePhase.BUYER_FLIP, action)).toBe(false)
    })

    test('allows DECLARE_DONE during interactive phases', () => {
      const action = { type: 'DECLARE_DONE' as const, playerId: 0 }
      
      expect(validatePhaseAction(GamePhase.ACTION_PHASE, action)).toBe(true)
      expect(validatePhaseAction(GamePhase.OFFER_PHASE, action)).toBe(true)
      expect(validatePhaseAction(GamePhase.DEAL, action)).toBe(false)
    })

    test('rejects unknown actions', () => {
      const action = { type: 'UNKNOWN_ACTION' as any }
      
      expect(validatePhaseAction(GamePhase.BUYER_ASSIGNMENT, action)).toBe(false)
    })
  })

  describe('advanceToNextPhase', () => {
    test('advances through phases in correct order', () => {
      const phases = getPhaseOrder()
      
      for (let i = 0; i < phases.length; i++) {
        const currentPhase = phases[i]
        const expectedNextPhase = phases[(i + 1) % phases.length]
        
        const result = advanceToNextPhase(currentPhase, 1)
        expect(result.nextPhase).toBe(expectedNextPhase)
      }
    })

    test('increments round when advancing from winner determination to buyer assignment', () => {
      const result = advanceToNextPhase(GamePhase.WINNER_DETERMINATION, 1)
      
      expect(result.nextPhase).toBe(GamePhase.BUYER_ASSIGNMENT)
      expect(result.nextRound).toBe(2)
    })

    test('keeps same round for other phase transitions', () => {
      const result = advanceToNextPhase(GamePhase.DEAL, 1)
      
      expect(result.nextPhase).toBe(GamePhase.OFFER_PHASE)
      expect(result.nextRound).toBe(1)
    })

    test('throws error for invalid phase', () => {
      expect(() => advanceToNextPhase('INVALID_PHASE' as any, 1)).toThrow('Invalid current phase: INVALID_PHASE')
    })
  })

  describe('shouldContinueGame', () => {
    test('returns true when no winner is declared', () => {
      const state = { ...createInitialGameState(), winner: null }
      
      expect(shouldContinueGame(state)).toBe(true)
    })

    test('returns false when winner is declared', () => {
      const state = { ...createInitialGameState(), winner: 0 }
      
      expect(shouldContinueGame(state)).toBe(false)
    })
  })

  describe('gameReducer', () => {
    let initialState: ReturnType<typeof createInitialGameState>

    beforeEach(() => {
      initialState = createInitialGameState()
    })

    describe('START_GAME action', () => {
      test('initializes game with valid player count', () => {
        const action = { type: 'START_GAME' as const, players: ['Alice', 'Bob', 'Charlie'] }
        const newState = gameReducer(initialState, action)
        
        expect(newState.players).toHaveLength(3)
        expect(newState.players[0].name).toBe('Alice')
        expect(newState.players[1].name).toBe('Bob')
        expect(newState.players[2].name).toBe('Charlie')
        
        expect(newState.gameStarted).toBe(true)
        expect(newState.currentPhase).toBe(GamePhase.DEAL)
        expect(newState.round).toBe(1)
        expect(newState.drawPile).toHaveLength(120) // Full deck
        expect(newState.phaseInstructions).toBe('Deal phase: Dealing cards to all players...')
      })

      test('assigns money bag to exactly one player', () => {
        const action = { type: 'START_GAME' as const, players: ['Alice', 'Bob', 'Charlie', 'David'] }
        const newState = gameReducer(initialState, action)
        
        const playersWithMoney = newState.players.filter(player => player.hasMoney)
        expect(playersWithMoney).toHaveLength(1)
        
        const buyerIndex = newState.currentBuyerIndex
        expect(newState.players[buyerIndex].hasMoney).toBe(true)
      })

      test('throws error for invalid player count', () => {
        const actionTooFew = { type: 'START_GAME' as const, players: ['Alice', 'Bob'] }
        const actionTooMany = { type: 'START_GAME' as const, players: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] }
        
        expect(() => gameReducer(initialState, actionTooFew)).toThrow('Invalid player count: 2. Must be between 3 and 6 players.')
        expect(() => gameReducer(initialState, actionTooMany)).toThrow('Invalid player count: 7. Must be between 3 and 6 players.')
      })

      test('creates shuffled deck', () => {
        const action = { type: 'START_GAME' as const, players: ['Alice', 'Bob', 'Charlie'] }
        const newState = gameReducer(initialState, action)
        
        expect(newState.drawPile).toHaveLength(120)
        
        // Verify deck composition
        const thingCards = newState.drawPile.filter(card => card.type === 'thing')
        const gotchaCards = newState.drawPile.filter(card => card.type === 'gotcha')
        const actionCards = newState.drawPile.filter(card => card.type === 'action')
        
        expect(thingCards).toHaveLength(65)
        expect(gotchaCards).toHaveLength(32)
        expect(actionCards).toHaveLength(23)
      })
    })

    describe('ADVANCE_PHASE action', () => {
      test('advances through phases in correct order', () => {
        let state = { ...initialState, currentPhase: GamePhase.BUYER_ASSIGNMENT }
        
        const phases = [
          GamePhase.DEAL,
          GamePhase.OFFER_PHASE,
          GamePhase.BUYER_FLIP,
          GamePhase.ACTION_PHASE,
          GamePhase.OFFER_SELECTION,
          GamePhase.OFFER_DISTRIBUTION,
          GamePhase.GOTCHA_TRADEINS,
          GamePhase.THING_TRADEINS,
          GamePhase.WINNER_DETERMINATION,
          GamePhase.BUYER_ASSIGNMENT // Back to start
        ]
        
        for (const expectedPhase of phases) {
          state = gameReducer(state, { type: 'ADVANCE_PHASE' })
          expect(state.currentPhase).toBe(expectedPhase)
        }
      })

      test('increments round when returning to buyer assignment', () => {
        let state = { ...initialState, currentPhase: GamePhase.WINNER_DETERMINATION, round: 1 }
        
        state = gameReducer(state, { type: 'ADVANCE_PHASE' })
        
        expect(state.currentPhase).toBe(GamePhase.BUYER_ASSIGNMENT)
        expect(state.round).toBe(2)
      })

      test('updates phase instructions', () => {
        let state = { ...initialState, currentPhase: GamePhase.BUYER_ASSIGNMENT }
        
        state = gameReducer(state, { type: 'ADVANCE_PHASE' })
        
        expect(state.phaseInstructions).toBe('Deal phase: Dealing cards to all players...')
      })

      test('does not advance when game is over', () => {
        let state = { 
          ...initialState, 
          currentPhase: GamePhase.WINNER_DETERMINATION, 
          winner: 0,
          round: 1 
        }
        
        const newState = gameReducer(state, { type: 'ADVANCE_PHASE' })
        
        expect(newState.currentPhase).toBe(GamePhase.WINNER_DETERMINATION)
        expect(newState.round).toBe(1)
      })
    })

    describe('phase-specific action validation', () => {
      test('throws error for invalid phase actions', () => {
        const state = { ...initialState, currentPhase: GamePhase.DEAL }
        
        // Try to place offer during deal phase
        const invalidAction = { type: 'PLACE_OFFER' as const, playerId: 0, cards: [], faceUpIndex: 0 }
        
        expect(() => gameReducer(state, invalidAction)).toThrow('Action PLACE_OFFER is not allowed during phase deal')
      })

      test('allows valid phase actions', () => {
        const state = { ...initialState, currentPhase: GamePhase.OFFER_PHASE }
        
        // Place offer during offer phase should not throw
        const validAction = { type: 'PLACE_OFFER' as const, playerId: 0, cards: [], faceUpIndex: 0 }
        
        expect(() => gameReducer(state, validAction)).not.toThrow()
      })

      test('allows universal actions in any phase', () => {
        const state = { ...initialState, currentPhase: GamePhase.DEAL }
        
        // Change perspective should work in any phase
        const universalAction = { type: 'CHANGE_PERSPECTIVE' as const, playerId: 0 }
        
        expect(() => gameReducer(state, universalAction)).not.toThrow()
      })
    })

    describe('CHANGE_PERSPECTIVE action', () => {
      test('changes perspective to valid player ID', () => {
        const state = {
          ...initialState,
          players: [
            createPlayer(0, 'Alice'),
            createPlayer(1, 'Bob'),
            createPlayer(2, 'Charlie')
          ]
        }
        
        const newState = gameReducer(state, { type: 'CHANGE_PERSPECTIVE', playerId: 2 })
        
        expect(newState.selectedPerspective).toBe(2)
      })

      test('ignores invalid player ID', () => {
        const state = {
          ...initialState,
          players: [createPlayer(0, 'Alice'), createPlayer(1, 'Bob')],
          selectedPerspective: 0
        }
        
        const newState1 = gameReducer(state, { type: 'CHANGE_PERSPECTIVE', playerId: -1 })
        const newState2 = gameReducer(state, { type: 'CHANGE_PERSPECTIVE', playerId: 5 })
        
        expect(newState1.selectedPerspective).toBe(0) // Unchanged
        expect(newState2.selectedPerspective).toBe(0) // Unchanged
      })
    })

    describe('unknown action', () => {
      test('throws error for unknown action due to phase validation', () => {
        const unknownAction = { type: 'UNKNOWN_ACTION' as any }
        
        expect(() => gameReducer(initialState, unknownAction)).toThrow('Action UNKNOWN_ACTION is not allowed during phase buyer_assignment')
      })
    })
  })
})