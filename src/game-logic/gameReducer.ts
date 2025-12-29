import { GameState, GameAction, GamePhase, Player } from '../types'
import { createShuffledDeck } from './cards'

/**
 * Creates initial game state
 */
export function createInitialGameState(): GameState {
  return {
    players: [],
    currentBuyerIndex: 0,
    currentPhase: GamePhase.BUYER_ASSIGNMENT,
    currentPlayerIndex: 0,
    round: 1,
    drawPile: [],
    discardPile: [],
    selectedPerspective: 0,
    phaseInstructions: 'Waiting for game to start...',
    winner: null,
    gameStarted: false
  }
}

/**
 * Creates a player with initial state
 */
export function createPlayer(id: number, name: string): Player {
  return {
    id,
    name,
    hand: [],
    offer: [],
    collection: [],
    points: 0,
    hasMoney: false
  }
}

/**
 * Validates player count for game initialization
 */
export function validatePlayerCount(playerCount: number): boolean {
  return playerCount >= 3 && playerCount <= 6
}

/**
 * Randomly selects a buyer from the players
 */
export function selectRandomBuyer(playerCount: number): number {
  return Math.floor(Math.random() * playerCount)
}

/**
 * Gets the correct phase order for the 10-phase round system
 */
export function getPhaseOrder(): GamePhase[] {
  return [
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
}

/**
 * Validates if an action is allowed in the current phase
 */
export function validatePhaseAction(phase: GamePhase, action: GameAction): boolean {
  switch (action.type) {
    case 'START_GAME':
      // Can only start game when not started
      return true
    
    case 'ADVANCE_PHASE':
      // Phase advancement is always allowed (controlled by game logic)
      return true
    
    case 'CHANGE_PERSPECTIVE':
      // Perspective changes are always allowed
      return true
    
    case 'PLACE_OFFER':
      // Can only place offers during offer phase
      return phase === GamePhase.OFFER_PHASE
    
    case 'FLIP_CARD':
      // Can only flip cards during buyer-flip phase
      return phase === GamePhase.BUYER_FLIP
    
    case 'PLAY_ACTION_CARD':
      // Can only play action cards during action phase
      return phase === GamePhase.ACTION_PHASE
    
    case 'SELECT_OFFER':
      // Can only select offers during offer selection phase
      return phase === GamePhase.OFFER_SELECTION
    
    case 'DECLARE_DONE':
      // Can declare done during action phase or other interactive phases
      return phase === GamePhase.ACTION_PHASE || phase === GamePhase.OFFER_PHASE
    
    default:
      return false
  }
}

/**
 * Advances to the next phase in the sequence
 */
export function advanceToNextPhase(currentPhase: GamePhase, currentRound: number): { nextPhase: GamePhase; nextRound: number } {
  const phaseOrder = getPhaseOrder()
  const currentIndex = phaseOrder.indexOf(currentPhase)
  
  if (currentIndex === -1) {
    throw new Error(`Invalid current phase: ${currentPhase}`)
  }
  
  const nextIndex = (currentIndex + 1) % phaseOrder.length
  const nextPhase = phaseOrder[nextIndex]
  
  // If we're going back to buyer assignment, increment round
  const nextRound = nextPhase === GamePhase.BUYER_ASSIGNMENT ? currentRound + 1 : currentRound
  
  return { nextPhase, nextRound }
}

/**
 * Checks if the game should continue (no winner yet)
 */
export function shouldContinueGame(state: GameState): boolean {
  // Game continues if no winner is declared
  return state.winner === null
}

/**
 * Game reducer function
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  // Validate phase-specific actions
  if (!validatePhaseAction(state.currentPhase, action)) {
    throw new Error(`Action ${action.type} is not allowed during phase ${state.currentPhase}`)
  }

  switch (action.type) {
    case 'START_GAME': {
      const playerNames = action.players
      
      // Validate player count
      if (!validatePlayerCount(playerNames.length)) {
        throw new Error(`Invalid player count: ${playerNames.length}. Must be between 3 and 6 players.`)
      }
      
      // Create players
      const players = playerNames.map((name, index) => createPlayer(index, name))
      
      // Select random buyer
      const buyerIndex = selectRandomBuyer(players.length)
      
      // Set money bag for buyer
      players[buyerIndex].hasMoney = true
      
      // Create shuffled deck
      const drawPile = createShuffledDeck()
      
      return {
        ...state,
        players,
        currentBuyerIndex: buyerIndex,
        currentPhase: GamePhase.DEAL,
        currentPlayerIndex: 0,
        round: 1,
        drawPile,
        discardPile: [],
        selectedPerspective: 0,
        phaseInstructions: getPhaseInstructions(GamePhase.DEAL),
        winner: null,
        gameStarted: true
      }
    }
    
    case 'ADVANCE_PHASE': {
      // Don't advance if game is over
      if (!shouldContinueGame(state)) {
        return state
      }
      
      const { nextPhase, nextRound } = advanceToNextPhase(state.currentPhase, state.round)
      
      return {
        ...state,
        currentPhase: nextPhase,
        round: nextRound,
        phaseInstructions: getPhaseInstructions(nextPhase)
      }
    }
    
    case 'CHANGE_PERSPECTIVE': {
      const playerId = action.playerId
      
      // Validate player ID
      if (playerId < 0 || playerId >= state.players.length) {
        return state // Invalid player ID, no change
      }
      
      return {
        ...state,
        selectedPerspective: playerId
      }
    }
    
    // Placeholder implementations for phase-specific actions
    case 'PLACE_OFFER': {
      // TODO: Implement in future tasks
      return state
    }
    
    case 'FLIP_CARD': {
      // TODO: Implement in future tasks
      return state
    }
    
    case 'PLAY_ACTION_CARD': {
      // TODO: Implement in future tasks
      return state
    }
    
    case 'SELECT_OFFER': {
      // TODO: Implement in future tasks
      return state
    }
    
    case 'DECLARE_DONE': {
      // TODO: Implement in future tasks
      return state
    }
    
    default:
      return state
  }
}

/**
 * Gets instructions for each phase
 */
function getPhaseInstructions(phase: GamePhase): string {
  switch (phase) {
    case GamePhase.BUYER_ASSIGNMENT:
      return 'Buyer assignment: Determining who has the money bag...'
    case GamePhase.DEAL:
      return 'Deal phase: Dealing cards to all players...'
    case GamePhase.OFFER_PHASE:
      return 'Offer phase: Sellers place their 3-card offers...'
    case GamePhase.BUYER_FLIP:
      return 'Buyer-flip phase: Buyer flips one face-down card...'
    case GamePhase.ACTION_PHASE:
      return 'Action phase: Players may play action cards...'
    case GamePhase.OFFER_SELECTION:
      return 'Offer selection: Buyer selects one offer...'
    case GamePhase.OFFER_DISTRIBUTION:
      return 'Offer distribution: Distributing cards and money bag...'
    case GamePhase.GOTCHA_TRADEINS:
      return 'Gotcha trade-ins: Processing Gotcha card effects...'
    case GamePhase.THING_TRADEINS:
      return 'Thing trade-ins: Converting complete sets to points...'
    case GamePhase.WINNER_DETERMINATION:
      return 'Winner determination: Checking for game winner...'
    default:
      return 'Unknown phase'
  }
}