import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import './App.css';
import { GameBoard } from './components/GameBoard';
import { HomeScreen } from './components/HomeScreen';
import { GameLobby } from './components/GameLobby';
import { FeedbackModal, FeedbackButton } from './components';
import { GameProvider, useGameContext } from './contexts';
import { MultiplayerProvider, useMultiplayer } from './contexts/MultiplayerContext';
import { GameAction } from './types';

type AppScreen = 'home' | 'lobby' | 'game'

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home')
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const { state, leaveGame } = useMultiplayer()
  const { dispatch } = useGameContext()
  const navigate = useNavigate()

  const handleStartLocalGame = (action: GameAction) => {
    // Dispatch the START_GAME action to actually start the game
    dispatch(action)
    setCurrentScreen('game')
  }

  const handleEnterLobby = () => {
    setCurrentScreen('lobby')
  }

  const handleLeaveLobby = () => {
    leaveGame()
    setCurrentScreen('home')
    navigate('/')
  }

  const handleOpenFeedback = () => {
    setIsFeedbackModalOpen(true)
  }

  const handleCloseFeedback = () => {
    setIsFeedbackModalOpen(false)
  }

  // Auto-navigate to game when multiplayer game starts
  useEffect(() => {
    if (state.mode === 'multiplayer' && state.gameStarted) {
      setCurrentScreen('game')
    }
  }, [state.mode, state.gameStarted])

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={
          currentScreen === 'home' ? (
            <HomeScreen 
              onStartGame={handleStartLocalGame}
              onEnterLobby={handleEnterLobby}
              onOpenFeedback={handleOpenFeedback}
            />
          ) : currentScreen === 'lobby' ? (
            <GameLobby 
              onLeaveGame={handleLeaveLobby}
            />
          ) : currentScreen === 'game' ? (
            <GameBoard />
          ) : null
        } />
        
        <Route path="/join" element={
          <JoinGameHandler 
            onEnterLobby={handleEnterLobby}
            onError={() => {
              setCurrentScreen('home')
              navigate('/')
            }}
          />
        } />
      </Routes>
      
      {/* Global Feedback System */}
      <FeedbackButton onClick={handleOpenFeedback} />
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={handleCloseFeedback} 
      />
    </div>
  )
}

function JoinGameHandler({ onEnterLobby, onError }: { onEnterLobby: () => void, onError: () => void }) {
  const [searchParams] = useSearchParams()
  const { joinGame } = useMultiplayer()
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const navigate = useNavigate()

  const gameCode = searchParams.get('game')

  useEffect(() => {
    if (!gameCode) {
      setError('No game code provided in URL')
      return
    }

    // Validate game code format (should be 6 characters)
    if (gameCode.length !== 6) {
      setError('Invalid game code format')
      return
    }
  }, [gameCode])

  const handleJoinGame = async () => {
    if (!gameCode || !playerName.trim()) {
      setError('Player name is required')
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      await joinGame(gameCode, playerName.trim())
      navigate('/')  // Navigate to home, which will show the lobby
      onEnterLobby()
    } catch (err) {
      setError('Failed to join game. Please check your connection and try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleGoHome = () => {
    navigate('/')
    onError()
  }

  if (!gameCode) {
    return (
      <div className="join-game-error">
        <h2>Invalid Game Link</h2>
        <p>No game code was provided in the URL.</p>
        <button onClick={handleGoHome}>Go Home</button>
      </div>
    )
  }

  return (
    <div className="join-game-screen">
      <h2>Join Game</h2>
      <p>Game Code: <strong>{gameCode}</strong></p>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="join-form">
        <label htmlFor="playerName">Your Name:</label>
        <input
          id="playerName"
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          disabled={isJoining}
          onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
        />
        
        <div className="join-actions">
          <button 
            onClick={handleJoinGame}
            disabled={isJoining || !playerName.trim()}
          >
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
          
          <button onClick={handleGoHome} disabled={isJoining}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <MultiplayerProvider>
        <GameProvider>
          <AppContent />
        </GameProvider>
      </MultiplayerProvider>
    </Router>
  );
}

export default App;