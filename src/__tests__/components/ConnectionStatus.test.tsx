import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ConnectionStatus } from '../../components/ConnectionStatus'
import { ConnectionState } from '../../services/ConnectionManager'

describe('ConnectionStatus Component', () => {
  const mockOnRetry = jest.fn()

  beforeEach(() => {
    mockOnRetry.mockClear()
  })

  describe('Rendering for each connection state', () => {
    it('renders nothing when connection state is "connected"', () => {
      const { container } = render(
        <ConnectionStatus
          connectionState="connected"
          retryAttempt={0}
          onRetry={mockOnRetry}
        />
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('renders connecting state with spinner and message', () => {
      render(
        <ConnectionStatus
          connectionState="connecting"
          retryAttempt={0}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.getByText('Connecting to game...')).toBeInTheDocument()
      expect(document.querySelector('.connection-spinner')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('renders retrying state with spinner, message, and attempt count', () => {
      render(
        <ConnectionStatus
          connectionState="retrying"
          retryAttempt={3}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.getByText('Connection failed. Retrying...')).toBeInTheDocument()
      expect(screen.getByText('Attempt 3 of 5')).toBeInTheDocument()
      expect(document.querySelector('.connection-spinner')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('renders failed state with error message and retry button', () => {
      render(
        <ConnectionStatus
          connectionState="failed"
          retryAttempt={5}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.getByText('Unable to connect to game')).toBeInTheDocument()
      expect(screen.getByText(/All automatic retry attempts have been exhausted/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry connection/i })).toBeInTheDocument()
      expect(document.querySelector('.connection-spinner')).not.toBeInTheDocument()
    })

    it('renders disconnected state with disconnected message', () => {
      render(
        <ConnectionStatus
          connectionState="disconnected"
          retryAttempt={0}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.getByText('Disconnected from game')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Retry button click handler', () => {
    it('calls onRetry when retry button is clicked', () => {
      render(
        <ConnectionStatus
          connectionState="failed"
          retryAttempt={5}
          onRetry={mockOnRetry}
        />
      )
      
      const retryButton = screen.getByRole('button', { name: /retry connection/i })
      fireEvent.click(retryButton)
      
      expect(mockOnRetry).toHaveBeenCalledTimes(1)
    })

    it('does not render retry button in connecting state', () => {
      render(
        <ConnectionStatus
          connectionState="connecting"
          retryAttempt={0}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('does not render retry button in retrying state', () => {
      render(
        <ConnectionStatus
          connectionState="retrying"
          retryAttempt={2}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('only renders retry button in failed state', () => {
      render(
        <ConnectionStatus
          connectionState="failed"
          retryAttempt={5}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.getByRole('button', { name: /retry connection/i })).toBeInTheDocument()
    })
  })

  describe('Attempt count display', () => {
    it('displays correct attempt count with default maxRetries', () => {
      render(
        <ConnectionStatus
          connectionState="retrying"
          retryAttempt={1}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.getByText('Attempt 1 of 5')).toBeInTheDocument()
    })

    it('displays correct attempt count with custom maxRetries', () => {
      render(
        <ConnectionStatus
          connectionState="retrying"
          retryAttempt={2}
          maxRetries={3}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.getByText('Attempt 2 of 3')).toBeInTheDocument()
    })

    it('displays attempt count for different retry attempts', () => {
      const { rerender } = render(
        <ConnectionStatus
          connectionState="retrying"
          retryAttempt={1}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.getByText('Attempt 1 of 5')).toBeInTheDocument()
      
      rerender(
        <ConnectionStatus
          connectionState="retrying"
          retryAttempt={4}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.getByText('Attempt 4 of 5')).toBeInTheDocument()
    })

    it('does not display attempt count in connecting state', () => {
      render(
        <ConnectionStatus
          connectionState="connecting"
          retryAttempt={0}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.queryByText(/Attempt/)).not.toBeInTheDocument()
    })

    it('does not display attempt count in failed state', () => {
      render(
        <ConnectionStatus
          connectionState="failed"
          retryAttempt={5}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.queryByText(/Attempt/)).not.toBeInTheDocument()
    })

    it('does not display attempt count in disconnected state', () => {
      render(
        <ConnectionStatus
          connectionState="disconnected"
          retryAttempt={0}
          onRetry={mockOnRetry}
        />
      )
      
      expect(screen.queryByText(/Attempt/)).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('retry button has proper aria-label', () => {
      render(
        <ConnectionStatus
          connectionState="failed"
          retryAttempt={5}
          onRetry={mockOnRetry}
        />
      )
      
      const retryButton = screen.getByRole('button', { name: /retry connection/i })
      expect(retryButton).toHaveAttribute('aria-label', 'Retry connection')
    })

    it('renders overlay with proper structure', () => {
      const { container } = render(
        <ConnectionStatus
          connectionState="connecting"
          retryAttempt={0}
          onRetry={mockOnRetry}
        />
      )
      
      expect(container.querySelector('.connection-status-overlay')).toBeInTheDocument()
      expect(container.querySelector('.connection-status-container')).toBeInTheDocument()
      expect(container.querySelector('.connection-status-content')).toBeInTheDocument()
    })
  })

  describe('CSS classes', () => {
    it('applies correct CSS classes for connecting state', () => {
      const { container } = render(
        <ConnectionStatus
          connectionState="connecting"
          retryAttempt={0}
          onRetry={mockOnRetry}
        />
      )
      
      expect(container.querySelector('.connection-spinner')).toBeInTheDocument()
      expect(container.querySelector('.connection-message')).toBeInTheDocument()
    })

    it('applies correct CSS classes for retrying state', () => {
      const { container } = render(
        <ConnectionStatus
          connectionState="retrying"
          retryAttempt={2}
          onRetry={mockOnRetry}
        />
      )
      
      expect(container.querySelector('.connection-spinner')).toBeInTheDocument()
      expect(container.querySelector('.connection-message')).toBeInTheDocument()
      expect(container.querySelector('.retry-attempt-count')).toBeInTheDocument()
    })

    it('applies correct CSS classes for failed state', () => {
      const { container } = render(
        <ConnectionStatus
          connectionState="failed"
          retryAttempt={5}
          onRetry={mockOnRetry}
        />
      )
      
      expect(container.querySelector('.connection-error-icon')).toBeInTheDocument()
      expect(container.querySelector('.connection-error-message')).toBeInTheDocument()
      expect(container.querySelector('.connection-error-details')).toBeInTheDocument()
      expect(container.querySelector('.retry-button')).toBeInTheDocument()
    })
  })
})
