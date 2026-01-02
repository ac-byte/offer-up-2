import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PlayerNameInputs } from '../../components/PlayerNameInputs'

describe('PlayerNameInputs', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  describe('Basic Rendering', () => {
    it('renders with correct number of inputs based on player count', () => {
      render(
        <PlayerNameInputs
          playerCount={4}
          playerNames={['Alice', 'Bob', 'Charlie', 'Diana']}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.getByText('Player Names')).toBeInTheDocument()
      expect(screen.getByLabelText('Player 1')).toBeInTheDocument()
      expect(screen.getByLabelText('Player 2')).toBeInTheDocument()
      expect(screen.getByLabelText('Player 3')).toBeInTheDocument()
      expect(screen.getByLabelText('Player 4')).toBeInTheDocument()
      expect(screen.queryByLabelText('Player 5')).not.toBeInTheDocument()
    })

    it('displays help text', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.getByText('Enter unique names for each player. Names cannot be empty.')).toBeInTheDocument()
    })

    it('shows default names as placeholders', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['', '', '']}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.getByPlaceholderText('Alice')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Bob')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Charlie')).toBeInTheDocument()
    })
  })

  describe('Default Name Population', () => {
    it('uses correct default names in order', () => {
      const defaultNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eric', 'Fran']
      
      render(
        <PlayerNameInputs
          playerCount={6}
          playerNames={defaultNames}
          onChange={mockOnChange}
        />
      )
      
      defaultNames.forEach((name, index) => {
        expect(screen.getByDisplayValue(name)).toBeInTheDocument()
      })
    })

    it('handles player counts beyond default names', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['', '', '']}
          onChange={mockOnChange}
        />
      )
      
      // Should still show placeholders for available default names
      expect(screen.getByPlaceholderText('Alice')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Bob')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Charlie')).toBeInTheDocument()
    })
  })

  describe('Name Input Changes', () => {
    it('calls onChange when name is updated', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      const firstInput = screen.getByDisplayValue('Alice')
      fireEvent.change(firstInput, { target: { value: 'Alex' } })
      
      expect(mockOnChange).toHaveBeenCalledWith(['Alex', 'Bob', 'Charlie'])
    })

    it('handles multiple name changes correctly', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      const secondInput = screen.getByDisplayValue('Bob')
      fireEvent.change(secondInput, { target: { value: 'Bobby' } })
      
      expect(mockOnChange).toHaveBeenCalledWith(['Alice', 'Bobby', 'Charlie'])
    })

    it('handles clearing a name', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      const firstInput = screen.getByDisplayValue('Alice')
      fireEvent.change(firstInput, { target: { value: '' } })
      
      expect(mockOnChange).toHaveBeenCalledWith(['', 'Bob', 'Charlie'])
    })
  })

  describe('Empty Name Validation', () => {
    it('shows error for empty names', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', '', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.getByText('Name cannot be empty')).toBeInTheDocument()
      expect(screen.getByText('⚠️ All player names must be filled in')).toBeInTheDocument()
    })

    it('shows error for whitespace-only names', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', '   ', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.getByText('Name cannot be empty')).toBeInTheDocument()
      expect(screen.getByText('⚠️ All player names must be filled in')).toBeInTheDocument()
    })

    it('applies error styling to empty inputs', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', '', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      const emptyInput = screen.getByLabelText('Player 2')
      expect(emptyInput).toHaveClass('error', 'empty')
    })
  })

  describe('Duplicate Name Validation', () => {
    it('shows error for duplicate names', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Alice']}
          onChange={mockOnChange}
        />
      )
      
      const errorMessages = screen.getAllByText('Name must be unique')
      expect(errorMessages).toHaveLength(2) // Both Alice inputs should show error
      expect(screen.getByText('⚠️ Player names must be unique')).toBeInTheDocument()
    })

    it('handles case-insensitive duplicate detection', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'ALICE', 'Bob']}
          onChange={mockOnChange}
        />
      )
      
      const errorMessages = screen.getAllByText('Name must be unique')
      expect(errorMessages).toHaveLength(2) // Both Alice and ALICE should show error
    })

    it('applies error styling to duplicate inputs', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Alice']}
          onChange={mockOnChange}
        />
      )
      
      const inputs = screen.getAllByDisplayValue('Alice')
      
      inputs.forEach(input => {
        expect(input).toHaveClass('error', 'duplicate')
      })
    })
  })

  describe('Valid Name Styling', () => {
    it('applies valid styling to correct names', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      const aliceInput = screen.getByDisplayValue('Alice')
      const bobInput = screen.getByDisplayValue('Bob')
      const charlieInput = screen.getByDisplayValue('Charlie')
      
      expect(aliceInput).toHaveClass('valid')
      expect(bobInput).toHaveClass('valid')
      expect(charlieInput).toHaveClass('valid')
    })

    it('does not show global error messages when all names are valid', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.queryByText('⚠️ All player names must be filled in')).not.toBeInTheDocument()
      expect(screen.queryByText('⚠️ Player names must be unique')).not.toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('disables all inputs when disabled prop is true', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
          disabled={true}
        />
      )
      
      const aliceInput = screen.getByDisplayValue('Alice')
      const bobInput = screen.getByDisplayValue('Bob')
      const charlieInput = screen.getByDisplayValue('Charlie')
      
      expect(aliceInput).toBeDisabled()
      expect(bobInput).toBeDisabled()
      expect(charlieInput).toBeDisabled()
    })

    it('applies disabled styling', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
          disabled={true}
        />
      )
      
      const aliceInput = screen.getByDisplayValue('Alice')
      expect(aliceInput).toHaveClass('disabled')
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes for error states', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', '', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      const emptyInput = screen.getByLabelText('Player 2')
      expect(emptyInput).toHaveAttribute('aria-invalid', 'true')
      expect(emptyInput).toHaveAttribute('aria-describedby', 'player-name-1-error')
    })

    it('has proper ARIA attributes for valid states', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      const validInput = screen.getByDisplayValue('Alice')
      expect(validInput).toHaveAttribute('aria-invalid', 'false')
      expect(validInput).not.toHaveAttribute('aria-describedby')
    })

    it('has role="alert" on error messages', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', '', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      const errorMessage = screen.getByText('Name cannot be empty')
      expect(errorMessage).toHaveAttribute('role', 'alert')
      expect(errorMessage).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('Dynamic Player Count Changes', () => {
    it('handles increasing player count', () => {
      const { rerender } = render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      rerender(
        <PlayerNameInputs
          playerCount={4}
          playerNames={['Alice', 'Bob', 'Charlie', 'Diana']}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.getByLabelText('Player 4')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Diana')).toBeInTheDocument()
    })

    it('handles decreasing player count', () => {
      const { rerender } = render(
        <PlayerNameInputs
          playerCount={4}
          playerNames={['Alice', 'Bob', 'Charlie', 'Diana']}
          onChange={mockOnChange}
        />
      )
      
      rerender(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice', 'Bob', 'Charlie']}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.queryByLabelText('Player 4')).not.toBeInTheDocument()
      expect(screen.queryByDisplayValue('Diana')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles maximum length input', () => {
      render(
        <PlayerNameInputs
          playerCount={1}
          playerNames={['A'.repeat(20)]}
          onChange={mockOnChange}
        />
      )
      
      const input = screen.getByDisplayValue('A'.repeat(20))
      expect(input).toHaveAttribute('maxLength', '20')
    })

    it('handles special characters in names', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={['Alice-Jane', "Bob's", 'Charlie123']}
          onChange={mockOnChange}
        />
      )
      
      expect(screen.getByDisplayValue('Alice-Jane')).toBeInTheDocument()
      expect(screen.getByDisplayValue("Bob's")).toBeInTheDocument()
      expect(screen.getByDisplayValue('Charlie123')).toBeInTheDocument()
    })

    it('handles empty playerNames array', () => {
      render(
        <PlayerNameInputs
          playerCount={3}
          playerNames={[]}
          onChange={mockOnChange}
        />
      )
      
      // Should render inputs with empty values
      expect(screen.getByLabelText('Player 1')).toHaveValue('')
      expect(screen.getByLabelText('Player 2')).toHaveValue('')
      expect(screen.getByLabelText('Player 3')).toHaveValue('')
    })
  })
})