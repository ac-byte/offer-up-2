# Multiplayer Phase Progression Fix - Design

## Overview

This design addresses the issue where multiplayer games get stuck in the buyer flip phase and don't progress to the action phase. The root cause is that the server-side game reducer lacks the comprehensive phase initialization logic present in the client-side version.

## Architecture

The fix involves copying the missing phase progression and initialization functions from the client-side game reducer to the server-side version, ensuring both implementations are synchronized.

### Current State Analysis

**Client-Side (Working)**:
- Uses `advanceToNextPhaseWithInitialization()` for phase transitions
- Includes comprehensive phase initialization functions
- Properly handles action phase setup and state management

**Server-Side (Broken)**:
- Uses direct phase assignment (`newState.currentPhase = GamePhase.ACTION_PHASE`)
- Missing phase initialization functions
- No proper action phase state setup

## Components and Interfaces

### Phase Progression Functions

#### `advanceToNextPhaseWithInitialization(state: GameState): GameState`
**Purpose**: Main phase transition function that advances phase and initializes new phase state
**Location**: `server/src/game-logic/gameReducer.ts`
**Dependencies**: 
- `advanceToNextPhase()` - determines next phase
- `initializeActionPhase()` - sets up action phase
- Other phase initialization functions

#### `initializeActionPhase(state: GameState): GameState`
**Purpose**: Initialize action phase state when entering action phase
**Responsibilities**:
- Reset action phase done states for all players
- Clear any previous action phase effects
- Set up action phase-specific state

#### `advanceToNextPhase(currentPhase: GamePhase, round: number): {nextPhase: GamePhase, nextRound: number}`
**Purpose**: Determine the next phase based on current phase and round
**Logic**: Follow the standard game phase sequence

#### `getPhaseInstructions(phase: GamePhase): string`
**Purpose**: Get human-readable instructions for each phase
**Returns**: Descriptive text for the current phase

### Modified Functions

#### `flipCard(state: GameState, offerId: number, cardIndex: number): GameState`
**Current Implementation**:
```typescript
// Automatically advance to action phase after flip
newState.currentPhase = GamePhase.ACTION_PHASE
```

**New Implementation**:
```typescript
// Automatically advance to action phase after flip with proper initialization
return advanceToNextPhaseWithInitialization(newState)
```

## Data Models

### GameState Extensions
No new data model changes required. The existing GameState interface already supports all necessary fields for phase progression.

### Phase Initialization State
The action phase initialization will properly set:
- `actionPhaseDoneStates`: Reset to all false
- `phaseInstructions`: Updated to action phase instructions
- Any action card effect states: Cleared/reset

## Implementation Strategy

### Phase 1: Copy Core Functions
1. Copy `advanceToNextPhaseWithInitialization` from client to server
2. Copy `advanceToNextPhase` function
3. Copy `getPhaseInstructions` function
4. Copy `initializeActionPhase` function

### Phase 2: Update flipCard Function
1. Replace direct phase assignment with `advanceToNextPhaseWithInitialization` call
2. Test that buyer flip properly advances to action phase

### Phase 3: Handle Edge Cases
1. Ensure proper handling when no players have action cards
2. Verify phase skipping logic works correctly
3. Test all phase transitions for consistency

### Phase 4: Validation and Testing
1. Test complete game flow from buyer flip through action phase
2. Verify multiplayer games don't get stuck
3. Ensure no regression in existing functionality

## Error Handling

### Phase Transition Failures
- If phase advancement fails, maintain current state
- Log errors for debugging
- Ensure game doesn't enter invalid state

### Invalid Phase States
- Validate phase transitions are legal
- Prevent advancing to phases that don't make sense
- Handle edge cases gracefully

### Action Phase Initialization Failures
- If action phase can't be initialized, fall back to basic phase change
- Ensure game can continue even if initialization partially fails

## Testing Strategy

### Unit Tests
- Test `advanceToNextPhaseWithInitialization` with various phase transitions
- Test `initializeActionPhase` properly resets state
- Test `flipCard` advances phase correctly

### Integration Tests
- Test complete buyer flip → action phase flow
- Test action phase → next phase transitions
- Test games with no action cards skip action phase

### Manual Testing
- Start multiplayer game and progress to buyer flip phase
- Flip a card and verify game advances to action phase
- Verify players can play action cards after phase transition
- Test complete game flow to ensure no other phase progression issues

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Buyer Flip Advances to Action Phase
*For any* game state in buyer flip phase, when a card is flipped, the game should advance to action phase
**Validates: Requirements AC1**

### Property 2: Action Phase Proper Initialization
*For any* game state entering action phase, all action phase done states should be reset to false and phase instructions should be updated appropriately
**Validates: Requirements AC2**

### Property 3: Action Phase Skipping When No Action Cards
*For any* game state where no players have action cards in their collection, advancing from buyer flip phase should skip action phase and proceed to the next appropriate phase
**Validates: Requirements AC3**

## Implementation Notes

### Function Copying Strategy
- Copy functions exactly from client-side to maintain consistency
- Adapt only for server-side type differences if necessary
- Preserve all logic and edge case handling

### Testing Approach
- Focus on the specific buyer flip → action phase transition
- Verify no regression in other phase transitions
- Test with various game states and player configurations

### Rollback Plan
- If issues arise, can temporarily revert to direct phase assignment
- Implement gradual rollout by testing specific phase transitions first
- Maintain backward compatibility during transition