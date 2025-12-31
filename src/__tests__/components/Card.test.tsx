import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Card } from '../../components/Card';
import { Card as CardType } from '../../types';

// Mock card data for testing
const mockThingCard: CardType = {
  id: 'thing-1',
  type: 'thing',
  subtype: 'Giant',
  name: 'Giant Thing',
  setSize: 1
};

const mockGotchaCard: CardType = {
  id: 'gotcha-1',
  type: 'gotcha',
  subtype: 'once',
  name: 'Gotcha Once',
  setSize: 2,
  effect: 'Negative effect'
};

const mockActionCard: CardType = {
  id: 'action-1',
  type: 'action',
  subtype: 'flip-one',
  name: 'Flip One',
  setSize: 1,
  effect: 'Flip a card'
};

describe('Card Component', () => {
  describe('Display States', () => {
    it('renders face up card with full content', () => {
      render(<Card card={mockThingCard} displayState="face_up" />);
      
      expect(screen.getByText('Giant Thing')).toBeInTheDocument();
      expect(screen.getByText('Set = 1 cards')).toBeInTheDocument();
    });

    it('renders face down card with back pattern', () => {
      render(<Card card={mockThingCard} displayState="face_down" />);
      
      expect(screen.getByText('Card Back')).toBeInTheDocument();
      expect(screen.queryByText('Giant Thing')).not.toBeInTheDocument();
    });

    it('renders partial card with content and face down indicator', () => {
      render(<Card card={mockThingCard} displayState="partial" />);
      
      expect(screen.getByText('Giant Thing')).toBeInTheDocument();
      expect(screen.getByText('Set = 1 cards')).toBeInTheDocument();
      expect(screen.getByText('Face Down')).toBeInTheDocument();
    });
  });

  describe('Card Type Styling', () => {
    it('applies thing card styling', () => {
      const { container } = render(<Card card={mockThingCard} displayState="face_up" />);
      const cardElement = container.firstChild as HTMLElement;
      
      expect(cardElement).toHaveClass('card--thing');
    });

    it('applies gotcha card styling', () => {
      const { container } = render(<Card card={mockGotchaCard} displayState="face_up" />);
      const cardElement = container.firstChild as HTMLElement;
      
      expect(cardElement).toHaveClass('card--gotcha');
    });

    it('applies action card styling', () => {
      const { container } = render(<Card card={mockActionCard} displayState="face_up" />);
      const cardElement = container.firstChild as HTMLElement;
      
      expect(cardElement).toHaveClass('card--action');
    });
  });

  describe('Card Content', () => {
    it('displays set information for thing cards', () => {
      render(<Card card={mockThingCard} displayState="face_up" />);
      
      expect(screen.getByText('Set = 1 cards')).toBeInTheDocument();
    });

    it('displays set information for gotcha cards', () => {
      render(<Card card={mockGotchaCard} displayState="face_up" />);
      
      expect(screen.getByText('Set = 2 cards')).toBeInTheDocument();
    });

    it('displays specific effect text for gotcha once cards', () => {
      render(<Card card={mockGotchaCard} displayState="face_up" />);
      
      expect(screen.getByText('Buyer steals or discards 1 card')).toBeInTheDocument();
    });

    it('displays specific effect text for gotcha twice cards', () => {
      const gotchaTwiceCard: CardType = {
        id: 'gotcha-twice-1',
        type: 'gotcha',
        subtype: 'twice',
        name: 'Gotcha Twice',
        setSize: 2,
        effect: 'Negative effect'
      };
      
      render(<Card card={gotchaTwiceCard} displayState="face_up" />);
      
      expect(screen.getByText('Buyer steals or discards 2 cards')).toBeInTheDocument();
    });

    it('displays specific effect text for gotcha bad cards', () => {
      const gotchaBadCard: CardType = {
        id: 'gotcha-bad-1',
        type: 'gotcha',
        subtype: 'bad',
        name: 'Gotcha Bad',
        setSize: 3,
        effect: 'Negative effect'
      };
      
      render(<Card card={gotchaBadCard} displayState="face_up" />);
      
      expect(screen.getByText('Buyer steals 1 point')).toBeInTheDocument();
    });

    it('displays specific effect text for flip one action cards', () => {
      render(<Card card={mockActionCard} displayState="face_up" />);
      
      expect(screen.getByText('Flip 1 card in any offer face up')).toBeInTheDocument();
    });

    it('displays specific effect text for add one action cards', () => {
      const addOneCard: CardType = {
        id: 'action-add-1',
        type: 'action',
        subtype: 'add-one',
        name: 'Add One',
        setSize: 1,
        effect: 'Add a card'
      };
      
      render(<Card card={addOneCard} displayState="face_up" />);
      
      expect(screen.getByText('Add 1 card from your hand face down to any offer')).toBeInTheDocument();
    });

    it('displays specific effect text for remove one action cards', () => {
      const removeOneCard: CardType = {
        id: 'action-remove-1',
        type: 'action',
        subtype: 'remove-one',
        name: 'Remove One',
        setSize: 1,
        effect: 'Remove a card'
      };
      
      render(<Card card={removeOneCard} displayState="face_up" />);
      
      expect(screen.getByText('Discard 1 card from any offer')).toBeInTheDocument();
    });

    it('displays specific effect text for remove two action cards', () => {
      const removeTwoCard: CardType = {
        id: 'action-remove-2',
        type: 'action',
        subtype: 'remove-two',
        name: 'Remove Two',
        setSize: 1,
        effect: 'Remove two cards'
      };
      
      render(<Card card={removeTwoCard} displayState="face_up" />);
      
      expect(screen.getByText('Discard 2 cards from among the offers')).toBeInTheDocument();
    });

    it('displays specific effect text for steal point action cards', () => {
      const stealPointCard: CardType = {
        id: 'action-steal-1',
        type: 'action',
        subtype: 'steal-point',
        name: 'Steal A Point',
        setSize: 1,
        effect: 'Steal a point'
      };
      
      render(<Card card={stealPointCard} displayState="face_up" />);
      
      expect(screen.getByText('Steal 1 point from any player with more points than you')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('handles click events', () => {
      const mockClick = jest.fn();
      render(<Card card={mockThingCard} displayState="face_up" onClick={mockClick} />);
      
      const cardElement = screen.getByRole('button');
      fireEvent.click(cardElement);
      
      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('handles keyboard events for accessibility', () => {
      const mockClick = jest.fn();
      render(<Card card={mockThingCard} displayState="face_up" onClick={mockClick} />);
      
      const cardElement = screen.getByRole('button');
      fireEvent.keyDown(cardElement, { key: 'Enter' });
      
      expect(mockClick).toHaveBeenCalledTimes(1);
    });

    it('handles drag start events', () => {
      const mockDragStart = jest.fn();
      render(
        <Card 
          card={mockThingCard} 
          displayState="face_up" 
          draggable={true}
          onDragStart={mockDragStart} 
        />
      );
      
      const cardElement = screen.getByText('Giant Thing').closest('.card') as HTMLElement;
      fireEvent.dragStart(cardElement);
      
      expect(mockDragStart).toHaveBeenCalledWith(mockThingCard);
    });

    it('applies draggable styling when draggable', () => {
      const { container } = render(
        <Card card={mockThingCard} displayState="face_up" draggable={true} />
      );
      const cardElement = container.firstChild as HTMLElement;
      
      expect(cardElement).toHaveClass('card--draggable');
    });

    it('applies clickable styling when clickable', () => {
      const mockClick = jest.fn();
      const { container } = render(
        <Card card={mockThingCard} displayState="face_up" onClick={mockClick} />
      );
      const cardElement = container.firstChild as HTMLElement;
      
      expect(cardElement).toHaveClass('card--clickable');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Card card={mockThingCard} displayState="face_up" className="custom-class" />
      );
      const cardElement = container.firstChild as HTMLElement;
      
      expect(cardElement).toHaveClass('custom-class');
    });
  });
});