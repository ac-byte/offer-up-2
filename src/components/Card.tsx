import React from 'react';
import { Card as CardType, CardDisplayState } from '../types';
import './Card.css';

interface CardProps {
  card: CardType;
  displayState: CardDisplayState;
  draggable?: boolean;
  onClick?: () => void;
  onDragStart?: (card: CardType) => void;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  card,
  displayState,
  draggable = false,
  onClick,
  onDragStart,
  className = ''
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (onDragStart) {
      onDragStart(card);
    }
    // Store card data for drop handling (check if dataTransfer exists for testing compatibility)
    if (e.dataTransfer) {
      e.dataTransfer.setData('application/json', JSON.stringify(card));
      e.dataTransfer.effectAllowed = 'move';
    }
    
    // Add dragging class for visual feedback
    e.currentTarget.classList.add('card--dragging');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Remove dragging class
    e.currentTarget.classList.remove('card--dragging');
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // Determine card styling based on type
  const getCardTypeClass = () => {
    switch (card.type) {
      case 'thing':
        return 'card--thing';
      case 'gotcha':
        return 'card--gotcha';
      case 'action':
        return 'card--action';
      default:
        return '';
    }
  };

  // Determine display class based on state
  const getDisplayStateClass = () => {
    switch (displayState) {
      case 'face_up':
        return 'card--face-up';
      case 'face_down':
        return 'card--face-down';
      case 'partial':
        return 'card--partial';
      default:
        return '';
    }
  };

  // Get specific effect description for Gotcha cards
  const getGotchaEffectDescription = () => {
    switch (card.subtype) {
      case 'once':
        return 'Buyer steals or discards 1 card';
      case 'twice':
        return 'Buyer steals or discards 2 cards';
      case 'bad':
        return 'Buyer steals 1 point';
      default:
        return 'This card has an effect';
    }
  };

  // Get specific effect description for Action cards
  const getActionEffectDescription = () => {
    switch (card.subtype) {
      case 'flip-one':
        return 'Flip 1 card in any offer face up';
      case 'add-one':
        return 'Add 1 card from your hand face down to any offer';
      case 'remove-one':
        return 'Discard 1 card from any offer';
      case 'remove-two':
        return 'Discard 2 cards from among the offers';
      case 'steal-point':
        return 'Steal 1 point from any player with more points than you';
      default:
        return 'This card has an effect';
    }
  };

  // Render card content based on display state
  const renderCardContent = () => {
    if (displayState === 'face_down') {
      return (
        <div className="card__back">
          <div className="card__back-pattern">
            Card Back
          </div>
        </div>
      );
    }

    // For face_up and partial states, show card information
    return (
      <div className="card__front">
        <div className="card__header">
          <h3 className="card__name">{card.name}</h3>
        </div>
        
        <div className="card__body">
          {/* Requirement 28.2: Both Thing cards and Gotcha cards show "Set = X cards" */}
          {(card.type === 'thing' || card.type === 'gotcha') && (
            <div className="card__set-info">
              Set = {card.setSize} cards
            </div>
          )}
          
          {/* Requirement 28.4: Gotcha cards show specific effect descriptions */}
          {card.type === 'gotcha' && (
            <div className="card__effect">
              {getGotchaEffectDescription()}
            </div>
          )}
          
          {/* Requirement 28.5: Action cards show specific effect descriptions */}
          {card.type === 'action' && (
            <div className="card__effect">
              {getActionEffectDescription()}
            </div>
          )}
        </div>

        {displayState === 'partial' && (
          <div className="card__partial-indicator">
            <div className="card__face-down-overlay">
              Face Down
            </div>
          </div>
        )}
      </div>
    );
  };

  const cardClasses = [
    'card',
    getCardTypeClass(),
    getDisplayStateClass(),
    draggable ? 'card--draggable' : '',
    onClick ? 'card--clickable' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {renderCardContent()}
    </div>
  );
};

export default Card;