// Server-side types extending the client-side game types

// Re-export all client types (we'll copy the essential ones here for server independence)
export interface GameState {
  // Game Configuration
  players: Player[]
  currentBuyerIndex: number
  nextBuyerIndex: number
  currentPhase: GamePhase
  currentPlayerIndex: number
  round: number
  
  // Card Management
  drawPile: Card[]
  discardPile: Card[]
  
  // Action Phase Done System
  actionPhaseDoneStates: boolean[]
  
  // Gotcha Effects State
  gotchaEffectState: GotchaEffectState | null
  
  // Action Card Effects State
  flipOneEffectState: FlipOneEffectState | null
  addOneEffectState: AddOneEffectState | null
  removeOneEffectState: RemoveOneEffectState | null
  removeTwoEffectState: RemoveTwoEffectState | null
  stealAPointEffectState: StealAPointEffectState | null
  
  // Offer Creation State
  offerCreationState: OfferCreationState | null
  
  // UI State
  selectedPerspective: number
  phaseInstructions: string
  autoFollowPerspective: boolean
  
  // Previous Round Summary
  previousRoundSummary: string | null
  
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
  position: number
}

export interface GotchaEffectState {
  type: 'once' | 'twice'
  affectedPlayerIndex: number
  cardsToSelect: number
  selectedCards: Card[]
  awaitingBuyerChoice: boolean
  twiceIteration?: number
}

export interface FlipOneEffectState {
  playerId: number
  awaitingCardSelection: boolean
}

export interface AddOneEffectState {
  playerId: number
  awaitingHandCardSelection: boolean
  selectedHandCard?: Card
  awaitingOfferSelection: boolean
}

export interface RemoveOneEffectState {
  playerId: number
  awaitingCardSelection: boolean
}

export interface RemoveTwoEffectState {
  playerId: number
  awaitingCardSelection: boolean
  selectedCards: { offerId: number; cardIndex: number }[]
  cardsToSelect: number
}

export interface StealAPointEffectState {
  playerId: number
  awaitingTargetSelection: boolean
}

export interface OfferCreationState {
  playerId: number
  mode: 'selecting' | 'locked' | 'flipping' | 'complete'
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
  | { type: 'SELECT_GOTCHA_CARD'; cardId: string }
  | { type: 'CHOOSE_GOTCHA_ACTION'; action: 'steal' | 'discard' }
  | { type: 'SELECT_FLIP_ONE_CARD'; offerId: number; cardIndex: number }
  | { type: 'SELECT_ADD_ONE_HAND_CARD'; cardId: string }
  | { type: 'SELECT_ADD_ONE_OFFER'; offerId: number }
  | { type: 'SELECT_REMOVE_ONE_CARD'; offerId: number; cardIndex: number }
  | { type: 'SELECT_REMOVE_TWO_CARD'; offerId: number; cardIndex: number }
  | { type: 'SELECT_STEAL_A_POINT_TARGET'; targetPlayerId: number }
  | { type: 'MOVE_CARD_TO_OFFER'; playerId: number; cardId: string }
  | { type: 'MOVE_CARD_TO_HAND'; playerId: number; cardId: string }
  | { type: 'LOCK_OFFER_FOR_FLIPPING'; playerId: number }
  | { type: 'FLIP_OFFER_CARD'; playerId: number; cardIndex: number }

// Multiplayer-specific types
export interface MultiplayerGameState extends GameState {
  gameId: string
  status: GameStatus
  hostPlayerId: string
  connectedPlayers: ConnectedPlayer[]
  createdAt: Date
  lastActivity: Date
}

export interface ConnectedPlayer {
  playerId: string
  playerName: string
  connected: boolean
  joinedAt: Date
  lastSeen: Date
  gamePlayerIndex?: number  // Index in the game's players array (set when game starts)
}

export enum GameStatus {
  LOBBY = 'lobby',
  PLAYING = 'playing',
  FINISHED = 'finished',
  ABANDONED = 'abandoned'
}

export interface LobbyState {
  gameId: string
  players: ConnectedPlayer[]
  isHost: boolean
  canStart: boolean
  maxPlayers: number
  minPlayers: number
}

// API Request/Response types
export interface CreateGameRequest {
  hostName: string
}

export interface CreateGameResponse {
  gameId: string
  joinUrl: string
  hostPlayerId: string
}

export interface JoinGameRequest {
  playerName: string
}

export interface JoinGameResponse {
  success: boolean
  playerId?: string
  error?: string
  lobbyState?: LobbyState
}

export interface StartGameRequest {
  // No additional data needed - host is determined by authentication
}

export interface StartGameResponse {
  success: boolean
  error?: string
}

export interface GameActionRequest {
  action: GameAction
  playerId: string
}

export interface GameActionResponse {
  success: boolean
  error?: string
}

export interface GameStatusResponse {
  gameId: string
  status: GameStatus
  playerCount: number
  maxPlayers: number
  canJoin: boolean
}

// Server-Sent Events types
export interface GameStateUpdateEvent {
  type: 'game-state-update'
  gameState: GameState
  timestamp: string
}

export interface PlayerJoinedEvent {
  type: 'player-joined'
  player: ConnectedPlayer
  timestamp: string
}

export interface PlayerLeftEvent {
  type: 'player-left'
  playerId: string
  playerName: string
  timestamp: string
}

export interface GameStartedEvent {
  type: 'game-started'
  timestamp: string
}

export interface GameEndedEvent {
  type: 'game-ended'
  winner?: Player
  reason: 'completed' | 'abandoned' | 'disconnections'
  timestamp: string
}

export type ServerSentEvent = 
  | GameStateUpdateEvent
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | GameStartedEvent
  | GameEndedEvent

// Utility types
export interface ServerConfig {
  port: number
  clientUrl: string
  maxGames: number
  maxPlayersPerGame: number
  minPlayersPerGame: number
  gameCleanupInterval: number
  playerTimeoutMs: number
}

export interface GameValidationResult {
  valid: boolean
  error?: string
}

export interface ActionValidationResult {
  valid: boolean
  error?: string
  canExecute: boolean
}