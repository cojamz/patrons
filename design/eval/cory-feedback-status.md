# Cory's play notes: where each one stands (2026-10-15, 11:15 UTC)

"Done" means seen on a frozen build or in a screenshot, with a test that fails if it comes back. Two blind testers and a blind hobby gamer played the build again at 08:20; their findings were fixed through the morning (design/eval/overnight-wave3.md).

## Done
1. Straggler moves your last minion and asks only where.
2. The starting pick is an obvious call to action: one lit row in the middle of the wheel.
3. Hovers open right next to what you point at, one card at a time, and an open card never eats a click.
4. Snappier: a rival's move redraws only what changed; the page no longer restyles itself whole on every step (on a slow laptop, the wait for your turn fell from about 22s to 10s, hovers from 1.5s to under 0.4s); the header changes the moment the turn passes.
5. The wheel spins faster by keys; the drag coast is being shortened.
6. Member cards: picture, name, cost, worth; what it does lives in the hover as one plain sentence. No "need N", no color names by costs.
7. Plain dots for resources, a split dot for "any", and the follower mark; everything else is words. White, silver and "any" read apart on every table.
8. Every choice is picked on the board: steal by clicking the pile, copy by clicking the space, members, players and swaps by clicking them. No chip grids.
9. The follower buys sit first in the right column; the top scoreboard is gone; seats are condensed; the shop sorts by cost; the deck has no hover.
10. Round-end scoring plays one quadrant at a time, slowly, with the banner still at the wheel's centre.
11. Rims read "MOST BLUE · +2 👤" with the follower mark.
12. The giant follower is gone.
13. Spaces have no names or pictures: the gain first, a plain phrase, then small print; every space passed a newcomer's decipher test (design/eval/words/decipher-w3.md).
14. "Lit" spaces are unmistakable on your turn; in rivals' turns the shop dims.
15. Seats sit in turn order with the snake visible, and unplaced minions bob in a column on each seat.
16. The log is small; prime space goes to the wheel, your seat and the shop.
17. Names in the log and the strip open their cards.
18. A seat's hover lists each member with its ability and state; a usable member glows, and its card has "Use: …". The follower number shows where the followers came from.
19. Every action plays a chain from source to destination, with one Speed setting (Quick / Steady / Relaxed, Steady by default).
20. Opponents' builds: each seat shows "each round +3●", a rival's card says what they could buy right now, and the strip names anything that hit you.

## In progress (lands in the final build)
- The last effects that still jump without moving (gifts, ransoms, member trades, round-III steals, the bots' starting picks), and a shorter round-III burst.
- Online play: a board pick (Sleepwalker) stalled a game online; fixed, with guards.

## Yours to call (in the morning note)
- Members feel weak: relative payoffs (Reseller, Groupie) and Blue's direction.
- A pixel pass so members tell apart at seat size.
- A discard pile; members that are items; better pixel animations.
