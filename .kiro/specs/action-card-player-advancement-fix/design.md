# Design Document

## Overview

This design addresses the premature player advancement issue in the action phase when interactive action cards are played. The current implementation advances to the next player immediately after playing an action card, but should wait until the action card's effect is completely resolved for interactive cards.

## Architecture

The fix involves standardizing the action card execution flow so that ALL action cards follow the same lifecycle, with player advancement occurring only after the action card effect is completely resolved.

### Current Flow (Problematic)
1. Player plays action card
2. Action card is removed from collection and added to discard pile
3. Action card effect is executed (creates effect state for interactive cards)
4. **Player is immediately advanced** ← PROBLEM
5. User interactions complete the effect later (which also try to advance player)

### New Flow (Standardized)
1. Player plays action card
2. Action card is removed from collection and added to discard pile
3. Action card effect is started
4. Action card effect is completed (immediately for simple effects, after user interaction for complex effects)
5. **Player advancement occurs only at effect completion**

This approach treats all action cards uniformly - the only difference is whether the effect completes immediately or requires user interaction.

## Components and Interfaces

### Modified Functions

#### `gameReducer` - PLAY_ACTION_CARD case
- **Current**: Always advances player after executing action card effect
- **New**: Removes immediate player advancement - lets effect completion handle advancement

#### `executeActionCardEffect`
- **Current**: Sets up effect states for interactive cards, returns immediately
- **New**: For simple/immediate effects, completes the effect and triggers advancement
- **New**: For interactive effects, sets up effect state (no change to current behavior)

#### All Interactive Effect Completion Handlers
- **Current**: Already call `advanceToNextEligiblePlayerInActionPhase()` when effects complete
- **New**: No changes needed - they already handle advancement correctly

### Action Card Effect Lifecycle

#### Interactive Action Cards (existing behavior preserved)
- `add-one`: Effect completes when both hand card and offer are selected
- `remove-one`: Effect completes when card is removed from offer
- `remove-two`: Effect completes when both cards are removed
- `flip-one`: Effect completes when card is flipped
- `steal-point`: Effect completes when target is selected and points transferred

#### Simple/Immediate Action Cards (future-proofing)
- Any action card that doesn't require user interaction
- Effect starts and completes immediately in `executeActionCardEffect`
- Advancement is triggered immediately upon completion

## Data Models

No new data models are required. The existing effect state structures already track when interactive action cards are pending:

- `flipOneEffectState`
- `addOneEffectState` 
- `removeOneEffectState`
- `removeTwoEffectState`
- `stealAPointEffectState`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After reviewing all the testable acceptance criteria, I identified several properties that can be consolidated:

- Properties 1.1, 1.4, 2.1-2.5, and 3.3 all test the same core behavior: player doesn't advance while interactive effects are active
- Properties 1.2 and 3.2 both test that advancement occurs after interactive effects complete
- Property 3.4 is about preserving existing functionality, which is covered by testing that all effects still work

The consolidated properties provide comprehensive coverage without redundancy:

### Property 1: Player advancement only after effect completion
*For any* action card played during action phase, the current player should only advance after the action card's effect is completely resolved
**Validates: Requirements 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3**

### Property 2: Effect state consistency
*For any* action card with an active effect state, the current player index should remain unchanged until the effect state is cleared
**Validates: Requirements 1.1, 1.4, 3.3**

### Property 3: Action card functionality preservation
*For any* action card effect, all existing functionality should work correctly after removing premature player advancement
**Validates: Requirements 3.4**

<function_calls>
<invoke name="prework">
<parameter name="featureName">action-card-player-advancement-fix

## Error Handling

### Invalid Action Card Types
- If an unknown action card subtype is encountered, treat it as non-interactive (safe default)
- Log warning for unknown subtypes to aid debugging

### Effect State Consistency
- Ensure effect states are properly cleared when effects complete
- Handle edge cases where effect states might become orphaned

### Player Advancement Edge Cases
- Handle cases where no eligible players remain after effect completion
- Ensure proper phase transitions when action phase ends during effect resolution

## Testing Strategy

### Dual Testing Approach
- **Unit tests**: Test specific action card types and edge cases
- **Property tests**: Verify universal properties across all action card interactions
- Both approaches are complementary and necessary for comprehensive coverage

### Unit Testing Focus
- Test each interactive action card type individually
- Test the `isInteractiveActionCard` helper function with all known card types
- Test edge cases like unknown action card subtypes
- Test integration points between action card effects and player advancement

### Property-Based Testing Configuration
- Use fast-check library for property-based testing
- Configure each test to run minimum 100 iterations
- Each property test must reference its design document property
- Tag format: **Feature: action-card-player-advancement-fix, Property {number}: {property_text}**

### Property Test Implementation
Each correctness property will be implemented as a property-based test:

1. **Property 1**: Generate random action card scenarios, verify player advancement only occurs after effect completion
2. **Property 2**: Generate game states with active effect states, verify player index preservation
3. **Property 3**: Generate all action card scenarios, verify all effects still work correctly after the fix

### Test Coverage Requirements
- All interactive action card types must be covered
- All effect state transitions must be tested
- Player advancement logic must be thoroughly validated
- Regression tests to ensure existing functionality is preserved