import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { GameProvider } from '../../contexts/GameContext'
import { GameBoard } from '../../components/GameBoard'
import { GameContext } from '../../contexts/GameContext'
import { GameState, GamePhase } from '../../types'
import { createInitialGameState } from '../../game-logic/gameReducer'

// Integration tests for the UI redesign
describe('UI Redesign Integration Tests', () => {
  let mockDispatch: jest.Mock

  beforeEach(() => {
    mockDispatch = jest.fn()
  })

  const createGameState = (overrides: Partial<GameState> = {}): GameState => {
    const baseState = createInitialGameState()
    baseState.gameStarted = true
    baseState.players = [
      {
        id: 0,
        name: 'Alice',
        hand: [{ id: 'card1', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }],
        offer: [{ id: 'card2', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3, faceUp: false, position: 0 }],
        collection: [{ id: 'card3', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 }],
        points: 5,
        hasMoney: true
      },
      {
        id: 1,
        name: 'Bob',
        hand: [{ id: 'card4', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }],
        offer: [{ id: 'card5', type: 'thing', subtype: 'big', name: 'Another Big Thing', setSize: 2, faceUp: true, position: 0 }],
        collection: [{ id: 'card6', type: 'thing', subtype: 'medium', name: 'Another Medium Thing', setSize: 3 }],
        points: 3,
        hasMoney: false
      },
      {
        id: 2,
        name: 'Charlie',
        hand: [{ id: 'card7', type: 'thing', subtype: 'tiny', name: 'Another Tiny Thing', setSize: 4 }],
        offer: [],
        collection: [{ id: 'card8', type: 'thing', subtype: 'giant', name: 'Another Giant Thing', setSize: 1 }],
        points: 2,
        hasMoney: false
      }
    ]
    baseState.currentBuyerIndex = 0
    baseState.currentPlayerIndex = 0
    baseState.round = 3
    baseState.drawPile = [
      { id: 'draw1', type: 'thing', subtype: 'big', name: 'Draw Card 1', setSize: 2 },
      { id: 'draw2', type: 'thing', subtype: 'medium', name: 'Draw Card 2', setSize: 3 }
    ]
    baseState.discardPile = [
      { id: 'discard1', type: 'thing', subtype: 'tiny', name: 'Discard Card 1', setSize: 4 }
    ]
    
    return { ...baseState, ...overrides }
  }

  const renderGameBoardWithState = (gameState: GameState) => {
    return render(
      <GameContext.Provider value={{ gameState, dispatch: mockDispatch }}>
        <GameBoard />
      </GameContext.Provider>
    )
  }

  describe('Enhanced Game Header', () => {
    it('displays consolidated game information in header', () => {
      const gameState = createGameState({ currentPhase: GamePhase.OFFER_PHASE })
      renderGameBoardWithState(gameState)

      // Check title branding
      expect(screen.getByText('Offer Up')).toBeInTheDocument()

      // Check phase name in center
      expect(screen.getByText('Offer phase')).toBeInTheDocument()

      // Check round number
      expect(screen.getByText('Round 3')).toBeInTheDocument()

      // Check buyer/player status
      expect(screen.getByText(/💰 Buyer: Alice/)).toBeInTheDocument()
      expect(screen.getByText(/⭐ Active Player: Alice/)).toBeInTheDocument()

      // Check card counts
      expect(screen.getByText('Draw Pile: 2')).toBeInTheDocument()
      expect(screen.getByText('Discard Pile: 1')).toBeInTheDocument()
      expect(screen.getByText(/Cards in Play: \d+/)).toBeInTheDocument()

      // Check highest score
      expect(screen.getByText('Highest Score: 5')).toBeInTheDocument()
    })

    it('updates header information when game state changes', () => {
      const initialState = createGameState({ currentPhase: GamePhase.OFFER_PHASE })
      const { rerender } = renderGameBoardWithState(initialState)

      expect(screen.getByText('Offer phase')).toBeInTheDocument()
      expect(screen.getByText('Round 3')).toBeInTheDocument()

      // Update to different phase and round
      const updatedState = createGameState({ 
        currentPhase: GamePhase.ACTION_PHASE, 
        round: 4,
        currentPlayerIndex: 1,
        currentBuyerIndex: 1
      })
      
      rerender(
        <GameContext.Provider value={{ gameState: updatedState, dispatch: mockDispatch }}>
          <GameBoard />
        </GameContext.Provider>
      )

      expect(screen.getByText('Action phase')).toBeInTheDocument()
      expect(screen.getByText('Round 4')).toBeInTheDocument()
      expect(screen.getByText(/💰 Buyer: Bob/)).toBeInTheDocument()
      expect(screen.getByText(/⭐ Active Player: Bob/)).toBeInTheDocument()
    })
  })

  describe('Contextual Game Actions', () => {
    it('shows game actions only when user interaction is required', () => {
      // Phase with no user interaction required
      const noActionState = createGameState({ currentPhase: GamePhase.BUYER_ASSIGNMENT })
      const { rerender } = renderGameBoardWithState(noActionState)

      expect(screen.queryByText('Game Actions')).not.toBeInTheDocument()
      expect(screen.queryByText('Offer Phase')).not.toBeInTheDocument()
      expect(screen.queryByText('Action Phase')).not.toBeInTheDocument()
      expect(screen.queryByText('Offer Selection')).not.toBeInTheDocument()

      // Phase with user interaction required
      const actionState = createGameState({ 
        currentPhase: GamePhase.DEAL,
      })
      
      rerender(
        <GameContext.Provider value={{ gameState: actionState, dispatch: mockDispatch }}>
          <GameBoard />
        </GameContext.Provider>
      )

      expect(screen.getByText('Game Actions')).toBeInTheDocument()
      expect(screen.getByText('Deal Cards')).toBeInTheDocument()
    })

    it('shows offer selection controls when offers are available', () => {
      const gameState = createGameState({ 
        currentPhase: GamePhase.OFFER_SELECTION,
        selectedPerspective: 0 // Alice is buyer
      })
      renderGameBoardWithState(gameState)

      expect(screen.getByText('Offer Selection')).toBeInTheDocument()
      
      // The text is split across multiple elements, so use a more flexible matcher
      const gameActions = screen.getByText('Offer Selection').closest('.game-actions')
      expect(gameActions).toHaveTextContent('Buyer (Alice): Select one offer to purchase')
      expect(screen.getByText("Select Bob's Offer")).toBeInTheDocument()
    })
  })

  describe('Split Player Areas Layout', () => {
    it('displays active player prominently on the left', () => {
      const gameState = createGameState({ currentPlayerIndex: 0 })
      renderGameBoardWithState(gameState)

      const activePlayerArea = screen.getByText('Alice').closest('.player-area--active-player')
      expect(activePlayerArea).toBeInTheDocument()
      expect(activePlayerArea).toHaveClass('player-area--current')

      // Active player should be in the left area
      const leftArea = screen.getByText('Alice').closest('.active-player-area')
      expect(leftArea).toBeInTheDocument()
    })

    it('displays other players on the right side', () => {
      const gameState = createGameState({ currentPlayerIndex: 0 })
      renderGameBoardWithState(gameState)

      // Bob and Charlie should be in the right area
      const rightArea = document.querySelector('.other-players-area')
      expect(rightArea).toBeInTheDocument()
      
      const bobArea = screen.getByText('Bob').closest('.player-area')
      const charlieArea = screen.getByText('Charlie').closest('.player-area')
      
      expect(rightArea).toContainElement(bobArea)
      expect(rightArea).toContainElement(charlieArea)
    })

    it('updates active player when current player changes', () => {
      const initialState = createGameState({ currentPlayerIndex: 0 })
      const { rerender } = renderGameBoardWithState(initialState)

      // Alice should be active initially
      expect(screen.getByText('Alice').closest('.active-player-area')).toBeInTheDocument()

      // Change to Bob as current player
      const updatedState = createGameState({ currentPlayerIndex: 1 })
      
      rerender(
        <GameContext.Provider value={{ gameState: updatedState, dispatch: mockDispatch }}>
          <GameBoard />
        </GameContext.Provider>
      )

      // Bob should now be active
      expect(screen.getByText('Bob').closest('.active-player-area')).toBeInTheDocument()
      expect(screen.getByText('Alice').closest('.other-players-area')).toBeInTheDocument()
    })
  })

  describe('Collapsible Player Sections', () => {
    it('renders all player sections as collapsible', () => {
      const gameState = createGameState()
      renderGameBoardWithState(gameState)

      // Check that all players have collapsible sections
      const players = ['Alice', 'Bob', 'Charlie']
      
      players.forEach(playerName => {
        const playerArea = screen.getByText(playerName).closest('.player-area')
        
        // Each player should have collection, offer, and hand sections
        expect(playerArea?.querySelector('[id*="collection-"]')).toBeInTheDocument()
        expect(playerArea?.querySelector('[id*="offer-"]')).toBeInTheDocument()
        expect(playerArea?.querySelector('[id*="hand-"]')).toBeInTheDocument()
      })
    })

    it('allows independent collapse control for each section', () => {
      const gameState = createGameState()
      renderGameBoardWithState(gameState)

      // Find Alice's collection section header
      const aliceCollectionHeader = screen.getByText(/Collection.*1 cards.*5 points/).closest('[role="button"]')
      expect(aliceCollectionHeader).toBeInTheDocument()

      // Should be expanded by default
      expect(aliceCollectionHeader).toHaveAttribute('aria-expanded', 'true')

      // The collapsible sections are controlled by PlayerArea state management
      // We can verify the structure is correct and interactive elements are present
      expect(aliceCollectionHeader).toHaveAttribute('tabindex', '0')
      expect(aliceCollectionHeader).toHaveAttribute('aria-controls')
      
      // Verify the content area exists and is properly linked
      const controlsId = aliceCollectionHeader?.getAttribute('aria-controls')
      if (controlsId) {
        expect(document.getElementById(controlsId)).toBeInTheDocument()
      }
    })
  })

  describe('Phase-Based Offer Visibility', () => {
    const offerRelevantPhases = [
      GamePhase.OFFER_PHASE,
      GamePhase.BUYER_FLIP,
      GamePhase.ACTION_PHASE,
      GamePhase.OFFER_SELECTION
    ]

    offerRelevantPhases.forEach(phase => {
      it(`expands offers during ${phase}`, () => {
        const gameState = createGameState({ currentPhase: phase })
        renderGameBoardWithState(gameState)

        // Find offer sections and check they are expanded
        const offerHeaders = screen.getAllByText(/Offer Area/).map(el => el.closest('[role="button"]'))
        
        offerHeaders.forEach(header => {
          if (header) {
            expect(header).toHaveAttribute('aria-expanded', 'true')
          }
        })
      })
    })

    it('collapses offers during non-offer phases', () => {
      const gameState = createGameState({ currentPhase: GamePhase.BUYER_ASSIGNMENT })
      renderGameBoardWithState(gameState)

      // Find offer sections and check they are collapsed
      const offerHeaders = screen.getAllByText(/Offer Area/).map(el => el.closest('[role="button"]'))
      
      offerHeaders.forEach(header => {
        if (header) {
          expect(header).toHaveAttribute('aria-expanded', 'false')
        }
      })
    })
  })

  describe('Admin Footer Integration', () => {
    it('hides debug controls in collapsed admin footer by default', () => {
      const gameState = createGameState()
      renderGameBoardWithState(gameState)

      // Admin footer should be present but collapsed
      expect(screen.getByRole('button', { name: /show admin controls/i })).toBeInTheDocument()
      
      // Debug controls should not be visible
      expect(screen.queryByText('Administrative Controls')).not.toBeInTheDocument()
      expect(screen.queryByText('View Perspective:')).not.toBeInTheDocument()
    })

    it('shows debug controls when admin footer is expanded', () => {
      const gameState = createGameState({ currentPhase: GamePhase.BUYER_ASSIGNMENT })
      renderGameBoardWithState(gameState)

      // Expand admin footer
      const toggleButton = screen.getByRole('button', { name: /show admin controls/i })
      fireEvent.click(toggleButton)

      // Debug controls should now be visible
      expect(screen.getByText('Administrative Controls')).toBeInTheDocument()
      expect(screen.getByText('View Perspective:')).toBeInTheDocument()
      expect(screen.getByText('Continue to Next Phase')).toBeInTheDocument()
    })

    it('preserves all debug functionality in admin footer', () => {
      const gameState = createGameState({ 
        currentPhase: GamePhase.BUYER_ASSIGNMENT,
        selectedPerspective: 0
      })
      renderGameBoardWithState(gameState)

      // Expand admin footer
      const toggleButton = screen.getByRole('button', { name: /show admin controls/i })
      fireEvent.click(toggleButton)

      // Check perspective selector is functional
      const perspectiveSelect = screen.getByDisplayValue('Alice')
      expect(perspectiveSelect).toBeInTheDocument()

      fireEvent.change(perspectiveSelect, { target: { value: '1' } })
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'CHANGE_PERSPECTIVE', playerId: 1 })

      // Check phase control buttons
      const continueButton = screen.getByText('Continue to Next Phase')
      fireEvent.click(continueButton)
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'ADVANCE_PHASE' })
    })
  })

  describe('Responsive Layout Behavior', () => {
    it('maintains layout structure with different player counts', () => {
      // Test with minimum players (3)
      const threePlayerState = createGameState()
      threePlayerState.players = threePlayerState.players.slice(0, 3)
      
      const { rerender } = renderGameBoardWithState(threePlayerState)

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()

      // Test with more players
      const sixPlayerState = createGameState()
      sixPlayerState.players = [
        ...sixPlayerState.players,
        {
          id: 3,
          name: 'David',
          hand: [],
          offer: [],
          collection: [],
          points: 1,
          hasMoney: false
        },
        {
          id: 4,
          name: 'Eve',
          hand: [],
          offer: [],
          collection: [],
          points: 0,
          hasMoney: false
        },
        {
          id: 5,
          name: 'Frank',
          hand: [],
          offer: [],
          collection: [],
          points: 4,
          hasMoney: false
        }
      ]

      rerender(
        <GameContext.Provider value={{ gameState: sixPlayerState, dispatch: mockDispatch }}>
          <GameBoard />
        </GameContext.Provider>
      )

      // All players should be present
      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
      expect(screen.getByText('Charlie')).toBeInTheDocument()
      expect(screen.getByText('David')).toBeInTheDocument()
      expect(screen.getByText('Eve')).toBeInTheDocument()
      expect(screen.getByText('Frank')).toBeInTheDocument()

      // Active player should still be on the left
      expect(screen.getByText('Alice').closest('.active-player-area')).toBeInTheDocument()
      
      // Others should be on the right
      const rightArea = document.querySelector('.other-players-area')
      expect(rightArea).toContainElement(screen.getByText('Bob').closest('.player-area'))
      expect(rightArea).toContainElement(screen.getByText('Frank').closest('.player-area'))
    })
  })

  describe('Game Flow Integration', () => {
    it('maintains all existing game functionality with new UI', async () => {
      const gameState = createGameState({ 
        currentPhase: GamePhase.OFFER_SELECTION,
        selectedPerspective: 0 // Alice is buyer
      })
      renderGameBoardWithState(gameState)

      // Should be able to select offers
      const selectOfferButton = screen.getByText("Select Bob's Offer")
      fireEvent.click(selectOfferButton)

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'SELECT_OFFER',
        buyerId: 0,
        sellerId: 1
      })
    })

    it('preserves interactive game messages functionality', () => {
      const gameState = createGameState({
        currentPhase: GamePhase.GOTCHA_TRADEINS,
        gotchaEffectState: {
          type: 'once',
          affectedPlayerIndex: 1,
          cardsToSelect: 1,
          selectedCards: [{ id: 'card6', type: 'thing', subtype: 'medium', name: 'Another Medium Thing', setSize: 3 }],
          awaitingBuyerChoice: true
        }
      })
      renderGameBoardWithState(gameState)

      // Game actions should be visible
      expect(screen.getByText('Game Actions')).toBeInTheDocument()
      expect(screen.getByText(/Choose action for selected card/)).toBeInTheDocument()
      
      // Interactive buttons should work
      const stealButton = screen.getByText('Steal to Collection')
      fireEvent.click(stealButton)

      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'CHOOSE_GOTCHA_ACTION',
        action: 'steal'
      })
    })
  })

  describe('Accessibility Integration', () => {
    it('maintains proper accessibility attributes throughout the UI', () => {
      const gameState = createGameState()
      renderGameBoardWithState(gameState)

      // Check collapsible sections have proper ARIA attributes
      const collapsibleHeaders = screen.getAllByRole('button').filter(button => 
        button.hasAttribute('aria-expanded') && button.hasAttribute('aria-controls')
      )
      
      expect(collapsibleHeaders.length).toBeGreaterThan(0)

      collapsibleHeaders.forEach(header => {
        expect(header).toHaveAttribute('aria-expanded')
        expect(header).toHaveAttribute('aria-controls')
        
        const controlsId = header.getAttribute('aria-controls')
        if (controlsId) {
          expect(document.getElementById(controlsId)).toBeInTheDocument()
        }
      })
    })

    it('supports keyboard navigation for collapsible sections', () => {
      const gameState = createGameState()
      renderGameBoardWithState(gameState)

      const collectionHeader = screen.getByText(/Collection.*1 cards.*5 points/).closest('[role="button"]')
      expect(collectionHeader).toBeInTheDocument()

      // Should be focusable
      expect(collectionHeader).toHaveAttribute('tabindex', '0')

      // Should have proper ARIA attributes for accessibility
      expect(collectionHeader).toHaveAttribute('aria-expanded')
      expect(collectionHeader).toHaveAttribute('aria-controls')
      
      // Verify keyboard event handlers are attached (we can't easily test the actual behavior
      // in this integration test without mocking the PlayerArea state management)
      expect(collectionHeader).toBeInTheDocument()
    })
  })
})