# Implementation Plan: Multiplayer Implementation

## Overview

Transform the single-browser card game into a true multiplayer experience by adding a Node.js/Express backend, implementing real-time communication via Server-Sent Events, and modifying the React frontend to support game lobbies and player-specific perspectives.

## Tasks

- [x] 1. Backend Infrastructure Setup
  - Set up Node.js/Express server with TypeScript
  - Configure development environment and build scripts
  - Add necessary dependencies (express, cors, uuid, etc.)
  - Create basic server structure with health check endpoint
  - _Requirements: 8.1, 8.4_

- [x] 2. Game State Management Backend
  - [x] 2.1 Create multiplayer game state interfaces
    - Define MultiplayerGameState extending existing GameState
    - Create ConnectedPlayer and LobbyState interfaces
    - Add game status tracking (lobby, playing, finished)
    - _Requirements: 1.2, 2.2, 3.1_

  - [x] 2.2 Implement in-memory game storage
    - Create game storage using Map data structure
    - Add game cleanup and garbage collection logic
    - Implement game code generation (6-character alphanumeric)
    - _Requirements: 1.1, 1.5, 8.1, 8.3_

  - [x] 2.3 Add game lifecycle management
    - Implement create game functionality
    - Add player join/leave logic with validation
    - Create game start transition from lobby to playing
    - _Requirements: 1.2, 2.2, 2.3, 3.3_

- [-] 3. API Endpoints Implementation
  - [x] 3.1 Game management endpoints
    - POST /api/games - Create new game
    - POST /api/games/:gameId/join - Join existing game
    - POST /api/games/:gameId/start - Start game (host only)
    - GET /api/games/:gameId/status - Get game status
    - _Requirements: 1.1, 2.1, 3.2_

  - [x] 3.2 Gameplay endpoints
    - POST /api/games/:gameId/actions - Submit player actions
    - GET /api/games/:gameId/events - Server-Sent Events stream
    - Add action validation and processing logic
    - _Requirements: 5.1, 5.4, 6.1, 6.2, 6.3_

  - [x] 3.3 Error handling and validation
    - Add request validation middleware
    - Implement proper error responses
    - Add game state validation for all actions
    - _Requirements: 2.5, 5.4_

- [x] 4. Real-Time Communication
  - [x] 4.1 Server-Sent Events implementation
    - Set up SSE endpoint for game state updates
    - Implement connection management for multiple clients
    - Add automatic cleanup of disconnected clients
    - _Requirements: 5.2, 5.3, 7.1_

  - [x] 4.2 State broadcasting system
    - Create game state filtering for player perspectives
    - Implement efficient state update broadcasting
    - Add connection status tracking and notifications
    - _Requirements: 4.3, 4.4, 4.5, 5.2, 9.1_

- [ ] 5. Frontend Multiplayer Integration
  - [x] 5.1 Enhanced HomeScreen for multiplayer
    - Add "Create Multiplayer Game" button and flow
    - Implement "Join Game" form with code input
    - Create shareable URL display for game hosts
    - Preserve existing "Start Local Game" functionality
    - _Requirements: 1.1, 1.3, 2.1_

  - [x] 5.2 Game Lobby component
    - Create lobby interface showing joined players
    - Add real-time player list updates via SSE
    - Implement host controls (start game button)
    - Add leave game functionality
    - _Requirements: 3.1, 3.2, 3.4_

  - [x] 5.3 Multiplayer client state management
    - Add multiplayer mode to existing game context
    - Implement SSE client for real-time updates
    - Create HTTP client for player actions
    - Add connection status management
    - _Requirements: 5.3, 9.1, 9.4_

- [ ] 6. GameBoard Multiplayer Adaptation
  - [ ] 6.1 Player perspective enforcement
    - Remove perspective selector from main UI
    - Automatically set perspective to current player
    - Hide sensitive information (other players' hands)
    - Preserve admin controls in AdminFooter for host
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

  - [ ] 6.2 Turn-based action enforcement
    - Modify action handlers to send HTTP requests instead of direct dispatch
    - Add client-side turn validation and UI feedback
    - Implement "waiting for player" states and indicators
    - Handle server action validation responses
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 9.2_

  - [ ] 6.3 Connection status and feedback
    - Add connection status indicators for all players
    - Implement loading states for server communications
    - Show appropriate error messages for network issues
    - Add reconnection handling for temporary disconnections
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

- [ ] 7. Game Logic Server Integration
  - [ ] 7.1 Move game reducer to server
    - Copy existing game logic to server-side
    - Adapt reducer for server-side validation
    - Ensure game state consistency between client and server
    - _Requirements: 5.1, 5.4_

  - [ ] 7.2 Action validation and processing
    - Implement server-side action validation
    - Add turn enforcement for different game phases
    - Handle simultaneous actions in offer phase
    - Process buyer-only actions (gotcha, offer selection)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 7.3 Disconnection handling
    - Implement player disconnection detection
    - Add automatic turn skipping for disconnected players
    - Handle game continuation with reduced player count
    - End game gracefully when too few players remain
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 8. URL-based game joining
  - [ ] 8.1 Implement URL routing for game codes
    - Add React Router for /join?game=CODE URLs
    - Create automatic join flow from URL parameters
    - Handle invalid or expired game codes
    - _Requirements: 2.1, 2.5_

  - [ ] 8.2 Game URL generation and sharing
    - Generate shareable URLs when creating games
    - Add copy-to-clipboard functionality for game URLs
    - Display join instructions for game hosts
    - _Requirements: 1.3, 1.4_

- [ ] 9. Testing and Integration
  - [ ] 9.1 Backend API testing
    - Unit tests for game management endpoints
    - Integration tests for complete game flows
    - Test concurrent game creation and joining
    - _Requirements: 8.2_

  - [ ] 9.2 Frontend multiplayer testing
    - Test lobby functionality with multiple simulated players
    - Verify real-time updates and state synchronization
    - Test error handling and connection issues
    - _Requirements: 5.3, 9.3_

  - [ ] 9.3 End-to-end multiplayer testing
    - Test complete game flow from lobby to finish
    - Verify turn enforcement and game logic
    - Test player disconnection scenarios
    - Manual testing with multiple browser tabs/devices
    - _Requirements: 6.5, 7.5_

- [ ] 10. Development Environment Setup
  - [ ] 10.1 Concurrent development servers
    - Configure backend server (port 3000)
    - Set up frontend proxy to backend API
    - Add development scripts for running both servers
    - _Requirements: 8.4_

  - [ ] 10.2 Build and packaging
    - Create production build scripts for both client and server
    - Add simple deployment instructions
    - Create distributable package for non-technical users
    - _Requirements: 8.5_

- [ ] 11. Final integration and polish
  - [ ] 11.1 Cross-browser compatibility testing
    - Test Server-Sent Events in different browsers
    - Verify game functionality across Chrome, Firefox, Safari
    - Test mobile browser compatibility
    - _Requirements: 8.2_

  - [ ] 11.2 Performance optimization
    - Optimize state broadcasting frequency
    - Add efficient game cleanup and memory management
    - Test with maximum concurrent games and players
    - _Requirements: 8.2, 8.3_

- [ ] 12. Final checkpoint - Comprehensive multiplayer testing
  - Ensure all multiplayer functionality works correctly
  - Test complete game flows with multiple real players
  - Verify all requirements are met
  - Test deployment and distribution process

## Notes

- This implementation maintains backward compatibility with local single-player mode
- Server-Sent Events provide real-time updates without WebSocket complexity
- In-memory storage is sufficient for the target scale (5 games, 30 players max)
- Turn enforcement is handled server-side to prevent cheating
- Player perspectives are automatically managed without manual selection
- The system gracefully handles player disconnections by continuing with remaining players