# Implementation Plan: Game UI Redesign

## Overview

Transform the main game page UI by consolidating information into a comprehensive header, hiding debug tools, implementing contextual game actions, and reorganizing player areas with collapsible sections and active player prominence.

## Tasks

- [x] 1. Update game title branding
  - Change "Trading Card Game" to "Offer Up" in GameBoard component
  - Update any related title references for consistency
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Enhance game header with consolidated information
  - [x] 2.1 Restructure header with two-row layout
    - **Top row**: "Offer Up" (left) | Phase name (center) | Draw/discard counts (right)
    - **Bottom row**: Round number (left) | Buyer/player status (center) | Cards in play + highest score (right)
    - Remove phase info from phase-display area
    - Style phase name prominently in header center
    - _Requirements: 2.1, 2.2_

  - [x] 2.2 Move card counts to header right side
    - Move draw pile and discard pile counts from game-controls to header top-right
    - Add cards in play count calculation and display to header bottom-right
    - Style counts vertically within their header sections
    - _Requirements: 2.3_

  - [x] 2.3 Move additional info to header
    - Move round number to header bottom-left
    - Move highest score from game-footer to header bottom-right (below cards in play)
    - Move buyer/player status to header bottom-center
    - Style consistently with other header elements
    - _Requirements: 2.4_

  - [x] 2.4 Remove phase count display
    - Remove "Phase X of 10" indicator
    - Clean up related styling and logic
    - _Requirements: 2.5_

- [x] 3. Create admin footer for debug controls
  - [x] 3.1 Create AdminFooter component
    - Design collapsible footer component
    - Add expand/collapse button and state management
    - Style as subtle administrative interface
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Move debug controls to admin footer
    - Move PerspectiveSelector to admin footer
    - Move "Continue to next phase" and "Skip Phase (Debug)" buttons
    - Ensure all debug functionality remains accessible
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 4. Implement contextual game actions
  - [x] 4.1 Create conditional game actions visibility
    - Add logic to show/hide game actions based on game state
    - Move game actions between header and player areas
    - Hide when no user interaction is required
    - _Requirements: 4.1, 4.2, 4.5_
 
  - [x] 4.2 Preserve all interactive game messages
    - Ensure Gotcha card processing messages still appear
    - Ensure action card effect messages still appear
    - Maintain all existing interaction functionality
    - _Requirements: 4.3, 4.4_

- [x] 5. Remove empty UI sections
  - Remove phase-display area after moving content to header
  - Remove game-controls area after moving content to admin footer
  - Remove game-footer area after moving content to header
  - Clean up related CSS and component references
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Implement collapsible player sub-areas
  - [x] 6.1 Create CollapsibleSection component
    - Design reusable collapsible section with expand/collapse controls
    - Add state management for expanded/collapsed state
    - Style with appropriate visual indicators
    - _Requirements: 6.1, 6.3_

  - [x] 6.2 Refactor PlayerArea to use collapsible sections
    - Convert collection, offer, and hand to collapsible sections
    - Order sections as: collection (top), offer (middle), hand (bottom)
    - Implement independent collapse control for each section
    - _Requirements: 6.2, 6.4, 6.5_

- [x] 7. Implement phase-based offer visibility
  - Add logic to auto-expand offers in relevant phases (Offer, Buyer-flip, Action, Offer-selection)
  - Add logic to auto-collapse offers in other phases
  - Ensure manual collapse/expand still works in relevant phases
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. Create split player areas layout
  - [ ] 8.1 Implement active player prominence
    - Split player areas into left (active) and right (others) sections
    - Display active player area on left with full prominence
    - Add visual distinction for active player area
    - _Requirements: 8.1, 8.2, 8.5_

  - [ ] 8.2 Configure active player area defaults
    - Set collection and hand expanded by default for active player
    - Set offer expanded/collapsed based on phase for active player
    - Ensure active player area is easily identifiable
    - _Requirements: 8.3, 8.4_

- [ ] 9. Organize other players' areas
  - [ ] 9.1 Implement right-side player stacking
    - Stack non-active players vertically on right side
    - Maintain player order in stacking
    - Optimize width for multiple players
    - _Requirements: 9.1, 9.2_

  - [ ] 9.2 Configure other players' area defaults
    - Set collection expanded by default for other players
    - Set offer expanded/collapsed based on phase for other players
    - Set hand collapsed by default for other players
    - _Requirements: 9.3, 9.4, 9.5_

- [ ] 10. Update styling and responsive design
  - Update CSS for new layout structure
  - Ensure responsive behavior across screen sizes
  - Maintain visual consistency with existing design system
  - Test layout with different player counts (3-6 players)

- [ ] 11. Integration testing and validation
  - Test all game phases with new UI layout
  - Verify all existing functionality works with new design
  - Test admin controls accessibility and functionality
  - Test collapsible sections across different game states
  - Ensure no regressions in game logic or user interactions

- [ ] 12. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise
  - Verify the redesign improves user experience
  - Confirm all requirements are met
  - Test with multiple players and different screen sizes

## Notes

- This is a significant UI overhaul that affects the main game experience
- All existing functionality must be preserved while improving organization
- The design should feel more polished and focused for regular players
- Debug tools remain accessible but are hidden from the main interface
- Layout should adapt gracefully to different player counts and screen sizes