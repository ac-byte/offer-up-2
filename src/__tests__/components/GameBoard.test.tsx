import React from 'react'
import { render, screen } from '@testing-library/react'
import { GameBoard } from '../../components/GameBoard'
import { GameContext } from '../../contexts/GameContext'
import { GameState, GamePhase } from '../../types'
import { createInitialGameState } from '../../game-logic/gameReducer'

// Mock game state with interactive effects
const createMockGameStateWithEffects = (effectType: string): GameState => {
  const baseState = createInitialGameState()
  baseState.gameStarted = true
  baseState.players = [
    {
      id: 0,
      name: 'Alice',
      hand: [{ id: 'card1', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }],
      offer: [],
      collection: [{ id: 'card2', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 }],
      points: 0,
      hasMoney: true
    },
    {
      id: 1,
      name: 'Bob',
      hand: [],
      offer: [{ id: 'card3', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3, faceUp: false, position: 0 }],
      collection: [{ id: 'card4', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }],
      points: 0,
      hasMoney: false
    }
  ]
  baseState.currentBuyerIndex = 0
  baseState.currentPlayerIndex = 0

  switch (effectType) {
    case 'gotcha':
      baseState.currentPhase = GamePhase.GOTCHA_TRADEINS
      baseState.gotchaEffectState = {
        type: 'once',
        affectedPlayerIndex: 1,
        cardsToSelect: 1,
        selectedCards: [{ id: 'card4', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }],
        awaitingBuyerChoice: true
      }
      break
    case 'flipOne':
      baseState.currentPhase = GamePhase.ACTION_PHASE
      baseState.flipOneEffectState = {
        playerId: 0,
        awaitingCardSelection: true
      }
      break
    case 'addOne':
      baseState.currentPhase = GamePhase.ACTION_PHASE
      baseState.addOneEffectState = {
        playerId: 0,
        awaitingHandCardSelection: true,
        awaitingOfferSelection: false
      }
      break
    case 'removeOne':
      baseState.currentPhase = GamePhase.ACTION_PHASE
      baseState.removeOneEffectState = {
        playerId: 0,
        awaitingCardSelection: true
      }
      break
    case 'removeTwo':
      baseState.currentPhase = GamePhase.ACTION_PHASE
      baseState.removeTwoEffectState = {
        playerId: 0,
        awaitingCardSelection: true,
        selectedCards: [],
        cardsToSelect: 2
      }
      break
    case 'stealAPoint':
      baseState.currentPhase = GamePhase.ACTION_PHASE
      baseState.stealAPointEffectState = {
        playerId: 0,
        awaitingTargetSelection: true
      }
      break
  }

  return baseState
}

const mockDispatch = jest.fn()

const renderGameBoardWithState = (gameState: GameState) => {
  return render(
    <GameContext.Provider value={{ gameState, dispatch: mockDispatch }}>
      <GameBoard />
    </GameContext.Provider>
  )
}

describe('GameBoard Interactive Messages', () => {
  beforeEach(() => {
    mockDispatch.mockClear()
  })

  it('displays Gotcha card processing messages', () => {
    const gameState = createMockGameStateWithEffects('gotcha')
    renderGameBoardWithState(gameState)
    
    expect(screen.getByText(/Choose action for selected card/)).toBeInTheDocument()
    expect(screen.getByText(/Steal to Collection/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Discard/ })).toBeInTheDocument()
  })

  it('displays Flip One effect messages', () => {
    const gameState = createMockGameStateWithEffects('flipOne')
    renderGameBoardWithState(gameState)
    
    // Look specifically in the game actions area
    const gameActions = screen.getByText('Action Phase').closest('.game-actions')
    expect(gameActions).toBeInTheDocument()
    expect(gameActions).toHaveTextContent('Alice played Flip One')
    expect(screen.getByText(/Select a face-down card from any offer to flip/)).toBeInTheDocument()
  })

  it('displays Add One effect messages', () => {
    const gameState = createMockGameStateWithEffects('addOne')
    renderGameBoardWithState(gameState)
    
    // Look specifically in the game actions area
    const gameActions = screen.getByText('Action Phase').closest('.game-actions')
    expect(gameActions).toBeInTheDocument()
    expect(gameActions).toHaveTextContent('Alice played Add One')
    expect(screen.getByText(/Select a card from your hand to add to an offer/)).toBeInTheDocument()
  })

  it('displays Remove One effect messages', () => {
    const gameState = createMockGameStateWithEffects('removeOne')
    renderGameBoardWithState(gameState)
    
    // Look specifically in the game actions area
    const gameActions = screen.getByText('Action Phase').closest('.game-actions')
    expect(gameActions).toBeInTheDocument()
    expect(gameActions).toHaveTextContent('Alice played Remove One')
    expect(screen.getByText(/Select a card from any offer to remove/)).toBeInTheDocument()
  })

  it('displays Remove Two effect messages', () => {
    const gameState = createMockGameStateWithEffects('removeTwo')
    renderGameBoardWithState(gameState)
    
    // Look specifically in the game actions area
    const gameActions = screen.getByText('Action Phase').closest('.game-actions')
    expect(gameActions).toBeInTheDocument()
    expect(gameActions).toHaveTextContent('Alice played Remove Two')
    expect(screen.getByText(/Select exactly 2 cards from any offers to remove/)).toBeInTheDocument()
    expect(screen.getByText(/Cards selected: 0 \/ 2/)).toBeInTheDocument()
  })

  it('displays Steal A Point effect messages', () => {
    const gameState = createMockGameStateWithEffects('stealAPoint')
    renderGameBoardWithState(gameState)
    
    // Look specifically in the game actions area
    const gameActions = screen.getByText('Action Phase').closest('.game-actions')
    expect(gameActions).toBeInTheDocument()
    expect(gameActions).toHaveTextContent('Alice played Steal A Point')
    expect(screen.getByText(/No players have more points than you/)).toBeInTheDocument()
  })

  it('hides game actions when no user interaction is required', () => {
    const gameState = createInitialGameState()
    gameState.gameStarted = true
    gameState.players = [
      {
        id: 0,
        name: 'Alice',
        hand: [],
        offer: [],
        collection: [],
        points: 0,
        hasMoney: true
      }
    ]
    gameState.currentPhase = GamePhase.BUYER_ASSIGNMENT
    
    renderGameBoardWithState(gameState)
    
    // Game actions section should not be present
    expect(screen.queryByText('Game Actions')).not.toBeInTheDocument()
    expect(screen.queryByText('Offer Phase')).not.toBeInTheDocument()
    expect(screen.queryByText('Action Phase')).not.toBeInTheDocument()
    expect(screen.queryByText('Offer Selection')).not.toBeInTheDocument()
  })
})