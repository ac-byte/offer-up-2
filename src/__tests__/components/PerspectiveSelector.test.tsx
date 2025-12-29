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
  const mockOnToggleAutoFollow = jest.fn()

  beforeEach(() => {
    mockOnPerspectiveChange.mockClear()
    mockOnToggleAutoFollow.mockClear()
  })

  it('renders with all player options', () => {
    render(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={0}
        autoFollowPerspective={true}
        onPerspectiveChange={mockOnPerspectiveChange}
        onToggleAutoFollow={mockOnToggleAutoFollow}
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
        autoFollowPerspective={true}
        onPerspectiveChange={mockOnPerspectiveChange}
        onToggleAutoFollow={mockOnToggleAutoFollow}
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
        autoFollowPerspective={true}
        onPerspectiveChange={mockOnPerspectiveChange}
        onToggleAutoFollow={mockOnToggleAutoFollow}
      />
    )

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '2' } })

    expect(mockOnPerspectiveChange).toHaveBeenCalledWith(2)
    expect(mockOnPerspectiveChange).toHaveBeenCalledTimes(1)
  })

  it('displays auto-follow control with correct state', () => {
    render(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={0}
        autoFollowPerspective={true}
        onPerspectiveChange={mockOnPerspectiveChange}
        onToggleAutoFollow={mockOnToggleAutoFollow}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).toBeChecked()
    expect(screen.getByText('🔄 Auto-follow active player')).toBeInTheDocument()
  })

  it('displays manual mode when auto-follow is disabled', () => {
    render(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={0}
        autoFollowPerspective={false}
        onPerspectiveChange={mockOnPerspectiveChange}
        onToggleAutoFollow={mockOnToggleAutoFollow}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox).not.toBeChecked()
    expect(screen.getByText('👤 Manual perspective')).toBeInTheDocument()
  })

  it('calls onToggleAutoFollow when checkbox is clicked', () => {
    render(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={0}
        autoFollowPerspective={true}
        onPerspectiveChange={mockOnPerspectiveChange}
        onToggleAutoFollow={mockOnToggleAutoFollow}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)

    expect(mockOnToggleAutoFollow).toHaveBeenCalledTimes(1)
  })

  it('maintains independence from current acting player', () => {
    // This test verifies that the perspective selector is independent
    // from game state like current player or buyer
    render(
      <PerspectiveSelector
        players={mockPlayers}
        selectedPerspective={2}
        autoFollowPerspective={false}
        onPerspectiveChange={mockOnPerspectiveChange}
        onToggleAutoFollow={mockOnToggleAutoFollow}
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
        autoFollowPerspective={true}
        onPerspectiveChange={mockOnPerspectiveChange}
        onToggleAutoFollow={mockOnToggleAutoFollow}
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
        autoFollowPerspective={false}
        onPerspectiveChange={mockOnPerspectiveChange}
        onToggleAutoFollow={mockOnToggleAutoFollow}
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
        autoFollowPerspective={false}
        onPerspectiveChange={mockOnPerspectiveChange}
        onToggleAutoFollow={mockOnToggleAutoFollow}
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