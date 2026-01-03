import React, { useState } from 'react';
import './App.css';
import { GameBoard } from './components/GameBoard';
import { HomeScreen } from './components/HomeScreen';
import { GameLobby } from './components/GameLobby';
import { GameProvider } from './contexts';
import { MultiplayerProvider, useMultiplayer } from './contexts/MultiplayerContext';

type AppScreen = 'home' | 'lobby' | 'game'

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home')
  const { state, leaveGame } = useMultiplayer()

  const handleStartLocalGame = () => {
    setCurrentScreen('game')
  }

  const handleEnterLobby = () => {
    setCurrentScreen('lobby')
  }

  const handleLeaveLobby = () => {
    leaveGame()
    setCurrentScreen('home')
  }

  const handleGameStart = () => {
    setCurrentScreen('game')
  }

  // Auto-navigate to game when multiplayer game starts
  React.useEffect(() => {
    if (state.mode === 'multiplayer' && state.gameStarted) {
      setCurrentScreen('game')
    }
  }, [state.mode, state.gameStarted])

  return (
    <div className="App">
      <GameProvider>
        {currentScreen === 'home' && (
          <HomeScreen 
            onStartGame={handleStartLocalGame}
            onEnterLobby={handleEnterLobby}
          />
        )}
        
        {currentScreen === 'lobby' && (
          <GameLobby 
            onLeaveGame={handleLeaveLobby}
          />
        )}
        
        {currentScreen === 'game' && (
          <GameBoard />
        )}
      </GameProvider>
    </div>
  )
}

function App() {
  return (
    <MultiplayerProvider>
      <AppContent />
    </MultiplayerProvider>
  );
}

export default App;