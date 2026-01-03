import React from 'react'
import { useMultiplayer } from '../contexts/MultiplayerContext'
import './GameLobby.css'

export interface GameLobbyProps {
  onLeaveGame: () => void
}

export const GameLobby: React.FC<GameLobbyProps> = ({ onLeaveGame }) => {
  const { state, startGame } = useMultiplayer()

  const handleStartGame = async () => {
    try {
      await startGame()
    } catch (error) {
      console.error('Failed to start game:', error)
    }
  }

  const handleLeaveGame = () => {
    onLeaveGame()
  }

  const copyGameCode = () => {
    if (state.gameCode) {
      navigator.clipboard.writeText(state.gameCode)
    }
  }

  const copyJoinUrl = () => {
    if (state.gameCode) {
      const joinUrl = `${window.location.origin}/join?game=${state.gameCode}`
      navigator.clipboard.writeText(joinUrl)
    }
  }

  if (!state.lobbyState) {
    return (
      <div className="game-lobby">
        <div className="lobby-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading lobby...</p>
          </div>
        </div>
      </div>
    )
  }

  const { lobbyState } = state
  const connectedPlayers = lobbyState.players.filter(p => p.connected)
  const canStart = state.isHost && lobbyState.canStart

  return (
    <div className="game-lobby">
      <div className="lobby-container">
        {/* Lobby Header */}
        <div className="lobby-header">
          <h1 className="lobby-title">Game Lobby</h1>
          <div className="game-info">
            <div className="game-code-section">
              <label>Game Code:</label>
              <div className="game-code-display">
                <span className="game-code">{state.gameCode}</span>
                <button 
                  onClick={copyGameCode}
                  className="copy-button"
                  title="Copy game code"
                >
                  📋
                </button>
              </div>
            </div>
            
            {state.isHost && (
              <div className="join-url-section">
                <label>Share this link:</label>
                <div className="join-url-display">
                  <span className="join-url">
                    {window.location.origin}/join?game={state.gameCode}
                  </span>
                  <button 
                    onClick={copyJoinUrl}
                    className="copy-button"
                    title="Copy join URL"
                  >
                    📋
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connection Status */}
        <div className={`connection-status ${state.connectionStatus}`}>
          <div className="status-indicator"></div>
          <span className="status-text">
            {state.connectionStatus === 'connected' && 'Connected'}
            {state.connectionStatus === 'connecting' && 'Connecting...'}
            {state.connectionStatus === 'error' && 'Connection Error'}
            {state.connectionStatus === 'disconnected' && 'Disconnected'}
          </span>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="error-display">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{state.error}</span>
          </div>
        )}

        {/* Players List */}
        <div className="players-section">
          <h3 className="players-title">
            Players ({connectedPlayers.length}/{lobbyState.maxPlayers})
          </h3>
          
          <div className="players-list">
            {lobbyState.players.map((player) => (
              <div 
                key={player.playerId} 
                className={`player-item ${player.connected ? 'connected' : 'disconnected'}`}
              >
                <div className="player-info">
                  <div className="player-name">
                    {player.playerName}
                    {player.playerId === state.playerId && ' (You)'}
                    {state.isHost && player.playerId === lobbyState.players[0]?.playerId && ' (Host)'}
                  </div>
                  <div className="player-status">
                    <div className={`status-dot ${player.connected ? 'online' : 'offline'}`}></div>
                    <span className="status-label">
                      {player.connected ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Waiting for players message */}
          {connectedPlayers.length < lobbyState.minPlayers && (
            <div className="waiting-message">
              <p>
                Waiting for more players... 
                (Need at least {lobbyState.minPlayers} players to start)
              </p>
            </div>
          )}
        </div>

        {/* Game Instructions */}
        <div className="game-instructions">
          <h4>How to invite players:</h4>
          <ol>
            <li>Share the game code: <strong>{state.gameCode}</strong></li>
            <li>Or send them the join link above</li>
            <li>Players can join at: <strong>{window.location.origin}/join</strong></li>
            <li>Once everyone has joined, the host can start the game</li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="lobby-actions">
          {state.isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStart}
              className={`start-game-button ${canStart ? 'enabled' : 'disabled'}`}
            >
              {canStart ? 'Start Game' : `Need ${lobbyState.minPlayers} Players`}
            </button>
          ) : (
            <div className="waiting-for-host">
              <p>Waiting for host to start the game...</p>
            </div>
          )}
          
          <button
            onClick={handleLeaveGame}
            className="leave-game-button"
          >
            Leave Game
          </button>
        </div>

        {/* Game Rules Reminder */}
        <div className="rules-reminder">
          <h4>Quick Rules Reminder:</h4>
          <div className="rules-grid">
            <div className="rule-item">
              <strong>Objective:</strong> Collect card sets to earn points. First to 5+ points wins!
            </div>
            <div className="rule-item">
              <strong>Strategy:</strong> Create attractive offers and use hidden information to your advantage.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}