import {
  getNextPlayerIndex,
  getPlayerToRightOfBuyer,
  getRotationStartIndex,
  getRotationOrder,
  isBuyerIncludedInPhase,
  playerHasValidActions,
  getNextEligiblePlayer,
  allEligiblePlayersProcessed,
  advanceToNextEligiblePlayer,
  createInitialGameState,
  createPlayer
} from '../../game-logic/gameReducer'
import { GamePhase, GameState, Player } from '../../types'

describe('Player Rotation Logic', () => {
  describe('getNextPlayerIndex', () => {
    it('should return next player index in clockwise order', () => {
      expect(getNextPlayerIndex(0, 4)).toBe(1)
      expect(getNextPlayerIndex(1, 4)).toBe(2)
      expect(getNextPlayerIndex(2, 4)).toBe(3)
    })

    it('should wrap around to 0 when reaching last player', () => {
      expect(getNextPlayerIndex(3, 4)).toBe(0)
      expect(getNextPlayerIndex(5, 6)).toBe(0)
    })
  })

  describe('getPlayerToRightOfBuyer', () => {
    it('should return player to right of buyer', () => {
      expect(getPlayerToRightOfBuyer(0, 4)).toBe(1)
      expect(getPlayerToRightOfBuyer(1, 4)).toBe(2)
      expect(getPlayerToRightOfBuyer(2, 4)).toBe(3)
    })

    it('should wrap around when buyer is last player', () => {
      expect(getPlayerToRightOfBuyer(3, 4)).toBe(0)
      expect(getPlayerToRightOfBuyer(5, 6)).toBe(0)
    })
  })

  describe('getRotationStartIndex', () => {
    it('should start with buyer when buyer is included', () => {
      expect(getRotationStartIndex(2, 4, true)).toBe(2)
      expect(getRotationStartIndex(0, 6, true)).toBe(0)
    })

    it('should start with player to right of buyer when buyer is excluded', () => {
      expect(getRotationStartIndex(2, 4, false)).toBe(3)
      expect(getRotationStartIndex(3, 4, false)).toBe(0)
      expect(getRotationStartIndex(0, 6, false)).toBe(1)
    })
  })

  describe('getRotationOrder', () => {
    it('should return all players in clockwise order when buyer included', () => {
      // 4 players, buyer at index 1
      const order = getRotationOrder(1, 4, true)
      expect(order).toEqual([1, 2, 3, 0])
    })

    it('should return all players except buyer when buyer excluded', () => {
      // 4 players, buyer at index 1
      const order = getRotationOrder(1, 4, false)
      expect(order).toEqual([2, 3, 0])
    })

    it('should handle wraparound correctly', () => {
      // 3 players, buyer at index 2
      const orderIncluded = getRotationOrder(2, 3, true)
      expect(orderIncluded).toEqual([2, 0, 1])

      const orderExcluded = getRotationOrder(2, 3, false)
      expect(orderExcluded).toEqual([0, 1])
    })

    it('should work with 6 players', () => {
      // 6 players, buyer at index 3
      const order = getRotationOrder(3, 6, false)
      expect(order).toEqual([4, 5, 0, 1, 2])
    })
  })

  describe('isBuyerIncludedInPhase', () => {
    it('should exclude buyer from offer phase', () => {
      expect(isBuyerIncludedInPhase(GamePhase.OFFER_PHASE)).toBe(false)
    })

    it('should include buyer in action phase', () => {
      expect(isBuyerIncludedInPhase(GamePhase.ACTION_PHASE)).toBe(true)
    })

    it('should include buyer in buyer-flip phase', () => {
      expect(isBuyerIncludedInPhase(GamePhase.BUYER_FLIP)).toBe(true)
    })

    it('should include buyer in other phases', () => {
      expect(isBuyerIncludedInPhase(GamePhase.DEAL)).toBe(true)
      expect(isBuyerIncludedInPhase(GamePhase.OFFER_SELECTION)).toBe(true)
      expect(isBuyerIncludedInPhase(GamePhase.WINNER_DETERMINATION)).toBe(true)
    })
  })

  describe('playerHasValidActions', () => {
    let player: Player

    beforeEach(() => {
      player = createPlayer(0, 'Test Player')
    })

    it('should return true for seller in offer phase with cards and no existing offer', () => {
      player.hand = [
        { id: '1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: '2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: '3', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1 }
      ]
      expect(playerHasValidActions(player, GamePhase.OFFER_PHASE, false)).toBe(true)
    })

    it('should return false for buyer in offer phase', () => {
      player.hand = [
        { id: '1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: '2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: '3', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1 }
      ]
      expect(playerHasValidActions(player, GamePhase.OFFER_PHASE, true)).toBe(false)
    })

    it('should return false for seller with existing offer', () => {
      player.hand = [
        { id: '1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: '2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      player.offer = [
        { id: '3', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1, faceUp: true, position: 0 }
      ]
      expect(playerHasValidActions(player, GamePhase.OFFER_PHASE, false)).toBe(false)
    })

    it('should return false for seller with insufficient cards', () => {
      player.hand = [
        { id: '1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: '2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      expect(playerHasValidActions(player, GamePhase.OFFER_PHASE, false)).toBe(false)
    })

    it('should return true for player with action cards in action phase', () => {
      player.collection = [
        { id: '1', type: 'action', subtype: 'flip-one', name: 'Flip One', setSize: 1 },
        { id: '2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      expect(playerHasValidActions(player, GamePhase.ACTION_PHASE, false)).toBe(true)
      expect(playerHasValidActions(player, GamePhase.ACTION_PHASE, true)).toBe(true)
    })

    it('should return false for player without action cards in action phase', () => {
      player.collection = [
        { id: '1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: '2', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1 }
      ]
      expect(playerHasValidActions(player, GamePhase.ACTION_PHASE, false)).toBe(false)
      expect(playerHasValidActions(player, GamePhase.ACTION_PHASE, true)).toBe(false)
    })

    it('should return true for buyer in buyer-flip phase', () => {
      expect(playerHasValidActions(player, GamePhase.BUYER_FLIP, true)).toBe(true)
    })

    it('should return false for non-buyer in buyer-flip phase', () => {
      expect(playerHasValidActions(player, GamePhase.BUYER_FLIP, false)).toBe(false)
    })

    it('should return true for buyer in offer selection phase', () => {
      expect(playerHasValidActions(player, GamePhase.OFFER_SELECTION, true)).toBe(true)
    })

    it('should return false for non-buyer in offer selection phase', () => {
      expect(playerHasValidActions(player, GamePhase.OFFER_SELECTION, false)).toBe(false)
    })

    it('should return false for automatic phases', () => {
      expect(playerHasValidActions(player, GamePhase.DEAL, false)).toBe(false)
      expect(playerHasValidActions(player, GamePhase.DEAL, true)).toBe(false)
      expect(playerHasValidActions(player, GamePhase.GOTCHA_TRADEINS, false)).toBe(false)
      expect(playerHasValidActions(player, GamePhase.THING_TRADEINS, false)).toBe(false)
      expect(playerHasValidActions(player, GamePhase.WINNER_DETERMINATION, false)).toBe(false)
    })
  })

  describe('getNextEligiblePlayer', () => {
    let gameState: GameState

    beforeEach(() => {
      gameState = createInitialGameState()
      gameState.players = [
        createPlayer(0, 'Player 0'),
        createPlayer(1, 'Player 1'),
        createPlayer(2, 'Player 2'),
        createPlayer(3, 'Player 3')
      ]
      gameState.currentBuyerIndex = 1
      gameState.gameStarted = true
    })

    it('should find next eligible player in offer phase', () => {
      gameState.currentPhase = GamePhase.OFFER_PHASE
      
      // Give players enough cards to make offers
      gameState.players.forEach(player => {
        player.hand = [
          { id: `${player.id}-1`, type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
          { id: `${player.id}-2`, type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
          { id: `${player.id}-3`, type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1 }
        ]
      })
      
      // Start from player 0 (seller)
      const nextPlayer = getNextEligiblePlayer(0, gameState, new Set())
      expect(nextPlayer).toBe(2) // Next seller after player 0 (skipping buyer at index 1)
    })

    it('should skip buyer in offer phase', () => {
      gameState.currentPhase = GamePhase.OFFER_PHASE
      
      // Give players enough cards to make offers
      gameState.players.forEach(player => {
        player.hand = [
          { id: `${player.id}-1`, type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
          { id: `${player.id}-2`, type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
          { id: `${player.id}-3`, type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1 }
        ]
      })
      
      // Start from buyer (should be skipped)
      const nextPlayer = getNextEligiblePlayer(1, gameState, new Set())
      expect(nextPlayer).toBe(2) // First seller after buyer
    })

    it('should find eligible player in action phase', () => {
      gameState.currentPhase = GamePhase.ACTION_PHASE
      
      // Give only player 2 action cards
      gameState.players[2].collection = [
        { id: 'action-1', type: 'action', subtype: 'flip-one', name: 'Flip One', setSize: 1 }
      ]
      
      const nextPlayer = getNextEligiblePlayer(0, gameState, new Set())
      expect(nextPlayer).toBe(2) // Player with action cards
    })

    it('should return null when no eligible players remain', () => {
      gameState.currentPhase = GamePhase.ACTION_PHASE
      
      // No players have action cards
      gameState.players.forEach(player => {
        player.collection = []
      })
      
      const nextPlayer = getNextEligiblePlayer(0, gameState, new Set())
      expect(nextPlayer).toBe(null)
    })

    it('should skip already visited players', () => {
      gameState.currentPhase = GamePhase.OFFER_PHASE
      
      // Give players enough cards to make offers
      gameState.players.forEach(player => {
        player.hand = [
          { id: `${player.id}-1`, type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
          { id: `${player.id}-2`, type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
          { id: `${player.id}-3`, type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1 }
        ]
      })
      
      const visitedPlayers = new Set([0, 2]) // Already visited players 0 and 2
      const nextPlayer = getNextEligiblePlayer(0, gameState, visitedPlayers)
      expect(nextPlayer).toBe(3) // Only player 3 remains (buyer 1 is excluded from offer phase)
    })
  })

  describe('allEligiblePlayersProcessed', () => {
    let gameState: GameState

    beforeEach(() => {
      gameState = createInitialGameState()
      gameState.players = [
        createPlayer(0, 'Player 0'),
        createPlayer(1, 'Player 1'),
        createPlayer(2, 'Player 2'),
        createPlayer(3, 'Player 3')
      ]
      gameState.currentBuyerIndex = 1
      gameState.gameStarted = true
    })

    it('should return true when all eligible players visited in offer phase', () => {
      gameState.currentPhase = GamePhase.OFFER_PHASE
      
      // Give players enough cards to make offers
      gameState.players.forEach(player => {
        player.hand = [
          { id: `${player.id}-1`, type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
          { id: `${player.id}-2`, type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
          { id: `${player.id}-3`, type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1 }
        ]
      })
      
      const visitedPlayers = new Set([0, 2, 3]) // All sellers visited (buyer 1 excluded)
      expect(allEligiblePlayersProcessed(gameState, visitedPlayers)).toBe(true)
    })

    it('should return false when eligible players remain unvisited', () => {
      gameState.currentPhase = GamePhase.OFFER_PHASE
      
      // Give players enough cards to make offers
      gameState.players.forEach(player => {
        player.hand = [
          { id: `${player.id}-1`, type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
          { id: `${player.id}-2`, type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
          { id: `${player.id}-3`, type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1 }
        ]
      })
      
      const visitedPlayers = new Set([0, 2]) // Player 3 not visited yet
      expect(allEligiblePlayersProcessed(gameState, visitedPlayers)).toBe(false)
    })

    it('should return true when no players have valid actions', () => {
      gameState.currentPhase = GamePhase.ACTION_PHASE
      
      // No players have action cards
      gameState.players.forEach(player => {
        player.collection = []
      })
      
      const visitedPlayers = new Set<number>()
      expect(allEligiblePlayersProcessed(gameState, visitedPlayers)).toBe(true)
    })
  })

  describe('advanceToNextEligiblePlayer', () => {
    let gameState: GameState

    beforeEach(() => {
      gameState = createInitialGameState()
      gameState.players = [
        createPlayer(0, 'Player 0'),
        createPlayer(1, 'Player 1'),
        createPlayer(2, 'Player 2'),
        createPlayer(3, 'Player 3')
      ]
      gameState.currentBuyerIndex = 1
      gameState.currentPlayerIndex = 0
      gameState.currentPhase = GamePhase.OFFER_PHASE
      gameState.gameStarted = true
    })

    it('should advance to next eligible player', () => {
      // Give players enough cards to make offers
      gameState.players.forEach(player => {
        player.hand = [
          { id: `${player.id}-1`, type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
          { id: `${player.id}-2`, type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
          { id: `${player.id}-3`, type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1 }
        ]
      })
      
      const newState = advanceToNextEligiblePlayer(gameState)
      expect(newState.currentPlayerIndex).toBe(2) // Next seller after player 0
      expect(newState.currentPhase).toBe(GamePhase.OFFER_PHASE) // Phase unchanged
    })

    it('should advance phase when all eligible players processed', () => {
      // No players can make offers (insufficient cards)
      gameState.players.forEach(player => {
        player.hand = [
          { id: `${player.id}-1`, type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
        ]
      })
      
      const newState = advanceToNextEligiblePlayer(gameState)
      expect(newState.currentPhase).toBe(GamePhase.BUYER_FLIP) // Advanced to next phase
      expect(newState.currentPlayerIndex).toBe(1) // Buyer for buyer-flip phase
    })
  })
})