import { ServerConfig } from '../types'

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3000'),
  clientUrl: process.env.CLIENT_URL || (process.env.NODE_ENV === 'production' 
    ? 'https://offer-up-2-frontend-production.up.railway.app' 
    : 'http://localhost:3001'),
  maxGames: parseInt(process.env.MAX_GAMES || '10'),
  maxPlayersPerGame: 6,
  minPlayersPerGame: 3,
  gameCleanupInterval: 60000, // 1 minute
  playerTimeoutMs: 30000 // 30 seconds
}

export default config