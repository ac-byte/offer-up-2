# Design Document: Offer Phase Per-Player State Fix

## Overview

This design addresses the critical bug where players can become blocked during offer creation when multiple players are creating offers simultaneously. The root cause is that the current implementation uses a single global `offerCreationState` instead of maintaining independent state for each player.

The solution involves refactoring the offer creation state from a single nullable object to a per-player array, similar to how `actionPhaseDoneStates` is currently implemented. This ensures that each player's offer creation progress is tracked independently, preventing state conflicts and blocking scenarios.

## Architecture

### Current Architecture Issues

The current system has these problems:
- Single `offerCreationState: OfferCreationState | null` in GameState
- When Player A locks their offer (enters "flipping" mode), the state is set to `{ playerId: A, mode: 'flipping' }`
- When Player B starts creating their offer, the system overwrites the state with `{ playerId: B, mode: 'selecting' }`
- Player A can no longer complete their flip action because the state no longer indicates they are in flipping mode

### New Architecture

The new system will:
- Replace `offerCreationState: OfferCreationState | null` with `offerCreationStates: (OfferCreationState | null)[]`
- Index the array by player ID, similar to `actionPhaseDoneStates`
- Each player's offer creation state is independent and cannot be overwritten by other players
- State transitions only affect the specific player performing the action

## Components and Interfaces

### Type System Changes

#### GameState Interface Update
```typescript
export interface GameState {
  // ... existing fields ...
  
  // OLD: Single offer creation state
  // offerCreationState: OfferCreationState | null
  
  // NEW: Per-player offer creation states
  offerCreationStates: (OfferCreationState | null)[]
  
  // ... rest of fields unchanged ...
}
```

#### OfferCreationState Interface (Unchanged)
```typescript
export interface OfferCreationState {
  playerId: number // Player who is creating the offer
  mode: 'selecting' | 'locked' | 'flipping' | 'complete'
}
```

### State Management Functions

#### State Access Helpers
```typescript
// Get offer creation state for a specific player
function getPlayerOfferCreationState(state: GameState, playerId: number): OfferCreationState | null {
  return state.offerCreationStates[playerId] || null
}

// Set offer creation state for a specific player
function setPlayerOfferCreationState(state: GameState, playerId: number, offerState: OfferCreationState | null): GameState {
  const newStates = [...state.offerCreationStates]
  newStates[playerId] = offerState
  return {
    ...state,
    offerCreationStates: newStates
  }
}

// Initialize offer creation states array for all players
function initializeOfferCreationStates(playerCount: number): (OfferCreationState | null)[] {
  return new Array(playerCount).fill(null)
}
```

#### State Transition Functions
```typescript
// Initialize offer creation for a specific player
function initializePlayerOfferCreation(state: GameState, playerId: number): GameState {
  const player = state.players[playerId]
  
  if (player.hand.length <= 3) {
    // Auto-move all cards and go to flipping mode
    const newState = moveAllCardsToOffer(state, playerId)
    return setPlayerOfferCreationState(newState, playerId, {
      playerId,
      mode: 'flipping'
    })
  } else {
    // Enter selecting mode
    return setPlayerOfferCreationState(state, playerId, {
      playerId,
      mode: 'selecting'
    })
  }
}

// Complete offer creation for a specific player
function completePlayerOfferCreation(state: GameState, playerId: number): GameState {
  return setPlayerOfferCreationState(state, playerId, {
    playerId,
    mode: 'complete'
  })
}

// Clear offer creation state for a specific player
function clearPlayerOfferCreationState(state: GameState, playerId: number): GameState {
  return setPlayerOfferCreationState(state, playerId, null)
}
```

### Game Reducer Updates

#### Action Handler Changes
All offer-related action handlers need to be updated to use the per-player state:

```typescript
case 'MOVE_CARD_TO_OFFER': {
  const { playerId, cardId } = action
  
  // Check player's individual state instead of global state
  const playerOfferState = getPlayerOfferCreationState(state, playerId)
  
  if (!playerOfferState || playerOfferState.playerId !== playerId) {
    // Initialize offer creation for this player if needed
    const newState = initializePlayerOfferCreation(state, playerId)
    return moveCardToOffer(newState, playerId, cardId)
  }
  
  if (playerOfferState.mode !== 'selecting') {
    throw new Error('Cannot move cards when offer is locked')
  }
  
  return moveCardToOffer(state, playerId, cardId)
}

case 'LOCK_OFFER_FOR_FLIPPING': {
  const { playerId } = action
  
  const playerOfferState = getPlayerOfferCreationState(state, playerId)
  if (!playerOfferState || playerOfferState.mode !== 'selecting') {
    throw new Error('Player is not in selecting mode')
  }
  
  return setPlayerOfferCreationState(state, playerId, {
    playerId,
    mode: 'flipping'
  })
}

case 'FLIP_OFFER_CARD': {
  const { playerId, cardIndex } = action
  
  const playerOfferState = getPlayerOfferCreationState(state, playerId)
  if (!playerOfferState || playerOfferState.mode !== 'flipping') {
    throw new Error('Player is not in flipping mode')
  }
  
  const newState = flipOfferCard(state, playerId, cardIndex)
  return clearPlayerOfferCreationState(newState, playerId)
}
```

#### Phase Transition Updates
```typescript
function areAllOfferCreationsComplete(state: GameState): boolean {
  const buyerIndex = state.currentBuyerIndex
  
  return state.players.every((player, index) => {
    if (index === buyerIndex) return true // Buyer doesn't create offers
    
    const playerOfferState = getPlayerOfferCreationState(state, index)
    return playerOfferState === null || playerOfferState.mode === 'complete' || 
           (player.offer.length === 3 && player.offer.some(card => card.faceUp))
  })
}
```

## Data Models

### State Initialization

#### Game Start
```typescript
function createInitialGameState(players: string[]): GameState {
  return {
    // ... existing initialization ...
    offerCreationStates: initializeOfferCreationStates(players.length),
    // ... rest of initialization ...
  }
}
```

#### Phase Transitions
```typescript
function advanceToOfferPhase(state: GameState): GameState {
  const newState = {
    ...state,
    currentPhase: GamePhase.OFFER_PHASE,
    offerCreationStates: initializeOfferCreationStates(state.players.length)
  }
  
  // Initialize first eligible seller
  const firstSeller = findFirstEligibleSeller(newState)
  if (firstSeller !== null) {
    return initializePlayerOfferCreation(newState, firstSeller)
  }
  
  return newState
}
```

### Migration Strategy

#### Backward Compatibility
To ensure smooth migration, we'll implement a compatibility layer:

```typescript
function migrateOfferCreationState(state: any): GameState {
  // Handle old state format
  if (state.offerCreationState && !state.offerCreationStates) {
    const offerCreationStates = initializeOfferCreationStates(state.players.length)
    const oldState = state.offerCreationState
    offerCreationStates[oldState.playerId] = oldState
    
    return {
      ...state,
      offerCreationStates,
      offerCreationState: undefined // Remove old field
    }
  }
  
  // Handle missing offerCreationStates
  if (!state.offerCreationStates) {
    return {
      ...state,
      offerCreationStates: initializeOfferCreationStates(state.players.length)
    }
  }
  
  return state
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Let me analyze the acceptance criteria to determine which ones are testable as properties:

### Converting EARS to Properties

Based on the prework analysis, I'll create consolidated properties that eliminate redundancy:

Property 1: State Independence
*For any* game state with multiple players creating offers, each player's offer creation state should be stored and accessed independently using their player ID as the key
**Validates: Requirements 1.1, 3.1, 3.2**

Property 2: State Isolation During Actions
*For any* offer creation action performed by a player, only that player's offer creation state should be modified, leaving all other players' states unchanged
**Validates: Requirements 1.4, 1.5, 3.3**

Property 3: Concurrent State Preservation
*For any* scenario where Player A is in flipping mode and Player B performs offer creation actions, Player A's flipping state should be preserved and Player A should remain able to complete their flip action
**Validates: Requirements 1.2, 1.3**

Property 4: Cross-Mode Consistency
*For any* sequence of offer creation actions, the same actions should produce the same state transitions regardless of whether the game is in local or multiplayer mode
**Validates: Requirements 2.1, 2.3**

Property 5: Validation State Correctness
*For any* offer creation action, the system should validate the action against the correct player's individual state rather than any global or other player's state
**Validates: Requirements 3.4**

Property 6: Phase Progression Correctness
*For any* game state where all eligible players have completed their offers, the system should advance to the next phase
**Validates: Requirements 3.5**

Property 7: UI State Independence
*For any* change in one player's offer creation state, the UI state/props for other players should remain unchanged
**Validates: Requirements 4.3, 4.4**

Property 8: Multiplayer State Synchronization
*For any* offer creation state change in multiplayer mode, the updated state should be properly synchronized across all clients while preserving each player's independent state
**Validates: Requirements 5.1, 5.2, 5.3**

## Error Handling

### Validation Errors
- **Invalid Player ID**: Actions with invalid player IDs should be rejected with clear error messages
- **Invalid State Transitions**: Actions that don't match the player's current offer creation state should be rejected
- **Concurrent Modification**: In multiplayer scenarios, handle race conditions gracefully

### Recovery Scenarios
- **State Corruption**: Implement state validation and recovery mechanisms
- **Missing State**: Initialize missing offer creation states automatically
- **Migration Issues**: Handle legacy state formats gracefully during updates

### Error Messages
```typescript
const ERROR_MESSAGES = {
  INVALID_PLAYER_ID: 'Invalid player ID provided',
  NOT_IN_OFFER_PHASE: 'Offer creation is only allowed during offer phase',
  PLAYER_NOT_ELIGIBLE: 'Player is not eligible to create offers (buyer or already completed)',
  INVALID_STATE_TRANSITION: 'Action not allowed in current offer creation state',
  OFFER_ALREADY_COMPLETE: 'Player has already completed their offer',
  CARD_NOT_FOUND: 'Specified card not found in player hand',
  OFFER_FULL: 'Offer already contains maximum number of cards'
}
```

## Testing Strategy

### Dual Testing Approach
This implementation requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** will verify:
- Specific state transition scenarios
- Edge cases (empty hands, full offers, invalid actions)
- Error conditions and error messages
- Integration between components
- Migration from old state format

**Property-Based Tests** will verify:
- Universal properties across all valid game states
- State isolation and independence properties
- Concurrent operation correctness
- Cross-mode consistency
- State synchronization in multiplayer scenarios

### Property-Based Testing Configuration
- Use Jest with fast-check library for property-based testing
- Configure each test to run minimum 100 iterations
- Each property test must reference its design document property
- Tag format: **Feature: offer-phase-per-player-state-fix, Property {number}: {property_text}**

### Test Data Generation
```typescript
// Generate valid game states with multiple players in various offer creation states
const generateGameStateWithOfferCreation = fc.record({
  players: fc.array(generatePlayer(), { minLength: 2, maxLength: 6 }),
  currentPhase: fc.constant(GamePhase.OFFER_PHASE),
  offerCreationStates: fc.array(fc.oneof(
    fc.constant(null),
    fc.record({
      playerId: fc.nat(),
      mode: fc.oneof(
        fc.constant('selecting'),
        fc.constant('flipping'),
        fc.constant('complete')
      )
    })
  ))
})
```

### Integration Testing
- Test complete offer creation workflows
- Test multiplayer synchronization scenarios  
- Test migration from legacy state format
- Test UI component integration with new state structure

### Performance Testing
- Verify that per-player state access is O(1)
- Test memory usage with large numbers of players
- Validate state update performance in multiplayer scenarios