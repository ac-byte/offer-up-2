import React from 'react'
import { Player } from '../types'
import './PerspectiveSelector.css'

interface PerspectiveSelectorProps {
  players: Player[]
  selectedPerspective: number
  autoFollowPerspective: boolean
  onPerspectiveChange: (playerId: number) => void
  onToggleAutoFollow: () => void
}

export const PerspectiveSelector: React.FC<PerspectiveSelectorProps> = ({
  players,
  selectedPerspective,
  autoFollowPerspective,
  onPerspectiveChange,
  onToggleAutoFollow
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const playerId = parseInt(event.target.value, 10)
    onPerspectiveChange(playerId)
  }

  return (
    <div className="perspective-selector">
      <label htmlFor="perspective-select" className="perspective-label">
        View as:
      </label>
      <select
        id="perspective-select"
        className="perspective-dropdown"
        value={selectedPerspective}
        onChange={handleChange}
      >
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.name}
          </option>
        ))}
      </select>
      
      <div className="auto-follow-control">
        <label className="auto-follow-label">
          <input
            type="checkbox"
            checked={autoFollowPerspective}
            onChange={onToggleAutoFollow}
            className="auto-follow-checkbox"
          />
          <span className={`auto-follow-text ${autoFollowPerspective ? 'auto-follow-active' : 'auto-follow-manual'}`}>
            {autoFollowPerspective ? '🔄 Auto-follow active player' : '👤 Manual perspective'}
          </span>
        </label>
      </div>
    </div>
  )
}