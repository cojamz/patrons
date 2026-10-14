# White: the exchange (sphere proposal, second pass 2026-10-14)

Built from old v0 White ("VP trading", which Cory likes). Everything below is **Claude's fill-in, not approved**. It runs in the engine:
`src/engine/v4/content/trading.js`, tests in `src/test/engine/v4/spheres/trading.test.js`, sims in `scripts/spheres/trading-*.mjs`.

## The idea
Your followers are cash. Sell them for white when you need fuel, buy them back later, and cash everything out in round III.
Gold sits on its pile and Red buys lots of cheap members. White moves its own score back and forth. Selling also moves you up in turn order, since fewest followers picks first.

One new rule: you can sell only followers you've won or bought, never yourself or a member. So nobody drops below 1.

## Numbered list (answer by number; default = keep; all Claude fill-ins)
Scoring
1. Most white at round end. **Flag:** this is the same shape as Gold's "most gold". White's difference lives in its actions, not its contest. Not changed.

Actions (value in resources: early = round I with typical holdings, late = round III. One follower counts as about 2 resources early, using Cory's Cash Out anchor, and about 1 late, at the 6-for-6 rate)
2. I · Haggle: +2 white, and +1 white per player with more followers than you. Early +2 (Rush gives 2). Late +3 to +5 for whoever is behind (Rush gives 6).
3. I · Buy Low: trade up to 2 resources per round number for followers, 1 for 1. Early: 2 resources for 2 followers, about +2 (Joint Venture is 3.3). Late: up to 6 for 6, about +2 (it saves a buy and skips the color rule). This is the weak version of Cash In.
4. I · Pawn: +2 white, and sell up to 1 follower per round number for 2 white each. Early +2. Late +2, plus 3 followers for 6 white: about +5 (Rush gives 6).
5. II · Sell High: sell up to 2 followers for 3 white each. Round II about +3 (Steal is 3). Late about +4.
6. II · Cash In: +1 follower, then trade any of your white for followers, 1 for 1. About +3 to +4 (Windfall is about 3). Why take it over Buy Low: it has no limit and gives a free follower, but only takes white.
7. III · Boom: trade all your resources for followers, 1 for 1 (you may keep your white). Greedy bots cash out about 11. That's par for the 6-for-6 buy, but it saves 2 buys and ignores colors: about +6 (Strike: +8 to 12 gold).

Members (cost = white + any)
8. Shopkeeper (1+1): at round start, +2 white.
9. Dealer (1+1): whenever you sell followers, +1 white each.
10. Pawnbroker (1+1): once per round, sell 1 follower for 3 white.
11. Safety Net (1+0): at round start, if you have no white, +3 white.
12. Tipster (2+1): whenever a rival buys followers, +1 white.
13. Lender (1+0): when it joins you, +5 white. Game end: lose 2 followers. **Flag:** with its debt, Lender is a net −1 follower whenever you have 2+ won or bought followers. That breaks "each member is worth at least 1 follower". The debt never touches yourself or a member.
14. Magnate (2+2): game end, +1 follower per 3 white (Tycoon's rate).
15. Shareholder (2+1): worth 3 followers.
16. Heiress (3+2): once per game, +1 white per member you have.
17. Bulk Buyer (2+1): whenever you buy 3 or 6 followers, +1 more. (Was Bargain Hunter, which paid on every buy and doubled the 2-for-1 rate.)
18. Broker (1+1): whenever a White action gives you followers, +1 more.
19. Exporter (2+2): whenever you recruit a non-white member, +1 white.
20. Liquidator (2+1): once per game, sell up to 5 followers for 2 white each.
21. Reinvestor (1+1): whenever you sell followers, your next member costs 1 less per follower sold.
22. Raider (1+0): once per game, buy up to 3 followers from the leader for 1 white each. They get the white.

## What changed in this pass, and why
- The loop "sell in round II → fewest followers → pick first in round III → Boom → buy it all back" is closed. The thinking bot no longer gains from it: over 60 games on the White table it ends with 55.5 followers, against 56.4 over 40 games on the stand-in table (win rate 67% vs 65%). It picked first in round III in only 10 of 60 games and took Boom 12 times. The lever that did it was trimming Buy Low (item 3), which was the cheap half of the loop.
- I tried the other two levers on top of that, 20 games each: Sell High at 2 white each (ends with 65.4, so no better), and Boom at 2 resources per follower (56.0, the same, and Boom goes dead). Neither helps, so I left both alone; this was the smallest change. "Turn order ignores followers sold" would need an engine change, and the data says it isn't needed.
- Buy Low went from 1 resource for 2 followers to 1 for 1, capped at 2 per round number. Cash In gets its reason back: bots now take it 0.7 times a game in round II (was 0.3) and every time in round III.
- Magnate is now 1 per 3 white. Lender works through a Doppelganger: the copy also gets the +5, paid at the end of that turn. Comeback Kid and Money Changer are cut; Safety Net and Liquidator are in. Bargain Hunter is now Bulk Buyer.

## Extra ideas (one line each, fill-ins)
23. I · Tip Jar: +3 white, and +1 white to a player you choose.
24. I · Barter: swap up to 3 of your resources into white, one for one, then +1 white.
25. II · Market Day: every player may sell 1 follower for 3 white; you get +1 white per seller.
26. II · Even Out: trade white and followers either way until you hold equal numbers of each.
27. III · Corner the Market: take half of every rival's white; each of them gets 1 follower per 2 you took.
28. Member · Underwriter: whenever a rival buys 6 followers, +2 white.
29. Scoring · Fewest followers (you need 1 white to qualify): selling becomes a safe bet and doubles as catch-up.
30. Scoring · Most white; ties go to whoever has fewer followers.

## Measurements
- Seat balance, 400 games with greedy bots on gold/red/blue/White: 25/28/26/22% at 4 players and 49/51% at 2. Average 46 followers (the stand-in table gives 48). Bots sell about 9 followers a game.
- White contest at 4 players: nobody scores 13% of the time and it's shared 6%. The win spread is 250/310/277/284. The leader holds about 4 more white than second.
- Member value: each member handed to one seat at round II start, 200 games, greedy bots. On this table a do-nothing member is worth +4.3, Tax Collector +4.4 and Tycoon +8.1. Heiress 7.5, Exporter 7.3, Tipster 6.2, Dealer 6.0, Broker 5.6, Reinvestor 5.6, Shareholder 5.1, Liquidator 5.0, Bulk Buyer 4.9, Pawnbroker 4.8, Raider 4.3, Magnate 4.1, Shopkeeper 3.8, Lender 3.3, Safety Net 3.1. These numbers are noisy, about ±1. I priced from the data, with Tax Collector at 2 and Tycoon at 6 as anchors. Magnate's price is my judgment, because bots don't save white.
- Thinking bot: see "What changed" above. 20-game runs swing about ±5 followers, so I pooled three of them.

What to watch
- Members that drip white (Exporter, Tipster) measure high because greedy bots spend all their white, so any drip wins the contest. Against people who save white they're worth less.
- Can't measure with bots: Magnate, Raider and Safety Net (bots neither save white nor sit on zero on purpose), and what selling does to turn order.

## Engine notes
- core.js now pays a member's color part in its quadrant's resource, so the relabel workaround is gone.
- Spaces can't leave anything due later, because only members have round-end and game-end hooks. That's why the loan lives on Lender.
- Copies skip "when it joins you", so a Doppelganger copying Lender gets its +5 at the end of that turn (a hook on Lender).
- Bulk Buyer reads the size of the buy from the engine's log line, because the follower-buy hook isn't told the tier. A `tier` argument on onBuyFollowers would be cleaner.
