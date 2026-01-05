# Offer Up - An online trading card game

A complete digital implementation of a trading card game for 3-6 players featuring trades based on hidden information. Play locally with friends or online in multiplayer mode.

## Features

- **Single Screen Mode**: Displays all players on the same screen, used for testing and play testing mechanics if you don't mind seeing each others cards.
- **Multiplayer Mode**: Play with friends online in real-time
- **Interactive Gameplay**: Click-to-play interface with visual feedback
- **Complete Game Logic**: Includes making offers, disclosure, special actions, and cards with positive and negative effects.
- **Responsive Design**: Works on desktop and mobile devices (technically... I wouldn't play it on my phone)
- **Real-time Updates**: Live game state synchronization in multiplayer

## Getting Started

### For Non-Technical Users (Easy Setup)

**What You'll Need:**
- A computer with internet connection
- About 10 minutes for setup

**Step-by-Step Instructions:**

1. **Install Node.js** (the engine that runs the game):
   - Go to [nodejs.org](https://nodejs.org)
   - Download the "LTS" version (recommended for most users)
   - Run the installer and follow the prompts
   - When finished, restart your computer

2. **Download the Game**:
   - Click the green "Code" button at the top of this page
   - Select "Download ZIP"
   - Extract the ZIP file to your Desktop or Documents folder

3. **Open Command Prompt/Terminal**:
   - **Windows**: Press Windows key + R, type `cmd`, press Enter
   - **Mac**: Press Cmd + Space, type `terminal`, press Enter
   - **Linux**: Press Ctrl + Alt + T

4. **Navigate to the Game Folder**:
   - Type: `cd ` (with a space after cd)
   - Drag the extracted game folder into the command window
   - Press Enter

5. **Install Game Dependencies**:
   - Type: `npm install`
   - Press Enter and wait (this may take a few minutes)

6. **Start the Game**:
   - Type: `npm start`
   - Press Enter
   - Your web browser should automatically open to the game
   - If not, go to: http://localhost:3001

7. **For Multiplayer** (optional):
   - Open a second command prompt/terminal
   - Navigate to the game folder again (step 4)
   - Type: `cd server`
   - Type: `npm install`
   - Type: `npm run dev`
   - The multiplayer server will start on http://localhost:3000

**Troubleshooting:**
- If you get "command not found" errors, restart your computer after installing Node.js
- If the game doesn't open automatically, manually go to http://localhost:3001 in your browser
- Make sure no other programs are using ports 3000 or 3001

### For Developers

**Client (Game Interface):**
```bash
npm install
npm start
```
Game runs on http://localhost:3001

**Server (Multiplayer Backend):**
```bash
cd server
npm install
npm run dev
```
Server runs on http://localhost:3000

**Run Tests:**
```bash
npm test
```

## How to Play

### Game Overview
This is a multi-phase trading card game where players collect sets of cards to score points. Each round consists of multiple phases where players draw cards, make offers, and complete various actions.

### Basic Gameplay
1. **Choose Game Mode**: Single player (practice) or Multiplayer (with friends)
2. **Set Up Players**: Enter player names and choose how many people are playing (3-6)
3. **Play Through Phases**: The game guides you through each phase automatically
4. **Make Offers**: Click cards in your hand to create offers for other players
5. **Buy and Sell**: Purchase offers from other players or sell your own
6. **Complete Actions**: Use action cards and complete special objectives
7. **Score Points**: Collect sets and complete objectives to win

### Controls
- **Click cards** to select them
- **Use buttons** to confirm actions
- **Follow the prompts** - the game tells you what to do next
- **Check the phase indicator** to see what's happening

## Project Structure

```
├── src/                    # Client-side React application
│   ├── components/         # React components (game interface)
│   ├── game-logic/        # Client-side game logic
│   ├── types/             # TypeScript type definitions
│   └── services/          # API communication
├── server/                # Multiplayer server
│   ├── src/               # Server-side game logic
│   └── game-logic/        # Shared game rules
├── public/                # Static web assets
└── build/                 # Production build files
```

## Licensing

This project uses a dual licensing model:

- **Free for Personal Use**: Licensed under AGPL v3 for playtesting, learning, and non-commercial use
- **Commercial License Available**: For commercial use, proprietary applications, or if you prefer not to comply with AGPL requirements

See [README-LICENSING.md](README-LICENSING.md) for complete licensing information.

## Technical Details

### Core Technologies
- **Frontend**: React with TypeScript
- **Backend**: Node.js with Express
- **Real-time Communication**: Server-Sent Events (SSE)
- **Testing**: Jest with property-based testing (fast-check)
- **Build System**: Create React App

### Architecture
The game uses the following core TypeScript interfaces:

- **GameState**: Complete game state including players, phases, and card management
- **Player**: Individual player data (hand, collection, points, etc.)
- **Card**: Base card interface with type, subtype, and properties
- **GamePhase**: Enum defining the 10 game phases
- **GameAction**: Union type for all possible game actions

### Testing Strategy
The project uses comprehensive testing with:

- **Unit Tests**: Specific scenarios and edge cases
- **Property-Based Tests**: Universal correctness properties using fast-check
- **Component Tests**: React component behavior and integration
- **Game Logic Tests**: Complete game flow validation

### Development Methodology
This project follows spec-driven development with:

1. **Requirements**: Formal EARS-pattern requirements documentation
2. **Design**: Comprehensive architecture and correctness properties  
3. **Tasks**: Incremental implementation planning
4. **Testing**: Dual unit and property-based testing approach

## Contributing

This is currently a personal project, but feedback and suggestions are welcome! Please note the licensing terms if you're interested in contributing or using this code.

## Support

For questions about gameplay, setup issues, or licensing inquiries, please open an issue on this repository.