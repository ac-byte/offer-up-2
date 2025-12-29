import React from 'react';
import './App.css';
import { GameBoard } from './components/GameBoard';
import { GameProvider } from './contexts';

function App() {
  return (
    <div className="App">
      <GameProvider>
        <GameBoard />
      </GameProvider>
    </div>
  );
}

export default App;