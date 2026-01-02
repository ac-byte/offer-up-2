import { 
  gameReducer, 
  createInitialGameState, 
  createPlayer, 
  validatePlayerCount, 
  validatePlayerNames,
  validatePlayerConfiguration,
  selectRandomBuyer,
  getPhaseOrder,
  validatePhaseAction,
  advanceToNextPhase,
  shouldContinueGame,
  dealCards,
  handleDealPhase,
  areAllOffersComplete,
  getPlayersWithFiveOrMorePoints,
  determineWinner,
  handleWinnerDeterminationPhase
} from '../../game-logic/gameReducer'
import { GamePhase } from '../../types'
import { createThingCard, createGotchaCard, createActionCard } from '../../game-logic/cards'

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

  describe('validatePlayerNames', () => {
    test('returns valid for good player names', () => {
      const result = validatePlayerNames(['Alice', 'Bob', 'Charlie'])
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('returns invalid for empty names', () => {
      const result = validatePlayerNames(['Alice', '', 'Charlie'])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('All player names must be non-empty')
    })

    test('returns invalid for whitespace-only names', () => {
      const result = validatePlayerNames(['Alice', '   ', 'Charlie'])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('All player names must be non-empty')
    })

    test('returns invalid for duplicate names (case-insensitive)', () => {
      const result = validatePlayerNames(['Alice', 'bob', 'ALICE'])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Player names must be unique')
    })

    test('returns invalid for excessively long names', () => {
      const longName = 'A'.repeat(51) // 51 characters
      const result = validatePlayerNames(['Alice', longName, 'Charlie'])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Player names must be 50 characters or less')
    })

    test('handles mixed validation errors', () => {
      const result = validatePlayerNames(['Alice', '', 'alice'])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('All player names must be non-empty')
      expect(result.errors).toContain('Player names must be unique')
    })
  })

  describe('validatePlayerConfiguration', () => {
    test('returns valid for good configuration', () => {
      const result = validatePlayerConfiguration(['Alice', 'Bob', 'Charlie'])
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('returns invalid for bad player count', () => {
      const result = validatePlayerConfiguration(['Alice', 'Bob'])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid player count: 2. Must be between 3 and 6 players.')
    })

    test('returns invalid for bad player names', () => {
      const result = validatePlayerConfiguration(['Alice', '', 'Charlie'])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('All player names must be non-empty')
    })

    test('returns invalid for both bad count and names', () => {
      const result = validatePlayerConfiguration(['Alice', 'alice'])
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid player count: 2. Must be between 3 and 6 players.')
      expect(result.errors).toContain('Player names must be unique')
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

    test('only allows DEAL_CARDS during deal phase', () => {
      const action = { type: 'DEAL_CARDS' as const }
      
      expect(validatePhaseAction(GamePhase.DEAL, action)).toBe(true)
      expect(validatePhaseAction(GamePhase.BUYER_ASSIGNMENT, action)).toBe(false)
      expect(validatePhaseAction(GamePhase.OFFER_PHASE, action)).toBe(false)
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

  describe('dealCards', () => {
    test('deals cards to bring all hands to 5 cards', () => {
      const state = createInitialGameState()
      state.players = [
        { ...createPlayer(0, 'Alice'), hand: [createThingCard('giant', 0)] }, // needs 4 cards
        { ...createPlayer(1, 'Bob'), hand: [createThingCard('big', 0), createThingCard('big', 1)] }, // needs 3 cards
        { ...createPlayer(2, 'Charlie'), hand: [] } // needs 5 cards
      ]
      state.drawPile = Array.from({ length: 20 }, (_, i) => createThingCard('tiny', i))

      const newState = dealCards(state)

      expect(newState.players[0].hand).toHaveLength(5)
      expect(newState.players[1].hand).toHaveLength(5)
      expect(newState.players[2].hand).toHaveLength(5)
    })

    test('deals cards sequentially (one card per player per round)', () => {
      const state = createInitialGameState()
      state.players = [
        { ...createPlayer(0, 'Alice'), hand: [] },
        { ...createPlayer(1, 'Bob'), hand: [] }
      ]
      // Create identifiable cards to track dealing order
      state.drawPile = [
        createThingCard('giant', 0), // Should go to Alice (round 1)
        createThingCard('giant', 1), // Should go to Bob (round 1)
        createThingCard('giant', 2), // Should go to Alice (round 2)
        createThingCard('giant', 3), // Should go to Bob (round 2)
        createThingCard('big', 0),   // Should go to Alice (round 3)
        createThingCard('big', 1),   // Should go to Bob (round 3)
        createThingCard('big', 2),   // Should go to Alice (round 4)
        createThingCard('big', 3),   // Should go to Bob (round 4)
        createThingCard('big', 4),   // Should go to Alice (round 5)
        createThingCard('big', 5)    // Should go to Bob (round 5)
      ]

      const newState = dealCards(state)

      // Check that cards were dealt in the expected sequential order
      expect(newState.players[0].hand[0].id).toBe('giant-0') // Alice's first card
      expect(newState.players[1].hand[0].id).toBe('giant-1') // Bob's first card
      expect(newState.players[0].hand[1].id).toBe('giant-2') // Alice's second card
      expect(newState.players[1].hand[1].id).toBe('giant-3') // Bob's second card
    })

    test('handles draw pile exhaustion by reshuffling discard pile', () => {
      const state = createInitialGameState()
      state.players = [
        { ...createPlayer(0, 'Alice'), hand: [] },
        { ...createPlayer(1, 'Bob'), hand: [] }
      ]
      state.drawPile = [createThingCard('giant', 0)] // Only 1 card in draw pile
      state.discardPile = [
        createThingCard('big', 0),
        createThingCard('big', 1),
        createThingCard('big', 2),
        createThingCard('big', 3),
        createThingCard('big', 4),
        createThingCard('big', 5),
        createThingCard('big', 6),
        createThingCard('big', 7),
        createThingCard('big', 8)
      ] // 9 cards in discard pile

      const newState = dealCards(state)

      // Should have dealt all available cards
      expect(newState.players[0].hand).toHaveLength(5)
      expect(newState.players[1].hand).toHaveLength(5)
      
      // Discard pile should be empty after reshuffling
      expect(newState.discardPile).toHaveLength(0)
      
      // Draw pile should have remaining cards
      expect(newState.drawPile.length).toBe(0) // All 10 cards used (1 original + 9 from discard)
    })

    test('stops dealing when insufficient cards remain after reshuffling', () => {
      const state = createInitialGameState()
      state.players = [
        { ...createPlayer(0, 'Alice'), hand: [] },
        { ...createPlayer(1, 'Bob'), hand: [] }
      ]
      state.drawPile = [createThingCard('giant', 0)] // Only 1 card in draw pile
      state.discardPile = [createThingCard('big', 0)] // Only 1 card in discard pile

      const newState = dealCards(state)

      // Should have dealt only the available 2 cards
      const totalCardsDealt = newState.players[0].hand.length + newState.players[1].hand.length
      expect(totalCardsDealt).toBe(2)
      
      // Both piles should be empty
      expect(newState.drawPile).toHaveLength(0)
      expect(newState.discardPile).toHaveLength(0)
    })

    test('does not mutate original state', () => {
      const state = createInitialGameState()
      state.players = [{ ...createPlayer(0, 'Alice'), hand: [] }]
      state.drawPile = [createThingCard('giant', 0), createThingCard('big', 0)]
      
      const originalDrawPileLength = state.drawPile.length
      const originalHandLength = state.players[0].hand.length

      dealCards(state)

      // Original state should be unchanged
      expect(state.drawPile).toHaveLength(originalDrawPileLength)
      expect(state.players[0].hand).toHaveLength(originalHandLength)
    })
  })

  describe('handleDealPhase', () => {
    test('deals cards and advances phase when in deal phase', () => {
      const state = createInitialGameState()
      state.currentPhase = GamePhase.DEAL
      state.players = [
        { ...createPlayer(0, 'Alice'), hand: [] },
        { ...createPlayer(1, 'Bob'), hand: [] }
      ]
      state.drawPile = Array.from({ length: 20 }, (_, i) => createThingCard('tiny', i))

      const newState = handleDealPhase(state)

      // Should have dealt cards
      expect(newState.players[0].hand).toHaveLength(5)
      expect(newState.players[1].hand).toHaveLength(5)
      
      // Should have advanced to next phase
      expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE)
      expect(newState.phaseInstructions).toBe('Offer phase: Sellers place their 3-card offers...')
    })

    test('does nothing when not in deal phase', () => {
      const state = createInitialGameState()
      state.currentPhase = GamePhase.OFFER_PHASE
      state.players = [{ ...createPlayer(0, 'Alice'), hand: [] }]
      state.drawPile = [createThingCard('giant', 0)]

      const newState = handleDealPhase(state)

      // Should be unchanged
      expect(newState).toBe(state)
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
        expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE) // Should auto-advance through buyer assignment and deal
        expect(newState.round).toBe(1)
        expect(newState.drawPile).toHaveLength(105) // 120 - 15 cards dealt (3 players × 5 cards each)
        expect(newState.phaseInstructions).toBe('Offer phase: Sellers place their 3-card offers...')
        
        // All players should have 5 cards after automatic deal
        expect(newState.players[0].hand).toHaveLength(5)
        expect(newState.players[1].hand).toHaveLength(5)
        expect(newState.players[2].hand).toHaveLength(5)
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
        
        expect(() => gameReducer(initialState, actionTooFew)).toThrow('Invalid player configuration: Invalid player count: 2. Must be between 3 and 6 players.')
        expect(() => gameReducer(initialState, actionTooMany)).toThrow('Invalid player configuration: Invalid player count: 7. Must be between 3 and 6 players.')
      })

      test('throws error for invalid player names', () => {
        const actionEmptyName = { type: 'START_GAME' as const, players: ['Alice', '', 'Charlie'] }
        const actionDuplicateNames = { type: 'START_GAME' as const, players: ['Alice', 'Bob', 'alice'] }
        
        expect(() => gameReducer(initialState, actionEmptyName)).toThrow('Invalid player configuration: All player names must be non-empty')
        expect(() => gameReducer(initialState, actionDuplicateNames)).toThrow('Invalid player configuration: Player names must be unique')
      })

      test('trims whitespace from player names', () => {
        const action = { type: 'START_GAME' as const, players: ['  Alice  ', ' Bob ', 'Charlie   '] }
        const newState = gameReducer(initialState, action)
        
        expect(newState.players[0].name).toBe('Alice')
        expect(newState.players[1].name).toBe('Bob')
        expect(newState.players[2].name).toBe('Charlie')
      })

      test('creates shuffled deck', () => {
        const action = { type: 'START_GAME' as const, players: ['Alice', 'Bob', 'Charlie'] }
        const newState = gameReducer(initialState, action)
        
        // After automatic dealing, draw pile should have 105 cards (120 - 15 dealt)
        expect(newState.drawPile).toHaveLength(105)
        
        // Count all cards (draw pile + player hands)
        const allCards = [
          ...newState.drawPile,
          ...newState.players.flatMap(player => player.hand)
        ]
        
        // Verify total deck composition
        const thingCards = allCards.filter(card => card.type === 'thing')
        const gotchaCards = allCards.filter(card => card.type === 'gotcha')
        const actionCards = allCards.filter(card => card.type === 'action')
        
        expect(allCards).toHaveLength(120) // Total deck size
        expect(thingCards).toHaveLength(65)
        expect(gotchaCards).toHaveLength(32)
        expect(actionCards).toHaveLength(23)
      })
    })

    describe('RESET_GAME action', () => {
      test('resets game to initial state', () => {
        // First start a game
        const startAction = { type: 'START_GAME' as const, players: ['Alice', 'Bob', 'Charlie'] }
        const startedState = gameReducer(initialState, startAction)
        
        // Verify game is started
        expect(startedState.gameStarted).toBe(true)
        expect(startedState.players).toHaveLength(3)
        expect(startedState.currentPhase).toBe(GamePhase.OFFER_PHASE)
        
        // Reset the game
        const resetAction = { type: 'RESET_GAME' as const }
        const resetState = gameReducer(startedState, resetAction)
        
        // Verify game is reset to initial state
        expect(resetState.gameStarted).toBe(false)
        expect(resetState.players).toHaveLength(0)
        expect(resetState.currentPhase).toBe(GamePhase.BUYER_ASSIGNMENT)
        expect(resetState.round).toBe(1)
        expect(resetState.winner).toBeNull()
        expect(resetState.drawPile).toHaveLength(0)
        expect(resetState.discardPile).toHaveLength(0)
      })

      test('can reset game from any phase', () => {
        // Start a game and advance to different phase
        const startAction = { type: 'START_GAME' as const, players: ['Alice', 'Bob', 'Charlie'] }
        let gameState = gameReducer(initialState, startAction)
        
        // Advance to action phase (just as an example)
        gameState = { ...gameState, currentPhase: GamePhase.ACTION_PHASE }
        
        // Reset should work from any phase
        const resetAction = { type: 'RESET_GAME' as const }
        const resetState = gameReducer(gameState, resetAction)
        
        expect(resetState.gameStarted).toBe(false)
        expect(resetState.currentPhase).toBe(GamePhase.BUYER_ASSIGNMENT)
      })

      test('can reset game when winner is declared', () => {
        // Start a game
        const startAction = { type: 'START_GAME' as const, players: ['Alice', 'Bob', 'Charlie'] }
        let gameState = gameReducer(initialState, startAction)
        
        // Simulate a winner being declared
        gameState = { ...gameState, winner: 0 }
        
        // Reset should work even with winner declared
        const resetAction = { type: 'RESET_GAME' as const }
        const resetState = gameReducer(gameState, resetAction)
        
        expect(resetState.gameStarted).toBe(false)
        expect(resetState.winner).toBeNull()
      })
    })

    describe('ADVANCE_PHASE action', () => {
      test('advances through phases in correct order', () => {
        // This test verifies the basic phase order using the advanceToNextPhase function
        // It doesn't test the full game logic with auto-advancement
        const phases = [
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
        ]
        
        for (let i = 0; i < phases.length; i++) {
          const currentPhase = phases[i]
          const expectedNextPhase = phases[(i + 1) % phases.length]
          
          const result = advanceToNextPhase(currentPhase, 1)
          expect(result.nextPhase).toBe(expectedNextPhase)
        }
      })

      test('action phase auto-advances when no players have action cards', () => {
        let state = { ...initialState, currentPhase: GamePhase.BUYER_FLIP }
        
        // Add players to the state with no action cards
        state.players = [
          createPlayer(0, 'Alice'),
          createPlayer(1, 'Bob'),
          createPlayer(2, 'Charlie')
        ]
        state.currentBuyerIndex = 0
        
        // Advance from buyer-flip to action phase
        state = gameReducer(state, { type: 'ADVANCE_PHASE' })
        
        // Should auto-advance to offer selection since no players have action cards
        expect(state.currentPhase).toBe(GamePhase.OFFER_SELECTION)
      })

      test('automatically progresses through buyer assignment and deal phases in subsequent rounds', () => {
        // Start with a game in BUYER_ASSIGNMENT phase (simulating a subsequent round)
        let gameState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
        
        // Simulate end of round - go back to BUYER_ASSIGNMENT
        gameState = {
          ...gameState,
          currentPhase: GamePhase.BUYER_ASSIGNMENT,
          nextBuyerIndex: 1, // Bob will be the next buyer
          players: gameState.players.map((player, index) => ({
            ...player,
            hand: [], // Clear hands for new round
            hasMoney: index === 1 // Bob has the money bag
          }))
        }
        
        // Advance phase should automatically go through BUYER_ASSIGNMENT → DEAL → OFFER_PHASE
        const newState = gameReducer(gameState, { type: 'ADVANCE_PHASE' })
        
        expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE)
        expect(newState.currentBuyerIndex).toBe(1) // Bob should be the buyer
        
        // Cards should be dealt automatically
        newState.players.forEach(player => {
          expect(player.hand).toHaveLength(5)
        })
      })

      test('automatically progresses from offer distribution to Gotcha trade-ins', () => {
        // Set up a game state in OFFER_DISTRIBUTION phase
        let gameState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
        gameState.currentPhase = GamePhase.OFFER_DISTRIBUTION
        
        // Advance phase should automatically go through all administrative phases to OFFER_PHASE
        // OFFER_DISTRIBUTION → GOTCHA_TRADEINS → THING_TRADEINS → WINNER_DETERMINATION → BUYER_ASSIGNMENT → DEAL → OFFER_PHASE
        const newState = gameReducer(gameState, { type: 'ADVANCE_PHASE' })
        
        expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE)
      })

      test('increments round when returning to buyer assignment', () => {
        let state = { ...initialState, currentPhase: GamePhase.WINNER_DETERMINATION, round: 1 }
        state.players = [createPlayer(0, 'Alice'), createPlayer(1, 'Bob')]
        state.players[0].points = 3 // No winner
        state.players[1].points = 2
        
        state = gameReducer(state, { type: 'ADVANCE_PHASE' })
        
        // Should automatically progress through all administrative phases to OFFER_PHASE
        expect(state.currentPhase).toBe(GamePhase.OFFER_PHASE)
        expect(state.round).toBe(2)
      })

      test('updates phase instructions', () => {
        let state = { ...initialState, currentPhase: GamePhase.BUYER_ASSIGNMENT }
        
        state = gameReducer(state, { type: 'ADVANCE_PHASE' })
        
        // Should automatically progress through BUYER_ASSIGNMENT → DEAL → OFFER_PHASE
        expect(state.phaseInstructions).toBe('Offer phase: Sellers place their 3-card offers...')
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

    describe('DEAL_CARDS action', () => {
      test('deals cards and advances phase during deal phase', () => {
        const state = {
          ...initialState,
          currentPhase: GamePhase.DEAL,
          players: [
            { ...createPlayer(0, 'Alice'), hand: [] },
            { ...createPlayer(1, 'Bob'), hand: [] }
          ],
          drawPile: Array.from({ length: 20 }, (_, i) => createThingCard('tiny', i))
        }

        const newState = gameReducer(state, { type: 'DEAL_CARDS' })

        // Should have dealt cards
        expect(newState.players[0].hand).toHaveLength(5)
        expect(newState.players[1].hand).toHaveLength(5)
        
        // Should have advanced to next phase
        expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE)
        expect(newState.phaseInstructions).toBe('Offer phase: Sellers place their 3-card offers...')
      })

      test('throws error when not in deal phase', () => {
        const state = { ...initialState, currentPhase: GamePhase.OFFER_PHASE }
        
        expect(() => gameReducer(state, { type: 'DEAL_CARDS' })).toThrow('Action DEAL_CARDS is not allowed during phase offer_phase')
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
        // Create a state with players for testing PLACE_OFFER
        const playersState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
        const state = { ...playersState, currentPhase: GamePhase.OFFER_PHASE, currentBuyerIndex: 0 }
        
        // Place offer during offer phase should pass phase validation but may fail business logic validation
        const validAction = { type: 'PLACE_OFFER' as const, playerId: 1, cards: [], faceUpIndex: 0 }
        
        // This should not throw a phase validation error, but may throw business logic errors
        expect(() => gameReducer(state, validAction)).toThrow('Offer must contain exactly 3 cards')
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

    describe('PLACE_OFFER action', () => {
      let gameState: ReturnType<typeof createInitialGameState>

      beforeEach(() => {
        // Create a game state with 3 players in offer phase
        gameState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
        // The game should already be in OFFER_PHASE after automatic progression
        
        // Ensure Alice (player 0) is the buyer
        gameState.currentBuyerIndex = 0
        gameState.players[0].hasMoney = true
        gameState.players[1].hasMoney = false
        gameState.players[2].hasMoney = false
        
        // Reset player hands and give them specific test cards
        const testCards = [
          createThingCard('giant', 0),
          createThingCard('big', 0),
          createThingCard('medium', 0),
          createThingCard('tiny', 0),
          createThingCard('giant', 1),
          createThingCard('big', 1)
        ]
        
        // Clear existing hands and set specific test cards
        gameState.players[0].hand = [] // Alice (buyer) gets no cards for offers
        gameState.players[1].hand = testCards.slice(0, 3) // Bob gets 3 cards
        gameState.players[2].hand = testCards.slice(3, 6) // Charlie gets 3 cards
        
        // Ensure all offers are empty
        gameState.players[0].offer = []
        gameState.players[1].offer = []
        gameState.players[2].offer = []
      })

      test('successfully places offer with valid parameters', () => {
        const cards = gameState.players[1].hand // Bob's cards
        const action = { type: 'PLACE_OFFER' as const, playerId: 1, cards, faceUpIndex: 1 }
        
        const newState = gameReducer(gameState, action)
        
        // Bob should have offer placed
        expect(newState.players[1].offer).toHaveLength(3)
        expect(newState.players[1].offer[0].faceUp).toBe(false) // position 0 is face down
        expect(newState.players[1].offer[1].faceUp).toBe(true)  // position 1 is face up
        expect(newState.players[1].offer[2].faceUp).toBe(false) // position 2 is face down
        
        // Bob's hand should be empty
        expect(newState.players[1].hand).toHaveLength(0)
        
        // Phase should still be offer phase (not all sellers have offers yet)
        expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE)
      })

      test('automatically advances phase when all sellers complete offers', () => {
        // Place Bob's offer first
        const bobCards = gameState.players[1].hand
        let newState = gameReducer(gameState, { 
          type: 'PLACE_OFFER', 
          playerId: 1, 
          cards: bobCards, 
          faceUpIndex: 0 
        })
        
        // Phase should still be offer phase
        expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE)
        
        // Place Charlie's offer (last seller)
        const charlieCards = newState.players[2].hand
        newState = gameReducer(newState, { 
          type: 'PLACE_OFFER', 
          playerId: 2, 
          cards: charlieCards, 
          faceUpIndex: 2 
        })
        
        // Phase should now advance to buyer-flip phase
        expect(newState.currentPhase).toBe(GamePhase.BUYER_FLIP)
        expect(newState.phaseInstructions).toBe('Buyer-flip phase: Buyer flips one face-down card...')
      })

      test('throws error when buyer tries to place offer', () => {
        const buyerCards = [createThingCard('giant', 0), createThingCard('big', 0), createThingCard('medium', 0)]
        gameState.players[0].hand = buyerCards // Give buyer some cards
        
        const action = { type: 'PLACE_OFFER' as const, playerId: 0, cards: buyerCards, faceUpIndex: 0 }
        
        expect(() => gameReducer(gameState, action)).toThrow('Buyer cannot place offers')
      })

      test('throws error when player already has offer', () => {
        const cards = gameState.players[1].hand
        
        // Place first offer
        let newState = gameReducer(gameState, { 
          type: 'PLACE_OFFER', 
          playerId: 1, 
          cards, 
          faceUpIndex: 0 
        })
        
        // Try to place another offer
        const moreCards = [createThingCard('tiny', 1), createThingCard('tiny', 2), createThingCard('tiny', 3)]
        newState.players[1].hand = moreCards // Give Bob more cards
        
        expect(() => gameReducer(newState, { 
          type: 'PLACE_OFFER', 
          playerId: 1, 
          cards: moreCards, 
          faceUpIndex: 0 
        })).toThrow('Player already has an offer placed')
      })

      test('throws error for invalid card count', () => {
        const twoCards = gameState.players[1].hand.slice(0, 2)
        const fourCards = [...gameState.players[1].hand, createThingCard('tiny', 1)]
        
        expect(() => gameReducer(gameState, { 
          type: 'PLACE_OFFER', 
          playerId: 1, 
          cards: twoCards, 
          faceUpIndex: 0 
        })).toThrow('Offer must contain exactly 3 cards, got 2')
        
        expect(() => gameReducer(gameState, { 
          type: 'PLACE_OFFER', 
          playerId: 1, 
          cards: fourCards, 
          faceUpIndex: 0 
        })).toThrow('Offer must contain exactly 3 cards, got 4')
      })

      test('throws error for invalid face up index', () => {
        const cards = gameState.players[1].hand
        
        expect(() => gameReducer(gameState, { 
          type: 'PLACE_OFFER', 
          playerId: 1, 
          cards, 
          faceUpIndex: -1 
        })).toThrow('Face up index must be 0, 1, or 2, got -1')
        
        expect(() => gameReducer(gameState, { 
          type: 'PLACE_OFFER', 
          playerId: 1, 
          cards, 
          faceUpIndex: 3 
        })).toThrow('Face up index must be 0, 1, or 2, got 3')
      })

      test('throws error when cards are not in player hand', () => {
        const invalidCards = [
          createThingCard('giant', 99), // Not in hand
          createThingCard('big', 99),   // Not in hand
          createThingCard('medium', 99) // Not in hand
        ]
        
        expect(() => gameReducer(gameState, { 
          type: 'PLACE_OFFER', 
          playerId: 1, 
          cards: invalidCards, 
          faceUpIndex: 0 
        })).toThrow('Card Giant Thing is not in player\'s hand')
      })

      test('throws error for invalid player ID', () => {
        const cards = [createThingCard('giant', 0), createThingCard('big', 0), createThingCard('medium', 0)]
        
        expect(() => gameReducer(gameState, { 
          type: 'PLACE_OFFER', 
          playerId: -1, 
          cards, 
          faceUpIndex: 0 
        })).toThrow('Invalid player ID: -1')
        
        expect(() => gameReducer(gameState, { 
          type: 'PLACE_OFFER', 
          playerId: 10, 
          cards, 
          faceUpIndex: 0 
        })).toThrow('Invalid player ID: 10')
      })

      test('creates offer cards with correct positions and face states', () => {
        const cards = gameState.players[1].hand
        const action = { type: 'PLACE_OFFER' as const, playerId: 1, cards, faceUpIndex: 2 }
        
        const newState = gameReducer(gameState, action)
        const offer = newState.players[1].offer
        
        // Check positions
        expect(offer[0].position).toBe(0)
        expect(offer[1].position).toBe(1)
        expect(offer[2].position).toBe(2)
        
        // Check face up/down states
        expect(offer[0].faceUp).toBe(false)
        expect(offer[1].faceUp).toBe(false)
        expect(offer[2].faceUp).toBe(true) // faceUpIndex was 2
        
        // Check that offer cards have the same properties as original cards
        expect(offer[0].id).toBe(cards[0].id)
        expect(offer[1].id).toBe(cards[1].id)
        expect(offer[2].id).toBe(cards[2].id)
      })
    })

    describe('FLIP_CARD action', () => {
      let gameState: ReturnType<typeof createInitialGameState>

      beforeEach(() => {
        // Create a game state with 3 players in buyer-flip phase
        gameState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
        gameState = { ...gameState, currentPhase: GamePhase.BUYER_FLIP, currentBuyerIndex: 0 }
        
        // Give players some action cards so action phase doesn't auto-advance
        gameState.players[0].collection = [createActionCard('flip-one', 0)]
        gameState.players[1].collection = [createActionCard('add-one', 0)]
        gameState.players[2].collection = [createActionCard('remove-one', 0)]
        
        // Set up offers for sellers (Bob and Charlie)
        const testCards = [
          createThingCard('giant', 0),
          createThingCard('big', 0),
          createThingCard('medium', 0),
          createThingCard('tiny', 0),
          createThingCard('giant', 1),
          createThingCard('big', 1)
        ]
        
        // Bob's offer (player 1) - positions 0 and 2 are face down, position 1 is face up
        gameState.players[1].offer = [
          { ...testCards[0], faceUp: false, position: 0 },
          { ...testCards[1], faceUp: true, position: 1 },
          { ...testCards[2], faceUp: false, position: 2 }
        ]
        
        // Charlie's offer (player 2) - positions 0 and 1 are face down, position 2 is face up
        gameState.players[2].offer = [
          { ...testCards[3], faceUp: false, position: 0 },
          { ...testCards[4], faceUp: false, position: 1 },
          { ...testCards[5], faceUp: true, position: 2 }
        ]
      })

      test('successfully flips face down card to face up', () => {
        const action = { type: 'FLIP_CARD' as const, offerId: 1, cardIndex: 0 }
        
        const newState = gameReducer(gameState, action)
        
        // Card should now be face up
        expect(newState.players[1].offer[0].faceUp).toBe(true)
        
        // Other cards should remain unchanged
        expect(newState.players[1].offer[1].faceUp).toBe(true) // Was already face up
        expect(newState.players[1].offer[2].faceUp).toBe(false) // Should remain face down
        
        // Other player's offers should be unchanged
        expect(newState.players[2].offer[0].faceUp).toBe(false)
        expect(newState.players[2].offer[1].faceUp).toBe(false)
        expect(newState.players[2].offer[2].faceUp).toBe(true)
      })

      test('automatically advances to action phase after flip', () => {
        const action = { type: 'FLIP_CARD' as const, offerId: 1, cardIndex: 2 }
        
        const newState = gameReducer(gameState, action)
        
        expect(newState.currentPhase).toBe(GamePhase.ACTION_PHASE)
        expect(newState.phaseInstructions).toBe('Action phase: Players may play action cards...')
      })

      test('can flip card from different player offers', () => {
        // Flip card from Charlie's offer (player 2)
        const action = { type: 'FLIP_CARD' as const, offerId: 2, cardIndex: 1 }
        
        const newState = gameReducer(gameState, action)
        
        // Charlie's card should be flipped
        expect(newState.players[2].offer[1].faceUp).toBe(true)
        
        // Bob's offer should be unchanged
        expect(newState.players[1].offer[0].faceUp).toBe(false)
        expect(newState.players[1].offer[1].faceUp).toBe(true)
        expect(newState.players[1].offer[2].faceUp).toBe(false)
      })

      test('throws error when not in buyer-flip phase', () => {
        gameState.currentPhase = GamePhase.OFFER_PHASE
        
        const action = { type: 'FLIP_CARD' as const, offerId: 1, cardIndex: 0 }
        
        expect(() => gameReducer(gameState, action)).toThrow('Action FLIP_CARD is not allowed during phase offer_phase')
      })

      test('throws error for invalid offer ID', () => {
        const invalidOfferIds = [-1, 10]
        
        for (const offerId of invalidOfferIds) {
          const action = { type: 'FLIP_CARD' as const, offerId, cardIndex: 0 }
          
          expect(() => gameReducer(gameState, action)).toThrow(`Invalid offer ID: ${offerId}`)
        }
      })

      test('throws error when trying to flip buyer offer', () => {
        const action = { type: 'FLIP_CARD' as const, offerId: 0, cardIndex: 0 } // offerId 0 is the buyer
        
        expect(() => gameReducer(gameState, action)).toThrow('Cannot flip cards from buyer\'s offer (buyer has no offer)')
      })

      test('throws error when player has no offer', () => {
        // Remove Bob's offer
        gameState.players[1].offer = []
        
        const action = { type: 'FLIP_CARD' as const, offerId: 1, cardIndex: 0 }
        
        expect(() => gameReducer(gameState, action)).toThrow('Player has no offer to flip cards from')
      })

      test('throws error for invalid card index', () => {
        const invalidCardIndices = [-1, 3, 10]
        
        for (const cardIndex of invalidCardIndices) {
          const action = { type: 'FLIP_CARD' as const, offerId: 1, cardIndex }
          
          expect(() => gameReducer(gameState, action)).toThrow(`Invalid card index: ${cardIndex}`)
        }
      })

      test('throws error when trying to flip already face up card', () => {
        const action = { type: 'FLIP_CARD' as const, offerId: 1, cardIndex: 1 } // Position 1 is already face up
        
        expect(() => gameReducer(gameState, action)).toThrow('Cannot flip a card that is already face up')
      })

      test('does not mutate original state', () => {
        const originalOffer = [...gameState.players[1].offer]
        const action = { type: 'FLIP_CARD' as const, offerId: 1, cardIndex: 0 }
        
        gameReducer(gameState, action)
        
        // Original state should be unchanged
        expect(gameState.players[1].offer[0].faceUp).toBe(originalOffer[0].faceUp)
        expect(gameState.currentPhase).toBe(GamePhase.BUYER_FLIP)
      })
    })

    describe('PLAY_ACTION_CARD action', () => {
      let gameState: ReturnType<typeof createInitialGameState>

      beforeEach(() => {
        // Create a game state with 3 players in action phase
        gameState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
        gameState = { ...gameState, currentPhase: GamePhase.ACTION_PHASE, currentBuyerIndex: 0 }
        
        // Clear player hands for these tests (action card tests expect empty hands)
        gameState.players[0].hand = []
        gameState.players[1].hand = []
        gameState.players[2].hand = []
        
        // Give players some action cards in their collections
        const actionCards = [
          { id: 'add-one-0', type: 'action' as const, subtype: 'add-one', name: 'Add One', setSize: 1, effect: 'This card has an effect' },
          { id: 'remove-one-0', type: 'action' as const, subtype: 'remove-one', name: 'Remove One', setSize: 1, effect: 'This card has an effect' },
          { id: 'flip-one-0', type: 'action' as const, subtype: 'flip-one', name: 'Flip One', setSize: 1, effect: 'This card has an effect' },
          { id: 'steal-point-0', type: 'action' as const, subtype: 'steal-point', name: 'Steal A Point', setSize: 1, effect: 'This card has an effect' }
        ]
        
        gameState.players[0].collection = [actionCards[0]] // Alice has Add One
        gameState.players[1].collection = [actionCards[1], actionCards[2]] // Bob has Remove One and Flip One
        gameState.players[2].collection = [actionCards[3]] // Charlie has Steal A Point
        
        // Add some cards to draw pile for Add One effect
        gameState.drawPile = [
          { id: 'giant-0', type: 'thing' as const, subtype: 'giant', name: 'Giant Thing', setSize: 1 },
          { id: 'big-0', type: 'thing' as const, subtype: 'big', name: 'Big Thing', setSize: 2 }
        ]
      })

      test('successfully plays action card from collection', () => {
        const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
        
        const newState = gameReducer(gameState, action)
        
        // Action card should be removed from collection
        expect(newState.players[0].collection).toHaveLength(0)
        
        // Action card should be added to discard pile
        expect(newState.discardPile).toHaveLength(1)
        expect(newState.discardPile[0].id).toBe('add-one-0')
      })

      test('executes Add One effect immediately', () => {
        const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
        
        const newState = gameReducer(gameState, action)
        
        // Add One should set up effect state for hand card selection
        expect(newState.addOneEffectState).not.toBeNull()
        expect(newState.addOneEffectState?.playerId).toBe(0)
        expect(newState.addOneEffectState?.awaitingHandCardSelection).toBe(true)
        expect(newState.addOneEffectState?.awaitingOfferSelection).toBe(false)
        
        // Player's hand should remain unchanged (no card drawn)
        expect(newState.players[0].hand).toHaveLength(0)
        
        // Draw pile should remain unchanged
        expect(newState.drawPile).toHaveLength(2)
      })

      test('handles Add One effect when draw pile is empty', () => {
        // Empty draw pile but add cards to discard pile
        gameState.drawPile = []
        gameState.discardPile = [
          { id: 'medium-0', type: 'thing' as const, subtype: 'medium', name: 'Medium Thing', setSize: 3 },
          { id: 'tiny-0', type: 'thing' as const, subtype: 'tiny', name: 'Tiny Thing', setSize: 4 }
        ]
        
        const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
        
        const newState = gameReducer(gameState, action)
        
        // Add One should set up effect state regardless of draw pile status
        expect(newState.addOneEffectState).not.toBeNull()
        expect(newState.addOneEffectState?.playerId).toBe(0)
        expect(newState.addOneEffectState?.awaitingHandCardSelection).toBe(true)
        
        // Player's hand should remain unchanged (no card drawn)
        expect(newState.players[0].hand).toHaveLength(0)
        
        // Discard pile should contain the played action card
        expect(newState.discardPile).toHaveLength(3)
        expect(newState.discardPile[2].id).toBe('add-one-0')
      })

      test('handles Add One effect when no cards available', () => {
        // Empty both piles (not relevant for Add One anymore, but test still valid)
        gameState.drawPile = []
        gameState.discardPile = []
        
        const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
        
        const newState = gameReducer(gameState, action)
        
        // Add One should still set up effect state regardless of draw pile status
        expect(newState.addOneEffectState).not.toBeNull()
        expect(newState.addOneEffectState?.playerId).toBe(0)
        expect(newState.addOneEffectState?.awaitingHandCardSelection).toBe(true)
        
        // Player should not have any cards in hand (unchanged)
        expect(newState.players[0].hand).toHaveLength(0)
        
        // Action card should still be discarded
        expect(newState.discardPile).toHaveLength(1)
        expect(newState.discardPile[0].id).toBe('add-one-0')
      })

      test('allows multiple action card plays from same player', () => {
        // Play first action card
        let newState = gameReducer(gameState, { 
          type: 'PLAY_ACTION_CARD', 
          playerId: 1, 
          cardId: 'remove-one-0' 
        })
        
        // Bob should have one action card left
        expect(newState.players[1].collection).toHaveLength(1)
        expect(newState.players[1].collection[0].id).toBe('flip-one-0')
        
        // Play second action card
        newState = gameReducer(newState, { 
          type: 'PLAY_ACTION_CARD', 
          playerId: 1, 
          cardId: 'flip-one-0' 
        })
        
        // Bob should have no action cards left
        expect(newState.players[1].collection).toHaveLength(0)
        
        // Both cards should be in discard pile
        expect(newState.discardPile).toHaveLength(2)
        expect(newState.discardPile.map(card => card.id)).toContain('remove-one-0')
        expect(newState.discardPile.map(card => card.id)).toContain('flip-one-0')
      })

      test('throws error when not in action phase', () => {
        gameState.currentPhase = GamePhase.OFFER_PHASE
        
        const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
        
        expect(() => gameReducer(gameState, action)).toThrow('Action PLAY_ACTION_CARD is not allowed during phase offer_phase')
      })

      test('throws error for invalid player ID', () => {
        const invalidPlayerIds = [-1, 10]
        
        for (const playerId of invalidPlayerIds) {
          const action = { type: 'PLAY_ACTION_CARD' as const, playerId, cardId: 'add-one-0' }
          
          expect(() => gameReducer(gameState, action)).toThrow(`Invalid player ID: ${playerId}`)
        }
      })

      test('throws error when action card not found in collection', () => {
        const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'nonexistent-card' }
        
        expect(() => gameReducer(gameState, action)).toThrow('Action card with ID nonexistent-card not found in player\'s collection')
      })

      test('throws error when trying to play non-action card', () => {
        // Add a thing card to collection
        gameState.players[0].collection.push({
          id: 'giant-1',
          type: 'thing',
          subtype: 'giant',
          name: 'Giant Thing',
          setSize: 1
        })
        
        const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'giant-1' }
        
        expect(() => gameReducer(gameState, action)).toThrow('Action card with ID giant-1 not found in player\'s collection')
      })

      test('executes different action card effects', () => {
        // Test Flip One effect (should not change state immediately)
        const flipAction = { type: 'PLAY_ACTION_CARD' as const, playerId: 1, cardId: 'flip-one-0' }
        const flipState = gameReducer(gameState, flipAction)
        
        // Card should be removed and discarded
        expect(flipState.players[1].collection.find(card => card.id === 'flip-one-0')).toBeUndefined()
        expect(flipState.discardPile.find(card => card.id === 'flip-one-0')).toBeDefined()
        
        // Test Remove One effect (should not change state immediately)
        const removeAction = { type: 'PLAY_ACTION_CARD' as const, playerId: 1, cardId: 'remove-one-0' }
        const removeState = gameReducer(gameState, removeAction)
        
        // Card should be removed and discarded
        expect(removeState.players[1].collection.find(card => card.id === 'remove-one-0')).toBeUndefined()
        expect(removeState.discardPile.find(card => card.id === 'remove-one-0')).toBeDefined()
        
        // Test Steal A Point effect (should not change state immediately)
        const stealAction = { type: 'PLAY_ACTION_CARD' as const, playerId: 2, cardId: 'steal-point-0' }
        const stealState = gameReducer(gameState, stealAction)
        
        // Card should be removed and discarded
        expect(stealState.players[2].collection.find(card => card.id === 'steal-point-0')).toBeUndefined()
        expect(stealState.discardPile.find(card => card.id === 'steal-point-0')).toBeDefined()
      })

      test('does not mutate original state', () => {
        const originalCollection = [...gameState.players[0].collection]
        const originalDiscardPile = [...gameState.discardPile]
        const action = { type: 'PLAY_ACTION_CARD' as const, playerId: 0, cardId: 'add-one-0' }
        
        gameReducer(gameState, action)
        
        // Original state should be unchanged
        expect(gameState.players[0].collection).toEqual(originalCollection)
        expect(gameState.discardPile).toEqual(originalDiscardPile)
      })
    })

    describe('SELECT_OFFER action', () => {
      let gameState: ReturnType<typeof createInitialGameState>

      beforeEach(() => {
        // Create a game state with 3 players in offer selection phase
        gameState = gameReducer(initialState, { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
        gameState = { ...gameState, currentPhase: GamePhase.OFFER_SELECTION, currentBuyerIndex: 0 }
        
        // Set up offers for sellers (Bob and Charlie)
        const testCards = [
          createThingCard('giant', 0),
          createThingCard('big', 0),
          createThingCard('medium', 0),
          createThingCard('tiny', 0),
          createThingCard('giant', 1),
          createThingCard('big', 1)
        ]
        
        // Bob's offer (player 1)
        gameState.players[1].offer = [
          { ...testCards[0], faceUp: true, position: 0 },
          { ...testCards[1], faceUp: false, position: 1 },
          { ...testCards[2], faceUp: true, position: 2 }
        ]
        
        // Charlie's offer (player 2)
        gameState.players[2].offer = [
          { ...testCards[3], faceUp: false, position: 0 },
          { ...testCards[4], faceUp: true, position: 1 },
          { ...testCards[5], faceUp: false, position: 2 }
        ]
        
        // Alice (buyer) has money bag
        gameState.players[0].hasMoney = true
        gameState.players[1].hasMoney = false
        gameState.players[2].hasMoney = false
      })

      test('successfully selects offer and transfers money bag', () => {
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 1 }
        
        const newState = gameReducer(gameState, action)
        
        // Money bag should transfer from buyer to selected seller
        expect(newState.players[0].hasMoney).toBe(false) // Alice (buyer) loses money
        expect(newState.players[1].hasMoney).toBe(true)  // Bob (selected seller) gets money
        expect(newState.players[2].hasMoney).toBe(false) // Charlie (non-selected seller) no money
        
        // Due to automatic phase progression, buyer role should now be transferred to Bob
        expect(newState.currentBuyerIndex).toBe(1) // Bob is now the buyer
        
        // Next buyer index should be set to selected seller (money bag holder)
        expect(newState.nextBuyerIndex).toBe(1)
        
        // Should automatically progress to OFFER_PHASE for next round
        expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE)
      })

      test('moves selected offer to buyer collection', () => {
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 1 }
        
        const newState = gameReducer(gameState, action)
        
        // Due to automatic phase progression, cards are dealt to all players
        // Alice (original buyer) should have the selected offer in collection plus dealt cards
        const aliceCollection = newState.players[0].collection
        expect(aliceCollection.length).toBeGreaterThan(0) // Should have cards from offer and dealing
        
        // The giant-0 card forms a complete set (setSize 1) and gets automatically traded in for points
        // So we should only expect to find big-0 and medium-0 in the collection
        const expectedCardIds = ['big-0', 'medium-0'] // giant-0 was traded in for 1 point
        const hasExpectedCards = expectedCardIds.every(cardId => 
          aliceCollection.some(card => card.id === cardId)
        )
        expect(hasExpectedCards).toBe(true)
        
        // Alice should have gained 1 point from the giant-0 card that was traded in
        expect(newState.players[0].points).toBe(1)
        
        // Selected seller should have empty offer
        expect(newState.players[1].offer).toHaveLength(0)
      })

      test('returns non-selected offers to sellers collections', () => {
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 1 }
        
        const newState = gameReducer(gameState, action)
        
        // Due to automatic phase progression, cards are dealt to all players
        // Non-selected seller (Charlie) should have offer returned to collection plus dealt cards
        const charlieCollection = newState.players[2].collection
        expect(charlieCollection.length).toBeGreaterThan(0) // Should have cards from offer and dealing
        
        // The giant-1 card forms a complete set (setSize 1) and gets automatically traded in for points
        // So we should only expect to find tiny-0 and big-1 in the collection
        const expectedCardIds = ['tiny-0', 'big-1'] // giant-1 was traded in for 1 point
        const hasExpectedCards = expectedCardIds.every(cardId => 
          charlieCollection.some(card => card.id === cardId)
        )
        expect(hasExpectedCards).toBe(true)
        
        // Charlie should have gained 1 point from the giant-1 card that was traded in
        expect(newState.players[2].points).toBe(1)
        
        // Non-selected seller should have empty offer
        expect(newState.players[2].offer).toHaveLength(0)
      })

      test('clears all offer areas after selection', () => {
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 2 }
        
        const newState = gameReducer(gameState, action)
        
        // All players should have empty offers
        expect(newState.players[0].offer).toHaveLength(0) // Buyer (no offer anyway)
        expect(newState.players[1].offer).toHaveLength(0) // Non-selected seller
        expect(newState.players[2].offer).toHaveLength(0) // Selected seller
      })

      test('automatically progresses through offer distribution to Gotcha trade-ins', () => {
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 1 }
        
        const newState = gameReducer(gameState, action)
        
        // Should automatically progress through all administrative phases to OFFER_PHASE
        // OFFER_DISTRIBUTION → GOTCHA_TRADEINS → THING_TRADEINS → WINNER_DETERMINATION → BUYER_ASSIGNMENT → DEAL → OFFER_PHASE
        expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE)
        expect(newState.nextBuyerIndex).toBe(1) // Bob should get the money bag for next round
      })

      test('can select different sellers', () => {
        // Select Charlie instead of Bob
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 2 }
        
        const newState = gameReducer(gameState, action)
        
        // Money bag should go to Charlie
        expect(newState.players[0].hasMoney).toBe(false) // Alice loses money
        expect(newState.players[1].hasMoney).toBe(false) // Bob gets nothing
        expect(newState.players[2].hasMoney).toBe(true)  // Charlie gets money
        
        // Due to automatic phase progression, Alice should have Charlie's offer plus dealt cards
        // The giant-1 card forms a complete set and gets traded in for points
        const aliceCollection = newState.players[0].collection
        const expectedAliceCards = ['tiny-0', 'big-1'] // giant-1 was traded in for 1 point
        const hasExpectedAliceCards = expectedAliceCards.every(cardId => 
          aliceCollection.some(card => card.id === cardId)
        )
        expect(hasExpectedAliceCards).toBe(true)
        
        // Alice should have gained 1 point from the giant-1 card that was traded in
        expect(newState.players[0].points).toBe(1)
        
        // Due to automatic phase progression, Bob should have his offer returned plus dealt cards
        // The giant-0 card forms a complete set and gets traded in for points
        const bobCollection = newState.players[1].collection
        const expectedBobCards = ['big-0', 'medium-0'] // giant-0 was traded in for 1 point
        const hasExpectedBobCards = expectedBobCards.every(cardId => 
          bobCollection.some(card => card.id === cardId)
        )
        expect(hasExpectedBobCards).toBe(true)
        
        // Bob should have gained 1 point from the giant-0 card that was traded in
        expect(newState.players[1].points).toBe(1)
        
        // Current buyer should now be Charlie (money bag holder) due to automatic progression
        expect(newState.currentBuyerIndex).toBe(2)
        
        // Next buyer should be Charlie (money bag holder)
        expect(newState.nextBuyerIndex).toBe(2)
      })

      test('throws error when not in offer selection phase', () => {
        gameState.currentPhase = GamePhase.ACTION_PHASE
        
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 1 }
        
        expect(() => gameReducer(gameState, action)).toThrow('Action SELECT_OFFER is not allowed during phase action_phase')
      })

      test('throws error for invalid buyer ID', () => {
        const invalidBuyerIds = [-1, 10]
        
        for (const buyerId of invalidBuyerIds) {
          const action = { type: 'SELECT_OFFER' as const, buyerId, sellerId: 1 }
          
          expect(() => gameReducer(gameState, action)).toThrow(`Invalid buyer ID: ${buyerId}`)
        }
      })

      test('throws error when non-buyer tries to select offer', () => {
        const action = { type: 'SELECT_OFFER' as const, buyerId: 1, sellerId: 2 } // Bob tries to select
        
        expect(() => gameReducer(gameState, action)).toThrow('Only the current buyer can select offers')
      })

      test('throws error for invalid seller ID', () => {
        const invalidSellerIds = [-1, 10]
        
        for (const sellerId of invalidSellerIds) {
          const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId }
          
          expect(() => gameReducer(gameState, action)).toThrow(`Invalid seller ID: ${sellerId}`)
        }
      })

      test('throws error when buyer tries to select their own offer', () => {
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 0 }
        
        expect(() => gameReducer(gameState, action)).toThrow('Buyer cannot select their own offer (buyer has no offer)')
      })

      test('throws error when selected seller has no offer', () => {
        // Remove Bob's offer
        gameState.players[1].offer = []
        
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 1 }
        
        expect(() => gameReducer(gameState, action)).toThrow('Selected seller has no offer to select')
      })

      test('preserves card properties when moving to collections', () => {
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 1 }
        
        const newState = gameReducer(gameState, action)
        
        // Due to automatic phase progression, cards are dealt to all players
        // Check that the selected offer cards are in Alice's collection with proper properties
        // Note: giant-0 was traded in for points, so we check the remaining cards
        const buyerCards = newState.players[0].collection
        const bigCard = buyerCards.find(card => card.id === 'big-0')
        expect(bigCard).toBeDefined()
        expect(bigCard).toEqual({
          id: 'big-0',
          type: 'thing',
          subtype: 'big',
          name: 'Big Thing',
          setSize: 2,
          effect: undefined
        })
        
        // Check non-selected seller's returned cards
        // Note: giant-1 was traded in for points, so we check the remaining cards
        const charlieCards = newState.players[2].collection
        const tinyCard = charlieCards.find(card => card.id === 'tiny-0')
        expect(tinyCard).toBeDefined()
        expect(tinyCard).toEqual({
          id: 'tiny-0',
          type: 'thing',
          subtype: 'tiny',
          name: 'Tiny Thing',
          setSize: 4,
          effect: undefined
        })
      })

      test('does not mutate original state', () => {
        const originalBuyerCollection = [...gameState.players[0].collection]
        const originalBuyerMoney = gameState.players[0].hasMoney
        const originalSellerOffer = [...gameState.players[1].offer]
        const originalCurrentBuyer = gameState.currentBuyerIndex
        const originalPhase = gameState.currentPhase
        
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 1 }
        
        gameReducer(gameState, action)
        
        // Original state should be unchanged
        expect(gameState.players[0].collection).toEqual(originalBuyerCollection)
        expect(gameState.players[0].hasMoney).toBe(originalBuyerMoney)
        expect(gameState.players[1].offer).toEqual(originalSellerOffer)
        expect(gameState.currentBuyerIndex).toBe(originalCurrentBuyer)
        expect(gameState.currentPhase).toBe(originalPhase)
      })
    })
  })

  describe('Buyer Role Continuity', () => {
    describe('SELECT_OFFER action', () => {
      test('transfers money bag but maintains buyer role until next round', () => {
        // Create a game state with 3 players in offer selection phase
        let gameState = gameReducer(createInitialGameState(), { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
        gameState = { ...gameState, currentPhase: GamePhase.OFFER_SELECTION, currentBuyerIndex: 0 }
        
        // Ensure Alice (buyer) has the money bag initially
        gameState.players[0].hasMoney = true
        gameState.players[1].hasMoney = false
        gameState.players[2].hasMoney = false
        
        // Set up offers for sellers (Bob and Charlie)
        gameState.players[1].offer = [
          { id: 'giant-0', type: 'thing' as const, subtype: 'Giant', name: 'Giant Thing', setSize: 1, faceUp: true, position: 0 },
          { id: 'big-0', type: 'thing' as const, subtype: 'Big', name: 'Big Thing', setSize: 2, faceUp: false, position: 1 },
          { id: 'medium-0', type: 'thing' as const, subtype: 'Medium', name: 'Medium Thing', setSize: 3, faceUp: false, position: 2 }
        ]
        
        gameState.players[2].offer = [
          { id: 'tiny-0', type: 'thing' as const, subtype: 'Tiny', name: 'Tiny Thing', setSize: 4, faceUp: false, position: 0 },
          { id: 'giant-1', type: 'thing' as const, subtype: 'Giant', name: 'Giant Thing', setSize: 1, faceUp: true, position: 1 },
          { id: 'big-1', type: 'thing' as const, subtype: 'Big', name: 'Big Thing', setSize: 2, faceUp: false, position: 2 }
        ]
        
        // Alice (buyer) selects Bob's offer
        const action = { type: 'SELECT_OFFER' as const, buyerId: 0, sellerId: 1 }
        
        const newState = gameReducer(gameState, action)
        
        // Money bag should transfer from Alice to Bob
        expect(newState.players[0].hasMoney).toBe(false) // Alice loses money bag
        expect(newState.players[1].hasMoney).toBe(true)  // Bob gets money bag
        expect(newState.players[2].hasMoney).toBe(false) // Charlie has no money bag
        
        // Current buyer should now be Bob (money bag holder) due to automatic progression
        expect(newState.currentBuyerIndex).toBe(1)
        
        // Next buyer should be Bob (money bag holder)
        expect(newState.nextBuyerIndex).toBe(1)
      })
    })

    describe('BUYER_ASSIGNMENT phase', () => {
      test('transfers buyer role to money bag holder', () => {
        // Create a state where Bob has the money bag but Alice is still the buyer
        let gameState = gameReducer(createInitialGameState(), { type: 'START_GAME', players: ['Alice', 'Bob', 'Charlie'] })
        gameState = { 
          ...gameState, 
          currentPhase: GamePhase.BUYER_ASSIGNMENT,
          currentBuyerIndex: 0, // Alice is current buyer
          nextBuyerIndex: 1     // Bob will be next buyer (has money bag)
        }
        
        // Set money bag correctly
        gameState.players[0].hasMoney = false // Alice doesn't have money bag
        gameState.players[1].hasMoney = true  // Bob has money bag
        gameState.players[2].hasMoney = false // Charlie doesn't have money bag
        
        // Advance through buyer assignment phase
        const newState = gameReducer(gameState, { type: 'ADVANCE_PHASE' })
        
        // Buyer role should transfer to Bob (money bag holder)
        expect(newState.currentBuyerIndex).toBe(1)
        expect(newState.nextBuyerIndex).toBe(1) // Should remain the same
        
        // Phase should automatically advance through BUYER_ASSIGNMENT → DEAL → OFFER_PHASE
        expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE)
      })
    })
  })

  describe('getPlayersWithFiveOrMorePoints', () => {
    test('returns empty array when no players have 5+ points', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 3
      players[1].points = 4
      players[2].points = 2

      const result = getPlayersWithFiveOrMorePoints(players)
      expect(result).toEqual([])
    })

    test('returns players with exactly 5 points', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 5
      players[1].points = 3
      players[2].points = 4

      const result = getPlayersWithFiveOrMorePoints(players)
      expect(result).toEqual([players[0]])
    })

    test('returns players with more than 5 points', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 7
      players[1].points = 3
      players[2].points = 6

      const result = getPlayersWithFiveOrMorePoints(players)
      expect(result).toEqual([players[0], players[2]])
    })

    test('returns all players when all have 5+ points', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 5
      players[1].points = 6
      players[2].points = 8

      const result = getPlayersWithFiveOrMorePoints(players)
      expect(result).toEqual(players)
    })
  })

  describe('determineWinner', () => {
    test('returns null when no players have 5+ points', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 4
      players[1].points = 3
      players[2].points = 2

      const result = determineWinner(players)
      expect(result).toBeNull()
    })

    test('returns winner when one player has 5+ points and leads', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 6
      players[1].points = 3
      players[2].points = 4

      const result = determineWinner(players)
      expect(result).toBe(0)
    })

    test('returns null when multiple players are tied for most points', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 5
      players[1].points = 5
      players[2].points = 3

      const result = determineWinner(players)
      expect(result).toBeNull()
    })

    test('returns null when tied players both have 5+ points', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 6
      players[1].points = 6
      players[2].points = 3

      const result = determineWinner(players)
      expect(result).toBeNull()
    })

    test('returns winner with highest points when multiple have 5+', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 5
      players[1].points = 7
      players[2].points = 6

      const result = determineWinner(players)
      expect(result).toBe(1)
    })

    test('returns null when highest scorer has less than 5 points', () => {
      const players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      players[0].points = 2
      players[1].points = 4
      players[2].points = 3

      const result = determineWinner(players)
      expect(result).toBeNull()
    })
  })

  describe('handleWinnerDeterminationPhase', () => {
    test('declares winner when one player has 5+ points and leads', () => {
      const state = createInitialGameState()
      state.currentPhase = GamePhase.WINNER_DETERMINATION
      state.players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      state.players[0].points = 6
      state.players[1].points = 3
      state.players[2].points = 4

      const result = handleWinnerDeterminationPhase(state)
      
      expect(result.winner).toBe(0)
      expect(result.phaseInstructions).toBe('Game Over! Alice wins with 6 points!')
    })

    test('continues game when no clear winner', () => {
      const state = createInitialGameState()
      state.currentPhase = GamePhase.WINNER_DETERMINATION
      state.round = 2
      state.players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      state.players[0].points = 4
      state.players[1].points = 3
      state.players[2].points = 2

      const result = handleWinnerDeterminationPhase(state)
      
      expect(result.winner).toBeNull()
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE)
      expect(result.round).toBe(3)
    })

    test('continues game when players are tied', () => {
      const state = createInitialGameState()
      state.currentPhase = GamePhase.WINNER_DETERMINATION
      state.round = 3
      state.players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob'),
        createPlayer(2, 'Charlie')
      ]
      state.players[0].points = 5
      state.players[1].points = 5
      state.players[2].points = 3

      const result = handleWinnerDeterminationPhase(state)
      
      expect(result.winner).toBeNull()
      expect(result.currentPhase).toBe(GamePhase.OFFER_PHASE)
      expect(result.round).toBe(4)
    })

    test('does nothing when not in winner determination phase', () => {
      const state = createInitialGameState()
      state.currentPhase = GamePhase.DEAL
      state.players = [
        createPlayer(0, 'Alice'),
        createPlayer(1, 'Bob')
      ]
      state.players[0].points = 6

      const result = handleWinnerDeterminationPhase(state)
      
      expect(result).toBe(state)
    })
  })

  describe('game over prevention', () => {
    test('prevents actions after winner is declared', () => {
      const state = createInitialGameState()
      state.winner = 0
      state.gameStarted = true
      state.players = [createPlayer(0, 'Alice'), createPlayer(1, 'Bob')]

      // Try to advance phase - should be prevented
      const result = gameReducer(state, { type: 'ADVANCE_PHASE' })
      expect(result).toBe(state)
    })

    test('allows perspective changes after winner is declared', () => {
      const state = createInitialGameState()
      state.winner = 0
      state.gameStarted = true
      state.players = [createPlayer(0, 'Alice'), createPlayer(1, 'Bob')]
      state.selectedPerspective = 0

      // Perspective changes should still work
      const result = gameReducer(state, { type: 'CHANGE_PERSPECTIVE', playerId: 1 })
      expect(result.selectedPerspective).toBe(1)
    })

    test('prevents game actions after winner is declared', () => {
      const state = createInitialGameState()
      state.winner = 0
      state.gameStarted = true
      state.currentPhase = GamePhase.DEAL
      state.players = [createPlayer(0, 'Alice'), createPlayer(1, 'Bob')]

      // Try to deal cards - should be prevented
      const result = gameReducer(state, { type: 'DEAL_CARDS' })
      expect(result).toBe(state)
    })
  })
})