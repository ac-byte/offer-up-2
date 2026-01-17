import React from 'react'
import { ConnectionState } from '../services/ConnectionManager'
import './ConnectionStatus.css'

interface ConnectionStatusProps {
  connectionState: ConnectionState
  retryAttempt: number
  maxRetries?: number
  onRetry: () => void
}

/**
 * ConnectionStatus component displays the current connection state
 * and provides UI feedback for connection issues.
 * 
 * Requirements: 6.1, 6.4, 8.1, 8.2, 8.3, 8.4
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  connectionState,
  retryAttempt,
  maxRetries = 5,
  onRetry,
}) => {
  // Hide component when connected (Requirement 8.2)
  if (connectionState === 'connected') {
    return null
  }

  return (
    <div className="connection-status-overlay">
      <div className="connection-status-container">
        {/* Connecting state - show spinner (Requirement 8.1) */}
        {connectionState === 'connecting' && (
          <div className="connection-status-content">
            <div className="connection-spinner" />
            <div className="connection-message">
              Connecting to game...
            </div>
          </div>
        )}

        {/* Retrying state - show spinner with attempt count (Requirement 8.3) */}
        {connectionState === 'retrying' && (
          <div className="connection-status-content">
            <div className="connection-spinner" />
            <div className="connection-message">
              Connection failed. Retrying...
            </div>
            <div className="retry-attempt-count">
              Attempt {retryAttempt} of {maxRetries}
            </div>
          </div>
        )}

        {/* Failed state - show error message and retry button (Requirement 8.4, 6.1, 6.4) */}
        {connectionState === 'failed' && (
          <div className="connection-status-content">
            <div className="connection-error-icon">⚠️</div>
            <div className="connection-error-message">
              Unable to connect to game
            </div>
            <div className="connection-error-details">
              All automatic retry attempts have been exhausted.
              Please check your connection and try again.
            </div>
            <button
              className="retry-button"
              onClick={onRetry}
              aria-label="Retry connection"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Disconnected state - show disconnected message */}
        {connectionState === 'disconnected' && (
          <div className="connection-status-content">
            <div className="connection-error-icon">🔌</div>
            <div className="connection-message">
              Disconnected from game
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
