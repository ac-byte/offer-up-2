import { processGotchaTradeins, createInitialGameState, createPlayer } from '../../game-logic/gameReducer'
import { GameState, GamePhase, Player, Card } from '../../types'

/**
 * Test iterative Gotcha processing to ensure new sets formed during processing are also processed
 */
describe('Iterative Gotcha Processing', () => {
  const createMockGameState = (players: Player[]): GameState => {
    const state = createInitialGameState()
    return {
      ...state,
      players,
      currentBuyerIndex: 0,
      currentPhase: GamePhase.GOTCHA_TRADEINS,
      gameStarted: true
    }
  }

  const createGotchaCard = (id: string, subtype: 'once' | 'twice' | 'bad'): Card => ({
    id,
    type: 'gotcha',
    subtype,
    name: `Gotcha ${subtype.charAt(0).toUpperCase() + subtype.slice(1)}`,
    setSize: subtype === 'bad' ? 3 : 2,
    effect: `Effect for ${subtype}`
  })

  const createThingCard = (id: string, subtype: 'giant' | 'big' | 'medium' | 'tiny'): Card => ({
    id,
    type: 'thing',
    subtype,
    name: `${subtype.charAt(0).toUpperCase() + subtype.slice(1)} Thing`,
    setSize: subtype === 'giant' ? 1 : subtype === 'big' ? 2 : subtype === 'medium' ? 3 : 4,
    effect: undefined
  })

  it('processes newly formed Gotcha sets after card transfers', () => {
    // Create a scenario where processing a Gotcha set creates a new Gotcha set
    const player1 = createPlayer(0, 'Alice')
    const player2 = createPlayer(1, 'Bob')
    
    // Player 1 has a complete Gotcha Once set
    player1.collection = [
      createGotchaCard('gotcha-once-1', 'once'),
      createGotchaCard('gotcha-once-2', 'once'),
      createThingCard('thing-1', 'giant')
    ]
    
    // Player 2 has one Gotcha Once card (incomplete set)
    // When Player 1's Gotcha Once effect steals a Gotcha Once card from Player 2,
    // Player 2 will have 0 Gotcha Once cards, but if the buyer chooses to steal
    // and Player 1 already has 2, Player 1 will have 3 Gotcha Once cards,
    // which could form a new set if there are more cards
    player2.collection = [
      createGotchaCard('gotcha-once-3', 'once'),
      createGotchaCard('gotcha-once-4', 'once'), // This will make a complete set when stolen
      createThingCard('thing-2', 'big')
    ]
    
    const state = createMockGameState([player1, player2])
    
    // Process Gotcha trade-ins
    const newState = processGotchaTradeins(state)
    
    // Should have a pending Gotcha Once effect for Player 1's set
    expect(newState.gotchaEffectState).not.toBeNull()
    expect(newState.gotchaEffectState?.type).toBe('once')
    expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(0) // Player 1
    
    // Player 1's Gotcha Once set should be removed
    expect(newState.players[0].collection).toHaveLength(1) // Only the Thing card remains
    expect(newState.players[0].collection[0].type).toBe('thing')
    
    // Discard pile should contain the processed Gotcha Once set
    expect(newState.discardPile).toHaveLength(2)
    expect(newState.discardPile.every(card => card.type === 'gotcha' && card.subtype === 'once')).toBe(true)
  })

  it('processes multiple iterations when Gotcha Bad effects create new sets', () => {
    // Create a scenario where Gotcha Bad effects transfer points that could affect subsequent processing
    const player1 = createPlayer(0, 'Alice')
    const player2 = createPlayer(1, 'Bob')
    
    // Player 1 has a complete Gotcha Bad set and some points
    player1.collection = [
      createGotchaCard('gotcha-bad-1', 'bad'),
      createGotchaCard('gotcha-bad-2', 'bad'),
      createGotchaCard('gotcha-bad-3', 'bad')
    ]
    player1.points = 2
    
    // Player 2 is the buyer and has another complete Gotcha Bad set
    player2.collection = [
      createGotchaCard('gotcha-bad-4', 'bad'),
      createGotchaCard('gotcha-bad-5', 'bad'),
      createGotchaCard('gotcha-bad-6', 'bad')
    ]
    player2.points = 1
    
    const state = createMockGameState([player1, player2])
    state.currentBuyerIndex = 1 // Player 2 is the buyer
    
    // Process Gotcha trade-ins
    const newState = processGotchaTradeins(state)
    
    // Both players' Gotcha Bad sets should be processed
    expect(newState.players[0].collection).toHaveLength(0) // Player 1's set removed
    expect(newState.players[1].collection).toHaveLength(0) // Player 2's set removed
    
    // Points should be affected by both Gotcha Bad effects
    // Player 1 loses 1 point (2 -> 1), and that point goes to buyer (Player 2: 1 -> 2)
    // Player 2 (buyer) loses 1 point from their own set (2 -> 1), point is discarded
    expect(newState.players[0].points).toBe(1) // Lost 1 point
    expect(newState.players[1].points).toBe(1) // Gained 1, then lost 1
    
    // All Gotcha Bad cards should be in discard pile
    expect(newState.discardPile).toHaveLength(6)
    expect(newState.discardPile.every(card => card.type === 'gotcha' && card.subtype === 'bad')).toBe(true)
    
    // No pending effects since Gotcha Bad doesn't require buyer interaction
    expect(newState.gotchaEffectState).toBeNull()
  })

  it('processes sets in correct order across multiple players', () => {
    // Test that the order Bad -> Twice -> Once is maintained across players
    const player1 = createPlayer(0, 'Alice')
    const player2 = createPlayer(1, 'Bob')
    
    // Player 1 has Gotcha Once set (lower priority) plus some other cards
    player1.collection = [
      createGotchaCard('gotcha-once-1', 'once'),
      createGotchaCard('gotcha-once-2', 'once'),
      createThingCard('thing-1', 'giant') // Extra card so Gotcha Once effect has something to target
    ]
    
    // Player 2 has Gotcha Bad set (higher priority)
    player2.collection = [
      createGotchaCard('gotcha-bad-1', 'bad'),
      createGotchaCard('gotcha-bad-2', 'bad'),
      createGotchaCard('gotcha-bad-3', 'bad')
    ]
    player2.points = 1
    
    const state = createMockGameState([player1, player2])
    
    // Process Gotcha trade-ins
    const newState = processGotchaTradeins(state)
    
    // Player 2's Gotcha Bad set should be processed first (higher priority)
    expect(newState.players[1].collection).toHaveLength(0) // Gotcha Bad set removed
    expect(newState.players[1].points).toBe(0) // Point lost due to Gotcha Bad
    
    // Player 1's Gotcha Once set should create a pending effect
    expect(newState.gotchaEffectState).not.toBeNull()
    expect(newState.gotchaEffectState?.type).toBe('once')
    expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(0) // Player 1
    
    // Player 1's Gotcha Once set should be removed, but the Thing card should remain
    expect(newState.players[0].collection).toHaveLength(1) // Only Thing card remains
    expect(newState.players[0].collection[0].type).toBe('thing')
  })

  it('continues processing until no Gotcha sets remain', () => {
    // Create a complex scenario with multiple sets that need iterative processing
    const player1 = createPlayer(0, 'Alice')
    
    // Player 1 has multiple different Gotcha sets
    player1.collection = [
      // First Gotcha Bad set
      createGotchaCard('gotcha-bad-1', 'bad'),
      createGotchaCard('gotcha-bad-2', 'bad'),
      createGotchaCard('gotcha-bad-3', 'bad'),
      // Gotcha Twice set
      createGotchaCard('gotcha-twice-1', 'twice'),
      createGotchaCard('gotcha-twice-2', 'twice'),
      // Gotcha Once set
      createGotchaCard('gotcha-once-1', 'once'),
      createGotchaCard('gotcha-once-2', 'once')
    ]
    player1.points = 3
    
    const state = createMockGameState([player1])
    
    // Process Gotcha trade-ins
    const newState = processGotchaTradeins(state)
    
    // Gotcha Bad should be processed first (no buyer interaction needed)
    // Then Gotcha Twice should be processed next and require buyer interaction
    expect(newState.gotchaEffectState).not.toBeNull()
    expect(newState.gotchaEffectState?.type).toBe('twice')
    
    // Gotcha Bad set should be removed and point penalty applied
    expect(newState.players[0].points).toBe(2) // Lost 1 point from Gotcha Bad
    
    // Only Gotcha Once and some Gotcha Twice cards should remain
    // (Gotcha Bad removed, Gotcha Twice removed but effect pending)
    const remainingGotchaCards = newState.players[0].collection.filter(card => card.type === 'gotcha')
    expect(remainingGotchaCards).toHaveLength(2) // Only Gotcha Once set remains
    expect(remainingGotchaCards.every(card => card.subtype === 'once')).toBe(true)
  })
})