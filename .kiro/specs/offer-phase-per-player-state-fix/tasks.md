# Implementation Plan: Offer Phase Per-Player State Fix

## Overview

This implementation plan converts the single global `offerCreationState` to a per-player array `offerCreationStates`, similar to how `actionPhaseDoneStates` is implemented. The tasks are structured to make incremental changes while maintaining backward compatibility and ensuring thorough testing.

## Tasks

- [x] 1. Update type definitions and interfaces
  - Update GameState interface to replace `offerCreationState` with `offerCreationStates` array
  - Add helper type definitions for state management
  - Update both client and server type files
  - _Requirements: 3.1, 3.2_

- [ ] 2. Implement state management helper functions
  - [x] 2.1 Create state access and manipulation helpers
    - Implement `getPlayerOfferCreationState()` function
    - Implement `setPlayerOfferCreationState()` function  
    - Implement `initializeOfferCreationStates()` function
    - _Requirements: 3.1, 3.2_

  - [ ]* 2.2 Write property test for state access helpers
    - **Property 1: State Independence**
    - **Validates: Requirements 1.1, 3.1, 3.2**

  - [x] 2.3 Create state transition helper functions
    - Implement `initializePlayerOfferCreation()` function
    - Implement `completePlayerOfferCreation()` function
    - Implement `clearPlayerOfferCreationState()` function
    - _Requirements: 1.4, 1.5, 3.3_

  - [ ]* 2.4 Write property test for state transition helpers
    - **Property 2: State Isolation During Actions**
    - **Validates: Requirements 1.4, 1.5, 3.3**

- [ ] 3. Update game reducer for client-side
  - [x] 3.1 Update initial state creation
    - Modify `createInitialGameState()` to initialize `offerCreationStates` array
    - Update all test fixtures and mock states
    - _Requirements: 3.1_

  - [x] 3.2 Update offer-related action handlers
    - Modify `MOVE_CARD_TO_OFFER` handler to use per-player state
    - Modify `MOVE_CARD_TO_HAND` handler to use per-player state
    - Modify `LOCK_OFFER_FOR_FLIPPING` handler to use per-player state
    - Modify `FLIP_OFFER_CARD` handler to use per-player state
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 3.4_

  - [ ]* 3.3 Write property test for concurrent state preservation
    - **Property 3: Concurrent State Preservation**
    - **Validates: Requirements 1.2, 1.3**

  - [x] 3.4 Update phase transition logic
    - Modify `areAllOfferCreationsComplete()` to check per-player states
    - Update offer phase initialization logic
    - _Requirements: 3.5_

  - [ ]* 3.5 Write property test for phase progression
    - **Property 6: Phase Progression Correctness**
    - **Validates: Requirements 3.5**

- [ ] 4. Update game reducer for server-side
  - [x] 4.1 Mirror client-side changes in server reducer
    - Update all offer-related action handlers
    - Update phase transition logic
    - Update state initialization
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.2 Write property test for validation state correctness
    - **Property 5: Validation State Correctness**
    - **Validates: Requirements 3.4**

- [ ] 5. Update UI components
  - [x] 5.1 Update GameBoard component
    - Modify props passed to PlayerArea components to use per-player state
    - Update offer creation state access logic
    - _Requirements: 4.3, 4.4_

  - [x] 5.2 Update PlayerArea component
    - Modify offer creation state checks to use player-specific state
    - Update UI rendering logic for offer creation modes
    - _Requirements: 4.3, 4.4_

  - [ ]* 5.3 Write property test for UI state independence
    - **Property 7: UI State Independence**
    - **Validates: Requirements 4.3, 4.4**

- [ ]* 6. Implement backward compatibility and migration
  - [ ]* 6.1 Create state migration function
    - Implement `migrateOfferCreationState()` to handle legacy state format
    - Add migration logic to game state loading
    - _Requirements: 2.1, 2.3_

  - [ ]* 6.2 Write unit tests for migration logic
    - Test migration from old single state format
    - Test handling of missing state arrays
    - _Requirements: 2.1, 2.3_

- [ ] 7. Update multiplayer synchronization
  - [x] 7.1 Update server-side state broadcasting
    - Ensure per-player offer states are properly synchronized
    - Update state validation for multiplayer actions
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 7.2 Write property test for multiplayer synchronization
    - **Property 8: Multiplayer State Synchronization**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Update existing tests and add integration tests
  - [ ] 9.1 Update existing unit tests
    - Fix all tests that reference the old `offerCreationState` field
    - Update test fixtures and mock data
    - _Requirements: All_

  - [ ]* 9.2 Write property test for cross-mode consistency
    - **Property 4: Cross-Mode Consistency**
    - **Validates: Requirements 2.1, 2.3**

  - [ ]* 9.3 Write integration tests for complete offer creation workflows
    - Test full offer creation flow with multiple concurrent players
    - Test edge cases and error conditions
    - _Requirements: All_

- [ ] 10. Final validation and cleanup
  - [ ] 10.1 Remove deprecated code and comments
    - Remove any references to old `offerCreationState` field
    - Clean up temporary migration code if no longer needed
    - Update documentation and comments

  - [ ] 10.2 Performance validation
    - Verify state access performance is O(1)
    - Test memory usage with multiple players
    - _Requirements: 3.1, 3.2_

- [ ] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation maintains backward compatibility during migration
- State access is optimized for O(1) performance using array indexing