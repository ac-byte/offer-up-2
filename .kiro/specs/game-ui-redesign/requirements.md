# Requirements Document

## Introduction

Redesign the main game page UI to improve information organization, reduce visual clutter, and create a more focused gaming experience. The redesign consolidates game state information into a comprehensive header, hides debugging tools from regular users, and reorganizes player areas for better usability.

## Glossary

- **Game_Header**: The top section containing game title, phase info, buyer/player status, and card counts
- **Game_Actions**: Interactive messages and controls that appear only when user input is needed
- **Player_Areas**: The main game area showing player collections, offers, and hands
- **Active_Player**: The player whose turn it currently is
- **Debug_Controls**: Administrative tools for testing and debugging (perspective selector, phase controls)
- **Admin_Footer**: Hidden expandable section containing debug controls for administrative use
- **Collapsible_Section**: UI sections that can be expanded or collapsed to save space

## Requirements

### Requirement 1

**User Story:** As a player, I want the game title to match the homepage branding, so that the experience feels consistent throughout the application.

#### Acceptance Criteria

1. THE Game_Header SHALL display "Offer Up" as the game title instead of "Trading Card Game"
2. THE Game_Header SHALL maintain the current round display functionality
3. THE Game_Header SHALL preserve existing styling and layout structure

### Requirement 2

**User Story:** As a player, I want all important game state information consolidated in one place, so that I can quickly understand the current game situation without scanning multiple areas.

#### Acceptance Criteria

1. THE Game_Header SHALL display the current phase name and description in the center
2. THE Game_Header SHALL show buyer and current player information below the phase info
3. THE Game_Header SHALL include draw pile, discard pile, and cards in play counts
4. THE Game_Header SHALL display the highest score among all players
5. THE Game_Header SHALL remove the phase count display (e.g., "3 of 10")

### Requirement 3

**User Story:** As a regular player, I want debugging tools hidden from the main interface, so that the game feels polished and I'm not distracted by development features.

#### Acceptance Criteria

1. THE Debug_Controls SHALL be moved to a hidden Admin_Footer section
2. THE Admin_Footer SHALL be collapsed by default and expandable via a button
3. THE Debug_Controls SHALL include the perspective selector widget
4. THE Debug_Controls SHALL include "Continue to next phase" and "Skip Phase (Debug)" buttons
5. THE Admin_Footer SHALL be accessible but not prominent in the main UI

### Requirement 4

**User Story:** As a player, I want interactive game messages to appear only when I need to take action, so that the interface stays clean when no input is required.

#### Acceptance Criteria

1. THE Game_Actions SHALL be positioned between the header and player areas
2. THE Game_Actions SHALL be hidden when no user interaction is required
3. THE Game_Actions SHALL display messages for Gotcha card processing
4. THE Game_Actions SHALL display messages for action card effects (Add One, Remove One, etc.)
5. THE Game_Actions SHALL automatically show and hide based on game state

### Requirement 5

**User Story:** As a player, I want unused UI sections removed, so that the interface is clean and focused on relevant information.

#### Acceptance Criteria

1. THE System SHALL remove the phase-display area after moving content to header
2. THE System SHALL remove the game-controls area after moving content to admin footer
3. THE System SHALL remove the game-footer area after moving content to header and admin footer
4. THE System SHALL maintain all functionality while removing empty containers

### Requirement 6

**User Story:** As a player, I want player areas organized with collapsible sections, so that I can focus on relevant information for each game phase.

#### Acceptance Criteria

1. WHEN viewing any player area, THE System SHALL make collection, offer, and hand sections collapsible
2. THE System SHALL order player sub-areas as: collection (top), offer (middle), hand (bottom)
3. THE System SHALL provide expand/collapse controls for each sub-area
4. THE System SHALL remember collapse states during gameplay
5. THE System SHALL allow independent collapse control for each player's sub-areas

### Requirement 7

**User Story:** As a player, I want offer areas to automatically show/hide based on game phase, so that I only see relevant information for the current phase.

#### Acceptance Criteria

1. WHEN the current phase is Offer, THE System SHALL expand all offer areas
2. WHEN the current phase is Buyer-flip, THE System SHALL expand all offer areas
3. WHEN the current phase is Action, THE System SHALL expand all offer areas
4. WHEN the current phase is Offer-selection, THE System SHALL expand all offer areas
5. WHEN the current phase is any other phase, THE System SHALL collapse all offer areas

### Requirement 8

**User Story:** As a player, I want the active player's area prominently displayed, so that I can easily see whose turn it is and what actions are available.

#### Acceptance Criteria

1. THE System SHALL split player areas into left and right sections
2. THE System SHALL display the active player's area on the left side
3. THE Active_Player area SHALL have collection and hand sections expanded by default
4. THE Active_Player area SHALL have offer section expanded/collapsed based on current phase
5. THE Active_Player area SHALL be visually distinct from other player areas

### Requirement 9

**User Story:** As a player, I want other players' areas organized efficiently, so that I can monitor game state without the interface taking excessive space.

#### Acceptance Criteria

1. THE System SHALL display non-active players' areas on the right side
2. THE System SHALL stack non-active player areas vertically in player order
3. THE Non_Active_Player areas SHALL have collection sections expanded by default
4. THE Non_Active_Player areas SHALL have offer sections expanded/collapsed based on current phase
5. THE Non_Active_Player areas SHALL have hand sections collapsed by default