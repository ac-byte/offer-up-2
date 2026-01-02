import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PlayerCountSlider } from '../../components/PlayerCountSlider'

describe('PlayerCountSlider', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('renders with correct initial value', () => {
    render(<PlayerCountSlider playerCount={4} onChange={mockOnChange} />)
    
    expect(screen.getByDisplayValue('4')).toBeInTheDocument()
    expect(screen.getByText('Players')).toBeInTheDocument()
    
    // Check that the current value display shows 4
    const valueNumber = screen.getByText('4', { selector: '.value-number' })
    expect(valueNumber).toBeInTheDocument()
  })

  it('displays correct label and help text', () => {
    render(<PlayerCountSlider playerCount={3} onChange={mockOnChange} />)
    
    expect(screen.getByText('Number of Players')).toBeInTheDocument()
    expect(screen.getByText('Select between 3 and 6 players for your game')).toBeInTheDocument()
  })

  it('calls onChange when slider value changes', () => {
    render(<PlayerCountSlider playerCount={4} onChange={mockOnChange} />)
    
    const slider = screen.getByDisplayValue('4')
    fireEvent.change(slider, { target: { value: '5' } })
    
    expect(mockOnChange).toHaveBeenCalledWith(5)
  })

  it('shows correct number of active player indicators', () => {
    render(<PlayerCountSlider playerCount={3} onChange={mockOnChange} />)
    
    const indicators = screen.getAllByTitle(/Player \d+/)
    expect(indicators).toHaveLength(6)
    
    // Check that first 3 are active (included)
    expect(screen.getByTitle('Player 1 (included)')).toBeInTheDocument()
    expect(screen.getByTitle('Player 2 (included)')).toBeInTheDocument()
    expect(screen.getByTitle('Player 3 (included)')).toBeInTheDocument()
    
    // Check that last 3 are inactive (not included)
    expect(screen.getByTitle('Player 4 (not included)')).toBeInTheDocument()
    expect(screen.getByTitle('Player 5 (not included)')).toBeInTheDocument()
    expect(screen.getByTitle('Player 6 (not included)')).toBeInTheDocument()
  })

  it('displays singular "Player" for count of 1', () => {
    render(<PlayerCountSlider playerCount={1} onChange={mockOnChange} />)
    
    expect(screen.getByText('Player')).toBeInTheDocument()
  })

  it('displays plural "Players" for count greater than 1', () => {
    render(<PlayerCountSlider playerCount={5} onChange={mockOnChange} />)
    
    expect(screen.getByText('Players')).toBeInTheDocument()
  })

  it('can be disabled', () => {
    render(<PlayerCountSlider playerCount={4} onChange={mockOnChange} disabled />)
    
    const slider = screen.getByDisplayValue('4')
    expect(slider).toBeDisabled()
  })

  it('shows tick marks for all valid values', () => {
    render(<PlayerCountSlider playerCount={4} onChange={mockOnChange} />)
    
    // Check that tick labels for 3, 4, 5, 6 are present using more specific selectors
    const tickLabels = screen.getAllByText(/^[3-6]$/)
    expect(tickLabels).toHaveLength(5) // 4 tick labels + 1 current value display
    
    // Verify specific tick labels exist
    expect(screen.getByText('3', { selector: '.tick-label' })).toBeInTheDocument()
    expect(screen.getByText('5', { selector: '.tick-label' })).toBeInTheDocument()
    expect(screen.getByText('6', { selector: '.tick-label' })).toBeInTheDocument()
  })

  it('handles edge cases correctly', () => {
    // Test minimum value
    render(<PlayerCountSlider playerCount={3} onChange={mockOnChange} />)
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
    
    // Test maximum value
    render(<PlayerCountSlider playerCount={6} onChange={mockOnChange} />)
    expect(screen.getByDisplayValue('6')).toBeInTheDocument()
  })
})