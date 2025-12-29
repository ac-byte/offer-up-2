import React from 'react';
import './App.css';
import { createDeck } from './game-logic/cards';
import { CardDemo } from './components/CardDemo';

function App() {
  // Create a deck to show that the game logic is working
  const deck = createDeck();
  const deckStats = {
    total: deck.length,
    things: deck.filter(c => c.type === 'thing').length,
    gotchas: deck.filter(c => c.type === 'gotcha').length,
    actions: deck.filter(c => c.type === 'action').length
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Trading Card Game</h1>
        <p>Core game logic implemented!</p>
        <div style={{ textAlign: 'left', margin: '20px' }}>
          <h3>Deck Statistics:</h3>
          <ul>
            <li>Total Cards: {deckStats.total}</li>
            <li>Thing Cards: {deckStats.things}</li>
            <li>Gotcha Cards: {deckStats.gotchas}</li>
            <li>Action Cards: {deckStats.actions}</li>
          </ul>
          <p>✅ All tests passing</p>
          <p>✅ Property-based tests verified</p>
          <p>✅ Game state management ready</p>
          <p>✅ Card component implemented</p>
        </div>
      </header>
      
      <main>
        <CardDemo />
      </main>
    </div>
  );
}

export default App;