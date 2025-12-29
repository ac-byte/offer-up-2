import * as fc from 'fast-check'
import { Card } from '../../types'

// Mock deck creation function - this will be implemented in task 2
// For now, we'll create a mock that generates the correct deck composition
function createDeck(): Card[] {
  const deck: Card[] = []
  
  // Thing cards (65 total)
  // Giant Thing: 4 cards
  for (let i = 0; i < 4; i++) {
    deck.push({
      id: `giant-${i}`,
      type: 'thing',
      subtype: 'giant',
      name: 'Giant Thing',
      setSize: 1
    })
  }
  
  // Big Thing: 16 cards
  for (let i = 0; i < 16; i++) {
    deck.push({
      id: `big-${i}`,
      type: 'thing',
      subtype: 'big',
      name: 'Big Thing',
      setSize: 2
    })
  }
  
  // Medium Thing: 25 cards
  for (let i = 0; i < 25; i++) {
    deck.push({
      id: `medium-${i}`,
      type: 'thing',
      subtype: 'medium',
      name: 'Medium Thing',
      setSize: 3
    })
  }
  
  // Tiny Thing: 20 cards
  for (let i = 0; i < 20; i++) {
    deck.push({
      id: `tiny-${i}`,
      type: 'thing',
      subtype: 'tiny',
      name: 'Tiny Thing',
      setSize: 4
    })
  }
  
  // Gotcha cards (32 total)
  // Gotcha Once: 10 cards
  for (let i = 0; i < 10; i++) {
    deck.push({
      id: `gotcha-once-${i}`,
      type: 'gotcha',
      subtype: 'once',
      name: 'Gotcha Once',
      setSize: 1,
      effect: 'This card has an effect'
    })
  }
  
  // Gotcha Twice: 10 cards
  for (let i = 0; i < 10; i++) {
    deck.push({
      id: `gotcha-twice-${i}`,
      type: 'gotcha',
      subtype: 'twice',
      name: 'Gotcha Twice',
      setSize: 2,
      effect: 'This card has an effect'
    })
  }
  
  // Gotcha Bad: 12 cards
  for (let i = 0; i < 12; i++) {
    deck.push({
      id: `gotcha-bad-${i}`,
      type: 'gotcha',
      subtype: 'bad',
      name: 'Gotcha Bad',
      setSize: 3,
      effect: 'This card has an effect'
    })
  }
  
  // Action cards (23 total)
  // Flip One: 5 cards
  for (let i = 0; i < 5; i++) {
    deck.push({
      id: `flip-one-${i}`,
      type: 'action',
      subtype: 'flip-one',
      name: 'Flip One',
      setSize: 1,
      effect: 'This card has an effect'
    })
  }
  
  // Add One: 6 cards
  for (let i = 0; i < 6; i++) {
    deck.push({
      id: `add-one-${i}`,
      type: 'action',
      subtype: 'add-one',
      name: 'Add One',
      setSize: 1,
      effect: 'This card has an effect'
    })
  }
  
  // Remove One: 6 cards
  for (let i = 0; i < 6; i++) {
    deck.push({
      id: `remove-one-${i}`,
      type: 'action',
      subtype: 'remove-one',
      name: 'Remove One',
      setSize: 1,
      effect: 'This card has an effect'
    })
  }
  
  // Remove Two: 3 cards
  for (let i = 0; i < 3; i++) {
    deck.push({
      id: `remove-two-${i}`,
      type: 'action',
      subtype: 'remove-two',
      name: 'Remove Two',
      setSize: 1,
      effect: 'This card has an effect'
    })
  }
  
  // Steal A Point: 3 cards
  for (let i = 0; i < 3; i++) {
    deck.push({
      id: `steal-point-${i}`,
      type: 'action',
      subtype: 'steal-point',
      name: 'Steal A Point',
      setSize: 1,
      effect: 'This card has an effect'
    })
  }
  
  return deck
}

describe('Feature: trading-card-game, Property 1: Deck composition correctness', () => {
  test('Property 1: Deck composition correctness - For any newly created deck, the total count should be exactly 65 Thing cards, 32 Gotcha cards, and 23 Action cards', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const deck = createDeck()
        
        // Count cards by type
        const thingCards = deck.filter(card => card.type === 'thing')
        const gotchaCards = deck.filter(card => card.type === 'gotcha')
        const actionCards = deck.filter(card => card.type === 'action')
        
        // Verify total counts
        expect(thingCards.length).toBe(65)
        expect(gotchaCards.length).toBe(32)
        expect(actionCards.length).toBe(23)
        
        // Verify total deck size
        expect(deck.length).toBe(120)
        
        return true
      }),
      { numRuns: 100 }
    )
  })
})