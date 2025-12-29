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
  onCardFlip: (cardIndex: number) => void;
  onOfferSelect: () => void;
  canFlipCards: boolean;
  canSelectOffer: boolean;
}

interface HandProps {
  cards: Card[];
  isOwnHand: boolean;
  onCardDrag?: (card: Card) => void;
  onCardClick?: (card: Card) => void;
  selectedCards?: Card[];
}

interface OfferAreaProps {
  offer: OfferCard[];
  isOwnOffer: boolean;
  canFlipCards: boolean;
  onCardClick?: (card: OfferCard, index: number) => void;
  onDrop?: (cards: Card[], faceUpIndex: number) => void;
  onStartOfferSelection?: (initialCard?: Card) => void;
}

interface CollectionAreaProps {
  cards: Card[];
  points: number;
  onCardClick?: (card: Card) => void;
}

// Hand sub-component
const Hand: React.FC<HandProps> = ({ cards, isOwnHand, onCardDrag, onCardClick, selectedCards = [] }) => {
  const getCardDisplayState = (card: Card): CardDisplayState => {
    return isOwnHand ? 'face_up' : 'face_down';
  };

  const isCardSelected = (card: Card): boolean => {
    return selectedCards.some(c => c.id === card.id)
  }

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
            className={`hand__card ${isCardSelected(card) ? 'hand__card--selected' : ''}`}
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
const OfferArea: React.FC<OfferAreaProps> = ({ offer, isOwnOffer, canFlipCards, onCardClick, onDrop, onStartOfferSelection }) => {
  const [isDragOver, setIsDragOver] = React.useState(false)

  const getCardDisplayState = (offerCard: OfferCard): CardDisplayState => {
    if (offerCard.faceUp) {
      return 'face_up';
    }
    // Show partial state for own face-down cards, face-down for others
    return isOwnOffer ? 'partial' : 'face_down';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Allow drop
    setIsDragOver(true)
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only set drag over to false if we're leaving the offer area itself
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false)
    
    if (!isOwnOffer) return;

    try {
      const cardData = e.dataTransfer.getData('application/json');
      if (cardData) {
        const card = JSON.parse(cardData) as Card;
        
        // Start the offer selection process with this card pre-selected
        if (onStartOfferSelection) {
          onStartOfferSelection(card);
        }
      }
    } catch (error) {
      console.error('Error handling card drop:', error);
    }
  };

  const offerAreaClasses = [
    'offer-area',
    isDragOver ? 'offer-area--drag-over' : '',
    isOwnOffer ? 'offer-area--own' : ''
  ].filter(Boolean).join(' ')

  return (
    <div 
      className={offerAreaClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
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
                className={`offer-area__card offer-area__card--position-${offerCard.position} ${
                  canFlipCards && !offerCard.faceUp ? 'offer-area__card--flippable' : ''
                }`}
              />
            ))
        ) : (
          <div className="offer-area__empty">
            {isOwnOffer ? (
              isDragOver ? 
                'Drop card to start offer selection' : 
                'Click "Make Offer" or drag a card here'
            ) : 'No offer placed'}
          </div>
        )}
      </div>
      {isDragOver && isOwnOffer && (
        <div className="offer-area__drop-indicator">
          Ready to place offer
        </div>
      )}
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
  onOfferPlace,
  onCardFlip,
  onOfferSelect,
  canFlipCards,
  canSelectOffer
}) => {
  const isOwnPerspective = player.id === perspective;
  const [selectedCards, setSelectedCards] = React.useState<Card[]>([])
  const [isSelectingOffer, setIsSelectingOffer] = React.useState(false)

  // Reset selection when phase changes or when not in offer phase
  React.useEffect(() => {
    if (phase !== GamePhase.OFFER_PHASE || player.offer.length > 0) {
      setSelectedCards([])
      setIsSelectingOffer(false)
    }
  }, [phase, player.offer.length])

  const handleCardDrag = (card: Card) => {
    // Card drag started - this will be used for offer placement
    console.log('Card drag started:', card.name);
  };

  const handleCardClick = (card: Card) => {
    // Handle card selection for offers during offer phase
    if (phase === GamePhase.OFFER_PHASE && isOwnPerspective && !isBuyer && player.offer.length === 0) {
      if (isSelectingOffer) {
        // Toggle card selection
        const isSelected = selectedCards.some(c => c.id === card.id)
        if (isSelected) {
          setSelectedCards(prev => prev.filter(c => c.id !== card.id))
        } else if (selectedCards.length < 3) {
          setSelectedCards(prev => [...prev, card])
        }
      }
      return
    }

    // Handle action card clicks during action phase from collection
    if (phase === GamePhase.ACTION_PHASE && card.type === 'action' && isOwnPerspective) {
      onCardPlay(card);
    }
  };

  const handleCollectionCardClick = (card: Card) => {
    // Handle action card clicks during action phase from collection
    if (phase === GamePhase.ACTION_PHASE && card.type === 'action' && isOwnPerspective) {
      onCardPlay(card);
    }
  };

  const handleOfferCardClick = (offerCard: OfferCard, index: number) => {
    // Handle offer card clicks - for buyer flipping during buyer-flip phase
    // The buyer can flip cards from any seller's offer
    if (canFlipCards && !offerCard.faceUp) {
      console.log('Buyer attempting to flip card:', offerCard.name);
      onCardFlip(index);
    }
  };

  const handleOfferDrop = (cards: Card[], faceUpIndex: number) => {
    // Handle dropping cards to create offer
    if (phase === GamePhase.OFFER_PHASE && isOwnPerspective && !isBuyer) {
      onOfferPlace(cards, faceUpIndex);
    }
  };

  const handleStartOfferSelection = (initialCard?: Card) => {
    if (phase === GamePhase.OFFER_PHASE && isOwnPerspective && !isBuyer && player.offer.length === 0) {
      setIsSelectingOffer(true)
      if (initialCard) {
        setSelectedCards([initialCard])
      } else {
        setSelectedCards([])
      }
    }
  }

  const handleCancelOfferSelection = () => {
    setIsSelectingOffer(false)
    setSelectedCards([])
  }

  const handleConfirmOffer = (faceUpIndex: number) => {
    if (selectedCards.length === 3) {
      onOfferPlace(selectedCards, faceUpIndex)
      setIsSelectingOffer(false)
      setSelectedCards([])
    }
  }

  const getPlayerAreaClasses = () => {
    const classes = ['player-area'];
    
    if (isCurrentPlayer) classes.push('player-area--current');
    if (isBuyer) classes.push('player-area--buyer');
    if (isOwnPerspective) classes.push('player-area--own-perspective');
    if (isSelectingOffer) classes.push('player-area--selecting-offer');
    
    return classes.join(' ');
  };

  const canMakeOffer = phase === GamePhase.OFFER_PHASE && 
                      isOwnPerspective && 
                      !isBuyer && 
                      player.offer.length === 0 &&
                      player.hand.length >= 3

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
        
        {/* Offer selection controls */}
        {canMakeOffer && !isSelectingOffer && (
          <button 
            className="player-area__offer-button"
            onClick={() => handleStartOfferSelection()}
          >
            Make Offer
          </button>
        )}
        
        {/* Offer selection button for buyers */}
        {canSelectOffer && (
          <button 
            className="player-area__select-offer-button"
            onClick={onOfferSelect}
          >
            Select This Offer
          </button>
        )}
        
        {isSelectingOffer && (
          <div className="player-area__offer-controls">
            <div className="offer-controls__info">
              Select 3 cards ({selectedCards.length}/3)
            </div>
            <div className="offer-controls__buttons">
              <button 
                className="offer-controls__cancel"
                onClick={handleCancelOfferSelection}
              >
                Cancel
              </button>
              {selectedCards.length === 3 && (
                <div className="offer-controls__face-up-selection">
                  <span>Choose face up card:</span>
                  {selectedCards.map((card, index) => (
                    <button
                      key={card.id}
                      className="offer-controls__face-up-button"
                      onClick={() => handleConfirmOffer(index)}
                    >
                      {card.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="player-area__content">
        <div className="player-area__top-row">
          <Hand
            cards={player.hand}
            isOwnHand={isOwnPerspective}
            onCardDrag={handleCardDrag}
            onCardClick={handleCardClick}
            selectedCards={isSelectingOffer ? selectedCards : []}
          />
        </div>

        <div className="player-area__middle-row">
          <OfferArea
            offer={player.offer}
            isOwnOffer={isOwnPerspective}
            canFlipCards={canFlipCards}
            onCardClick={handleOfferCardClick}
            onDrop={handleOfferDrop}
            onStartOfferSelection={handleStartOfferSelection}
          />
        </div>

        <div className="player-area__bottom-row">
          <CollectionArea
            cards={player.collection}
            points={player.points}
            onCardClick={handleCollectionCardClick}
          />
        </div>
      </div>
    </div>
  );
};

export default PlayerArea;