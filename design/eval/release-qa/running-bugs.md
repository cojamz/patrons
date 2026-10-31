# Release QA bug list (running)

## Engine sweeps
- E1 (minor, wrong rule) Farewell sends a member to the bottom of an empty pile while the shop is one short: the shop isn't refilled from it (shop 7 of 8 with 1 card in the pile). Repro: plain sweep [trading,red,echo] n=3 bot seed 10033, move 154. Owner: publisher.
- E2 (fixed on branch, fc672742) members back in the pile/shop kept Night Owl's round mark (Tryout). Tryout sweep over every member on a392e48: 0 leaks.
- E3 (no player impact) fuzz invariant "turns to come > open spaces" fires in 2-3 player round III with Extra Hand and skips; no minion ever sat out. Noise in the invariant, not a bug.
- E4 (polish) "Use Hot Streak" stays offered on every place step after it says "no turns in a row just before this one yet"; a person can click it forever to no effect.

## Browser sweep
- B1 (not reproduced) seed 1005 sat 30s+ on "P2 is shopping" in round III at box load ~20; replayed alone it finished clean. Recheck on the final build.

## Panel: playtester
- P1 (wrong-looking) End-game bonus card for Snob shows a big 5 but awards +7: the engine counts members by worth (countOf), the card shows cards. Text also ends "..". Shot /tmp/eyes/playtester/132-shot.png. Owner: publisher (Reckoning.jsx).
- P2 (confusing) Doppelganger copying Mob: hover header still shows worth 1 while it counts as 5. Shot 121-hover.png.
- P3 (confusing) Pay sheet "Keeping" shows an empty dashed circle labelled 1 where the leftover gold should be (Mob paid via Freelancer). Shots 069/070.
- P4 (confusing) Rival Demote swapping my Mob: only signs are a short tooltip and the round recap's "-6 from members who left".
- P5 (confusing) Greatest Hits' copied steal picks via a top prompt; the space itself picks via a popup by the wheel.
- P6 (polish) Double turn: seat name cut to "Y..." by "two turns in a row".

## Online table talk (2 clients, broadcast transport, b2871be7)
- Quick line reached the other player in 53 ms, typed line too, lands in the log, Enter opens / Escape closes, bubbles gone after 9 s, no console errors. Shot /tmp/qa/talk/gus-sees-line.png.
- Note: a dashed "empty" box sits left of the follower cards in the shop at setup (2 players). Check it's intended (shop layout).

## Panel: game skeptic (full game, no crash/softlock/lost state; resume mid-choice, reload, Back all held)
- S1 (confusing) Home "Past games" opens one line jammed at the bottom edge at 1270x700, no scroll, click did nothing visible. Shot /tmp/qa/069-past3.png. Routed to the save owner.
- S2 (polish) Home names the person P1, the game says You.
- S3 (confusing) Escape backs out of the pay sheet but not the artifact pick, Churn or Collect Debts picks; nothing says how to back out.
- S4 (polish) Collect Debts: progress only in the "N left" counter.
- S5 (not a bug) Greatest Hits copy of Tithe "+9 vs +13": engine pays the chip exactly (checked with a scene); +9 was the chain's running total.

## Panel: UI critic (full game, no crash/softlock)
- U1 (wrong rule, FIXED bec83220) Spree ended after one recruit when the recruit was a usable member (Speculator): the use-or-finish step's Done dropped the rest. Live since v0.9.1 or earlier.
- U2 (confusing, FIXED 1a88be0e) Panel's Demote picker headed "Swap any two equal-cost members"; targets were right (Demote: shop cost at least 2 less).
- U3 (confusing) Greatest Hits pick: Tithe's wheel tile reads +14 (live, your members now) but the copy pays the chip (+10, what the taker got). Engine follows the rulebook; the tile misleads during a copy pick.
- U4 (confusing) Panel's member list clipped, wheel-only scroll, no scrollbar.
- U5 (confusing) Twins paid with no pay sheet; header said "choose how to pay"; "Paid 3" stamp landed on the refill card.
- U6 (confusing) Recruit prompt headed "Churn" after Trendsetter (fixed by 52bee21c, log names Trendsetter now); "You sends" grammar.
- U7 (confusing) Suggested payment for 10 followers spends the only red/blue/green while holding 25+ gold.
- U8 (polish) Details view: long-text cards lose portraits, Straggler taller, text against the cost row.
- U9 (polish) Floating follower gain lands by the last resource, not the follower number.
- U10 (polish) "Penny Pincher: gold counts double" line on every pay sheet, even paying no gold.
- U11 (polish) Round III summary: P4's row behind "More below"; results screen opens a contest popover under the leftover pointer.
- U12 (polish) Round I: lit shop and "Done, no recruit" linger ~2 s after the recruit.
