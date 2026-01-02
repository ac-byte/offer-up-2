# Design Document

## Overview

This design transforms the current game UI from a scattered information layout to a consolidated, phase-aware interface. The redesign focuses on information hierarchy, progressive disclosure, and contextual relevance to create a more intuitive gaming experience.

## Architecture

### Current Layout Issues
- Game state information scattered across multiple sections
- Debugging tools mixed with player-facing features
- Static UI sections that don't adapt to game phase
- Equal visual weight given to all player areas regardless of turn

### New Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced Game Header                      │
│ [Offer Up]        [Phase Name]        [Draw + Discard]      │
│ [Round X]      [Buyer/Player Info]   [Cards + High Score]   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 Contextual Game Actions                     │
│              (Hidden when not needed)                       │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────┬───────────────────────────────────────┐
│                     │                                       │
│   Active Player     │        Other Players                  │
│     (Left Side)     │       (Right Side)                    │
│                     │                                       │
│ ┌─ Collection ─┐    │  ┌─ Player 2 ─┐ ┌─ Player 3 ─┐       │
│ ├─ Offer ──────┤    │  ├─ Collection ┤ ├─ Collection ┤      │
│ └─ Hand ───────┘    │  ├─ Offer ─────┤ ├─ Offer ─────┤     │
│                     │  └─ Hand (▼)───┘ └─ Hand (▼)───┘      │
└─────────────────────┴───────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Admin Footer (Hidden)                    │
│                    [▲ Show Debug Tools]                     │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Enhanced Game Header Component

**Location**: Top of game board
**Purpose**: Consolidate all non-player-specific game information

**Content Structure**:
```typescript
interface GameHeaderProps {
  gameTitle: string // "Offer Up"
  currentRound: number
  currentPhase: GamePhase
  phaseDescription: string
  buyerInfo: PlayerInfo
  currentPlayerInfo: PlayerInfo
  drawPileCount: number
  discardPileCount: number
  cardsInPlayCount: number
  highestScore: number
}
```

**Layout**:
- **Top Row**: 
  - **Left**: Game title ("Offer Up")
  - **Center**: Current phase name (prominent)
  - **Right**: Draw pile and discard pile counts
- **Bottom Row**:
  - **Left**: Round number
  - **Center**: Buyer and current player status
  - **Right**: Cards in play count and highest score

### Contextual Game Actions Component

**Location**: Between header and player areas
**Purpose**: Show interactive messages only when user input is needed

**Visibility Logic**:
```typescript
const shouldShowGameActions = (gameState: GameState): boolean => {
  return !!(
    gameState.gotchaEffectState ||
    gameState.addOneEffectState ||
    gameState.removeOneEffectState ||
    gameState.removeTwoEffectState ||
    gameState.flipOneEffectState ||
    gameState.stealAPointEffectState ||
    // Other interactive states
  )
}
```

**Content**: All existing game action messages and controls, but only displayed when relevant

### Collapsible Player Sub-Areas

**Implementation**: Each player area contains three collapsible sections:

```typescript
interface CollapsibleSection {
  id: 'collection' | 'offer' | 'hand'
  title: string
  isExpanded: boolean
  canCollapse: boolean
  content: React.ReactNode
}

interface PlayerAreaState {
  playerId: number
  sections: CollapsibleSection[]
  isActivePlayer: boolean
}
```

**Collapse Rules**:
- **Collection**: Always expandable, expanded by default for all players
- **Offer**: Auto-managed based on phase, expandable in relevant phases
- **Hand**: Expanded for active player, collapsed for others

### Split Player Areas Layout

**Left Side - Active Player**:
- Full-width display of current player's area
- Collection and hand expanded by default
- Offer expanded/collapsed based on phase
- Visual emphasis (border, background, or shadow)

**Right Side - Other Players**:
- Vertically stacked player areas
- Narrower width to fit multiple players
- Collection expanded, hand collapsed by default
- Offer follows phase-based rules

### Admin Footer Component

**Purpose**: Hide debugging tools while keeping them accessible

**Structure**:
```typescript
interface AdminFooterProps {
  isExpanded: boolean
  onToggleExpanded: () => void
  perspectiveSelector: React.ReactNode
  phaseControls: React.ReactNode
}
```

**Behavior**:
- Collapsed by default (shows only expand button)
- Expands to reveal perspective selector and phase controls
- Positioned at bottom of page
- Subtle styling to indicate it's for administrative use

## Data Models

### UI State Management

```typescript
interface UIState {
  // Player area collapse states
  playerAreaStates: {
    [playerId: number]: {
      collectionExpanded: boolean
      offerExpanded: boolean
      handExpanded: boolean
    }
  }
  
  // Admin controls
  adminFooterExpanded: boolean
  
  // Game actions visibility
  gameActionsVisible: boolean
}
```

### Phase-Based Visibility Rules

```typescript
const OFFER_RELEVANT_PHASES = [
  GamePhase.OFFER_PHASE,
  GamePhase.BUYER_FLIP,
  GamePhase.ACTION_PHASE,
  GamePhase.OFFER_SELECTION
]

const shouldShowOffers = (currentPhase: GamePhase): boolean => {
  return OFFER_RELEVANT_PHASES.includes(currentPhase)
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Information consolidation consistency
*For any* game state, all game information should be accessible from the consolidated header without requiring users to scan multiple UI sections
**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 2: Debug tool isolation
*For any* regular user interaction, debugging tools should not be visible in the main interface unless explicitly requested through admin controls
**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 3: Contextual action visibility
*For any* game state, interactive game actions should be visible if and only if user input is required for game progression
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 4: Phase-appropriate offer visibility
*For any* game phase, offer areas should be expanded if and only if the phase involves offer-related activities
**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 5: Active player prominence
*For any* game state, the active player's area should be visually distinct and positioned prominently compared to other players' areas
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

## Error Handling

### Collapse State Persistence
- Handle cases where collapse states become inconsistent
- Provide fallback to default expanded states
- Gracefully handle missing player data

### Dynamic Content Sizing
- Ensure layout adapts to varying numbers of players
- Handle edge cases with very long player names or phase descriptions
- Maintain responsive design across different screen sizes

### Admin Controls Access
- Prevent accidental access to debug tools
- Ensure admin footer doesn't interfere with main gameplay
- Handle cases where debug actions might conflict with normal game flow

## Testing Strategy

### Unit Testing Focus
- Test collapse/expand functionality for each player area section
- Test phase-based visibility rules for offers
- Test admin footer expand/collapse behavior
- Test game actions visibility logic

### Integration Testing
- Test complete UI layout with different player counts
- Test phase transitions and their effect on UI visibility
- Test responsive behavior across different screen sizes
- Test admin controls integration with main game flow

### Visual Regression Testing
- Capture screenshots of key UI states for comparison
- Test layout consistency across different game phases
- Verify visual hierarchy and information organization
- Ensure debugging tools are properly hidden from main interface