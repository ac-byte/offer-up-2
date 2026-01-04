import React from 'react';
import { Player, GamePhase, Card, OfferCard, CardDisplayState, OfferCreationState } from '../types';
import { Card as CardComponent } from './Card';
import { CollapsibleSection } from './CollapsibleSection';
import './PlayerArea.css';

interface PlayerAreaProps {
  player: Player;
  isCurrentPlayer: boolean;
  isBuyer: boolean;
  perspective: number;
  phase: GamePhase;
  isActivePlayer: boolean; // New prop to indicate if this is the active player area
  offerCreationState?: OfferCreationState | null; // Add offer creation state
  onCardPlay: (card: Card) => void;
  onOfferPlace: (cards: Card[], faceUpIndex: number) => void;
  onCardFlip: (cardIndex: number) => void;
  onOfferSelect: () => void;
  onGotchaCardSelect?: (cardId: string) => void;
  onFlipOneCardSelect?: (cardIndex: number) => void;
  onAddOneHandCardSelect?: (cardId: string) => void;
  onAddOneOfferSelect?: () => void;
  onRemoveOneCardSelect?: (cardIndex: number) => void;
  onRemoveTwoCardSelect?: (cardIndex: number) => void;
  onDeclareDone?: () => void;
  onMoveCardToOffer?: (cardId: string) => void;
  onMoveCardToHand?: (cardId: string) => void;
  onLockOfferForFlipping?: () => void;
  onFlipOfferCard?: (cardIndex: number) => void;
  canFlipCards: boolean;
  canSelectOffer: boolean;
  canSelectGotchaCards?: boolean;
  canSelectFlipOneCards?: boolean;
  canSelectAddOneHandCards?: boolean;
  canSelectAddOneOffers?: boolean;
  canSelectRemoveOneCards?: boolean;
  canSelectRemoveTwoCards?: boolean;
  isDone?: boolean;
  canDeclareDone?: boolean;
}

interface HandProps {
  cards: Card[];
  isOwnHand: boolean;
  onCardDrag?: (card: Card) => void;
  onCardClick?: (card: Card) => void;
  canSelectAddOneCards?: boolean;
}

interface OfferAreaProps {
  offer: OfferCard[];
  isOwnOffer: boolean;
  canFlipCards: boolean;
  canSelectFlipOneCards?: boolean;
  canSelectAddOneOffers?: boolean;
  canSelectRemoveOneCards?: boolean;
  canSelectRemoveTwoCards?: boolean;
  onCardClick?: (card: OfferCard, index: number) => void;
  onOfferClick?: () => void;
  onDrop?: (cards: Card[], faceUpIndex: number) => void;
}

interface CollectionAreaProps {
  cards: Card[];
  points: number;
  onCardClick?: (card: Card) => void;
  canSelectGotchaCards?: boolean;
}

// Hand sub-component
const Hand: React.FC<HandProps> = ({ cards, isOwnHand, onCardDrag, onCardClick, canSelectAddOneCards = false }) => {
  const getCardDisplayState = (card: Card): CardDisplayState => {
    return isOwnHand ? 'face_up' : 'face_down';
  };

  const handleCardClick = (card: Card) => {
    if (canSelectAddOneCards && isOwnHand) {
      // For Add One effect, clicking selects the card
      onCardClick?.(card)
    } else {
      // Normal card click behavior (including interactive offer creation)
      onCardClick?.(card)
    }
  }

  return (
    <div className={`hand ${canSelectAddOneCards && isOwnHand ? 'hand--add-one-selectable' : ''}`}>
      {/* Hints and selection info */}
      {canSelectAddOneCards && isOwnHand && (
        <div className="hand__add-one-hint">Click a card to add to an offer</div>
      )}
      
      <div className="hand__cards">
        {cards.map((card, index) => (
          <CardComponent
            key={`${card.id}-${index}`}
            card={card}
            displayState={getCardDisplayState(card)}
            draggable={isOwnHand && !canSelectAddOneCards}
            onDragStart={onCardDrag}
            onClick={() => handleCardClick(card)}
            className={`hand__card ${canSelectAddOneCards && isOwnHand ? 'hand__card--add-one-selectable' : ''}`}
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
const OfferArea: React.FC<OfferAreaProps> = ({ offer, isOwnOffer, canFlipCards, canSelectFlipOneCards = false, canSelectAddOneOffers = false, canSelectRemoveOneCards = false, canSelectRemoveTwoCards = false, onCardClick, onOfferClick, onDrop }) => {
  const getCardDisplayState = (offerCard: OfferCard): CardDisplayState => {
    if (offerCard.faceUp) {
      return 'face_up';
    }
    // Show partial state for own face-down cards, face-down for others
    return isOwnOffer ? 'partial' : 'face_down';
  };

  const handleOfferAreaClick = () => {
    if (canSelectAddOneOffers && offer.length > 0) {
      // For Add One effect, clicking the offer area selects this offer
      onOfferClick?.()
    }
  }

  const offerAreaClasses = [
    'offer-area',
    isOwnOffer ? 'offer-area--own' : '',
    canSelectAddOneOffers && offer.length > 0 ? 'offer-area--add-one-selectable' : ''
  ].filter(Boolean).join(' ')

  return (
    <div 
      className={offerAreaClasses}
      onClick={handleOfferAreaClick}
    >
      {/* Hints for different interaction modes */}
      {canSelectFlipOneCards && (
        <div className="offer-area__flip-one-hint">Click face-down card to flip</div>
      )}
      {canSelectAddOneOffers && offer.length > 0 && (
        <div className="offer-area__add-one-hint">Click to add card here</div>
      )}
      {canSelectRemoveOneCards && offer.length > 0 && (
        <div className="offer-area__remove-one-hint">Click card to remove</div>
      )}
      {canSelectRemoveTwoCards && offer.length > 0 && (
        <div className="offer-area__remove-two-hint">Click cards to remove - 2 total</div>
      )}
      
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
                } ${
                  canSelectFlipOneCards && !offerCard.faceUp ? 'offer-area__card--flip-one-selectable' : ''
                } ${
                  canSelectRemoveOneCards ? 'offer-area__card--remove-one-selectable' : ''
                } ${
                  canSelectRemoveTwoCards ? 'offer-area__card--remove-two-selectable' : ''
                } ${
                  isOwnOffer ? 'offer-area__card--clickable' : ''
                }`}
              />
            ))
        ) : (
          <div className="offer-area__empty">
            {isOwnOffer ? 'Click cards in your hand to add to offer' : 'No offer placed'}
          </div>
        )}
      </div>
    </div>
  );
};

// CollectionArea sub-component
const CollectionArea: React.FC<CollectionAreaProps> = ({ cards, points, onCardClick, canSelectGotchaCards = false }) => {
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
      {canSelectGotchaCards && (
        <div className="collection-area__gotcha-hint">
          Click a card to select for Gotcha effect
        </div>
      )}
      
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
                  className={`collection-area__card ${
                    canSelectGotchaCards ? 'collection-area__card--selectable' : ''
                  }`}
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
  isActivePlayer,
  offerCreationState,
  onCardPlay,
  onOfferPlace,
  onCardFlip,
  onOfferSelect,
  onGotchaCardSelect,
  onFlipOneCardSelect,
  onAddOneHandCardSelect,
  onAddOneOfferSelect,
  onRemoveOneCardSelect,
  onRemoveTwoCardSelect,
  onDeclareDone,
  onMoveCardToOffer,
  onMoveCardToHand,
  onLockOfferForFlipping,
  onFlipOfferCard,
  canFlipCards,
  canSelectOffer,
  canSelectGotchaCards = false,
  canSelectFlipOneCards = false,
  canSelectAddOneHandCards = false,
  canSelectAddOneOffers = false,
  canSelectRemoveOneCards = false,
  canSelectRemoveTwoCards = false,
  isDone = false,
  canDeclareDone = false
}) => {
  const isOwnPerspective = player.id === perspective;
  
  // Define phases where offers should be auto-expanded
  const OFFER_RELEVANT_PHASES = [
    GamePhase.OFFER_PHASE,
    GamePhase.BUYER_FLIP,
    GamePhase.ACTION_PHASE,
    GamePhase.OFFER_SELECTION
  ];

  // Determine if offers should be expanded based on current phase
  const shouldExpandOffers = OFFER_RELEVANT_PHASES.includes(phase);

  // State for collapsible sections with defaults based on active player status
  const [sectionStates, setSectionStates] = React.useState({
    collection: true,  // expanded by default for all players
    offer: true,       // expanded by default, but will be managed by phase logic
    hand: isActivePlayer // expanded for active player, collapsed for others
  });

  // State to track manual overrides for offer section during relevant phases
  const [offerManualOverride, setOfferManualOverride] = React.useState<boolean | null>(null);

  const handleSectionToggle = (sectionId: string, isExpanded: boolean) => {
    if (sectionId === 'offer' && shouldExpandOffers) {
      // In relevant phases, track manual override for offer section
      setOfferManualOverride(isExpanded);
    }
    
    setSectionStates(prev => ({
      ...prev,
      [sectionId]: isExpanded
    }));
  };

  // Effect to handle phase-based offer visibility
  React.useEffect(() => {
    if (shouldExpandOffers) {
      // In relevant phases, expand offers unless manually overridden
      if (offerManualOverride === null) {
        // No manual override, auto-expand
        setSectionStates(prev => ({
          ...prev,
          offer: true
        }));
      }
      // If there's a manual override, respect it
    } else {
      // In non-relevant phases, auto-collapse offers and clear manual override
      setSectionStates(prev => ({
        ...prev,
        offer: false
      }));
      setOfferManualOverride(null);
    }
  }, [phase, shouldExpandOffers, offerManualOverride]);

  // Get the effective expanded state for offer section
  const getOfferExpandedState = () => {
    if (shouldExpandOffers) {
      // In relevant phases, use manual override if set, otherwise default to expanded
      return offerManualOverride !== null ? offerManualOverride : sectionStates.offer;
    } else {
      // In non-relevant phases, always collapsed
      return false;
    }
  };

  const handleCardDrag = (card: Card) => {
    // Card drag started - this will be used for offer placement
    console.log('Card drag started:', card.name);
  };

  const handleCardClick = (card: Card) => {
    // Debug logging for multiplayer troubleshooting
    console.log('handleCardClick called:', {
      cardId: card.id,
      phase,
      isOwnPerspective,
      isBuyer,
      playerId: player.id,
      offerCreationState,
      hasOnMoveCardToOffer: !!onMoveCardToOffer
    });

    // Handle Add One hand card selection during action phase
    if (canSelectAddOneHandCards && onAddOneHandCardSelect) {
      onAddOneHandCardSelect(card.id);
      return;
    }

    // Handle interactive offer creation during offer phase (only in selecting mode)
    if (phase === GamePhase.OFFER_PHASE && isOwnPerspective && !isBuyer && 
        offerCreationState && offerCreationState.playerId === player.id && 
        offerCreationState.mode === 'selecting' && onMoveCardToOffer) {
      console.log('Moving card to offer:', card.id);
      onMoveCardToOffer(card.id);
      return;
    }

    // Handle action card clicks during action phase from collection
    if (phase === GamePhase.ACTION_PHASE && card.type === 'action' && isOwnPerspective) {
      onCardPlay(card);
    }
  };

  const handleCollectionCardClick = (card: Card) => {
    // Handle Gotcha card selection during Gotcha trade-ins phase
    if (phase === GamePhase.GOTCHA_TRADEINS && canSelectGotchaCards && onGotchaCardSelect) {
      onGotchaCardSelect(card.id);
      return;
    }

    // Handle action card clicks during action phase from collection
    if (phase === GamePhase.ACTION_PHASE && card.type === 'action' && isOwnPerspective) {
      onCardPlay(card);
    }
  };

  const handleOfferCardClick = (offerCard: OfferCard, index: number) => {
    // Handle offer creation flipping mode - check this FIRST
    if (phase === GamePhase.OFFER_PHASE && isOwnPerspective && !isBuyer && 
        offerCreationState && offerCreationState.playerId === player.id && 
        offerCreationState.mode === 'flipping' && onFlipOfferCard) {
      onFlipOfferCard(index);
      return;
    }

    // Handle interactive offer creation - move card back to hand (only in selecting mode)
    if (phase === GamePhase.OFFER_PHASE && isOwnPerspective && !isBuyer && 
        offerCreationState && offerCreationState.playerId === player.id && 
        offerCreationState.mode === 'selecting' && onMoveCardToHand) {
      onMoveCardToHand(offerCard.id);
      return;
    }

    // Handle Remove Two card selection during action phase
    if (canSelectRemoveTwoCards && onRemoveTwoCardSelect) {
      console.log('Selecting card for Remove Two effect:', offerCard.name);
      onRemoveTwoCardSelect(index);
      return;
    }

    // Handle Remove One card selection during action phase
    if (canSelectRemoveOneCards && onRemoveOneCardSelect) {
      console.log('Selecting card for Remove One effect:', offerCard.name);
      onRemoveOneCardSelect(index);
      return;
    }

    // Handle Flip One card selection during action phase
    if (canSelectFlipOneCards && !offerCard.faceUp && onFlipOneCardSelect) {
      console.log('Selecting card for Flip One effect:', offerCard.name);
      onFlipOneCardSelect(index);
      return;
    }

    // Handle offer card clicks - for buyer flipping during buyer-flip phase
    // The buyer can flip cards from any seller's offer
    if (canFlipCards && !offerCard.faceUp) {
      console.log('Buyer attempting to flip card:', offerCard.name);
      onCardFlip(index);
    }
  };

  const handleAddOneOfferClick = () => {
    // Handle Add One offer selection during action phase
    if (canSelectAddOneOffers && onAddOneOfferSelect) {
      onAddOneOfferSelect();
    }
  };

  const handleOfferDrop = (cards: Card[], faceUpIndex: number) => {
    // Handle dropping cards to create offer (legacy - may not be used with new system)
    if (phase === GamePhase.OFFER_PHASE && isOwnPerspective && !isBuyer) {
      onOfferPlace(cards, faceUpIndex);
    }
  };

  const getPlayerAreaClasses = () => {
    const classes = ['player-area'];
    
    if (isCurrentPlayer) classes.push('player-area--current');
    if (isBuyer) classes.push('player-area--buyer');
    if (isOwnPerspective) classes.push('player-area--own-perspective');
    if (isActivePlayer) classes.push('player-area--active-player');
    if (phase === GamePhase.ACTION_PHASE && isDone) classes.push('player-area--action-phase-done');
    
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
        
        {/* Action Phase "I'm done" checkbox */}
        {phase === GamePhase.ACTION_PHASE && (
          <div className="player-area__done-checkbox">
            <label className="done-checkbox__label">
              <input
                type="checkbox"
                className="done-checkbox__input"
                checked={isDone}
                disabled={!canDeclareDone}
                onChange={() => {
                  if (canDeclareDone && !isDone) {
                    onDeclareDone?.()
                  }
                }}
              />
              <span className="done-checkbox__text">I'm done</span>
            </label>
          </div>
        )}
        
        {/* Interactive Offer Creation Controls */}
        {phase === GamePhase.OFFER_PHASE && isOwnPerspective && !isBuyer && (
          <div className="player-area__offer-creation-controls">
            {/* Show "Lock in cards and flip one" button when 3 cards in offer and in selecting mode */}
            {player.offer.length === 3 && 
             offerCreationState && 
             offerCreationState.playerId === player.id && 
             offerCreationState.mode === 'selecting' && 
             onLockOfferForFlipping && (
              <button 
                className="player-area__lock-offer-button"
                onClick={onLockOfferForFlipping}
              >
                Lock in cards and flip one
              </button>
            )}
            
            {/* Show "Click on a card to flip it" text when in flipping mode */}
            {offerCreationState && 
             offerCreationState.playerId === player.id && 
             offerCreationState.mode === 'flipping' && (
              <div className="player-area__flip-instruction">
                Click on a card to flip it
              </div>
            )}
          </div>
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
      </div>

      <div className="player-area__content">
        {/* Collection Section (Top) */}
        <CollapsibleSection
          id={`collection-${player.id}`}
          title={`Collection (${player.collection.length} cards, ${player.points} points)`}
          isExpanded={sectionStates.collection}
          onToggle={handleSectionToggle}
          className="player-area__collection-section"
        >
          <CollectionArea
            cards={player.collection}
            points={player.points}
            onCardClick={handleCollectionCardClick}
            canSelectGotchaCards={canSelectGotchaCards}
          />
        </CollapsibleSection>

        {/* Offer Section (Middle) */}
        <CollapsibleSection
          id={`offer-${player.id}`}
          title="Offer Area"
          isExpanded={getOfferExpandedState()}
          onToggle={handleSectionToggle}
          className="player-area__offer-section"
        >
          <OfferArea
            offer={player.offer}
            isOwnOffer={isOwnPerspective}
            canFlipCards={canFlipCards}
            canSelectFlipOneCards={canSelectFlipOneCards}
            canSelectAddOneOffers={canSelectAddOneOffers}
            canSelectRemoveOneCards={canSelectRemoveOneCards}
            canSelectRemoveTwoCards={canSelectRemoveTwoCards}
            onCardClick={handleOfferCardClick}
            onOfferClick={handleAddOneOfferClick}
            onDrop={handleOfferDrop}
          />
        </CollapsibleSection>

        {/* Hand Section (Bottom) */}
        <CollapsibleSection
          id={`hand-${player.id}`}
          title={`Hand (${player.hand.length})`}
          isExpanded={sectionStates.hand}
          onToggle={handleSectionToggle}
          className="player-area__hand-section"
        >
          <Hand
            cards={player.hand}
            isOwnHand={isOwnPerspective}
            onCardDrag={handleCardDrag}
            onCardClick={handleCardClick}
            canSelectAddOneCards={canSelectAddOneHandCards}
          />
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default PlayerArea;