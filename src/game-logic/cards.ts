import { Card } from '../types'

// Card factory functions for creating different types of cards

/**
 * Creates Thing cards with correct properties
 */
export function createThingCard(subtype: 'giant' | 'big' | 'medium' | 'tiny', index: number): Card {
  const setSize = {
    giant: 1,
    big: 2,
    medium: 3,
    tiny: 4
  }[subtype]

  const name = {
    giant: 'Giant Thing',
    big: 'Big Thing', 
    medium: 'Medium Thing',
    tiny: 'Tiny Thing'
  }[subtype]

  return {
    id: `${subtype}-${index}`,
    type: 'thing',
    subtype,
    name,
    setSize
  }
}

/**
 * Creates Gotcha cards with correct properties
 */
export function createGotchaCard(subtype: 'once' | 'twice' | 'bad', index: number): Card {
  const setSize = {
    once: 1,
    twice: 2,
    bad: 3
  }[subtype]

  const name = {
    once: 'Gotcha Once',
    twice: 'Gotcha Twice',
    bad: 'Gotcha Bad'
  }[subtype]

  return {
    id: `gotcha-${subtype}-${index}`,
    type: 'gotcha',
    subtype,
    name,
    setSize,
    effect: 'This card has an effect'
  }
}

/**
 * Creates Action cards with correct properties
 */
export function createActionCard(subtype: 'flip-one' | 'add-one' | 'remove-one' | 'remove-two' | 'steal-point', index: number): Card {
  const name = {
    'flip-one': 'Flip One',
    'add-one': 'Add One',
    'remove-one': 'Remove One',
    'remove-two': 'Remove Two',
    'steal-point': 'Steal A Point'
  }[subtype]

  return {
    id: `${subtype}-${index}`,
    type: 'action',
    subtype,
    name,
    setSize: 1,
    effect: 'This card has an effect'
  }
}

/**
 * Shuffles an array using the Fisher-Yates algorithm
 * @param array The array to shuffle (will be modified in place)
 * @returns The shuffled array
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array] // Create a copy to avoid mutating the original
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

/**
 * Identifies complete Gotcha sets in a player's collection
 * Returns an array of complete sets, where each set is an array of cards
 */
export function identifyGotchaSets(collection: Card[]): Card[][] {
  const gotchaCards = collection.filter(card => card.type === 'gotcha')
  const completeSets: Card[][] = []
  
  // Group cards by subtype
  const cardsBySubtype: { [key: string]: Card[] } = {}
  for (const card of gotchaCards) {
    if (!cardsBySubtype[card.subtype]) {
      cardsBySubtype[card.subtype] = []
    }
    cardsBySubtype[card.subtype].push(card)
  }
  
  // Check each subtype for complete sets
  for (const [subtype, cards] of Object.entries(cardsBySubtype)) {
    const setSize = cards[0]?.setSize || 0
    
    // Create complete sets from available cards
    while (cards.length >= setSize) {
      const set = cards.splice(0, setSize)
      completeSets.push(set)
    }
  }
  
  return completeSets
}

/**
 * Identifies complete Thing sets in a player's collection
 * Returns an array of complete sets, where each set is an array of cards
 */
export function identifyThingSets(collection: Card[]): Card[][] {
  const thingCards = collection.filter(card => card.type === 'thing')
  const completeSets: Card[][] = []
  
  // Group cards by subtype
  const cardsBySubtype: { [key: string]: Card[] } = {}
  for (const card of thingCards) {
    if (!cardsBySubtype[card.subtype]) {
      cardsBySubtype[card.subtype] = []
    }
    cardsBySubtype[card.subtype].push(card)
  }
  
  // Check each subtype for complete sets
  for (const [subtype, cards] of Object.entries(cardsBySubtype)) {
    const setSize = cards[0]?.setSize || 0
    
    // Create complete sets from available cards
    while (cards.length >= setSize) {
      const set = cards.splice(0, setSize)
      completeSets.push(set)
    }
  }
  
  return completeSets
}

/**
 * Creates a complete deck with the correct composition
 */
export function createDeck(): Card[] {
  const deck: Card[] = []
  
  // Thing cards (65 total)
  // Giant Thing: 4 cards
  for (let i = 0; i < 4; i++) {
    deck.push(createThingCard('giant', i))
  }
  
  // Big Thing: 16 cards
  for (let i = 0; i < 16; i++) {
    deck.push(createThingCard('big', i))
  }
  
  // Medium Thing: 25 cards
  for (let i = 0; i < 25; i++) {
    deck.push(createThingCard('medium', i))
  }
  
  // Tiny Thing: 20 cards
  for (let i = 0; i < 20; i++) {
    deck.push(createThingCard('tiny', i))
  }
  
  // Gotcha cards (32 total)
  // Gotcha Once: 10 cards
  for (let i = 0; i < 10; i++) {
    deck.push(createGotchaCard('once', i))
  }
  
  // Gotcha Twice: 10 cards
  for (let i = 0; i < 10; i++) {
    deck.push(createGotchaCard('twice', i))
  }
  
  // Gotcha Bad: 12 cards
  for (let i = 0; i < 12; i++) {
    deck.push(createGotchaCard('bad', i))
  }
  
  // Action cards (23 total)
  // Flip One: 5 cards
  for (let i = 0; i < 5; i++) {
    deck.push(createActionCard('flip-one', i))
  }
  
  // Add One: 6 cards
  for (let i = 0; i < 6; i++) {
    deck.push(createActionCard('add-one', i))
  }
  
  // Remove One: 6 cards
  for (let i = 0; i < 6; i++) {
    deck.push(createActionCard('remove-one', i))
  }
  
  // Remove Two: 3 cards
  for (let i = 0; i < 3; i++) {
    deck.push(createActionCard('remove-two', i))
  }
  
  // Steal A Point: 3 cards
  for (let i = 0; i < 3; i++) {
    deck.push(createActionCard('steal-point', i))
  }
  
  return deck
}

/**
 * Creates a complete shuffled deck ready for gameplay
 */
export function createShuffledDeck(): Card[] {
  const deck = createDeck()
  return shuffleArray(deck)
}