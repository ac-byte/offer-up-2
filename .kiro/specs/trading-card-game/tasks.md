# Implementation Plan: Trading Card Game

## Overview

This implementation plan breaks down the trading card game into discrete, testable components that build incrementally toward the complete game. The approach prioritizes core game logic first, then UI components, and finally integration. Each task includes property-based tests to validate correctness properties from the design document.

## Tasks

- [x] 1. Set up project structure and core types
  - Create React TypeScript project with testing framework
  - Define core TypeScript interfaces (GameState, Player, Card, GameAction)
  - Set up Jest with fast-check for property-based testing
  - Configure project structure for components, game logic, and tests
  - _Requirements: 33.1, 34.1_

- [x]* 1.1 Write property tests for type definitions
  - **Property 1: Deck composition correctness**
  - **Validates: Requirements 1.1**

- [ ] 2. Implement deck creation and card logic
  - [x] 2.1 Create card factory functions for Thing, Gotcha, and Action cards
    - Implement functions to create cards with correct properties
    - Include card type, subtype, name, setSize, and visual properties
    - _Requirements: 1.2, 1.3, 1.4, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x]* 2.2 Write property tests for card creation
    - **Property 2: Thing card distribution**
    - **Property 3: Gotcha card distribution** 
    - **Property 4: Action card distribution**
    - **Validates: Requirements 1.2, 1.3, 1.4**

  - [x] 2.3 Implement deck creation and shuffling
    - Create complete 120-card deck with correct composition
    - Implement Fisher-Yates shuffle algorithm
    - _Requirements: 1.1, 1.5_

  - [x]* 2.4 Write property tests for deck operations
    - **Property 5: Deck shuffling**
    - **Validates: Requirements 1.5**

- [ ] 3. Implement game state management with reducer
  - [x] 3.1 Create game reducer with initial state
    - Implement useReducer-based state management
    - Handle game initialization actions
    - Support 3-6 player validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 18.1, 19.1_

  - [ ]* 3.2 Write property tests for game initialization
    - **Property 6: Player count validation**
    - **Property 7: Random buyer selection**
    - **Property 8: Player area initialization**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 3.3 Implement phase management system
    - Add phase transitions and validation
    - Implement 10-phase round system
    - Add phase-specific action validation
    - _Requirements: 3.1, 3.3, 3.4, 3.5_

  - [ ]* 3.4 Write property tests for phase management
    - **Property 9: Phase sequence correctness**
    - **Property 10: Phase transition automation**
    - **Property 11: Phase action validation**
    - **Property 12: Game continuation until winner**
    - **Validates: Requirements 3.1, 3.3, 3.4, 3.5**

- [x] 4. Checkpoint - Ensure core game logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement deal phase mechanics
  - [x] 5.1 Create card dealing logic
    - Deal cards to bring all hands to 5 cards
    - Implement sequential dealing (one card per player)
    - Handle draw pile exhaustion and reshuffling
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.2 Write property tests for dealing
    - **Property 13: Hand replenishment**
    - **Property 14: Sequential dealing**
    - **Property 15: Deck reshuffling**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 6. Implement offer phase mechanics
  - [x] 6.1 Create offer placement logic
    - Validate 3-card offers with 2 face down, 1 face up
    - Prevent offer modification once placed
    - Track offer completion for phase advancement
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 6.2 Write property tests for offers
    - **Property 16: Offer card count**
    - **Property 17: Offer face up/down distribution**
    - **Property 18: Offer immutability**
    - **Property 19: Phase advancement condition**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.5**

- [ ] 7. Implement buyer-flip phase mechanics
  - [x] 7.1 Create card flipping logic
    - Allow only buyer to flip one face down card
    - Change card state from face down to face up
    - Advance phase after flip
    - _Requirements: 6.1, 6.2, 6.3, 6.5_

  - [ ]* 7.2 Write property tests for card flipping
    - **Property 20: Buyer flip permissions**
    - **Property 21: Card flip state change**
    - **Property 22: Phase advancement after flip**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

- [ ] 8. Implement action phase mechanics
  - [x] 8.1 Create action card play system
    - Allow players to play action cards from collection
    - Support multiple action card plays
    - Implement immediate effect execution
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 8.2 Implement action phase pass system
    - Create pass counter system to track players with action cards
    - Reset counter when action cards are played
    - Decrement counter when players pass
    - End phase when no players have action cards or passes remaining reaches zero
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 8.3 Write property tests for action phase
    - **Property 23: Action card play permissions**
    - **Property 24: Multiple action card play**
    - **Property 25: Action card restriction**
    - **Property 26: Immediate effect execution**
    - **Property 27: Action phase pass system initialization**
    - **Property 28: Pass counter reset on action card play**
    - **Property 29: Pass counter decrement on player pass**
    - **Property 30: Automatic skipping without pass counter effect**
    - **Property 31: Action phase termination conditions**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5**

- [ ] 9. Implement offer selection and distribution
  - [x] 9.1 Create offer selection logic
    - Allow buyer to select exactly one offer
    - Transfer money bag to selected seller
    - Move selected offer to buyer's collection
    - Return non-selected offers to sellers
    - Clear all offer areas
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 9.2 Write property tests for offer distribution
    - **Property 32: Single offer selection**
    - **Property 33: Money bag transfer**
    - **Property 34: Selected offer distribution**
    - **Property 35: Non-selected offer return**
    - **Property 36: Offer area cleanup**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 10. Implement trade-in mechanics
  - [x] 10.1 Create set identification logic
    - Identify complete Gotcha sets in collections
    - Identify complete Thing sets in collections
    - Implement automatic trade-in system
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 10.2 Implement point calculation system
    - Award points for Thing sets (1 Giant=1pt, 2 Big=1pt, 3 Medium=1pt, 4 Tiny=1pt)
    - Update player point totals
    - _Requirements: 10.4, 10.5_

  - [ ]* 10.3 Write property tests for trade-ins
    - **Property 37: Gotcha set identification**
    - **Property 38: Automatic Gotcha trade-ins**
    - **Property 39: Thing set identification**
    - **Property 40: Thing set point calculation**
    - **Property 41: Point total updates**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

- [x] 10.4 Implement buyer role continuity
  - Handle buyer role continuity (money bag vs actual buyer role)
  - Implement money bag token transfer timing
  - Ensure buyer privileges remain with current buyer throughout round
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

- [ ]* 10.4.1 Write property tests for buyer role continuity
  - **Property 54: Money bag token transfer timing**
  - **Property 55: Buyer role transition timing**
  - **Property 56: Buyer privilege continuity**
  - **Validates: Requirements 25.1, 25.3, 25.5**

- [x] 10.5 Implement Gotcha Bad effects and processing order
  - Implement Gotcha processing order (Bad first, then Twice, then Once)
  - Create Gotcha Bad effect logic (point loss and transfer mechanics)
  - Handle point transfers between players and buyer
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 26.6_

- [ ]* 10.5.1 Write property tests for Gotcha Bad effects
  - **Property 47: Gotcha Bad point penalty**
  - **Property 48: Gotcha Bad point transfer**
  - **Property 49: Gotcha Bad buyer self-effect**
  - **Property 50: Gotcha Bad immediate processing**
  - **Property 60: Gotcha processing order**
  - **Validates: Requirements 23.1, 23.2, 23.3, 23.4, 23.5, 26.6**

- [x] 10.6 Implement Gotcha Once effects
  - Create Gotcha Once effect logic (buyer selects 1 card to steal/discard)
  - Handle buyer affecting own collection (must discard, can't steal)
  - Implement card selection UI for buyer choices
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 24.1, 24.2, 24.3, 24.4, 24.5_

- [ ]* 10.6.1 Write property tests for Gotcha Once effects
  - **Property 42: Gotcha Once card selection**
  - **Property 43: Gotcha Once steal or discard choice**
  - **Property 44: Gotcha Once insufficient cards handling**
  - **Property 51: Buyer own collection discard requirement**
  - **Property 52: Buyer self-steal prevention**
  - **Property 53: Gotcha set self-selection prevention**
  - **Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5, 24.2, 24.3, 24.5**

- [ ] 10.7 Implement Gotcha Twice effects
  - Create Gotcha Twice effect logic (buyer selects 2 cards independently)
  - Reuse Gotcha Once selection logic for each card
  - Handle independent steal/discard choices for each card
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ]* 10.7.1 Write property tests for Gotcha Twice effects
  - **Property 45: Gotcha Twice card selection**
  - **Property 46: Gotcha Twice independent choices**
  - **Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5**

- [ ] 10.8 Implement iterative Gotcha processing mechanics
  - Implement iterative Gotcha processing (continue until no sets remain)
  - Add checks for newly formed Gotcha sets after each round of effects
  - Ensure completion verification before advancing to Thing trade-ins
  - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5_

- [ ]* 10.8.1 Write property tests for iterative processing
  - **Property 57: Iterative Gotcha processing**
  - **Property 58: Gotcha completion verification**
  - **Property 59: Gotcha iteration completeness**
  - **Validates: Requirements 26.1, 26.2, 26.3, 26.4, 26.5**

- [ ] 11. Implement winner determination
  - [x] 11.1 Create win condition logic
    - Check for players with 5+ points
    - Handle tie scenarios (continue game)
    - Declare winner when one player has 5+ points and leads
    - Prevent further actions after winner declared
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [ ]* 11.2 Write property tests for winner determination
    - **Property 61: Win condition checking**
    - **Property 62: Tie handling**
    - **Property 63: Winner declaration**
    - **Property 64: Game end state**
    - **Validates: Requirements 27.1, 27.2, 27.3, 27.5**

- [ ] 12. Checkpoint - Ensure all game logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement player rotation system
  - [x] 13.1 Create rotation logic
    - Implement clockwise rotation starting from buyer
    - Handle buyer-excluded phases (start with player to buyer's right)
    - Add rotation wraparound
    - _Requirements: 29.1, 29.2, 29.3_

  - [x] 13.2 Implement automatic player skipping
    - Skip players with no valid actions
    - Skip buyer in phases where they don't act
    - Continue rotation until all eligible players have opportunity
    - _Requirements: 30.1, 30.2, 30.3, 30.5_

  - [ ]* 13.3 Write property tests for player rotation
    - **Property 65: Clockwise rotation order**
    - **Property 66: Buyer-excluded rotation**
    - **Property 67: Rotation wraparound**
    - **Property 68: Automatic player skipping**
    - **Property 69: Complete rotation coverage**
    - **Validates: Requirements 29.1, 29.2, 29.3, 30.1, 30.2, 30.3, 30.5**

- [ ] 14. Create React UI components
  - [x] 14.1 Create Card component
    - Implement three display states (face up, face down, partial)
    - Add card type styling (blue Thing, red Gotcha, black Action)
    - Include drag and drop functionality
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 32.1_

  - [x] 14.2 Create PlayerArea component
    - Implement Hand, OfferArea, and CollectionArea sub-components
    - Handle card interactions and drag/drop
    - Support different player perspectives
    - _Requirements: 2.3, 16.2, 16.3, 16.4, 16.5_

  - [x] 14.3 Create perspective selector
    - Add dropdown for choosing player perspective
    - Maintain independence from current acting player
    - Update card displays based on selected perspective
    - _Requirements: 31.2, 31.3, 31.4_

  - [x] 14.4 Implement automatic perspective following
    - Automatically update perspective when active player changes
    - Maintain automatic following across all phases and rotations
    - Allow manual override with temporary disable of auto-following
    - Provide visual indication of auto-follow vs manual mode
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [ ]* 14.5 Write property tests for display logic
    - **Property 70: Perspective independence**
    - **Property 71: Card display updates**
    - **Property 72: Perspective switching availability**
    - **Property 73: Card display states**
    - **Property 74: Own hand visibility**
    - **Property 75: Other hand privacy**
    - **Property 76: Collection visibility**
    - **Property 77: Offer card visibility**
    - **Property 78: Partial card content**
    - **Property 79: Partial display conditions**
    - **Property 80: Automatic perspective following**
    - **Validates: Requirements 31.2, 31.3, 31.4, 32.1, 32.2, 32.3, 32.4, 32.5, 33.1, 33.3, 36.1, 36.2**

- [ ] 15. Create GameBoard main component
  - [x] 15.1 Implement main game interface
    - Integrate all player areas
    - Add phase display and instructions
    - Include game controls and status
    - _Requirements: 3.2, 19.2_

  - [x] 15.2 Add game context provider
    - Wrap game with state management context
    - Connect UI components to game reducer
    - Handle action dispatching
    - _Requirements: 34.1, 35.1, 35.3_

- [ ] 16. Implement drag and drop interactions
  - [x] 16.1 Add card dragging for offers
    - Enable dragging cards from hand to offer area
    - Validate offer placement rules
    - Provide visual feedback during drag
    - _Requirements: 5.1, 5.2, 19.4_

  - [ ] 16.2 Add action card interactions
    - Enable playing action cards from collection
    - Handle click interactions for card flipping
    - _Requirements: 6.1, 7.1, 19.4_

- [ ] 17. Add responsive design and styling
  - [ ] 17.1 Implement responsive layout
    - Create mobile-friendly card layouts
    - Add responsive player area arrangements
    - Ensure usability across screen sizes
    - _Requirements: 35.5_

  - [ ] 17.2 Add visual polish
    - Implement card animations and transitions
    - Add hover effects and visual feedback
    - Style phase indicators and game status
    - _Requirements: 35.4_

- [ ]* 18. Write integration tests
  - Test complete game flows from start to finish
  - Test multi-player interactions and edge cases
  - Validate UI and game logic integration
  - _Requirements: All requirements_

- [ ] 19. Final integration and testing
  - [ ] 19.1 Connect all components
    - Wire together all game phases and UI components
    - Ensure proper state flow and action handling
    - Test complete gameplay scenarios
    - _Requirements: 34.1, 35.1, 35.2, 35.3_

  - [ ] 19.2 Add error handling and validation
    - Implement comprehensive error boundaries
    - Add user feedback for invalid actions
    - Handle edge cases and error recovery
    - _Requirements: 3.4, 18.4_

- [ ] 20. Final checkpoint - Complete game testing
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from design
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation throughout development
- The implementation prioritizes game logic first, then UI components, then integration