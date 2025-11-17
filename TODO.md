# TODO

**Last Updated**: 2025-01-16 20:15

---

## Active Tasks

### Critical Priority
- [ ] **[URGENT] Fix multiplayer desync** - Players seeing different game states (myPlayerId:1 currentPlayer:2 vs myPlayerId:2 currentPlayer:1)

### High Priority
- [x] **[1] Shop phase text clarity** - DONE
- [x] **[2] Shop phase text visibility** - DONE (added to turn card)
- [ ] **[3] Round summary card missing on auto-advance** - When last patron played, round advances automatically but doesn't show Round summary card. Only shows when using "Advance Round" button.
- [ ] **[3a] VP breakdown in round summaries** - Round summaries should show clear accounting of where players got their VPs from
- [ ] **[3b] End-of-game summary** - Create final game summary with complete VP breakdown

### Medium Priority
- [ ] **[4] Purple broken - temporary replacement** - Replace purple with different color in basic games until we fix it properly
- [ ] **[5] Implement lastGain tracking** for Yellow copy action
  - Add `lastGain: {}` property to player state initialization
  - Create `RECORD_LAST_GAIN` reducer action
  - Dispatch after every resource gain action
- [ ] **[6] Fix purple layer properly** - Address root issues with purple layer
- [ ] **[7] Verify shop cost modifiers are per-round** - Double check that cost increases/decreases only apply for that round

### Low Priority
- [ ] Remove turn validation debug logging (cleanup from Firebase debugging) - Lines 841-858 in App.jsx
- [ ] Consider room cleanup optimization (currently scans all rooms on every create)

---

## Backlog
(Tasks for later)

---

## Completed
(Tasks move here after /checkpoint marks them done)
