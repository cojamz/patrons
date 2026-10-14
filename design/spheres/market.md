# Blue: the market (Claude's proposal, 2026-10-14)

Built and measured: `src/engine/v4/content/market.js` (id `market`, resource blue), tests in `src/test/engine/v4/spheres/market.test.js`, sims in `scripts/spheres/market-*.mjs`. Answer by number.

## The idea
Blue bends the shop: recruit outside your buy, pay in any colors, pay half, wipe the row, take two buys. It scores on how valuable your members are.
Gold hoards money and Red piles up cheap members. Blue spends on a few expensive ones and gets them cheap.

## The list (cost = blue + any)
1. Scoring: **most member value**: the total printed cost of the members you hold. Blue members break ties. Anyone can add up the price tags they see.

Ring I
2. Bargain: recruit a face-up member now for a third off (rounded up), in any colors.
3. Restock: +2 blue, and sweep the face-up row: 6 new members come out.
4. Showroom: +1 blue per face-up member costing 4 or more.

Ring II
5. Clearance: recruit a face-up member now for half its cost (rounded down), in any colors.
6. Appraise: gain blue equal to the cost of your priciest member.

Ring III
7. Spree: this turn you buy twice.

Members
8. Dealer (2+1): whenever anyone recruits a blue member, +1 blue.
9. Broker (2+2): whenever a rival recruits a member costing 4 or more, +1 blue.
10. Connoisseur (2+1): whenever you recruit a member costing 4 or more, +2 blue.
11. Reseller (2+2): whenever you recruit, +1 of that member's color.
12. Outfitter (1+1): whenever you recruit your first member of a color, +2 blue.
13. Collector (2+1): at round start, +1 blue per member you have costing 3 or more.
14. Regular (1+1): at round start, your next member costs 1 less per round number.
15. Promoter (1): whenever you buy followers, your next member costs 1 less.
16. Underbidder (1): at round start, your next member costs 1 less per rival with more members than you.
17. Window Shopper (1): once per round, before you buy, sweep the face-up row.
18. Personal Shopper (4+2): once per round, buy one more time this turn.
19. Shopaholic (2+1): once per game, buy two more times this turn.
20. Black Market (2+1): once per game, on your turn, also recruit any member from the pile at its cost.
21. Heirloom (3+1): no effect, worth 3 followers. (Now the same as Big Family in blue. Cut it if that's dull.)
22. Appraiser (2+2): at game end, +1 follower per member you have costing 4 or more.

## Value math for the actions (against Cory's anchors)
- Bargain ≈ 2.5–3u. A third off is 1–2 on a 3–6 cost member. Any colors adds about 0.5, and recruiting without using your buy about 1. It gains nothing, so in round I it's a modest pick. Forced-pick sim: in the noise band with JV and Hire.
- Restock ≈ 2.5u: +2 blue plus a fresh row. The same shape as Scout.
- Showroom ≈ 2.8u: it averaged +2.8 blue a take.
- Clearance ≈ 4u: half off a 4–6 member is 2–3, any colors 0.5, and the recruit outside your buy 1. That's Steal's level.
- Appraise ≈ 5u: it averaged +5.2 blue a take. That's Windfall's level.
- Spree ≈ 5–7u: one extra buy in round III turns about 6 idle resources into about 6 followers. That's under Strike or Take. It was cut from 3 buys to 2 so it can't double-dip with Shopaholic or Personal Shopper.
- No action gives more than 3 blue for nothing in round I. Bargain and Clearance never give a free member. Their cost effects are fractions, so they hold up if member costs double.

## Extra ideas
Ring I
23. Haggle: your next member costs 1 less per round number.
24. Wholesale: buy followers now (outside your buy), with no color rule.
25. Price Tag (needs an engine change): pick a face-up member. It costs rivals 1 more, paid to you, and whoever recruits it gets +1 follower. It's the fun-both-sides version of raising rivals' costs.

Ring II
26. Backroom: look at the top 3 of the pile and recruit one now at its cost, in any colors.
27. Sale (needs an engine change): this round, your members cost a quarter less.
28. Markup (needs an engine change): this round, members cost rivals 1 more, and each rival gains 1 blue now.

Ring III
29. Buyout: recruit 2 face-up members, each at half cost.
30. Grand Opening: sweep the row, then recruit any one of the new members at half cost.
31. Closing Time: recruit every face-up member costing 2 or less, for 1 each.

Members
32. Gatekeeper: whenever a rival recruits a member costing 5 or more, they give you 1 resource of their choice.
33. Pawnbroker: once per round, send one of your members to the bottom of the pile for its cost in blue.
34. Haggler: your members costing 4 or more cost a quarter less (needs an engine change).
35. Wholesaler: your 4-for-3 follower buys give 4.

Scoring alternatives
36. Most blue.
37. Owns the priciest single member (ties go to more blue).
38. Most members costing 4 or more.

## Measurements (greedy bots unless noted, Blue in place of the blue stand-in)
- 400 games: seat wins 24/27/26/24%. Average 48.7 followers (stand-in table 48.0), 12.2 members, member value 37.3. The value contest is shared only 3% of the time and never goes unscored. It gave the winner 7.7 followers on average, about 16% of their total.
- Takes per game, rounds I/II/III: Bargain, Clearance, Appraise and Spree are always taken. Restock 1.0/0.64/0.48 and Showroom 1.0/0.43/0.45 are the weak ring-I picks.
- Forced first pick of the round (followers vs free choice; noise is about ±1.5): Bargain −2.2 (n=57), Restock +1.1, Showroom +0.7 vs JV −1.2, Rush −0.1, Hire −0.8. Clearance +1.1 and Appraise +0.4 vs Steal −1.7, Windfall −2.2, Hire Up +2.1. Spree −2.3 vs Strike −1.9, Take +1.4.
- Member value (handed over at round II, 160 games each). Every member is worth more on a Blue table, because each one adds its price to the contest: Recruiter is 12.0 here vs 6.8 on the stand-in table. Same-table anchors: Sponsor 13.3 (cost 5), Recruiter 12.0 (4), Merchant 10.0 (3), Banker 8.3 (2), Intern 3.8 (1). Blue: Personal Shopper 14.1 (72% win), Broker 10.6, Reseller 9.7, Shopaholic 9.6, Dealer 9.3, Connoisseur 9.2, Collector 9.1, Appraiser 8.6, Black Market 7.7, Regular 7.2, Heirloom 6.6, Outfitter 5.7, Underbidder 4.4, Window Shopper 3.5, Promoter 2.7. Costs above are set from this.
- Thinking bot: see the report line (THINKER).
- 200 seeded bot games run clean (unit test plus invariants).

## What to watch
- Personal Shopper is the strongest card even at the top price (72% win). If it plays too strong in person, make it once per game. Shopaholic already covers that.
- Bots end with about 27 resources unspent, so they undervalue extra buys (Bargain, Clearance, Spree, the Shoppers). People who spend well will find these stronger.
- Every member pads the value contest, and Blue also inflates everyone's member value, so Blue tables lean toward members over follower buys (8.6 vs 9.8 follower buys a game).
- Unmeasured: Window Shopper and Black Market timing (bots use them crudely), the denial value of Restock, and whether people enjoy reading price tags.

## Engine notes (core.js untouched)
- A member's colored part is paid from `p.res[def.quadrant]`. Here id `market` ≠ resource `blue`, so `install()` relabels Blue's member defs as quadrant `blue`. The real fix is one line in `paymentPlan` and `memberPayOk`: use `quadrant(def.quadrant).resource`.
- An activated member that asks a question (Black Market) gets its question after the re-queued buy, because core unshifts the buy after `onActivate`. Pushing the buy before calling `onActivate` would let Black Market read "before you buy".
- Bargain, Clearance and Black Market pay through Blue's own payment step, then recruit with `free: true`, so the log line says "(free)" after Blue's own "pays …" line. `recruit()` could take a paid label.
- Spree and the Shoppers add buy tasks to `state.queue` directly.
- Ideas 25, 27, 28 and 34 need a price hook, for example a member/state `priceMod(ctx, buyer, card) → ±n` summed in `paymentPlan` and `memberPayOk`.
