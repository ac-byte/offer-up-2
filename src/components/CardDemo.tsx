import React from 'react';
import { Card } from './Card';
import { Card as CardType } from '../types';

// Demo component to showcase the Card component
export const CardDemo: React.FC = () => {
  const sampleCards: CardType[] = [
    {
      id: 'thing-1',
      type: 'thing',
      subtype: 'Giant',
      name: 'Giant Thing',
      setSize: 1
    },
    {
      id: 'gotcha-1',
      type: 'gotcha',
      subtype: 'Once',
      name: 'Gotcha Once',
      setSize: 10,
      effect: 'Negative effect'
    },
    {
      id: 'action-1',
      type: 'action',
      subtype: 'Flip One',
      name: 'Flip One',
      setSize: 5,
      effect: 'Flip a card'
    }
  ];

  const handleCardClick = (card: CardType) => {
    console.log('Card clicked:', card.name);
  };

  const handleDragStart = (card: CardType) => {
    console.log('Drag started:', card.name);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Card Component Demo</h2>
      
      <h3>Face Up Cards</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {sampleCards.map(card => (
          <Card
            key={`face-up-${card.id}`}
            card={card}
            displayState="face_up"
            onClick={() => handleCardClick(card)}
            draggable={true}
            onDragStart={handleDragStart}
          />
        ))}
      </div>

      <h3>Face Down Cards</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {sampleCards.map(card => (
          <Card
            key={`face-down-${card.id}`}
            card={card}
            displayState="face_down"
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>

      <h3>Partial Cards</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {sampleCards.map(card => (
          <Card
            key={`partial-${card.id}`}
            card={card}
            displayState="partial"
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>
    </div>
  );
};

export default CardDemo;