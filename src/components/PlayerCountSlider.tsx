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
          
          {/* Tick marks only (no labels) */}
          <div className="slider-ticks">
            {[
              { count: 3, position: '4.5%' },
              { count: 4, position: '35%' },
              { count: 5, position: '64.6%' },
              { count: 6, position: '94.5%' }
            ].map(({ count, position }) => (
              <div
                key={count}
                className={`tick ${count === playerCount ? 'active' : ''}`}
                style={{ left: position }}
              >
                <div className="tick-mark" />
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