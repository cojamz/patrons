# Patrons - A Strategic Worker Placement Game

## 🎯 Overview

Patrons is a fully functional, single HTML file worker placement board game that runs entirely in your browser. Yes, you read that right - the entire game, including React, game logic, multiplayer support, and UI, is contained in one impressive 8000-line HTML file!

## 🎮 Play Now

1. **Local Play**: Simply open `react-game.html` in your browser
2. **Debug Mode**: Add `?debug=true` to the URL for developer tools and logging
3. **Multiplayer**: Enter a room code to play with friends (improved stability as of Jan 2025!)

## 🌟 Features

- **Complete worker placement game** with 3 rounds of strategic gameplay
- **6 unique resource types** with different powers and strategies
- **Shop system** with tiered purchases and victory point conversions
- **Snake draft turn order** based on current victory points
- **Local and multiplayer modes** via Firebase
- **No build process required** - just open and play!

## 📊 Current Status

The game is **fully playable** and feature-complete for local play. We've moved beyond early development into a working product that provides the complete game experience.

### What's Working Well
- ✅ All core game mechanics implemented and tested
- ✅ Complete UI with responsive design
- ✅ All 6 resource types (Red, Yellow, Blue, Purple, Black, Silver) with unique abilities
- ✅ Shop system with proper cost validation
- ✅ Victory point calculation and automatic VP triggers
- ✅ Round progression and game end conditions
- ✅ Debug mode for testing and development
- ✅ Multiplayer connectivity and basic gameplay functions properly

### Recent Improvements (January 10, 2025)
- 🔧 Fixed critical multiplayer synchronization issues
- 🔧 Resolved action space placement bugs that were causing desyncs
- 🔧 Improved state management for multi-player games
- 🔧 Enhanced error handling and recovery in multiplayer mode

### Known Issues (Multiplayer)
- ⚠️ Targeted actions (steal/give) may have minor UI delays in multiplayer
- ⚠️ Occasional visual update lag when multiple players act simultaneously
- ⚠️ Some edge cases in complex multi-player resource exchanges

**Note**: Multiplayer is significantly more stable after today's fixes but still has some known issues. For the best experience, we recommend local play or small multiplayer groups (2-3 players).

For detailed status and technical information, see [CONTEXT_SNAPSHOT_2025_01_10.md](CONTEXT_SNAPSHOT_2025_01_10.md).

## 🛠️ Technical Marvel

This project demonstrates what's possible with modern web technologies:
- **Single HTML file** containing the entire game (no build process!)
- **React without JSX** - pure JavaScript component creation
- **Firebase integration** for real-time multiplayer
- **Complex game state management** in a single reducer
- **~8000 lines of code** in one maintainable file

## 🎲 How to Play

1. **Place Workers**: Take turns placing workers on action spaces
2. **Gain Resources**: Each colored resource has unique actions and benefits
3. **Use Shops**: Spend resources for powerful effects and victory points
4. **Score Points**: Multiple paths to victory through shops, automatic VPs, and resource sets
5. **Win**: Most victory points after 3 rounds wins!

## 🔧 Development

### Quick Start
```bash
# Always backup before making changes
./backup-game.sh

# Open in debug mode for development
open "react-game.html?debug=true"

# Use dev tools for testing
open dev-tools.html
```

### Debug Mode Features
When running with `?debug=true`:
- Full game state logging
- Action testing tools
- VP breakdown display
- Console commands for debugging

### Key Files
- `react-game.html` - The entire game (handle with care!)
- `DEVELOPER_README.md` - Detailed development guide
- `CODE_INDEX.md` - Quick navigation for the 8000-line file
- `IMPLEMENTATION_SPEC.md` - Complete game specification

## 🤝 Contributing

This is a working game! Any changes should preserve existing functionality. Please:
1. Always backup before editing
2. Test thoroughly in debug mode
3. Check multiplayer compatibility
4. Document any changes

## 📝 License

This project is open source and available for learning and enjoyment.

---

*Built with passion, React, and a single HTML file. Because sometimes, simplicity is the ultimate sophistication.*