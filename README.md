# Trading Card Game

A React TypeScript implementation of a trading card game featuring a 10-phase round system with 3-6 players.

## Project Structure

```
src/
├── types/                  # TypeScript interfaces and types
│   └── index.ts           # Core game types (GameState, Player, Card, etc.)
├── components/            # React components
│   └── index.ts          # Component exports
├── game-logic/           # Game logic and business rules
│   └── index.ts         # Game logic exports
├── __tests__/           # Test files
│   ├── components/      # Component tests
│   ├── game-logic/      # Game logic tests
│   └── properties/      # Property-based tests
├── App.tsx              # Main App component
└── index.tsx           # Application entry point
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run tests:
   ```bash
   npm test
   ```

3. Start development server:
   ```bash
   npm start
   ```

## Core Types

The game uses the following core TypeScript interfaces:

- **GameState**: Complete game state including players, phases, and card management
- **Player**: Individual player data (hand, collection, points, etc.)
- **Card**: Base card interface with type, subtype, and properties
- **OfferCard**: Extended card interface for offer mechanics
- **GamePhase**: Enum defining the 10 game phases
- **GameAction**: Union type for all possible game actions

## Testing

The project uses Jest with fast-check for property-based testing:

- **Unit tests**: Specific scenarios and edge cases
- **Property tests**: Universal correctness properties
- **Component tests**: React component behavior

## Development

This project follows the spec-driven development methodology with:

1. **Requirements**: Formal EARS-pattern requirements
2. **Design**: Comprehensive architecture and correctness properties  
3. **Tasks**: Incremental implementation plan
4. **Testing**: Dual unit and property-based testing approach