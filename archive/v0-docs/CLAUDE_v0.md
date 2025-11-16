# Patrons - Worker Placement Game

## Critical Game Rules (Never Forget)
1. **Force Red Placement**: Affects OTHER players, not the placer (+1 red to placer)
2. **Shop Cost Modifiers**: PER-PLAYER (`player.shopCostModifier`), NOT global
3. **Repeat Actions**: Cannot repeat other repeat/swap actions (prevents infinite loops)
4. **Play More Workers Effect**: Only clears when `workersToPlace === 0`
5. **Gold Shops**: Accept ANY resource as ⭐ payment
6. **Blue Auto VP**: ALL players get +1 VP when ANYONE uses a shop

## Project Info
- Single HTML file game (react-game.html, 9,459 lines)
- React 18 using createElement (no JSX)
- Firebase for multiplayer
- 8 resource types, 3 rounds, 2-4 players

## File Navigation
- Game state: Lines 210-248
- Reducer: Lines 250-1200
- Actions: Lines 1700-3500
- Shops: Lines 6500-6950
- Components: Lines 6240-7400
- See CODE_INDEX.md for detailed line numbers

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
User: "Read CLAUDE.md and tell me where we are"
Claude: [Reads this file, understands context]
User: "Good. Now read [specific file] - we're working on [X]"
```

## Common Patterns

### Adding a New Action
1. Define in src/data/allGameLayers.js (or line 8804 in current v0)
2. Implement in executeAction (lines 1700-3500 in v0)
3. Handle in reducer if needed
4. Test edge cases

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
/permissions        # Configure allowed tools
/help               # Show all commands
```

## For Detailed Info
See DEVELOPMENT_META_FRAMEWORK.md for:
- Full v0 → v0.5 migration plan
- Detailed examples and transcripts
- Project structure recommendations
- Advanced techniques
