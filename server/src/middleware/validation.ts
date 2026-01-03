import { Request, Response, NextFunction } from 'express'
import { isValidGameCode } from '../utils/gameCodeGenerator'

/**
 * Middleware to validate request bodies
 */
export const validateCreateGame = (req: Request, res: Response, next: NextFunction) => {
  const { hostName } = req.body
  
  if (!hostName) {
    return res.status(400).json({ error: 'Host name is required' })
  }
  
  if (typeof hostName !== 'string') {
    return res.status(400).json({ error: 'Host name must be a string' })
  }
  
  if (hostName.trim().length === 0) {
    return res.status(400).json({ error: 'Host name cannot be empty' })
  }
  
  if (hostName.length > 20) {
    return res.status(400).json({ error: 'Host name too long (max 20 characters)' })
  }
  
  // Sanitize the host name
  req.body.hostName = hostName.trim()
  next()
}

export const validateJoinGame = (req: Request, res: Response, next: NextFunction) => {
  const { gameCode } = req.params
  const { playerName } = req.body
  
  if (!gameCode) {
    return res.status(400).json({ error: 'Game code is required' })
  }
  
  if (!isValidGameCode(gameCode.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid game code format' })
  }
  
  if (!playerName) {
    return res.status(400).json({ error: 'Player name is required' })
  }
  
  if (typeof playerName !== 'string') {
    return res.status(400).json({ error: 'Player name must be a string' })
  }
  
  if (playerName.trim().length === 0) {
    return res.status(400).json({ error: 'Player name cannot be empty' })
  }
  
  if (playerName.length > 20) {
    return res.status(400).json({ error: 'Player name too long (max 20 characters)' })
  }
  
  // Sanitize inputs
  req.params.gameCode = gameCode.toUpperCase()
  req.body.playerName = playerName.trim()
  next()
}

export const validateStartGame = (req: Request, res: Response, next: NextFunction) => {
  const { gameCode } = req.params
  const { hostPlayerId } = req.body
  
  if (!gameCode) {
    return res.status(400).json({ error: 'Game code is required' })
  }
  
  if (!isValidGameCode(gameCode.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid game code format' })
  }
  
  if (!hostPlayerId) {
    return res.status(400).json({ error: 'Host player ID is required' })
  }
  
  if (typeof hostPlayerId !== 'string') {
    return res.status(400).json({ error: 'Host player ID must be a string' })
  }
  
  // Sanitize inputs
  req.params.gameCode = gameCode.toUpperCase()
  next()
}

export const validateGameAction = (req: Request, res: Response, next: NextFunction) => {
  const { gameId } = req.params
  const { action, playerId } = req.body
  
  if (!gameId) {
    return res.status(400).json({ error: 'Game ID is required' })
  }
  
  if (typeof gameId !== 'string') {
    return res.status(400).json({ error: 'Game ID must be a string' })
  }
  
  if (!action) {
    return res.status(400).json({ error: 'Action is required' })
  }
  
  if (typeof action !== 'object' || !action.type) {
    return res.status(400).json({ error: 'Action must be an object with a type property' })
  }
  
  if (!playerId) {
    return res.status(400).json({ error: 'Player ID is required' })
  }
  
  if (typeof playerId !== 'string') {
    return res.status(400).json({ error: 'Player ID must be a string' })
  }
  
  next()
}

export const validateGameCode = (req: Request, res: Response, next: NextFunction) => {
  const { gameCode } = req.params
  
  if (!gameCode) {
    return res.status(400).json({ error: 'Game code is required' })
  }
  
  if (!isValidGameCode(gameCode.toUpperCase())) {
    return res.status(400).json({ error: 'Invalid game code format' })
  }
  
  req.params.gameCode = gameCode.toUpperCase()
  next()
}

export const validateSSEParams = (req: Request, res: Response, next: NextFunction) => {
  const { gameId } = req.params
  const { playerId } = req.query
  
  if (!gameId) {
    return res.status(400).json({ error: 'Game ID is required' })
  }
  
  if (typeof gameId !== 'string') {
    return res.status(400).json({ error: 'Game ID must be a string' })
  }
  
  if (!playerId) {
    return res.status(400).json({ error: 'Player ID is required' })
  }
  
  if (typeof playerId !== 'string') {
    return res.status(400).json({ error: 'Player ID must be a string' })
  }
  
  next()
}