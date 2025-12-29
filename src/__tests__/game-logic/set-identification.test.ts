import { identifyGotchaSets, identifyThingSets } from '../../game-logic/cards'
import { Card } from '../../types'

describe('Set Identification', () => {
  describe('identifyGotchaSets', () => {
    it('identifies complete Gotcha Once sets (1 card each)', () => {
      const collection: Card[] = [
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1, effect: 'This card has an effect' },
        { id: 'gotcha-once-2', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1, effect: 'This card has an effect' },
        { id: 'thing-giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]

      const sets = identifyGotchaSets(collection)
      
      expect(sets).toHaveLength(2)
      expect(sets[0]).toHaveLength(1)
      expect(sets[1]).toHaveLength(1)
      expect(sets[0][0].subtype).toBe('once')
      expect(sets[1][0].subtype).toBe('once')
    })

    it('identifies complete Gotcha Twice sets (2 cards each)', () => {
      const collection: Card[] = [
        { id: 'gotcha-twice-1', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-twice-2', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-twice-3', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' }
      ]

      const sets = identifyGotchaSets(collection)
      
      expect(sets).toHaveLength(1) // Only one complete set of 2 cards
      expect(sets[0]).toHaveLength(2)
      expect(sets[0][0].subtype).toBe('twice')
      expect(sets[0][1].subtype).toBe('twice')
    })

    it('identifies complete Gotcha Bad sets (3 cards each)', () => {
      const collection: Card[] = [
        { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-3', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-4', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' }
      ]

      const sets = identifyGotchaSets(collection)
      
      expect(sets).toHaveLength(1) // Only one complete set of 3 cards
      expect(sets[0]).toHaveLength(3)
      expect(sets[0][0].subtype).toBe('bad')
      expect(sets[0][1].subtype).toBe('bad')
      expect(sets[0][2].subtype).toBe('bad')
    })

    it('returns empty array when no complete sets exist', () => {
      const collection: Card[] = [
        { id: 'gotcha-twice-1', type: 'gotcha', subtype: 'twice', name: 'Gotcha Twice', setSize: 2, effect: 'This card has an effect' },
        { id: 'gotcha-bad-1', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' },
        { id: 'gotcha-bad-2', type: 'gotcha', subtype: 'bad', name: 'Gotcha Bad', setSize: 3, effect: 'This card has an effect' }
      ]

      const sets = identifyGotchaSets(collection)
      
      expect(sets).toHaveLength(0)
    })

    it('ignores non-Gotcha cards', () => {
      const collection: Card[] = [
        { id: 'thing-giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'action-flip-1', type: 'action', subtype: 'flip-one', name: 'Flip One', setSize: 1, effect: 'This card has an effect' },
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1, effect: 'This card has an effect' }
      ]

      const sets = identifyGotchaSets(collection)
      
      expect(sets).toHaveLength(1)
      expect(sets[0]).toHaveLength(1)
      expect(sets[0][0].type).toBe('gotcha')
    })
  })

  describe('identifyThingSets', () => {
    it('identifies complete Giant Thing sets (1 card each)', () => {
      const collection: Card[] = [
        { id: 'giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'giant-2', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'big-1', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]

      const sets = identifyThingSets(collection)
      
      expect(sets).toHaveLength(2)
      expect(sets[0]).toHaveLength(1)
      expect(sets[1]).toHaveLength(1)
      expect(sets[0][0].subtype).toBe('giant')
      expect(sets[1][0].subtype).toBe('giant')
    })

    it('identifies complete Big Thing sets (2 cards each)', () => {
      const collection: Card[] = [
        { id: 'big-1', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'big-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'big-3', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 }
      ]

      const sets = identifyThingSets(collection)
      
      expect(sets).toHaveLength(1) // Only one complete set of 2 cards
      expect(sets[0]).toHaveLength(2)
      expect(sets[0][0].subtype).toBe('big')
      expect(sets[0][1].subtype).toBe('big')
    })

    it('identifies complete Medium Thing sets (3 cards each)', () => {
      const collection: Card[] = [
        { id: 'medium-1', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-2', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-3', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-4', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 }
      ]

      const sets = identifyThingSets(collection)
      
      expect(sets).toHaveLength(1) // Only one complete set of 3 cards
      expect(sets[0]).toHaveLength(3)
      expect(sets[0][0].subtype).toBe('medium')
      expect(sets[0][1].subtype).toBe('medium')
      expect(sets[0][2].subtype).toBe('medium')
    })

    it('identifies complete Tiny Thing sets (4 cards each)', () => {
      const collection: Card[] = [
        { id: 'tiny-1', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 },
        { id: 'tiny-2', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 },
        { id: 'tiny-3', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 },
        { id: 'tiny-4', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 },
        { id: 'tiny-5', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 }
      ]

      const sets = identifyThingSets(collection)
      
      expect(sets).toHaveLength(1) // Only one complete set of 4 cards
      expect(sets[0]).toHaveLength(4)
      expect(sets[0][0].subtype).toBe('tiny')
      expect(sets[0][1].subtype).toBe('tiny')
      expect(sets[0][2].subtype).toBe('tiny')
      expect(sets[0][3].subtype).toBe('tiny')
    })

    it('returns empty array when no complete sets exist', () => {
      const collection: Card[] = [
        { id: 'big-1', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'medium-1', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-2', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'tiny-1', type: 'thing', subtype: 'tiny', name: 'Tiny Thing', setSize: 4 }
      ]

      const sets = identifyThingSets(collection)
      
      expect(sets).toHaveLength(0)
    })

    it('ignores non-Thing cards', () => {
      const collection: Card[] = [
        { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 1, effect: 'This card has an effect' },
        { id: 'action-flip-1', type: 'action', subtype: 'flip-one', name: 'Flip One', setSize: 1, effect: 'This card has an effect' },
        { id: 'giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 }
      ]

      const sets = identifyThingSets(collection)
      
      expect(sets).toHaveLength(1)
      expect(sets[0]).toHaveLength(1)
      expect(sets[0][0].type).toBe('thing')
    })

    it('identifies multiple different complete sets', () => {
      const collection: Card[] = [
        // 2 Giant sets
        { id: 'giant-1', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        { id: 'giant-2', type: 'thing', subtype: 'giant', name: 'Giant Thing', setSize: 1 },
        // 1 Big set
        { id: 'big-1', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        { id: 'big-2', type: 'thing', subtype: 'big', name: 'Big Thing', setSize: 2 },
        // 1 Medium set
        { id: 'medium-1', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-2', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 },
        { id: 'medium-3', type: 'thing', subtype: 'medium', name: 'Medium Thing', setSize: 3 }
      ]

      const sets = identifyThingSets(collection)
      
      expect(sets).toHaveLength(4) // 2 Giant + 1 Big + 1 Medium
      
      // Count sets by subtype
      const giantSets = sets.filter(set => set[0].subtype === 'giant')
      const bigSets = sets.filter(set => set[0].subtype === 'big')
      const mediumSets = sets.filter(set => set[0].subtype === 'medium')
      
      expect(giantSets).toHaveLength(2)
      expect(bigSets).toHaveLength(1)
      expect(mediumSets).toHaveLength(1)
    })
  })
})