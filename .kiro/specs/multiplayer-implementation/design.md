# Design Document

## Overview

This design transforms the single-browser card game into a client-server multiplayer experience. The architecture uses a simple Node.js/Express backend with in-memory storage, Server-Sent Events for real-time updates, and HTTP POST for player actions. The frontend React app is modified to support game joining, lobby management, and player-specific perspectives.

## Architecture

### High-Level Architecture
```
┌─────────────────┐    HTTP POST     ┌─────────────────┐
│   React Client  │ ────────────────▶│  Express Server │
│   (Player 1)    │                  │                 │
│                 │◀──── SSE ────────│  Game State     │
└─────────────────┘                  │  Manager        │
                                     │                 │
┌─────────────────┐    HTTP POST     │                 │
│   React Client  │ ────────────────▶│                 │
│   (Player 2)    │                  │                 │
│                 │◀──── SSE ────────│                 │
└─────────────────┘                  └─────────────────┘
```

### Communication Flow
1. **Player Actions**: HTTP POST to `/api/games/:gameId/actions`
2. **State Updates**: Server-Sent Events from `/api/games/:gameId/events`
3. **Game Management**: REST endpoints for create/join/lobby operations

## Components and Interfaces

### Backend Components

#### Game Server (Express.js)
```typescript
interface GameServer {
  // Game management
  createGame(): { gameId: string, joinUrl: string }
  joinGame(gameId: string, playerName: string): { success: boolean, playerId: string }
  startGame(gameId: string, hostPlayerId: string): { success: boolean }
  
  // Game actions
  processAction(gameId: string, playerId: string, action: GameAction): void
  
  // Real-time updates
  broadcastGameState(gameId: string): void
  getEventStream(gameId: string): EventSource
}
```

#### Game State Manager
```typescript
interface MultiplayerGameState extends GameState {
  gameId: string
  status: 'lobby' | 'playing' | 'finished'
  hostPlayerId: string
  connectedPlayers: ConnectedPlayer[]
  createdAt: Date
  lastActivity: Date
}

interface ConnectedPlayer {
  playerId: string
  playerName: string
  connected: boolean
  joinedAt: Date
}
```

#### API Endpoints
```typescript
// Game Management
POST   /api/games                    // Create new game
POST   /api/games/:gameId/join       // Join existing game
POST   /api/games/:gameId/start      // Start game (host only)
GET    /api/games/:gameId/status     // Get current game status

// Gameplay
POST   /api/games/:gameId/actions    // Submit player action
GET    /api/games/:gameId/events     // SSE stream for updates

// Utility
GET    /api/games/:gameId            // Get current game state
DELETE /api/games/:gameId            // End game (host only)
```

### Frontend Components

#### Enhanced HomeScreen
```typescript
interface HomeScreenProps {
  onCreateGame: () => void
  onJoinGame: (gameCode: string, playerName: string) => void
  onStartLocalGame: (config: GameConfig) => void
}
```

**New Features:**
- "Create Multiplayer Game" button
- "Join Game" form with code input and name entry
- Display of shareable game URL for hosts
- "Start Local Game" option to preserve single-player mode

#### Game Lobby Component
```typescript
interface GameLobbyProps {
  gameId: string
  players: ConnectedPlayer[]
  isHost: boolean
  onStartGame: () => void
  onLeaveGame: () => void
}
```

**Features:**
- Real-time player list updates
- Host controls (start game, kick players - future)
- Shareable game code display
- Connection status indicators

#### Multiplayer GameBoard
```typescript
interface MultiplayerGameBoardProps {
  gameId: string
  playerId: string
  gameState: GameState
  onAction: (action: GameAction) => void
}
```

**Key Changes:**
- Remove perspective selector from main UI
- Automatically set perspective to current player
- Filter sensitive information based on player perspective
- Add connection status indicators
- Show "waiting for player" states

### State Management

#### Client-Side State
```typescript
interface ClientState {
  mode: 'local' | 'multiplayer'
  gameId?: string
  playerId?: string
  playerName?: string
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting'
  gameState: GameState
  lobbyState?: LobbyState
}

interface LobbyState {
  gameId: string
  players: ConnectedPlayer[]
  isHost: boolean
  canStart: boolean
}
```

#### Server-Side State
```typescript
// In-memory storage
const games = new Map<string, MultiplayerGameState>()
const playerConnections = new Map<string, ServerResponse[]>() // For SSE
```

## Data Models

### Game Code Generation
```typescript
function generateGameCode(): string {
  // Generate 6-character alphanumeric code (excluding confusing characters)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({length: 6}, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
```

### Player Perspective Filtering
```typescript
function filterGameStateForPlayer(gameState: GameState, playerId: string): GameState {
  return {
    ...gameState,
    players: gameState.players.map((player, index) => ({
      ...player,
      // Hide other players' hands
      hand: index === playerId ? player.hand : player.hand.map(() => ({ id: 'hidden', type: 'hidden' }))
    })),
    selectedPerspective: playerId, // Always set to current player
    // Remove admin controls for non-host players
  }
}
```

### Action Validation
```typescript
function validateAction(gameState: GameState, playerId: string, action: GameAction): boolean {
  switch (gameState.currentPhase) {
    case GamePhase.OFFER_PHASE:
      return action.type === 'PLACE_OFFER' && action.playerId === playerId
    
    case GamePhase.ACTION_PHASE:
      return gameState.currentPlayerIndex === playerId
    
    case GamePhase.OFFER_SELECTION:
    case GamePhase.GOTCHA_TRADEINS:
      return gameState.currentBuyerIndex === playerId
    
    default:
      return false // No player actions allowed in this phase
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Game code uniqueness
*For any* two games created simultaneously, they should receive different game codes
**Validates: Requirements 1.1, 1.5**

### Property 2: Player limit enforcement
*For any* game, the number of joined players should never exceed 6 or be less than 3 when starting
**Validates: Requirements 2.3**

### Property 3: State synchronization consistency
*For any* valid player action, all connected players should receive the same updated game state
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 4: Turn enforcement correctness
*For any* turn-based phase, only the current player should be able to perform actions
**Validates: Requirements 6.2, 6.3**

### Property 5: Perspective information hiding
*For any* player's view of the game state, they should not see other players' hidden information (hands)
**Validates: Requirements 4.4, 4.5**

### Property 6: Host authority preservation
*For any* game lobby, only the host should be able to start the game
**Validates: Requirements 3.2, 3.3**

## Error Handling

### Network Disconnections
- **Client Disconnection**: Server removes player from active game, continues with remaining players
- **Server Restart**: All games lost, clients show "connection lost" message
- **Partial Network Issues**: Clients attempt to reconnect automatically

### Invalid Actions
- **Out-of-Turn Actions**: Server ignores action, no error message sent
- **Invalid Game State**: Server validates all actions against current state
- **Malformed Requests**: Server returns 400 error, client shows generic error

### Game State Conflicts
- **Simultaneous Actions**: Server processes actions in received order
- **Stale Client State**: Server always uses authoritative state for validation
- **Race Conditions**: Server-side locking prevents concurrent modifications

## Testing Strategy

### Unit Testing
- Game code generation and uniqueness
- Action validation logic
- State filtering for player perspectives
- API endpoint request/response handling

### Integration Testing
- Complete game flow from lobby to finish
- Multiple players joining and leaving
- Real-time state synchronization
- Turn enforcement across different phases

### Property-Based Testing
- Game state consistency across all players
- Turn enforcement under various game conditions
- Information hiding correctness
- Game code uniqueness under load

### Manual Testing Scenarios
- 3-6 player games with real network conditions
- Player disconnection during different game phases
- Host leaving game scenarios
- Concurrent game creation and joining

## Deployment Considerations

### Development Setup
```bash
# Backend (new)
cd server
npm install
npm run dev  # Starts on port 3000

# Frontend (modified)
cd client
npm install
npm start    # Starts on port 3001, proxies API to 3000
```

### Simple Distribution
For non-technical users, create a single package:
```bash
npm run build:all  # Builds both client and server
npm run package    # Creates distributable folder
```

### Environment Configuration
```typescript
// Simple environment-based config
const config = {
  port: process.env.PORT || 3000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3001',
  maxGames: process.env.MAX_GAMES || 10,
  maxPlayersPerGame: 6,
  gameCleanupInterval: 60000 // 1 minute
}
```