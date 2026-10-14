# Yellow: abundance (Claude's build, 2026-10-14, for Cory to answer by number)

Built from the old yellow quadrant ("getting various resources"). Code: `src/engine/v4/content/yellow.js`, tests: `src/test/engine/v4/spheres/yellow.test.js`, sims: `scripts/spheres/yellow-*.mjs`. Not on the default table; it registers itself in its tests and scripts.

## The idea
Yellow gathers every color and keeps them balanced: it scores on full sets (one of each color held), so you're torn between holding your rainbow to round end and breaking it to buy 6 followers, which needs 3 colors.
Gold piles up one color; Red buys many cheap members. Yellow cares about the shape of your pile, not its size, and it hands every color out, so it feeds every other sphere's members and the follower buys.

## The list (answer by number)
1. Scoring: most full sets at round end (a set is one of each color you hold). Need 1 to score; yellow breaks ties. It's visible state: anyone can count it.
Ring I
2. Harvest: +1 yellow per color you hold (yellow always counts). 1–4.
3. Bloom: +2 of each color you have none of. Strong right after a big buy empties you.
4. Transmute: swap any of your resources for other colors, one for one.
Ring II
5. Prism: +1 of each other color per 2 yellow you have (you keep the yellow).
6. Gather: each of your members brings you 1 of its color.
Ring III
7. Flourish: double your full sets (+1 of each color per full set you hold).
Members (cost = yellow + any)
8. Gardener (1): at round start, +1 of each color you have none of.
9. Peddler (1+1): at round start, +1 of each other color.
10. Pilgrim (1+1): when recruited, +1 of each color.
11. Late Bloomer (1+1): at round start, if you have the fewest followers (ties count), +1 of each color.
12. Sower (1+1): round start, plant any of your yellow; round end, gain that many of each other color.
13. Admirer (2+1): whenever a rival recruits a member of a color you have none of, +1 of that color.
14. Dyer (2+1): at round end, +1 yellow per color you hold.
15. Farmer (2+1): whenever an action gains you yellow, +1 more.
16. Weaver (2+1): whenever you buy 6 followers, +1 of each color.
17. Rainmaker (2+1): once per game, raise each of your colors to match your yellow.
18. Harmonist (3+1): game end, +1 follower per full set you hold.
19. Go-Between (2+2): whenever you recruit a non-yellow member, +1 of its color.
20. Explorer (2+2): whenever you take a space outside Yellow, +1 yellow.
21. Gleaner (3+2): whenever an action gains you 2+ of another color at once, +1 yellow.
22. Feastmaker (3+2): once per game, +1 of each color per round number.

## Extra ideas (one line each)
Ring I
23. Forage: +1 of each other color (your raw old Forage, made into a set-maker).
24. Share: +2 of a color you choose; every other player +1 of it.
25. Even Out: raise your smallest color to match your second smallest.
Ring II
26. Spectrum: +1 of each color per different color among your members.
27. Barter: give a rival 1 of any color; gain 3 of colors you choose.
28. Abundance: +1 of each color you hold, for you and the player with the fewest followers.
Ring III
29. Cornucopia: raise every color to match your largest (measured: far too strong with Gold piles; would need a cap).
30. Rainbow: +3 of each color you have the least of.
31. Bounty: everyone gains 1 of each color; you gain 1 of each per full set.
Members
32. Painter: your yellow counts as any color when you buy followers (needs a small engine change, below).
33. Matchmaker: whenever a rival completes a full set at round end, +1 yellow.
34. Twins of Dawn: counts as 2 members of 2 colors you choose.
35. Patron Saint: once per round, swap 2 of your resources for any colors.
Scoring alternatives
36. Most different colors held (0–4): simpler, but ties all the time (everyone holding 4 shares the full prize).
37. Most of your smallest color (same as full sets, phrased differently).
38. Fewest gaps: most colors where you hold 3+.

## Measurements (greedy bots unless said; table gold/red/yellow/green vs gold/red/blue/green)
- 200 seeded bot games (2–4 players) finish with every invariant holding; 30 unit tests pass.
- 400-game balance (4 bots): seat wins 26/23/26/25%, no seat edge. Avg followers 43 (blue table 48), members 11.9 (10.9). Bots end with ~42 unspent resources (blue table 25): Yellow floods colors faster than one buy a turn can spend them.
- Action use per game: Harvest, Transmute, Bloom (r1–r2), Gather and Flourish always taken; Prism only 26% in round II (greedy bots don't bank yellow), always in round III.
- Sets contest: spread evenly over seats; round I is almost never won (no one holds 4 colors yet, ~34% of rounds unscored); shared 4%.
- Member value (200 games each, card handed over at round II start): Feastmaker 6.8, Gleaner 6.1, Go-Between 6.1, Harmonist 5.8, Dyer 5.1, Admirer 5.0, Farmer 4.7, Explorer 4.3, Pilgrim 3.8, Peddler 3.6, Weaver 3.4, Sower 3.3, Rainmaker 2.9, Late Bloomer 2.9, Gardener 2.7. Same table, same method: Banker 4.4, Coin Purse 5.5, Speculator 5.6, Recruiter 7.0, Tycoon 13.6. Costs above set from these.
- Cut by the numbers on the way: Admirer on every rival recruit (18.6), Harmonist at +2 per set (18.3), Rainmaker "match your largest" (17.0, Gold piles made it absurd).
- Thinking bot (24 games, see THINKER line in the report).

## What to watch / can't measure
- Round I's +2 for sets mostly goes unclaimed with bots. A human aiming at it (Bloom with 2 colors in hand) takes it; worth one live test.
- Leftover resources: Yellow is rich but buys cap it. If it feels like waste, the fix is fewer resources per action, not more outlets.
- Transmute is many clicks (one per swap). The UI needs a +/- per color panel.
- Bots don't hold sets to round end on purpose or plan Prism banking: the hold-vs-spend tension is untested by greedy bots.
- Engine notes: the green stand-in hands out blue, which is dead on a table without Blue. For Painter (32), `wildColors` in core.js would need a per-player member flag (e.g. `wildInFollowerBuys: 'yellow'` on a member def).
