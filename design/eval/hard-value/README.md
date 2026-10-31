# Hard that learns what a position is worth (Oct 31)

Hard bots (AI players), 4 seats, random 2.0 tables. Code: `src/engine/v4/mind.js` (fitValueModel), `thinker.js` (valueAtBoundary), runner `scripts/v4-hard-value.mjs`.

## Why the first try (Oct 30) tied
- Notes could only nudge a move by about 1 follower.
- It learned "cards in winners' cults", which rewards being ahead, not the card.
- No lesson was tested. The try-a-change runner (`scripts/v4-hard-tune.mjs`, 24 games) then showed why testing is hard: two identical Hard bots finish 14 followers apart game to game, so 4 games can't tell a good change from luck. It kept none of 5 changes.

## This try
Hard plays its best options to the end of the round, then must value that position. It used normal's yardstick, which counts a member's ability as nothing once the round ends. Now every game's positions (4,600 samples over 100 games) are fit against the followers players finished with, refit after every 4 games.

What it learned (stable from about game 12 on):
- A member's remaining ability: about 0.5 followers per follower it could still make (was 0).
- Each member: +0.4 to +0.9 followers at the start of rounds II and III (was 0).
- Contest leads at a round's start: close to 0 in rounds I and II, 0.25 in III (was 1). Leads mostly don't survive the round.
- Resources' buying power: 1.1 to 1.3 (was 1).

## Result
20 tables, each played twice with the seats swapped, learning Hard in two seats vs today's Hard in two:
- Won 20 of 76 seats vs 20 of 76. Followers 57.6 vs 58.5 (paired difference -0.8, give or take 2.1). Learned Hard better on 9 of 20 tables.
- Play changed: learning Hard recruits more (10.3 members vs 8.1) and buys fewer followers (44 vs 48), and ends level.
- Buy-followers-only seat: 2 of 8 games (25%).

So knowing more about a position didn't win more. Next suspect: Hard looks only to the round's end with about 100 moves of lookahead, so its limit may be search, not knowledge. A Hard with 3x the lookahead against today's Hard would show it.
