import * as fc from 'fast-check'
import { Card } from '../../types'
import { createDeck, createShuffledDeck, shuffleArray, createThingCard, createGotchaCard, createActionCard } from '../../game-logic/cards'

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

describe('Feature: trading-card-game, Property 2: Thing card distribution', () => {
  test('Property 2: Thing card distribution - For any newly created deck, Thing cards should contain exactly 4 Giant, 16 Big, 25 Medium, and 20 Tiny cards', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const deck = createDeck()
        const thingCards = deck.filter(card => card.type === 'thing')
        
        const giantCards = thingCards.filter(card => card.subtype === 'giant')
        const bigCards = thingCards.filter(card => card.subtype === 'big')
        const mediumCards = thingCards.filter(card => card.subtype === 'medium')
        const tinyCards = thingCards.filter(card => card.subtype === 'tiny')
        
        expect(giantCards.length).toBe(4)
        expect(bigCards.length).toBe(16)
        expect(mediumCards.length).toBe(25)
        expect(tinyCards.length).toBe(20)
        
        // Verify each card has correct properties
        giantCards.forEach(card => {
          expect(card.name).toBe('Giant Thing')
          expect(card.setSize).toBe(1)
        })
        
        bigCards.forEach(card => {
          expect(card.name).toBe('Big Thing')
          expect(card.setSize).toBe(2)
        })
        
        mediumCards.forEach(card => {
          expect(card.name).toBe('Medium Thing')
          expect(card.setSize).toBe(3)
        })
        
        tinyCards.forEach(card => {
          expect(card.name).toBe('Tiny Thing')
          expect(card.setSize).toBe(4)
        })
        
        return true
      }),
      { numRuns: 100 }
    )
  })
})

describe('Feature: trading-card-game, Property 3: Gotcha card distribution', () => {
  test('Property 3: Gotcha card distribution - For any newly created deck, Gotcha cards should contain exactly 10 Once, 10 Twice, and 12 Bad cards', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const deck = createDeck()
        const gotchaCards = deck.filter(card => card.type === 'gotcha')
        
        const onceCards = gotchaCards.filter(card => card.subtype === 'once')
        const twiceCards = gotchaCards.filter(card => card.subtype === 'twice')
        const badCards = gotchaCards.filter(card => card.subtype === 'bad')
        
        expect(onceCards.length).toBe(10)
        expect(twiceCards.length).toBe(10)
        expect(badCards.length).toBe(12)
        
        // Verify each card has correct properties
        onceCards.forEach(card => {
          expect(card.name).toBe('Gotcha Once')
          expect(card.setSize).toBe(2)
          expect(card.effect).toBe('This card has an effect')
        })
        
        twiceCards.forEach(card => {
          expect(card.name).toBe('Gotcha Twice')
          expect(card.setSize).toBe(2)
          expect(card.effect).toBe('This card has an effect')
        })
        
        badCards.forEach(card => {
          expect(card.name).toBe('Gotcha Bad')
          expect(card.setSize).toBe(3)
          expect(card.effect).toBe('This card has an effect')
        })
        
        return true
      }),
      { numRuns: 100 }
    )
  })
})

describe('Feature: trading-card-game, Property 4: Action card distribution', () => {
  test('Property 4: Action card distribution - For any newly created deck, Action cards should contain exactly 5 Flip One, 6 Add One, 6 Remove One, 3 Remove Two, and 3 Steal A Point cards', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const deck = createDeck()
        const actionCards = deck.filter(card => card.type === 'action')
        
        const flipOneCards = actionCards.filter(card => card.subtype === 'flip-one')
        const addOneCards = actionCards.filter(card => card.subtype === 'add-one')
        const removeOneCards = actionCards.filter(card => card.subtype === 'remove-one')
        const removeTwoCards = actionCards.filter(card => card.subtype === 'remove-two')
        const stealPointCards = actionCards.filter(card => card.subtype === 'steal-point')
        
        expect(flipOneCards.length).toBe(5)
        expect(addOneCards.length).toBe(6)
        expect(removeOneCards.length).toBe(6)
        expect(removeTwoCards.length).toBe(3)
        expect(stealPointCards.length).toBe(3)
        
        // Verify each card has correct properties
        flipOneCards.forEach(card => {
          expect(card.name).toBe('Flip One')
          expect(card.setSize).toBe(1)
          expect(card.effect).toBe('This card has an effect')
        })
        
        addOneCards.forEach(card => {
          expect(card.name).toBe('Add One')
          expect(card.setSize).toBe(1)
          expect(card.effect).toBe('This card has an effect')
        })
        
        removeOneCards.forEach(card => {
          expect(card.name).toBe('Remove One')
          expect(card.setSize).toBe(1)
          expect(card.effect).toBe('This card has an effect')
        })
        
        removeTwoCards.forEach(card => {
          expect(card.name).toBe('Remove Two')
          expect(card.setSize).toBe(1)
          expect(card.effect).toBe('This card has an effect')
        })
        
        stealPointCards.forEach(card => {
          expect(card.name).toBe('Steal A Point')
          expect(card.setSize).toBe(1)
          expect(card.effect).toBe('This card has an effect')
        })
        
        return true
      }),
      { numRuns: 100 }
    )
  })
})

describe('Feature: trading-card-game, Property 5: Deck shuffling', () => {
  test('Property 5: Deck shuffling - For any two newly created and shuffled decks, they should have different card orders (with high probability)', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const deck1 = createShuffledDeck()
        const deck2 = createShuffledDeck()
        
        // Both decks should have the same composition
        expect(deck1.length).toBe(120)
        expect(deck2.length).toBe(120)
        
        // Count cards by type for both decks
        const deck1Things = deck1.filter(card => card.type === 'thing').length
        const deck1Gotchas = deck1.filter(card => card.type === 'gotcha').length
        const deck1Actions = deck1.filter(card => card.type === 'action').length
        
        const deck2Things = deck2.filter(card => card.type === 'thing').length
        const deck2Gotchas = deck2.filter(card => card.type === 'gotcha').length
        const deck2Actions = deck2.filter(card => card.type === 'action').length
        
        expect(deck1Things).toBe(65)
        expect(deck1Gotchas).toBe(32)
        expect(deck1Actions).toBe(23)
        
        expect(deck2Things).toBe(65)
        expect(deck2Gotchas).toBe(32)
        expect(deck2Actions).toBe(23)
        
        // Check that the decks have different orders (probabilistic test)
        // It's extremely unlikely that two shuffled decks would be identical
        let differentPositions = 0
        for (let i = 0; i < Math.min(20, deck1.length); i++) {
          if (deck1[i].id !== deck2[i].id) {
            differentPositions++
          }
        }
        
        // Expect at least some cards to be in different positions
        // With proper shuffling, this should almost always be true
        expect(differentPositions).toBeGreaterThan(0)
        
        return true
      }),
      { numRuns: 100 }
    )
  })
})