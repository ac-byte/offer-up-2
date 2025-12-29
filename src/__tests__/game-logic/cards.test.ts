import { createThingCard, createGotchaCard, createActionCard, createDeck, shuffleArray, createShuffledDeck } from '../../game-logic/cards'

describe('Card Factory Functions', () => {
  describe('createThingCard', () => {
    test('creates Giant Thing card with correct properties', () => {
      const card = createThingCard('giant', 0)
      
      expect(card.id).toBe('giant-0')
      expect(card.type).toBe('thing')
      expect(card.subtype).toBe('giant')
      expect(card.name).toBe('Giant Thing')
      expect(card.setSize).toBe(1)
      expect(card.effect).toBeUndefined()
    })

    test('creates Big Thing card with correct properties', () => {
      const card = createThingCard('big', 5)
      
      expect(card.id).toBe('big-5')
      expect(card.type).toBe('thing')
      expect(card.subtype).toBe('big')
      expect(card.name).toBe('Big Thing')
      expect(card.setSize).toBe(2)
    })

    test('creates Medium Thing card with correct properties', () => {
      const card = createThingCard('medium', 10)
      
      expect(card.id).toBe('medium-10')
      expect(card.type).toBe('thing')
      expect(card.subtype).toBe('medium')
      expect(card.name).toBe('Medium Thing')
      expect(card.setSize).toBe(3)
    })

    test('creates Tiny Thing card with correct properties', () => {
      const card = createThingCard('tiny', 15)
      
      expect(card.id).toBe('tiny-15')
      expect(card.type).toBe('thing')
      expect(card.subtype).toBe('tiny')
      expect(card.name).toBe('Tiny Thing')
      expect(card.setSize).toBe(4)
    })
  })

  describe('createGotchaCard', () => {
    test('creates Gotcha Once card with correct properties', () => {
      const card = createGotchaCard('once', 0)
      
      expect(card.id).toBe('gotcha-once-0')
      expect(card.type).toBe('gotcha')
      expect(card.subtype).toBe('once')
      expect(card.name).toBe('Gotcha Once')
      expect(card.setSize).toBe(1)
      expect(card.effect).toBe('This card has an effect')
    })

    test('creates Gotcha Twice card with correct properties', () => {
      const card = createGotchaCard('twice', 3)
      
      expect(card.id).toBe('gotcha-twice-3')
      expect(card.type).toBe('gotcha')
      expect(card.subtype).toBe('twice')
      expect(card.name).toBe('Gotcha Twice')
      expect(card.setSize).toBe(2)
      expect(card.effect).toBe('This card has an effect')
    })

    test('creates Gotcha Bad card with correct properties', () => {
      const card = createGotchaCard('bad', 7)
      
      expect(card.id).toBe('gotcha-bad-7')
      expect(card.type).toBe('gotcha')
      expect(card.subtype).toBe('bad')
      expect(card.name).toBe('Gotcha Bad')
      expect(card.setSize).toBe(3)
      expect(card.effect).toBe('This card has an effect')
    })
  })

  describe('createActionCard', () => {
    test('creates Flip One card with correct properties', () => {
      const card = createActionCard('flip-one', 0)
      
      expect(card.id).toBe('flip-one-0')
      expect(card.type).toBe('action')
      expect(card.subtype).toBe('flip-one')
      expect(card.name).toBe('Flip One')
      expect(card.setSize).toBe(1)
      expect(card.effect).toBe('This card has an effect')
    })

    test('creates Add One card with correct properties', () => {
      const card = createActionCard('add-one', 2)
      
      expect(card.id).toBe('add-one-2')
      expect(card.type).toBe('action')
      expect(card.subtype).toBe('add-one')
      expect(card.name).toBe('Add One')
      expect(card.setSize).toBe(1)
      expect(card.effect).toBe('This card has an effect')
    })

    test('creates Remove One card with correct properties', () => {
      const card = createActionCard('remove-one', 1)
      
      expect(card.id).toBe('remove-one-1')
      expect(card.type).toBe('action')
      expect(card.subtype).toBe('remove-one')
      expect(card.name).toBe('Remove One')
      expect(card.setSize).toBe(1)
      expect(card.effect).toBe('This card has an effect')
    })

    test('creates Remove Two card with correct properties', () => {
      const card = createActionCard('remove-two', 0)
      
      expect(card.id).toBe('remove-two-0')
      expect(card.type).toBe('action')
      expect(card.subtype).toBe('remove-two')
      expect(card.name).toBe('Remove Two')
      expect(card.setSize).toBe(1)
      expect(card.effect).toBe('This card has an effect')
    })

    test('creates Steal A Point card with correct properties', () => {
      const card = createActionCard('steal-point', 1)
      
      expect(card.id).toBe('steal-point-1')
      expect(card.type).toBe('action')
      expect(card.subtype).toBe('steal-point')
      expect(card.name).toBe('Steal A Point')
      expect(card.setSize).toBe(1)
      expect(card.effect).toBe('This card has an effect')
    })
  })

  describe('shuffleArray', () => {
    test('returns array with same length', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      
      expect(shuffled.length).toBe(original.length)
    })

    test('returns array with same elements', () => {
      const original = [1, 2, 3, 4, 5]
      const shuffled = shuffleArray(original)
      
      expect(shuffled.sort()).toEqual(original.sort())
    })

    test('does not mutate original array', () => {
      const original = [1, 2, 3, 4, 5]
      const originalCopy = [...original]
      shuffleArray(original)
      
      expect(original).toEqual(originalCopy)
    })

    test('handles empty array', () => {
      const empty: number[] = []
      const shuffled = shuffleArray(empty)
      
      expect(shuffled).toEqual([])
    })

    test('handles single element array', () => {
      const single = [42]
      const shuffled = shuffleArray(single)
      
      expect(shuffled).toEqual([42])
    })
  })

  describe('createDeck', () => {
    test('creates deck with correct total composition', () => {
      const deck = createDeck()
      
      expect(deck.length).toBe(120)
      
      const thingCards = deck.filter(card => card.type === 'thing')
      const gotchaCards = deck.filter(card => card.type === 'gotcha')
      const actionCards = deck.filter(card => card.type === 'action')
      
      expect(thingCards.length).toBe(65)
      expect(gotchaCards.length).toBe(32)
      expect(actionCards.length).toBe(23)
    })

    test('creates deck with correct Thing card distribution', () => {
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
    })

    test('creates deck with correct Gotcha card distribution', () => {
      const deck = createDeck()
      const gotchaCards = deck.filter(card => card.type === 'gotcha')
      
      const onceCards = gotchaCards.filter(card => card.subtype === 'once')
      const twiceCards = gotchaCards.filter(card => card.subtype === 'twice')
      const badCards = gotchaCards.filter(card => card.subtype === 'bad')
      
      expect(onceCards.length).toBe(10)
      expect(twiceCards.length).toBe(10)
      expect(badCards.length).toBe(12)
    })

    test('creates deck with correct Action card distribution', () => {
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
    })

    test('creates cards with unique IDs', () => {
      const deck = createDeck()
      const ids = deck.map(card => card.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(deck.length)
    })
  })

  describe('createShuffledDeck', () => {
    test('creates shuffled deck with correct composition', () => {
      const deck = createShuffledDeck()
      
      expect(deck.length).toBe(120)
      
      const thingCards = deck.filter(card => card.type === 'thing')
      const gotchaCards = deck.filter(card => card.type === 'gotcha')
      const actionCards = deck.filter(card => card.type === 'action')
      
      expect(thingCards.length).toBe(65)
      expect(gotchaCards.length).toBe(32)
      expect(actionCards.length).toBe(23)
    })

    test('creates different order than unshuffled deck (probabilistic)', () => {
      const originalDeck = createDeck()
      const shuffledDeck = createShuffledDeck()
      
      // It's extremely unlikely that a shuffled deck would be in the same order
      // We'll check that at least some cards are in different positions
      let differentPositions = 0
      for (let i = 0; i < Math.min(10, originalDeck.length); i++) {
        if (originalDeck[i].id !== shuffledDeck[i].id) {
          differentPositions++
        }
      }
      
      // Expect at least some cards to be in different positions
      expect(differentPositions).toBeGreaterThan(0)
    })
  })
})