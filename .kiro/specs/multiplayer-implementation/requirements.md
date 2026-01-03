# Requirements Document

## Introduction

Transform the single-browser local game into a true multiplayer experience where players connect remotely, join games via shareable codes, and play together with each player seeing their own perspective. This is designed as a simple demo/playtest platform for small groups of friends.

## Glossary

- **Game_Host**: The player who creates a new game and receives the game code
- **Game_Code**: A unique 6-character identifier used to join a specific game
- **Game_Lobby**: The pre-game state where players join and the host can start the game
- **Player_Perspective**: Each player's individual view showing their own cards prominently
- **Game_Server**: The backend service that manages game state and coordinates between players
- **Real_Time_Updates**: Server-sent events that push game state changes to all connected players
- **Turn_Enforcement**: Server-side validation that only allows actions from the appropriate player
- **Spectator_Mode**: View-only access to observe a game in progress (future feature)

## Requirements

### Requirement 1

**User Story:** As a game host, I want to create a new multiplayer game and get a shareable code, so that I can invite my friends to join.

#### Acceptance Criteria

1. WHEN a user clicks "Create Multiplayer Game", THE Game_Server SHALL generate a unique Game_Code
2. THE Game_Server SHALL create a new game instance in the lobby state
3. THE System SHALL display the Game_Code and shareable URL to the host
4. THE System SHALL automatically add the host as the first player in the game
5. THE Game_Code SHALL be exactly 6 characters long and easy to share

### Requirement 2

**User Story:** As a player, I want to join a multiplayer game using a code or URL, so that I can play with my friends.

#### Acceptance Criteria

1. WHEN a user visits a join URL with a valid Game_Code, THE System SHALL display the join form
2. WHEN a user enters their name and clicks join, THE Game_Server SHALL add them to the game lobby
3. THE System SHALL enforce a minimum of 3 players and maximum of 6 players per game
4. WHEN a player joins, THE System SHALL notify all existing players in the lobby
5. IF a Game_Code is invalid or game is full, THEN THE System SHALL display an appropriate error message

### Requirement 3

**User Story:** As a game host, I want to see who has joined my game and start it when ready, so that I can control when gameplay begins.

#### Acceptance Criteria

1. THE Game_Lobby SHALL display all joined players' names in real-time
2. THE Game_Host SHALL see a "Start Game" button when at least 3 players have joined
3. WHEN the host clicks "Start Game", THE Game_Server SHALL transition all players to the game board
4. THE System SHALL prevent new players from joining once the game has started
5. THE System SHALL automatically assign player positions and deal initial cards

### Requirement 4

**User Story:** As a player, I want to see the game from my own perspective, so that I have a personalized view of my cards and game state.

#### Acceptance Criteria

1. THE System SHALL automatically set each player's perspective to their own player ID
2. THE Player_Perspective SHALL show the player's own cards prominently in the active player area
3. THE Player_Perspective SHALL show other players' areas on the right side with appropriate information hiding
4. THE System SHALL remove the perspective selector from the main game interface
5. THE System SHALL hide sensitive information (other players' hands) from each player's view

### Requirement 5

**User Story:** As a player, I want my actions to be synchronized with other players in real-time, so that we all see the same game state.

#### Acceptance Criteria

1. WHEN any player performs an action, THE Game_Server SHALL validate and process the action
2. THE Game_Server SHALL broadcast updated game state to all connected players via Real_Time_Updates
3. THE System SHALL update each player's interface immediately when receiving state updates
4. THE Game_Server SHALL maintain authoritative game state and reject invalid actions
5. THE System SHALL handle network delays gracefully without breaking game flow

### Requirement 6

**User Story:** As a player, I want turn-based phases to be properly enforced, so that the game maintains proper order and fairness.

#### Acceptance Criteria

1. DURING the Offer Phase, THE System SHALL allow all players to place offers simultaneously
2. DURING the Action Phase, THE Game_Server SHALL enforce turn order and reject out-of-turn actions
3. DURING buyer-only phases (Offer Selection, Gotcha processing), THE System SHALL only accept actions from the current buyer
4. THE System SHALL clearly indicate whose turn it is during turn-based phases
5. THE Game_Server SHALL automatically advance phases when all required actions are completed

### Requirement 7

**User Story:** As a player, I want the game to continue smoothly even if someone disconnects, so that network issues don't ruin the game experience.

#### Acceptance Criteria

1. WHEN a player disconnects during gameplay, THE Game_Server SHALL continue the game with remaining players
2. THE System SHALL skip disconnected players' turns automatically after a reasonable timeout
3. THE System SHALL notify remaining players when someone disconnects
4. THE Game_Server SHALL remove disconnected players from turn rotation
5. IF too few players remain (less than 3), THEN THE System SHALL end the game gracefully

### Requirement 8

**User Story:** As a developer, I want the multiplayer system to be simple and reliable for small-scale playtesting, so that friends can easily host and join games.

#### Acceptance Criteria

1. THE Game_Server SHALL store all game state in memory without requiring a database
2. THE System SHALL support up to 5 concurrent games with 6 players each
3. THE Game_Server SHALL clean up completed or abandoned games automatically
4. THE System SHALL use simple HTTP + Server-Sent Events for communication
5. THE System SHALL be deployable as a single local development server

### Requirement 9

**User Story:** As a player, I want clear feedback about connection status and game state, so that I understand what's happening during multiplayer gameplay.

#### Acceptance Criteria

1. THE System SHALL display connection status indicators for all players
2. THE System SHALL show "Waiting for [Player Name]" messages during turn-based actions
3. THE System SHALL provide clear error messages for network or game state issues
4. THE System SHALL indicate when the game is waiting for server responses
5. THE System SHALL display appropriate loading states during game transitions