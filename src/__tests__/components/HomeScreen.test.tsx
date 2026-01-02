import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HomeScreen } from '../../components/HomeScreen'
import { GameAction } from '../../types'

describe('HomeScreen', () => {
  const mockOnStartGame = jest.fn()

  beforeEach(() => {
    mockOnStartGame.mockClear()
  })

  describe('Basic Rendering', () => {
    it('renders the game title and description', () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      expect(screen.getByText('Offer Up')).toBeInTheDocument()
      expect(screen.getByText(/A game of trades and hidden information/)).toBeInTheDocument()
    })


    it('renders player configuration section', () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      expect(screen.getByText('Player Names')).toBeInTheDocument()
    })

    it('renders start game button', () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      expect(screen.getByRole('button', { name: /Start Game/ })).toBeInTheDocument()
    })

    it('renders rules summary', () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      expect(screen.getByText('Quick Rules:')).toBeInTheDocument()
      expect(screen.getByText(/Objective:/)).toBeInTheDocument()
      expect(screen.getByText(/Strategy:/)).toBeInTheDocument()
    })
  })

  describe('Player Configuration', () => {
    it('initializes with 4 players and default names', () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Check that 4 player inputs are rendered
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Diana')).toBeInTheDocument()
    })

    it('updates player inputs when player count changes', async () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Change to 3 players
      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '3' } })
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
        expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument()
        expect(screen.queryByDisplayValue('Diana')).not.toBeInTheDocument()
      })
    })

    it('enables start button when all names are valid and unique', () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      const startButton = screen.getByRole('button', { name: /Start Game/ })
      expect(startButton).not.toBeDisabled()
    })

    it('disables start button when names are empty', async () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Clear one of the names
      const aliceInput = screen.getByDisplayValue('Alice')
      fireEvent.change(aliceInput, { target: { value: '' } })
      
      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /Complete Setup to Start/ })
        expect(startButton).toBeDisabled()
      })
    })

    it('disables start button when names are duplicated', async () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Make Bob's name the same as Alice's
      const bobInput = screen.getByDisplayValue('Bob')
      fireEvent.change(bobInput, { target: { value: 'Alice' } })
      
      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /Complete Setup to Start/ })
        expect(startButton).toBeDisabled()
      })
    })
  })

  describe('Validation', () => {
    it('shows validation errors for empty names', async () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Clear one of the names
      const aliceInput = screen.getByDisplayValue('Alice')
      fireEvent.change(aliceInput, { target: { value: '' } })
      
      await waitFor(() => {
        expect(screen.getAllByText(/All player names must be filled in/)).toHaveLength(2)
      })
    })

    it('shows validation errors for duplicate names', async () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Make Bob's name the same as Alice's
      const bobInput = screen.getByDisplayValue('Bob')
      fireEvent.change(bobInput, { target: { value: 'Alice' } })
      
      await waitFor(() => {
        expect(screen.getAllByText(/Player names must be unique/)).toHaveLength(2)
      })
    })

    it('clears validation errors when issues are fixed', async () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Create a duplicate name
      const bobInput = screen.getByDisplayValue('Bob')
      fireEvent.change(bobInput, { target: { value: 'Alice' } })
      
      await waitFor(() => {
        expect(screen.getAllByText(/Player names must be unique/)).toHaveLength(2)
      })
      
      // Fix the duplicate
      fireEvent.change(bobInput, { target: { value: 'Bob' } })
      
      await waitFor(() => {
        expect(screen.queryByText(/Player names must be unique/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Game Start', () => {
    it('calls onStartGame with correct action when start button is clicked', () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      const startButton = screen.getByRole('button', { name: /Start Game/ })
      fireEvent.click(startButton)
      
      expect(mockOnStartGame).toHaveBeenCalledWith({
        type: 'START_GAME',
        players: ['Alice', 'Bob', 'Charlie', 'Diana']
      })
    })

    it('calls onStartGame with custom player names', async () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Change player names
      const aliceInput = screen.getByDisplayValue('Alice')
      const bobInput = screen.getByDisplayValue('Bob')
      
      fireEvent.change(aliceInput, { target: { value: 'Player1' } })
      fireEvent.change(bobInput, { target: { value: 'Player2' } })
      
      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /Start Game/ })
        fireEvent.click(startButton)
        
        expect(mockOnStartGame).toHaveBeenCalledWith({
          type: 'START_GAME',
          players: ['Player1', 'Player2', 'Charlie', 'Diana']
        })
      })
    })

    it('calls onStartGame with different player count', async () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Change to 3 players
      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '3' } })
      
      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /Start Game/ })
        fireEvent.click(startButton)
        
        expect(mockOnStartGame).toHaveBeenCalledWith({
          type: 'START_GAME',
          players: ['Alice', 'Bob', 'Charlie']
        })
      })
    })

    it('does not call onStartGame when button is disabled', async () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Clear one of the names to disable the button
      const aliceInput = screen.getByDisplayValue('Alice')
      fireEvent.change(aliceInput, { target: { value: '' } })
      
      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /Complete Setup to Start/ })
        expect(startButton).toBeDisabled()
        
        fireEvent.click(startButton)
        expect(mockOnStartGame).not.toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      const startButton = screen.getByRole('button', { name: /Start Game/ })
      expect(startButton).toHaveAttribute('aria-describedby', 'start-button-help')
    })

    it('provides helpful text for button state', () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      expect(screen.getByText(/Ready to start with 4 players!/)).toBeInTheDocument()
    })

    it('updates help text when button is disabled', async () => {
      render(<HomeScreen onStartGame={mockOnStartGame} />)
      
      // Clear one of the names
      const aliceInput = screen.getByDisplayValue('Alice')
      fireEvent.change(aliceInput, { target: { value: '' } })
      
      await waitFor(() => {
        expect(screen.getByText(/Fill in all player names with unique values/)).toBeInTheDocument()
      })
    })
  })
})