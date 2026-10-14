# Purple: extra turns (Claude's draft v2, 2026-10-14, nothing approved)

## The idea
Purple is the currency of time: you gather it, then spend it to act again. Extra turns are the meal. Every placement brings a buy, so an extra turn is the strongest thing on the wheel, and it's priced that way.
Gold hoards money and Red stacks cheap members. Purple multiplies turns, and its contest counts something anyone can see: whose workers cover the most of the board.

v2 re-centers on extra turns. Resting and deferring turns are gone: they read as the rejected Tempo pitch, and losing a turn felt bad.

## For Cory (answer by number)
1. Scoring: most workers on the board at round end. Purple breaks ties. Extra turns put more of your workers out, so you can see who's ahead at a glance.
2. Ring I, Hourly: +1 purple per worker you get this round, +1 (4 / 5 / 6).
3. Ring I, Lend a Hand: +3 purple, and +1 purple to a player you choose.
4. Ring I, Wind-up: +1 purple per worker you have on the board, this one included.
5. Ring II, Linger: move one of your workers from an outer or middle space of another color to a different open space, and do that action.
6. Ring II, Overtime: pay 6 purple to take an extra turn right after this one. If you can't, +2 purple.
7. Ring III, Rally: take an extra turn right after this one.
8. Second Wind (4+2): once per game, take an extra turn right after this one.
9. Errand Runner (2+2): when you recruit it, take an extra turn right after this one.
10. Taskmaster (3+1): once per round, pay 5 purple to take an extra turn right after this one.
11. Straggler (3+1): from round II on, if you have the fewest followers at round start, you take an extra turn before anyone else.
12. Foreman (2+1): whenever you take an extra turn, +2 purple.
13. Courier (2+1): whenever you take an extra turn, +1 of each other color.
14. Apprentice (1+1): whenever you take an extra turn, your next member costs 1 less.
15. Overseer (3+1): whenever a rival takes an extra turn, +1 purple.
16. Timekeeper (1+1): whenever a rival buys 6 followers, +1 purple.
17. Bookkeeper (2+1): at round end, +1 purple per 2 workers you have on the board.
18. Clockmaker (2+1): at round end, +1 purple per 2 purple you have.
19. Lamplighter (1+1): at round start, +2 purple.
20. Marathoner (4+2): at game end, +1 follower per worker you have on the board.
21. Patience (3+1): at game end, +1 follower per 3 purple.
22. Shift Crew (1+1): worth 2 followers. No effect.
House rule for every extra turn: it only happens if there's a space to spare (more open spaces than turns still to come). So nobody ever loses the last space. Linger counts as an extra turn for the members.

Cut (from v1): 23. Rest. 24. Doze. 25. Wake. 26. Slumber. 27. Dreamer. 28. Insomniac. 29. Hibernator. 30. Hermit. 31. Moonlighter. 32. Night Crew. 33. Hourglass. 34. Drifter. 35. Rooster. 36. Reveille. 37. Lullaby. 38. The old Lamplighter (+1 per worker; it was a Banker clone, so it's trimmed to +2). 39. Linger going back to the same space (that's Echo's), and Linger buying again. 40. Rally as two extra turns (53% taker win rate, too strong).

## Value math (1 resource = 1u; an extra turn = a space plus its buy, about 3u in round I, 5u in round II, 7u in round III)
- Hourly, against Rush (2/4/6) and Joint Venture (4): 4 in round I, 6 in round III. Steady and plain.
- Lend a Hand: Joint Venture's twin, 3 for you and 1 for a rival, early and late. The weak version.
- Wind-up: 1–3 in round I, about 3–6 in round III, more after extra turns. It rewards the scoring state.
- Linger, against Steal 3 (about 4u) and Windfall (about 4–10): it's one more action with no buy. That's the best open space, about 3–5u in round II and 4–7u in round III. Measured at par (26% taker win rate, next to Windfall 26%).
- Overtime: 6 purple becomes an extra turn worth about 5u in round II and 7u in round III. That's about 0–1u net, plus tempo; without the purple it's +2. The price came from the sim: at 4 purple takers won 47%, at 5 43%, at 6 37%.
- Rally, against Strike (gold ×2, about 10–20 late) and Take (one free member, 4–7u): one free round-III turn, about 7u. Measured the strongest action at the table (43% against Strike and Take at 26–27%). It's the line to watch; the next trim would be "pay 3 purple".
- Price every free extra turn as a free turn: Second Wind measured 8.8 followers (cost 6), and Errand Runner is the same turn on a fixed clock (cost 4).

## Measurements (greedy bots, gold/red/purple/green)
- 400 games at 4 players: wins by seat 27/22/26/26%. Average followers 46.7 (stand-in table 47.8). About 12.9 placements per player against 12 base.
- 300 games at 3 players (with Overtime at 4 purple): wins by seat 31/33/36%.
- Takes per game: Hourly, Lend a Hand and Wind-up 3.0 each (all full every round), Linger 2.0, Rally 1.0, Overtime 1.2 (0.3 in round II, 0.9 in round III).
- Contest: somebody always scores. Shared 14%. Wins even by seat (375/363/402/394). The winner gets 7.3 followers from it, about 16% of their total. No single move wins it, so v1's "one rest wins 97% of the time" is gone.
- Dead air: one player rarely takes more than 3 turns in a row. Per game, the longest such run averages 3.0 (the snake alone gives 2). Runs of 4 happen about once in 6 games, and runs of 5 about once in 60. 97 extra turns in 400 games were refused because there was no spare space, mostly in round I.
- Member value (handed over at round II start, 120 games each, about ±1.5 noise): Timekeeper 9.3 at +3, Bookkeeper 7.8 at +1 per worker and Overseer 6.1 at +2 were all too strong, so I cut their effects. Second Wind 8.8, Marathoner 7.2, Taskmaster 5.4, Patience 4.9, Foreman 4.5, Courier 4.5, Straggler 4.1, Clockmaker 3.9, Shift Crew 3.8, Lamplighter 3.6, Apprentice 2.3 (Banker reads 3.4 in the same run). Errand Runner can't be measured by handing it over, because its effect fires on recruit; it's priced by math. Re-measured after the trims: see the report.
- Thinking bot (20 games): see the report.

## Watch
- Rally and Overtime are the strong pair. That's the meal, but a round-III player with both plus Second Wind takes 3–4 turns in a row.
- The board contest leans toward "most purple" whenever nobody took an extra turn (the purple tiebreak decides it).
- Bots can't judge denial (taking Rally or Overtime to keep them from the leader) or the feel of waiting while someone else chains turns.

## Engine notes (no core edits)
- Extra turns are queued turn tasks right after the current turn. Linger queues the engine's own act task. It all goes through ctx.state.queue. Cleaner would be a ctx.addTurn(p) helper in core.js.
- Timekeeper uses the tier now passed to onBuyFollowers.
- Files: src/engine/v4/content/purple.js, src/test/engine/v4/spheres/purple.test.js, scripts/spheres/purple-{sim,value,thinker}.mjs.
