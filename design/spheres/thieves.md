# Magenta: the thieves (module id `thieves`; Claude's build, revision 4, 2026-10-14)

Built and measured as `src/engine/v4/content/thieves.js` (tests: `src/test/engine/v4/spheres/thieves.test.js`; sims: `scripts/spheres/thieves-*.mjs`). On the table it replaces the green stand-in.

## The idea
Magenta makes nothing of its own: it takes from the table, resources and members alike. Whatever you steal turns magenta in your supply, ready to spend on your next buy. Gold piles up its own money and Red recruits many cheap members. Magenta grows only as fast as the table around it, and the ring rewards keeping a crew of Magenta members.

**Rulebook line:** whatever you steal turns magenta in your supply, ready to spend. Most Magenta members at round end wins.

## For Cory (answer by number)
Costs are written as magenta + any. ✱ marks a card that changed in this pass.

Value = how much you gain on the average rival, in resources, with 4 players. You +1 and one rival −1 is worth 1⅓. The anchors work out to:

| Anchor | Value |
|---|---|
| Joint Venture | 2⅔, flat |
| Rush | 2 in round I, 6 in round III |
| Steal | 4 |
| Windfall | about 3, then about 7 |
| Take | about 6 |
| Strike | about 8–15 |

1. ✱ **Scoring, Most Magenta members:** the most Magenta members at round end takes the ring. A Magenta member you steal counts for you.
2. **Pickpocket (I):** take 2 / 3 / 4 resources (by round) from rivals, split as you like. Worth 2⅔ in round I, 4 in round II and 5⅓ in round III (Rush is 6).
3. **Tip-off (I):** take 1 resource from each player holding more than you. Worth 1⅓ per richer player (0–4). It's catch-up, and it's worth 0 on the very first pick, when everyone holds 2.
4. **Hideout (I):** take 1 resource from a rival; then no one can steal from you, resources or members, this round. Worth about 2½ in round I and 4–5 in round III.
5. **Rob (II):** take 3 resources from rivals, at least 1 from each. Worth 4 at any table size (Steal is 4; Windfall is about 7 late).
6. **Ransom (II):** pick a rival's member costing 3 or less; they pay you its cost to keep it, or it's yours. Worth about 4–5.
7. **Heist (III):** take any rival's member; they recruit any face-up member costing up to the same, free. Worth about 7⅔ (Take is about 6).
8. ✱ Kingpin (1+0): at game end, +1 follower per 2 magenta.
9. ✱ Desperado (1+1): while no one has fewer followers than you, your steals take double.
10. ✱ Mole (1+1): at round start, take 1 resource from each player with more followers than you.
11. Cutpurse (1+1): at round start, take 1 resource from the rival holding the most.
12. Robin Hood (1+1): whenever you steal from the player with the most followers, +1 follower.
13. Crew (1+1): worth 2 followers.
14. ✱ Big Score (1+1): once per game, take half (rounded down) of the magenta held by the rival with the most magenta.
15. ✱ Lookout (2+1): once per round, when a rival steals from someone else, take 1 resource from the thief.
16. Grifter (2+1): when recruited, take 1 resource per 2 members you have, from the rivals holding the most.
17. Extortionist (2+1): whenever a rival buys 6 followers, take 2 resources from them.
18. Watchdog (2+1): rivals can't take your members.
19. Double Agent (2+1): when recruited, swap it for any rival's member.
20. ✱ Sticky Fingers (2+2): your steals take 1 more resource.
21. ✱ Light Fingers (2+2): whenever a rival recruits a member costing 4 or more, take 1 resource from them.
22. ✱ Accomplice (2+2): when recruited, take 1 resource from each rival.

Changes this pass:
- **Gone:** loot piles (stolen goods are spendable at once) and the engine's quadrant round-start hook, which nothing else used.
- **Renamed:** the color, from black to magenta.
- **Scoring:** now most Magenta members.
- **Big Score and Kingpin:** now read magenta.
- **Lookout:** now once per round. It measured 11.9 followers when it fired on every steal.
- **Costs:** re-set from the new member-value run.

Cut in earlier passes: Safehouse, Snitch, Understudy, Lockbox, Burglar, Mastermind, Shakedown, Fence, Fixer, Tipster.

## Extra ideas (one line each)
23. Lure (I): take a rival's member costing 2 or less; they get 2 resources from you.
24. Tip-off that grows (I): take 1 per round number from each player holding more than you.
25. Double-Cross (II): swap one of your members for a rival's that costs up to 2 more.
26. Shake Down the Leaders (II): take 2 from each player with more followers than you.
27. Grand Heist (III): take 1 of each color from every rival.
28. Crime Wave (III): take 2 from every rival.
29. Pawnbroker (member): once per round, sell one of your members to a rival for twice its cost (they choose).
30. Getaway Driver (member): whenever you steal, also gain 1 of the color you took.
31. Other scoring, most magenta: 19% of rounds have no winner, and the same player wins back-to-back rounds 50% of the time (measured in the last pass).

## Measurements
Greedy bots unless noted, 4 seats, gold/red/blue + Magenta, current engine. Gold's Steal counts as a steal.
- **Scoring (most Magenta members, 400 games):**
  - Rounds with no winner: 1%.
  - Ties: 28% of rounds, about 1.4 winners on average.
  - Went to the follower leader 40% of the time, to last place 41%.
  - **The same player won back-to-back rounds 85% of the time**, and the game winner took it at least once in 71% of games.
  - For comparison, last pass's most magenta: 20% of rounds with no winner, 27% to the leader, 43% to last place, 50% back-to-back.
- **Seat balance:** 25/24/27/24 by seat and 24/25/26/26 by round-I pick order. The stand-in table is 24/18/26/32.
- **Followers:** about 41 per player against 47 on the stand-in table. The first-to-last gap is 19.9 against 16.9.
- **Who gets robbed:** about 55 resources a game change hands, 14 per player. 61% of thefts take 1 from a victim, 25% take 2, 14% take 3 or more. Members are taken 2.7 times a game.
  - With bots that rob the biggest pile, units come from the leader 34%, 2nd 28%, 3rd 21%, 4th 17%. Counting ties, last place supplies 27%.
  - With bots that target the leader, it's 45% leader and 12% from 4th.
  - Every final rank steals about the same (22–29% each).
- **Member value** (most-Magenta-members scoring; free recruit at the start of round II; 120 games each; noise about ±1.5): Lookout 11.9 (before the once-per-round change; 5.6 after), Sticky Fingers 7.7, Light Fingers 7.3, Accomplice 7.0, Grifter 6.2, Watchdog 5.8, Extortionist 5.6, Desperado 5.3, Robin Hood 5.3, Double Agent 5.2, Mole 5.0, Cutpurse 4.7, Big Score 4.2, Crew 4.1, Kingpin 3.2. Every Magenta member is now also a ring token, so they all measure high. Costs follow the ranking.
- **Actions** (last pass; this change doesn't touch them): every Magenta action sits inside the anchors' band. Hideout is the best ring-I action in round III, because it shields members.
- **Thinking bot:** see the end of this file.

## What to watch
- **Sticky ring:** most Magenta members repeats 85% of the time, because members stay put unless Heist or Ransom moves them. It's the same runaway Red's "most members" had. If it settles too early, the fix is the scoring rule, not the cards.
- **Theft volume:** 14 a player per game. A flat Pickpocket (2) is the first lever if it feels like a tax.
- **UI:** the color map needs `--magenta:#d4508f` (readable on the dark table) and `--thieves:#d4508f`. Cards style with `var(--<quadrant id>)` and resources with the resource name. Hideout also needs a marker on the player.
- **Bots** don't buy Magenta members to chase the ring, and they can't tell whether stealing feels bad.

## Engine (in core.js)
- `ctx.canSteal`, `ctx.stealCount` and `ctx.steal(thief, victim, { take, uid, other, give, reaction })`.
- Quadrants and members can refuse a steal with `guardSteal`, react with `onSteal`, and boost steals with `stealMore` or `stealDouble`.
- Gold's Steal goes through it.
- The quadrant-level `onRoundStart` was removed with the loot piles.
