import { processGotchaTradeins, createInitialGameState, createPlayer, handleGotchaActionChoice, handleGotchaCardSelection } from '../../game-logic/gameReducer'
import { createDeck } from '../../game-logic/cards'
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
      gameStarted: true,
      drawPile: createDeck() // Add a full deck for dealing cards
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

  it('automatically advances to Offer phase after all Gotcha effects are processed', () => {
    // Create a scenario where a Gotcha Once effect completes and should advance through all administrative phases to Offer phase
    const player1 = createPlayer(0, 'Alice')
    const player2 = createPlayer(1, 'Bob')
    
    // Player 1 has a complete Gotcha Once set and exactly one other card (so it gets auto-selected)
    player1.collection = [
      createGotchaCard('gotcha-once-1', 'once'),
      createGotchaCard('gotcha-once-2', 'once'),
      createThingCard('thing-1', 'giant') // Only 1 card, so it will be auto-selected
    ]
    
    // Player 2 has some Thing cards that will form a complete set after processing
    player2.collection = [
      createThingCard('thing-2', 'giant'), // Complete Giant set (1 card = 1 point)
      createThingCard('thing-3', 'big')
    ]
    
    const state = createMockGameState([player1, player2])
    
    // Process Gotcha trade-ins - this should create a pending Gotcha Once effect
    const stateAfterGotcha = processGotchaTradeins(state)
    
    // Should have a pending Gotcha Once effect with the card auto-selected (since player1 has only 1 non-Gotcha card)
    expect(stateAfterGotcha.gotchaEffectState).not.toBeNull()
    expect(stateAfterGotcha.gotchaEffectState?.type).toBe('once')
    expect(stateAfterGotcha.gotchaEffectState?.awaitingBuyerChoice).toBe(true) // Should be awaiting choice since card was auto-selected
    expect(stateAfterGotcha.gotchaEffectState?.affectedPlayerIndex).toBe(0) // Player 1 is affected
    
    // Simulate buyer completing the Gotcha Once effect by choosing to discard
    const stateAfterChoice = handleGotchaActionChoice(stateAfterGotcha, 'discard')
    
    // After the Gotcha effect is complete, the game should automatically:
    // 1. Process any remaining Gotcha sets (there are none)
    // 2. Advance through Thing trade-ins (processing Player 2's Giant set)
    // 3. Advance through Winner determination (no winner yet)
    // 4. Advance through Buyer assignment and Deal phases
    // 5. End up at Offer phase for the next round
    expect(stateAfterChoice.currentPhase).toBe(GamePhase.OFFER_PHASE)
    
    // Player 2's Giant Thing set should be automatically processed and points awarded
    expect(stateAfterChoice.players[1].points).toBe(1) // Points awarded for Giant set
    
    // Should be in the next round
    expect(stateAfterChoice.round).toBe(2)
    
    // All players should have 5 cards dealt for the new round
    expect(stateAfterChoice.players.every(p => p.hand.length === 5)).toBe(true)
  })

  it('processes newly formed Gotcha sets when buyer steals Gotcha cards during effects', () => {
    // Integration test: Gotcha effect creates new Gotcha set that needs immediate processing
    const player1 = createPlayer(0, 'Alice')
    const player2 = createPlayer(1, 'Bob')
    
    // Player 1 (buyer) has one Gotcha Once card (incomplete set)
    player1.collection = [
      createGotchaCard('gotcha-once-1', 'once'),
      createThingCard('thing-1', 'big')
    ]
    
    // Player 2 has a complete Gotcha Once set and another Gotcha Once card
    player2.collection = [
      createGotchaCard('gotcha-once-2', 'once'),
      createGotchaCard('gotcha-once-3', 'once'), // Complete set
      createGotchaCard('gotcha-once-4', 'once'), // This will complete buyer's set when stolen
      createThingCard('thing-2', 'medium')
    ]
    
    const state = createMockGameState([player1, player2])
    state.currentBuyerIndex = 0 // Player 1 is the buyer
    
    // Process Gotcha trade-ins - Player 2's Gotcha Once set should be processed first
    const stateAfterFirstGotcha = processGotchaTradeins(state)
    
    // Should have a pending Gotcha Once effect for Player 2's set
    expect(stateAfterFirstGotcha.gotchaEffectState).not.toBeNull()
    expect(stateAfterFirstGotcha.gotchaEffectState?.type).toBe('once')
    expect(stateAfterFirstGotcha.gotchaEffectState?.affectedPlayerIndex).toBe(1) // Player 2
    
    // Player 2's Gotcha Once set should be removed, leaving 2 cards
    expect(stateAfterFirstGotcha.players[1].collection).toHaveLength(2) // gotcha-once-4 + thing-2
    
    // Simulate buyer choosing to steal the remaining Gotcha Once card from Player 2
    // First, we need to select the card (gotcha-once-4)
    const stateAfterCardSelection = handleGotchaCardSelection(stateAfterFirstGotcha, 'gotcha-once-4')
    
    // Should now be awaiting buyer choice
    expect(stateAfterCardSelection.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
    expect(stateAfterCardSelection.gotchaEffectState?.selectedCards).toHaveLength(1)
    expect(stateAfterCardSelection.gotchaEffectState?.selectedCards[0].id).toBe('gotcha-once-4')
    
    // Buyer chooses to steal the Gotcha Once card
    const stateAfterSteal = handleGotchaActionChoice(stateAfterCardSelection, 'steal')
    
    // This should trigger iterative processing:
    // 1. The stolen Gotcha Once card completes the buyer's Gotcha Once set
    // 2. The system should detect this new set and process it automatically
    // 3. This creates another Gotcha Once effect that needs buyer interaction
    
    // Should have a NEW pending Gotcha Once effect for the buyer's newly formed set
    expect(stateAfterSteal.gotchaEffectState).not.toBeNull()
    expect(stateAfterSteal.gotchaEffectState?.type).toBe('once')
    expect(stateAfterSteal.gotchaEffectState?.affectedPlayerIndex).toBe(0) // Player 1 (buyer)
    
    // Player 1 should now have the stolen card, but their Gotcha Once set should be removed
    // (because it was processed in the iterative step)
    const player1GotchaCards = stateAfterSteal.players[0].collection.filter(card => card.type === 'gotcha')
    expect(player1GotchaCards).toHaveLength(0) // Gotcha set was processed
    
    // Player 2 should have lost the stolen card
    expect(stateAfterSteal.players[1].collection).toHaveLength(1) // Only thing-2 remains
    expect(stateAfterSteal.players[1].collection[0].id).toBe('thing-2')
    
    // The discard pile should contain both processed Gotcha Once sets (4 cards total)
    const discardedGotchaCards = stateAfterSteal.discardPile.filter(card => card.type === 'gotcha')
    expect(discardedGotchaCards).toHaveLength(4) // 2 from first set + 2 from buyer's new set
    
    // Should still be in Gotcha trade-ins phase awaiting the second buyer interaction
    expect(stateAfterSteal.currentPhase).toBe(GamePhase.GOTCHA_TRADEINS)
  })

  it('processes newly formed Gotcha sets when buyer steals Gotcha cards during Gotcha Twice effects', () => {
    // Integration test: Gotcha Twice effect creates new Gotcha set that needs immediate processing
    const player1 = createPlayer(0, 'Alice')
    const player2 = createPlayer(1, 'Bob')
    
    // Player 1 (buyer) has one Gotcha Twice card (incomplete set)
    player1.collection = [
      createGotchaCard('gotcha-twice-1', 'twice'),
      createThingCard('thing-1', 'big')
    ]
    
    // Player 2 has a complete Gotcha Twice set and another Gotcha Twice card
    player2.collection = [
      createGotchaCard('gotcha-twice-2', 'twice'),
      createGotchaCard('gotcha-twice-3', 'twice'), // Complete set
      createGotchaCard('gotcha-twice-4', 'twice'), // This will complete buyer's set when stolen
      createThingCard('thing-2', 'medium')
    ]
    
    const state = createMockGameState([player1, player2])
    state.currentBuyerIndex = 0 // Player 1 is the buyer
    
    // Process Gotcha trade-ins - Player 2's Gotcha Twice set should be processed first
    const stateAfterFirstGotcha = processGotchaTradeins(state)
    
    // Should have a pending Gotcha Twice effect for Player 2's set
    expect(stateAfterFirstGotcha.gotchaEffectState).not.toBeNull()
    expect(stateAfterFirstGotcha.gotchaEffectState?.type).toBe('twice')
    expect(stateAfterFirstGotcha.gotchaEffectState?.affectedPlayerIndex).toBe(1) // Player 2
    
    // Simulate buyer selecting and stealing the remaining Gotcha Twice card from Player 2
    const stateAfterCardSelection = handleGotchaCardSelection(stateAfterFirstGotcha, 'gotcha-twice-4')
    const stateAfterFirstSteal = handleGotchaActionChoice(stateAfterCardSelection, 'steal')
    
    // This should start the second iteration of Gotcha Twice
    expect(stateAfterFirstSteal.gotchaEffectState?.type).toBe('twice')
    expect(stateAfterFirstSteal.gotchaEffectState?.twiceIteration).toBe(2)
    
    // Complete the second iteration by selecting and discarding the remaining card
    const stateAfterSecondSelection = handleGotchaCardSelection(stateAfterFirstSteal, 'thing-2')
    const stateAfterSecondChoice = handleGotchaActionChoice(stateAfterSecondSelection, 'discard')
    
    // This should trigger iterative processing:
    // 1. The stolen Gotcha Twice card completes the buyer's Gotcha Twice set
    // 2. The system should detect this new set and process it automatically
    // 3. This creates another Gotcha Twice effect that needs buyer interaction
    
    // Should have a NEW pending Gotcha Twice effect for the buyer's newly formed set
    expect(stateAfterSecondChoice.gotchaEffectState).not.toBeNull()
    expect(stateAfterSecondChoice.gotchaEffectState?.type).toBe('twice')
    expect(stateAfterSecondChoice.gotchaEffectState?.affectedPlayerIndex).toBe(0) // Player 1 (buyer)
    expect(stateAfterSecondChoice.gotchaEffectState?.twiceIteration).toBe(1) // New effect, first iteration
    
    // Player 1 should now have the stolen card, but their Gotcha Twice set should be removed
    const player1GotchaCards = stateAfterSecondChoice.players[0].collection.filter(card => card.type === 'gotcha')
    expect(player1GotchaCards).toHaveLength(0) // Gotcha set was processed
    
    // The discard pile should contain both processed Gotcha Twice sets (4 cards total)
    const discardedGotchaCards = stateAfterSecondChoice.discardPile.filter(card => card.type === 'gotcha')
    expect(discardedGotchaCards).toHaveLength(4) // 2 from first set + 2 from buyer's new set
    
    // Should still be in Gotcha trade-ins phase awaiting the new buyer interaction
    expect(stateAfterSecondChoice.currentPhase).toBe(GamePhase.GOTCHA_TRADEINS)
  })
})