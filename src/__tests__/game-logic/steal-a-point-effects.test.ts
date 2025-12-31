import { gameReducer, createInitialGameState } from '../../game-logic/gameReducer'
import { GamePhase, GameState, Card } from '../../types'

describe('Steal A Point Action Card Effects', () => {
  let initialState: GameState

  beforeEach(() => {
    initialState = createInitialGameState()
    
    // Initialize game with 4 players
    initialState = gameReducer(initialState, {
      type: 'START_GAME',
      players: ['Alice', 'Bob', 'Charlie', 'Diana']
    })
    
    // Set up action phase
    initialState.currentPhase = GamePhase.ACTION_PHASE
    initialState.currentBuyerIndex = 0 // Alice is buyer
    initialState.currentPlayerIndex = 1 // Bob is current player
    
    // Set up player points for testing
    initialState.players[0].points = 2 // Alice: 2 points
    initialState.players[1].points = 1 // Bob: 1 point
    initialState.players[2].points = 3 // Charlie: 3 points
    initialState.players[3].points = 2 // Diana: 2 points
    
    // Give Bob a Steal A Point action card
    initialState.players[1].collection = [
      { id: 'steal-point-1', type: 'action', subtype: 'steal-point', name: 'Steal A Point', setSize: 1, effect: 'Steal 1 point from any player with more points than you' }
    ]
  })

  describe('PLAY_ACTION_CARD with steal-point', () => {
    test('sets up Steal A Point effect state when played', () => {
      const newState = gameReducer(initialState, {
        type: 'PLAY_ACTION_CARD',
        playerId: 1,
        cardId: 'steal-point-1'
      })
      
      // Card should be removed from collection and added to discard pile
      expect(newState.players[1].collection).toHaveLength(0)
      expect(newState.discardPile).toHaveLength(1)
      expect(newState.discardPile[0].id).toBe('steal-point-1')
      
      // Steal A Point effect state should be set up
      expect(newState.stealAPointEffectState).toEqual({
        playerId: 1,
        awaitingTargetSelection: true
      })
      
      // Phase instructions should be updated
      expect(newState.phaseInstructions).toContain('Bob played Steal A Point')
      expect(newState.phaseInstructions).toContain('Select a player with more points')
    })
  })

  describe('SELECT_STEAL_A_POINT_TARGET action', () => {
    let stateWithStealAPointActive: GameState

    beforeEach(() => {
      // Play the Steal A Point card first
      stateWithStealAPointActive = gameReducer(initialState, {
        type: 'PLAY_ACTION_CARD',
        playerId: 1,
        cardId: 'steal-point-1'
      })
    })

    test('successfully steals point from valid target', () => {
      // Bob (1 point) steals from Charlie (3 points)
      const newState = gameReducer(stateWithStealAPointActive, {
        type: 'SELECT_STEAL_A_POINT_TARGET',
        targetPlayerId: 2 // Charlie
      })
      
      // Bob should gain 1 point (1 -> 2)
      expect(newState.players[1].points).toBe(2)
      
      // Charlie should lose 1 point (3 -> 2)
      expect(newState.players[2].points).toBe(2)
      
      // Other players should be unchanged
      expect(newState.players[0].points).toBe(2) // Alice unchanged
      expect(newState.players[3].points).toBe(2) // Diana unchanged
      
      // Steal A Point effect state should be cleared
      expect(newState.stealAPointEffectState).toBeNull()
    })

    test('can steal from different valid targets', () => {
      // Bob (1 point) steals from Alice (2 points)
      const newState = gameReducer(stateWithStealAPointActive, {
        type: 'SELECT_STEAL_A_POINT_TARGET',
        targetPlayerId: 0 // Alice
      })
      
      // Bob should gain 1 point (1 -> 2)
      expect(newState.players[1].points).toBe(2)
      
      // Alice should lose 1 point (2 -> 1)
      expect(newState.players[0].points).toBe(1)
      
      // Other players should be unchanged
      expect(newState.players[2].points).toBe(3) // Charlie unchanged
      expect(newState.players[3].points).toBe(2) // Diana unchanged
    })

    test('can steal from player with equal points when they have more', () => {
      // Set Diana to have more points than Bob
      stateWithStealAPointActive.players[3].points = 4
      
      // Bob (1 point) steals from Diana (4 points)
      const newState = gameReducer(stateWithStealAPointActive, {
        type: 'SELECT_STEAL_A_POINT_TARGET',
        targetPlayerId: 3 // Diana
      })
      
      // Bob should gain 1 point (1 -> 2)
      expect(newState.players[1].points).toBe(2)
      
      // Diana should lose 1 point (4 -> 3)
      expect(newState.players[3].points).toBe(3)
    })

    test('throws error when no Steal A Point effect is active', () => {
      expect(() => {
        gameReducer(initialState, {
          type: 'SELECT_STEAL_A_POINT_TARGET',
          targetPlayerId: 2
        })
      }).toThrow('No Steal A Point effect is currently active')
    })

    test('throws error when not awaiting target selection', () => {
      // Manually set up state where Steal A Point is not awaiting selection
      stateWithStealAPointActive.stealAPointEffectState!.awaitingTargetSelection = false
      
      expect(() => {
        gameReducer(stateWithStealAPointActive, {
          type: 'SELECT_STEAL_A_POINT_TARGET',
          targetPlayerId: 2
        })
      }).toThrow('Steal A Point effect is not awaiting target selection')
    })

    test('throws error for invalid target player ID', () => {
      expect(() => {
        gameReducer(stateWithStealAPointActive, {
          type: 'SELECT_STEAL_A_POINT_TARGET',
          targetPlayerId: 5 // Invalid player index
        })
      }).toThrow('Invalid target player ID: 5')
    })

    test('throws error when trying to steal from yourself', () => {
      expect(() => {
        gameReducer(stateWithStealAPointActive, {
          type: 'SELECT_STEAL_A_POINT_TARGET',
          targetPlayerId: 1 // Bob trying to steal from himself
        })
      }).toThrow('Cannot steal points from yourself')
    })

    test('throws error when target has equal or fewer points', () => {
      // Set Charlie to have same points as Bob
      stateWithStealAPointActive.players[2].points = 1
      
      expect(() => {
        gameReducer(stateWithStealAPointActive, {
          type: 'SELECT_STEAL_A_POINT_TARGET',
          targetPlayerId: 2 // Charlie with equal points
        })
      }).toThrow('Target player must have more points than you')
    })

    test('throws error when target has fewer points', () => {
      // Set Charlie to have fewer points than Bob
      stateWithStealAPointActive.players[2].points = 0
      
      expect(() => {
        gameReducer(stateWithStealAPointActive, {
          type: 'SELECT_STEAL_A_POINT_TARGET',
          targetPlayerId: 2 // Charlie with fewer points
        })
      }).toThrow('Target player must have more points than you')
    })

    test('throws error when target has no points to steal', () => {
      // Set Alice to have 0 points but Bob to have negative (edge case)
      stateWithStealAPointActive.players[0].points = 0
      stateWithStealAPointActive.players[1].points = -1 // Edge case
      
      expect(() => {
        gameReducer(stateWithStealAPointActive, {
          type: 'SELECT_STEAL_A_POINT_TARGET',
          targetPlayerId: 0 // Alice with 0 points
        })
      }).toThrow('Target player has no points to steal')
    })

    test('advances to next eligible player after point steal', () => {
      const newState = gameReducer(stateWithStealAPointActive, {
        type: 'SELECT_STEAL_A_POINT_TARGET',
        targetPlayerId: 2 // Charlie
      })
      
      // Should advance to next eligible player (this is tested in other files)
      // Just verify the effect state is cleared and phase instructions reset
      expect(newState.stealAPointEffectState).toBeNull()
      expect(newState.phaseInstructions).not.toContain('Steal A Point')
    })

    test('does not mutate original state', () => {
      const originalBobPoints = stateWithStealAPointActive.players[1].points
      const originalCharliePoints = stateWithStealAPointActive.players[2].points
      
      gameReducer(stateWithStealAPointActive, {
        type: 'SELECT_STEAL_A_POINT_TARGET',
        targetPlayerId: 2
      })
      
      // Original state should be unchanged
      expect(stateWithStealAPointActive.players[1].points).toBe(originalBobPoints)
      expect(stateWithStealAPointActive.players[2].points).toBe(originalCharliePoints)
    })
  })

  describe('Edge cases', () => {
    test('handles case when player has no valid targets', () => {
      // Set up scenario where Bob has the most points
      initialState.players[0].points = 0 // Alice: 0 points
      initialState.players[1].points = 5 // Bob: 5 points (highest)
      initialState.players[2].points = 1 // Charlie: 1 point
      initialState.players[3].points = 2 // Diana: 2 points
      
      // Bob plays Steal A Point but has no valid targets
      const stateAfterPlay = gameReducer(initialState, {
        type: 'PLAY_ACTION_CARD',
        playerId: 1,
        cardId: 'steal-point-1'
      })
      
      // Effect state should still be set up (UI will handle showing no targets)
      expect(stateAfterPlay.stealAPointEffectState).toEqual({
        playerId: 1,
        awaitingTargetSelection: true
      })
    })

    test('handles point transfer when target goes to 0 points', () => {
      // Set Charlie to have only 2 points (more than Bob's 1)
      initialState.players[2].points = 2
      
      // Play the Steal A Point card first
      const stateWithStealAPointActive = gameReducer(initialState, {
        type: 'PLAY_ACTION_CARD',
        playerId: 1,
        cardId: 'steal-point-1'
      })
      
      // Manually set Charlie to have only 1 point after the card is played (still more than Bob's 1)
      // This simulates a scenario where Charlie had points reduced by other effects
      stateWithStealAPointActive.players[2].points = 1
      stateWithStealAPointActive.players[1].points = 0 // Set Bob to 0 so Charlie has more
      
      // Bob steals from Charlie
      const newState = gameReducer(stateWithStealAPointActive, {
        type: 'SELECT_STEAL_A_POINT_TARGET',
        targetPlayerId: 2
      })
      
      // Bob should gain 1 point (0 -> 1)
      expect(newState.players[1].points).toBe(1)
      
      // Charlie should go to 0 points (1 -> 0)
      expect(newState.players[2].points).toBe(0)
    })
  })

  describe('Phase validation', () => {
    test('allows SELECT_STEAL_A_POINT_TARGET only during action phase', () => {
      // Set up Steal A Point effect in action phase
      const stateWithStealAPoint = gameReducer(initialState, {
        type: 'PLAY_ACTION_CARD',
        playerId: 1,
        cardId: 'steal-point-1'
      })
      
      // Change to different phase
      const stateInWrongPhase = {
        ...stateWithStealAPoint,
        currentPhase: GamePhase.OFFER_PHASE
      }
      
      expect(() => {
        gameReducer(stateInWrongPhase, {
          type: 'SELECT_STEAL_A_POINT_TARGET',
          targetPlayerId: 2
        })
      }).toThrow('Action SELECT_STEAL_A_POINT_TARGET is not allowed during phase offer_phase')
    })
  })
})