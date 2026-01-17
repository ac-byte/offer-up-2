# Implementation Plan: Connection Resilience

## Overview

This implementation plan adds connection resilience to the SSE-based multiplayer system through a new ConnectionManager service, enhanced MultiplayerContext, UI components for connection status, and server-side logging. The implementation is structured to minimize impact on existing game logic while providing comprehensive retry and recovery capabilities.

## Tasks

- [x] 1. Create ConnectionManager service with core connection logic
  - Create `src/services/ConnectionManager.ts` file
  - Implement ConnectionManager class with configuration interface
  - Implement `connect()` method with timeout handling
  - Implement `disconnect()` method with cleanup
  - Implement connection state management
  - Add event handler callbacks (onStateChange, onMessage, onError)
  - _Requirements: 4.1, 4.2, 5.1_

- [x] 1.1 Write property test for connection timeout enforcement

  - **Property 1: Connection Timeout Enforcement**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 2. Implement retry logic with exponential backoff
  - Implement `scheduleRetry()` method in ConnectionManager
  - Calculate exponential backoff delays (1s, 2s, 4s, 5s, 5s)
  - Implement retry counter tracking
  - Implement max retry limit enforcement (5 attempts)
  - Handle retry exhaustion (transition to 'failed' state)
  - _Requirements: 5.2, 5.3, 5.4, 5.5_

- [x] 2.1 Write property test for exponential backoff timing
  - **Property 2: Exponential Backoff Timing**
  - **Validates: Requirements 5.2**

- [x] 2.2 Write property test for retry limit enforcement
  - **Property 3: Retry Limit Enforcement**
  - **Validates: Requirements 5.3, 5.5**

- [x] 3. Implement manual retry functionality
  - Implement `manualRetry()` method in ConnectionManager
  - Reset retry counter to 0 on manual retry
  - Restart automatic retry sequence
  - _Requirements: 6.2, 6.3_

- [x] 3.1 Write property test for manual retry counter reset
  - **Property 5: Manual Retry Counter Reset**
  - **Validates: Requirements 6.3**

- [x] 4. Implement connection lifecycle logging
  - Implement `logConnectionEvent()` method in ConnectionManager
  - Log 'connecting' events with timestamp
  - Log 'connected' events with timestamp and duration
  - Log 'error' events with timestamp and error details
  - Log 'closed' events with timestamp and reason
  - Log 'timeout' events with timestamp and duration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3_

- [x] 4.1 Write property test for connection lifecycle logging completeness
  - **Property 6: Connection Lifecycle Logging Completeness**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4**

- [x] 5. Implement connection metrics tracking
  - Create ConnectionMetrics interface and implementation
  - Track total attempts, successful attempts, failed attempts
  - Calculate average connection time
  - Store detailed attempt history
  - Implement `getMetrics()` method
  - _Requirements: 3.2_

- [x] 5.1 Write property test for metrics accuracy
  - **Property 7: Metrics Accuracy**
  - **Validates: Requirements 3.2**
  - **Status: PASSED** (20 iterations, 8.6s execution time)
  - Test validates that successfulAttempts + failedAttempts = totalAttempts across multiple disconnect/reconnect cycles
  - Confirms metrics persist and accumulate correctly across the lifetime of the ConnectionManager instance

- [x] 6. Implement state machine for connection states
  - Define ConnectionState type ('disconnected', 'connecting', 'connected', 'retrying', 'failed')
  - Implement state transition logic
  - Validate state transitions (e.g., can't go from 'disconnected' to 'connected' directly)
  - Implement `getState()` method
  - _Requirements: 8.5_

- [x] 6.1 Write property test for state transition validity

  - **Property 4: State Transition Validity**
  - **Validates: Requirements 8.5**

- [X] 7. Checkpoint - Ensure ConnectionManager tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Enhance MultiplayerContext to use ConnectionManager
  - Import ConnectionManager into `src/contexts/MultiplayerContext.tsx`
  - Add new state fields: connectionState, retryAttempt, connectionMetrics, showRetryButton
  - Add new action types: CONNECTION_STATE_CHANGED, RETRY_ATTEMPT, METRICS_UPDATED, SHOW_RETRY_BUTTON
  - Update multiplayerReducer to handle new actions
  - Replace direct EventSource usage with ConnectionManager instance
  - Wire ConnectionManager callbacks to dispatch actions
  - _Requirements: 5.6, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9. Implement background reconnection logic
  - Detect mid-game disconnections in MultiplayerContext
  - Trigger automatic reconnection using ConnectionManager
  - Maintain game state during reconnection
  - Sync game state after successful reconnection
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ]* 9.1 Write property test for background reconnection trigger
  - **Property 8: Background Reconnection Trigger**
  - **Validates: Requirements 7.1, 7.2**

- [x] 10. Expose manualRetry method in MultiplayerContext
  - Add `manualRetry()` method to MultiplayerContextType interface
  - Implement method to call ConnectionManager.manualRetry()
  - Update context value to include manualRetry method
  - _Requirements: 6.2_

- [ ]* 10.1 Write unit tests for MultiplayerContext enhancements
  - Test ConnectionManager integration
  - Test state updates from ConnectionManager callbacks
  - Test manual retry method
  - Test background reconnection logic
  - _Requirements: 5.1, 6.2, 7.2_

- [x] 11. Create ConnectionStatus UI component
  - Create `src/components/ConnectionStatus.tsx` file
  - Create `src/components/ConnectionStatus.css` file
  - Implement component to display connection state
  - Show spinner for 'connecting' state
  - Show retry indicator with attempt count for 'retrying' state
  - Show error message and retry button for 'failed' state
  - Hide component for 'connected' state
  - _Requirements: 6.1, 6.4, 8.1, 8.2, 8.3, 8.4_

- [x] 11.1 Write property test for UI state consistency
  - **Property 9: UI State Consistency**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 11.2 Write property test for retry button visibility
  - **Property 10: Retry Button Visibility**
  - **Validates: Requirements 6.1, 6.4**

- [x] 11.3 Write unit tests for ConnectionStatus component
  - Test rendering for each connection state
  - Test retry button click handler
  - Test attempt count display
  - _Requirements: 6.1, 6.2, 8.1, 8.2, 8.3, 8.4_

- [x] 12. Integrate ConnectionStatus into GameBoard
  - Import ConnectionStatus into `src/components/GameBoard.tsx`
  - Get connection state from MultiplayerContext
  - Render ConnectionStatus component
  - Pass manualRetry callback to ConnectionStatus
  - Position ConnectionStatus as overlay when not connected
  - _Requirements: 6.1, 7.4, 8.1, 8.2, 8.3, 8.4_

- [x] 13. Integrate ConnectionStatus into GameLobby
  - Import ConnectionStatus into `src/components/GameLobby.tsx`
  - Get connection state from MultiplayerContext
  - Render ConnectionStatus component
  - Pass manualRetry callback to ConnectionStatus
  - _Requirements: 6.1, 8.1, 8.2, 8.3, 8.4_

- [ ] 14. Checkpoint - Ensure client-side tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Create server-side connection logging endpoint
  - Create `server/src/routes/logs.ts` file
  - Implement POST `/api/logs/connection` endpoint
  - Define ConnectionLogRequest and ConnectionLogResponse interfaces
  - Validate request body (playerId, gameId, event, timestamp)
  - Log to console with structured format
  - Store in memory (last 100 events per game)
  - Return success response with logId
  - _Requirements: 1.5_

- [ ]* 15.1 Write unit tests for logging endpoint
  - Test endpoint accepts valid log requests
  - Test endpoint validates required fields
  - Test endpoint stores logs in memory
  - Test endpoint returns success response
  - _Requirements: 1.5_

- [ ] 16. Implement client-to-server log transmission
  - Add `sendLogToServer()` method in ConnectionManager
  - Call sendLogToServer() from logConnectionEvent()
  - Handle logging failures gracefully (fallback to console only)
  - Add retry logic for failed log transmissions (non-blocking)
  - _Requirements: 1.5, 3.4_

- [ ] 17. Enhance SSEConnectionManager with connection diagnostics
  - Add `logConnectionEstablished()` method to SSEConnectionManager
  - Add `logConnectionDropped()` method to SSEConnectionManager
  - Add `getConnectionDiagnostics()` method to SSEConnectionManager
  - Track connection history per game (last 50 connections)
  - Log connection duration on disconnect
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ]* 17.1 Write unit tests for SSEConnectionManager enhancements
  - Test connection establishment logging
  - Test connection drop logging
  - Test connection diagnostics retrieval
  - Test connection history tracking
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 18. Update server routes to use enhanced SSEConnectionManager
  - Update `server/src/routes/games.ts` to call logConnectionEstablished()
  - Update disconnect handlers to call logConnectionDropped()
  - Add diagnostics endpoint GET `/api/games/:gameId/diagnostics`
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 19. Add connection timeout configuration
  - Add REACT_APP_CONNECTION_TIMEOUT environment variable support
  - Default to 8000ms if not specified
  - Validate timeout is between 5000ms and 10000ms
  - Pass timeout to ConnectionManager config
  - _Requirements: 4.4_

- [ ] 20. Add retry configuration
  - Add REACT_APP_MAX_RETRIES environment variable support (default: 5)
  - Add REACT_APP_INITIAL_RETRY_DELAY environment variable support (default: 1000ms)
  - Add REACT_APP_MAX_RETRY_DELAY environment variable support (default: 5000ms)
  - Pass configuration to ConnectionManager
  - _Requirements: 5.3_

- [ ] 21. Final checkpoint - Integration testing
  - Test full connection flow from disconnected to connected
  - Test connection failure with automatic retry recovery
  - Test connection failure requiring manual retry
  - Test mid-game disconnection and recovery
  - Test server logging integration
  - Verify UI feedback is clear and helpful
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 22. Add integration tests for full connection flows
  - Test successful connection on first attempt
  - Test connection with retry recovery
  - Test connection requiring manual retry
  - Test mid-game disconnection and recovery
  - Test server logging end-to-end
  - _Requirements: 1.5, 4.2, 5.1, 5.5, 6.2, 7.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The ConnectionManager is the core component that encapsulates all retry and timeout logic
- MultiplayerContext acts as the integration layer between ConnectionManager and React components
- UI components provide visual feedback without knowing connection implementation details
- Server-side changes are minimal and focused on logging/diagnostics
