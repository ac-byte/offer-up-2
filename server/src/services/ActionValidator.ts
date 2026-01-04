import { GameAction, MultiplayerGameState, GamePhase, ActionValidationResult } from '../types'

/**
 * Validates player actions against current game state
 */
export class ActionValidator {
  
  /**
   * Validate if a player can perform a specific action
   */
  validateAction(gameState: MultiplayerGameState, playerId: string, action: GameAction): ActionValidationResult {
    // Find the player index in the game
    const playerIndex = this.getPlayerIndex(gameState, playerId)
    if (playerIndex === -1) {
      return { valid: false, error: 'Player not found in game', canExecute: false }
    }

    // Check if game is in playing state
    if (gameState.status !== 'playing') {
      return { valid: false, error: 'Game is not in playing state', canExecute: false }
    }

    // Validate action based on current phase and player
    switch (gameState.currentPhase) {
      case GamePhase.DEAL:
        return this.validateDealPhaseAction(gameState, playerIndex, action)
      
      case GamePhase.OFFER_PHASE:
        return this.validateOfferPhaseAction(gameState, playerIndex, action)
      
      case GamePhase.BUYER_FLIP:
        return this.validateBuyerFlipAction(gameState, playerIndex, action)
      
      case GamePhase.ACTION_PHASE:
        return this.validateActionPhaseAction(gameState, playerIndex, action)
      
      case GamePhase.OFFER_SELECTION:
        return this.validateOfferSelectionAction(gameState, playerIndex, action)
      
      case GamePhase.GOTCHA_TRADEINS:
        return this.validateGotchaPhaseAction(gameState, playerIndex, action)
      
      default:
        return { valid: false, error: 'No player actions allowed in this phase', canExecute: false }
    }
  }

  private getPlayerIndex(gameState: MultiplayerGameState, playerId: string): number {
    return gameState.connectedPlayers.findIndex(p => p.playerId === playerId)
  }

  private validateDealPhaseAction(gameState: MultiplayerGameState, playerIndex: number, action: GameAction): ActionValidationResult {
    // Only allow DEAL_CARDS action, and only from any player (for simplicity)
    if (action.type === 'DEAL_CARDS') {
      return { valid: true, canExecute: true }
    }
    
    return { valid: false, error: 'Only deal cards action allowed in deal phase', canExecute: false }
  }

  private validateOfferPhaseAction(gameState: MultiplayerGameState, playerIndex: number, action: GameAction): ActionValidationResult {
    // Allow PLACE_OFFER from any player (simultaneous offers)
    if (action.type === 'PLACE_OFFER') {
      // Validate that the action is for the correct player
      if (action.playerId !== playerIndex) {
        return { valid: false, error: 'Cannot place offer for another player', canExecute: false }
      }
      return { valid: true, canExecute: true }
    }
    
    // Allow interactive offer creation actions
    if (action.type === 'MOVE_CARD_TO_OFFER' || 
        action.type === 'MOVE_CARD_TO_HAND' || 
        action.type === 'LOCK_OFFER_FOR_FLIPPING' || 
        action.type === 'FLIP_OFFER_CARD') {
      // Validate that the action is for the correct player
      if (action.playerId !== playerIndex) {
        return { valid: false, error: 'Cannot perform offer creation action for another player', canExecute: false }
      }
      return { valid: true, canExecute: true }
    }
    
    return { valid: false, error: 'Only offer-related actions allowed in offer phase', canExecute: false }
  }

  private validateBuyerFlipAction(gameState: MultiplayerGameState, playerIndex: number, action: GameAction): ActionValidationResult {
    // Only buyer can flip cards
    if (playerIndex !== gameState.currentBuyerIndex) {
      return { valid: false, error: 'Only the buyer can flip cards', canExecute: false }
    }
    
    if (action.type === 'FLIP_CARD') {
      return { valid: true, canExecute: true }
    }
    
    return { valid: false, error: 'Only flip card actions allowed in buyer flip phase', canExecute: false }
  }

  private validateActionPhaseAction(gameState: MultiplayerGameState, playerIndex: number, action: GameAction): ActionValidationResult {
    // Check if it's the player's turn for turn-based actions
    const isTurnBasedAction = [
      'PLAY_ACTION_CARD',
      'DECLARE_DONE'
    ].includes(action.type)
    
    if (isTurnBasedAction && playerIndex !== gameState.currentPlayerIndex) {
      return { valid: false, error: 'Not your turn', canExecute: false }
    }
    
    // Allow action card effect responses from appropriate players
    const isEffectResponse = [
      'SELECT_FLIP_ONE_CARD',
      'SELECT_ADD_ONE_HAND_CARD',
      'SELECT_ADD_ONE_OFFER',
      'SELECT_REMOVE_ONE_CARD',
      'SELECT_REMOVE_TWO_CARD',
      'SELECT_STEAL_A_POINT_TARGET'
    ].includes(action.type)
    
    if (isEffectResponse) {
      // Validate based on current effect state
      return this.validateEffectResponse(gameState, playerIndex, action)
    }
    
    if (isTurnBasedAction || isEffectResponse) {
      return { valid: true, canExecute: true }
    }
    
    return { valid: false, error: 'Invalid action for action phase', canExecute: false }
  }

  private validateOfferSelectionAction(gameState: MultiplayerGameState, playerIndex: number, action: GameAction): ActionValidationResult {
    // Only buyer can select offers
    if (playerIndex !== gameState.currentBuyerIndex) {
      return { valid: false, error: 'Only the buyer can select offers', canExecute: false }
    }
    
    if (action.type === 'SELECT_OFFER') {
      return { valid: true, canExecute: true }
    }
    
    return { valid: false, error: 'Only select offer actions allowed in offer selection phase', canExecute: false }
  }

  private validateGotchaPhaseAction(gameState: MultiplayerGameState, playerIndex: number, action: GameAction): ActionValidationResult {
    // Only buyer can make gotcha choices
    if (playerIndex !== gameState.currentBuyerIndex) {
      return { valid: false, error: 'Only the buyer can make gotcha choices', canExecute: false }
    }
    
    const validActions = ['SELECT_GOTCHA_CARD', 'CHOOSE_GOTCHA_ACTION']
    if (validActions.includes(action.type)) {
      return { valid: true, canExecute: true }
    }
    
    return { valid: false, error: 'Only gotcha actions allowed in gotcha phase', canExecute: false }
  }

  private validateEffectResponse(gameState: MultiplayerGameState, playerIndex: number, action: GameAction): ActionValidationResult {
    // Validate based on current effect states
    switch (action.type) {
      case 'SELECT_FLIP_ONE_CARD':
        if (!gameState.flipOneEffectState?.awaitingCardSelection) {
          return { valid: false, error: 'No flip one effect awaiting card selection', canExecute: false }
        }
        return { valid: true, canExecute: true }
      
      case 'SELECT_ADD_ONE_HAND_CARD':
        if (!gameState.addOneEffectState?.awaitingHandCardSelection) {
          return { valid: false, error: 'No add one effect awaiting hand card selection', canExecute: false }
        }
        if (gameState.addOneEffectState.playerId !== playerIndex) {
          return { valid: false, error: 'Only the player who played add one can select hand card', canExecute: false }
        }
        return { valid: true, canExecute: true }
      
      case 'SELECT_ADD_ONE_OFFER':
        if (!gameState.addOneEffectState?.awaitingOfferSelection) {
          return { valid: false, error: 'No add one effect awaiting offer selection', canExecute: false }
        }
        return { valid: true, canExecute: true }
      
      case 'SELECT_REMOVE_ONE_CARD':
        if (!gameState.removeOneEffectState?.awaitingCardSelection) {
          return { valid: false, error: 'No remove one effect awaiting card selection', canExecute: false }
        }
        return { valid: true, canExecute: true }
      
      case 'SELECT_REMOVE_TWO_CARD':
        if (!gameState.removeTwoEffectState?.awaitingCardSelection) {
          return { valid: false, error: 'No remove two effect awaiting card selection', canExecute: false }
        }
        return { valid: true, canExecute: true }
      
      case 'SELECT_STEAL_A_POINT_TARGET':
        if (!gameState.stealAPointEffectState?.awaitingTargetSelection) {
          return { valid: false, error: 'No steal a point effect awaiting target selection', canExecute: false }
        }
        if (gameState.stealAPointEffectState.playerId !== playerIndex) {
          return { valid: false, error: 'Only the player who played steal a point can select target', canExecute: false }
        }
        return { valid: true, canExecute: true }
      
      default:
        return { valid: false, error: 'Unknown effect response action', canExecute: false }
    }
  }
}