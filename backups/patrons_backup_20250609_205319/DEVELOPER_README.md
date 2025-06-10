# Patrons Game Developer Guide

## 🚀 Quick Start for Development

### Safe Development Workflow
1. **Always backup first**: `./backup-game.sh`
2. **Use debug mode**: Open `react-game.html?debug=true`
3. **Test changes**: Use `dev-tools.html` for isolated testing
4. **Check logs**: Open browser console for detailed logging

### Key Files
- `react-game.html` - The entire game (7964 lines) ⚠️ Handle with care!
- `CODE_INDEX.md` - Line number references for quick navigation
- `IMPLEMENTATION_SPEC.md` - Complete game specification
- `PLAYTEST_BUGS_STATUS.md` - Current known issues

## 🛠️ Development Best Practices

### 1. Making Changes Safely
```bash
# Before any changes
./backup-game.sh

# Test in debug mode
open "react-game.html?debug=true"

# Use dev tools for isolated testing
open dev-tools.html
```

### 2. Finding Code Quickly
Instead of searching through 8000 lines, use the index:
- **Reducer logic**: Lines 250-1300
- **Action execution**: Lines 1700-3500
- **Shop system**: Lines 6500-6950
- **Components**: Lines 6240-7400
- **Game data**: Lines 7425-7530

### 3. Common Patterns

#### Resource Updates
```javascript
dispatch({ 
  type: 'UPDATE_RESOURCES', 
  playerId: 0, 
  resources: { red: 5, yellow: 3 } 
});
```

#### Shop Purchase Flow
1. Check if player can afford (line ~6510)
2. Show gem selection modal if needed (line ~6550)
3. Execute shop benefit (line ~5600)
4. Update resources and state

#### Action Execution
```javascript
executeAction(gameState, 'actionName', playerId);
// Returns { newState, updates: [] }
```

## 🐛 Debugging Tips

### Browser Console Commands
When running with `?debug=true`:
```javascript
// View current game state
debug.getState()

// Test an action
debug.testAction('gain3red', 0)

// Show VP breakdown
debug.showVPBreakdown()

// Log full state
debug.logState()
```

### Common Issues & Solutions

1. **Resources not updating**
   - Check stale closure in Firebase sync (line ~1402)
   - Verify UPDATE_RESOURCES has all fields

2. **Shop costs wrong**
   - Check shop data definition (line ~6890)
   - Verify cost validation logic (line ~6510)
   - Test gem selection modal

3. **Actions not working**
   - Find action in executeAction (lines 1700-3500)
   - Check canPlaceWorker validation
   - Verify occupiedSpaces tracking

4. **Multiplayer sync issues**
   - Check SYNC_GAME_STATE (line ~1149)
   - Verify lastUpdatedBy prevents echo
   - Ensure all state fields are synced

## 📁 File Structure

```
Patrons/
├── react-game.html      # Main game file (DO NOT EDIT WITHOUT BACKUP)
├── index.html          # Entry point
├── dev-tools.html      # Development tools
├── game-logger.js      # Debug logging utility
├── backup-game.sh      # Backup script
├── generate-docs.js    # Documentation generator
│
├── Documentation/
│   ├── CODE_INDEX.md           # Line number quick reference
│   ├── IMPLEMENTATION_SPEC.md  # Full game specification
│   ├── COMPLEX_INTERACTIONS.md # Edge cases and interactions
│   ├── PLAYTEST_BUGS_STATUS.md # Bug tracking
│   └── CLAUDE.md              # AI assistant context
│
└── backups/            # Timestamped backups (auto-created)
```

## 🧪 Testing Approach

### Manual Testing Checklist
- [ ] Each quad's R1/R2/R3 actions work
- [ ] Shop costs are correct
- [ ] Automatic VP triggers properly
- [ ] Resource updates in multiplayer
- [ ] Turn order in snake draft
- [ ] Shop phase restrictions

### Automated Testing (Future)
Currently no automated tests. When adding:
1. Test reducer logic in isolation
2. Test action outcomes
3. Test shop calculations
4. Test multiplayer sync

## 🚨 Critical Areas - Handle with Extra Care

1. **Lines 250-1300**: Game reducer - core state management
2. **Lines 1700-3500**: Action execution - all game logic
3. **Lines 1402-1422**: Firebase sync - multiplayer critical
4. **Lines 6500-6600**: Shop purchases - complex flow

## 💡 Performance Considerations

- Game runs entirely client-side
- No build process = instant reload
- React without JSX = larger bundle
- Firebase sync on every state change
- 8000 lines in one file = slow IDE

## 🔮 Future Improvements (Without Breaking)

1. **Add PropTypes** for runtime type checking
2. **Create action constants** to prevent typos
3. **Add state validation** in reducer
4. **Implement action queue** for better multiplayer
5. **Add replay system** for debugging
6. **Create visual state inspector**

Remember: **This game works!** Any changes should preserve that functionality.