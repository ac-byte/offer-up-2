import React from 'react';
import { GameState } from '../types';
import './CardTracker.css';

interface CardTrackerProps {
  gameState: GameState;
}

export const CardTracker: React.FC<CardTrackerProps> = ({ gameState }) => {
  // Calculate card counts
  const drawPileCount = gameState.drawPile.length;
  const discardPileCount = gameState.discardPile.length;
  
  const cardsInPlay = gameState.players.reduce((total, player) => 
    total + player.hand.length + player.collection.length + player.offer.length, 0
  );
  
  const totalCards = drawPileCount + discardPileCount + cardsInPlay;
  const expectedTotal = 120;
  const cardLoss = expectedTotal - totalCards;
  
  // Track card counts over time
  const [cardHistory, setCardHistory] = React.useState<Array<{
    phase: string;
    round: number;
    drawPile: number;
    discardPile: number;
    cardsInPlay: number;
    total: number;
    loss: number;
  }>>([]);
  
  // Update history when phase changes
  React.useEffect(() => {
    const newEntry = {
      phase: gameState.currentPhase,
      round: gameState.round,
      drawPile: drawPileCount,
      discardPile: discardPileCount,
      cardsInPlay,
      total: totalCards,
      loss: cardLoss
    };
    
    setCardHistory(prev => {
      // Only add if it's different from the last entry
      const lastEntry = prev[prev.length - 1];
      if (!lastEntry || 
          lastEntry.phase !== newEntry.phase || 
          lastEntry.round !== newEntry.round ||
          lastEntry.total !== newEntry.total) {
        return [...prev.slice(-10), newEntry]; // Keep last 10 entries
      }
      return prev;
    });
  }, [gameState.currentPhase, gameState.round, totalCards]);
  
  return (
    <div className="card-tracker">
      <div className="card-tracker-header">
        <h4>Card Tracker (Debug)</h4>
        <div className={`total-cards ${cardLoss > 0 ? 'card-loss' : ''}`}>
          Total: {totalCards}/120 {cardLoss > 0 && `(LOSS: ${cardLoss})`}
        </div>
      </div>
      
      <div className="current-counts">
        <div className="count-item">
          <span className="label">Draw:</span>
          <span className="value">{drawPileCount}</span>
        </div>
        <div className="count-item">
          <span className="label">Discard:</span>
          <span className="value">{discardPileCount}</span>
        </div>
        <div className="count-item">
          <span className="label">In Play:</span>
          <span className="value">{cardsInPlay}</span>
        </div>
      </div>
      
      {cardHistory.length > 0 && (
        <div className="card-history">
          <div className="history-header">History:</div>
          <div className="history-list">
            {cardHistory.map((entry, index) => (
              <div key={index} className={`history-entry ${entry.loss > 0 ? 'has-loss' : ''}`}>
                <span className="phase-info">R{entry.round} {entry.phase}</span>
                <span className="counts">{entry.drawPile}+{entry.discardPile}+{entry.cardsInPlay}={entry.total}</span>
                {entry.loss > 0 && <span className="loss">-{entry.loss}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};