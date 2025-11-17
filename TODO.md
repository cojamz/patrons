# TODO

**Last Updated**: 2025-01-16 20:15

---

## Active Tasks

### High Priority
- [ ] **[1] Shop phase text clarity** - Make it clear players can buy 1 regular shop + 1 VP shop (two separate phases, not "any shop")
- [ ] **[2] Shop phase text visibility** - All players can see shop phase text on other player cards (looks like button). Should only show for current player. Maybe add phase indicator to player turn card instead.
- [ ] **[3] Round summary card missing on auto-advance** - When last patron played, round advances automatically but doesn't show Round summary card. Only shows when using "Advance Round" button.

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
