import { GameState, Player, Card, GamePhase, GameAction } from '../types';

describe('Project Setup', () => {
  test('TypeScript interfaces are properly defined', () => {
    // Test that we can create objects with our defined interfaces
    const testCard: Card = {
      id: 'test-1',
      type: 'thing',
      subtype: 'Giant',
      name: 'Test Giant',
      setSize: 1
    };

    const testPlayer: Player = {
      id: 1,
      name: 'Test Player',
      hand: [],
      offer: [],
      collection: [],
      points: 0,
      hasMoney: false
    };

    const testGameState: GameState = {
      players: [testPlayer],
      currentBuyerIndex: 0,
      nextBuyerIndex: 0,
      currentPhase: GamePhase.BUYER_ASSIGNMENT,
      currentPlayerIndex: 0,
      round: 1,
      drawPile: [testCard],
      discardPile: [],
      actionPhaseDoneStates: [],
      selectedPerspective: 0,
      phaseInstructions: 'Test phase',
      autoFollowPerspective: true,
      winner: null,
      gameStarted: false
    };

    const testAction: GameAction = {
      type: 'START_GAME',
      players: ['Player 1', 'Player 2', 'Player 3']
    };

    // If we can create these objects without TypeScript errors, the interfaces are working
    expect(testCard.type).toBe('thing');
    expect(testPlayer.id).toBe(1);
    expect(testGameState.currentPhase).toBe(GamePhase.BUYER_ASSIGNMENT);
    expect(testAction.type).toBe('START_GAME');
  });

  test('GamePhase enum values are correct', () => {
    expect(GamePhase.BUYER_ASSIGNMENT).toBe('buyer_assignment');
    expect(GamePhase.DEAL).toBe('deal');
    expect(GamePhase.OFFER_PHASE).toBe('offer_phase');
    expect(GamePhase.BUYER_FLIP).toBe('buyer_flip');
    expect(GamePhase.ACTION_PHASE).toBe('action_phase');
    expect(GamePhase.OFFER_SELECTION).toBe('offer_selection');
    expect(GamePhase.OFFER_DISTRIBUTION).toBe('offer_distribution');
    expect(GamePhase.GOTCHA_TRADEINS).toBe('gotcha_tradeins');
    expect(GamePhase.THING_TRADEINS).toBe('thing_tradeins');
    expect(GamePhase.WINNER_DETERMINATION).toBe('winner_determination');
  });
});