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
    currentPhase: GamePhase.GOTCHA_TRADEINS,
    currentPlayerIndex: 0,
    round: 1,
    drawPile: [],
    discardPile: [],
    selectedPerspective: 0,
    phaseInstructions: '',
    winner: null,
    gameStarted: true
  })

  describe('processGotchaTradeins', () => {
    it('removes complete Gotcha sets from player collections', () => {
      const player1Collection: Card[] = [
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1, effect: 'This card has an effect' },
        { id: 'gotcha-twice-1', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-twice-2', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
        { id: 'thing-giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]

      const player1 = createMockPlayer(0, player1Collection)
      const state = createMockGameState([player1])

      const newState = processGotchaTradeins(state)

      // Should remove the complete Gotcha Once set and complete Gotcha Twice set
      expect(newState.players[0].collection).toHaveLength(1)
      expect(newState.players[0].collection[0].type).toBe('thing')
      
      // Should add traded-in cards to discard pile
      expect(newState.discardPile).toHaveLength(3) // 1 Once + 2 Twice
    })

    it('handles multiple players with different Gotcha sets', () => {
      const player1Collection: Card[] = [
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1, effect: 'This card has an effect' },
        { id: 'gotcha-once-2', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1, effect: 'This card has an effect' }
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

      // Player 1 should have no cards left (2 complete Once sets)
      expect(newState.players[0].collection).toHaveLength(0)
      
      // Player 2 should have no cards left (1 complete Bad set)
      expect(newState.players[1].collection).toHaveLength(0)
      
      // Should add all traded-in cards to discard pile
      expect(newState.discardPile).toHaveLength(5) // 2 Once + 3 Bad
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
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1, effect: 'This card has an effect' }
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
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1, effect: 'This card has an effect' },
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
})