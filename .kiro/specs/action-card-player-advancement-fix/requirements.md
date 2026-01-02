# Requirements Document

## Introduction

Fix the premature player advancement issue during the action phase when action cards requiring human interaction are played. Currently, the active player advances immediately upon playing an action card, but should only advance after the action card's execution is complete.

## Glossary

- **Action_Card**: A card with type "action" that can be played during the action phase
- **Interactive_Action_Card**: An action card that requires human interaction to complete (Add One, Remove One, Remove Two, Flip One, Steal A Point)
- **Non_Interactive_Action_Card**: An action card that executes immediately without requiring human interaction
- **Action_Phase**: The phase where players can play action cards from their collection
- **Player_Advancement**: Moving to the next eligible player in the action phase rotation
- **Effect_State**: Game state that tracks pending action card effects requiring user interaction

## Requirements

### Requirement 1

**User Story:** As a player, I want the active player to remain active while completing an interactive action card, so that the turn order is correct and I can complete my action before the next player's turn.

#### Acceptance Criteria

1. WHEN a player plays an interactive action card, THE Game_System SHALL keep the current player active until the action card effect is complete
2. WHEN an interactive action card effect is complete, THE Game_System SHALL advance to the next eligible player
3. WHEN a player plays a non-interactive action card, THE Game_System SHALL immediately advance to the next eligible player
4. WHEN an action card creates an effect state (Add One, Remove One, etc.), THE Game_System SHALL not advance the player until the effect state is cleared

### Requirement 2

**User Story:** As a player, I want interactive action cards to be fully resolved before player advancement, so that the game flow is logical and predictable.

#### Acceptance Criteria

1. WHEN Add One effect is active, THE Game_System SHALL not advance the player until both hand card and offer selections are complete
2. WHEN Remove One effect is active, THE Game_System SHALL not advance the player until card removal is complete
3. WHEN Remove Two effect is active, THE Game_System SHALL not advance the player until both card removals are complete
4. WHEN Flip One effect is active, THE Game_System SHALL not advance the player until card flipping is complete
5. WHEN Steal A Point effect is active, THE Game_System SHALL not advance the player until target selection and point transfer are complete

### Requirement 3

**User Story:** As a developer, I want the action card execution logic to distinguish between interactive and non-interactive cards, so that player advancement happens at the correct time.

#### Acceptance Criteria

1. THE Game_System SHALL identify which action cards require human interaction
2. THE Game_System SHALL only advance the player after interactive action cards are fully resolved
3. THE Game_System SHALL maintain the current player index during interactive action card execution
4. THE Game_System SHALL preserve all existing action card functionality while fixing the advancement timing