import { processGotchaTradeins, processThingTradeins } from '../../game-logic/gameReducer'
import { GameState, GamePhase, Player, Card } from '../../types'

describe('Trade-in Processing', () => {
  const createMockPlayer = (id: number, collection: Card[]): Player => ({
    id,
    name: `Player ${id}`,
    hand: [],
    offer: [],
    collection,
    points: 0,
    hasMoney: false
  })

  const createMockGameState = (players: Player[]): GameState => ({
    players,
    currentBuyerIndex: 0,
    nextBuyerIndex: 0,
    currentPhase: GamePhase.GOTCHA_TRADEINS,
    currentPlayerIndex: 0,
    round: 1,
    drawPile: [],
    discardPile: [],
    actionPhasePassesRemaining: 0,
    actionPhasePlayersWithActionCards: [],
    gotchaEffectState: null,
    selectedPerspective: 0,
    phaseInstructions: '',
    autoFollowPerspective: true,
    winner: null,
    gameStarted: true
  })

  describe('processGotchaTradeins', () => {
    it('removes complete Gotcha sets from player collections', () => {
      const player1Collection: Card[] = [
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-once-2', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-twice-1', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-twice-2', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
        { id: 'thing-giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      const state = createMockGameState([player1])

      const newState = processGotchaTradeins(state)

      // Should have a pending Gotcha Twice effect (processing stops when buyer interaction needed)
      expect(newState.gotchaEffectState).not.toBeNull()
      expect(newState.gotchaEffectState?.type).toBe('twice')
      expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(0)
      
      // Should remove the complete Gotcha Twice set (Once set remains for later processing)
      expect(newState.players[0].collection).toHaveLength(3) // 2 Once + 1 Thing
      expect(newState.players[0].collection.filter(c => c.type === 'gotcha')).toHaveLength(2)
      expect(newState.players[0].collection.filter(c => c.type === 'thing')).toHaveLength(1)
      
      // Should add traded-in Gotcha Twice cards to discard pile
      expect(newState.discardPile).toHaveLength(2) // 2 Twice cards only
    })

    it('handles multiple players with different Gotcha sets', () => {
      const player1Collection: Card[] = [
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-once-2', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' },
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 } // Add a non-Gotcha card
      ]

      const player2Collection: Card[] = [
        { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-3', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      const player2 = createMockPlayer(1, player2Collection)
      const state = createMockGameState([player1, player2])

      const newState = processGotchaTradeins(state)

      // Player 1 should have a pending Gotcha Once effect (processing stopped here)
      expect(newState.gotchaEffectState).not.toBeNull()
      expect(newState.gotchaEffectState?.type).toBe('once')
      expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(0)
      
      // Player 1 should have 1 card left (the Thing card, auto-selected for Gotcha effect)
      expect(newState.players[0].collection).toHaveLength(1)
      
      // Player 2 should still have all cards (processing stopped before reaching them)
      expect(newState.players[1].collection).toHaveLength(3)
      
      // Should add only the Gotcha Once cards to discard pile
      expect(newState.discardPile).toHaveLength(2) // 2 Once cards
    })

    it('leaves incomplete sets in collections', () => {
      const player1Collection: Card[] = [
        { id: 'gotcha-twice-1', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      const state = createMockGameState([player1])

      const newState = processGotchaTradeins(state)

      // Should keep all cards since no complete sets exist
      expect(newState.players[0].collection).toHaveLength(3)
      expect(newState.discardPile).toHaveLength(0)
    })

    it('does not affect players with no Gotcha cards', () => {
      const player1Collection: Card[] = [
        { id: 'thing-giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'action-flip-1', type: 'action', subtype: 'flip-one', name: 'Flip One', setSize: 1, effect: 'This card has an effect' }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      const state = createMockGameState([player1])

      const newState = processGotchaTradeins(state)

      // Should keep all cards since no Gotcha cards exist
      expect(newState.players[0].collection).toHaveLength(2)
      expect(newState.discardPile).toHaveLength(0)
    })
  })

  describe('processThingTradeins', () => {
    it('removes complete Thing sets and awards points', () => {
      const player1Collection: Card[] = [
        { id: 'giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'big-1', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'big-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      const state = createMockGameState([player1])

      const newState = processThingTradeins(state)

      // Should remove the complete Giant set and complete Big set
      expect(newState.players[0].collection).toHaveLength(1)
      expect(newState.players[0].collection[0].type).toBe('gotcha')
      
      // Should award 2 points (1 Giant set + 1 Big set)
      expect(newState.players[0].points).toBe(2)
      
      // Should add traded-in cards to discard pile
      expect(newState.discardPile).toHaveLength(3) // 1 Giant + 2 Big
    })

    it('handles multiple players with different Thing sets', () => {
      const player1Collection: Card[] = [
        { id: 'giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'giant-2', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]

      const player2Collection: Card[] = [
        { id: 'medium-1', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-2', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-3', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      const player2 = createMockPlayer(1, player2Collection)
      const state = createMockGameState([player1, player2])

      const newState = processThingTradeins(state)

      // Player 1 should have no cards left and 2 points (2 Giant sets)
      expect(newState.players[0].collection).toHaveLength(0)
      expect(newState.players[0].points).toBe(2)
      
      // Player 2 should have no cards left and 1 point (1 Medium set)
      expect(newState.players[1].collection).toHaveLength(0)
      expect(newState.players[1].points).toBe(1)
      
      // Should add all traded-in cards to discard pile
      expect(newState.discardPile).toHaveLength(5) // 2 Giant + 3 Medium
    })

    it('awards correct points for different set types', () => {
      const player1Collection: Card[] = [
        // 1 Giant set = 1 point
        { id: 'giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        // 1 Big set = 1 point
        { id: 'big-1', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'big-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        // 1 Medium set = 1 point
        { id: 'medium-1', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-2', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-3', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        // 1 Tiny set = 1 point
        { id: 'tiny-1', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 },
        { id: 'tiny-2', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 },
        { id: 'tiny-3', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 },
        { id: 'tiny-4', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      const state = createMockGameState([player1])

      const newState = processThingTradeins(state)

      // Should award 4 points total (1 + 1 + 1 + 1)
      expect(newState.players[0].points).toBe(4)
      expect(newState.players[0].collection).toHaveLength(0)
      expect(newState.discardPile).toHaveLength(10) // All cards traded in
    })

    it('leaves incomplete sets in collections', () => {
      const player1Collection: Card[] = [
        { id: 'big-1', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'medium-1', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-2', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'tiny-1', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      const state = createMockGameState([player1])

      const newState = processThingTradeins(state)

      // Should keep all cards since no complete sets exist
      expect(newState.players[0].collection).toHaveLength(4)
      expect(newState.players[0].points).toBe(0)
      expect(newState.discardPile).toHaveLength(0)
    })

    it('does not affect players with no Thing cards', () => {
      const player1Collection: Card[] = [
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' },
        { id: 'action-flip-1', type: 'action', subtype: 'flip-one', name: 'Flip One', setSize: 1, effect: 'This card has an effect' }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      const state = createMockGameState([player1])

      const newState = processThingTradeins(state)

      // Should keep all cards since no Thing cards exist
      expect(newState.players[0].collection).toHaveLength(2)
      expect(newState.players[0].points).toBe(0)
      expect(newState.discardPile).toHaveLength(0)
    })

    it('preserves existing points when awarding new points', () => {
      const player1Collection: Card[] = [
        { id: 'giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      player1.points = 3 // Player already has 3 points
      const state = createMockGameState([player1])

      const newState = processThingTradeins(state)

      // Should add 1 point to existing 3 points
      expect(newState.players[0].points).toBe(4)
    })
  })

  describe('Gotcha Bad Effects', () => {
    it('applies Gotcha Bad point penalty when player has points', () => {
      const player1Collection: Card[] = [
        { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-3', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      player1.points = 2 // Player has 2 points
      const player2 = createMockPlayer(1, [])
      player2.points = 1 // Buyer has 1 point
      
      const state = createMockGameState([player1, player2])
      state.currentBuyerIndex = 1 // Player 2 is the buyer

      const newState = processGotchaTradeins(state)

      // Player 1 should lose 1 point (2 -> 1)
      expect(newState.players[0].points).toBe(1)
      // Buyer (Player 2) should gain 1 point (1 -> 2)
      expect(newState.players[1].points).toBe(2)
      // Gotcha Bad set should be removed from collection
      expect(newState.players[0].collection).toHaveLength(0)
      // Cards should be in discard pile
      expect(newState.discardPile).toHaveLength(3)
    })

    it('does not apply penalty when player has no points', () => {
      const player1Collection: Card[] = [
        { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-3', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      player1.points = 0 // Player has no points
      const player2 = createMockPlayer(1, [])
      player2.points = 1 // Buyer has 1 point
      
      const state = createMockGameState([player1, player2])
      state.currentBuyerIndex = 1 // Player 2 is the buyer

      const newState = processGotchaTradeins(state)

      // Player 1 should keep 0 points (no penalty applied)
      expect(newState.players[0].points).toBe(0)
      // Buyer should keep 1 point (no transfer)
      expect(newState.players[1].points).toBe(1)
      // Gotcha Bad set should still be removed from collection
      expect(newState.players[0].collection).toHaveLength(0)
    })

    it('discards point when buyer affects themselves', () => {
      const player1Collection: Card[] = [
        { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-3', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      player1.points = 2 // Buyer has 2 points
      const player2 = createMockPlayer(1, [])
      player2.points = 1
      
      const state = createMockGameState([player1, player2])
      state.currentBuyerIndex = 0 // Player 1 is the buyer (affecting themselves)

      const newState = processGotchaTradeins(state)

      // Buyer should lose 1 point (2 -> 1)
      expect(newState.players[0].points).toBe(1)
      // Other player should keep their points (no transfer to buyer when buyer affects themselves)
      expect(newState.players[1].points).toBe(1)
      // Gotcha Bad set should be removed from collection
      expect(newState.players[0].collection).toHaveLength(0)
    })

    it('processes Gotcha sets in correct order: Bad, Twice, Once', () => {
      const player1Collection: Card[] = [
        // Gotcha Once (should be processed last)
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-once-2', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' },
        // Gotcha Bad (should be processed first)
        { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-3', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        // Gotcha Twice (should be processed second)
        { id: 'gotcha-twice-1', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-twice-2', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
        // Add a non-Gotcha card so Once effect has something to target
        { id: 'thing-giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      player1.points = 3 // Player has 3 points
      const player2 = createMockPlayer(1, [])
      player2.points = 0 // Buyer has 0 points
      
      const state = createMockGameState([player1, player2])
      state.currentBuyerIndex = 1 // Player 2 is the buyer

      const newState = processGotchaTradeins(state)

      // Should have a pending Gotcha Twice effect (processing stops when buyer interaction needed)
      expect(newState.gotchaEffectState).not.toBeNull()
      expect(newState.gotchaEffectState?.type).toBe('twice')
      expect(newState.gotchaEffectState?.affectedPlayerIndex).toBe(0)
      
      // Gotcha Bad should be processed, Twice set removed for effect, Once set remains
      expect(newState.players[0].collection).toHaveLength(3) // 2 Once + 1 Thing
      // Player should lose 1 point from Gotcha Bad effect (3 -> 2)
      expect(newState.players[0].points).toBe(2)
      // Buyer should gain 1 point from the transfer (0 -> 1)
      expect(newState.players[1].points).toBe(1)
      // Bad and Twice cards should be in discard pile
      expect(newState.discardPile).toHaveLength(5) // 3 Bad + 2 Twice
    })

    it('handles multiple Gotcha Bad sets from same player', () => {
      const player1Collection: Card[] = [
        // First Gotcha Bad set
        { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-3', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        // Second Gotcha Bad set
        { id: 'gotcha-bad-4', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-5', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-6', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      player1.points = 5 // Player has 5 points
      const player2 = createMockPlayer(1, [])
      player2.points = 0 // Buyer has 0 points
      
      const state = createMockGameState([player1, player2])
      state.currentBuyerIndex = 1 // Player 2 is the buyer

      const newState = processGotchaTradeins(state)

      // All Gotcha Bad sets should be removed
      expect(newState.players[0].collection).toHaveLength(0)
      // Player should lose 2 points (one for each Bad set: 5 -> 3)
      expect(newState.players[0].points).toBe(3)
      // Buyer should gain 2 points from the transfers (0 -> 2)
      expect(newState.players[1].points).toBe(2)
      // All cards should be in discard pile
      expect(newState.discardPile).toHaveLength(6) // 6 Bad cards
    })
  })
})