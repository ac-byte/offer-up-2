import { Card } from '../types'

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
        type: 'thing',
        subtype: `thing_${value}`,
        setSize: value,
        effect: undefined
      })
    }
  }
  
  // Gotcha cards
  const gotchaCards = [
    { name: 'Gotcha Once', count: 3, subtype: 'gotcha_once' },
    { name: 'Gotcha Twice', count: 2, subtype: 'gotcha_twice' }
  ]
  
  gotchaCards.forEach(({ name, count, subtype }) => {
    for (let i = 0; i < count; i++) {
      cards.push({
        id: `gotcha_${subtype}_${i}`,
        name: name,
        type: 'gotcha',
        subtype: subtype,
        setSize: 0,
        effect: `Buyer selects cards from another player's collection`
      })
    }
  })
  
  // Action cards
  const actionCards = [
    { name: 'Flip One', count: 3, subtype: 'flip_one' },
    { name: 'Add One', count: 3, subtype: 'add_one' },
    { name: 'Remove One', count: 3, subtype: 'remove_one' },
    { name: 'Remove Two', count: 2, subtype: 'remove_two' },
    { name: 'Steal A Point', count: 2, subtype: 'steal_point' }
  ]
  
  actionCards.forEach(({ name, count, subtype }) => {
    for (let i = 0; i < count; i++) {
      cards.push({
        id: `action_${subtype}_${i}`,
        name: name,
        type: 'action',
        subtype: subtype,
        setSize: 0,
        effect: getActionCardEffect(name)
      })
    }
  })
  
  return cards
}

/**
 * Get the effect description for an action card
 */
function getActionCardEffect(cardName: string): string {
  switch (cardName) {
    case 'Flip One':
      return 'Flip one face-down card in any offer'
    case 'Add One':
      return 'Add one card from your hand to any offer'
    case 'Remove One':
      return 'Remove one card from any offer'
    case 'Remove Two':
      return 'Remove two cards from any offers'
    case 'Steal A Point':
      return 'Steal one point from a player with more points than you'
    default:
      return 'Unknown action card effect'
  }
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