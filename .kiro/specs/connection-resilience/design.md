# Design Document: Connection Resilience

## Overview

This design adds comprehensive connection resilience to the SSE-based multiplayer system. The solution wraps the existing EventSource connection logic with retry mechanisms, timeout handling, and detailed logging without modifying core game logic. The implementation focuses on making transient network failures transparent to users through automatic recovery while providing clear feedback when manual intervention is needed.

## Architecture

### Current Architecture

The application uses a three-layer architecture for multiplayer:

1. **MultiplayerApiClient** (`src/services/multiplayerApi.ts`) - HTTP API wrapper and EventSource factory
2. **MultiplayerContext** (`src/contexts/MultiplayerContext.tsx`) - React context managing connection state and SSE event handling
3. **SSEConnectionManager** (`server/src/services/SSEConnectionManager.ts`) - Server-side connection tracking and event broadcasting

### Enhanced Architecture

We'll add a new **ConnectionManager** layer between MultiplayerContext and MultiplayerApiClient:

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                         │
│                    (GameBoard, Lobby)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                  MultiplayerContext                          │
│  - Connection state management                               │
│  - Event handling                                            │
│  - UI state coordination                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              ConnectionManager (NEW)                         │
│  - Retry logic with exponential backoff                      │
│  - Timeout handling                                          │
│  - Connection lifecycle logging                              │
│  - Automatic reconnection                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│               MultiplayerApiClient                           │
│  - HTTP requests                                             │
│  - EventSource creation                                      │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. ConnectionManager Class

A new service class that wraps EventSource with resilience features.

**Location**: `src/services/ConnectionManager.ts`

**Interface**:
```typescript
export type ConnectionState = 
  | 'disconnected'
  | 'connecting' 
  | 'connected' 
  | 'retrying'
  | 'failed'

export interface ConnectionAttempt {
  attemptNumber: number
  startTime: number
  endTime?: number
  duration?: number
  success: boolean
  error?: string
}

export interface ConnectionMetrics {
  totalAttempts: number
  successfulAttempts: number
  failedAttempts: number
  averageConnectionTime: number
  attempts: ConnectionAttempt[]
}

export interface ConnectionManagerConfig {
  maxRetries: number              // Default: 5
  initialRetryDelay: number       // Default: 1000ms
  maxRetryDelay: number           // Default: 5000ms
  connectionTimeout: number       // Default: 8000ms
  enableAutoReconnect: boolean    // Default: true
  logToServer: boolean            // Default: true
}

export class ConnectionManager {
  private eventSource: EventSource | null
  private state: ConnectionState
  private config: ConnectionManagerConfig
  private retryCount: number
  private metrics: ConnectionMetrics
  private connectionTimer: NodeJS.Timeout | null
  private retryTimer: NodeJS.Timeout | null
  
  constructor(
    private apiClient: MultiplayerApiClient,
    private gameId: string,
    private playerId: string,
    config?: Partial<ConnectionManagerConfig>
  )
  
  // Primary connection method
  connect(): Promise<void>
  
  // Manual retry (resets retry counter)
  manualRetry(): Promise<void>
  
  // Disconnect and cleanup
  disconnect(): void
  
  // Get current state
  getState(): ConnectionState
  
  // Get metrics
  getMetrics(): ConnectionMetrics
  
  // Event handlers (to be set by consumer)
  onStateChange?: (state: ConnectionState) => void
  onMessage?: (event: ServerSentEvent) => void
  onError?: (error: Error) => void
}
```

**Key Methods**:

- `connect()`: Initiates connection with timeout and retry logic
- `manualRetry()`: Resets retry counter and attempts connection
- `disconnect()`: Cleans up EventSource and timers
- `handleConnectionTimeout()`: Called when connection exceeds timeout
- `scheduleRetry()`: Implements exponential backoff
- `logConnectionEvent()`: Logs to console and optionally to server

### 2. Enhanced MultiplayerContext

**Modifications to** `src/contexts/MultiplayerContext.tsx`:

**New State Fields**:
```typescript
export interface MultiplayerState {
  // ... existing fields ...
  connectionState: ConnectionState  // Replaces connectionStatus
  retryAttempt: number              // Current retry attempt (0 = not retrying)
  connectionMetrics: ConnectionMetrics | null
  showRetryButton: boolean
}
```

**New Actions**:
```typescript
export type MultiplayerAction =
  | // ... existing actions ...
  | { type: 'CONNECTION_STATE_CHANGED'; state: ConnectionState }
  | { type: 'RETRY_ATTEMPT'; attemptNumber: number }
  | { type: 'METRICS_UPDATED'; metrics: ConnectionMetrics }
  | { type: 'SHOW_RETRY_BUTTON'; show: boolean }
```

**Integration**:
- Replace direct EventSource usage with ConnectionManager
- Wire ConnectionManager callbacks to dispatch actions
- Expose `manualRetry()` method for UI

### 3. Connection Status UI Component

**New Component**: `src/components/ConnectionStatus.tsx`

**Purpose**: Display connection state and retry button

**Interface**:
```typescript
interface ConnectionStatusProps {
  connectionState: ConnectionState
  retryAttempt: number
  onRetry: () => void
}

export const ConnectionStatus: React.FC<ConnectionStatusProps>
```

**Visual States**:
- **connecting**: Spinner with "Connecting to game..."
- **connected**: No display (game board visible)
- **retrying**: Spinner with "Connection failed. Retrying (attempt X/5)..."
- **failed**: Error message with "Retry Connection" button
- **disconnected**: "Disconnected" message

### 4. Server-Side Logging Endpoint

**New Endpoint**: `POST /api/logs/connection`

**Location**: `server/src/routes/logs.ts`

**Request Body**:
```typescript
interface ConnectionLogRequest {
  playerId: string
  gameId: string
  event: 'connecting' | 'connected' | 'error' | 'closed' | 'timeout'
  timestamp: string
  duration?: number
  error?: string
  metadata?: Record<string, any>
}
```

**Response**:
```typescript
interface ConnectionLogResponse {
  success: boolean
  logId: string
}
```

**Implementation**:
- Logs to console with structured format
- Stores in memory for recent diagnostics (last 100 events per game)
- Optional: Persist to file or external logging service

### 5. Enhanced SSEConnectionManager

**Modifications to** `server/src/services/SSEConnectionManager.ts`:

**New Methods**:
```typescript
// Log connection establishment with timing
logConnectionEstablished(playerId: string, gameId: string, duration: number): void

// Log connection drop with reason
logConnectionDropped(playerId: string, gameId: string, duration: number, reason: string): void

// Get connection diagnostics for a game
getConnectionDiagnostics(gameId: string): ConnectionDiagnostics
```

**New Interface**:
```typescript
interface ConnectionDiagnostics {
  gameId: string
  totalConnections: number
  activeConnections: number
  connectionHistory: Array<{
    playerId: string
    connectedAt: Date
    disconnectedAt?: Date
    duration?: number
    reason?: string
  }>
}
```

## Data Models

### ConnectionAttempt

Represents a single connection attempt with timing and outcome.

```typescript
interface ConnectionAttempt {
  attemptNumber: number      // 1-based attempt number
  startTime: number          // Unix timestamp (ms)
  endTime?: number           // Unix timestamp (ms) when completed
  duration?: number          // Milliseconds from start to end
  success: boolean           // Whether connection succeeded
  error?: string             // Error message if failed
}
```

### ConnectionMetrics

Aggregated metrics for all connection attempts in a session.

```typescript
interface ConnectionMetrics {
  totalAttempts: number           // Total connection attempts
  successfulAttempts: number      // Successful connections
  failedAttempts: number          // Failed connections
  averageConnectionTime: number   // Average time to connect (ms)
  attempts: ConnectionAttempt[]   // Detailed attempt history
}
```

### ConnectionLog (Server-side)

Server-side log entry for connection events.

```typescript
interface ConnectionLog {
  logId: string              // Unique log identifier
  playerId: string           // Player who experienced the event
  gameId: string             // Game context
  event: ConnectionEvent     // Type of event
  timestamp: Date            // When event occurred
  duration?: number          // Duration in ms (for timed events)
  error?: string             // Error details if applicable
  metadata?: Record<string, any>  // Additional context
}

type ConnectionEvent = 
  | 'connecting'
  | 'connected'
  | 'error'
  | 'closed'
  | 'timeout'
  | 'retry'
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Connection Timeout Enforcement

*For any* connection attempt, if the connection does not complete within the configured timeout period, the attempt should be aborted and marked as failed.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 2: Exponential Backoff Timing

*For any* sequence of retry attempts, the delay between attempt N and attempt N+1 should be greater than or equal to the delay between attempt N-1 and attempt N, up to the maximum delay.

**Validates: Requirements 5.2**

### Property 3: Retry Limit Enforcement

*For any* connection session, the number of automatic retry attempts should not exceed the configured maximum (5 attempts).

**Validates: Requirements 5.3, 5.5**

### Property 4: State Transition Validity

*For any* connection state transition, the new state should be reachable from the current state according to the state machine rules (e.g., cannot go from 'disconnected' to 'connected' without passing through 'connecting').

**Validates: Requirements 8.5**

### Property 5: Manual Retry Counter Reset

*For any* manual retry action, the retry counter should be reset to 0, allowing a fresh set of automatic retries.

**Validates: Requirements 6.3**

### Property 6: Connection Lifecycle Logging Completeness

*For any* connection attempt, there should be a corresponding log entry for the 'connecting' event, and if the attempt completes (success or failure), there should be a corresponding completion log entry.

**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 7: Metrics Accuracy

*For any* connection session, the sum of successful attempts and failed attempts in the metrics should equal the total attempts count.

**Validates: Requirements 3.2**

### Property 8: Background Reconnection Trigger

*For any* established connection that drops unexpectedly (not due to explicit disconnect), a background reconnection attempt should be initiated automatically.

**Validates: Requirements 7.1, 7.2**

### Property 9: UI State Consistency

*For any* connection state, the UI should display exactly one of the defined state indicators (connecting, connected, retrying, failed, disconnected), and the displayed state should match the current connection state.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 10: Retry Button Visibility

*For any* connection state, the manual retry button should be visible if and only if the connection state is 'failed' and all automatic retries have been exhausted.

**Validates: Requirements 6.1, 6.4**

## Error Handling

### Connection Timeout Errors

**Scenario**: Connection attempt exceeds timeout threshold

**Handling**:
1. Abort the EventSource connection attempt
2. Log timeout event with duration
3. Transition to 'retrying' state if retries remain
4. Transition to 'failed' state if retries exhausted
5. Display appropriate UI message

### Network Errors

**Scenario**: EventSource fires 'error' event

**Handling**:
1. Log error event with details
2. Close existing EventSource
3. Determine if error is during initial connection or mid-game
4. Apply appropriate retry strategy
5. Update UI with error state

### Server Unavailable

**Scenario**: Server returns 5xx or connection refused

**Handling**:
1. Treat as transient failure
2. Apply exponential backoff retry
3. Log server error details
4. Show "Server temporarily unavailable" message

### Invalid Game/Player IDs

**Scenario**: Server returns 404 or 400 for invalid IDs

**Handling**:
1. Do NOT retry (permanent failure)
2. Log error as non-retryable
3. Transition to 'failed' state immediately
4. Show "Game not found" or "Invalid player" message
5. Provide option to return to home screen

### Mid-Game Disconnection

**Scenario**: Established connection drops during gameplay

**Handling**:
1. Detect disconnection via EventSource error event
2. Show "Connection lost. Reconnecting..." overlay
3. Attempt background reconnection with exponential backoff
4. Keep game state frozen (no local actions)
5. On reconnection, sync game state from server
6. On failure, show manual retry button

### Logging Failures

**Scenario**: Unable to send logs to server

**Handling**:
1. Log to console as fallback
2. Continue operation (logging is non-critical)
3. Store logs in memory for later retry
4. Do NOT block connection attempts

## Testing Strategy

### Unit Tests

**Test Files**:
- `src/services/ConnectionManager.test.ts`
- `src/components/ConnectionStatus.test.tsx`
- `server/src/routes/logs.test.ts`

**Key Test Cases**:
1. ConnectionManager initialization with default and custom config
2. Successful connection on first attempt
3. Connection timeout triggers retry
4. Manual retry resets counter
5. State transitions follow valid paths
6. Metrics calculation accuracy
7. ConnectionStatus renders correct UI for each state
8. Retry button click triggers manual retry
9. Server logging endpoint accepts and stores logs
10. Invalid connection parameters handled gracefully

### Property-Based Tests

**Test Files**:
- `src/services/ConnectionManager.property.test.ts`

**Property Tests** (minimum 100 iterations each):

1. **Property 1: Connection Timeout Enforcement**
   - Generate random timeout values (1000-10000ms)
   - Simulate connection delays exceeding timeout
   - Verify all attempts are aborted within timeout + small buffer
   - **Feature: connection-resilience, Property 1: Connection Timeout Enforcement**

2. **Property 2: Exponential Backoff Timing**
   - Generate random retry sequences (3-5 attempts)
   - Calculate delays between attempts
   - Verify each delay >= previous delay (up to max)
   - **Feature: connection-resilience, Property 2: Exponential Backoff Timing**

3. **Property 3: Retry Limit Enforcement**
   - Generate random failure scenarios
   - Count automatic retry attempts
   - Verify count never exceeds configured maximum
   - **Feature: connection-resilience, Property 3: Retry Limit Enforcement**

4. **Property 4: State Transition Validity**
   - Generate random sequences of connection events
   - Track state transitions
   - Verify all transitions follow state machine rules
   - **Feature: connection-resilience, Property 4: State Transition Validity**

5. **Property 5: Manual Retry Counter Reset**
   - Generate random retry states (1-5 attempts)
   - Trigger manual retry
   - Verify counter resets to 0
   - **Feature: connection-resilience, Property 5: Manual Retry Counter Reset**

6. **Property 6: Connection Lifecycle Logging Completeness**
   - Generate random connection scenarios
   - Verify each 'connecting' log has matching completion log
   - **Feature: connection-resilience, Property 6: Connection Lifecycle Logging Completeness**

7. **Property 7: Metrics Accuracy**
   - Generate random connection attempt sequences
   - Calculate metrics
   - Verify successful + failed = total
   - **Feature: connection-resilience, Property 7: Metrics Accuracy**

8. **Property 8: Background Reconnection Trigger**
   - Generate random mid-game disconnection events
   - Verify reconnection attempt is initiated
   - **Feature: connection-resilience, Property 8: Background Reconnection Trigger**

9. **Property 9: UI State Consistency**
   - Generate random connection states
   - Render ConnectionStatus component
   - Verify exactly one state indicator is displayed
   - **Feature: connection-resilience, Property 9: UI State Consistency**

10. **Property 10: Retry Button Visibility**
    - Generate random connection states and retry counts
    - Render ConnectionStatus component
    - Verify button visible only when state='failed' and retries exhausted
    - **Feature: connection-resilience, Property 10: Retry Button Visibility**

### Integration Tests

**Test Scenarios**:
1. Full connection flow from disconnected to connected
2. Connection failure with automatic retry recovery
3. Connection failure requiring manual retry
4. Mid-game disconnection and recovery
5. Server logging integration
6. Multiple players connecting simultaneously
7. Connection during high server load

### Manual Testing

**Test Scenarios**:
1. Test on corporate network with proxy
2. Simulate network interruption (disable WiFi mid-game)
3. Test with slow network (throttle to 3G)
4. Test with server restart during game
5. Verify UI feedback is clear and helpful
6. Test manual retry button functionality
7. Verify logs appear in server console

### Testing Framework

- **Unit/Integration Tests**: Jest with React Testing Library
- **Property-Based Tests**: fast-check (TypeScript property testing library)
- **Test Configuration**: Minimum 100 iterations per property test
- **Coverage Target**: 80% code coverage for new components
