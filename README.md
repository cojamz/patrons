# Patrons - A Strategic Worker Placement Game

## 🎯 Overview

Patrons is a fully functional worker placement board game built with modern React and Vite. Play solo or with friends in real-time multiplayer, featuring 8 unique resource types, strategic worker placement, and a dynamic shop system across 3 rounds of gameplay.

*Originally built as a single 9,459-line HTML file (now archived), Patrons has evolved into a modern React application with proper tooling and modular architecture.*

## 🎮 Play Now

### Development Mode
```bash
npm install
npm run dev
```
Then open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

### Multiplayer
Enter a room code to play with friends in real-time. Multiplayer support via Firebase Realtime Database.

## 🌟 Features

- **Complete worker placement game** with 3 rounds of strategic gameplay
- **8 unique resource types** with different powers and strategies
- **Shop system** with tiered purchases and victory point conversions
- **Snake draft turn order** based on current victory points
- **Local and multiplayer modes** via Firebase
- **No build process required** - just open and play!

## 📊 Current Status

The game is **fully playable** and feature-complete for local play. We've moved beyond early development into a working product that provides the complete game experience.

### What's Working Well
- ✅ All core game mechanics implemented and tested
- ✅ Complete UI with responsive design
- ✅ All 8 resource types (Red, Yellow, Blue, Purple, Gold, White, Black, Silver) with unique abilities
- ✅ Shop system with proper cost validation
- ✅ Victory point calculation and automatic VP triggers
- ✅ Round progression and game end conditions
- ✅ Debug mode for testing and development
- ✅ Multiplayer connectivity and basic gameplay functions properly

### Recent Improvements (January 12, 2025)
- 🔧 Fixed shop cost modifier display to show only on affected player's card
- 🔧 Fixed "Play 2 more workers" effect persisting correctly when workers run out
- 🔧 Fixed screen layout shift when modals open with dynamic scrollbar compensation
- 🔧 Improved multiplayer synchronization with timestamp deduplication
- 🔧 Enhanced worker placement validation and effect management

### Known Issues (Multiplayer)
- ⚠️ Targeted actions (steal/give) may have minor UI delays in multiplayer
- ⚠️ Occasional visual update lag when multiple players act simultaneously
- ⚠️ Some edge cases in complex multi-player resource exchanges

**Note**: Multiplayer is significantly more stable after recent fixes but still has some known issues. For the best experience, we recommend local play or small multiplayer groups (2-3 players).

For detailed development information, see [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md).

## 🛠️ Technical Stack

Built with modern web technologies:
- **React 18** with JSX for component creation
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for styling
- **Firebase Realtime Database** for multiplayer
- **Vitest** for testing
- **Complex game state management** with useReducer

## 🎲 How to Play

1. **Place Workers**: Take turns placing workers on action spaces
2. **Gain Resources**: Each colored resource has unique actions and benefits
3. **Use Shops**: Spend resources for powerful effects and victory points
4. **Score Points**: Multiple paths to victory through shops, automatic VPs, and resource sets
5. **Win**: Most victory points after 3 rounds wins!

## 🔧 Development

### Project Structure
```
src/
├── App.jsx              # Main game component (~7,778 lines)
├── main.jsx             # Application entry point
├── state/
│   └── gameReducer.js   # Game state management
├── data/
│   ├── allGameLayers.js # Action definitions
│   ├── shopData.js      # Shop definitions
│   └── constants.js     # Game constants
├── firebase-compat.js   # Firebase configuration
└── test/                # Test files
```

### Development Commands
```bash
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Run tests with UI
```

### Key Files
- `DEVELOPER_GUIDE.md` - Comprehensive development guide
- `CODE_NAVIGATION.md` - File structure and navigation
- `IMPLEMENTATION_SPEC.md` - Complete game specification
- `CLAUDE.md` - AI-assisted development guide

## 🤝 Contributing

This is a working game! Any changes should preserve existing functionality. Please:
1. Create a feature branch for changes
2. Test thoroughly with `npm run dev`
3. Run tests with `npm run test`
4. Check multiplayer compatibility
5. Document any changes

## 📚 Historical Note

Patrons began as an experimental single-file HTML application (9,459 lines!) demonstrating what's possible without a build process. The original v0 implementation is preserved in `archive/v0-monolith/` for historical reference. The project successfully migrated to a modern architecture in November 2025 while preserving all game functionality.

## 📝 License

This project is open source and available for learning and enjoyment.

---

*Built with passion, React, and a single HTML file. Because sometimes, simplicity is the ultimate sophistication.*