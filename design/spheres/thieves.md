# Black: the thieves (Claude's build, redo 2026-10-14)

Built and measured as `src/engine/v4/content/thieves.js` (tests: `src/test/engine/v4/spheres/thieves.test.js`; sims: `scripts/spheres/thieves-*.mjs`). On the table it replaces the green stand-in.

## The idea
Black makes nothing of its own. Black is loot, and you only get it by stealing: a pinch of resources, a member held to ransom, a heist. Gold piles up its own money and Red recruits many cheap members, while Black grows only as fast as the table around it. Its loot sits in plain view, where the next thief can take it.

## For Cory (answer by number)
Costs are written as black + any. "Steal" means anything Black takes. Steals can hit anyone, as with Gold's Steal.

**Scoring**
1. Most loot. What you steal goes on a loot pile in front of you (as black). The biggest pile at round end wins. Other thieves can rob a loot pile. At the next round start, your pile joins your supply as black, and only round III's pile is kept just for the contest.

**Actions.** Value = how much you gain on the average rival, in resources (4 players). You +1 and one rival −1 is worth 1⅓. The anchors work out to: Joint Venture 2⅔ (flat); Rush 2 / 6; Steal 4; Windfall about 3 / about 7 (+1 per member); Take about 6 (a member worth about cost + 1½); Strike about 8–15.

2. Ring I, Pickpocket: take 2 resources in total, from any players. Value 2 + ⅔ = 2⅔ in round I and still 2⅔ in round III. Same as Joint Venture, and flat like it.
3. Ring I, Shakedown: the rival holding the most gives you 2 resources of their choice. Value 2⅔, but they pick, so it's worth about 2⅓, flat. This is the weak twin of Pickpocket, and it always hits whoever is richest.
4. Ring I, Hideout: take 1 resource from any player; then rivals can't steal from you this round. Value 1⅓ plus the theft you dodge: about 1 in round I (2⅓ total) and 3 or more in round III, when your members are safe too (4½ or more). It's the one ring-I action that grows.
5. Ring II, Rob: take 1 resource from each rival. Value 3 + 1 = 4 with 4 players, the same as Steal, and still 4 in round III, where Windfall is about 7. Weaker with fewer players: 3 with 3, 2 with 2.
6. Ring II, Ransom: pick a rival's member costing 3 or less; they pay you its cost to keep it, or it's yours. The victim picks the cheaper outcome: paying 3 is worth 4, losing the member about 6. So about 4–5, steady across rounds.
7. Ring III, Heist: take any rival's member; they recruit the cheapest face-up member, free. You get their best (about 7). They lose 7 but get back about 2½. Value about 8½, against Take 6 and Strike 8–15.

**Members** (one copy each; costs from the member-value sim)
8. Lockbox (1+0): rivals can't take your black or your loot.
9. Sticky Fingers (1+1): your steals take 1 more resource.
10. Cutpurse (1+1): at round start, take 1 resource from the rival holding the most.
11. Snitch (1+1): whenever a member is taken from you, take 2 resources from the thief.
12. Understudy (1+1): whenever a member is taken from you, recruit the cheapest face-up member, free.
13. Accomplice (2+1): when recruited, take 1 resource from each rival.
14. Desperado (2+1): while no one has fewer followers than you, your steals take double.
15. Robin Hood (2+1): whenever you steal from the player with the most followers, +1 follower.
16. Extortionist (2+1): whenever a rival buys followers, take 1 resource from them.
17. Kingpin (2+1): at game end, +1 follower per 2 black (loot counts).
18. Safehouse (2+2): whenever a rival steals from you, take 1 back.
19. Lookout (2+2): whenever a rival steals from someone else, take 1 resource from the thief.
20. Watchdog (2+2): rivals can't take your members.
21. Double Agent (2+2): when recruited, swap it for any rival's member.
22. Burglar (3+2): once per game, take any rival's member; they recruit the cheapest face-up member, free.

No action or member hands out black for nothing. The only other black source is picking it as a starting resource. Safehouse, Lookout and Snitch are counter-steals, and they never set off another counter-steal.

## Extra ideas (one line each)
**Ring I**
23. Pickpocket that grows: take 1 resource per round number, plus 1 (2 / 3 / 4). This is the fix if Cory wants ring I to scale.
24. Lure: take a rival's member costing 2 or less; they get 2 back from you. (Cut once already: too many members changed hands.)
25. Tip-off: take 1 resource from each player holding more than you.

**Ring II**
26. Double-Cross: swap one of your members for a rival's that costs up to 2 more.
27. Shake Down the Leaders: take 2 resources from each player with more followers than you.
28. Fence: swap any of your black for other colors, 1 for 1, then take 1 from any player.

**Ring III**
29. Grand Heist: take 1 of each color from every rival.
30. Clean Out: take half of one rival's biggest pile.
31. Crime Wave: take 2 resources from every rival.

**Members**
32. Pawnbroker: once per round, give a rival one of your members for twice its cost in their resources (they choose).
33. Getaway Driver: whenever you steal, the victim can't steal from you until round end.
34. Gang: counts as 2 followers; can't be taken.
35. Insider: whenever a rival recruits a black member, take 1 resource from them.

**Other scoring rules** (all measure what players hold)
36. Most black: the Crown, for stolen goods. A quarter of rounds have no winner.
37. Fewest resources (the hidden thief): everyone qualifies, but it ties a lot and goes to the leader half the time.
38. Most members of other colors (not black): it snowballs. Cut.

## Measurements
Greedy bots, 4 seats, gold/red/blue + Black, run after the Twins/Big Family change.
- **Scoring (400 games each).** Per rule: share of the black contest won by the follower leader, by last place, by the same winner as last round, and how often the game winner won it at least once. Most loot: 19% / 58% / 49% / 58%, with no round left without a winner. Most black: 25% / 43% / 48% / 66%, and 25% of rounds had no winner. Fewest resources: 48% / 32% / 49% / 72%. Most members of other colors: 58% / 25% / 77% / 89%, so it snowballs. Loot is the only rule that never feeds the leader and always has a winner. It leans to whoever picks first, usually last place, which makes it catch-up.
- **Seat balance (loot):** 26/19/25/30 by seat and 26/26/22/26 by round-I pick order. The stand-in table is 18/28/26/28.
- **Followers:** 38 per player against 48 on the stand-in table. Black now makes no resources at all; it only moves them. So a Black table scores about 20% lower. The first-to-last gap barely moves (19.7 vs 18.2).
- **Who gets robbed:** about 38 resources a game change hands. That's about 9 per player, and 95% of thefts take 1 from any one victim per move. Members are taken 2.5 times a game, and a ransom is paid 1.3 times. Units come from the leader 36%, 2nd 27%, 3rd 21% and 4th 16%. Counting ties, last place supplies 25%. Thieves are spread evenly by final rank (22/25/24/29%). With bots that target the leader instead, last place supplied only 10% (earlier build). It doesn't bully last place, and the leader doesn't out-steal anyone.
- **Actions (forced as a seat's first pick of the round vs the bot's own choice, 200 games; followers; noise about ±1):** Ring I: Joint Venture +0.7, Shakedown −0.1, Hideout −0.2, Pickpocket −0.8, Rush −1.8. Ring II: Ransom −0.5, Steal −1.8, Windfall −2.4, Rob −2.5. Ring III: Heist +0.1, Take −0.6, Strike −4.3. Taken late, in round III: Rush −1.4, Hideout −1.7, Joint Venture −2.9, Shakedown −3.8, Pickpocket −4.1. Every Black action sits inside the anchors' band. Pickpocket and Shakedown go flat late, just like Joint Venture.
- **Member value (loot, a free recruit at the start of round II, 120 games each):** Burglar 7.8, Safehouse 6.6, Double Agent 6.5, Watchdog 6.5, Lookout 6.0, Kingpin 5.5, Robin Hood 5.1, Extortionist 5.1, Desperado 5.0, Accomplice 5.0, Snitch 5.0, Cutpurse 4.8, Understudy 4.6, Sticky Fingers 3.5, Lockbox 3.3. Every member reads high on this poorer table, so the costs follow the ranking rather than the raw numbers.
- **Thinking bot (20 games each):** it won 70% on the Black table against 85% on the stand-in table. It placed on Black 18% of the time against the greedy bots' 31%, and it stole 7.5 a game against their 8.9. Black adds noise more than it rewards planning. Caveat: the thinker's look-ahead can't see loot piles joining supplies, so it undervalues stealing a little.

## What to watch
- A poorer table: 38 followers against 48, because Black only moves value around. That's fine by "score scale varies by table", but follower buys and pricey members come later on a Black table.
- Pickpocket and Shakedown are flat like Joint Venture. If ring I must scale, idea 23 is the fix.
- Defense and consolation (Safehouse, Watchdog, Lookout) measure near the top, because theft is common: about 9 resources per player a game. If it starts to feel like a tax, cut the number of steals rather than adding more defense.
- What bots can't show: whether it feels bad (Ransom puts the victim's decision on someone else's turn; Heist takes your best card right before round III scoring), and real targeting (people will rob the loot leader late in a round, and hide before a big round).

## Engine changes this needs (not made; core.js untouched)
1. A quadrant whose id isn't its resource ('thieves' / 'black'): `paymentPlan` and `memberPayOk` read `p.res[def.quadrant]` and should read `p.res[quadrant(def.quadrant).resource]`. For now `install()` relabels Black's member cards as quadrant 'black', which also suits the UI's `var(--black)`.
2. Loot piles join the supply at round start: a quadrant-level `onRoundStart(ctx)`. Scripts and tests call `releaseLoot(state)` by hand. The UI must show each player's loot pile.
3. A shared `ctx.steal(thief, victim, what)` with an `onSteal` hook, so Gold's Steal and the bribe count as stealing (loot pile, Hideout, Lockbox, Safehouse, Lookout, Robin Hood). Today only Black's own steals do.
4. Burglar's question comes after the re-offered buy, because the engine queues the buy first. That's harmless.
5. The scoring rule is a module-wide prototype switch (`setScoring`). Hard-code it once Cory picks.
