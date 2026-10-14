# Purple: extra turns (Claude's draft v3, 2026-10-14, nothing approved)

## The idea
Purple is the currency of time: gather it, then spend it to act again. Extra turns are the meal. Every placement brings a buy, so an extra turn is the strongest thing on the wheel, and it's priced that way.
Gold hoards money and Red stacks cheap members. Purple multiplies turns. Its contest counts something anyone can see: whose workers cover the most of the board.

## For Cory (answer by number; "(fill-in)" marks the critic's suggestions, which nobody has approved)
1. Scoring: most workers on the board at round end. Purple breaks ties.
2. Ring I, Hourly: +4 / +5 / +6 purple, by round.
3. Ring I, Catch Up (fill-in): +1 purple, and +2 per rival with more workers on the board than you.
4. Ring I, Wind-up: +1 purple per worker you have on the board, this one included.
5. Ring II, Linger: move one of your workers from an outer or middle space of another color to a different open space, and do that action.
6. Ring II, Overtime: pay 6 purple to take an extra turn right after this one. If you can't, +2 purple.
7. Ring III, Rally: pay 5 purple to take an extra turn right after this one. If you can't, +3 purple.
8. Second Wind (4+2): once per game, take an extra turn right after this one.
9. Errand Runner (2+2): when you recruit it, take an extra turn right after this one.
10. Taskmaster (3+1): once per round, pay 5 purple to take an extra turn right after this one.
11. Late Riser (3+1; the name is a fill-in, it was Straggler until that name went to the new rule-bender): from round II on, if you have the fewest followers at round start, you take an extra turn before anyone else.
12. Foreman (2+1): whenever you take an extra turn, +1 purple per worker you have on the board.
13. Courier (2+1): whenever you take an extra turn, +1 of each other color.
14. Apprentice (1+1): whenever you take an extra turn, your next member costs 2 less.
15. Overseer (2+1): whenever a rival takes an extra turn, gain half your purple (up to 4).
16. Double Time (3+1, fill-in): extra turns you pay purple for cost you half (rounded up).
17. Bookkeeper (2+1): at round end, +1 purple per 2 workers you have on the board.
18. Clockmaker (2+1): at round end, +1 purple per 2 purple you have. (A close cousin of Gold's interest/Investor ideas.)
19. Lamplighter (3+1): at round start, +1 purple per worker you get this round (3 / 4 / 5).
20. ~~Relay (2+2, fill-in): once per round, when a rival takes an extra turn, you may pay 3 purple to take one right after it.~~ Cut by Cory 2026-10-14. Purple has 14 members until a replacement is priced.
21. Patience (3+1): at game end, +1 follower per 3 purple. (A close cousin of Gold's Tycoon.)
22. Shift Crew (1+1): worth 2 followers. No effect.
House rule: every extra turn needs a space to spare (more open spaces than turns still to come), so nobody ever loses the last space. Linger counts as an extra turn for the members.

Cut: 23. Lend a Hand (a copy of Joint Venture). 24. Timekeeper. 25. Marathoner (it paid a third time for the same turns). 26. Rally as a free turn, and as two turns. 27. From v1: Rest, Doze, Wake, Slumber, Dreamer, Insomniac, Hibernator, Hermit, Moonlighter, Night Crew, Hourglass, Drifter, Rooster, Reveille, Lullaby. 28. Linger back onto the same space, or buying again.

## Value math (1 resource = 1u; an extra turn = a space plus its buy, about 3u in round I, 5u in round II, 7u in round III)
- Hourly, against Rush (2/4/6) and Joint Venture (4): 4 early, 6 late.
- Catch Up: 1 for whoever is level or ahead. 3–7 for whoever is behind on the board (usually whoever picks late in a pass, or a table where rivals chain turns). Measured as the weak space (21% taker win rate), which is fine as a consolation.
- Wind-up: 1–3 early, 3–6 late, more after extra turns.
- Linger, against Steal 3 (about 4u) and Windfall: one more action with no buy, about 3–5u in round II and 4–7u in round III. Measured at par (25–26%).
- Overtime: 6 purple becomes about 5–7u, so 0–1u net plus tempo; +2 without the purple. 33% taker win rate, against Strike at 34%.
- Rally, against Strike (gold ×2, about 10–20 late) and Take (one free member, 4–7u): 5 purple for a round-III turn (about 7u), so about 2u net plus tempo; +3 without the purple. The price came from the sim: at 3 purple takers won 45%, at 4 42%, at 5 36%, against Strike 34% and Take 29%. Priced at 5.

## Measurements (greedy bots, gold/red/purple/green)
- 400 games at 4 players (final prices): wins by seat 25/27/26/23%. Average followers 45.6 (stand-in table 47.8). About 12.5 placements per player against 12 base. Taker win rates: Strike 35%, Rally 32%, Overtime 29%, Take 29%, Linger and Catch Up near the bottom.
- 300 games at 3 players: wins by seat 32/33/35%.
- Dead air: one player rarely takes more than 3 turns in a row. The longest such run per game averages 2.7 (one run of 6 in 400 games) (the snake alone gives 2). Runs of 4 happen about once in 10 games, runs of 5 about once in 50. With Relay, a rival's extra turn is followed by at most one Relay turn (once per round, one copy). The longest Relay chain is 2: their extra turn, then yours.
- Contest when nobody takes extra turns: everyone is level on the board, so the purple tiebreak decides it. That's every round I, and about 56% of all rounds; 66% of rounds go to the tiebreak. Read honestly, Purple's contest is "most purple" most of the time, and "most workers" only once someone has bought turns.
- Member value (handed over at round II start, 120 games each, about ±1.5 noise; Banker reads 2.3 in the same run):
  - Changed this pass: Double Time 5.3 → 4. Lamplighter (relative) 4.9 → 4. Relay 4.1 → 4. Foreman (relative) 3.2 → 3. Overseer (half your purple) 2.4 → 3. Apprentice (2 less) 2.2 → 2.
  - Earlier pass: Second Wind 8.8, Taskmaster 5.4, Patience 4.9, Courier 4.5, Bookkeeper 4.5, Late Riser 4.1, Clockmaker 3.9, Shift Crew 3.8.
  - Errand Runner's effect fires on recruit, so handing it over can't measure it; it's priced as one turn on a fixed clock.
- Thinking bot (20 games, 4 rollouts): wins 65% (13/20, average margin +6.1) against 55% on the stand-in table. It plays slightly more Purple than the greedy bots (28% of its placements against 23%), grabs Catch Up early and saves Overtime and Rally for rounds II–III.

## Watch
- Round III still has the strongest pair (Rally and Overtime). With Double Time they cost 3 each.
- The contest mostly rewards purple held. If Cory wants the board count to matter, the cleanest fix is "ties: nobody scores" (I haven't measured it).
- Clockmaker and Patience are close cousins of Gold cards.

## Engine notes (no core edits)
- Extra turns are queued turn tasks right after the current turn (Relay's went after the rival's extra turn, before Relay was cut). Linger queues the engine's own act task. It all goes through ctx.state.queue. A ctx.addTurn(p, after) helper in core.js would be cleaner.
- Files: src/engine/v4/content/purple.js, src/test/engine/v4/spheres/purple.test.js, scripts/spheres/purple-{sim,value,thinker}.mjs.
