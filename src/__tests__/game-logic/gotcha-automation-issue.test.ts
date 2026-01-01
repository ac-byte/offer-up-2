import { gameReducer, createInitialGameState, createPlayer } from '../../game-logic/gameReducer'
import { GameState, GamePhase, Player, Card } from '../../types'

describe('Gotcha Trade-ins Automation Issue', () => {
  const createMockPlayer = (id: number, collection: Card[], points: number = 0): Player => ({
    id,
    name: `Player ${id}`,
    hand: [],
    offer: [],
    collection,
    points,
    hasMoney: false
  })

  const createMockGameState = (players: Player[], currentPhase: GamePhase = GamePhase.GOTCHA_TRADEINS): GameState => ({
    players,
    currentBuyerIndex: 1, // Player 2 is buyer
    nextBuyerIndex: 1,
    currentPhase,
    currentPlayerIndex: 0,
    round: 1,
    drawPile: Array.from({ length: 20 }, (_, i) => ({
      id: `card-${i}`,
      type: 'thing' as const,
      subtype: 'medium' as const,
      name: `Test Card ${i}`,
      setSize: 3
    })),
    discardPile: [],
    actionPhaseDoneStates: [],
    gotchaEffectState: null,
    flipOneEffectState: null,
    addOneEffectState: null,
    removeOneEffectState: null,
    removeTwoEffectState: null,
    stealAPointEffectState: null,
    selectedPerspective: 0,
    phaseInstructions: '',
    autoFollowPerspective: true,
    winner: null,
    gameStarted: true
  })

  it('should automatically progress through all administrative phases when only Gotcha Bad sets exist', () => {
    // Create a player with only Gotcha Bad sets (no buyer interaction needed)
    const player1Collection: Card[] = [
      { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
      { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
      { id: 'gotcha-bad-3', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' }
    ]

    const player1 = createMockPlayer(0, player1Collection, 2) // Give points so Gotcha Bad can take effect
    const player2 = createMockPlayer(1, [], 0) // Buyer
    const state = createMockGameState([player1, player2])

    // Advance phase to trigger Gotcha processing
    const action = { type: 'ADVANCE_PHASE' as const }
    const newState = gameReducer(state, action)

    // Should automatically progress through all administrative phases to OFFER_PHASE
    // GOTCHA_TRADEINS -> THING_TRADEINS -> WINNER_DETERMINATION -> BUYER_ASSIGNMENT -> DEAL -> OFFER_PHASE
    expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE)
    expect(newState.gotchaEffectState).toBeNull()
    expect(newState.players[0].collection).toHaveLength(0) // Gotcha Bad set removed
    expect(newState.players[0].points).toBe(1) // Lost 1 point
    expect(newState.players[1].points).toBe(1) // Buyer gained 1 point
    expect(newState.winner).toBeNull() // No winner yet (not enough points)
    
    // Should have dealt cards to all players
    expect(newState.players[0].hand.length).toBe(5)
    expect(newState.players[1].hand.length).toBe(5)
  })

  it('should stay in GOTCHA_TRADEINS when buyer interaction is needed (Gotcha Once/Twice)', () => {
    // Create a player with Gotcha Once set (requires buyer interaction)
    const player1Collection: Card[] = [
      { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' },
      { id: 'gotcha-once-2', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' },
      { id: 'thing-giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 } // Target for Gotcha effect
    ]

    const player1 = createMockPlayer(0, player1Collection, 0)
    const player2 = createMockPlayer(1, [], 0) // Buyer
    const state = createMockGameState([player1, player2])

    // Advance phase to trigger Gotcha processing
    const action = { type: 'ADVANCE_PHASE' as const }
    const newState = gameReducer(state, action)

    // Should stay in GOTCHA_TRADEINS with pending effect
    expect(newState.currentPhase).toBe(GamePhase.GOTCHA_TRADEINS)
    expect(newState.gotchaEffectState).not.toBeNull()
    expect(newState.gotchaEffectState?.type).toBe('once')
  })

  it('should progress through phases and declare winner when player gets enough points', () => {
    // Create a player with Gotcha Bad sets and Thing sets that will give enough points to win
    const player1Collection: Card[] = [
      { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
      { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
      { id: 'gotcha-bad-3', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
      // Add Thing sets that will give enough points to win
      { id: 'giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
      { id: 'giant-2', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
      { id: 'giant-3', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
      { id: 'giant-4', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
      { id: 'giant-5', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
    ]

    const player1 = createMockPlayer(0, player1Collection, 1) // Start with 1 point
    const player2 = createMockPlayer(1, [], 0) // Buyer
    const state = createMockGameState([player1, player2])

    // Advance phase to trigger Gotcha processing
    const action = { type: 'ADVANCE_PHASE' as const }
    const newState = gameReducer(state, action)

    // Should process Gotcha Bad (lose 1 point), then Thing sets (gain 5 points), then declare winner
    // Final points: 1 - 1 + 5 = 5 points (enough to win)
    expect(newState.winner).toBe(0) // Player 1 should win
    expect(newState.currentPhase).toBe(GamePhase.WINNER_DETERMINATION) // Should stop at winner determination
    expect(newState.players[0].points).toBe(5) // 1 - 1 (Gotcha Bad) + 5 (Thing sets) = 5
    expect(newState.players[1].points).toBe(1) // Buyer gained 1 point from Gotcha Bad
  })

  it('should handle mixed Gotcha sets correctly - process Bad first, then require interaction for Once/Twice', () => {
    // Create a player with both Gotcha Bad (auto-process) and Gotcha Twice (requires interaction)
    const player1Collection: Card[] = [
      // Gotcha Bad set (should be processed first automatically)
      { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
      { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
      { id: 'gotcha-bad-3', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
      // Gotcha Twice set (should require buyer interaction)
      { id: 'gotcha-twice-1', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
      { id: 'gotcha-twice-2', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
      // Target cards for Gotcha Twice effect
      { id: 'thing-giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
      { id: 'thing-giant-2', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
    ]

    const player1 = createMockPlayer(0, player1Collection, 3) // Give points for Gotcha Bad effect
    const player2 = createMockPlayer(1, [], 0) // Buyer
    const state = createMockGameState([player1, player2])

    // Advance phase to trigger Gotcha processing
    const action = { type: 'ADVANCE_PHASE' as const }
    const newState = gameReducer(state, action)

    // Should stay in GOTCHA_TRADEINS with pending Gotcha Twice effect
    expect(newState.currentPhase).toBe(GamePhase.GOTCHA_TRADEINS)
    expect(newState.gotchaEffectState).not.toBeNull()
    expect(newState.gotchaEffectState?.type).toBe('twice')
    
    // Gotcha Bad should have been processed (points transferred)
    expect(newState.players[0].points).toBe(2) // Lost 1 point from Bad
    expect(newState.players[1].points).toBe(1) // Buyer gained 1 point
    
    // Gotcha Bad cards should be discarded, Twice cards removed for effect, Thing cards remain
    expect(newState.players[0].collection).toHaveLength(2) // 2 Thing cards remain
    expect(newState.discardPile).toHaveLength(5) // 3 Bad + 2 Twice cards
  })
})