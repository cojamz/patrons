# Black: the thieves (Claude's build, revision 3, 2026-10-14)

Built and measured as `src/engine/v4/content/thieves.js` (tests: `src/test/engine/v4/spheres/thieves.test.js`; sims: `scripts/spheres/thieves-*.mjs`). On the table it replaces the green stand-in.

## The idea
Black makes nothing of its own. Black is loot, and stealing is the only way to get it: a pinch of resources, a member held to ransom, a heist. Gold piles up its own money and Red recruits many cheap members; Black grows only as fast as the table around it. Its loot sits in plain view, where the next thief can take it.

**Rulebook line:** stolen goods become black loot on a pile in front of you. The biggest pile at round end wins. Piles can be robbed, and at the next round start your pile joins your supply as black.

## For Cory (answer by number)
Costs are written as black + any.

Value = how much you gain on the average rival, in resources, with 4 players. You +1 and one rival −1 is worth 1⅓. The anchors:

| Anchor | Value |
|---|---|
| Joint Venture | 2⅔, flat |
| Rush | 2 in round I, 6 in round III |
| Steal | 4 |
| Windfall | about 3, then about 7 |
| Take | about 6 |
| Strike | about 8–15 |

1. **Scoring, Most loot:** the biggest loot pile at round end wins (rulebook line above).
2. **Ring I, Pickpocket:** take 2 / 3 / 4 resources (by round) from rivals, split as you like. Worth 2⅔ in round I (Joint Venture is 2⅔), 4 in round II, and 5⅓ in round III (Rush is 6).
3. **Ring I, Tip-off:** take 1 resource from each player holding more than you. Worth 1⅓ per richer rival: 0 to 4. It's catch-up, and it's worth 0 on the very first pick, when everyone holds 2.
4. **Ring I, Hideout:** take 1 resource from a rival; then no one can steal from you, resources or members, this round. Worth 1⅓ plus the theft you dodge: about 2½ in round I, and 4–5 in round III, when your members are safe too.
5. **Ring II, Rob:** take 3 resources from rivals, at least 1 from each. Worth 4 at any table size (Steal is 4), and still 4 in round III (Windfall is about 7).
6. **Ring II, Ransom:** pick a rival's member costing 3 or less; they pay you its cost to keep it, or it's yours. Worth about 4–5. The victim picks the cheaper outcome: paying 3 is worth 4 to you, losing the member about 6.
7. **Ring III, Heist:** take any rival's member; they recruit any face-up member costing up to the same, free. You get about 7. They lose 7 and get back up to about 5. Worth about 7⅔ (Take is about 6).

**Members** (one copy each):
8. Mole (1+0): at round start, take 1 resource from each player with more followers than you.
9. Desperado (1+0): while no one has fewer followers than you, your steals take double.
10. Cutpurse (1+1): at round start, take 1 resource from the rival holding the most.
11. Grifter (1+1): when recruited, take 1 resource per 2 members you have, from the rivals holding the most.
12. Sticky Fingers (1+1): your steals take 1 more resource.
13. Robin Hood (1+1): whenever you steal from the player with the most followers, +1 follower.
14. Crew (1+1): worth 2 followers.
15. Accomplice (2+1): when recruited, take 1 resource from each rival.
16. Extortionist (2+1): whenever a rival buys 6 followers, take 2 resources from them.
17. Watchdog (2+1): rivals can't take your members.
18. Double Agent (2+1): when recruited, swap it for any rival's member.
19. Kingpin (2+1): at game end, +1 follower per 2 black (loot counts).
20. Big Score (3+1): once per game, take half (rounded down) of the biggest pile any rival holds.
21. Light Fingers (2+2): whenever a rival recruits a member costing 4 or more, take 1 resource from them.
22. Lookout (3+3): whenever a rival steals from someone else, take 1 resource from the thief.

**Cut in this pass:** Safehouse, Snitch, Understudy, Lockbox, Burglar (defense was a tax), Mastermind (it counted past events), Shakedown (replaced by Tip-off), Fence, Fixer and Tipster (they gave free black).

"Steal" is now one shared rule in the engine. Every steal, Gold's Steal included, respects Hideout and Watchdog, and every steal sets off Lookout and Robin Hood. Sticky Fingers and Desperado also boost Gold's Steal. Stolen gold from Gold's Steal stays gold.

## Extra ideas (one line each)
**Ring I**
23. Lure: take a rival's member costing 2 or less; they get 2 resources from you.
24. Tip-off that grows: take 1 per round number from each player holding more than you.

**Ring II**
25. Double-Cross: swap one of your members for a rival's that costs up to 2 more.
26. Fence: swap any of your black for other colors, 1 for 1, then take 1 from any player.
27. Shake Down the Leaders: take 2 from each player with more followers than you.

**Ring III**
28. Grand Heist: take 1 of each color from every rival.
29. Clean Out: take half of one rival's biggest pile.
30. Crime Wave: take 2 from every rival.

**Members**
31. Pawnbroker: once per round, sell one of your members to a rival for twice its cost (they choose).
32. Insider: whenever a rival recruits a black member, take 1 from them.
33. Getaway Driver: whenever you steal, also gain 1 of the color you took.

**Other scoring rules** (all measure what players hold)
34. Most black: 19% of rounds have no winner, and it goes to the leader more often than loot does.
35. Fewest resources: it ties often and goes to the leader half the time.
36. Most members of other colors: it snowballs. Cut.

## Measurements
Greedy bots, 4 seats, gold/red/blue + Black, current engine. Gold's Steal now counts as a steal.
- **Scoring (400 games).** Most loot: the black contest went to the follower leader 18% of the time and to last place 54%. The same player won it in back-to-back rounds 45% of the time, every round had a winner, and the game winner won it at least once in 59% of games. Most black: 28% to the leader, 41% to last place, 19% of rounds with no winner, and the game winner won it at least once in 73% of games. Loot stays the pick.
- **Seat balance (loot):** 26/21/27/26 by seat and 29/22/26/24 by round-I pick order. The stand-in table is 18/28/26/29.
- **Followers:** 38 per player against 48 on the stand-in table. Black only moves value around, so the table is poorer. The first-to-last gap is unchanged (19.0 vs 18.2).
- **Who gets robbed:** about 56 resources a game change hands. That's 14 per player, up from 9, because Pickpocket now grows and Gold's Steal now counts. 61% of thefts take 1 from a victim, 24% take 2, and 15% take 3 or more (Gold's Steal and late Pickpockets). Members are taken 2.2 times a game. With bots that rob the biggest pile, units come from the leader 38%, 2nd 25%, 3rd 21% and 4th 16%; counting ties, last place supplies 25%. With bots that target the leader, it's 49% leader and 10% from 4th. Every final rank steals about the same (23–27% each). It doesn't bully last place, and it doesn't feed the leader.
- **Actions (forced as a seat's first pick of the round vs the bot's own choice; 200 games; followers; noise about ±1):**
  - Round I: Hire +2.0, Hideout +1.8, Pickpocket +1.1, Joint Venture +0.9, Rush +0.6, Tip-off +0.4.
  - Round II: Hire Up +2.6, Ransom +0.9, Steal −0.6, Rob −0.8, Windfall −1.8.
  - Round III: Take +0.4, Heist −0.1, Strike −2.9.
  - Ring-I actions taken in round III: Hideout +1.8, Rush +0.1, Pickpocket −0.6, Joint Venture −1.6, Tip-off −2.3.
  - Every Black action sits inside the anchors' band.
- **Member value (loot; a free recruit at the start of round II; 120 games each; noise about ±1.5):** Lookout 8.1, Light Fingers 5.5, Extortionist 4.5, Big Score 3.9, Watchdog 3.9, Accomplice 3.6, Double Agent 3.4, Cutpurse 3.1, Kingpin 3.1, Grifter 2.7, Robin Hood 2.5, Sticky Fingers 2.1, Mole 1.9, Desperado 1.7, Crew 0.6. Crew's 0.6 is noise plus turn order (2 followers is worth 2 on paper), so it's priced like Twins. Costs follow the ranking into Cory's range: 1–2 cheap, most 2–3, top 4–6.
- **Thinking bot (20 games):** see the end of this file.

## What to watch
- **Theft volume:** 14 resources a player per game, and bites of 2 or more now happen 39% of the time. If it feels like a tax in play, go back to a flat Pickpocket (2) first.
- **Lookout** measures like a win condition (8.1) because steals are everywhere now, Gold's included. It's priced at the top (6). If that's still too strong, make it once per round.
- **Hideout late:** it's the best ring-I action in round III (+1.8), because it shields members from Ransom and Heist.
- **What bots can't show:** whether it feels bad. Ransom puts the victim's decision on someone else's turn, and Heist lands right before round III scoring. They also don't target the loot leader late in a round.

## Engine changes (made in this pass)
- `ctx.canSteal(thief, victim, kind)`, `ctx.stealCount(thief, base)` and `ctx.steal(thief, victim, { take, uid, other, give, reaction })` in core.js. Quadrants and members can refuse with `guardSteal`, and react with `onSteal`. Members can add `stealMore` or set `stealDouble`.
- Gold's Steal now goes through `ctx.steal`. Its behavior is unchanged, and all v4 tests stay green.
- A quadrant-level `onRoundStart(ctx)` runs before members' round-start hooks. Black uses it to move loot piles into supplies.
- The relabel workaround is gone (core.js now pays a member's colored part in its quadrant's resource).
- Still open: the UI needs to show each player's loot pile and the Hideout marker. The bribe doesn't exist yet; when it's built, it should use `ctx.steal({ uid })`.

## Thinking bot
A seat that plans ahead (rollouts) against greedy bots won 85% of 20 games on the Black table. That's the same as the 85% it wins on the stand-in table, so Black neither rewards planning more nor breaks it. The thinker placed on Black 19% of the time, against 32% for the greedy bots, and it stole a bit less (12.7 vs 14.1 a game). Planners lean on Black less than greedy bots do.
