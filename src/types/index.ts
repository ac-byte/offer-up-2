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
  
  // Action Phase Done System
  actionPhaseDoneStates: boolean[] // Array indexed by player ID, true if player is done
  
  // Offer Distribution Summary System
  offerDistributionSummary: OfferDistributionSummary | null
  offerDistributionAcknowledged: boolean[] // Array indexed by player ID, true if player acknowledged
  
  // Gotcha Effects State
  gotchaEffectState: GotchaEffectState | null
  
  // Action Card Effects State
  flipOneEffectState: FlipOneEffectState | null
  addOneEffectState: AddOneEffectState | null
  removeOneEffectState: RemoveOneEffectState | null
  removeTwoEffectState: RemoveTwoEffectState | null
  stealAPointEffectState: StealAPointEffectState | null
  
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
  // For Gotcha Twice: track which iteration we're on (1 or 2)
  twiceIteration?: number
}

export interface FlipOneEffectState {
  playerId: number // Player who played the Flip One card
  awaitingCardSelection: boolean
}

export interface AddOneEffectState {
  playerId: number // Player who played the Add One card
  awaitingHandCardSelection: boolean
  selectedHandCard?: Card
  awaitingOfferSelection: boolean
}

export interface RemoveOneEffectState {
  playerId: number // Player who played the Remove One card
  awaitingCardSelection: boolean
}

export interface RemoveTwoEffectState {
  playerId: number // Player who played the Remove Two card
  awaitingCardSelection: boolean
  selectedCards: { offerId: number; cardIndex: number }[] // Track selected cards
  cardsToSelect: number // How many more cards need to be selected (2 initially)
}

export interface StealAPointEffectState {
  playerId: number // Player who played the Steal A Point card
  awaitingTargetSelection: boolean
}

export interface OfferDistributionSummary {
  buyerName: string
  selectedSellerName: string
  cardsReceived: { playerName: string; cards: Card[] }[] // What each player received
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
  | { type: 'RESET_GAME' }
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
  | { type: 'ACKNOWLEDGE_OFFER_DISTRIBUTION'; playerId: number }
  | { type: 'SELECT_GOTCHA_CARD'; cardId: string }
  | { type: 'CHOOSE_GOTCHA_ACTION'; action: 'steal' | 'discard' }
  | { type: 'SELECT_FLIP_ONE_CARD'; offerId: number; cardIndex: number }
  | { type: 'SELECT_ADD_ONE_HAND_CARD'; cardId: string }
  | { type: 'SELECT_ADD_ONE_OFFER'; offerId: number }
  | { type: 'SELECT_REMOVE_ONE_CARD'; offerId: number; cardIndex: number }
  | { type: 'SELECT_REMOVE_TWO_CARD'; offerId: number; cardIndex: number }
  | { type: 'SELECT_STEAL_A_POINT_TARGET'; targetPlayerId: number }
  | { type: 'REPLACE_STATE'; newState: GameState }

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