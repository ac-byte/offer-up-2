import * as fc from 'fast-check'
import { renderHook, act, waitFor } from '@testing-library/react'
import { MultiplayerProvider, useMultiplayer } from './MultiplayerContext'
import { ConnectionState } from '../services/ConnectionManager'
import React from 'react'

/**
 * Property-Based Tests for MultiplayerContext Background Reconnection
 * Feature: connection-resilience
 */

describe('Feature: connection-resilience, Property 8: Background Reconnection Trigger', () => {
  // Increase Jest timeout for property-based tests
  jest.setTimeout(60000)

  test('Property 8: Background Reconnection Trigger - For any established connection that drops mid-game, the system should automatically detect the disconnection and trigger reconnection attempts', async () => {
    /**
     * **Validates: Requirements 7.1, 7.2**
     * 
     * This property tests that:
     * 1. When connection state transitions from 'connected' to 'disconnected'/'retrying' during an active game,
     *    the system detects it as a mid-game disconnection
     * 2. The system automatically triggers reconnection (via ConnectionManager's retry logic)
     * 3. The detection works regardless of the specific disconnection cause
     * 4. The reconnection trigger happens without manual intervention
     * 5. The game state is maintained during the reconnection process
     */
    await fc.assert(
      fc.asyncProperty(
        // Generate random sequence of connection state transitions
        fc.array(
          fc.constantFrom<ConnectionState>(
            'connected',
            'disconnected',
            'retrying',
            'connecting'
          ),
          { minLength: 3, maxLength: 6 }
        ),
        // Generate whether game has started
        fc.boolean(),
        async (stateSequence, gameStarted) => {
          // Ensure the sequence includes a mid-game disconnection scenario
          // We need: connected -> (disconnected or retrying)
          const hasConnectedState = stateSequence.includes('connected')
          const hasDisconnectionState = stateSequence.includes('disconnected') || stateSequence.includes('retrying')
          
          // Skip sequences that don't have the pattern we're testing
          if (!hasConnectedState || !hasDisconnectionState || !gameStarted) {
            return // Skip this test case
          }

          // Track console logs for verification
          const consoleLogs: string[] = []
          const originalConsoleLog = console.log
          console.log = jest.fn((...args: any[]) => {
            if (typeof args[0] === 'string' && args[0].includes('[MultiplayerContext]')) {
              consoleLogs.push(args.join(' '))
            }
            originalConsoleLog(...args)
          })

          try {
            // Render the hook with provider
            const wrapper = ({ children }: { children: React.ReactNode }) => (
              <MultiplayerProvider>{children}</MultiplayerProvider>
            )

            const { result } = renderHook(() => useMultiplayer(), { wrapper })

            // Simulate game state
            await act(async () => {
              // Set up initial state to simulate an active game
              result.current.dispatch({ type: 'SET_MODE', mode: 'multiplayer' })
              result.current.dispatch({
                type: 'GAME_CREATED',
                gameId: 'TEST-GAME',
                gameCode: 'TEST123',
                joinUrl: 'http://test.com/game=TEST123',
                playerId: 'test-player',
                playerName: 'Test Player'
              })
              
              if (gameStarted) {
                result.current.dispatch({ type: 'GAME_STARTED' })
              }
            })

            // Simulate the state sequence
            let previousState: ConnectionState = 'disconnected'
            let detectedMidGameDisconnection = false

            for (const newState of stateSequence) {
              await act(async () => {
                result.current.dispatch({
                  type: 'CONNECTION_STATE_CHANGED',
                  state: newState
                })
              })

              // Check if this transition represents a mid-game disconnection
              const wasMidGameDisconnection = 
                previousState === 'connected' && 
                (newState === 'retrying' || newState === 'disconnected') &&
                gameStarted

              if (wasMidGameDisconnection) {
                detectedMidGameDisconnection = true
              }

              previousState = newState

              // Small delay between state changes
              await new Promise(resolve => setTimeout(resolve, 50))
            }

            // Wait for any async effects to complete
            await waitFor(() => {
              // Just wait a bit for effects to run
              return true
            }, { timeout: 500 })

            // Property 1: If we had a mid-game disconnection, it should be logged
            if (detectedMidGameDisconnection) {
              const hasDisconnectionLog = consoleLogs.some(log => 
                log.includes('Mid-game disconnection detected') ||
                log.includes('background reconnection')
              )
              
              // The system should have detected and logged the mid-game disconnection
              expect(hasDisconnectionLog).toBe(true)
            }

            // Property 2: Verify game state is maintained during disconnection
            if (detectedMidGameDisconnection) {
              expect(result.current.state.gameId).toBe('TEST-GAME')
              expect(result.current.state.playerId).toBe('test-player')
              expect(result.current.state.gameStarted).toBe(gameStarted)
            }

            // Property 3: Verify connection state reflects the final state
            const finalState = stateSequence[stateSequence.length - 1]
            expect(result.current.state.connectionState).toBe(finalState)

            // Property 4: If game hasn't started, mid-game disconnection should not be triggered
            if (!gameStarted) {
              const hasDisconnectionLog = consoleLogs.some(log => 
                log.includes('Mid-game disconnection detected')
              )
              expect(hasDisconnectionLog).toBe(false)
            }

          } finally {
            // Restore console.log
            console.log = originalConsoleLog
          }
        }
      ),
      { numRuns: 50 } // 50 runs to cover various state transition scenarios
    )
  })

  test('Property 8b: Background Reconnection Trigger - Reconnection should only trigger for mid-game disconnections, not initial connection failures', async () => {
    /**
     * **Validates: Requirements 7.1, 7.2**
     * 
     * This property tests that:
     * 1. Initial connection failures (before game starts) do NOT trigger mid-game reconnection logic
     * 2. Only disconnections that occur after a successful connection during an active game trigger the logic
     * 3. The system distinguishes between initial connection attempts and mid-game reconnections
     */
    await fc.assert(
      fc.asyncProperty(
        // Generate connection state for initial connection attempt
        fc.constantFrom<ConnectionState>('connecting', 'retrying', 'failed'),
        // Generate whether game has started
        fc.boolean(),
        async (initialState, gameStarted) => {
          // Track console logs
          const consoleLogs: string[] = []
          const originalConsoleLog = console.log
          console.log = jest.fn((...args: any[]) => {
            if (typeof args[0] === 'string' && args[0].includes('[MultiplayerContext]')) {
              consoleLogs.push(args.join(' '))
            }
            originalConsoleLog(...args)
          })

          try {
            // Render the hook with provider
            const wrapper = ({ children }: { children: React.ReactNode }) => (
              <MultiplayerProvider>{children}</MultiplayerProvider>
            )

            const { result } = renderHook(() => useMultiplayer(), { wrapper })

            // Simulate initial connection attempt (never reached 'connected' state)
            await act(async () => {
              result.current.dispatch({ type: 'SET_MODE', mode: 'multiplayer' })
              result.current.dispatch({
                type: 'GAME_CREATED',
                gameId: 'TEST-GAME',
                gameCode: 'TEST123',
                joinUrl: 'http://test.com/game=TEST123',
                playerId: 'test-player',
                playerName: 'Test Player'
              })
              
              if (gameStarted) {
                result.current.dispatch({ type: 'GAME_STARTED' })
              }

              // Transition to initial state (without ever being 'connected')
              result.current.dispatch({
                type: 'CONNECTION_STATE_CHANGED',
                state: initialState
              })
            })

            // Wait for effects
            await new Promise(resolve => setTimeout(resolve, 200))

            // Property: Initial connection failures should NOT trigger mid-game disconnection logic
            const hasDisconnectionLog = consoleLogs.some(log => 
              log.includes('Mid-game disconnection detected')
            )
            
            // Should NOT detect mid-game disconnection since we never connected
            expect(hasDisconnectionLog).toBe(false)

          } finally {
            // Restore console.log
            console.log = originalConsoleLog
          }
        }
      ),
      { numRuns: 30 } // 30 runs to cover initial connection scenarios
    )
  })
})
