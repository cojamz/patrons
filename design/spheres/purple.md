# Purple: extra turns (Claude's draft v4, 2026-10-14, nothing approved)

v4 is Claude's rework after Cory's first play, under his "for fixes, go with your gut". Every change is logged in decisions.md and can be overturned by number.

## The idea
Purple is time. You gather it, then either spend it to act again or hold it, because the purple you hold at round end is what Purple's ring counts.
In this game an extra turn is one more placement plus one more buy. So a space that only hands back the worker you used is a wasted worker, as Cory said of Rally. Every extra turn a Purple space gives is now a net gain: one worker goes in and two or more come out.

Night Owl and the five reprices (marked) come from the member-value sim in design/eval/purple-members.md (Claude's gut call, logged in decisions.md).

## For Cory (answer by number; "(fill-in)" marks Claude's own, which nobody has approved; costs are colored part + any, after the ×2)
1. Scoring (changed): most purple at round end. Ties all score. It was "most workers on the board, purple breaks ties", which tied almost every round and so was really most purple under another name.
2. Ring I, Hourly: +4 / +5 / +6 purple, by round.
3. Ring I, Catch Up: +1 purple, and +2 per rival with more workers on the board than you.
4. Ring I, Wind-up: +1 purple per worker you have on the board, this one included.
5. Ring II, Plan Ahead (fill-in, replaces Linger): +2 purple per worker you have left to place this round.
6. Ring II, Overtime (changed): pay 8 purple to take 2 extra turns right after this one. If you can't, +3 purple.
7. Ring III, Rally (changed): spend all your purple. You take 1 extra turn right after this one per 4 spent, plus 1, up to 3. With less than 4 purple, +4 purple. Double Time makes it 1 per 2.
8. Second Wind (6+2, repriced): once per game, take an extra turn right after this one.
9. Errand Runner (4+4): when you recruit it, take an extra turn right after this one.
10. Taskmaster (4+2, repriced): once per round, pay 5 purple to take an extra turn right after this one.
11. Late Riser (4+2, repriced): from round II on, if you have the fewest followers at round start, you take an extra turn before anyone else.
12. Foreman (4+2): whenever you take an extra turn, +1 purple per worker you have on the board.
13. Courier (4+2): whenever you take an extra turn, +1 of each other color.
14. Apprentice (2+2): whenever you take an extra turn, your next member costs 4 less.
15. Overseer (2+2, repriced): whenever a rival takes an extra turn, gain half your purple (up to 4).
16. Double Time [Corner-Cutter] (4+0; repriced 6+2 → 4+2 → 4+0, the last in balance pass 1): extra turns you pay purple for cost you half (rounded up).
17. Bookkeeper (4+2, changed): when you place your last worker of a round, +1 purple per 2 workers you have on the board.
18. Clockmaker (2+2): now and at round start, +1 purple per 2 purple you have.
19. Lamplighter (6+2): now and at round start, +1 purple per worker you get this round (3 / 4 / 5).
20. Night Owl (8+2, replaces Relay): each round, after your last minion, place one more and buy again. It counts as an extra turn (Foreman, Overseer…), and needs a space to spare.
21. Patience (6+2): at game end, +1 follower per 3 purple.
22. Shift Crew (1+1): worth 2 followers. No effect.

House rule: every extra turn needs a spare space (more open spaces than turns still to come), so nobody ever loses the last space. "If you can't" on Overtime covers the board having room for fewer than 2.

Cut in v4:
23. Linger. Moving a worker to an open space and doing it is the same as placing there, except you also gave up Linger and reopened your old space for a rival. It fizzled whenever your workers sat on Purple.
24. Rally and Overtime as "pay purple for one extra turn". The space handed back the worker it used, so the only gain was a buy.
25. "Most workers on the board". At 4 players every round-I space fills and the spare-space rule blocks extra turns, so round I always tied.

Earlier cuts: Lend a Hand, Timekeeper, Marathoner, Rally as a free turn, the v1 set (Rest, Doze, Wake, Slumber, Dreamer, Insomniac, Hibernator, Hermit, Moonlighter, Night Crew, Hourglass, Drifter, Rooster, Reveille, Lullaby), Relay.

## Value math (1 resource = 1u; an extra turn = a space plus its buy, about 3u in round I, 5u in round II, 7u in round III)
- Plan Ahead, against Steal 3 (about 4u) and Windfall (+1 per member): about +6 for the first pick of round II and +8 for the first pick of round III. It's worth almost nothing on your last worker. It pays most to whoever picks first, and that's the player with the fewest followers.
- Overtime: 8 purple buys 2 placements and 2 buys, about 10u in round II and 14u in round III, so about +2 to +6 net. Without the purple it's +3.
- Rally, against Strike (gold ×2, about 10–20 late) and Take (a free member): 4–7 purple buys 2 round-III turns (about 14u) and 8+ buys 3 (about 21u). The cost is everything you hold, including your claim on the +6 ring.

## Measurements (2026-10-14 rework; each line names its instrument)
Main instrument: easy bots, 300 games at 4 players, on seeded random tables of Purple plus three other spheres. Easy bots pick spaces by each action's estimate, so they do take paid turns. "Taker" means a player who took that space at least once; 25% is par. It's confounded by who can afford a space.
- Today's rules:
  - Takers won: Rally 21%, Linger 30%, Overtime 30%, Catch Up 22%, Hourly 23%, Wind-up 26%. For comparison, Strike 30% and Take 24%.
  - 0.96 extra turns per game.
  - Round I never had a single leader on workers. Under "ties score nothing", the ring would have paid nobody in 100% / 77% / 60% of rounds I / II / III.
- The rework as shipped:
  - Takers won: Rally 37%, Overtime 26%, Plan Ahead 27%, Hourly 26%, Wind-up 27%, Catch Up 22%. For comparison, Strike 33%, Take 23%, and the other round-III bursts Jubilee 37%, Boom 39%, Eternity 37%.
  - 3.2 extra turns per game. Wins by seat 28/25/26/21%. Average followers 37.3 (37.1 today).
  - The player who placed most on Purple won 31% (28% today).
  - The ring paid nobody in 7% / 9% / 15% of rounds (nobody held purple) and was shared in 28% / 18% / 10%.
- Price checks (same instrument):
  - Overtime at 6 purple: takers won 29%. At 8: 26%. Kept at 8, which is 4 a turn, the same rate as Rally.
  - Rally without the "plus 1" (the critic's version): 28%, level with Strike. But at 4–7 purple it hands back one worker for one, which is exactly Cory's complaint. With the plus 1: 37%.
  - "Most workers, ties score nothing" with the new spaces: the ring paid nobody in 100% / 69% / 40% of rounds.
- Dead air: one player placed 4 or more times in a row in 57% of games (3% today). The longest run per game averages 3.6 (2.35 today). That's the burst; watch how it feels.
- Normal bots, with the fix that lets them see extra turns (bots.js, committed 2026-10-14), 30 games each on the same tables:
  - 1.3 extra turns per game (0.5 on today's rules).
  - Purple's share of placements 26% (22%).
  - Runs of 4+ placements in a row in 20% of games (0%).
  - Too few games for win rates.
- Member value (member-value sim, Easy bots, handed over at the start of round II, 160 games each on gold/red/purple/green, about ±1.5 noise; Banker, cost 4, reads 2.7–3.0 in the same runs):
  - Bookkeeper, "+1 per worker" version: 8.4 followers, 57% win. Late purple decides the ring.
  - Bookkeeper as shipped, "+1 per 2": 5.0, 44% win. Kept at 6.
  - The per-turn triggers now fire 2–3 times: Apprentice (cost 4) 4.4, Taskmaster (8) 4.2, Overseer (6) 2.9, Foreman (6) 2.8, Courier (6) 2.2, Double Time (8) 2.1.
  - By Banker's yardstick, Apprentice is cheap and Double Time and Courier are dear. That's one run, so the fair-price screen should look rather than me repricing them here.

## Watch
- Bots: the normal bot used to score a placement on a copy of the game whose turn queue was empty, so it couldn't see an extra turn. Rally and Overtime read as "lose the purple" to it. Cory's first game was played against that. It's fixed in bots.js ("bots value extra turns", 2026-10-14), and the normal-bot numbers above come after the fix. They still take fewer turns than Easy bots do.
- "Spend all" on Rally wastes whatever is over 8. That's on purpose: it makes Rally a choice against holding purple for the ring. If it feels punishing, the fix is "spend 4 or 8".
- Per-turn member hooks (Foreman, Courier, Apprentice, Overseer) fire twice on Overtime and up to 3 times on Rally. See the member numbers above.
- Plan Ahead and Echo. A copy gives the space's printed gain, so when Plan Ahead is taken first in a round (+6 or +8), it becomes the best chip for Echo players to copy. In one of my test games it was copied four times. If that feels off, it's Echo's copy rule to look at, not Plan Ahead.
- "Most purple" is the same shape as Gold's, Silver's and White's rings. Cory once turned down "most black" for Magenta because it copied Gold's. Here the difference is the spending: purple held for the ring is purple not turned into turns.

## Engine notes (no core edits)
- Extra turns are queued turn tasks right after the current turn, and it all goes through ctx.state.queue. A ctx.addTurn(p, after) helper in core.js would be cleaner.
- Files: src/engine/v4/content/purple.js, src/test/engine/v4/spheres/purple.test.js, src/test/engine/v4/cards-purple.test.js, scripts/spheres/purple-{sim,value,thinker}.mjs.
