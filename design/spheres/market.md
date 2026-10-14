# Blue: the market (Claude's proposal, revised 2026-10-14 after critic review)

Built and measured: `src/engine/v4/content/market.js` (id `market`, resource blue), tests in `src/test/engine/v4/spheres/market.test.js`, sims in `scripts/spheres/market-*.mjs`. Answer by number.

## The idea
Blue bends the shop: it recruits outside your buy, pays in any colors, takes half off, wipes the row and gives you three buys in one turn. It wins on owning a few expensive members.
Gold hoards money and Red piles up cheap members. Blue holds a few pricey ones and its members reward keeping your following small.

## The list (cost = blue + any; u ≈ one resource; Cory's bands are ring I ≈ 2.5u, ring II ≈ 4u, ring III ≈ 7u)
1. Scoring: **most members costing 4 or more**. Blue members break ties. Recommended over "most member value" (the summed cost): both are visible, but this one counts no cheap member and is a number you can count at a glance.
2. Bargain (I): recruit a face-up member now, in any colors. ≈ 1.5u: a recruit outside your buy (1) plus any colors (0.5). Below the band, by design the weak version of Clearance.
3. Restock (I): +2 blue, and sweep the face-up row: 6 new members come out. ≈ 2.5u: 2 blue plus a fresh row (0.5), the same shape as Scout.
4. Showroom (I): +1 blue per face-up member costing 4 or more. ≈ 2.9u (it averaged +2.9 a take).
5. Clearance (II): recruit a face-up member now for half its cost (rounded down), in any colors. ≈ 4u: half off a 4–6 member (2–3), plus the recruit outside your buy (1) and any colors (0.5).
6. Price Check (II): gain blue equal to the cost of your priciest member. ≈ 5u (averaged +5.0), Windfall's level.
7. Spree (III): this turn you buy 3 times. ≈ 6–9u: two late buys, each turning 3–6 idle resources into followers or a member. Strike ≈ 8–12 and Take ≈ 7.
8. Dealer (2+1): whenever anyone recruits a blue member, +1 blue.
9. Broker (2+2): whenever a rival recruits a member costing 4 or more, +1 blue.
10. Connoisseur (2+1): whenever you recruit a member costing 4 or more, +2 blue.
11. Reseller (3+2): whenever you recruit, +1 of that member's color.
12. Curator (2+1): at round start, +1 blue per member you have costing 3 or more.
13. Regular (1+1): at round start, your next member costs 1 less per round number.
14. Underbidder (1): at round start, your next member costs 1 less per rival with more members than you.
15. Minimalist (1): at round start, +1 blue per member fewer than the rival with the most.
16. Social Climber (1): at round start, you may send one of your members to the bottom of the pile; your next member costs that much less.
17. Auctioneer (1+1): whenever a rival recruits a member costing 2 or less, +1 blue.
18. Sommelier (1+1): whenever you recruit a member costing 4 or more, your next member costs 1 less.
19. Patroness (2+2): whenever you recruit a member costing 5 or more, +1 follower.
20. Black Market (1+1): once per game, on your turn, also look at the top 5 of the pile and recruit one at its cost.
21. Snob (2+2): at game end, +1 follower per member you have costing 4 or more.
22. Recluse (1+1): at game end, +2 followers per rival with more members than you.

Cut in this pass: Personal Shopper (dominant, 72% win), Shopaholic (an extra-buy source), Outfitter, Promoter, Window Shopper, Heirloom (a copy of Big Family), and the fractional Bargain.
Renamed: Appraise → Price Check, Collector → Curator, Appraiser → Snob.

## If member costs double (Cory's pending call)
- The cutoffs become 4 → 8 (scoring, Showroom, Broker, Connoisseur, Sommelier, Snob), 3 → 6 (Curator), 2 → 4 (Auctioneer) and 5 → 10 (Patroness).
- The flat discounts become 2 apiece: Regular "2 less per round number", Underbidder "2 less per rival", Sommelier "2 less".
- Already proportional, no change needed: Clearance (half), Price Check (equal to a cost), Social Climber (that member's cost), Spree, Bargain and Black Market (at cost).
- The cutoffs are named constants in market.js (PRICEY, MID, CHEAP, LUXURY), so the switch is one edit.

## Extra ideas
23. (I) Haggle: your next member costs 1 less per round number.
24. (I) Wholesale: buy followers now, outside your buy, with no color rule.
25. (I) Price Tag (engine change): pick a face-up member; it costs rivals 1 more, paid to you, and whoever recruits it gets +1 follower.
26. (II) Backroom: look at the top 3 of the pile; recruit one now at its cost.
27. (II) Trade Up: send one of your members to the bottom of the pile and recruit a face-up member, paying only the difference.
28. (III) Grand Opening: sweep the row, then recruit any one of the new members at half cost.
29. (III) Buyout: recruit 2 face-up members, each at half cost.
30. Member: Gatekeeper: whenever a rival recruits a member costing 5 or more, they give you 1 resource of their choice.
31. Member: Purist: at game end, +3 followers if you have the fewest members (ties count).
32. Scoring: most member value (the total printed cost). It was measured alongside the main rule; see below.
33. Scoring: owns the priciest single member (ties go to more blue).

## Measurements (greedy bots unless noted; table gold/red/market/green)
- **Member counts.** 12.1 per player on a Blue table vs 10.2 with the plain stand-in, so Blue adds about 1.9. Making Bargain and Clearance use up your buy (a test variant, `setLean`) only gets it to 11.6. Most of the gap is bots buying whenever they can afford something, plus blue income. The 6–7 target needs the cost call; Blue alone can't get there.
- **Scoring rules side by side** (400 games each):
  - Most members costing 4+: seats 22/27/27/25%; shared 10% of rounds, never unscored; 7.5 followers to the winner.
  - Most member value: seats 23/26/25/26%; shared 4%; 7.9 followers to the winner.
  - Greedy bots don't steer by contests, so member counts are identical under both (12.1). The rule changes what people chase, not what bots do.
- **Takes per game, rounds I/II/III:** Bargain 1.0/0.72/0.58, Restock 1.0/0.74/0.58, Showroom 1.0/0.48/0.63. Clearance, Price Check and Spree are always taken. Black Market is used 0.74 times a game.
- **Forced first pick of a round** (followers vs the bot's own choice; noise about ±1.5):
  - Ring I: Bargain −3.8, Restock −0.3, Showroom +0.7 vs JV −0.4, Rush −1.1, Discount −0.4, Hire −1.0, Scout +1.5.
  - Ring II: Clearance −1.7, Price Check −0.6 vs Steal −2.9, Windfall −2.9, Hire Up +1.8.
  - Ring III: Spree −0.6 vs Strike −2.5, Take +1.7.
- **Member value** (handed over at round II, 160 games each). Same-table anchors: Sponsor 11.7 (cost 5), Recruiter 9.1 (4), Merchant 8.3 (3), Banker 7.7 (2), Host 7.5 (3), Taxman 4.8 (2), Twins 4.6 (2), Intern 3.3 (1).
  - Blue: Reseller 11.7 (raised to 5), Broker 9.8, Snob 9.3, Patroness 8.1 (lowered to 4), Curator 7.0, Dealer 6.9, Connoisseur 6.8, Black Market 5.7 (lowered to 2), Sommelier 5.4, Regular 5.3, Auctioneer 5.0, Recluse 5.0 (lowered to 2), Minimalist 3.1 (lowered to 1), Underbidder 2.6, Social Climber 1.5.
- **Thinking bot** (one seat, 4 rollouts, 24 games): won 67% with a +13.4 margin, so planning pays. It placed on Blue a little more than greedy bots did (24% vs 22%) and took Bargain mostly late (11 of its 22 Bargains came in round III). It took Spree in 9 of 24 games and Showroom often. It ended with fewer Blue members than the greedy bots (2.6 vs 2.9) but higher member value.
- 200 seeded bot games run clean; 29 unit tests pass.

## What to watch
- Bargain is the weakest ring-I pick (−3.8 forced, about 1.5u). It's the weak version of Clearance: the draft fallback, or a way to deny a card.
- The few-members cards (Minimalist, Recluse, Underbidder, Social Climber) measure low, but greedy bots always pad, so they never play into them. People who do will get more out of them. Bots barely use Social Climber.
- Reseller is the strongest card (61% win) at 5.

## Engine notes (core.js untouched)
- An activated member that asks a question (Black Market) gets it after the re-queued buy, because core unshifts the buy after `onActivate`. Hence "also".
- Bargain, Clearance and Black Market pay through Blue's own payment step and then recruit with `free: true`, so the log shows "(free)" after Blue's "pays …" line.
- Spree adds buy tasks to `state.queue` directly.
- Idea 25 needs a price hook (`priceMod(ctx, buyer, card)` summed in `paymentPlan` and `memberPayOk`).
