import React from 'react'
import './PlayerNameInputs.css'

export interface PlayerNameInputsProps {
  playerCount: number
  playerNames: string[]
  onChange: (names: string[]) => void
  disabled?: boolean
}

// Default names as specified in requirements
const DEFAULT_NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eric', 'Fran']

export const PlayerNameInputs: React.FC<PlayerNameInputsProps> = ({
  playerCount,
  playerNames,
  onChange,
  disabled = false
}) => {
  // Validation logic
  const validateNames = (names: string[]): { hasEmpty: boolean; hasDuplicates: boolean; duplicateNames: string[] } => {
    const nonEmptyNames = names.filter(name => name.trim().length > 0)
    const hasEmpty = nonEmptyNames.length !== names.length
    
    const nameCount = new Map<string, string[]>()
    const duplicateNames: string[] = []
    
    names.forEach(name => {
      const trimmedName = name.trim()
      const lowerName = trimmedName.toLowerCase()
      
      if (trimmedName) {
        if (!nameCount.has(lowerName)) {
          nameCount.set(lowerName, [])
        }
        nameCount.get(lowerName)!.push(trimmedName)
      }
    })
    
    // Find all names that appear more than once (case-insensitive)
    nameCount.forEach((originalNames) => {
      if (originalNames.length > 1) {
        originalNames.forEach(originalName => {
          if (!duplicateNames.includes(originalName)) {
            duplicateNames.push(originalName)
          }
        })
      }
    })
    
    const hasDuplicates = duplicateNames.length > 0
    
    return { hasEmpty, hasDuplicates, duplicateNames }
  }

  const validation = validateNames(playerNames)

  const handleNameChange = (index: number, newName: string) => {
    const updatedNames = [...playerNames]
    updatedNames[index] = newName
    onChange(updatedNames)
  }

  const getInputClassName = (index: number) => {
    const name = playerNames[index]?.trim() || ''
    let className = 'name-input'
    
    if (name === '') {
      className += ' error empty'
    } else if (validation.duplicateNames.includes(name)) {
      className += ' error duplicate'
    } else {
      className += ' valid'
    }
    
    if (disabled) {
      className += ' disabled'
    }
    
    return className
  }

  const getInputErrorMessage = (index: number) => {
    const name = playerNames[index]?.trim() || ''
    
    if (name === '') {
      return 'Name cannot be empty'
    } else if (validation.duplicateNames.includes(name)) {
      return 'Name must be unique'
    }
    
    return null
  }

  return (
    <div className="player-name-inputs">
      <label className="inputs-label">
        Player Names
      </label>
      
      <div className="inputs-grid">
        {Array.from({ length: playerCount }, (_, index) => {
          const errorMessage = getInputErrorMessage(index)
          const inputId = `player-name-${index}`
          
          return (
            <div key={index} className="input-wrapper">
              <label htmlFor={inputId} className="input-label">
                Player {index + 1}
              </label>
              
              <input
                id={inputId}
                type="text"
                value={playerNames[index] || ''}
                onChange={(e) => handleNameChange(index, e.target.value)}
                placeholder={DEFAULT_NAMES[index] || `Player ${index + 1}`}
                disabled={disabled}
                className={getInputClassName(index)}
                maxLength={20}
                autoComplete="off"
                aria-describedby={errorMessage ? `${inputId}-error` : undefined}
                aria-invalid={errorMessage ? 'true' : 'false'}
              />
              
              {errorMessage && (
                <div 
                  id={`${inputId}-error`}
                  className="error-message"
                  role="alert"
                  aria-live="polite"
                >
                  {errorMessage}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Global validation messages */}
      {validation.hasEmpty && (
        <div className="global-error" role="alert" aria-live="polite">
          ⚠️ All player names must be filled in
        </div>
      )}
      
      {validation.hasDuplicates && (
        <div className="global-error" role="alert" aria-live="polite">
          ⚠️ Player names must be unique
        </div>
      )}
      
      {/* Helper text */}
      <div className="inputs-help-text">
        Enter unique names for each player. Names cannot be empty.
      </div>
    </div>
  )
}