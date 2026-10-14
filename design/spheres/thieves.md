# Black: the thieves (Claude's build, 2026-10-14)

Built and measured as `src/engine/v4/content/thieves.js` (tests: `src/test/engine/v4/spheres/thieves.test.js`; sims: `scripts/spheres/thieves-*.mjs`). On the table it replaces the green stand-in.

## The idea
Black grows by taking from the table: a pinch of resources here, a member there, held to ransom or lifted outright. Gold piles up its own money and Red recruits many cheap members; Black makes nothing of its own. Its engine is everyone else's engine, so it gets stronger when the table is rich, and its stolen goods sit in plain view where they can be stolen back.

## For Cory (answer by number)
Costs are written as black + any.

**Scoring**
1. Most loot: what you steal goes on your loot pile in front of you (as black). The biggest pile at round end wins. Other thieves can rob a loot pile, and at the next round start your pile joins your supply (round III's pile only counts for the contest). *(recommended; see measurements)*

**Ring I**
2. Pickpocket: take 2 resources from players, split however you like.
3. Hideout: +3 black. Rivals can't steal from you (or your loot) this round.
4. Fence: +2 black, and +1 more for each rival holding more resources than you.

**Ring II**
5. Rob: take 3 resources from players, split however you like.
6. Ransom: pick a rival's member costing 4 or less. They pay you its cost to keep it, or it's yours.

**Ring III**
7. Heist: take any rival's member. They recruit the cheapest face-up member, free.

**Members** (one copy each; costs set from the member-value sim)
8. Cutpurse (1+0): at round start, take 1 resource from the rival holding the most.
9. Accomplice (1+0): when recruited, take 1 resource from each rival.
10. Desperado (1+0): while no one has fewer followers than you, your steals take double.
11. Sticky Fingers (1+1): your steals take 1 more resource.
12. Robin Hood (1+1): whenever you steal from the player with the most followers, +1 follower.
13. Fixer (1+1): whenever you take a Black space, +1 black.
14. Safehouse (1+2): whenever a rival steals from you, +2 black.
15. Understudy (1+2): whenever a member is taken from you, recruit the cheapest face-up member, free.
16. Watchdog (2+1): rivals can't take your members.
17. Double Agent (2+1): when recruited, swap it for any rival's member.
18. Kingpin (2+1): at game end, +1 follower per 2 black (loot counts).
19. Mastermind (2+1): at game end, +2 followers per member you took from a rival.
20. Lookout (2+2): whenever a rival steals, +1 black.
21. Extortionist (2+2): whenever a rival buys followers, take 1 resource from them.
22. Burglar (3+2): once per game, take any rival's member. They recruit the cheapest face-up member, free.

Every steal is from anyone (like Gold's Steal), and "steal" means anything Black takes: resources, loot or members. Stolen resources always turn black in your hands.

## Extra ideas (one line each)
**Ring I**
23. Lure: take a rival's member costing 2 or less; they gain 2 black. (Built and cut: with it, members were taken 6 times a game and Watchdog became the best card in the deck.)
24. Shakedown: each rival gives you 1 resource of their choice.
25. Tip-off: +2 black, and the player holding the most resources gives you 1.
26. Stakeout: +1 black per resource stolen so far this round, by anyone.

**Ring II**
27. Double-Cross: swap one of your members for a rival's that costs more.
28. Shake Down the Leader: take 2 resources from each player with more followers than you.
29. Smuggle: +2 black, then swap any of your black for other colors, 1 for 1.

**Ring III**
30. Grand Heist: take 1 of each color from every rival.
31. Clean Out: take half of one rival's biggest pile.
32. Crime Wave: take 2 resources from every rival.

**Members**
33. Snitch: whenever a member is taken from you, take 2 resources from the thief.
34. Pawnbroker: once per round, give a rival one of your members for twice its cost in their resources (they choose to accept).
35. Gang: counts as 2 members; can't be taken.
36. Getaway Driver: whenever you steal, also gain 1 of the color you took.
37. Insider: whenever a rival recruits a black member, take 1 resource from them.

**Other scoring rules** (all measure what players hold)
38. Most black: like the Crown, but for stolen goods. Next best in the sims.
39. Fewest resources (the hidden thief): everyone qualifies, so it rewards spending everything. Odd fit for a sphere that takes things.
40. Most members of other colors (not black): it snowballs to the leader. Cut.
41. Most members taken from rivals, kept face up and marked: visible, but rare (about 3 a game), so most rounds tie at 0 or 1.

## Measurements
Greedy bots, 4 seats, gold/red/blue + Black. Units are resources (a member counts as 1).
- **Scoring, 400 games each.** Most loot: the black contest went to the follower leader 20% of the time and to last place 51%. The same player won it in back-to-back rounds 41% of the time, and the game winner won it at least once in 61% of games. Most black: 29% / 43% / 56% / 69%, and no one scored 11% of the time. Most members of other colors: 56% / 24% / 62% / 92%, so it snowballs. Fewest resources: 46% / 27%, with 18% ties. Loot is the only rule that never feeds the leader and always has a winner.
- **Seat balance (loot):** 27/24/23/27 by seat and 23/26/25/26 by round-I pick order. The stand-in table is 23/26/19/33, so Black flattens the last-pick edge.
- **Followers:** about 42 per player against 48 on the stand-in table. Stealing moves value around instead of making it, so Black tables score lower. That's the Dominion-style variance Cory allows. The first-to-last gap is unchanged (18.1 vs 18.8).
- **Who gets robbed:** about 28 resources a game change hands in about 25 thefts. That's about 7 per player a game, and almost everyone gets robbed. 95% of thefts take only 1 from any one victim per move. Members are taken 3.4 times a game, and a ransom is paid about once a game. With bots that rob the biggest pile, units come from the leader 37%, 2nd 26%, 3rd 21% and 4th 17%. Counting ties for last, last place supplies 26% (a fair share is 25%). With bots that target the leader, it's 63% leader and 10% last. With random targets, it's still 34% leader and 15% 4th, because the rich simply have more to take. Every seat steals about the same amount (24–26% each by final rank). So it doesn't bully the last player, and the leader doesn't do more of the stealing than anyone else.
- **Actions (forced as a seat's first pick, followers vs the bot's own choice, 160 games):** Ring I: Pickpocket +1.1 and Fence +1.1, against Joint Venture +0.5 and Rush +1.5; Hideout +0.7. Ring II: Rob +1.1 and Ransom +1.6, against Steal +0.1 and Hire Up +2.1. Ring III: Heist +0.3, against Take +0.1 and Strike −2.2 (bots misplay Strike). Every Black action sits inside the band of Cory’s anchors. Black spaces are taken almost every round (Pickpocket is skipped in about 1 round II in 8).
- **Member value (loot, 120 games each, a free recruit at the start of round II):** Burglar 5.8, Safehouse 5.1, Lookout 4.9, Extortionist 4.5, Watchdog 4.2, Understudy 3.8, Mastermind 3.2, Fixer 3.1, Double Agent 2.7, Kingpin 2.6, Sticky Fingers 2.5, Robin Hood 2.4, Desperado 1.7, Cutpurse 1.6, Accomplice 1.3. Costs follow these (Gold's scale is Tycoon 7.5 → cost 6, Merchant 3.9 → 3).
- **Thinking bot:** see the end of this file.

## What to watch
- Defense and consolation (Safehouse, Watchdog, Understudy, Lookout) measured above most of the offense. Theft is common enough that insurance pays. If it starts to feel like a tax, cut how often theft happens rather than adding more defense.
- The loot contest leans to whoever picks first, which is usually last place. Round I is effectively won by taking Pickpocket (the only steal open). That's catch-up, and Cory's call.
- Bots can't feel "bad", so no measurement covers it. Things to watch in play: Ransom puts the victim's decision on someone else's turn, and Heist in round III takes someone's best card right before scoring.
- What we can't measure: greedy bots never hold loot back, never hide on purpose before a big round, and never target a rival to deny a contest. Real players will rob the loot leader late in a round.

## Engine changes this needs (not made; core.js untouched)
1. A quadrant whose id isn't its resource ('thieves' / 'black'): `paymentPlan` and `memberPayOk` read `p.res[def.quadrant]`. They should read `p.res[quadrant(def.quadrant).resource]`. For now `install()` relabels Black's member cards as quadrant 'black', so `countMembersOfColor(p, 'black')` works, and the UI's `var(--black)` color would too.
2. Loot piles join the supply at round start: add a quadrant-level `onRoundStart(ctx)` (run before members' round-start hooks). Scripts and tests call `releaseLoot(state)` by hand for now. The thinker's rollouts don't release loot, so they undervalue it a little.
3. One shared `ctx.steal(thief, victim, what)` with an `onSteal` hook. Then Gold's Steal and the bribe count as stealing (loot pile, Hideout protection, Lookout, Safehouse, Robin Hood). Today only Black's own steals count.
4. An activated member that asks a question (Burglar) gets its question after the re-offered buy, because the engine queues the buy first. That's harmless, but the order reads oddly.
5. The scoring rule is switched module-wide with `setScoring(mode)` (prototype only). When Cory picks one, hard-code it.
