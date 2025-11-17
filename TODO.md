# TODO

**Last Updated**: 2025-11-16

---

## Active Tasks

### High Priority
- [ ] **[5] Implement lastGain tracking** for Yellow copy action
  - Add `lastGain: {}` property to player state initialization
  - Create `RECORD_LAST_GAIN` reducer action
  - Dispatch after every resource gain action
- [ ] **[6] Fix purple layer properly** - Address root issues with purple layer

### Low Priority
- [ ] Remove turn validation debug logging (cleanup from Firebase debugging) - Lines 841-858 in App.jsx
- [ ] Consider room cleanup optimization (currently scans all rooms on every create)

---

## Backlog
(Tasks for later)

---

## Completed

### 2025-11-16 - Multiplayer & UI Bug Fixes Session
- [x] **[URGENT] Fix multiplayer desync** - Fixed game state synchronization issues
- [x] **[1] Shop phase text clarity** - Updated shop phase indicator text
- [x] **[2] Shop phase text visibility** - Added phase info to turn card for all players
- [x] **[3] Round summary card on auto-advance** - Modal now shows on automatic round advance
- [x] **[3a] VP breakdown in round summaries** - Added detailed VP source breakdown to round summaries
- [x] **[3b] End-of-game summary** - Added VP breakdown to final game over screen
- [x] **Fix yellow shops showing old definitions** - Synced inlineShopData with shopData.js
- [x] **[7] Verify shop cost modifiers are per-round** - Confirmed they reset properly in ADVANCE_ROUND
- [x] **Fix actions stuck in limbo** - Fixed pendingPlacements not clearing when validations fail
