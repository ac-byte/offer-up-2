import React from 'react'
import { Player } from '../types'
import './PerspectiveSelector.css'

interface PerspectiveSelectorProps {
  players: Player[]
  selectedPerspective: number
  onPerspectiveChange: (playerId: number) => void
}

export const PerspectiveSelector: React.FC<PerspectiveSelectorProps> = ({
  players,
  selectedPerspective,
  onPerspectiveChange
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
    </div>
  )
}