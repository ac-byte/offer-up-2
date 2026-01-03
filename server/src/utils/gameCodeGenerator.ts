/**
 * Generate a unique 6-character game code
 * Uses alphanumeric characters excluding confusing ones (0, O, I, 1, etc.)
 */
export function generateGameCode(): string {
  // Exclude confusing characters: 0, O, I, 1, L
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  
  return code
}

/**
 * Validate that a game code has the correct format
 */
export function isValidGameCode(code: string): boolean {
  if (!code || code.length !== 6) {
    return false
  }
  
  const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/
  return validChars.test(code)
}