# Requirements Document

## Introduction

A digital trading card game implemented as a React application featuring a fixed deck composition with Thing cards, Gotcha cards, and Action cards. The game supports 3-6 players through structured round-based gameplay with buying, selling, and point collection mechanics.

## Glossary

- **Game_System**: The complete trading card game application
- **Player**: A human user participating in the game (3-6 players supported)
- **Buyer**: The player who holds the money bag and selects offers during a round
- **Seller**: All players except the Buyer during a round
- **Thing_Card**: Cards that can be traded in sets for points (Giant, Big, Medium, Tiny)
- **Gotcha_Card**: Cards that cause negative effects (Once, Twice, Bad)
- **Action_Card**: Cards that provide special abilities during the Action phase
- **Offer_Area**: Where Sellers place their 3-card offers (2 face down, 1 face up)
- **Collection_Area**: Where players store their accumulated cards
- **Hand**: A player's current cards (maximum 5 cards)
- **Money_Bag**: Token that designates the current Buyer
- **Draw_Pile**: The main deck from which cards are dealt
- **Discard_Pile**: Used cards that can be reshuffled into the draw pile

## Requirements

### Requirement 1: Fixed Deck Composition

**User Story:** As a player, I want to play with a standardized deck, so that all games have consistent card distribution and balance.

#### Acceptance Criteria

1. THE Game_System SHALL create a deck with exactly 65 Thing cards, 32 Gotcha cards, and 23 Action cards
2. THE Game_System SHALL include 4 Giant Thing cards, 16 Big Thing cards, 25 Medium Thing cards, and 20 Tiny Thing cards
3. THE Game_System SHALL include 10 Gotcha Once cards, 10 Gotcha Twice cards, and 12 Gotcha Bad cards
4. THE Game_System SHALL include 5 Flip One cards, 6 Add One cards, 6 Remove One cards, 3 Remove Two cards, and 3 Steal A Point cards
5. THE Game_System SHALL shuffle the complete deck before game start

### Requirement 2: Game Initialization and Player Setup

**User Story:** As a player, I want to start a game with 3-6 players, so that I can enjoy the game with the appropriate number of participants.

#### Acceptance Criteria

1. THE Game_System SHALL support exactly 3 to 6 players per game
2. WHEN a game starts, THE Game_System SHALL randomly select one player to receive the money bag
3. THE Game_System SHALL create an Offer area and Collection area for each player
4. THE Game_System SHALL initialize each player's hand as empty
5. THE Game_System SHALL display all player areas clearly on the interface

### Requirement 3: Round-Based Game Flow

**User Story:** As a player, I want the game to follow a structured 10-phase round system, so that gameplay is organized and predictable.

#### Acceptance Criteria

1. THE Game_System SHALL execute rounds in the following order: Buyer assignment, Deal, Offer phase, Buyer-flip phase, Action phase, Offer selection, Offer distribution, Gotcha trade-ins, Thing trade-ins, Winner determination
2. THE Game_System SHALL clearly indicate the current phase to all players
3. WHEN a phase completes, THE Game_System SHALL automatically advance to the next phase
4. THE Game_System SHALL prevent players from taking actions outside their designated phase
5. THE Game_System SHALL continue rounds until a winner is determined

### Requirement 4: Deal Phase Mechanics

**User Story:** As a player, I want my hand replenished to 5 cards each round, so that I have sufficient cards to make strategic offers.

#### Acceptance Criteria

1. WHEN the Deal phase begins, THE Game_System SHALL deal cards to bring each player's hand to exactly 5 cards
2. THE Game_System SHALL deal one card at a time to each player in sequence
3. WHEN the draw pile is empty, THE Game_System SHALL shuffle the discard pile to form a new draw pile
4. IF insufficient cards remain after reshuffling, THE Game_System SHALL deal until the draw pile is empty
5. THE Game_System SHALL update the visual display of each player's hand size

### Requirement 5: Offer Phase Mechanics

**User Story:** As a Seller, I want to create strategic offers with hidden information, so that I can compete for the Buyer's selection.

#### Acceptance Criteria

1. WHEN the Offer phase begins, THE Game_System SHALL require all Sellers to place exactly 3 cards from their hand
2. THE Game_System SHALL enforce that exactly 2 cards are placed face down and 1 card face up
3. THE Game_System SHALL prevent Sellers from modifying their offers once placed
4. THE Game_System SHALL display face up cards to all players and hide face down cards
5. THE Game_System SHALL advance to Buyer-flip phase only when all Sellers have completed their offers

### Requirement 6: Buyer-Flip Phase Mechanics

**User Story:** As a Buyer, I want to reveal one hidden card from any offer, so that I can make a more informed selection decision.

#### Acceptance Criteria

1. WHEN the Buyer-flip phase begins, THE Game_System SHALL allow only the Buyer to select one face down card from any Seller's offer
2. THE Game_System SHALL flip the selected card face up for all players to see
3. THE Game_System SHALL prevent the Buyer from flipping more than one card
4. THE Game_System SHALL update the visual display to show the newly revealed card
5. THE Game_System SHALL advance to Action phase after the card is flipped

### Requirement 7: Action Phase Mechanics

**User Story:** As a player, I want to play Action cards from my collection, so that I can influence the game state before offer selection.

#### Acceptance Criteria

1. WHEN the Action phase begins, THE Game_System SHALL allow all players to play Action cards from their collections
2. THE Game_System SHALL allow players to play multiple Action cards if available
3. THE Game_System SHALL prevent players from playing Action cards if their collection contains none
4. THE Game_System SHALL execute Action card effects immediately when played
5. THE Game_System SHALL end the Action phase when all players declare they are done or have no Action cards

### Requirement 8: Action Phase Response Rounds

**User Story:** As a player, I want the opportunity to respond with Action cards after any player plays one, so that I can react strategically to other players' actions.

#### Acceptance Criteria

1. WHEN any player plays an Action card, THE Game_System SHALL give all other players a chance to respond
2. THE Game_System SHALL complete a full rotation around all players after each Action card is played
3. WHEN a player has no Action cards available, THE Game_System SHALL automatically skip them in the response round
4. THE Game_System SHALL continue response rounds until a complete rotation occurs with no Action cards played
5. THE Game_System SHALL advance to Offer selection phase only after all response opportunities are exhausted

### Requirement 9: Offer Selection and Distribution

**User Story:** As a Buyer, I want to select one offer and transfer the money bag, so that the round can conclude with proper card distribution.

#### Acceptance Criteria

1. WHEN Offer selection begins, THE Game_System SHALL allow the Buyer to choose exactly one Seller's offer
2. THE Game_System SHALL transfer the money bag to the selected Seller
3. THE Game_System SHALL move the selected offer to the Buyer's collection
4. THE Game_System SHALL move each non-selected offer to its respective Seller's collection
5. THE Game_System SHALL clear all offer areas after distribution

### Requirement 10: Gotcha and Thing Trade-ins

**User Story:** As a player, I want to automatically trade in complete sets for points, so that the game progresses toward victory conditions.

#### Acceptance Criteria

1. WHEN Gotcha trade-ins begin, THE Game_System SHALL identify all complete Gotcha sets in each player's collection
2. THE Game_System SHALL automatically trade in all complete Gotcha sets and apply their effects
3. WHEN Thing trade-ins begin, THE Game_System SHALL identify all complete Thing sets in each player's collection
4. THE Game_System SHALL automatically trade in complete Thing sets for points (1 Giant=1pt, 2 Big=1pt, 3 Medium=1pt, 4 Tiny=1pt)
5. THE Game_System SHALL update each player's point total after trade-ins

### Requirement 11: Winner Determination

**User Story:** As a player, I want the game to end when someone reaches 5 points with a clear winner, so that games conclude definitively.

#### Acceptance Criteria

1. WHEN Winner determination begins, THE Game_System SHALL check if any player has 5 or more points
2. IF multiple players are tied for the most points, THE Game_System SHALL continue to the next round
3. WHEN one player has at least 5 points and more than any other player, THE Game_System SHALL declare them the winner
4. THE Game_System SHALL display the winner clearly and end the game
5. THE Game_System SHALL prevent further gameplay after a winner is declared

### Requirement 12: Card Visual Design

**User Story:** As a player, I want cards to have distinct visual designs based on their type, so that I can quickly identify different card types during gameplay.

#### Acceptance Criteria

1. THE Game_System SHALL display Thing cards with blue writing and the card name in the largest font at the top
2. THE Game_System SHALL display "Set = X cards" text below the card name on Thing cards in smaller font
3. THE Game_System SHALL display Gotcha cards with red writing and the card name in the largest font at the top
4. THE Game_System SHALL display set requirements and "This card has an effect" text on Gotcha cards below the name
5. THE Game_System SHALL display Action cards with black writing, card name at top, and "This card has an effect" text below

### Requirement 13: Player Rotation System

**User Story:** As a player, I want turns to proceed in an organized rotation, so that gameplay flows smoothly and predictably.

#### Acceptance Criteria

1. WHEN multiple players must act in a phase, THE Game_System SHALL start with the Buyer and proceed clockwise
2. WHEN the Buyer does not act in a phase, THE Game_System SHALL start with the player to the Buyer's right
3. THE Game_System SHALL loop the rotation back to the first player after reaching the last player
4. THE Game_System SHALL clearly indicate which player is currently acting in the rotation
5. THE Game_System SHALL design the rotation system to allow future refactoring for simultaneous player actions

### Requirement 14: Automatic Player Skipping

**User Story:** As a player, I want the game to automatically skip players who cannot act, so that gameplay maintains good pacing without unnecessary waiting.

#### Acceptance Criteria

1. WHEN a player has no valid actions in the current phase, THE Game_System SHALL automatically skip them in the rotation
2. WHEN the Buyer cannot act in a phase, THE Game_System SHALL not wait for Buyer input and proceed to the next player
3. WHEN a player has no Action cards in their collection during Action phase, THE Game_System SHALL skip them automatically
4. THE Game_System SHALL provide visual indication when a player is automatically skipped
5. THE Game_System SHALL continue rotation until all players who can act have had their opportunity

### Requirement 15: Player Perspective Selection

**User Story:** As a player, I want to view the game from different player perspectives, so that I can see the game state as any player would see it.

#### Acceptance Criteria

1. THE Game_System SHALL provide a dropdown selector to choose which player's perspective to view
2. THE Game_System SHALL maintain the perspective selector independently from the current acting player
3. WHEN a perspective is selected, THE Game_System SHALL update all card displays according to that player's view
4. THE Game_System SHALL allow switching perspectives at any time during gameplay
5. THE Game_System SHALL clearly indicate which player's perspective is currently being shown

### Requirement 16: Card Display States

**User Story:** As a player, I want cards to display appropriately based on game rules and perspective, so that I can see the information I should have access to.

#### Acceptance Criteria

1. THE Game_System SHALL display cards in three states: face up, face down, and partial
2. WHEN viewing a player's hand from their own perspective, THE Game_System SHALL show all cards face up
3. WHEN viewing other players' hands, THE Game_System SHALL show all cards face down
4. THE Game_System SHALL show all cards in all collections as face up for all perspectives
5. WHEN viewing offers, THE Game_System SHALL show face down cards as partial for the offer owner's perspective and face down for others

### Requirement 17: Partial Card Display

**User Story:** As a player, I want to see my own face down offer cards in a special partial state, so that I can remember what I offered while knowing which cards are hidden from others.

#### Acceptance Criteria

1. WHEN displaying partial cards, THE Game_System SHALL show the card name and description in the top half
2. THE Game_System SHALL display the bottom half of partial cards as greyed out or with a face down indicator
3. THE Game_System SHALL use partial display only for a player's own face down offer cards when viewing from their perspective
4. THE Game_System SHALL maintain visual distinction between partial cards and fully face up cards
5. THE Game_System SHALL ensure partial cards clearly indicate their face down status to other players

### Requirement 18: Future Client/Server Architecture Support

**User Story:** As a developer, I want the game architecture to support future migration to a client/server model, so that multiple players can join games running on a server with minimal code changes.

#### Acceptance Criteria

1. THE Game_System SHALL use action-based state management that can be serialized for network transmission
2. THE Game_System SHALL separate game logic from UI components to enable server-side game state management
3. THE Game_System SHALL structure player actions to include player identification for multi-client scenarios
4. THE Game_System SHALL design state updates to be atomic and conflict-free for network synchronization
5. THE Game_System SHALL implement perspective-based rendering that supports fixed client perspectives

### Requirement 19: React Implementation

**User Story:** As a developer, I want the game built with React best practices, so that the codebase is maintainable and performant.

#### Acceptance Criteria

1. THE Game_System SHALL use React functional components with hooks for state management
2. THE Game_System SHALL implement proper component composition for game areas and phases
3. WHEN state changes occur, THE Game_System SHALL update all dependent components efficiently
4. THE Game_System SHALL handle user interactions through proper event handling
5. THE Game_System SHALL maintain responsive design for different screen sizes