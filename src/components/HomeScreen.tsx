import React, { useState, useEffect } from 'react'
import { PlayerCountSlider } from './PlayerCountSlider'
import { PlayerNameInputs } from './PlayerNameInputs'
import { GameAction } from '../types'
import { useMultiplayer } from '../contexts/MultiplayerContext'
import { MultiplayerApiClient } from '../services/multiplayerApi'
import './HomeScreen.css'

export interface HomeScreenProps {
  onStartGame: (action: GameAction) => void
  onEnterLobby: () => void
}

// Default names as specified in requirements
const DEFAULT_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eric', 'Fran']

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame, onEnterLobby }) => {
  const [gameMode, setGameMode] = useState<'local' | 'create' | 'join'>('local')
  const [playerCount, setPlayerCount] = useState<number>(4) // Default to 4 players
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isStartButtonEnabled, setIsStartButtonEnabled] = useState<boolean>(false)
  
  // Multiplayer form states
  const [hostName, setHostName] = useState<string>('')
  const [joinPlayerName, setJoinPlayerName] = useState<string>('')
  const [gameCodeInput, setGameCodeInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  const { createGame, joinGame, dispatch } = useMultiplayer()

  // Initialize player names when component mounts or player count changes
  useEffect(() => {
    const initialNames = DEFAULT_NAMES.slice(0, playerCount)
    setPlayerNames(initialNames)
  }, [playerCount])

  // Validation logic
  const validatePlayerSetup = (names: string[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    // Check for empty names
    const nonEmptyNames = names.filter(name => name.trim().length > 0)
    if (nonEmptyNames.length !== names.length) {
      errors.push('All player names must be filled in')
    }
    
    // Check for duplicate names (case-insensitive)
    const lowerCaseNames = names.map(name => name.trim().toLowerCase())
    const uniqueNames = new Set(lowerCaseNames)
    if (uniqueNames.size !== lowerCaseNames.length) {
      errors.push('Player names must be unique')
    }
    
    // Check if we have the right number of names
    if (names.length !== playerCount) {
      errors.push(`Expected ${playerCount} player names, but got ${names.length}`)
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Update validation and button state whenever names change
  useEffect(() => {
    console.log('HomeScreen: Validation useEffect triggered')
    console.log('HomeScreen: playerNames:', playerNames)
    console.log('HomeScreen: playerCount:', playerCount)
    
    const validation = validatePlayerSetup(playerNames)
    console.log('HomeScreen: validation result:', validation)
    
    setValidationErrors(validation.errors)
    setIsStartButtonEnabled(validation.isValid)
    
    console.log('HomeScreen: isStartButtonEnabled set to:', validation.isValid)
  }, [playerNames, playerCount])

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count)
  }

  const handlePlayerNamesChange = (names: string[]) => {
    setPlayerNames(names)
  }

  const handleStartGame = () => {
    console.log('HomeScreen: handleStartGame called')
    console.log('HomeScreen: isStartButtonEnabled:', isStartButtonEnabled)
    console.log('HomeScreen: playerNames:', playerNames)
    console.log('HomeScreen: validationErrors:', validationErrors)
    
    if (isStartButtonEnabled) {
      // Create START_GAME action with the configured player names
      const startGameAction: GameAction = {
        type: 'START_GAME',
        players: playerNames.map(name => name.trim())
      }
      console.log('HomeScreen: Calling onStartGame with action:', startGameAction)
      onStartGame(startGameAction)
    } else {
      console.log('HomeScreen: Button not enabled, not starting game')
    }
  }

  const handleCreateMultiplayerGame = async () => {
    if (!hostName.trim()) {
      setError('Please enter your name')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await createGame(hostName.trim())
      onEnterLobby()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create game')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinMultiplayerGame = async () => {
    if (!joinPlayerName.trim()) {
      setError('Please enter your name')
      return
    }

    if (!gameCodeInput.trim()) {
      setError('Please enter a game code or URL')
      return
    }

    const gameCode = MultiplayerApiClient.extractGameCode(gameCodeInput.trim())
    if (!gameCode) {
      setError('Invalid game code or URL format')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await joinGame(gameCode, joinPlayerName.trim())
      onEnterLobby()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to join game')
    } finally {
      setIsLoading(false)
    }
  }

  const resetToMainMenu = () => {
    setGameMode('local')
    setError(null)
    setHostName('')
    setJoinPlayerName('')
    setGameCodeInput('')
  }

  return (
    <div className="home-screen">
      <div className="home-screen-container">
        {/* Game Title and Description */}
        <div className="game-header">
          <h1 className="game-title">Offer Up</h1>
          <p className="game-description">
            A game of trades and hidden information.
          </p>
        </div>

        {/* Game Mode Selection */}
        {gameMode === 'local' && (
          <>
            {/* Game Mode Buttons */}
            <div className="game-mode-selection">
              <h3>Choose Game Mode</h3>
              <div className="mode-buttons">
                <button
                  onClick={() => setGameMode('local')}
                  className="mode-button local-mode active"
                >
                  <div className="mode-icon">🏠</div>
                  <div className="mode-title">Local Game</div>
                  <div className="mode-description">Play on this device with friends</div>
                </button>
                
                <button
                  onClick={() => setGameMode('create')}
                  className="mode-button multiplayer-mode"
                >
                  <div className="mode-icon">🌐</div>
                  <div className="mode-title">Create Online Game</div>
                  <div className="mode-description">Host a game for remote players</div>
                </button>
                
                <button
                  onClick={() => setGameMode('join')}
                  className="mode-button join-mode"
                >
                  <div className="mode-icon">🔗</div>
                  <div className="mode-title">Join Online Game</div>
                  <div className="mode-description">Join a friend's game</div>
                </button>
              </div>
            </div>

            {/* Local Game Configuration */}
            <div className="player-configuration">
              {/* Player Count Slider */}
              <div className="config-section">
                <PlayerCountSlider
                  playerCount={playerCount}
                  onChange={handlePlayerCountChange}
                />
              </div>

              {/* Player Name Inputs */}
              <div className="config-section">
                <PlayerNameInputs
                  playerCount={playerCount}
                  playerNames={playerNames}
                  onChange={handlePlayerNamesChange}
                />
              </div>
            </div>

            {/* Validation Errors Display */}
            {validationErrors.length > 0 && (
              <div className="validation-errors">
                <div className="error-header">
                  <span className="error-icon">⚠️</span>
                  <span>Please fix the following issues:</span>
                </div>
                <ul className="error-list">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="error-item">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Start Local Game Button */}
            <div className="start-game-section">
              <button
                onClick={handleStartGame}
                disabled={!isStartButtonEnabled}
                className={`start-game-button ${isStartButtonEnabled ? 'enabled' : 'disabled'}`}
                aria-describedby="start-button-help"
              >
                {isStartButtonEnabled ? 'Start Local Game' : 'Complete Setup to Start'}
              </button>
              
              <div id="start-button-help" className="start-button-help">
                {isStartButtonEnabled 
                  ? `Ready to start with ${playerCount} players!`
                  : 'Fill in all player names with unique values to enable the start button'
                }
              </div>
            </div>
          </>
        )}

        {/* Create Multiplayer Game Form */}
        {gameMode === 'create' && (
          <div className="multiplayer-form">
            <div className="form-header">
              <h3>Create Online Game</h3>
              <p>Host a game that friends can join remotely</p>
            </div>

            <div className="form-section">
              <label htmlFor="host-name">Your Name:</label>
              <input
                id="host-name"
                type="text"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="error-display">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{error}</span>
              </div>
            )}

            <div className="form-actions">
              <button
                onClick={handleCreateMultiplayerGame}
                disabled={!hostName.trim() || isLoading}
                className={`create-game-button ${hostName.trim() && !isLoading ? 'enabled' : 'disabled'}`}
              >
                {isLoading ? 'Creating Game...' : 'Create Game'}
              </button>
              
              <button
                onClick={resetToMainMenu}
                className="back-button"
                disabled={isLoading}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Join Multiplayer Game Form */}
        {gameMode === 'join' && (
          <div className="multiplayer-form">
            <div className="form-header">
              <h3>Join Online Game</h3>
              <p>Enter a game code or join URL to connect</p>
            </div>

            <div className="form-section">
              <label htmlFor="player-name">Your Name:</label>
              <input
                id="player-name"
                type="text"
                value={joinPlayerName}
                onChange={(e) => setJoinPlayerName(e.target.value)}
                placeholder="Enter your name"
                maxLength={20}
                disabled={isLoading}
              />
            </div>

            <div className="form-section">
              <label htmlFor="game-code">Game Code or URL:</label>
              <input
                id="game-code"
                type="text"
                value={gameCodeInput}
                onChange={(e) => setGameCodeInput(e.target.value)}
                placeholder="ABC123 or https://example.com/join?game=ABC123"
                disabled={isLoading}
              />
              <div className="input-help">
                Enter the 6-character game code or paste the full join URL
              </div>
            </div>

            {error && (
              <div className="error-display">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{error}</span>
              </div>
            )}

            <div className="form-actions">
              <button
                onClick={handleJoinMultiplayerGame}
                disabled={!joinPlayerName.trim() || !gameCodeInput.trim() || isLoading}
                className={`join-game-button ${joinPlayerName.trim() && gameCodeInput.trim() && !isLoading ? 'enabled' : 'disabled'}`}
              >
                {isLoading ? 'Joining Game...' : 'Join Game'}
              </button>
              
              <button
                onClick={resetToMainMenu}
                className="back-button"
                disabled={isLoading}
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Game Rules Summary */}
        <div className="rules-summary">
          <h4>Quick Rules:</h4>
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