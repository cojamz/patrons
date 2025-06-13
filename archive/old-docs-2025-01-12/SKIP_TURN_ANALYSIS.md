# Skip Turn Snake Draft Analysis

## Test Scenario
- 4 players, snake draft mode
- Turn order: [1, 2, 3, 4]
- P4 uses `gain4purpleSkip` in their first turn

## Expected Behavior
1. Round 1, Turn 1: P1 → P2 → P3 → P4 (uses skip action, skippedTurns[4] = 1)
2. Round 1, Turn 2: P4 (same player, reverses) → SKIP (P4 skipped) → P3 → P2 → P1
3. Round 1, Turn 3: P1 (same player, reverses) → P2 → P3 → P4
4. etc.

## What's Actually Happening (Bug)
The user reports: "it didn't skip their second turn"

## Code Flow Analysis

### When P4 ends their first turn after using gain4purpleSkip:
1. `END_TURN` is called
2. `skippedTurns[4] = 1` (set by the action)
3. Finding next player:
   - `currentIndex = 3` (P4 is at index 3)
   - `turnDirection = 1` (forward)
   - We're at the end, so: `nextPlayer = turnOrder[3] = 4`, `nextDirection = -1`
4. Do-while loop condition:
   - `tempSkippedTurns[4] = 1` (true, should skip)
   - Loop continues: decrements `tempSkippedTurns[4]` to 0
   - Next iteration: `currentIndex = 3` (P4), direction = -1 (backward)
   - `nextPlayer = turnOrder[2] = 3`
   - Loop exits (P3 has no skips)
5. Result: P3 plays next, P4's skip was consumed

## The Real Issue
The skip is being consumed immediately when P4 gets their "same player" turn at the reversal point, instead of being applied to their actual next turn in the sequence.

## Possible Solutions

### Solution 1: Don't consume skip on same-player reversals
Check if we're staying on the same player due to snake draft reversal, and if so, don't consume the skip.

### Solution 2: Track "actual turns" vs "reversal turns"
Distinguish between a real turn and a snake draft continuation.

### Solution 3: Rethink the loop logic
The current do-while loop tries to handle both skip detection and next player calculation in one go, which causes issues with snake draft.

## Recommended Fix
We need to check if this is a "reversal stay" (same player due to snake draft) and handle skips differently in that case.