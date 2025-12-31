import {
  applyGotchaTwiceEffect,
  handleGotchaCardSelection,
  handleGotchaCardActionChoice,
  gameReducer
} from '../../game-logic/gameReducer'
import { GameState, GamePhase, Player, Card, GameAction } from '../../types'

// Helper function to create a mock game state
function createMockGameState(players: Player[]): GameState {
  return {
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
  }
}

// Helper function to create a mock player
function createMockPlayer(id: number, name: string, collection: Card[] = []): Player {
  return {
    id,
    name,
    hand: [],
    offer: [],
    collection,
    points: 0,
    hasMoney: id === 0
  }
}

describe('Gotcha Twice Effects', () => {
  describe('applyGotchaTwiceEffect', () => {
    it('creates effect state when player has multiple cards', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'thing-3', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const state = createMockGameState(players)
      const newState = applyGotchaTwiceEffect(state, 1)
      
      expect(newState.gotchaEffectState).toEqual({
        type: 'twice',
        affectedPlayerIndex: 1,
        cardsToSelect: 2,
        selectedCards: [],
        awaitingBuyerChoice: false
      })
      expect(newState.phaseInstructions).toBe('Buyer must select 2 cards from Player1\'s collection')
    })

    it('auto-selects card when player has only one card', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const state = createMockGameState(players)
      const newState = applyGotchaTwiceEffect(state, 1)
      
      expect(newState.gotchaEffectState).toEqual({
        type: 'twice',
        affectedPlayerIndex: 1,
        cardsToSelect: 1,
        selectedCards: [player1Collection[0]],
        awaitingBuyerChoice: true,
        cardChoices: [{ card: player1Collection[0], action: null }],
        currentChoiceIndex: 0
      })
      expect(newState.phaseInstructions).toBe('Buyer must choose to steal or discard Giant Thing from Player1\'s collection')
    })

    it('auto-selects both cards when player has exactly two cards', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const state = createMockGameState(players)
      const newState = applyGotchaTwiceEffect(state, 1)
      
      expect(newState.gotchaEffectState).toEqual({
        type: 'twice',
        affectedPlayerIndex: 1,
        cardsToSelect: 2,
        selectedCards: player1Collection,
        awaitingBuyerChoice: true,
        cardChoices: [
          { card: player1Collection[0], action: null },
          { card: player1Collection[1], action: null }
        ],
        currentChoiceIndex: 0
      })
      expect(newState.phaseInstructions).toBe('Buyer must choose to steal or discard Giant Thing from Player1\'s collection (1 of 2)')
    })

    it('returns unchanged state when player has no cards', () => {
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', [])
      ]
      
      const state = createMockGameState(players)
      const newState = applyGotchaTwiceEffect(state, 1)
      
      expect(newState).toBe(state)
    })
  })

  describe('handleGotchaCardSelection for Gotcha Twice', () => {
    it('initializes card choices when all cards are selected', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'thing-3', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const state = createMockGameState(players)
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'twice' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 2,
          selectedCards: [player1Collection[0]], // Already selected one card
          awaitingBuyerChoice: false
        }
      }
      
      const newState = handleGotchaCardSelection(stateWithEffect, 'thing-2')
      
      expect(newState.gotchaEffectState?.selectedCards).toHaveLength(2)
      expect(newState.gotchaEffectState?.awaitingBuyerChoice).toBe(true)
      expect(newState.gotchaEffectState?.cardChoices).toHaveLength(2)
      expect(newState.gotchaEffectState?.currentChoiceIndex).toBe(0)
    })
  })

  describe('handleGotchaCardActionChoice', () => {
    it('processes independent choices for each card', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'thing-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const state = createMockGameState(players)
      const stateWithEffect = {
        ...state,
        gotchaEffectState: {
          type: 'twice' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 2,
          selectedCards: player1Collection,
          awaitingBuyerChoice: true,
          cardChoices: [
            { card: player1Collection[0], action: null as 'steal' | 'discard' | null },
            { card: player1Collection[1], action: null as 'steal' | 'discard' | null }
          ],
          currentChoiceIndex: 0
        }
      }
      
      // Choose steal for first card
      const stateAfterFirstChoice = handleGotchaCardActionChoice(stateWithEffect, 'thing-1', 'steal')
      
      expect(stateAfterFirstChoice.gotchaEffectState?.cardChoices?.[0].action).toBe('steal')
      expect(stateAfterFirstChoice.gotchaEffectState?.cardChoices?.[1].action).toBe(null)
      expect(stateAfterFirstChoice.gotchaEffectState?.currentChoiceIndex).toBe(1)
      expect(stateAfterFirstChoice.phaseInstructions).toContain('Big Thing')
      expect(stateAfterFirstChoice.phaseInstructions).toContain('(2 of 2)')
      
      // Choose discard for second card - should complete the effect
      const finalState = handleGotchaCardActionChoice(stateAfterFirstChoice, 'thing-2', 'discard')
      
      // Effect should be completed
      expect(finalState.gotchaEffectState).toBe(null)
      
      // First card should be stolen to buyer
      expect(finalState.players[0].collection).toContainEqual(player1Collection[0])
      
      // Second card should be discarded
      expect(finalState.discardPile).toContainEqual(player1Collection[1])
      
      // Both cards should be removed from player1's collection
      expect(finalState.players[1].collection).toHaveLength(0)
    })
  })

  describe('Game Reducer Integration', () => {
    it('handles CHOOSE_GOTCHA_CARD_ACTION action', () => {
      const player1Collection: Card[] = [
        { id: 'thing-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]
      
      const players = [
        createMockPlayer(0, 'Buyer'),
        createMockPlayer(1, 'Player1', player1Collection)
      ]
      
      const stateWithEffect = {
        ...createMockGameState(players),
        gotchaEffectState: {
          type: 'twice' as const,
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: player1Collection,
          awaitingBuyerChoice: true,
          cardChoices: [{ card: player1Collection[0], action: null as 'steal' | 'discard' | null }],
          currentChoiceIndex: 0
        }
      }
      
      const action: GameAction = { type: 'CHOOSE_GOTCHA_CARD_ACTION', cardId: 'thing-1', action: 'steal' }
      const newState = gameReducer(stateWithEffect, action)
      
      // Effect should be completed and card stolen
      expect(newState.gotchaEffectState).toBe(null)
      expect(newState.players[0].collection).toContainEqual(player1Collection[0])
      expect(newState.players[1].collection).toHaveLength(0)
    })
  })
})