# Patrons Developer Guide

**Last Updated**: November 15, 2025
**Version**: v0.5 (Vite/React Architecture)

---

## 🚀 Quick Start

### First Time Setup
```bash
# Clone the repository
git clone https://github.com/cojamz/patrons.git
cd patrons

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Development Workflow
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Run tests with UI
```

---

## 📁 Project Structure

```
Patrons/
├── src/
│   ├── App.jsx              # Main game component (~7,778 lines)
│   ├── main.jsx             # Application entry point
│   ├── index.css            # Global styles
│   ├── state/
│   │   └── gameReducer.js   # Game state management and reducer
│   ├── data/
│   │   ├── allGameLayers.js # Action definitions for all 8 colors
│   │   ├── shopData.js      # Shop definitions
│   │   └── constants.js     # Game constants
│   ├── firebase-compat.js   # Firebase configuration
│   └── test/
│       ├── setup.js         # Test configuration
│       └── game.test.js     # Game tests
├── public/                  # Static assets
├── archive/                 # Historical v0 files
├── dist/                    # Build output (generated)
├── index.html               # HTML entry point
├── package.json             # Dependencies and scripts
├── vite.config.js           # Vite configuration
├── vitest.config.js         # Test configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── DEVELOPER_GUIDE.md       # This file
├── CODE_NAVIGATION.md       # Detailed code navigation
├── IMPLEMENTATION_SPEC.md   # Game rules specification
└── CLAUDE.md                # AI-assisted development guide
```

---

## 🏗️ Architecture Overview

### Technology Stack
- **React 18** - UI framework with hooks
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Firebase Realtime Database** - Multiplayer sync
- **Vitest** - Testing framework
- **JSX** - Component syntax

### State Management
The game uses React's `useReducer` hook for state management. All game state lives in a single reducer with clearly defined actions.

**Location**: `src/state/gameReducer.js`

**Key Actions**:
- `PLACE_WORKER` - Place a worker on an action space
- `UPDATE_RESOURCES` - Update player resources
- `PURCHASE_SHOP` - Buy from a shop
- `END_TURN` - End current player's turn
- `ADVANCE_ROUND` - Move to next round
- `SYNC_GAME_STATE` - Sync state from Firebase

### Component Structure
The app is primarily a single large component (`App.jsx`) with embedded sub-components:
- `PlayerCard` - Shows player resources, VP, workers
- `GameLayer` - Displays action spaces for each color
- `ActionSpace` - Individual action button
- `CompactShop` - Shop display and purchase
- `CompactVictoryShop` - Victory point shop
- Modals (GemSelection, PlayerChoice, RoundTransition)

---

## 🎮 Game Mechanics Implementation

### Resource Types (8 Colors)
Each color is defined in `src/data/allGameLayers.js`:

- **Red** - Worker manipulation (swap, repeat actions)
- **Yellow** - Resource manipulation (gain, steal, trade)
- **Blue** - Shop control (toggle, reduce costs)
- **Purple** - Timing (extra turns, skip, multiple workers)
- **Gold** - Trade flexibility (accepts any color)
- **White** - Victory point trading
- **Black** - Aggressive actions (steal workers/VP)
- **Silver** - End-round bonuses

### Action Execution Flow
1. User clicks action space
2. `handleActionClick()` validates placement
3. `PLACE_WORKER` action dispatched to reducer
4. `executeAction()` processes the action effect
5. Resources/VP updated
6. Modals shown if needed (gem selection, player choice)
7. Firebase sync (in multiplayer)

**Key Functions** (in `App.jsx`):
- `handleActionClick()` - Action space click handler
- `executeAction()` - Executes action effects
- `canPlaceWorker()` - Validates worker placement
- `endTurn()` - Handles turn ending

### Shop System
Shops are defined in `src/data/shopData.js`:

```javascript
{
  color: 'red',
  round: 1,
  cost: { red: 2, any: 1 },
  benefit: 'gainResource',
  benefitParams: { resources: { red: 3 } }
}
```

**Shop Purchase Flow**:
1. User clicks shop button
2. Cost validation checks player resources
3. Gem selection modal (if needed for "any" cost)
4. `PURCHASE_SHOP` action dispatched
5. Resources deducted
6. Shop benefit applied
7. Shop marked as purchased

**Key Functions**:
- `handleShopClick()` - Shop click handler
- `executeShopBenefit()` - Applies shop effect
- `showGemSelection()` - Shows gem selection modal

### Multiplayer Sync
Firebase Realtime Database syncs game state across players.

**Key Mechanisms**:
- `syncGameState()` - Debounced sync to Firebase (200ms)
- `SYNC_GAME_STATE` action - Merges incoming state
- Timestamp deduplication prevents echo loops
- `lastUpdatedBy` field prevents self-updates

**Configuration**: `src/firebase-compat.js`

---

## 🔍 Finding Code

Use `CODE_NAVIGATION.md` for detailed line numbers and locations.

### Common Tasks

**Add a new action**:
1. Define in `src/data/allGameLayers.js`
2. Implement effect in `App.jsx` `executeAction()`
3. Add test in `src/test/game.test.js`

**Add a new shop**:
1. Define in `src/data/shopData.js`
2. Implement benefit in `App.jsx` `executeShopBenefit()`
3. Test purchase flow

**Modify game state**:
1. Edit reducer in `src/state/gameReducer.js`
2. Ensure multiplayer sync handles change
3. Test with multiple players

**Fix a bug**:
1. Check `IMPLEMENTATION_SPEC.md` for game rules
2. Search `App.jsx` for relevant function
3. Add test case reproducing bug
4. Fix and verify test passes

---

## 🧪 Testing

### Running Tests
```bash
npm run test          # Run all tests
npm run test:ui       # Visual test UI
npm run test -- -t "test name"  # Run specific test
```

### Writing Tests
Tests use Vitest and React Testing Library.

**Example**:
```javascript
import { render, screen } from '@testing-library/react';
import App from '../App';

test('game renders with 4 players', () => {
  render(<App />);
  expect(screen.getByText(/Player 1/)).toBeInTheDocument();
});
```

### Testing Strategy
- **Unit tests**: Test individual functions (reducer actions)
- **Integration tests**: Test game flows (place worker → gain resources)
- **Manual testing**: Test UI and multiplayer in browser

### Common Test Patterns
```javascript
// Test reducer action
const newState = gameReducer(initialState, {
  type: 'UPDATE_RESOURCES',
  playerId: 0,
  resources: { red: 5 }
});
expect(newState.players[0].resources.red).toBe(5);
```

---

## 🐛 Debugging

### Development Tools
- **React DevTools**: Inspect component state
- **Vite HMR**: Hot module reload preserves state
- **Console logs**: Strategic logging in key functions
- **Firebase Console**: View real-time database

### Common Issues

**Issue**: State not updating
- Check reducer is returning new state (not mutating)
- Verify action is dispatched correctly
- Check Firebase sync isn't overwriting changes

**Issue**: Multiplayer desync
- Check `lastUpdatedBy` field
- Verify timestamp is updating
- Check Firebase rules allow reads/writes
- Look for echo loops (self-updates)

**Issue**: Build fails
- Check for JSX syntax errors
- Verify all imports exist
- Run `npm install` to ensure dependencies

**Issue**: Tests failing
- Check test setup in `src/test/setup.js`
- Verify mock data matches game structure
- Check for async timing issues

---

## 📝 Code Style & Conventions

### React Patterns
```javascript
// Functional components with hooks
function MyComponent() {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return <div>...</div>;
}
```

### State Updates
```javascript
// Always return new state in reducer
case 'UPDATE_RESOURCES':
  return {
    ...state,
    players: state.players.map((p, i) =>
      i === action.playerId
        ? { ...p, resources: { ...p.resources, ...action.resources } }
        : p
    )
  };
```

### Naming Conventions
- Components: PascalCase (`PlayerCard`)
- Functions: camelCase (`handleClick`)
- Constants: UPPER_SNAKE_CASE (`MAX_PLAYERS`)
- Files: camelCase or kebab-case

---

## 🚀 Deployment

### Building for Production
```bash
npm run build
```

Output in `dist/` directory.

### Deploy to Netlify
```bash
# Build
npm run build

# Deploy (if netlify CLI installed)
netlify deploy --prod
```

Or connect GitHub repo to Netlify for automatic deploys.

### Firebase Configuration
Ensure `.env` file has Firebase credentials:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_PROJECT_ID=...
```

**Note**: `.env` is gitignored for security.

---

## 📚 Key Documentation

- **IMPLEMENTATION_SPEC.md** - Complete game rules and mechanics
- **CODE_NAVIGATION.md** - Detailed code location guide
- **CLAUDE.md** - AI-assisted development workflow
- **COMPLEX_INTERACTIONS.md** - Edge cases and complex game interactions
- **archive/v0-docs/** - Historical v0 documentation

---

## 🤝 Contributing Guidelines

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Make changes**: Edit code, add tests
3. **Test locally**: `npm run dev` and `npm run test`
4. **Test multiplayer**: Open two browser windows
5. **Commit**: Clear, descriptive commit messages
6. **Push**: `git push origin feature/my-feature`
7. **Create PR**: Document changes and testing

### Before Committing
- [ ] Code runs without errors
- [ ] Tests pass (`npm run test`)
- [ ] Multiplayer still works
- [ ] No console errors
- [ ] Game rules preserved

---

## 🎓 Learning Resources

### Understanding the Codebase
1. Start with `README.md` - Project overview
2. Read `IMPLEMENTATION_SPEC.md` - Game rules
3. Review `CODE_NAVIGATION.md` - Code structure
4. Explore `src/App.jsx` - Main component
5. Study `src/state/gameReducer.js` - State management

### React Concepts Used
- Hooks (`useState`, `useReducer`, `useEffect`, `useCallback`)
- Component composition
- Event handling
- Conditional rendering
- Lists and keys

### Vite Features
- Hot Module Replacement (HMR)
- Fast builds with esbuild
- Environment variables
- CSS processing

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill
```

### Firebase Connection Issues
- Check Firebase console for database rules
- Verify environment variables in `.env`
- Check network connectivity

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

---

## 📞 Need Help?

- **Bug Reports**: Create GitHub issue
- **Questions**: Check existing documentation first
- **AI Assistance**: See `CLAUDE.md` for AI-assisted development workflow

---

*Happy coding! May your workers be plentiful and your victory points abundant!* 🎲
