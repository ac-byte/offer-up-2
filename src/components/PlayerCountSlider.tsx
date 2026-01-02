import React from 'react'
import './PlayerCountSlider.css'

export interface PlayerCountSliderProps {
  playerCount: number
  onChange: (count: number) => void
  disabled?: boolean
}

export const PlayerCountSlider: React.FC<PlayerCountSliderProps> = ({
  playerCount,
  onChange,
  disabled = false
}) => {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(event.target.value, 10)
    onChange(newCount)
  }

  const getSliderBackground = () => {
    // Calculate the percentage for the filled portion
    const percentage = ((playerCount - 3) / (6 - 3)) * 100
    return `linear-gradient(to right, #007bff 0%, #007bff ${percentage}%, #dee2e6 ${percentage}%, #dee2e6 100%)`
  }

  return (
    <div className="player-count-slider">
      <label htmlFor="player-count-input" className="slider-label">
        Number of Players
      </label>
      
      <div className="slider-container">
        <div className="slider-wrapper">
          <input
            id="player-count-input"
            type="range"
            min="3"
            max="6"
            step="1"
            value={playerCount}
            onChange={handleSliderChange}
            disabled={disabled}
            className="slider-input"
            style={{ background: getSliderBackground() }}
          />
          
          {/* Tick marks and labels */}
          <div className="slider-ticks">
            {[3, 4, 5, 6].map((count) => (
              <div
                key={count}
                className={`tick ${count === playerCount ? 'active' : ''}`}
                style={{ left: `${((count - 3) / (6 - 3)) * 100}%` }}
              >
                <div className="tick-mark" />
                <div className="tick-label">{count}</div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Current value display */}
        <div className="current-value">
          <span className="value-number">{playerCount}</span>
          <span className="value-text">
            {playerCount === 1 ? 'Player' : 'Players'}
          </span>
        </div>
      </div>
      
      {/* Visual indicators for player count */}
      <div className="player-indicators">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className={`player-indicator ${index < playerCount ? 'active' : 'inactive'}`}
            title={`Player ${index + 1}${index < playerCount ? ' (included)' : ' (not included)'}`}
          >
            <div className="player-icon">👤</div>
          </div>
        ))}
      </div>
      
      {/* Helper text */}
      <div className="slider-help-text">
        Select between 3 and 6 players for your game
      </div>
    </div>
  )
}