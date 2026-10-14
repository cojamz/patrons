# Purple: time (Claude's draft, 2026-10-14, nothing here is approved)

## The idea
Purple trades turns for power. You can skip a turn so that worker rests, lying in front of you where everyone can see it. Later you can wake resting workers to take turns back to back, or take a worker back off a space and go again.
Gold hoards money and Red stacks cheap members. Purple bends when, and how often, you act. Its contest rewards whoever held the most workers back.

## For Cory (answer by number)
Scoring
1. Most resting workers at round end. A resting worker is one you skipped a turn with. It lies on its side in front of you, so anyone can see who's ahead. Ties all score. You need at least 1.

Actions
2. Ring I, Rest: +4 purple. Skip your next turn this round, and that worker rests.
3. Ring I, Doze: +2 purple, and +2 more per resting worker you have.
4. Ring I, Wake: +1 purple. Each of your resting workers takes a turn now, one after another.
5. Ring II, Slumber: skip your next turn (that worker rests), then +3 purple per resting worker.
6. Ring II, Linger: take back one of your workers from an outer or middle space of another color, and take a turn with it now. It can go back to the same space.
7. Ring III, Rally: each of your resting workers takes a turn now, then you take one more.

Members (cost = purple + any)
8. Lamplighter (1+1): at round start, +1 purple per worker you get this round (3 / 4 / 5).
9. Dreamer (1+1): at round end, +2 purple per resting worker.
10. Insomniac (2+1): once per round, wake one resting worker. It takes a turn right after this one.
11. Hibernator (2+1): resting workers stay resting into the next round.
12. Straggler (2+1): at round start, if you have the fewest followers (ties count), +1 resting worker.
13. Hermit (3+1): at game end, +3 followers per resting worker.
14. Second Wind (4+2): once per game, take an extra turn right after this one.
15. Moonlighter (2+1): whenever you take back a worker, +2 of that space's color.
16. Timekeeper (2+1): whenever a rival buys 6 followers, +3 purple.
17. Night Crew (3+1): worth 3 followers. When you recruit it, skip your next turn (that worker rests).
18. Hourglass (1+1): at round start, you may rest your last worker of the round for +4 purple.
19. Drifter (1+1): when you recruit it, +1 resting worker this round.
20. Rooster (1+1): whenever one of your resting workers wakes, +1 of each other color.
21. Reveille (2+2): once per game, wake every resting worker. Each takes a turn right after this one.
22. Lullaby (2+1): once per game, the leader skips their next turn, and that worker rests (so it counts for them in the contest).

## Value math per action (1 resource = 1u; a turn you skip costs a placement plus its buy, about 3u in round I and 6u in round III; the contest pays +2/+4/+6 followers, about 1.5u each)
- Rest, against Joint Venture (about 4u) and Rush (2/4/6). In round I: +4 purple − about 3u for the turn + a likely +2 followers (3u), so about 4u. In round III: +4 − 6u + about 60% of +6 followers (5.4u), so about 3u. On your last turn there's nothing to skip, so it's a plain +4. That's a lure, not a toll.
- Doze, the weak version. 2u in round I, 4–6u late if you're holding 1–2 resting workers. Below Rush on purpose.
- Wake: no net placement. You get back the turns you gave up, back to back. It's worth +1u plus timing (two picks before anyone answers) minus the contest you give up. Roughly 1–3u, and it's what makes Rest a bank rather than a loss.
- Slumber, against Steal 3 (about 4u) and Windfall (about 4u in round II, about 10u late). With 1 already resting: −4.5u for the turn, +6 purple, plus the +4/+6 contest, so about 4–6u. With nothing resting it's −4.5 + 3 + contest, so about 2u.
- Linger: one extra placement. That's a ring I/II space (2.5–5u) plus a buy, about 5–7u. It's at the top of ring II. That's deliberate ("reuse a space"), but it's the line to watch.
- Rally, against Strike (late gold 10–20, so +10–20) and Take (one free member, 4–7u). It's one extra round-III turn (about 7u with its buy), plus 1 per resting worker. About 7u bare, and 14–20u if you rested earlier in round III.

## Extra ideas (one line each)
Ring I
23. Recall: +1 purple, take back one of your workers, and it rests. (Cut: on your last turn it's a free contest point.)
24. Siesta: +3 purple, and +1 purple to everyone with a resting worker (spill).
25. Snooze: skip your next turn (it rests), and +1 of each color.
26. Nap: +1 purple per resting worker on the whole table, doubled.
Ring II
27. Hibernate: skip your next 2 turns (both rest), and +4 purple per resting worker.
28. Second Shift: take back one of your workers from another color, and it rests (Recall moved up a ring).
29. Linger, softer: same, but not back to the same space.
Ring III
30. Encore: take back up to 2 of your workers and take a turn with each now.
31. Awaken: double your resting workers.
32. Long Night: every player skips their next turn, and those workers rest (everyone gets a shot at the contest).
Members
33. Sleepwalker: when you recruit it, take back a worker and it rests. (Cut: contest snipe.)
34. Sleepyhead: whenever you skip a turn, +2 purple. (Cut: −1.5 measured. It baits bots into over-resting.)
35. Bedfellow: whenever a rival skips a turn, +2 purple.
36. Patience: at game end, +1 follower per 3 purple.
Scoring
37. Most purple held (simple, but it's Gold's Crown in a new color).
38. Most resting workers; ties go to the most purple.
39. Fewest workers on the board at round end (counts take-backs too).

## Measurements (greedy bots unless noted)
- Seat balance, 400 games at 4 players on gold/red/purple/green: wins 26/21/26/27%. At 3 players (300 games): 35/34/31%. Average followers are 44.7, against 48.0 with the blue stand-in, so it's a slightly lower-scoring table. Placements are about 12.2 per player against 12 base.
- How often each action is taken per game: Rest 3.0, Doze 2.9, Linger 2.0 (every round it's open), Rally 1.0, Slumber 0.8, Wake 0.4.
- Contest: somebody scores 97% of rounds, it's shared in 17%, and the wins are even by seat (355/347/338/335). Resting workers average 0.33 per player at round end. The winner gets about 3.7 followers from it, which is seasoning.
- Win rate of players who took each action (biased, but a fair ranking): Rally 36% sits next to Strike 35%. Linger 35% sits next to Windfall 33% and Trade 27%. Wake 29%. Slumber 28%. Doze and Rest 21%, which is the bottom tier with Grove and Bloom.
- Thinking bot, 20 games, 4 rollouts: it wins 75% on the Purple table against 55% on the stand-in table. It rests more than the greedy bots (0.30 against 0.18) and uses Wake 14 times where greedy bots almost never do. Planning pays here more than anywhere we've measured.
- Member value (handed over at round II start, 120–160 games each, ±1.5 noise): Second Wind 7.4–8.1 → 6. Night Crew 4.2–4.7 → 4. Hibernator 4.1, Moonlighter 4.3, Timekeeper 3.8–4.0, Straggler 2.6–3.7 → all 3. Hermit 3.6–4.1 → 4. Reveille 3.3 → 4. Insomniac 2.8 → 3. Dreamer 2.9, Rooster 2.5, Hourglass 2.4, Drifter 1.9 → 2. Lullaby 2.3 → 3 (it's harm, so priced up). Lamplighter 0.6–2.0 → 2. In the same runs, the references read Banker 3.3 and Twins 5.2.

## Watch
- Rest is a trap for greedy bots (21%) but a tool for the thinking bot. That's the push-your-luck working, but new players may read "skip a turn" as bad. Wake has to be explained as "the turns come back".
- The extra placements (Linger, Rally, Second Wind) are the real power. They're top-tier but not above Strike. Linger back onto the same space is the one to playtest.
- Back-to-back turns (Wake, Rally) brush against the rejected Tempo pitch (place-now / place-later). The difference: here a skipped turn becomes a visible resting worker you may never use. Cory should judge whether it still smells like Tempo.
- Moonlighter is narrow: only Linger takes workers back.
- Bots can't measure: the bluff of holding workers for the contest, Lullaby's feel-bad, or Linger denial.

## Engine notes (no core edits)
- Resting is tracked as p.rest/p.restRound (a stale round reads as 0). p.left stays "turns still scheduled". Extra turns are ordinary turn tasks put after the current turn; a skip removes the next one. It works through ctx.state.queue. A cleaner path would be ctx.skipTurn(p) / ctx.addTurns(p, n) helpers in core.js, plus a quadrant-level onRoundStart.
- Timekeeper uses the tier now passed to onBuyFollowers, and falls back to reading the log.
- UI needs a "resting" tray per player (lying-down workers). The contest is only readable if it's drawn.
- Files: src/engine/v4/content/purple.js, src/test/engine/v4/spheres/purple.test.js (30 tests, incl. 200 bot games), scripts/spheres/purple-{sim,value,thinker}.mjs.
