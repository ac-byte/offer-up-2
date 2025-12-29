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
  subtype: 'Once',
  name: 'Gotcha Once',
  setSize: 10,
  effect: 'Negative effect'
};

const mockActionCard: CardType = {
  id: 'action-1',
  type: 'action',
  subtype: 'Flip One',
  name: 'Flip One',
  setSize: 5,
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

    it('displays effect text for gotcha cards', () => {
      render(<Card card={mockGotchaCard} displayState="face_up" />);
      
      expect(screen.getByText('This card has an effect')).toBeInTheDocument();
    });

    it('displays effect text for action cards', () => {
      render(<Card card={mockActionCard} displayState="face_up" />);
      
      expect(screen.getByText('This card has an effect')).toBeInTheDocument();
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