import { Card, CardType } from '../types'

/**
 * Creates a shuffled deck of cards
 */
export function createShuffledDeck(): Card[] {
  const deck = createDeck()
  return shuffleArray(deck)
}

/**
 * Creates the standard deck of cards
 */
function createDeck(): Card[] {
  const cards: Card[] = []
  
  // Thing cards (numbers 1-9, multiple of each)
  const thingCounts = [6, 6, 6, 5, 5, 4, 4, 3, 2] // How many of each number
  
  for (let value = 1; value <= 9; value++) {
    const count = thingCounts[value - 1]
    for (let i = 0; i < count; i++) {
      cards.push({
        id: `thing_${value}_${i}`,
        name: `${value}`,
        type: 'thing' as CardType,
        value: value,
        faceUp: false
      })
    }
  }
  
  // Action cards
  const actionCards = [
    { name: 'Gotcha Once', count: 3 },
    { name: 'Gotcha Twice', count: 2 },
    { name: 'Flip One', count: 3 },
    { name: 'Add One', count: 3 },
    { name: 'Remove One', count: 3 },
    { name: 'Remove Two', count: 2 },
    { name: 'Steal A Point', count: 2 }
  ]
  
  actionCards.forEach(({ name, count }) => {
    for (let i = 0; i < count; i++) {
      cards.push({
        id: `action_${name.toLowerCase().replace(/\s+/g, '_')}_${i}`,
        name: name,
        type: 'action' as CardType,
        value: 0,
        faceUp: false
      })
    }
  })
  
  return cards
}

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}