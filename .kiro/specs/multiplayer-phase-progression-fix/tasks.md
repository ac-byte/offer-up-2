# Implementation Plan: Multiplayer Phase Progression Fix

## Overview

Fix the multiplayer game phase progression issue where games get stuck in buyer flip phase by copying the missing phase initialization functions from the client-side game reducer to the server-side version.

## Tasks

- [x] 1. Copy core phase progression functions from client to server
  - Copy `advanceToNextPhaseWithInitialization` function from `src/game-logic/gameReducer.ts` to `server/src/game-logic/gameReducer.ts`
  - Copy `advanceToNextPhase` function for determining next phase
  - Copy `getPhaseInstructions` function for phase descriptions
  - Ensure all dependencies and helper functions are included
  - _Requirements: TR1, TR2_

- [x] 2. Copy action phase initialization function
  - Copy `initializeActionPhase` function from client-side to server-side
  - Ensure proper action phase state reset logic is included
  - Copy any related helper functions for action phase setup
  - _Requirements: TR1, TR3_

- [x] 3. Update flipCard function to use proper phase advancement
  - Replace direct phase assignment with `advanceToNextPhaseWithInitialization` call
  - Remove the line `newState.currentPhase = GamePhase.ACTION_PHASE`
  - Add `return advanceToNextPhaseWithInitialization(newState)` instead
  - _Requirements: AC1, TR2_

- [x] 4. Copy additional phase initialization functions
  - Copy any other phase initialization functions that may be needed
  - Include `handleDealPhase`, `handleGotchaTradeinsPhase`, `handleThingTradeinsPhase` if they exist
  - Copy `handleBuyerAssignmentPhase` and `handleWinnerDeterminationPhase` functions
  - Ensure complete phase initialization coverage
  - _Requirements: TR1, AC4_

- [ ]* 5. Write property test for buyer flip phase advancement
  - **Property 1: Buyer Flip Advances to Action Phase**
  - **Validates: Requirements AC1**

- [ ]* 6. Write property test for action phase initialization
  - **Property 2: Action Phase Proper Initialization**
  - **Validates: Requirements AC2**

- [ ]* 7. Write property test for action phase skipping
  - **Property 3: Action Phase Skipping When No Action Cards**
  - **Validates: Requirements AC3**

- [ ] 8. Test the fix with multiplayer game
  - Start a multiplayer game and progress to buyer flip phase
  - Flip a card and verify game advances to action phase
  - Verify players can interact with action phase properly
  - Test complete game flow to ensure no regression
  - _Requirements: AC1, AC2_

- [ ] 9. Verify no regression in existing functionality
  - Test that other phase transitions still work correctly
  - Verify local single-player games are unaffected
  - Test edge cases like games with no action cards
  - Ensure all existing multiplayer functionality works
  - _Requirements: AC3, AC4_

## Notes

- Focus on copying functions exactly from client-side to maintain consistency
- The client-side game reducer is working correctly, so we're synchronizing the server-side version
- Test thoroughly to ensure the fix works and doesn't break existing functionality
- Tasks marked with `*` are optional property-based tests for comprehensive validation