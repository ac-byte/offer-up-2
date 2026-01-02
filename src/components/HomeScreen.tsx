import React, { useState, useEffect } from 'react'
import { PlayerCountSlider } from './PlayerCountSlider'
import { PlayerNameInputs } from './PlayerNameInputs'
import { GameAction } from '../types'
import './HomeScreen.css'

export interface HomeScreenProps {
  onStartGame: (action: GameAction) => void
}

// Default names as specified in requirements
const DEFAULT_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eric', 'Fran']

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const [playerCount, setPlayerCount] = useState<number>(4) // Default to 4 players
  const [playerNames, setPlayerNames] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [isStartButtonEnabled, setIsStartButtonEnabled] = useState<boolean>(false)

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
    const validation = validatePlayerSetup(playerNames)
    setValidationErrors(validation.errors)
    setIsStartButtonEnabled(validation.isValid)
  }, [playerNames, playerCount])

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count)
  }

  const handlePlayerNamesChange = (names: string[]) => {
    setPlayerNames(names)
  }

  const handleStartGame = () => {
    if (isStartButtonEnabled) {
      // Create START_GAME action with the configured player names
      const startGameAction: GameAction = {
        type: 'START_GAME',
        players: playerNames.map(name => name.trim())
      }
      onStartGame(startGameAction)
    }
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

        {/* Player Configuration */}
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

        {/* Start Game Button */}
        <div className="start-game-section">
          <button
            onClick={handleStartGame}
            disabled={!isStartButtonEnabled}
            className={`start-game-button ${isStartButtonEnabled ? 'enabled' : 'disabled'}`}
            aria-describedby="start-button-help"
          >
            {isStartButtonEnabled ? 'Start Game' : 'Complete Setup to Start'}
          </button>
          
          <div id="start-button-help" className="start-button-help">
            {isStartButtonEnabled 
              ? `Ready to start with ${playerCount} players!`
              : 'Fill in all player names with unique values to enable the start button'
            }
          </div>
        </div>

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