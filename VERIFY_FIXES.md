# Fix Verification Checklist - January 9, 2025

## Issues Marked as Fixed Yesterday (Need Verification)

### ✅ Likely Fixed (from Firebase sync improvements)
- [x] **Yellow gain actions not updating** - Fixed with stale closure fix
- [x] **Gold conversion setting instead of adding** - Should be fixed
- [x] **Gain * not updating resources** - Should be fixed  
- [x] **Resources from red shop repeat** - Should be fixed
- [x] **Actions not clearing between rounds** - occupiedSpaces undefined fix

### ⚠️ Supposedly Fixed but Still Reported as Broken
- [ ] **Purple skip turn in snake draft** - Was "fixed" but still broken
- [ ] **Purple R1 shop cost** - Was "fixed" but still taking 2 purple
- [ ] **Force red placement** - Was "fixed" but still breaking game

### 🔴 Definitely Still Broken (Not Fixed Yesterday)
- [ ] **R2/R3 shops not showing for P1** - Player-specific bug
- [ ] **Blue/Red automatic VP** - Despite automaticVPs in state
- [ ] **Shop state persistence** - Between rounds
- [ ] **Shop toggle UI sync** - Across players
- [ ] **Red swap workers** - Wrong selection UI
- [ ] **Round advance double-click** - Causes skip to R3
- [ ] **Extra turn validation** - No error when out of workers
- [ ] **Shop cost modifier stacking** - Should stack but doesn't
- [ ] **Shop cost modifier scope** - Reduce should be player-specific

## Quick Verification Tests

### 1. Test Purple R1 Shop Cost
```javascript
// In debug console:
debug.getState().shops.purple.R1.cost
// Should show: { purple: 1, any: 2 }

// Try to buy it with only 2 purple
// Should require selecting 2 additional "any" resources
```

### 2. Test Force Red Placement
```javascript
// Place worker on forceRedPlacement action
debug.getState().forceRedPlacement // Should be true

// Try to place on non-red quadrant
// Should show error or prevent placement
```

### 3. Test Yellow Gain with Extra Workers
```javascript
// Use playTwoWorkers action
debug.getState().workersToPlace // Should be 2

// Place on gain3yellow
// Should update current player's resources, not wrong player
```

### 4. Test Skip Turn in Snake Draft
```javascript
// Enable snake draft
// Use gain4purpleSkip as P4 in first turn
debug.getState().players[3].skipTurns // Should be 1

// In round 2, P4's second turn should be skipped
```

### 5. Test Shop Automatic VP
```javascript
// With blue quad active
debug.getState().automaticVPs.blue // Should be true

// Buy any shop
// Check VP increased for all players
```

## Priority Verification Order

1. **Purple R1 shop cost** - Users explicitly mentioned still broken
2. **Force red placement** - Game-breaking if not working
3. **Skip turn in snake draft** - Core mechanic
4. **Gain * actions** - Fundamental resource system
5. **Shop automatic VP** - Victory point system

## How to Run Verification

1. Open `dev-tools.html`
2. Click "Open Game with DevTools"
3. Load each test scenario
4. Check state after each action
5. Note any failures in this file

## Results Template

```markdown
### Test: [Test Name]
- **Expected**: [What should happen]
- **Actual**: [What actually happened]
- **Status**: ✅ PASS / ❌ FAIL
- **Notes**: [Any observations]
```