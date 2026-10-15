# Balance pass 2 (2026-10-15)

The second reprice from measurement, on the bench's pooled list (claude/cults-bench, design/eval/bench/trend.md, "Pooled over the 2 runs…", runs 669f85e and a4d46e9 on the same rules content). Single-run flags churn at the edge (two runs kept 5 of 14 card flags while every estimate moved as its interval predicted), so this pass acts only on the pooled list. The bench measured the prices before pass 1. Prices are colored part + any.

Same rules as pass 1 (design/eval/balance-pass-1.md), Claude under Cory's go-with-your-gut: both instruments agree (Normal and Hard-20, pooled); never a plain "Worth N" member; never a card the bots plainly misplay; a card both read at more than twice its price goes to Cory as a proposal (as Tax Collector and Upstart did); new price = midpoint of the two pooled fair prices, rounded to the even grid, moved at most ×2 or ÷2; the colored part keeps its share (fair-price report's split rule). None of these prices was set by Cory (decisions.md): they come from Claude's informed pass and the doubling.

## What changed (6)

| card | sphere | text | old | new | Normal pooled [90%] | Hard-20 pooled [90%] |
|---|---|---|---|---|---|---|
| Lamplighter | Purple | Now and at round start, +1 purple per minion you get this round (3 / 4 / 5). | 8 (6+2) | **12 (10+2)** | 11.0 [9.2–12.7] | 13.6 [11.4–15.7] ¹ |
| Proselytizer | Red | Whenever you recruit, +1 follower. | 12 (6+6) | **6 (4+2)** | 8.1 [6.4–9.8] | 4.7 [−0.1–9.5] ¹ |
| Exporter | White | Whenever you recruit a non-white member, +1 white. | 8 (4+4) | **4 (2+2)** | 2.9 [1.0–4.7] | 5.0 [2.9–7.2] |
| Go-Between | Yellow | Whenever you recruit a non-yellow member, +1 of its color. | 8 (4+4) | **4 (2+2)** | 3.5 [1.5–5.4] | 2.6 [−0.6–5.8] ¹ |
| Harmonist | Yellow | Game end: +1 follower per full set you hold. | 8 (6+2) | **4 (4+0)** ² | 2.9 [0.8–4.9] | −1.4 [−4.2–1.3] |
| Corner-Cutter | Purple | Extra turns you pay purple for cost you half (rounded up). | 4 (4+0) | **2 (2+0)** ³ | 2.2 [0.8–3.7] | 1.9 [−0.6–4.5] |

¹ One Hard-20 run so far. ² Held by the one-pass limit (midpoint 0.8): Hard-20 alone already reads it worth nothing even free, so if the next pool reads it under 2 on both, it needs a new ability, not a lower price. ³ Pass 1's capped move finished: pooled midpoint 2.1. At 4, Hard-20's pooled interval still reaches 4.5, so this is the midpoint's call, not a fresh flag.

- **Patron Saint** stays 6 (4+2): pooled 4.2 / 6.1, midpoint 5.2, which rounds back to 6.
- Exporter and Go-Between now cost what Middleman (Gold, 4 = 2+2) costs for the same "+1 when you recruit" template (rework-candidates #9).
- Lamplighter's 10 purple is the biggest purple part in the game (Night Owl 8): watch whether anyone can pay it before round II.
- Pass 1's other reprices sit inside at least one instrument's pooled interval at their new prices (Banker 8, Busker 8, Peddler 8, Tycoon 6, Toastmaster 4, Magnate 4), so nothing moves again. Extortionist stays 10: only Normal flags it in the pool (10.7 / 9.0), and 10 is inside both.

## Flagged, not changed

- **Hustler** (Gold, 2 = 2+0, "When recruited, pick a color. Actions there give you +1 gold per round number."): 8.9 / 5.9, both more than twice its price (the bench labels it "needs an ability change"). Proposal 1.
- **Lender** (White, 2 = 2+0, "When it joins you: +5 white. Game end: lose 2 followers."): 7.4 / 7.1, both more than twice its price, and a price can't reach the cause: a Release refunds its 2 white and sheds the debt. Normal bots released 38 of the 59 Lenders they recruited (120 games, four tables with White; the debt only lands on Lenders still held). Proposal 2.
- **Crew** (Magenta, 2 = 1+1, "Worth 2 followers."): 5.6 / 5.0. **Green Pillar** (stand-in Green, 6 = 3+3, "Worth 5 followers."): 2.3 / 2.6. Plain members keep Cory's price. They read in opposite directions (the cheap one too cheap, the dear one too dear), so it may be the plain price curve, not two cards: for Cory when plain members come up.
- **Investor** (2.1 / 2.4) and **Midas** (2.0 / 4.7): bot readings, as in pass 1 (bots always set aside half; bots never switch Midas off).
- **Tax Collector** and **Upstart**: Cory said yes to pass 1's rewordings (2026-10-15). If the reworded Upstart ever reverts, its pooled Normal reading (11.2) is now just under twice its price, and the rule would give 12 (8+4).
- **The space probe's timing.** The bench forces the probe seat's first minion of the round onto the space. That reads "copy what you took this round" (Greatest Hits, Reprise, Encore) at nothing, and Dividend at the round's fewest loose followers (Normal bots, 60 games: 3 at round II start, 8 at round III start, 21 late in round III). For the bench: probe these at a later minion too.
- Bloom and Orchard (Green stand-ins) are ignored. Shake Down, Plan Ahead, Crunch Time and Open House were pass 1's proposals, approved by Cory.
- Before the ×1.25 member-cost lever Cory approved (applied after this pass, then re-measured).

## For Cory (answer by number; my default in brackets)

Card values are fair prices in cost points; space values are the bench's scaled u against the ring bands (round I 2–3u, II 3–5u, III 5–9u), converted by its price slopes (round III: 0.62 followers per cost point Normal, 0.58 Hard-20, scaled ×1.54).

1. **Hustler** (Gold, 2: "When recruited, pick a color. Actions there give you +1 gold per round number."), 8.9 / 5.9: price it **8** (all gold), text unchanged. The midpoint is 7.4, four times today's price, more than one pass moves; the text is your own buff, so the price is the lever. [yes]
2. **Lender** (White, 2: "When it joins you: +5 white. Game end: lose 2 followers."), 7.4 / 7.1: "Game end, **or if you release it**: lose 2 followers." Today's Release sheds the debt and hands back 2 white, so most of the reading is a free +5. With the debt kept: +3 white net and a member for −2 followers, about 3–4 by the arithmetic; the price stays 2 until the next run reads it. [yes]
3. **Your Call** (White, ring I: "Per round number: +1 follower or +2 white."), round III 12.2u / 16.1u (rounds I and II in band): "**+1 follower per round number, or +2 white.**" Only the followers scale. Round I is unchanged; round III becomes 3 followers instead of up to 6 white, about 7.5u / 8u; round II drops to about 2–3u (fine for a ring-I space). My own gut call of 2026-10-14. [yes]
4. **Dividend** (White, ring II: "+1 white per loose follower you have."), round III 17.4u / 17.6u (round II 3.5u / 3.2u, in band): "+1 white per loose follower you have, **up to 4**." Round II barely moves (about 3.2u), round III lands near 8.5u, and a late round-III Dividend can no longer pour 20 white into one 10-follower buy and the white contest. A per-2 rate would halve round III's start (about 8.7u) but still pay about 10 late, and would drop round II to about 1.7u, under its band. My own gut call. [yes]
5. **Toast** (Silver, ring I: "+3 silver per round number (3 / 6 / 9), and everyone else +1 silver."), round III 20.0u / 14.2u: "**+2 silver plus 1 per round number (3 / 4 / 5)**, and everyone else +1 silver." Round I unchanged; round III's 9 silver becomes 5, about 11u Normal and 8u Hard-20; round II 6 → 4 silver. [yes]
6. **Greatest Hits** (Green, center: "Copy every space you took this round."), round III 0.9u / −4.2u, read as weak: **no change**. The probe forces it as the seat's first minion of the round, when there is nothing to copy, so both readings are an empty copy. Taken 3rd or 4th of 5 it copies 2–3 of your round's spaces, roughly 10–20u by the value model: it may be strong, not weak. The bench re-measures it at a later minion before anything changes. [yes]

## Tests

- Live tree at 4239cf1 plus agents' uncommitted work, full game counts: engine suite (`npx vitest run src/test/engine/v4`) 741 passed, 1 skipped, 41 of 41 files; the game-record replay (src/test/v4/records.test.js) passes, so the sample record didn't go stale this time.
- Tests that pin card costs pin their own (cards-*.test.js useCosts, the spheres' TEST_COSTS), so none moved.
- The market test's Spree bar (bots take Spree in over 60% of 200 seeded games) failed at 105/200 on HEAD. Bisected on its own 200 seeds: 134 through pass 1, 129 with pass 2, 95 at 86a7c8a (Cory's six pass-1 fixes, Tax Collector and Open House on that table, together with the Blue pricing and scoring change; Gold and Red alone give 112, Blue alone 129). Spree still pays (2.1 buys a Spree turn, 8 of 20 use all 3), so the bar is re-derived at 45% with the measurement in the comment.
