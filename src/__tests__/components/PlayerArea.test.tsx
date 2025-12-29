import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlayerArea } from '../../components/PlayerArea';
import { Player, GamePhase, Card } from '../../types';

// Mock card data for testing
const mockCard: Card = {
  id: 'test-card-1',
  type: 'thing',
  subtype: 'big',
  name: 'Test Big Thing',
  setSize: 2
};

const mockActionCard: Card = {
  id: 'test-action-1',
  type: 'action',
  subtype: 'flip',
  name: 'Flip One',
  setSize: 1,
  effect: 'Flip one face-down card'
};

// Mock player data for testing
const mockPlayer: Player = {
  id: 0,
  name: 'Test Player',
  hand: [mockCard],
  offer: [],
  collection: [mockActionCard],
  points: 2,
  hasMoney: false
};

const mockBuyerPlayer: Player = {
  id: 1,
  name: 'Buyer Player',
  hand: [mockCard, mockActionCard],
  offer: [],
  collection: [],
  points: 0,
  hasMoney: true
};

describe('PlayerArea Component', () => {
  const defaultProps = {
    player: mockPlayer,
    isCurrentPlayer: false,
    isBuyer: false,
    perspective: 0,
    phase: GamePhase.DEAL,
    onCardPlay: jest.fn(),
    onOfferPlace: jest.fn(),
    onCardFlip: jest.fn(),
    onOfferSelect: jest.fn(),
    canFlipCards: false,
    canSelectOffer: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders player name and basic information', () => {
    render(<PlayerArea {...defaultProps} />);
    
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText(/Points: 2/)).toBeInTheDocument();
    expect(screen.getByText(/Cards: 2/)).toBeInTheDocument();
  });

  it('displays money bag icon for buyer', () => {
    render(
      <PlayerArea 
        {...defaultProps} 
        player={mockBuyerPlayer}
        isBuyer={true}
      />
    );
    
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('displays current player indicator', () => {
    render(
      <PlayerArea 
        {...defaultProps} 
        isCurrentPlayer={true}
      />
    );
    
    expect(screen.getByText('⭐')).toBeInTheDocument();
  });

  it('shows hand cards face up for own perspective', () => {
    render(
      <PlayerArea 
        {...defaultProps} 
        perspective={0} // Same as player.id
      />
    );
    
    // Should show card name when viewing own hand
    expect(screen.getByText('Test Big Thing')).toBeInTheDocument();
  });

  it('shows hand cards face down for other perspectives', () => {
    render(
      <PlayerArea 
        {...defaultProps} 
        perspective={1} // Different from player.id
      />
    );
    
    // Should show card back when viewing other player's hand
    expect(screen.getByText('Card Back')).toBeInTheDocument();
  });

  it('displays collection cards correctly', () => {
    render(<PlayerArea {...defaultProps} />);
    
    // Collection cards should always be face up
    expect(screen.getByText('Flip One')).toBeInTheDocument();
    expect(screen.getByText(/Collection \(1 cards, 2 points\)/)).toBeInTheDocument();
  });

  it('shows empty states when no cards present', () => {
    const emptyPlayer: Player = {
      id: 0,
      name: 'Empty Player',
      hand: [],
      offer: [],
      collection: [],
      points: 0,
      hasMoney: false
    };

    render(
      <PlayerArea 
        {...defaultProps} 
        player={emptyPlayer}
      />
    );
    
    expect(screen.getByText('No cards in hand')).toBeInTheDocument();
    expect(screen.getByText('Click "Make Offer" or drag a card here')).toBeInTheDocument(); // Own perspective shows drag instruction
    expect(screen.getByText('No cards in collection')).toBeInTheDocument();
  });

  it('shows "No offer placed" for other player perspectives', () => {
    const emptyPlayer: Player = {
      id: 1,
      name: 'Other Player',
      hand: [],
      offer: [],
      collection: [],
      points: 0,
      hasMoney: false
    };

    render(
      <PlayerArea 
        {...defaultProps} 
        player={emptyPlayer}
        perspective={0} // Different from player.id (1)
      />
    );
    
    expect(screen.getByText('No offer placed')).toBeInTheDocument();
  });

  it('applies correct CSS classes based on props', () => {
    const { container } = render(
      <PlayerArea 
        {...defaultProps} 
        isCurrentPlayer={true}
        isBuyer={true}
        perspective={0}
      />
    );
    
    const playerArea = container.querySelector('.player-area');
    expect(playerArea).toHaveClass('player-area--current');
    expect(playerArea).toHaveClass('player-area--buyer');
    expect(playerArea).toHaveClass('player-area--own-perspective');
  });

  it('handles drag and drop setup for offer area', () => {
    render(
      <PlayerArea 
        {...defaultProps} 
        perspective={0} // Own perspective
        phase={GamePhase.OFFER_PHASE}
      />
    );
    
    // Should show drag instruction for own offer area
    expect(screen.getByText('Click "Make Offer" or drag a card here')).toBeInTheDocument();
  });
});