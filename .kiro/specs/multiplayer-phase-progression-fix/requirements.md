# Multiplayer Phase Progression Fix - Requirements

## Problem Statement

The multiplayer game is stuck in the buyer flip phase and does not progress to the action phase (or offer selection phase if there are no action cards) after a card is flipped. The server-side game reducer is missing the proper phase initialization logic that exists in the client-side version.

## Root Cause Analysis

The server-side `flipCard` function in `server/src/game-logic/gameReducer.ts` simply sets `newState.currentPhase = GamePhase.ACTION_PHASE` directly, while the client-side version calls `advanceToNextPhaseWithInitialization(newState)` which properly handles phase transitions and initializes the action phase with necessary state.

## User Stories

### As a multiplayer game participant
- **I want** the game to automatically progress from buyer flip phase to action phase after flipping a card
- **So that** the game continues normally and I can play action cards or proceed to the next phase
- **And** the game flow matches the single-player experience

### As a multiplayer game participant
- **I want** the game to progress to offer selection phase if no players have action cards
- **So that** the game doesn't get stuck when there are no action cards to play
- **And** the round can continue to completion

### As a game developer
- **I want** the server-side game logic to match the client-side logic for phase progression
- **So that** multiplayer games behave consistently with single-player games
- **And** all phase initialization logic is properly executed

## Acceptance Criteria

### AC1: Buyer Flip to Action Phase Progression
- **Given** I am in a multiplayer game in the buyer flip phase
- **When** I flip a card from any offer
- **Then** the game should automatically advance to the action phase
- **And** the action phase should be properly initialized with all necessary state

### AC2: Action Phase Initialization
- **Given** the game advances to the action phase
- **When** the phase transition occurs
- **Then** all action phase state should be properly initialized
- **And** players should be able to play action cards if they have them
- **And** the action phase done states should be reset

### AC3: Skip Action Phase When No Action Cards
- **Given** no players have action cards in their collection
- **When** the game would advance to action phase
- **Then** the game should automatically skip to the next appropriate phase
- **And** continue with normal game flow

### AC4: Consistent Phase Progression Logic
- **Given** any phase transition occurs in multiplayer mode
- **When** the server processes the phase change
- **Then** the phase progression logic should match the client-side behavior
- **And** all phase-specific initialization should occur

## Technical Requirements

### TR1: Server-Side Phase Initialization Functions
- Add `advanceToNextPhaseWithInitialization` function to server-side game reducer
- Add `initializeActionPhase` function to properly set up action phase state
- Add all other phase initialization functions that exist in client-side version

### TR2: Consistent Phase Transition Logic
- Update `flipCard` function to use `advanceToNextPhaseWithInitialization` instead of direct phase setting
- Ensure all phase transitions use the proper initialization functions
- Match the client-side phase progression logic exactly

### TR3: Action Phase State Management
- Properly initialize action phase done states when entering action phase
- Reset any previous action phase state when re-entering the phase
- Handle cases where no players have action cards

### TR4: Phase Validation and Error Handling
- Maintain existing phase validation logic
- Add proper error handling for phase transition failures
- Ensure game state remains consistent during phase transitions

## Out of Scope

- Changing the overall game flow or phase sequence
- Adding new phases or modifying existing phase behavior
- Changing the client-side game logic (it's working correctly)
- Adding new action card types or effects

## Definition of Done

- [ ] Server-side game reducer includes all necessary phase initialization functions
- [ ] `flipCard` function properly advances to action phase with initialization
- [ ] Action phase is properly initialized when entered from buyer flip phase
- [ ] Game automatically skips action phase when no players have action cards
- [ ] All phase transitions in multiplayer match single-player behavior
- [ ] Manual testing confirms game progresses past buyer flip phase
- [ ] No regression in existing multiplayer functionality