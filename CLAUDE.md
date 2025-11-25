# Patrons - Worker Placement Game (v0.5)

## Critical Game Rules (Never Forget)
1. **Force Red Placement**: Affects OTHER players, not the placer (+1 red to placer)
2. **Shop Cost Modifiers**: PER-PLAYER (`player.shopCostModifier`), NOT global
3. **Repeat Actions**: Cannot repeat other repeat/swap actions (prevents infinite loops)
4. **Play More Workers Effect**: Only clears when `workersToPlace === 0`
5. **Gold Shops**: Accept ANY resource as ⭐ payment
6. **Blue Auto VP**: Shop user gets +1 VP when using a shop (solo benefit, NOT cooperative)

## Project Info
- Modern Vite/React project (v0.5)
- Main component: src/App.jsx (~7,778 lines)
- React 18 with JSX
- Firebase for multiplayer
- 8 resource types, 3 rounds, 2-4 players
- Tailwind CSS for styling

## File Navigation
- Game state & reducer: src/state/gameReducer.js
- Action definitions: src/data/allGameLayers.js
- Shop definitions: src/data/shopData.js
- Main component: src/App.jsx
- Firebase config: src/firebase-compat.js
- Tests: src/test/
- See CODE_NAVIGATION.md for detailed navigation
- See DEVELOPER_GUIDE.md for comprehensive guide

## Development Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run test         # Run tests
npm run preview      # Preview build
```

## Current Work
Working on: [UPDATE THIS EACH SESSION]
Files in play: [LIST FILES]
Status: [WHAT'S DONE, WHAT'S NEXT]

## The 4-Phase Workflow (ALWAYS Follow This)

### 1. EXPLORE (I learn the code)
User: "I want to add X. Don't code yet - explore the relevant code first."
- I read files, understand patterns
- I identify dependencies and edge cases

### 2. PLAN (I think deeply)
User: "Create a plan. Think harder."
- I create step-by-step implementation plan
- I flag potential issues
- You review and approve (or adjust)

### 3. CODE (Small incremental changes)
User: "Approved. Do step 1 only."
- I implement ONE step at a time
- You verify each step before continuing
- Never batch multiple steps

### 4. TEST (Verify it works)
User: "Run tests. If they pass, commit."
- Tests confirm behavior
- Manual testing for UI/UX
- Commit with clear message

## Key Phrases That Control Me

**Make me think deeper:**
- `"Think harder"` → 30-60 seconds of deep reasoning
- `"Think hard"` → 15-30 seconds
- `"ultrathink"` → Maximum depth for complex problems

**Keep me focused:**
- `"Don't code yet"` → Prevents premature implementation
- `"Do step 1 ONLY"` → Stops me from doing too much
- `"Explore [X] first"` → Makes me read before changing

**Use specialized help:**
- `"Use a subagent to explore [X]"` → Deep dive without cluttering context
- `"Use the Explore agent"` → Fast codebase exploration

## Context Management

**When to use /clear:**
- ✅ After completing a major feature
- ✅ Before starting unrelated work
- ✅ When I start "forgetting" core rules
- ❌ In the middle of a feature
- ❌ Right after explaining complex requirements

**After using /clear:**
```
User: "Run /start to reload context"
Claude: [Reads context files, understands state]
User: "Good. Now read [specific file] - we're working on [X]"
```

## Common Patterns

### Adding a New Action
1. Define in src/data/allGameLayers.js
2. Implement in src/App.jsx executeAction()
3. Handle in reducer if needed (src/state/gameReducer.js)
4. Test edge cases

### Adding a New Shop
1. Define in src/data/shopData.js
2. Implement benefit in src/App.jsx executeShopBenefit()
3. Test purchase flow

### Debugging Multiplayer
- Check syncGameState debouncing (200ms)
- Verify timestamp deduplication
- Check justSyncedFromFirebase flag
- Ensure lastUpdatedBy !== myPlayerId

### Testing Complex Interactions
Priority test cases:
- Red repeat → Blue shop → Red shop
- Purple "play more workers" → Runs out → Effect persistence
- Yellow swap resources → During steal
- Shop cost modifiers → Different players see different costs

## Anti-Patterns (DON'T Do These)

❌ "Fix all the bugs" → ✅ "Fix only the shop cost bug"
❌ "Make multiplayer better" → ✅ "Fix emoji persistence in SYNC_GAME_STATE"
❌ "Add the feature" → ✅ "Explore the system first, then plan"
❌ Accepting code without tests → ✅ "Show me test results first"

## Known Pitfalls from v0
- Don't modify state directly in reducers
- Don't add global shop cost modifier (per-player only!)
- Don't forget recursion depth tracking (max 5)
- Don't sync modal state to Firebase (local only)
- Don't clear ALL effects on turn end (some persist)

## Quick Commands Reference
```bash
/clear              # Clear context between major features
/start              # Reload context from files
/plan               # Create implementation plan
/step <N>           # Execute specific plan step
```

## For Detailed Info
See:
- **DEVELOPER_GUIDE.md** - Comprehensive development guide
- **CODE_NAVIGATION.md** - File structure and code locations
- **IMPLEMENTATION_SPEC.md** - Complete game rules
- **DEVELOPMENT_META_FRAMEWORK.md** - Advanced workflow patterns
- **archive/v0-docs/** - Historical v0 documentation

## v0.5 Structure Overview

```
src/
├── App.jsx              # Main game component
├── main.jsx             # Entry point
├── state/
│   └── gameReducer.js   # State management
├── data/
│   ├── allGameLayers.js # Actions
│   ├── shopData.js      # Shops
│   └── constants.js     # Constants
├── firebase-compat.js   # Firebase config
└── test/                # Tests
```

## Migration Note
Originally built as a 9,459-line single HTML file (v0), successfully migrated to modern Vite/React architecture (v0.5) in November 2025. All v0 files preserved in `archive/v0-monolith/` for reference.
