# Implementation Plan: Action Card Player Advancement Fix

## Overview

Fix the premature player advancement issue by standardizing the action card execution flow. Remove immediate player advancement from `PLAY_ACTION_CARD` and ensure all action cards advance the player only after their effects are complete.

## Tasks

- [x] 1. Remove premature player advancement from PLAY_ACTION_CARD
  - Modify the `PLAY_ACTION_CARD` case in gameReducer.ts
  - Remove the call to `advanceToNextEligiblePlayerInActionPhase()` after executing action card effect
  - Keep all existing action card effect setup logic
  - _Requirements: 1.1, 1.4, 3.3_

- [ ]* 1.1 Write property test for player advancement timing
  - **Property 1: Player advancement only after effect completion**
  - **Validates: Requirements 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3**

- [ ] 2. Verify existing interactive effect completion handlers
  - Review all SELECT_* action handlers (SELECT_ADD_ONE_OFFER, SELECT_FLIP_ONE_CARD, etc.)
  - Confirm they all call `advanceToNextEligiblePlayerInActionPhase()` when effects complete
  - Document any missing advancement calls
  - _Requirements: 1.2, 3.2_

- [ ]* 2.1 Write property test for effect state consistency
  - **Property 2: Effect state consistency**
  - **Validates: Requirements 1.1, 1.4, 3.3**

- [ ] 3. Add support for immediate action card effects (future-proofing)
  - Modify `executeActionCardEffect` to handle immediate completion
  - Add helper function to determine if an effect should complete immediately
  - For immediate effects, call advancement directly from `executeActionCardEffect`
  - _Requirements: 1.3, 3.1_

- [ ]* 3.1 Write unit tests for immediate action card effects
  - Test immediate effect completion and advancement
  - Test edge cases with unknown action card subtypes
  - _Requirements: 1.3, 3.1_

- [ ] 4. Checkpoint - Test existing action card functionality
  - Run all existing action card tests to ensure no regressions
  - Test each interactive action card type (Add One, Remove One, Remove Two, Flip One, Steal A Point)
  - Verify player advancement occurs at correct times
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 4.1 Write property test for functionality preservation
  - **Property 3: Action card functionality preservation**
  - **Validates: Requirements 3.4**

- [ ] 5. Integration testing and validation
  - Test complete action phase scenarios with multiple action cards
  - Verify proper player rotation after action card effects
  - Test edge cases like action phase ending during effect resolution
  - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.2, 3.3, 3.4_

- [ ]* 5.1 Write integration tests for action phase flow
  - Test multi-player action phase scenarios
  - Test action phase ending during effect resolution
  - _Requirements: All requirements_

- [ ] 6. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise
  - Verify the fix resolves the original issue
  - Confirm no existing functionality is broken

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The main fix is in task 1 - removing premature advancement
- Tasks 2-3 are for verification and future-proofing
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests ensure the complete flow works correctly