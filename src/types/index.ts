// Core game types and interfaces

export interface GameState {
  // Game Configuration
  players: Player[]
  currentBuyerIndex: number
  nextBuyerIndex: number // Player who will become buyer in next round (money bag holder)
  currentPhase: GamePhase
  currentPlayerIndex: number
  round: number
  
  // Card Management
  drawPile: Card[]
  discardPile: Card[]
  
  // Action Phase Pass System
  actionPhasePassesRemaining: number
  actionPhasePlayersWithActionCards: number[]
  
  // Gotcha Effects State
  gotchaEffectState: GotchaEffectState | null
  
  // UI State
  selectedPerspective: number
  phaseInstructions: string
  autoFollowPerspective: boolean
  
  // Game Status
  winner: number | null
  gameStarted: boolean
}

export interface Player {
  id: number
  name: string
  hand: Card[]
  offer: OfferCard[]
  collection: Card[]
  points: number
  hasMoney: boolean
}

export interface Card {
  id: string
  type: 'thing' | 'gotcha' | 'action'
  subtype: string
  name: string
  setSize: number
  effect?: string
}

export interface OfferCard extends Card {
  faceUp: boolean
  position: number // 0, 1, or 2
}

export interface GotchaEffectState {
  type: 'once' | 'twice'
  affectedPlayerIndex: number
  cardsToSelect: number
  selectedCards: Card[]
  awaitingBuyerChoice: boolean
}

export enum GamePhase {
  BUYER_ASSIGNMENT = 'buyer_assignment',
  DEAL = 'deal',
  OFFER_PHASE = 'offer_phase',
  BUYER_FLIP = 'buyer_flip',
  ACTION_PHASE = 'action_phase',
  OFFER_SELECTION = 'offer_selection',
  OFFER_DISTRIBUTION = 'offer_distribution',
  GOTCHA_TRADEINS = 'gotcha_tradeins',
  THING_TRADEINS = 'thing_tradeins',
  WINNER_DETERMINATION = 'winner_determination'
}

export type GameAction = 
  | { type: 'START_GAME'; players: string[] }
  | { type: 'ADVANCE_PHASE' }
  | { type: 'ADVANCE_PLAYER' }
  | { type: 'DEAL_CARDS' }
  | { type: 'PLACE_OFFER'; playerId: number; cards: Card[]; faceUpIndex: number }
  | { type: 'FLIP_CARD'; offerId: number; cardIndex: number }
  | { type: 'PLAY_ACTION_CARD'; playerId: number; cardId: string }
  | { type: 'SELECT_OFFER'; buyerId: number; sellerId: number }
  | { type: 'CHANGE_PERSPECTIVE'; playerId: number }
  | { type: 'TOGGLE_AUTO_FOLLOW' }
  | { type: 'DECLARE_DONE'; playerId: number }
  | { type: 'SELECT_GOTCHA_CARD'; cardId: string }
  | { type: 'CHOOSE_GOTCHA_ACTION'; action: 'steal' | 'discard' }

// Card display states
export type CardDisplayState = 'face_up' | 'face_down' | 'partial'

// Component prop interfaces
export interface CardProps {
  card: Card
  displayState: CardDisplayState
  draggable?: boolean
  onClick?: () => void
  onDragStart?: (card: Card) => void
  className?: string
}

export interface PlayerAreaProps {
  player: Player
  isCurrentPlayer: boolean
  isBuyer: boolean
  perspective: number
  phase: GamePhase
  onCardPlay: (card: Card) => void
  onOfferPlace: (cards: Card[], faceUpIndex: number) => void
}