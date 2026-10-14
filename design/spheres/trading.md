# White: the exchange (sphere proposal, third pass 2026-10-14)

Built from old v0 White ("VP trading", which Cory likes). Everything below is **Claude's fill-in, not approved**. It runs in the engine:
`src/engine/v4/content/trading.js`, tests in `src/test/engine/v4/spheres/trading.test.js` and `cards-trading.test.js`, sims in `scripts/spheres/trading-*.mjs`.

## Third pass: rework after Cory's first play (Claude, under Cory's "go with your gut")
Cory's notes:
- Pawn's sale was dead in round I.
- Cash In and Magnate looked redundant, and Cash In maybe too strong.

The full diagnosis, my own play and the options are in design/eval/cory-notes-2026-10-14.md §2.

Root cause: White was tuned on the old ladder (colors required, best rate 6 for 6). On today's ladder (any resources; 4→3, 10→10), a follower costs 1–1.33 resources. Two things follow:
- Cash In's uncapped 1 for 1 turned "sell for 3, cash back in at par" into a loop.
- Only loose followers sell, so a ring-I sale has nothing to sell in round I.

Changes:
1. Pawn is now "Per round number: +1 follower or +2 white." You pick the mix. It always pays and has no sale.
2. Cash In is replaced by Barter: "Recruit a face-up member, paying 1 follower per 2 of its cost, rounded up (only followers you've won or bought)." Followers become cash for members, not more followers. Magnate is left as the one white→followers card, so the redundancy is gone. Your normal buy still follows. Barter isn't a sale, so Dealer and Reinvestor don't fire.
3. Broker pays once per action (Buy Low used to pay it per resource traded) and costs 2+0 (was 2+2).
4. Dealer costs 2+0 (was 2+2). Pawn no longer sells, so bots sell half as often.

Kept, with measurements:
- Sell High and Pawnbroker stay at 3 white per follower. With Cash In gone, a scripted seller doesn't win more, and bots that sell out-win bots that don't. At 2, selling stops paying off. The critic preferred 2; see below.
- Buy Low and Boom stay. A pure follower buyer wins less on a White table than on the stand-in table.

Flagged for Cory (not White's to fix):
- Release refunds a once-per-game member's full price after it's been used (buy Liquidator, use it, release it: free).
- One seller can empty the 10→10 stock in round II and end the game early. (Addressed: the 10→10 buy is now at most once per player per round; see the follow-ups below.)

## Design critic follow-ups (2026-10-14, Claude under Cory's "go with your gut")
1. "Loose followers" is defined once, in the rulebook (What you have) and the glossary: followers you bought or won, not the ones your members are worth. The cards use the word instead of each explaining it: Sell High "Sell up to 2 loose followers for 3 white each.", Pawnbroker "Once per round: sell 1 loose follower for 3 white.", Liquidator "Once per game: sell up to 5 loose followers for 2 white each."
2. Barter reads "Recruit a face-up member for half its cost (round up), paid in loose followers." Same engine behaviour.
3. The 10-follower buy (the game-end clock) is at most once per player per round; the stock of 4 stays. The option is hidden once you've made it this round, so bots respect it too.
4. Not done: fallbacks ("If you can't, +3 white" on Barter; "If you have no loose followers, +3 white" on Sell High). Cory: no rescue clauses; taking a space you can't use is on you.

## The idea
Your followers are cash. Sell them for white when you need fuel, buy them back later, and cash everything out in round III.
Gold sits on its pile and Red buys lots of cheap members. White moves its own score back and forth. Selling also moves you up in turn order, since fewest followers picks first.

One new rule: you can sell or spend only your **loose followers** (the ones you've won or bought), never yourself or a member. So nobody drops below 1.

## Numbered list (answer by number; default = keep; all Claude fill-ins)
Scoring
1. Most white at round end. **Flag:** this is the same shape as Gold's "most gold". White's difference lives in its actions, not its contest. Not changed.

Actions (value in resources: early = round I with typical holdings, late = round III. One follower counts as about 2 resources early, using Cory's Cash Out anchor, and about 1 late, at the 6-for-6 rate)
2. I · Haggle: +2 white, and +1 white per player with more followers than you. Early +2 (Rush gives 2). Late +3 to +5 for whoever is behind (Rush gives 6).
3. I · Buy Low: trade up to 2 resources per round number for followers, 1 for 1. Early: 2 resources for 2 followers, about +2 (Joint Venture is 3.3). Late: up to 6 for 6, about +2 (it saves a buy and skips the color rule). This is the weak version of Cash In.
4. I · Pawn: per round number, +1 follower or +2 white (you pick the mix). Round I: 1 follower or 2 white (Rush gives 2). Round III: up to 3 followers or 6 white (Rush gives 6). (Was "+2 white, and sell up to 1 follower per round number for 2 white each", whose sale was dead in round I.)
5. II · Sell High: sell up to 2 loose followers for 3 white each. Round II about +3 (Steal is 3). Late about +4.
6. II · Barter: recruit a face-up member for half its cost (round up), paid in loose followers. On top of your buy. At the 4→3 rate, a cost-8 member for 4 followers is about +1.3 followers of value, plus the member's ability and an extra recruit; the plain high-follower members (Patron, worth 5 for 6) net +2. (Replaces Cash In: "+1 follower, then trade any of your white for followers, 1 for 1".)
7. III · Boom: trade all your resources for followers, 1 for 1 (you may keep your white). Greedy bots cash out about 11. That's par for the 6-for-6 buy, but it saves 2 buys and ignores colors: about +6 (Strike: +8 to 12 gold).

Members (cost = white + any)
8. Shopkeeper (1+1): at round start, +2 white.
9. Dealer (1+0, now 2+0 at doubled costs): whenever you sell followers, +1 white each.
10. Pawnbroker (1+1): once per round, sell 1 loose follower for 3 white.
11. Safety Net (1+0): at round start, if you have no white, +3 white.
12. Tipster (2+1): whenever a rival buys followers, +1 white.
13. Lender (1+0): when it joins you, +5 white. Game end: lose 2 followers. **Flag:** with its debt, Lender is a net −1 follower whenever you have 2+ won or bought followers. That breaks "each member is worth at least 1 follower". The debt never touches yourself or a member.
14. Magnate (2+2): game end, +1 follower per 3 white (Tycoon's rate).
15. Shareholder (2+1): worth 3 followers.
16. Heiress (3+2): once per game, +1 white per member you have.
17. Bulk Buyer (2+1): whenever you buy 3 or 6 followers, +1 more. (Was Bargain Hunter, which paid on every buy and doubled the 2-for-1 rate.)
18. Broker (1+0, now 2+0 at doubled costs): whenever a White action gives you followers, +1 more (once per action; Buy Low used to pay it per resource).
19. Exporter (2+2): whenever you recruit a non-white member, +1 white.
20. Liquidator (2+1): once per game, sell up to 5 loose followers for 2 white each.
21. Reinvestor (1+1): whenever you sell followers, your next member costs 1 less per follower sold.
22. Raider (1+0): once per game, buy up to 3 followers from the leader for 1 white each. They get the white.

## What changed in this pass, and why
- The loop "sell in round II → fewest followers → pick first in round III → Boom → buy it all back" is closed. The thinking bot no longer gains from it: over 60 games on the White table it ends with 55.5 followers, against 56.4 over 40 games on the stand-in table (win rate 67% vs 65%). It picked first in round III in only 10 of 60 games and took Boom 12 times. The lever that did it was trimming Buy Low (item 3), which was the cheap half of the loop.
- I tried the other two levers on top of that, 20 games each: Sell High at 2 white each (ends with 65.4, so no better), and Boom at 2 resources per follower (56.0, the same, and Boom goes dead). Neither helps, so I left both alone; this was the smallest change. "Turn order ignores followers sold" would need an engine change, and the data says it isn't needed.
- Buy Low went from 1 resource for 2 followers to 1 for 1, capped at 2 per round number. Cash In gets its reason back: bots now take it 0.7 times a game in round II (was 0.3) and every time in round III.
- Magnate is now 1 per 3 white. Lender works through a Doppelganger: the copy also gets the +5, paid at the end of that turn. Comeback Kid and Money Changer are cut; Safety Net and Liquidator are in. Bargain Hunter is now Bulk Buyer.

## Extra ideas (one line each, fill-ins)
23. I · Tip Jar: +3 white, and +1 white to a player you choose.
24. (Retired: the name Barter now belongs to the ring-II action, item 6.)
31. Pawn pile (the critic's bolder idea): sold followers sit in a visible pile on your board. Buy them back any time for 3 white each; whatever's left at game end is lost. Closes any sell/buy loop by itself.
32. Moving price: each sale this round drops White's sale price by 1 (a Power Grid-style track), so the market itself stops a loop.
25. II · Market Day: every player may sell 1 follower for 3 white; you get +1 white per seller.
26. II · Even Out: trade white and followers either way until you hold equal numbers of each.
27. III · Corner the Market: take half of every rival's white; each of them gets 1 follower per 2 you took.
28. Member · Underwriter: whenever a rival buys 6 followers, +2 white.
29. Scoring · Fewest followers (you need 1 white to qualify): selling becomes a safe bet and doubles as catch-up.
30. Scoring · Most white; ties go to whoever has fewer followers.

## Measurements
Third pass (2026-10-14; 4 players, Normal bots, gold/red/White/green; shop of 10):
- Pure follower buyer vs 3 bots, n=400:
  - before the rework: 7.5% [5–10] on the White table, 11.6% [9–15] on the stand-in table;
  - after: 9.4% [7–13].
- Scripted seller seat (sells every loose follower, never recruits, buys back big), n=400:
  - before: 6.8% [5–10];
  - after: 7.4% [5–10];
  - with every sale at 2: 5.0% [3–8].
- Bots beside it that sell vs bots that don't:
  - with sales at 3: 35% vs 29%;
  - with sales at 2: 30% vs 33%.
- 4 bots, n=200, before → after:
  - members per player: 5.3 → 5.6;
  - followers per player: 46.0 → 47.2;
  - followers sold per game: 9.2 → 4.5;
  - followers from White's conversions per player: 4.2 → 3.7;
  - Barter: taken about once a game, about 3 followers paid.
- Member value (handed over at round II, 160 games):
  - before: Dealer 6.2, Broker 3.5;
  - after: Magnate 5.0, Liquidator 4.1, Reinvestor 2.6, Pawnbroker 2.4, Dealer 2.1, Broker 0.6;
  - reference: Shareholder (worth 3) 2.6.

Second pass (older table and costs):
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
