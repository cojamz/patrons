# Blue: the market (Claude's proposal; third pass after two critics, 2026-10-14)

Built and measured: `src/engine/v4/content/market.js` (id `market`, resource blue), tests in `src/test/engine/v4/spheres/market.test.js`, sims in `scripts/spheres/market-*.mjs`. Answer by number. Lines marked (fill-in) are a critic's wording, not Claude's.

## The idea
Blue bends the shop: it recruits outside your buy, pays in any colors, takes half off, wipes the row and gives you three buys in one turn. It wins on owning a few pricey members.
Gold hoards money and Red piles up cheap members. Blue holds a few badged ones, and its members reward keeping your following small.

**Badge:** any member costing 4 or more carries a badge on its card (`badge` on the def, worked out from its cost). Every Blue rule says "badged" or "unbadged", so nobody adds up prices.

## The list (cost = blue + any; u ≈ one resource; Cory's bands are ring I ≈ 2.5u, ring II ≈ 4u, ring III ≈ 7u)
1. Scoring: most badged members; blue members break ties.
2. Bargain (I, fill-in): +2 blue, then you may recruit a face-up member now, in any colors. ≈ 3u: 2 blue, plus 1 for the extra recruit and 0.5 for colors. Against Cory's "never stack a gain on a recruit", but the recruit is paid.
3. Restock (I): +2 blue, and sweep the face-up row (6 new). ≈ 2.5u, the same shape as Scout.
4. Showroom (I): +1 blue per badged face-up member. ≈ 3u (averaged +3.0 a take).
5. Clearance (II, fill-in): as your buy this turn, a face-up member for half its cost (rounded down), in any colors. ≈ 3u: 2–3 off plus 0.5 for colors, no extra recruit.
6. Price Check (II): gain blue equal to the cost of your priciest member. ≈ 5u (averaged +5.0), Windfall's level.
7. Spree (III): this turn you buy 3 times. ≈ 6–9u from two late buys. Strike ≈ 8–12, Take ≈ 7.
8. Stylist (1+1): whenever anyone recruits a blue member, +1 blue.
9. Onlooker (3+2): whenever a rival recruits a badged member, +1 blue.
10. Connoisseur (1+1): whenever you recruit a badged member, +2 blue.
11. Reseller (4+2): whenever you recruit, +1 of that member's color.
12. Curator (1+1): at round start, +1 blue per badged member you have.
13. Planner (1+1): at round start, your next member costs 1 less per round number.
14. Underbidder (1): at round start, your next member costs 1 less per rival with more members than you.
15. Minimalist (1, fill-in wording): at round start, +1 blue per rival with more members than you.
16. Social Climber (1, fill-in: once per game): once per game, at a round start, you may send one of your members to the bottom of the pile; your next member costs that much less.
17. Auctioneer (2+1): whenever a rival recruits an unbadged member, +1 blue.
18. Sommelier (1+1): whenever you recruit a badged member, your next member costs 1 less.
19. Patroness (2+2): whenever you recruit a badged member, +1 follower.
20. Black Market (1+1): once per game, on your turn, also look at the top 5 of the pile and recruit one at its cost.
21. Snob (3+2): at game end, +1 follower per badged member you have.
22. Recluse (1+1): at game end, +2 followers per rival with more members than you.

Cut so far: Personal Shopper (dominant), Shopaholic (an extra-buy source), Outfitter, Promoter, Window Shopper, Heirloom (a copy of Big Family), and the fractional Bargain.
Renamed: Appraise → Price Check, Collector → Curator, Appraiser → Snob, Dealer → Stylist, Broker → Onlooker, Regular → Planner (the old names clashed with White's cards, a Gold card and a stand-in).

## If member costs double (Cory's pending call)
- The one cutoff moves from 4 to 8. It's the `BADGE` constant in market.js, and every card reads it.
- The flat discounts become 2 apiece: Planner "2 less per round number", Underbidder "2 less per rival", Sommelier "2 less".
- Already proportional: Clearance (half), Price Check (a cost), Social Climber (a cost), Bargain, Black Market and Spree.

## Extra ideas
23. (I) Haggle: your next member costs 1 less per round number.
24. (I) Price Tag (engine change): pick a face-up member; it costs rivals 1 more, paid to you, and whoever recruits it gets +1 follower.
25. (II) Trade Up: send one of your members to the bottom of the pile and recruit a face-up member, paying only the difference.
26. (III) Grand Opening: sweep the row, then recruit any one of the new members at half cost.
27. Member: Purist: at game end, +3 followers if you have the fewest members (ties count).
28. Scoring: most member value (the total printed cost). Measured alongside the badge rule: same seat balance, shared 4% vs 10%.

## Measurements (greedy bots unless noted; table gold/red/market/green)
- **Balance after repricing, 400 games:**
  - Seat wins 23/24/26/28%.
  - Average 47.9 followers (stand-in table 47.8).
  - The badge contest is shared 10% of the time and never goes unscored. It gave the winner 6.9 followers on average.
- **Member counts:** 12.2 per player vs 10.2 on the stand-in table, about 2.0 more. Attribution (300 games each):
  - Flag Blue's members as no-effect, the way bots see the stand-in's: 10.7. So about 1.5 of the gap is bots preferring cards with effects over the stand-in's blank cards. Any real sphere shows this; it isn't Blue's own.
  - Remove Bargain's recruit, Clearance and Spree together: 11.2. Blue's own extra recruits come to about 1.0, split roughly evenly: Bargain 0.4, Clearance 0.3, Spree 0.3. Clearance now uses your buy.
  - A pricier Blue deck (+1 on every card) changes nothing (12.1).
- **Forced first pick of a round** (followers vs the bot's own choice; noise about ±1.5):
  - Ring I: Bargain −1.0 (up from −3.8), Restock +1.3, Showroom +0.3 vs JV −2.8, Rush −2.6, Discount −1.1, Hire +1.7, Scout +1.3.
  - Ring II: Clearance −0.2, Price Check +0.6 vs Steal −1.8, Windfall −2.4, Hire Up +2.3.
  - Ring III: Spree +1.7 vs Strike −1.5, Take +2.6.
- **Member value** (handed over at round II, 160 games each). Same-table anchors: Sponsor 9.7 (cost 5), Recruiter 9.2 (4), Merchant 7.4 (3), Host 5.7 (3), Banker 5.6 (2), Taxman 4.1 (2), Intern 3.2 (1).
  - Blue, before the repricing above: Reseller 10.7 (61% win; now 6), Snob 9.9 (now 5), Onlooker 9.6 (61%; now 5), Patroness 9.1 (stays 4), Auctioneer 7.8 (now 3), Stylist 5.4 (now 2), Black Market 5.3, Sommelier 5.3, Planner 5.0, Connoisseur 4.6 (now 2), Recluse 4.5, Curator 4.1 (now 2), Social Climber 3.0, Minimalist 2.7, Underbidder 2.2.
- **Thinking bot** (one seat, 4 rollouts, 24 games, before the repricing): won 50% with a +4.4 margin, so planning pays. An earlier pass read 67%, and 24 games is noisy. It used Bargain and Restock across all rounds and Showroom often in rounds I–II.
- 200 seeded bot games run clean; 29 unit tests pass.

## What to watch
- Reseller (61% win) and Onlooker (61%) were the strongest cards and now cost 6 and 5. If Reseller still dominates, cut it.
- The few-members cards measure low because greedy bots always over-buy, so they never play into them.
- Bargain now gives +2 blue on top of a paid recruit. Cory's rule is "never stack a gain on a recruit". It's a fill-in for him to judge.

## Engine notes (core.js untouched)
- **Badge everywhere:** the `badge` getter is set only on Blue's own defs. For every member to carry a badge, add the same getter in `content/index.js` `index()`: `Object.defineProperty(def, 'badge', { get() { return this.s + this.w >= 4; } })`.
- **Activation order:** an activated member's question comes after the re-queued buy, so Black Market says "also".
- **Log:** Blue's own paid recruits log as "(free)" after Blue's "pays …" line.
- **Queue edits:** Spree adds buy tasks to `state.queue`, and Clearance takes your buy out of it.
