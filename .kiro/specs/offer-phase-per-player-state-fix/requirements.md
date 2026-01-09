# Requirements Document

## Introduction

This specification addresses a critical bug in the offer phase where players can become blocked when multiple players are creating offers simultaneously. The issue occurs because there is only one global `offerCreationState` instead of per-player state tracking.

## Glossary

- **Offer_System**: The game subsystem that manages player offer creation during the offer phase
- **Player_Offer_State**: The state tracking a specific player's progress through offer creation
- **Offer_Phase**: The game phase where non-buyer players create their offers
- **Lock_Action**: The action where a player locks their 3 selected cards and prepares to flip one face-up
- **Flip_Action**: The action where a player selects which of their locked cards to turn face-up
- **Blocked_State**: A state where a player cannot complete their offer creation due to state conflicts

## Requirements

### Requirement 1

**User Story:** As a player in multiplayer mode, I want to be able to complete my offer creation independently of other players' actions, so that I don't get stuck in a blocked state.

#### Acceptance Criteria

1. WHEN multiple players are creating offers simultaneously, THE Offer_System SHALL maintain independent state for each player
2. WHEN Player A locks their offer and enters flipping mode, THE Offer_System SHALL preserve Player A's flipping state even if Player B starts creating their offer
3. WHEN Player A is in flipping mode and Player B completes their offer, THE Offer_System SHALL allow Player A to continue flipping their card
4. WHEN a player locks their offer, THE Offer_System SHALL only affect that specific player's state
5. WHEN a player flips their card, THE Offer_System SHALL only complete that specific player's offer creation

### Requirement 2

**User Story:** As a player, I want the offer creation process to work consistently in both local and multiplayer games, so that the game behavior is predictable.

#### Acceptance Criteria

1. WHEN playing in local mode, THE Offer_System SHALL use the same per-player state management as multiplayer mode
2. WHEN switching between local and multiplayer modes, THE Offer_System SHALL maintain consistent behavior
3. WHEN a player creates an offer in any game mode, THE Offer_System SHALL follow the same state transitions

### Requirement 3

**User Story:** As a developer, I want the offer state to be properly isolated per player, so that concurrent offer creation doesn't cause race conditions or state corruption.

#### Acceptance Criteria

1. THE Offer_System SHALL store offer creation state separately for each player
2. WHEN accessing offer creation state, THE Offer_System SHALL use the player ID as the key
3. WHEN a player completes their offer, THE Offer_System SHALL only clear that player's state
4. WHEN validating offer actions, THE Offer_System SHALL only check the relevant player's state
5. WHEN all players complete their offers, THE Offer_System SHALL advance to the next phase

### Requirement 4

**User Story:** As a player, I want clear visual feedback about my offer creation progress, so that I understand what actions are available to me.

#### Acceptance Criteria

1. WHEN I am in selecting mode, THE Offer_System SHALL display appropriate UI controls for card selection
2. WHEN I am in flipping mode, THE Offer_System SHALL display instructions to click a card to flip it
3. WHEN other players are in different offer creation states, THE Offer_System SHALL not affect my UI state
4. WHEN I complete my offer, THE Offer_System SHALL update my UI to reflect the completed state

### Requirement 5

**User Story:** As a system administrator, I want the offer state to be properly synchronized in multiplayer games, so that all players see consistent game state.

#### Acceptance Criteria

1. WHEN a player's offer state changes, THE Offer_System SHALL broadcast the updated state to all connected players
2. WHEN receiving state updates, THE Offer_System SHALL preserve other players' independent offer states
3. WHEN validating multiplayer actions, THE Offer_System SHALL ensure state consistency across all clients
<!-- 4. WHEN a player disconnects during offer creation, THE Offer_System SHALL maintain their offer state for reconnection - Commented out as disconnect handling is not currently supported system-wide -->