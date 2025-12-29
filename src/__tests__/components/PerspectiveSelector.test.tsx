import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PerspectiveSelector } from '../../components/PerspectiveSelector'
import { Player } from '../../types'

// Mock players for testing
const mockPlayers: Player[] = [
  {
    id: 0,
    name: 'Alice',
    hand: [],
    offer: [],
    collection: [],
    points: 0,
    hasMoney: true
  },
  {
    id: 1,
    name: 'Bob',
    hand: [],
    offer: [],
    collection: [],
    points: 0,
    hasMoney: false
  },
  {
    id: 2,
    name: 'Charlie',
    hand: [],
    offer: [],
    collection: [],
    points: 0,
    hasMoney: false
  }
]

describe('PerspectiveSelector', () => {
  const mockOnPerspectiveChange = jest.fn()

  beforeEach(() => {
    mockOnPerspectiveChange.mockClear()
  })

  it('renders with all player options', () => {
    render(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={0}
        onPerspectiveChange={mockOnPerspectiveChange}
      />
    )

    expect(screen.getByLabelText('View as:')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice')).toBeInTheDocument()
    
    // Check that all players are available as options
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent('Alice')
    expect(options[1]).toHaveTextContent('Bob')
    expect(options[2]).toHaveTextContent('Charlie')
  })

  it('shows the correct selected perspective', () => {
    render(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={1}
        onPerspectiveChange={mockOnPerspectiveChange}
      />
    )

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('1')
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()
  })

  it('calls onPerspectiveChange when selection changes', () => {
    render(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={0}
        onPerspectiveChange={mockOnPerspectiveChange}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '2' } })

    expect(mockOnPerspectiveChange).toHaveBeenCalledWith(2)
    expect(mockOnPerspectiveChange).toHaveBeenCalledTimes(1)
  })

  it('maintains independence from current acting player', () => {
    // This test verifies that the perspective selector is independent
    // from game state like current player or buyer
    render(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={2}
        onPerspectiveChange={mockOnPerspectiveChange}
      />
    )

    // The selected perspective should be Charlie (index 2)
    // even though Alice (index 0) has the money bag
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('2')
    expect(screen.getByDisplayValue('Charlie')).toBeInTheDocument()
  })

  it('handles empty players array gracefully', () => {
    render(
      <PerspectiveSelector
        players={[]}
        selectedPerspective={0}
        onPerspectiveChange={mockOnPerspectiveChange}
      />
    )

    expect(screen.getByLabelText('View as:')).toBeInTheDocument()
    const options = screen.queryAllByRole('option')
    expect(options).toHaveLength(0)
  })

  it('allows switching perspectives at any time', () => {
    const { rerender } = render(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={0}
        onPerspectiveChange={mockOnPerspectiveChange}
      />
    )

    // Switch to Bob's perspective
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '1' } })
    expect(mockOnPerspectiveChange).toHaveBeenCalledWith(1)

    // Re-render with new perspective
    rerender(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={1}
        onPerspectiveChange={mockOnPerspectiveChange}
      />
    )

    // Should now show Bob as selected
    expect(screen.getByDisplayValue('Bob')).toBeInTheDocument()

    // Switch to Charlie's perspective
    fireEvent.change(select, { target: { value: '2' } })
    expect(mockOnPerspectiveChange).toHaveBeenCalledWith(2)
    expect(mockOnPerspectiveChange).toHaveBeenCalledTimes(2)
  })
})