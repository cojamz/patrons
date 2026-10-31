# Patrons v0.5 Development Meta-Framework
*A Strategic System for Efficient AI-Assisted Development*

Last Updated: 2025-01-14

---

## 🎯 Core Problem We're Solving

**The Issue**: Working on a 9,459-line single HTML file with Claude Code leads to:
- Context window exhaustion
- Lost understanding of game mechanics mid-session
- Endless bug-fixing cycles
- Inefficient back-and-forth debugging
- Repeated explanations of the same systems

**The Solution**: A structured meta-system that leverages Claude Code's capabilities while maintaining context and minimizing friction.

---

## 📋 Phase 1: Project Restructuring (Do This FIRST)

### Current State (v0)
```
Patrons/
├── react-game.html (9,459 lines - MONOLITHIC)
├── Documentation/
│   ├── README.md
│   ├── CODE_INDEX.md
│   └── [other docs]
└── [other files]
```

### Target State (v0.5)
```
Patrons-v0.5/
├── CLAUDE.md                    # 🔥 CRITICAL - Primary context file
├── .claude/
│   └── commands/
│       ├── test-action.md       # Test specific game action
│       ├── add-shop.md          # Add new shop template
│       └── debug-multiplayer.md # Debug MP sync issues
├── src/
│   ├── core/
│   │   ├── GameState.js         # Initial state + types
│   │   ├── GameReducer.js       # Main reducer logic
│   │   └── GameContext.js       # React context provider
│   ├── actions/
│   │   ├── executeAction.js     # Action execution engine
│   │   ├── redActions.js        # Red layer actions
│   │   ├── yellowActions.js     # Yellow layer actions
│   │   ├── blueActions.js       # Blue layer actions
│   │   ├── purpleActions.js     # Purple layer actions
│   │   └── [gold/white/black/silver].js
│   ├── shops/
│   │   ├── shopData.js          # All shop definitions
│   │   ├── shopPurchase.js      # Purchase logic
│   │   └── shopBenefits.js      # Benefit execution
│   ├── components/
│   │   ├── GameBoard.jsx
│   │   ├── PlayerCard.jsx
│   │   ├── GameLayer.jsx
│   │   ├── ActionSpace.jsx
│   │   ├── ShopCard.jsx
│   │   └── modals/
│   │       ├── GemSelection.jsx
│   │       ├── PlayerChoice.jsx
│   │       └── RoundTransition.jsx
│   ├── multiplayer/
│   │   ├── firebase.js          # Firebase config
│   │   ├── sync.js              # State sync logic
│   │   └── roomManagement.js    # Room create/join
│   ├── utils/
│   │   ├── validations.js       # Can place worker, etc.
│   │   ├── calculations.js      # VP calculations
│   │   └── helpers.js           # Misc helpers
│   └── data/
│       ├── allGameLayers.js     # Layer definitions
│       └── constants.js         # Game constants
├── tests/
│   ├── actions/
│   │   ├── redActions.test.js
│   │   └── [other tests]
│   └── integration/
│       └── gameFlow.test.js
├── public/
│   └── index.html               # Clean entry point
├── package.json
├── vite.config.js               # Fast dev server
└── README.md
```

**Why This Structure?**
- **Context Efficiency**: Claude can read 1 file (300 lines) vs searching through 9,459 lines
- **Mental Models**: Each file = one clear responsibility
- **Parallel Work**: Can work on shops without touching actions
- **Testing**: Can test individual modules
- **Git**: Better diffs, easier to review changes

---

## 🔥 The CLAUDE.md Strategy (MOST IMPORTANT)

### What Goes in CLAUDE.md?

```markdown
# Patrons v0.5 - Worker Placement Game

## Quick Context
- 8-resource worker placement board game for 2-4 players
- 3 rounds (4→5→6 workers per player)
- React + Firebase multiplayer
- Automatic VP triggers per resource type

## Critical Rules (Never Forget These)
1. **Force Red Placement**: Affects OTHER players, not the placer
2. **Shop Cost Modifiers**: PER-PLAYER (player.shopCostModifier), not global
3. **Repeat Actions**: Cannot repeat other repeat/swap actions (prevents loops)
4. **Play More Workers Effect**: Only clears when workersToPlace === 0
5. **Gold Shops**: Accept ANY resource as ⭐ payment
6. **Blue Auto VP**: ALL players get +1 when ANYONE uses a shop

## Tech Stack
- React 18 (with JSX now - moving from createElement)
- Vite for dev/build
- Firebase Realtime Database
- Vitest for testing

## Development Commands
```bash
npm run dev          # Start dev server
npm run test         # Run tests
npm run test:action  # Test specific action (prompts for name)
npm run build        # Production build
```

## File Navigation
- Game state: src/core/GameState.js
- Actions: src/actions/[color]Actions.js
- Shops: src/shops/
- Components: src/components/

## Code Style
- Functional components with hooks
- Pure functions for actions (no side effects in logic)
- Actions return { newState, updates: [] }
- Always validate multiplayer turn before mutations
- Use TypeScript-style JSDoc comments

## Common Patterns

### Adding a New Action
1. Define in src/data/allGameLayers.js
2. Implement in src/actions/[color]Actions.js
3. Add test in tests/actions/[color]Actions.test.js
4. Export from executeAction.js

### Adding a New Shop
1. Define in src/shops/shopData.js
2. Implement effect in src/shops/shopBenefits.js
3. Test purchase flow

### Debugging Multiplayer
- Check syncGameState debouncing (200ms)
- Verify timestamp deduplication
- Check justSyncedFromFirebase flag
- Ensure lastUpdatedBy !== myPlayerId

## Working with Claude Code

### Before Starting Any Task
1. Ask me to create a plan (use "think harder" for complex tasks)
2. Review the plan with you
3. Only code after approval

### When Context Gets Heavy
- Use /clear between major feature additions
- I'll remind you to check CLAUDE.md after each /clear
- Use subagents for deep dives (e.g., "use a subagent to explore the shop system")

### Testing Philosophy
- Write tests FIRST for new features
- Run tests BEFORE committing
- Integration tests for complex interactions (red repeat + blue shop)

## Known Pitfalls (From v0)
- ❌ Don't modify state directly in reducers
- ❌ Don't add global shop cost modifier (per-player only!)
- ❌ Don't forget recursion depth tracking for repeat actions
- ❌ Don't sync modal state to Firebase (local only)
- ❌ Don't clear effects on every turn (some persist until specific conditions)

## Current Session Focus
[This section gets updated at the start of each session]
- Working on: [Feature name]
- Files in play: [List]
- Next steps: [Checklist]
```

### CLAUDE.md Update Strategy
- **Start of session**: Update "Current Session Focus"
- **After /clear**: Re-read CLAUDE.md to restore context
- **End of session**: Document any new patterns discovered

---

## 🔄 The Development Workflow (Follow This RELIGIOUSLY)

### The 4-Phase Cycle

```
┌─────────────────────────────────────────────────────┐
│  PHASE 1: EXPLORE (No coding yet!)                  │
│  ───────────────────────────────────────────────    │
│  You: "I want to add X feature"                     │
│  Claude: "Let me explore the relevant code..."      │
│  • Uses Task/Explore agents                         │
│  • Reads relevant files                             │
│  • Identifies dependencies                          │
│  Duration: 2-5 minutes                              │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 2: PLAN (Think harder!)                      │
│  ───────────────────────────────────────────────    │
│  You: "Create a detailed plan. Think harder."       │
│  Claude: [Creates step-by-step plan]                │
│  • Identifies files to modify                       │
│  • Outlines test strategy                           │
│  • Flags potential issues                           │
│  Duration: 3-7 minutes                              │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 3: CODE (Small diffs only!)                  │
│  ───────────────────────────────────────────────    │
│  You: "Looks good. Start with step 1 only."         │
│  Claude: [Implements JUST step 1]                   │
│  • One logical change at a time                     │
│  • Test after each change                           │
│  • Review before continuing                         │
│  Duration: 5-10 minutes per step                    │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│  PHASE 4: VERIFY (Test & commit)                    │
│  ───────────────────────────────────────────────    │
│  You: "Run tests and show me the results"           │
│  Claude: [Runs tests, commits if passing]           │
│  • Automated tests confirm behavior                 │
│  • Manual testing for UI/UX                         │
│  • Git commit with clear message                    │
│  Duration: 2-5 minutes                              │
└─────────────────────────────────────────────────────┘
              ↓
         [Repeat for next step]
```

### Example Session Transcript

```
USER: I want to add a new Black action that steals workers from other players

CLAUDE: Let me explore the current action system and Black layer implementation
        to understand the pattern. [Uses Explore agent]

        [After exploration]
        I've reviewed:
        - src/actions/blackActions.js (current Black actions)
        - src/actions/executeAction.js (action registration)
        - src/data/allGameLayers.js (action definitions)

        Ready to plan. Should I proceed?

USER: Yes, create a plan. Think harder about edge cases.

CLAUDE: [Extended thinking mode activated]

        ## Plan: Add Worker Stealing Action

        ### Step 1: Define Action in allGameLayers.js
        - Add to black.actions array
        - Round 2 or 3? (needs decision)
        - Title: "Steal Worker from Another Player"

        ### Step 2: Implement in blackActions.js
        - Select target player (modal)
        - Validate target has workers placed
        - Remove worker from occupied space
        - Return worker to target's available pool
        - Give current player +1 black resource
        - Log the action

        ### Step 3: Handle Edge Cases
        - What if target has no workers placed?
        - What about "force red placement" effects?
        - Multiplayer sync considerations

        ### Step 4: Add Tests
        - Basic steal worker test
        - Edge case: No workers to steal
        - Edge case: Stealing from player with force effect

        ### Step 5: Update Documentation
        - Add to IMPLEMENTATION_SPEC.md
        - Update action count in README

        Potential Issues:
        - Need to handle occupiedSpaces state update
        - Should stealing trigger any automatic VPs?
        - Black automatic VP rule unclear for this action

        Approval to proceed?

USER: Good catch on the automatic VP. Let's say no auto VP for this action.
     Start with Step 1.

CLAUDE: [Implements ONLY Step 1 - modifies allGameLayers.js]

        Done. Here's the diff:
        [Shows clear diff]

        Ready for Step 2?

USER: Yes

CLAUDE: [Implements Step 2 - adds function to blackActions.js]
        [Runs tests automatically]

        Step 2 complete. Tests passing.
        Ready for Step 3?

[Continue until feature complete]
```

---

## 🛠️ Prompt Engineering Techniques

### 1. Use Extended Thinking Mode
```
❌ "Add a shop feature"
✅ "Think harder about how to add a shop feature that syncs properly in multiplayer"
```

**Thinking Keywords** (in order of intensity):
- `think` - Light thinking (~5-10 seconds)
- `think hard` - Moderate thinking (~15-30 seconds)
- `think harder` - Deep thinking (~30-60 seconds)
- `ultrathink` - Maximum thinking (~60+ seconds)

**When to use what:**
- Simple bug fix: `think`
- New feature: `think hard`
- Complex interaction (e.g., red repeat + blue shop): `think harder`
- Architectural decision: `ultrathink`

### 2. Explicit Phase Separation
```
❌ "Add purple R3 action"
✅ "Don't write code yet. First, explore the purple action system and create a plan."
```

### 3. Scope Limiting
```
❌ "Fix all the bugs"
✅ "Fix only the shop cost modifier bug. Ignore other issues for now."
```

### 4. Context Anchoring
```
❌ "Update the reducer"
✅ "Update the reducer in src/core/GameReducer.js, specifically the PLACE_WORKER case"
```

### 5. Use Subagents Strategically
```
✅ "Use a subagent to explore how worker placement validation works across all actions"
✅ "Launch an Explore agent to find all places where automatic VP is awarded"
```

### 6. Ask for Verification
```
✅ "Before implementing, verify this approach won't break multiplayer sync"
✅ "Check if any existing tests cover this scenario"
```

---

## 📊 Context Management Strategies

### When to Use /clear
- ✅ After completing a major feature
- ✅ Before starting unrelated work
- ✅ When you notice Claude "forgetting" core rules
- ✅ After debugging session that filled context with logs

### When NOT to Use /clear
- ❌ In the middle of implementing a feature
- ❌ Right after explaining complex requirements
- ❌ During active debugging of related issues

### Context Recovery After /clear
```
After using /clear:

YOU: "Read CLAUDE.md and tell me what we're working on"
CLAUDE: [Reads CLAUDE.md, understands context]
YOU: "Good. Now read src/actions/redActions.js - we're adding a new action"
CLAUDE: [Ready to continue with full context]
```

### Use .claude/commands for Repetitive Tasks

Create `.claude/commands/test-action.md`:
```markdown
# Test Action

Run tests for a specific game action.

1. Ask me which action to test (e.g., "redRepeatAction")
2. Run the corresponding test file
3. If tests fail, show the failure output
4. Offer to debug the failure

Remember: Don't modify code unless tests fail and I approve fixes.
```

Then use: `/test-action`

---

## 🎮 Game-Specific Development Patterns

### Adding a New Resource Color

**Template Checklist:**
```
[ ] 1. Create src/actions/[color]Actions.js
[ ] 2. Define actions in src/data/allGameLayers.js
[ ] 3. Define shops in src/shops/shopData.js
[ ] 4. Implement shop benefits in src/shops/shopBenefits.js
[ ] 5. Add automatic VP logic (if applicable)
[ ] 6. Create tests: tests/actions/[color]Actions.test.js
[ ] 7. Add to IMPLEMENTATION_SPEC.md
[ ] 8. Test in multiplayer
[ ] 9. Update CLAUDE.md with any special rules
```

### Debugging Multiplayer Issues

**Standard Process:**
```
1. Reproduce locally first (confirm it's not just MP)
2. Add console.logs to sync points:
   - syncGameState() entry
   - Firebase write
   - Firebase listener trigger
   - SYNC_GAME_STATE reducer
3. Check for common issues:
   - Missing timestamp?
   - Echo loop (lastUpdatedBy check)?
   - Stale state in async operation?
   - Debounce timer interfering?
4. Use browser dev tools Network tab (Firebase calls)
5. Test with 2 browser windows (incognito + normal)
```

### Testing Complex Interactions

**Priority Interactions to Test:**
```
1. Red repeat → Blue shop benefit → Red shop
2. Purple "play more workers" → Worker runs out → Effect persistence
3. Yellow swap resources → During another player's steal
4. Blue shop cost modifier → Different players see different costs
5. Force red placement → Player runs out of workers
6. Round advance → Automatic VP calculations → VP tooltip accuracy
```

---

## 🚫 Anti-Patterns (DON'T Do These)

### 1. The "Fix Everything At Once" Trap
```
❌ "There are 5 bugs. Fix them all."
✅ "Fix the shop cost modifier bug. We'll address others separately."
```

### 2. The "Vague Request" Trap
```
❌ "Make multiplayer better"
✅ "Fix the multiplayer sync issue where player emojis don't persist after SYNC_GAME_STATE"
```

### 3. The "No Tests" Trap
```
❌ "Add the feature and we'll test manually"
✅ "Write tests for the feature first, then implement to make them pass"
```

### 4. The "Refactor During Feature Work" Trap
```
❌ "While adding this feature, also clean up the reducer"
✅ "Add the feature with minimal changes. We'll refactor separately if needed."
```

### 5. The "Trust Without Verify" Trap
```
❌ Just accepting code without running it
✅ "Show me the test results before we commit"
```

---

## 📝 Session Documentation Template

Create a `SESSION_NOTES.md` (update after each work session):

```markdown
## Session [Date]

### Goals
- [ ] Add X feature
- [ ] Fix Y bug
- [ ] Refactor Z module

### Completed
- ✅ Added black worker steal action
- ✅ Tests passing for basic case
- ⚠️ Edge case: Force red placement (needs follow-up)

### In Progress
- 🔄 Multiplayer testing (works in local, testing with 2 players tomorrow)

### Blocked
- ❌ Silver automatic VP rule unclear (need design decision)

### Learnings / Patterns Discovered
- Worker stealing needs to check occupiedSpaces ownership
- Modal state should NOT sync to Firebase
- Black automatic VP triggers per player affected, not per action

### Next Session
1. Test worker steal with force red placement
2. Decide on Silver automatic VP rule
3. Add remaining Black R3 action

### Claude Code Tips Used This Session
- Used "think harder" for worker steal edge cases - very helpful!
- /clear after finishing worker steal before starting refactor
- Created /test-action command - saves time
```

---

## 🎯 Migration Strategy: v0 → v0.5

### Phase 1: Setup (Day 1)
```
[ ] Create new Patrons-v0.5 directory
[ ] Set up Vite + React project (npm create vite@latest)
[ ] Create CLAUDE.md with core context
[ ] Create folder structure
[ ] Set up git repository
```

### Phase 2: Core Extraction (Days 2-3)
```
[ ] Extract GameState.js from react-game.html:210-248
[ ] Extract GameReducer.js from react-game.html:250-1200
[ ] Extract constants and types
[ ] Set up basic React context
[ ] Create index.html entry point
[ ] Verify game state initializes correctly
```

### Phase 3: Action System (Days 4-7)
```
[ ] Create executeAction.js base
[ ] Extract Red actions → redActions.js
[ ] Extract Yellow actions → yellowActions.js
[ ] Extract Blue actions → blueActions.js
[ ] Extract Purple actions → purpleActions.js
[ ] Extract Gold/White/Black/Silver actions
[ ] Wire up action execution in reducer
[ ] Test each action independently
```

### Phase 4: Shop System (Days 8-10)
```
[ ] Extract shop data → shopData.js
[ ] Extract purchase logic → shopPurchase.js
[ ] Extract shop benefits → shopBenefits.js
[ ] Test shop purchases
[ ] Test cost modifiers
```

### Phase 5: Components (Days 11-14)
```
[ ] Create GameBoard component
[ ] Create PlayerCard component
[ ] Create GameLayer component
[ ] Create ActionSpace component
[ ] Create ShopCard component
[ ] Create modal components
[ ] Wire up all components
[ ] Test UI rendering
```

### Phase 6: Multiplayer (Days 15-17)
```
[ ] Extract Firebase config
[ ] Extract sync logic
[ ] Extract room management
[ ] Test 2-player game
[ ] Test 4-player game
[ ] Fix sync issues
```

### Phase 7: Testing & Polish (Days 18-20)
```
[ ] Write unit tests for all actions
[ ] Write integration tests
[ ] Test complex interactions
[ ] Performance testing
[ ] Bug fixes
[ ] Documentation updates
```

### Phase 8: Launch v0.5 (Day 21)
```
[ ] Final testing
[ ] Deploy to Netlify
[ ] Update README
[ ] Archive v0 code
[ ] Celebrate! 🎉
```

---

## 🔧 Recommended Tools & Setup

### VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Prettier (code formatting)
- ESLint (linting)
- Vitest Runner (run tests in editor)

### npm Scripts to Add
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:action": "node scripts/testAction.js",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

### Git Workflow
```bash
# Feature branch workflow
git checkout -b feature/add-black-steal-worker
# ... make changes ...
git add .
git commit -m "Add black worker steal action

- Implemented steal worker from target player
- Added validation for no workers case
- Tests passing for basic and edge cases
- Refs #23"
git push origin feature/add-black-steal-worker
# Create PR, review, merge
```

---

## 💡 Advanced Claude Code Features

### 1. Slash Commands
Create custom commands in `.claude/commands/`:

**`.claude/commands/add-action.md`:**
```markdown
# Add Action

Add a new game action following the standard pattern.

1. Ask me for: color, round, action name, effect description
2. Think harder about implementation details
3. Create a detailed plan covering:
   - Action definition in allGameLayers.js
   - Implementation in [color]Actions.js
   - Test cases
   - Edge cases
   - Multiplayer considerations
4. Wait for approval before coding
5. Implement step-by-step
6. Run tests after each step
```

### 2. MCP Servers (Optional)
Add to `.mcp.json` for team-wide tools:
```json
{
  "mcpServers": {
    "firebase-dev": {
      "command": "firebase",
      "args": ["emulators:start"]
    }
  }
}
```

### 3. Permissions Configuration
In `.claude/settings.local.json`:
```json
{
  "allowedTools": {
    "Read": true,
    "Write": true,
    "Edit": true,
    "Bash": true,
    "Grep": true,
    "Glob": true
  },
  "dangerousMode": false
}
```

---

## 📚 Resources & References

### Claude Code Official Docs
- Main docs: https://code.claude.com/docs
- Best practices: https://anthropic.com/engineering/claude-code-best-practices

### This Project's Key Docs
- `CLAUDE.md` - Primary context (read first!)
- `IMPLEMENTATION_SPEC.md` - Game rules reference
- `CODE_INDEX.md` - Old v0 navigation (for reference during migration)
- `SESSION_NOTES.md` - Session-by-session progress

### Quick Reference Commands
```bash
/clear              # Clear context (use between major features)
/permissions        # Configure allowed tools
/help               # Show all available commands
/[custom-command]   # Run custom slash command

# Prompt keywords
"think harder"      # Trigger extended thinking
"use a subagent"    # Launch exploration agent
"don't code yet"    # Prevent premature implementation
```

---

## 🎓 Training Yourself

### Week 1: Learn the Workflow
- Practice the 4-phase cycle on small features
- Get comfortable with /clear and context recovery
- Create your first custom slash command

### Week 2: Master Prompt Engineering
- Experiment with thinking keywords
- Practice scope limiting
- Learn when to use subagents vs direct commands

### Week 3: Build Testing Habits
- Write tests before implementation
- Get comfortable with test-driven development
- Learn to read test output quickly

### Week 4: Optimize Your Flow
- Create more slash commands for common tasks
- Refine your CLAUDE.md based on what works
- Develop your own patterns

---

## ✅ Success Metrics

You'll know this system is working when:
- ✅ Features get implemented in 1-2 sessions (not days of debugging)
- ✅ Context loss is rare (can recover quickly with CLAUDE.md)
- ✅ Tests catch bugs before you see them in the UI
- ✅ You can take breaks and resume work without re-explaining everything
- ✅ Code reviews are easy (small, focused diffs)
- ✅ Multiplayer bugs are reproducible and fixable
- ✅ You're excited to work on the project (not dreading the debugging)

---

## 🚀 Ready to Start?

**First Session Checklist:**
```
[ ] Read this entire document
[ ] Set up Patrons-v0.5 project structure
[ ] Create CLAUDE.md with initial context
[ ] Set up git repository
[ ] Create first custom slash command
[ ] Test the 4-phase workflow on a tiny feature
[ ] Document the session in SESSION_NOTES.md
[ ] Reflect: What worked? What didn't?
```

**Session 1 Prompt to Claude Code:**
```
I'm starting a v0.5 remake of my Patrons game. I want to follow a structured
workflow to avoid context loss and inefficient debugging.

Don't code yet. First:
1. Read CLAUDE.md in this directory
2. Review the project structure plan in DEVELOPMENT_META_FRAMEWORK.md
3. Create a detailed plan for setting up the initial Vite + React project

Think harder about potential issues we might encounter during migration.
```

---

*This meta-framework is a living document. Update it as you discover new patterns and techniques.*
