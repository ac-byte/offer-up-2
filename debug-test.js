// Quick debug test
const { identifyGotchaSetsInOrder } = require('./src/game-logic/cards.ts');

const collection = [
  { id: 'gotcha-once-1', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' },
  { id: 'gotcha-once-2', type: 'gotcha', subtype: 'once', name: 'Gotcha Once', setSize: 2, effect: 'This card has an effect' }
];

console.log('Collection:', collection);
const sets = identifyGotchaSetsInOrder(collection);
console.log('Identified sets:', sets);