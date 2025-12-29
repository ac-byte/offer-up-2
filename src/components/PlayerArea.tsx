import React from 'react';
import { Player, GamePhase, Card, OfferCard, CardDisplayState } from '../types';
import { Card as CardComponent } from './Card';
import './PlayerArea.css';

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  isBuyer: boolean;
  perspective: number;
  phase: GamePhase;
  onCardPlay: (card: Card) => void;
  onOfferPlace: (cards: Card[], faceUpIndex: number) => void;
}

interface HandProps {
  cards: Card[];
  isOwnHand: boolean;
  onCardDrag?: (card: Card) => void;
  onCardClick?: (card: Card) => void;
}

interface OfferAreaProps {
  offer: OfferCard[];
  isOwnOffer: boolean;
  onCardClick?: (card: OfferCard, index: number) => void;
  onDrop?: (cards: Card[], faceUpIndex: number) => void;
}

interface CollectionAreaProps {
  cards: Card[];
  points: number;
  onCardClick?: (card: Card) => void;
}

// Hand sub-component
const Hand: React.FC<HandProps> = ({ cards, isOwnHand, onCardDrag, onCardClick }) => {
  const getCardDisplayState = (card: Card): CardDisplayState => {
    return isOwnHand ? 'face_up' : 'face_down';
  };

  return (
    <div className="hand">
      <div className="hand__header">
        <h4 className="hand__title">Hand ({cards.length})</h4>
      </div>
      <div className="hand__cards">
        {cards.map((card, index) => (
          <CardComponent
            key={`${card.id}-${index}`}
            card={card}
            displayState={getCardDisplayState(card)}
            draggable={isOwnHand}
            onDragStart={onCardDrag}
            onClick={() => onCardClick?.(card)}
            className="hand__card"
          />
        ))}
        {cards.length === 0 && (
          <div className="hand__empty">No cards in hand</div>
        )}
      </div>
    </div>
  );
};

// OfferArea sub-component
const OfferArea: React.FC<OfferAreaProps> = ({ offer, isOwnOffer, onCardClick, onDrop }) => {
  const getCardDisplayState = (offerCard: OfferCard): CardDisplayState => {
    if (offerCard.faceUp) {
      return 'face_up';
    }
    // Show partial state for own face-down cards, face-down for others
    return isOwnOffer ? 'partial' : 'face_down';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (!isOwnOffer || !onDrop) return;

    try {
      const cardData = e.dataTransfer.getData('application/json');
      if (cardData) {
        const card = JSON.parse(cardData) as Card;
        // For now, just place as first card face up (this will be enhanced in future tasks)
        onDrop([card], 0);
      }
    } catch (error) {
      console.error('Error handling card drop:', error);
    }
  };

  return (
    <div 
      className="offer-area"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="offer-area__header">
        <h4 className="offer-area__title">Offer Area</h4>
      </div>
      <div className="offer-area__cards">
        {offer.length > 0 ? (
          offer
            .sort((a, b) => a.position - b.position) // Sort by position
            .map((offerCard, index) => (
              <CardComponent
                key={`${offerCard.id}-${offerCard.position}`}
                card={offerCard}
                displayState={getCardDisplayState(offerCard)}
                onClick={() => onCardClick?.(offerCard, index)}
                className={`offer-area__card offer-area__card--position-${offerCard.position}`}
              />
            ))
        ) : (
          <div className="offer-area__empty">
            {isOwnOffer ? 'Drag 3 cards here to make an offer' : 'No offer placed'}
          </div>
        )}
      </div>
    </div>
  );
};

// CollectionArea sub-component
const CollectionArea: React.FC<CollectionAreaProps> = ({ cards, points, onCardClick }) => {
  // Group cards by type for better organization
  const groupedCards = cards.reduce((groups, card) => {
    const key = `${card.type}-${card.subtype}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(card);
    return groups;
  }, {} as Record<string, Card[]>);

  return (
    <div className="collection-area">
      <div className="collection-area__header">
        <h4 className="collection-area__title">
          Collection ({cards.length} cards, {points} points)
        </h4>
      </div>
      <div className="collection-area__cards">
        {Object.entries(groupedCards).map(([groupKey, groupCards]) => (
          <div key={groupKey} className="collection-area__group">
            <div className="collection-area__group-header">
              <span className="collection-area__group-title">
                {groupCards[0].name} ({groupCards.length})
              </span>
            </div>
            <div className="collection-area__group-cards">
              {groupCards.map((card, index) => (
                <CardComponent
                  key={`${card.id}-${index}`}
                  card={card}
                  displayState="face_up"
                  onClick={() => onCardClick?.(card)}
                  className="collection-area__card"
                />
              ))}
            </div>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="collection-area__empty">No cards in collection</div>
        )}
      </div>
    </div>
  );
};

// Main PlayerArea component
export const PlayerArea: React.FC<PlayerAreaProps> = ({
  player,
  isCurrentPlayer,
  isBuyer,
  perspective,
  phase,
  onCardPlay,
  onOfferPlace
}) => {
  const isOwnPerspective = player.id === perspective;

  const handleCardDrag = (card: Card) => {
    // Card drag started - this will be used for offer placement
    console.log('Card drag started:', card.name);
  };

  const handleCardClick = (card: Card) => {
    // Handle card clicks - for action cards during action phase
    if (phase === GamePhase.ACTION_PHASE && card.type === 'action') {
      onCardPlay(card);
    }
  };

  const handleOfferCardClick = (offerCard: OfferCard, index: number) => {
    // Handle offer card clicks - for buyer flipping during buyer-flip phase
    if (phase === GamePhase.BUYER_FLIP && isBuyer && !offerCard.faceUp) {
      console.log('Buyer attempting to flip card:', offerCard.name);
      // This will be implemented in future tasks
    }
  };

  const handleOfferDrop = (cards: Card[], faceUpIndex: number) => {
    // Handle dropping cards to create offer
    if (phase === GamePhase.OFFER_PHASE && isOwnPerspective && !isBuyer) {
      onOfferPlace(cards, faceUpIndex);
    }
  };

  const getPlayerAreaClasses = () => {
    const classes = ['player-area'];
    
    if (isCurrentPlayer) classes.push('player-area--current');
    if (isBuyer) classes.push('player-area--buyer');
    if (isOwnPerspective) classes.push('player-area--own-perspective');
    
    return classes.join(' ');
  };

  return (
    <div className={getPlayerAreaClasses()}>
      <div className="player-area__header">
        <h3 className="player-area__name">
          {player.name}
          {isBuyer && <span className="player-area__money-bag"> 💰</span>}
          {isCurrentPlayer && <span className="player-area__current-indicator"> ⭐</span>}
        </h3>
        <div className="player-area__stats">
          Points: {player.points} | Cards: {player.hand.length + player.collection.length}
        </div>
      </div>

      <div className="player-area__content">
        <div className="player-area__top-row">
          <Hand
            cards={player.hand}
            isOwnHand={isOwnPerspective}
            onCardDrag={handleCardDrag}
            onCardClick={handleCardClick}
          />
        </div>

        <div className="player-area__middle-row">
          <OfferArea
            offer={player.offer}
            isOwnOffer={isOwnPerspective}
            onCardClick={handleOfferCardClick}
            onDrop={handleOfferDrop}
          />
        </div>

        <div className="player-area__bottom-row">
          <CollectionArea
            cards={player.collection}
            points={player.points}
            onCardClick={handleCardClick}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerArea;