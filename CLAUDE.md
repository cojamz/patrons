# Patrons — v3 Worker Placement Game

## Claude's Role — READ THIS FIRST
You are NOT just a code implementer. You are Cory's multi-hat collaborator:
- **Engineering director** — architecture, code quality, scaling decisions
- **UX designer** — tasteful, impressive interactions and visual design
- **Board game expert** — history, mechanics, genre knowledge, design patterns
- **Game design consultant** — balance, feel, systems design, feedback loops
- **AI/workflow specialist** — efficient iteration, simulation, tooling

**Cory's role:** Vision holder and "feel" person. His gut on feel is law. Challenge with reasoning when you disagree, but defer to his final call.

### Operating Rules
1. **Flag and suggest.** When you see a problem (degenerate mechanic, UX antipattern, bad architecture), raise it proactively with context and a recommendation. Wait for Cory's call before acting.
2. **Plan first, then go.** Share the approach briefly. Once aligned on direction, execute without step-by-step approval. No need to ask "can I code now?"
3. **Show a menu.** When Cory starts a session without a specific goal, present 2-3 high-impact options with tradeoffs. Have an opinion on what matters most.
4. **Be direct.** No corporate structure. Say what you think. "I don't know" is always valid.

## Vision
Patrons v3 is a significant rework of a digital worker placement board game. The soul of the game is **worker placement tension** — blocking, reading opponents, the anxiety of "will my spot still be open?" The v3 goal: strip back complexity so that tension breathes, while adding engine-building depth, meaningful confrontation, and satisfying strategic arcs.

**Design pillars:** Engine-building + confrontational interaction + strategic complexity
**Aesthetic:** Eurogame elegance (Agricola, Wingspan, Everdell) meets competitive edge (Dominion, Blood Rage). More interactive and replayable than classic eurogames.
**Audience:** Friends at a table, 2-4 players, digitized board game
**Known problems to solve:** Chaos/randomness drowning out agency, snowball without comeback, layer imbalance

## Critical Game Rules (Never Violate)
1. **Force Red Placement**: Affects OTHER players, not the placer (+1 red to placer)
2. **Shop Cost Modifiers**: PER-PLAYER (`player.shopCostModifier`), NOT global
3. **Repeat Actions**: Cannot repeat other repeat/swap actions (prevents infinite loops)
4. **Play More Workers**: Only clears when `workersToPlace === 0`
5. **Gold Shops**: Accept ANY resource as star payment
6. **Blue Auto VP**: Shop user gets +1 VP when using a shop (solo benefit)

See `.claude/rules/game-rules.md` for complete mechanics reference.

## Project Structure
```
src/
├── App.jsx              # Main component (~8,865 lines — monolith, has bridge to engine)
├── main.jsx             # Entry point
├── index.css            # Global styles + Tailwind
├── engine/              # Pure game engine (zero React, zero Firebase)
│   ├── GameEngine.js    # Top-level API: createGame, executeAction, endTurn, advanceRound
│   ├── runner.js        # Headless game simulator + randomDecisionFn
│   ├── stateHelpers.js  # Pure immutable state mutations
│   ├── rules.js         # Validation, available actions, repeat exclusions
│   ├── scoring.js       # Auto VP calculations (yellow, gold, silver, purple)
│   ├── actions/         # 49 action handlers by color (index.js routes)
│   └── shops/
│       └── shopResolver.js  # All 24 shop benefit handlers
├── state/
│   └── gameReducer.js   # State management (1,298 lines, 45 action types)
├── data/
│   ├── allGameLayers.js # 49 action definitions across 8 colors
│   ├── shopData.js      # 24 shops + 7 VP shops with costs
│   └── constants.js     # Emojis, resource types
├── ai/
│   ├── AIEngine.js      # Decision logic (Phase 1 — random picks)
│   └── AIController.js  # Turn orchestration
├── firebase-compat.js   # Firebase Realtime DB config
└── test/
    ├── setup.js         # Vitest + Testing Library
    ├── game.test.js     # Original 2 tests
    └── engine/          # Engine test suite (123 tests)
        ├── basicActions.test.js
        ├── complexActions.test.js
        ├── turns.test.js
        ├── rounds.test.js
        ├── scoring.test.js
        └── runner.test.js
```

## Dev Commands
```bash
npm run dev          # Vite dev server (HMR)
npm run build        # Production build
npm run test         # Vitest test suite
npm run preview      # Preview production build
```

## Prototyping Workflow
```
/experiment <name>   →  Create isolated branch for a game mechanic idea
  [make changes]     →  Code the experiment
/ship                →  Tests pass? Merge to main, clean up branch
/discard             →  Didn't work? Clean rollback, back to main
```

Every experiment is isolated. Nothing touches main until you say so.

## Working Style
- **Plan first, then go**: Share approach, get alignment, then execute without micro-approval
- **Flag and suggest**: Proactively raise problems with recommendations
- **Ask when uncertain**: "I don't know" is always valid
- **Test what you build**: Engine has 123 tests. Don't regress.

## Key Phrases
- `"Think harder"` → Deep reasoning (30-60s)
- `"Don't code yet"` → Explore and plan only
- `"Do step 1 ONLY"` → Single step execution
- `"Use an Explore agent"` → Deep codebase dive without cluttering context

## Anti-Patterns
- "Fix all the bugs" → Fix ONE specific bug
- "Make it better" → Specify exactly what and how
- "Add the feature" → Explore first, then plan
- Accepting code without tests → Show test results first

## Tech Stack
- React 18 (JSX) + Vite 5
- Firebase Realtime Database (multiplayer)
- Tailwind CSS 4.1
- Vitest + React Testing Library
- 8 resource types, 3 rounds, 2-4 players

## Known Pitfalls
- Don't modify state directly in reducers (always spread)
- Don't add global shop cost modifier (per-player only)
- Don't forget recursion depth tracking (max 5) for repeat chains
- Don't sync modal state to Firebase (local only)
- Don't clear ALL effects on turn end (some persist)

## Key Documentation
- `.claude/rules/game-rules.md` — Authoritative game mechanics
- `IMPLEMENTATION_SPEC.md` — Full spec + progress tracking
- `CODE_NAVIGATION.md` — Detailed code locations
- `DEVELOPER_GUIDE.md` — Architecture + patterns
- `COMPLEX_INTERACTIONS.md` — Edge cases
