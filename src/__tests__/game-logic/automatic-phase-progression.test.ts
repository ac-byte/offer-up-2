import { 
  createInitialGameState, 
  createPlayer, 
  gameReducer,
  advanceToNextPhaseWithInitialization,
  handleWinnerDeterminationPhase,
  handleBuyerAssignmentPhase
} from '../../game-logic/gameReducer'
import { GameState, GamePhase, GameAction } from '../../types'

/**
 * Test automatic progression through winner determination and buyer assignment phases
 */
describe('Automatic Phase Progression', () => {
  const createMockGameState = (players: any[], currentPhase: GamePhase, round: number = 1): GameState => {
    const state = createInitialGameState()
    return {
      ...state,
      players,
      currentPhase,
      round,
      gameStarted: true,
      currentBuyerIndex: 0,
      nextBuyerIndex: 1,
      drawPile: Array.from({ length: 120 }, (_, i) => ({
        id: `card-${i}`,
        type: 'thing' as const,
        subtype: 'medium' as const,
        name: `Test Card ${i}`,
        setSize: 3
      }))
    }
  }

  describe('Winner Determination Phase Automation', () => {
    it('automatically declares winner and ends game when clear winner exists', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 6 // Clear winner
      players[1].points = 3
      players[2].points = 2

      const state = createMockGameState(players, GamePhase.WINNER_DETERMINATION, 3)
      
      // Test direct phase handler
      const result = handleWinnerDeterminationPhase(state)
      
      expect(result.winner).toBe(0)
      expect(result.phaseInstructions).toBe('Game Over! Alice wins with 6 points!')
      expect(result.currentPhase).toBe(GamePhase.WINNER_DETERMINATION) // Stays in phase when game ends
    })

    it('automatically advances to next round when no clear winner', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 4 // No one has 5+ points
      players[1].points = 3
      players[2].points = 2

      const state = createMockGameState(players, GamePhase.WINNER_DETERMINATION, 2)
      
      // Test direct phase handler - should automatically progress through buyer assignment and deal
      const result = handleWinnerDeterminationPhase(state)
      
      expect(result.winner).toBeNull()
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE) // Should progress through buyer assignment and deal
      expect(result.round).toBe(3)
    })

    it('automatically advances to next round when players are tied', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 5 // Tied for most points
      players[1].points = 5
      players[2].points = 3

      const state = createMockGameState(players, GamePhase.WINNER_DETERMINATION, 4)
      
      // Test direct phase handler - should automatically progress through buyer assignment and deal
      const result = handleWinnerDeterminationPhase(state)
      
      expect(result.winner).toBeNull()
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE) // Should progress through buyer assignment and deal
      expect(result.round).toBe(5)
    })

    it('automatically processes winner determination when entering phase via advanceToNextPhaseWithInitialization', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob')
      ]
      players[0].points = 6 // Clear winner
      players[1].points = 2

      const state = createMockGameState(players, GamePhase.THING_TRADEINS, 2)
      
      // Test automatic advancement from Thing trade-ins to Winner determination
      const result = advanceToNextPhaseWithInitialization(state)
      
      expect(result.winner).toBe(0)
      expect(result.phaseInstructions).toBe('Game Over! Alice wins with 6 points!')
    })

    it('automatically processes winner determination via ADVANCE_PHASE action', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob')
      ]
      players[0].points = 4 // No winner yet
      players[1].points = 3

      const state = createMockGameState(players, GamePhase.WINNER_DETERMINATION, 1)
      
      const action: GameAction = { type: 'ADVANCE_PHASE' }
      const result = gameReducer(state, action)
      
      expect(result.winner).toBeNull()
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE) // Should progress through buyer assignment and deal
      expect(result.round).toBe(2)
    })
  })

  describe('Buyer Assignment Phase Automation', () => {
    it('automatically transfers buyer role and advances to deal phase', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].hasMoney = false
      players[1].hasMoney = true // Bob has the money bag
      players[2].hasMoney = false

      const state = createMockGameState(players, GamePhase.BUYER_ASSIGNMENT, 2)
      state.currentBuyerIndex = 0 // Alice was previous buyer
      state.nextBuyerIndex = 1 // Bob should become new buyer
      
      // Test direct phase handler - should automatically progress through deal to offer phase
      const result = handleBuyerAssignmentPhase(state)
      
      expect(result.currentBuyerIndex).toBe(1) // Bob is now the buyer
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE) // Should progress through deal to offer phase
      expect(result.round).toBe(2) // Round should stay the same
    })

    it('automatically processes buyer assignment when entering phase via advanceToNextPhaseWithInitialization', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob')
      ]
      players[0].hasMoney = false
      players[1].hasMoney = true

      const state = createMockGameState(players, GamePhase.WINNER_DETERMINATION, 1)
      state.currentBuyerIndex = 0
      state.nextBuyerIndex = 1
      
      // Test automatic advancement from Winner determination to Buyer assignment
      const result = advanceToNextPhaseWithInitialization(state)
      
      expect(result.currentBuyerIndex).toBe(1) // Bob is now the buyer
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE) // Should progress through Deal to Offer phase
      expect(result.round).toBe(2)
    })

    it('automatically processes buyer assignment via ADVANCE_PHASE action', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob')
      ]
      players[0].hasMoney = false
      players[1].hasMoney = true

      const state = createMockGameState(players, GamePhase.BUYER_ASSIGNMENT, 3)
      state.currentBuyerIndex = 0
      state.nextBuyerIndex = 1
      
      const action: GameAction = { type: 'ADVANCE_PHASE' }
      const result = gameReducer(state, action)
      
      expect(result.currentBuyerIndex).toBe(1) // Bob is now the buyer
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE) // Should progress through Deal to Offer phase
      expect(result.round).toBe(3)
    })
  })

  describe('Full Round Cycle Automation', () => {
    it('automatically progresses through complete round cycle without user intervention', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 2
      players[1].points = 3
      players[2].points = 1
      players[1].hasMoney = true // Bob has money bag

      // Start from winner determination with no winner
      let state = createMockGameState(players, GamePhase.WINNER_DETERMINATION, 2)
      state.currentBuyerIndex = 0 // Alice was buyer
      state.nextBuyerIndex = 1 // Bob will be next buyer
      
      // Advance through winner determination -> buyer assignment -> deal -> offer phase
      const result = advanceToNextPhaseWithInitialization(state)
      
      expect(result.winner).toBeNull() // No winner yet
      expect(result.currentBuyerIndex).toBe(1) // Bob is now buyer
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE) // Should end up in offer phase
      expect(result.round).toBe(3) // Next round
      
      // Verify all players have 5 cards (dealt automatically)
      expect(result.players.every(player => player.hand.length === 5)).toBe(true)
    })

    it('prevents further actions when game ends with winner', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob')
      ]
      players[0].points = 7 // Clear winner
      players[1].points = 2

      let state = createMockGameState(players, GamePhase.WINNER_DETERMINATION, 5)
      
      // Process winner determination - should declare winner and stop
      state = handleWinnerDeterminationPhase(state)
      
      expect(state.winner).toBe(0) // Alice wins
      expect(state.phaseInstructions).toBe('Game Over! Alice wins with 7 points!')
      
      // Try to advance phase after game ends - should be prevented
      const action: GameAction = { type: 'ADVANCE_PHASE' }
      const result = gameReducer(state, action)
      
      expect(result).toBe(state) // State should be unchanged
      expect(result.winner).toBe(0) // Winner should still be declared
    })
  })

  describe('No User Interaction Required', () => {
    it('requires no user actions to progress through winner determination phase', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob')
      ]
      players[0].points = 3
      players[1].points = 4

      const state = createMockGameState(players, GamePhase.WINNER_DETERMINATION, 1)
      
      // Should automatically determine no winner and advance through buyer assignment and deal
      const result = handleWinnerDeterminationPhase(state)
      
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE)
      expect(result.round).toBe(2)
      // No user interaction was required
    })

    it('requires no user actions to progress through buyer assignment phase', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob')
      ]
      players[1].hasMoney = true

      const state = createMockGameState(players, GamePhase.BUYER_ASSIGNMENT, 2)
      state.currentBuyerIndex = 0
      state.nextBuyerIndex = 1
      
      // Should automatically transfer buyer role and advance through deal to offer phase
      const result = handleBuyerAssignmentPhase(state)
      
      expect(result.currentBuyerIndex).toBe(1)
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE)
      // No user interaction was required
    })
  })
})