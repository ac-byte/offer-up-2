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
    }
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
          {card.type === 'thing' && (
            <div className="card__set-info">
              Set = {card.setSize} cards
            </div>
          )}
          
          {(card.type === 'gotcha' || card.type === 'action') && card.effect && (
            <div className="card__effect">
              This card has an effect
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