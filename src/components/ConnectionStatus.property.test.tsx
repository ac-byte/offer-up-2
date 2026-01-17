import * as fc from 'fast-check'
import { render, screen, cleanup } from '@testing-library/react'
import { ConnectionStatus } from './ConnectionStatus'
import { ConnectionState } from '../services/ConnectionManager'
import '@testing-library/jest-dom'

/**
 * Property-Based Tests for ConnectionStatus Component
 * Feature: connection-resilience
 */

describe('Feature: connection-resilience, Property Tests', () => {
  // Clean up after each test iteration
  afterEach(() => {
    cleanup()
  })

  test('Property 9: UI State Consistency - For any connection state, the UI should display exactly one of the defined state indicators, and the displayed state should match the current connection state', () => {
    /**
     * **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**
     * 
     * This property tests that:
     * 1. For each connection state, exactly one state indicator is displayed
     * 2. The displayed state matches the current connection state
     * 3. 'connected' state renders nothing (null)
     * 4. 'connecting' state shows connecting indicator
     * 5. 'retrying' state shows retry indicator with attempt count
     * 6. 'failed' state shows error message and retry button
     * 7. 'disconnected' state shows disconnected message
     * 8. No invalid or mixed state indicators are shown
     */
    fc.assert(
      fc.property(
        // Generate all possible connection states
        fc.constantFrom<ConnectionState>(
          'disconnected',
          'connecting',
          'connected',
          'retrying',
          'failed'
        ),
        // Generate random retry attempt number (0 to 5)
        fc.integer({ min: 0, max: 5 }),
        // Generate random max retries (3 to 5)
        fc.integer({ min: 3, max: 5 }),
        (connectionState, retryAttempt, maxRetries) => {
          // Clean up before each property test iteration
          cleanup()

          // Mock retry handler
          const mockOnRetry = jest.fn()

          // Render the component with the generated state
          const { container } = render(
            <ConnectionStatus
              connectionState={connectionState}
              retryAttempt={retryAttempt}
              maxRetries={maxRetries}
              onRetry={mockOnRetry}
            />
          )

          // Define the expected indicators for each state
          const stateIndicators = {
            connecting: 'Connecting to game...',
            retrying: 'Connection failed. Retrying...',
            failed: 'Unable to connect to game',
            disconnected: 'Disconnected from game',
          }

          // Property 1: For 'connected' state, component should render nothing
          if (connectionState === 'connected') {
            expect(container.firstChild).toBeNull()
            
            // Verify no state indicators are present
            Object.values(stateIndicators).forEach(indicator => {
              expect(screen.queryByText(indicator)).not.toBeInTheDocument()
            })
            
            return // Test complete for 'connected' state
          }

          // Property 2: For non-connected states, the overlay should be present
          const overlay = container.querySelector('.connection-status-overlay')
          expect(overlay).toBeInTheDocument()

          // Property 3: Exactly one state indicator should be displayed
          // Use queryAllByText to avoid errors when checking for presence
          const displayedIndicators = Object.entries(stateIndicators)
            .filter(([_, text]) => {
              const elements = screen.queryAllByText(text)
              return elements.length > 0
            })
            .map(([state, _]) => state)

          expect(displayedIndicators.length).toBe(1)

          // Property 4: The displayed indicator should match the current connection state
          const expectedIndicator = stateIndicators[connectionState as keyof typeof stateIndicators]
          if (expectedIndicator) {
            expect(screen.getByText(expectedIndicator)).toBeInTheDocument()
            expect(displayedIndicators[0]).toBe(connectionState)
          }

          // Property 5: State-specific validations
          switch (connectionState) {
            case 'connecting':
              // Should show spinner
              const connectingSpinner = container.querySelector('.connection-spinner')
              expect(connectingSpinner).toBeInTheDocument()
              
              // Should NOT show retry button
              expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
              
              // Should NOT show attempt count
              expect(screen.queryByText(/attempt/i)).not.toBeInTheDocument()
              break

            case 'retrying':
              // Should show spinner
              const retryingSpinner = container.querySelector('.connection-spinner')
              expect(retryingSpinner).toBeInTheDocument()
              
              // Should show attempt count
              const attemptText = `Attempt ${retryAttempt} of ${maxRetries}`
              expect(screen.getByText(attemptText)).toBeInTheDocument()
              
              // Should NOT show retry button
              expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
              break

            case 'failed':
              // Should show error icon
              expect(screen.getByText('⚠️')).toBeInTheDocument()
              
              // Should show error details
              expect(screen.getByText(/all automatic retry attempts have been exhausted/i)).toBeInTheDocument()
              
              // Should show retry button
              const retryButton = screen.getByRole('button', { name: /retry connection/i })
              expect(retryButton).toBeInTheDocument()
              
              // Should NOT show spinner
              expect(container.querySelector('.connection-spinner')).not.toBeInTheDocument()
              
              // Should NOT show attempt count
              expect(screen.queryByText(/attempt.*of/i)).not.toBeInTheDocument()
              break

            case 'disconnected':
              // Should show disconnected icon
              expect(screen.getByText('🔌')).toBeInTheDocument()
              
              // Should NOT show retry button
              expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
              
              // Should NOT show spinner
              expect(container.querySelector('.connection-spinner')).not.toBeInTheDocument()
              
              // Should NOT show attempt count
              expect(screen.queryByText(/attempt/i)).not.toBeInTheDocument()
              break
          }

          // Property 6: Verify no mixed state indicators
          // Count how many different state indicators are present
          const allIndicatorsPresent = Object.values(stateIndicators)
            .filter(text => {
              const elements = screen.queryAllByText(text)
              return elements.length > 0
            })
          
          // Should only have exactly one indicator
          expect(allIndicatorsPresent.length).toBe(1)

          // Property 7: Verify retry button is only present in 'failed' state
          const retryButton = screen.queryByRole('button', { name: /retry/i })
          if (connectionState === 'failed') {
            expect(retryButton).toBeInTheDocument()
          } else {
            expect(retryButton).not.toBeInTheDocument()
          }

          // Property 8: Verify spinner is only present in 'connecting' and 'retrying' states
          const spinner = container.querySelector('.connection-spinner')
          if (connectionState === 'connecting' || connectionState === 'retrying') {
            expect(spinner).toBeInTheDocument()
          } else {
            expect(spinner).not.toBeInTheDocument()
          }

          // Property 9: Verify attempt count is only shown in 'retrying' state
          const attemptCount = screen.queryByText(/attempt.*of/i)
          if (connectionState === 'retrying') {
            expect(attemptCount).toBeInTheDocument()
          } else {
            expect(attemptCount).not.toBeInTheDocument()
          }
        }
      ),
      { numRuns: 100 } // Full 100 runs to cover all state combinations
    )
  })

  test('Property 10: Retry Button Visibility - For any connection state, the manual retry button should be visible if and only if the connection state is "failed" and all automatic retries have been exhausted', () => {
    /**
     * **Validates: Requirements 6.1, 6.4**
     * 
     * This property tests that:
     * 1. The retry button is visible when state is 'failed'
     * 2. The retry button is NOT visible for any other state
     * 3. The retry button visibility is independent of retry attempt count
     * 4. The retry button is functional (has proper role and accessible name)
     * 5. Only 'failed' state triggers retry button display
     */
    fc.assert(
      fc.property(
        // Generate all possible connection states
        fc.constantFrom<ConnectionState>(
          'disconnected',
          'connecting',
          'connected',
          'retrying',
          'failed'
        ),
        // Generate random retry attempt number (0 to 10 to test beyond max)
        fc.integer({ min: 0, max: 10 }),
        // Generate random max retries (3 to 5)
        fc.integer({ min: 3, max: 5 }),
        (connectionState, retryAttempt, maxRetries) => {
          // Clean up before each property test iteration
          cleanup()

          // Mock retry handler
          const mockOnRetry = jest.fn()

          // Render the component with the generated state
          const { container } = render(
            <ConnectionStatus
              connectionState={connectionState}
              retryAttempt={retryAttempt}
              maxRetries={maxRetries}
              onRetry={mockOnRetry}
            />
          )

          // Query for the retry button
          const retryButton = screen.queryByRole('button', { name: /retry connection/i })

          // Property: Retry button should be visible if and only if state is 'failed'
          if (connectionState === 'failed') {
            // When state is 'failed', retry button MUST be visible
            expect(retryButton).toBeInTheDocument()
            expect(retryButton).toBeVisible()
            
            // Verify button is functional (enabled and clickable)
            expect(retryButton).not.toBeDisabled()
            
            // Verify button has proper accessible name
            expect(retryButton).toHaveAccessibleName(/retry connection/i)
            
            // Verify button is part of the failed state UI
            const failedMessage = screen.getByText('Unable to connect to game')
            expect(failedMessage).toBeInTheDocument()
            
          } else {
            // When state is NOT 'failed', retry button MUST NOT be visible
            expect(retryButton).not.toBeInTheDocument()
            
            // Verify no retry-related buttons exist at all
            const allButtons = container.querySelectorAll('button')
            allButtons.forEach(button => {
              expect(button.textContent).not.toMatch(/retry/i)
            })
          }

          // Additional verification: Check that retry button visibility is independent
          // of retry attempt count - it only depends on the state being 'failed'
          if (connectionState === 'failed') {
            // Retry button should be present regardless of retry attempt count
            expect(retryButton).toBeInTheDocument()
          } else if (connectionState === 'retrying') {
            // Even when retrying (which has attempt count), no retry button
            expect(retryButton).not.toBeInTheDocument()
            // But attempt count should be shown
            const attemptText = `Attempt ${retryAttempt} of ${maxRetries}`
            expect(screen.getByText(attemptText)).toBeInTheDocument()
          }

          // Verify mutual exclusivity: retry button and spinner never appear together
          const spinner = container.querySelector('.connection-spinner')
          if (retryButton) {
            expect(spinner).not.toBeInTheDocument()
          }
          if (spinner) {
            expect(retryButton).not.toBeInTheDocument()
          }
        }
      ),
      { numRuns: 100 } // Full 100 runs to cover all state and retry count combinations
    )
  })
})
