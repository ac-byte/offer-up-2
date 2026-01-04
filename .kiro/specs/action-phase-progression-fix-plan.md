# Action Phase Progression Fix Plan

## Context Summary
The multiplayer game is stuck at the Action Phase due to incomplete server-side implementation. The client-side (local game) has a complete, working action phase system with proper done state management, player advancement, and action card effect handling. The server-side implementation is missing critical logic.

## Problem Analysis

### Current Server-Side Issues:
1. **Broken Done System**: `initializeActionPhaseDoneSystem` just fills array with `false`, doesn't auto-mark players without action cards as done
2. **No Done State Reset**: When a player plays an action card, all players with action cards should be unmarked as done
3. **Missing Player Advancement**: No logic to advance to next eligible player after actions
4. **Incomplete Action Card Effects**: Creates effect states but doesn't handle completion and player advancement
5. **Missing Validation**: No validation that only current player can act
6. **No Current Player Tracking**: Server doesn't maintain `currentPlayerIndex` during action phase

### Required Action Phase Behavior:
1. **Phase Start**: Players without action cards auto-marked as done
2. **Turn-Based**: Only current player can play cards or declare done
3. **Action Card Play**: Resets done states for all players with action cards, doesn't advance player until effect complete
4. **Declare Done**: Only players with action cards can declare done, advances to next eligible player
5. **Effect Completion**: After action card effect completes, advance to next eligible player
6. **Phase End**: When all players done, auto-advance to next phase
7. **Multiple Rounds**: Support multiple rounds of action card playing

## Implementation Plan

### Phase 1: Add Helper Functions
**Copy from client (`src/game-logic/gameReducer.ts`):**
- `playerHasValidActions(player, phase, isBuyer)` - Check if player has action cards
- `getRotationOrder(buyerIndex, playerCount, includeBuyer)` - Get player rotation order
- `markPlayerAsDone(state, playerId)` - Mark specific player as done

### Phase 2: Fix Done System Initialization
**Update `initializeActionPhaseDoneSystem` in server:**
```typescript
// Current (broken):
actionPhaseDoneStates: new Array(state.players.length).fill(false)

// Should be (copy from client):
const doneStates = state.players.map((player, index) => {
  const isBuyer = index === state.currentBuyerIndex
  return !playerHasValidActions(player, GamePhase.ACTION_PHASE, isBuyer)
})
```

### Phase 3: Fix Action Card Playing
**Update `playActionCard` function:**
- Add validation: only current player can play
- Add validation: player must have the action card
- Copy `resetDoneStates` logic from client
- Don't advance player immediately - let effect completion handle it
- Copy `shouldEndActionPhase` check

### Phase 4: Fix Done Declaration
**Update `declareDone` function:**
- Add validation: only current player can declare done
- Add validation: player must have action cards
- Copy `handleActionPhasePlayerDone` logic from client
- Use proper player advancement logic

### Phase 5: Add Player Advancement Logic
**Copy from client:**
- `advanceToNextEligiblePlayerInActionPhase(state)`
- `findNextEligiblePlayerInActionPhase(state, startPosition, rotationOrder)`
- Maintain `currentPlayerIndex` throughout action phase

### Phase 6: Add Phase End Logic
**Copy from client:**
- `shouldEndActionPhase(state)` - Check if all players done
- `endActionPhaseAndAdvance(state)` - Advance to next phase
- Handle immediate phase end if no players have action cards

### Phase 7: Add Effect Completion Handling
**For each action card effect completion:**
- After Flip One, Add One, Remove One, Remove Two, Steal A Point effects complete
- Advance to next eligible player
- Check if player has no more action cards (auto-mark as done)
- Check if phase should end

## Key Functions to Copy from Client

### From `src/game-logic/gameReducer.ts`:
1. `resetDoneStates(state)` - Lines ~2385-2396
2. `handleActionPhasePlayerDone(state, playerId)` - Lines ~2465-2485
3. `advanceToNextEligiblePlayerInActionPhase(state)` - Lines ~2490-2510
4. `findNextEligiblePlayerInActionPhase(state, startPos, rotation)` - Lines ~2515-2540
5. `shouldEndActionPhase(state)` - Lines ~2420-2460
6. `playerHasValidActions(player, phase, isBuyer)` - Search for this function
7. `getRotationOrder(buyerIndex, playerCount, includeBuyer)` - Search for this function

## Implementation Order:
1. Add helper functions first
2. Fix done system initialization 
3. Fix playActionCard function
4. Fix declareDone function  
5. Add player advancement logic
6. Add effect completion handling
7. Test incrementally

## Files to Modify:
- `server/src/game-logic/gameReducer.ts` - Main implementation
- Possibly `server/src/types/index.ts` - If missing types

## Testing Strategy:
1. Test simple case: no players have action cards (should end immediately)
2. Test single player with action card declares done
3. Test action card playing and done state reset
4. Test multiple rounds of action card playing
5. Test action card effects and completion

## Critical Success Criteria:
- Players without action cards auto-marked as done at phase start
- Only current player can act
- Playing action card resets done states for players with action cards
- Player advancement works correctly
- Phase ends when all players done
- Multiple rounds of action card playing work
- Action card effects complete properly before player advancement

## DO NOT IMPLEMENT YET
This is documentation only. The next context should present this plan to the user for approval before implementing.