# TODO

**Last Updated**: 2025-01-16

---

## Active Tasks

### High Priority
- [ ] Fix shop phase text issue (mentioned in previous session, needs clarification on what's wrong)
- [ ] Implement lastGain tracking for Yellow copy action
  - Add `lastGain: {}` property to player state initialization
  - Create `RECORD_LAST_GAIN` reducer action
  - Dispatch after every resource gain action

### Medium Priority
- [ ] Purple layer redesign (mentioned as upcoming work)
- [ ] Remove turn validation debug logging (cleanup from Firebase debugging)
  - Lines 841-858 in App.jsx

### Low Priority
- [ ] Consider room cleanup optimization (currently scans all rooms on every create)

---

## Backlog
(Tasks for later)

---

## Completed
(Tasks move here after /checkpoint marks them done)
