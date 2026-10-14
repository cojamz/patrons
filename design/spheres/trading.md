# White: the exchange (sphere proposal, 2026-10-14)

Built from old v0 White ("VP trading", which Cory likes). Everything below is Claude's fill-in, not approved, and runs in the engine:
`src/engine/v4/content/trading.js`, tests in `src/test/engine/v4/spheres/trading.test.js`, sims in `scripts/spheres/trading-*.mjs`.

## The idea
Your followers are cash. Sell them for white when you need fuel, then buy them back cheap. Late in round III, cash everything out.
Gold sits on its pile and Red buys lots of cheap members. White moves its score back and forth. It's the only sphere that lowers its own score on purpose, and selling also moves you up in turn order, since fewest followers picks first.

One new rule: you can sell only followers you've won or bought, never yourself or a member. So nobody drops below 1, and early in round I hardly anyone has followers to sell. That's why the sell spaces in ring I always give something too.

## Numbered list (answer by number; default = keep)
Scoring
1. Most white at round end. You see it on the table the way you see gold.

Actions (value in resources: early = round I with typical holdings, late = round III. One follower counts as about 2 resources early, using Cory's Cash Out anchor, and about 1 late, at the 6-for-6 rate)
2. I · Haggle: +2 white, and +1 white per player with more followers than you. Early: everyone ties, so +2 (Rush gives 2). Late: +3 to +5 for whoever is behind (Rush gives 6). It's the weaker space, and it helps whoever is behind.
3. I · Buy Low: trade up to 1 resource per round number for 2 followers each. Early: 1 resource for 2 followers, about +3 (Joint Venture is 3.3). Late: 3 resources for 6 followers, about +3. Round II: about +4.
4. I · Pawn: +2 white, and sell up to 1 follower per round number for 2 white each. Early: +2 (hardly anyone can sell yet). Late: +2 plus 3 followers for 6 white, about +5 (Rush gives 6).
5. II · Sell High: sell up to 2 followers for 3 white each. Round II: about +3 (Steal is 3). Late: about +4. You also pick earlier next round.
6. II · Cash In: +1 follower, then trade any of your white for followers, 1 for 1. About +3 to +4: the extra follower, plus followers that skip your buy and the color rule (Windfall is about 3 in round II).
7. III · Boom: trade all your resources for followers, 1 for 1 (you may keep your white). Greedy bots cash out 13 resources on average. That's par for the 6-for-6 buy, but it saves 2 to 3 buys and ignores colors: about +6 to +8 (Strike: +8 to 12 gold for a gold player).

Members (cost = white + any)
8. Shopkeeper (2+1): at round start, +2 white.
9. Dealer (1+1): whenever you sell followers, +1 white each.
10. Pawnbroker (1+1): once per round, sell 1 follower for 3 white.
11. Comeback Kid (1+1): at round start, +1 white per player with more followers than you.
12. Tipster (2+2): whenever a rival buys followers, +1 white.
13. Lender (2+1): when recruited, +5 white. Game end: lose 2 followers.
14. Magnate (3+2): game end, +1 follower per 2 white.
15. Shareholder (2+1): worth 3 followers.
16. Heiress (3+2): once per game, +1 white per member you have.
17. Bargain Hunter (2+1): whenever you buy followers, +1 more.
18. Broker (2+1): whenever a White action gives you followers, +1 more.
19. Exporter (3+2): whenever you recruit a non-white member, +1 white.
20. Money Changer (3+2): whenever an action gains you 3+ of another color at once, +1 white.
21. Reinvestor (1+1): whenever you sell followers, your next member costs 1 less per follower sold.
22. Raider (1+0): once per game, buy up to 3 followers from the leader for 1 white each. They get the white.

## Extra ideas (one line each)
Ring I
23. Tip Jar: +3 white, and +1 white to a player you choose.
24. Barter: swap up to 3 of your resources into white, one for one, then +1 white.
25. Window Shopping: +1 white per member recruited this round, by anyone.
Ring II
26. Market Day: every player may sell 1 follower for 3 white; you get +1 white per seller.
27. Bulk Deal: trade 3 white for 4 followers, up to twice.
28. Even Out: trade white and followers either way until you hold equal numbers of each.
Ring III
29. Double your white (Strike for White; it keeps the contest).
30. Corner the Market: take half of every rival's white; each of them gets 1 follower per 2 you took.
31. Fire Sale: sell any followers for 3 white each (only safe if nothing turns white into followers at better than 1 for 1).
Members
32. Liquidator: once per game, sell any of your followers for 3 white each.
33. Safety Net: at round start, if you have no white, +3 white.
34. Underwriter: whenever a rival buys 6 followers, +2 white.
35. Regular: whenever you buy followers, +1 white. (Same text as Red's Crowd-Pleaser, so it was dropped.)
Scoring
36. Fewest followers (you need 1 white to qualify). Selling becomes a safe bet, and it doubles as catch-up.
37. Most white; ties go to whoever has fewer followers.
38. Most resources in total, any color.

## Measurements
- Seat balance, 400 games with greedy bots on gold/red/blue/White: 24/28/24/25% at 4 players and 54/46% at 2. Average 48.0 followers (the stand-in table gives 48.0). Bots sell about 9 followers a game. Every White space gets taken, except Cash In in round II (0.3 a game).
- White contest: nobody scores 13% of the time, and it's shared 10%. The win spread is even (285/279/301/308). The leader holds only about 2.5 more white than second, so the contest stays close.
- Member value: each member handed to one seat at round II start, 200 games, greedy bots. On this table a do-nothing member is worth +4.1 and Tax Collector +6.1. Heiress 8.7, Money Changer 8.6, Exporter 8.3, Tipster 7.7, Lender 6.5, Bargain Hunter 6.3, Broker 6.1, Shareholder 6.0, Shopkeeper 5.8, Pawnbroker 5.6, Comeback Kid 5.3, Reinvestor 5.3, Dealer 5.2, Magnate 4.8, Raider 4.0. Costs above come from those numbers, using Cory's Tax Collector at 2 as the anchor.
- Thinking bot, 20 games each: it ends with 58 followers on the stand-in table and 64 on the White table. With my first Boom ("each white becomes 2 followers") it was 72, because the bot hoarded 17 white and turned it into 34 followers. That loop is cut: nothing turns white into followers at better than 1 for 1 any more. White still rewards planning more than the stand-in does (thinker wins 80% vs 55-60%). Part of that is the greedy bots selling at the wrong times.

What to watch
- The sell price is above the late buy price (2–3 white per follower, against 1 for 1 to buy back). That spread is the point of the sphere and the thinker's remaining edge. If it plays too strong, drop Sell High to 2 white each first.
- Members that drip white (Exporter, Money Changer, Tipster) measure high because greedy bots spend all their white, so any drip wins the White contest. Against people who save white they'll be worth less. Their prices of 4–5 may come down.
- Can't measure: Magnate and Raider (bots don't save white or pick when to raid), and what selling does to turn order. Bots ignore both.

## Engine notes (no core.js edits made)
- Member color costs are paid from `p.res[def.quadrant]`, so a quadrant whose id isn't its resource (id 'trading', resource 'white') breaks. `install()` relabels the members as 'white'. Real fix: use `quadrant(def.quadrant).resource` in `paymentPlan` and `memberPayOk`. Other spheres that call `ctx.quadrant(def.quadrant)` on a member (Yellow's colorOf) would throw on 'white' until then.
- Spaces can't leave anything due later, because only members have round-end and game-end hooks. A loan space ("+4 white now, lose 2 followers at game end") would need a per-player game-end hook. That's why the loan lives on Lender.
- Selling has its own hook (`onSell`), which only White's actions and members fire. A Doppelganger copying Lender copies only the debt (copies skip the when-recruited part). That's an edge case worth a one-line rule.
