# Implementation Plan: UX Polish Sprint — Visual Feedback & Player Clarity

**Created**: 2026-03-02
**Status**: Awaiting Approval

## Feature Description
Add visual feedback systems so players always know what just happened, whose turn it is, and feel excitement when shops/power cards activate. Eight features across 3 tiers.

## Scope

**IN SCOPE:**
1. Floating resource deltas ("+2 gold" floats up from resource counter)
2. Turn change announcement (cinematic banner between turns)
3. Phase breadcrumb (always-visible game phase indicator)
4. Power card trigger flash (pulse when a card activates)
5. Action result toast (brief summary banner after each action)
6. Last-placed worker glow (highlight most recent worker)
7. Pulse on changed values (resource counts flash on change)
8. Documentation updates (implementation_state.md, TODO.md, CHANGELOG.md)

**OUT OF SCOPE:**
- "Since your last turn" recap (complex state tracking, separate task)
- Hover preview / scoring preview (needs engine-level support)
- Golden Scepter double-firing bug (separate bug fix)
- Sound effects
- Purple/Red layer bugs

## Files to Modify

**New files:**
- `src/v3/components/hud/FloatingDeltas.jsx` — Floating "+2 gold" labels
- `src/v3/components/hud/TurnAnnouncement.jsx` — "Your Turn" banner
- `src/v3/components/hud/ActionToast.jsx` — Action result toast
- `src/v3/hooks/useGameEvents.js` — Custom hook that detects state diffs and emits UI events

**Modified files:**
- `src/v3/GameProvider.jsx` — Expose previous state for diff detection
- `src/v3/App.jsx` — Add TurnAnnouncement, FloatingDeltas, ActionToast overlays
- `src/v3/components/player/PlayerPanel.jsx` — Wire FloatingDeltas to resource display
- `src/v3/components/player/ResourceDisplay.jsx` — Enhanced pulse animation on change
- `src/v3/components/player/PowerCardSlot.jsx` — Trigger flash when card activates
- `src/v3/components/board/WorkerToken.jsx` — "Last placed" glow variant
- `src/v3/components/board/ActionSpace.jsx` — Pass `isLastPlaced` prop
- `src/v3/components/hud/TurnIndicator.jsx` — Enhance as phase breadcrumb
- `src/v3/styles/animations.js` — New animation variants
- `.claude/implementation_state.md` — Update throughout
- `TODO.md` — Mark completed items
- `CHANGELOG.md` — Document changes

## Implementation Steps

### Step 1: State Diff Infrastructure (`useGameEvents` hook)
**Files**: `src/v3/hooks/useGameEvents.js`, `src/v3/GameProvider.jsx`
**Changes**:
- Create `useGameEvents` hook that compares previous vs current game state
- Detects: resource changes per player, turn changes, worker placements, power card activations, shop purchases
- Returns an array of "UI events" like `{ type: 'resourceDelta', player: 0, deltas: { gold: +2 } }`, `{ type: 'turnChange', from: 0, to: 1 }`, `{ type: 'workerPlaced', actionId, godColor }`, `{ type: 'cardTriggered', cardId }`
- In GameProvider: add `previousGame` ref that updates on each state change, expose via context
- Events auto-expire after a configurable duration (e.g. 2 seconds) so UI elements auto-dismiss
**Tests**: Manual — verify events fire correctly in console during gameplay
**Estimated complexity**: Medium

### Step 2: Floating Resource Deltas
**Files**: `src/v3/components/hud/FloatingDeltas.jsx`, `src/v3/components/player/PlayerPanel.jsx`, `src/v3/styles/animations.js`
**Changes**:
- Create `FloatingDeltas` component: renders floating "+2" / "-1" labels that animate upward and fade out
- Each delta: god-colored text, starts at the resource gem position, floats up ~40px over 1.2s, fades out
- Multiple deltas can stack (if you gain gold AND black simultaneously, both float)
- Wire into `PlayerPanel` near `ResourceDisplay` — position absolutely above each gem
- New animation variant `floatingDelta` in animations.js: `{ y: [0, -40], opacity: [1, 1, 0], scale: [0.8, 1.1, 1] }`
- Uses events from `useGameEvents` to trigger — only show deltas for the currently viewed player
**Tests**: Manual — place a worker on a +3 gold action, verify "+3" floats up from gold gem
**Estimated complexity**: Medium

### Step 3: Turn Change Announcement
**Files**: `src/v3/components/hud/TurnAnnouncement.jsx`, `src/v3/App.jsx`, `src/v3/styles/animations.js`
**Changes**:
- Create `TurnAnnouncement` overlay: full-width banner that appears center-screen for ~1.5s
- Shows player color pip + "Your Turn" (for human) or "{Player Name}'s Turn" (for AI/others)
- Cinematic feel: scale in from 1.1, settle, hold 1s, fade out
- Only triggers on actual turn changes during action_phase (not round transitions, not decisions)
- Portal to body so it sits above everything except modals
- Add to `GameScreen` in App.jsx
- New animation variant `turnAnnouncement` in animations.js
- Listens to `turnChange` events from useGameEvents
**Tests**: Manual — end turn, verify banner appears briefly before next player can act
**Estimated complexity**: Low

### Step 4: Enhanced Phase Breadcrumb
**Files**: `src/v3/components/hud/TurnIndicator.jsx`
**Changes**:
- Restructure TurnIndicator into a clearer breadcrumb: `Round 1 › Action Phase › Your Turn`
- Use chevron separators instead of pipe dividers for flow
- Highlight current "step" in the breadcrumb (gold glow on the active segment)
- When a decision is pending, add a 4th crumb: `› Choose Target` that pulses
- The contextual hint at bottom becomes redundant with the breadcrumb — merge them
- Keep worker count and turn order preview
- More prominent pending-decision state: decision crumb gets a soft pulse + different color
**Tests**: Manual — verify breadcrumb updates at each phase transition and decision
**Estimated complexity**: Low

### Step 5: Power Card Trigger Flash
**Files**: `src/v3/components/player/PowerCardSlot.jsx`, `src/v3/styles/animations.js`
**Changes**:
- When `useGameEvents` reports a `cardTriggered` event matching this card's ID, play a flash animation
- Flash: brief border glow intensification + scale pulse (1 → 1.08 → 1) over 0.6s
- God-colored ring of light that expands outward and fades (CSS box-shadow animation)
- Add `triggerFlash` animation variant in animations.js
- PowerCardSlot receives `triggeredCardIds` from parent (or consumes useGameEvents directly)
- Flash auto-clears after animation completes
**Tests**: Manual — place a worker that triggers a power card, verify the card slot flashes
**Estimated complexity**: Low

### Step 6: Action Result Toast
**Files**: `src/v3/components/hud/ActionToast.jsx`, `src/v3/App.jsx`, `src/v3/styles/animations.js`
**Changes**:
- Create `ActionToast`: brief banner that appears below the top HUD bar
- Shows a one-line summary of the last action: "Gained 3 Gold" / "Stole 2 VP from Player 2" / "Bought Tome of Deeds"
- Parses the latest log entry from `useGameEvents` to build readable text
- Slides down from top, holds 2s, fades up
- Auto-dismissed, non-interactive (pointer-events: none)
- Stacks if multiple events happen quickly (up to 3 visible)
- God-colored accent on the left edge of each toast
- Add to `GameScreen` in App.jsx, positioned below HUD bar
- New animation variant `toastSlide` in animations.js
**Tests**: Manual — play through several actions, verify toasts appear and stack correctly
**Estimated complexity**: Medium

### Step 7: Last-Placed Worker Glow + Resource Pulse
**Files**: `src/v3/components/board/WorkerToken.jsx`, `src/v3/components/board/ActionSpace.jsx`, `src/v3/components/board/GodArea.jsx`, `src/v3/components/player/ResourceDisplay.jsx`
**Changes**:
- **Last-placed worker**: Track `lastPlacedActionId` from game state or useGameEvents. Pass `isLastPlaced` prop to WorkerToken. When true, add a breathing god-colored ring animation (2.5s cycle, subtle scale 1 → 1.05 → 1).
- **Resource pulse**: ResourceDisplay's `ResourceGem` already has `counterPop` animation via `useAnimatedValue.direction`. Enhance it: when direction is 'up', add a brief background flash (god-colored, 0.3s fade) behind the gem. When 'down', brief red flash. This builds on existing infrastructure — just needs a conditional background glow.
**Tests**: Manual — place worker, verify it glows; gain resources, verify gem area flashes
**Estimated complexity**: Low

### Step 8: Documentation Update
**Files**: `.claude/implementation_state.md`, `TODO.md`, `CHANGELOG.md`
**Changes**:
- Update implementation_state.md with current state + what was built
- Mark completed TODO items
- Add CHANGELOG entry for this sprint
- Run `npm run test` to confirm no regressions
**Tests**: `npm run test` — all 416+ tests pass
**Estimated complexity**: Low

## Edge Cases & Considerations

- **AI turns**: Floating deltas and toasts should still show for AI actions (player is watching). Turn announcement should say "AI Player's Turn" briefly (shorter duration ~0.8s since human can't act).
- **Rapid actions**: If AI plays quickly, toasts could stack. Cap at 3 visible, older ones dismissed early.
- **Decision chains**: Turn announcement should NOT fire when a decision resolves mid-turn (only on actual turn boundary). useGameEvents needs to distinguish `currentPlayer` changes from decision flow vs actual turn changes.
- **Round transitions**: Turn announcement should NOT fire during round_end → round_start phase changes. Gate on `phase === 'action_phase'`.
- **Multiple resource changes**: A single action can change multiple resource types. FloatingDeltas must handle simultaneous deltas (stagger them slightly, or show as "+2 gold, +1 black" combined).
- **Favor changes**: Favor (glory) already has its own animation system. Don't double up — floating deltas are for resources only, favor counter handles itself.
- **Performance**: All new components use AnimatePresence with lazy unmounting. No persistent timers or intervals — all event-driven with auto-cleanup.

## Test Strategy
- **Unit tests**: None needed — these are purely visual components with no game logic
- **Integration tests**: Existing 416 tests must still pass (no engine changes)
- **Manual testing**: Play through a full 2-player game verifying each new visual element fires at the right time. Specific checks:
  - Place worker → floating delta appears → toast appears → worker glows
  - End turn → turn announcement banner
  - Power card triggers → slot flashes
  - Phase breadcrumb updates at every transition
  - AI turn → all visual feedback still visible but at appropriate pace
  - Round transition → no stale deltas or announcements carry over

## Potential Pitfalls
- **Z-index wars**: Multiple new overlays (toast, turn announcement, floating deltas) all need correct stacking. Turn announcement > toast > floating deltas > board. Use z-index tiers: deltas=z-30, toast=z-45, announcement=z-55 (below modals at z-50+).
- **Re-render performance**: useGameEvents does a state diff every render. Keep the diff shallow (compare player resource objects by reference, not deep equality). Use `useRef` for previous state to avoid re-render loops.
- **Stale closures**: Events array managed in a ref, not state, to avoid triggering re-renders when events expire. Components that consume events use a lightweight subscription.
- **Log parsing for toasts**: Game log entries are plain strings with inconsistent formatting. May need a structured event rather than parsing strings — if log parsing is fragile, fall back to showing the raw log entry.

## Step Dependencies
```
Step 1 (useGameEvents) ──► Step 2 (Floating Deltas)
                       ──► Step 3 (Turn Announcement)
                       ──► Step 5 (Power Card Flash)
                       ──► Step 6 (Action Toast)
                       ──► Step 7 (Last Worker Glow)
Step 4 (Phase Breadcrumb) — independent, no deps
Step 8 (Docs) — after all others
```

Steps 2, 3, 4, 5, 6, 7 are independent of each other (all depend on Step 1 except Step 4). Recommended order: 1 → 4 → 2 → 7 → 3 → 5 → 6 → 8. This front-loads the most impactful visual changes.
