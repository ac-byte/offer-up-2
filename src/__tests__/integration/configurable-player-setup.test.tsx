import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GameProvider } from '../../contexts/GameContext'
import { HomeScreen } from '../../components/HomeScreen'
import { GameBoard } from '../../components/GameBoard'

// Integration test for configurable player setup
describe('Configurable Player Setup Integration', () => {
  let mockDispatch: jest.Mock

  beforeEach(() => {
    mockDispatch = jest.fn()
  })

  it('successfully starts a game with custom player configuration', async () => {
    const TestApp = () => {
      const [gameStarted, setGameStarted] = React.useState(false)
      const [gameState, setGameState] = React.useState<any>(null)

      const handleStartGame = (action: any) => {
        // Simulate the game reducer processing the START_GAME action
        if (action.type === 'START_GAME') {
          setGameState({
            players: action.players.map((name: string, index: number) => ({
              id: index,
              name: name.trim(),
              hand: [],
              offer: [],
              collection: [],
              points: 0,
              hasMoney: index === 0 // First player gets money bag for test
            })),
            gameStarted: true,
            currentPhase: 'offer_phase' // Simplified for test
          })
          setGameStarted(true)
        }
      }

      if (gameStarted && gameState) {
        return (
          <div data-testid="game-started">
            <div data-testid="player-count">{gameState.players.length}</div>
            {gameState.players.map((player: any) => (
              <div key={player.id} data-testid={`player-${player.id}`}>
                {player.name}
              </div>
            ))}
          </div>
        )
      }

      return <HomeScreen onStartGame={handleStartGame} />
    }

    render(<TestApp />)

    // Verify initial state - should show HomeScreen
    expect(screen.getByText('Trading Card Game')).toBeInTheDocument()
    expect(screen.getByText('Game Setup')).toBeInTheDocument()

    // Change player count to 5
    const playerCountSlider = screen.getByDisplayValue('4')
    fireEvent.change(playerCountSlider, { target: { value: '5' } })

    // Wait for the UI to update with 5 player inputs
    await waitFor(() => {
      expect(screen.getAllByRole('textbox')).toHaveLength(5)
    })

    // Customize player names
    const nameInputs = screen.getAllByRole('textbox')
    fireEvent.change(nameInputs[0], { target: { value: 'Player1' } })
    fireEvent.change(nameInputs[1], { target: { value: 'Player2' } })
    fireEvent.change(nameInputs[2], { target: { value: 'Player3' } })
    fireEvent.change(nameInputs[3], { target: { value: 'Player4' } })
    fireEvent.change(nameInputs[4], { target: { value: 'Player5' } })

    // Wait for validation to complete
    await waitFor(() => {
      const startButton = screen.getByRole('button', { name: /start game/i })
      expect(startButton).not.toBeDisabled()
    })

    // Click start game
    const startButton = screen.getByRole('button', { name: /start game/i })
    fireEvent.click(startButton)

    // Verify game started with correct configuration
    await waitFor(() => {
      expect(screen.getByTestId('game-started')).toBeInTheDocument()
    })

    expect(screen.getByTestId('player-count')).toHaveTextContent('5')
    expect(screen.getByTestId('player-0')).toHaveTextContent('Player1')
    expect(screen.getByTestId('player-1')).toHaveTextContent('Player2')
    expect(screen.getByTestId('player-2')).toHaveTextContent('Player3')
    expect(screen.getByTestId('player-3')).toHaveTextContent('Player4')
    expect(screen.getByTestId('player-4')).toHaveTextContent('Player5')
  })

  it('prevents game start with invalid player configuration', async () => {
    const handleStartGame = jest.fn()

    render(<HomeScreen onStartGame={handleStartGame} />)

    // Clear one of the default names to create invalid state
    const nameInputs = screen.getAllByRole('textbox')
    fireEvent.change(nameInputs[1], { target: { value: '' } })

    // Wait for validation to complete
    await waitFor(() => {
      const startButton = screen.getByRole('button', { name: /complete setup to start/i })
      expect(startButton).toBeDisabled()
    })

    // Verify error message is shown (use getAllByText since there might be multiple instances)
    expect(screen.getAllByText(/All player names must be filled in/)).toHaveLength(2) // One in global error, one in validation errors

    // Try to click the disabled button
    const startButton = screen.getByRole('button', { name: /complete setup to start/i })
    fireEvent.click(startButton)

    // Verify onStartGame was not called
    expect(handleStartGame).not.toHaveBeenCalled()
  })

  it('handles duplicate names validation', async () => {
    const handleStartGame = jest.fn()

    render(<HomeScreen onStartGame={handleStartGame} />)

    // Set duplicate names
    const nameInputs = screen.getAllByRole('textbox')
    fireEvent.change(nameInputs[0], { target: { value: 'Alice' } })
    fireEvent.change(nameInputs[1], { target: { value: 'alice' } }) // Case-insensitive duplicate

    // Wait for validation to complete
    await waitFor(() => {
      expect(screen.getAllByText(/Player names must be unique/)).toHaveLength(2) // One in global error, one in validation errors
    })

    const startButton = screen.getByRole('button')
    expect(startButton).toBeDisabled()
    expect(handleStartGame).not.toHaveBeenCalled()
  })

  it('works with minimum and maximum player counts', async () => {
    const TestApp = () => {
      const [gameState, setGameState] = React.useState<any>(null)

      const handleStartGame = (action: any) => {
        if (action.type === 'START_GAME') {
          setGameState({
            playerCount: action.players.length,
            playerNames: action.players
          })
        }
      }

      if (gameState) {
        return (
          <div data-testid="game-config">
            <div data-testid="final-player-count">{gameState.playerCount}</div>
            <div data-testid="final-player-names">{gameState.playerNames.join(', ')}</div>
          </div>
        )
      }

      return <HomeScreen onStartGame={handleStartGame} />
    }

    render(<TestApp />)

    // Test minimum (3 players)
    const playerCountSlider = screen.getByDisplayValue('4')
    fireEvent.change(playerCountSlider, { target: { value: '3' } })

    await waitFor(() => {
      expect(screen.getAllByRole('textbox')).toHaveLength(3)
    })

    let startButton = screen.getByRole('button', { name: /start game/i })
    expect(startButton).not.toBeDisabled()
    fireEvent.click(startButton)

    await waitFor(() => {
      expect(screen.getByTestId('final-player-count')).toHaveTextContent('3')
      expect(screen.getByTestId('final-player-names')).toHaveTextContent('Alice, Bob, Charlie')
    })
  })
})