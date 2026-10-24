# Game skeptic — wave 4 (laptop 1270×700, quiet box)

Build: commit 8ea3e24, production build served by `vite preview` on 5195, driven only through v4-eyes (port 5551). Shots: /tmp/eyes/skeptic/NNN-*.png (local to the review box).
Session 1: full game, Classic table (Gold, Red, Blue, Green; Gold's Collect Debts steals), 3 Normal bots, speed Steady. Final: P2 72, P4 62, P3 61, me 57 (last).
Session 2: Random 4 table (Magenta, Silver, White, Yellow), speed Quick, played badly on purpose through most of round I: double-clicks, spam clicks on a steal, keyboard only, spinning the wheel, resizing to 900×600, clicking disabled things.
Page errors at the end: 0.

## Findings

1. [major] (24) every game-screen state — input is slow everywhere on the game screen. Hovering a wheel space takes 126–523 ms to first change (sweep at 026–036: 196, 502, 133, 273, 221, 273, 471, 301, 523 ms). Placing a minion takes 277–430 ms (037: 412, 075: 277, 115: 430), shop-card hovers 151–408 ms, pay-picker coin taps 187–225 ms, Escape on the log 226 ms. The browser's own input→paint is 150–300 ms, so the main thread is busy, not an animation delay. Home and setup answer in 16–70 ms, so it's the game screen. The designer's bar is under 100 ms; almost nothing on the board meets it. Profile the render on hover/place (the whole board seems to re-render). shot: 026-hover.png … 036-hover.png
2. [major] (24) setup — Start takes 689 ms to show anything (012). Same thing after "Start round II" (300 ms) and "Start round III" (431 ms). shot: 012-click.png
3. [major] (20) round II, copy a space (Encore) — the header says "Encore: pick on the board", then a grid of 8–12 text chips covers the wheel (101, 171). The designer has said: every choice is picked on the board, never from a grid of chips. The spaces themselves already have gold outlines (099), so clicking the outlined space should be the pick. shot: 101-shot.png, 171-shot.png
4. [major] (14) Encore chips — the chip values show what the space gave its taker, not what I'd get: "Tithe (Sk): +3" while my Prospector makes it +4 for me; "Golden Years (Sk): +6" gives me +7. The hover says "+8 your best pick" and the chips disagree with it. shot: 101-shot.png
5. [major] (1, 14) round III, Tribute Band "Use: +7 ●" — it actually gave +6 +1 (Golden Years copy) and then opened a Collect Debts steal worth +3 +1 more: +11 total. The button undersold it by 4 and didn't say a steal would follow. shot: 153-shot.png, 156-shot.png, 160-shot.png
6. [major] (1) the bottom-left toast — after I placed on Spree, the toast read "You took Spree / +3 ● / 3 ● from P2 / Tribute Band: +6 ● / Prospector: +2 ●". Those lines came from my previous move (Tribute Band + Collect Debts); Spree gives no resources. It credits the wrong move. Earlier it was titled just "You". shot: 162-shot.png, 156-shot.png
7. [major] (1, 8) the toast keeps growing through bot turns and pushes "Since your last turn" down to "1 earlier… open the log", so the strip meant to tell me what rivals did gets squeezed out by my own stale result. shot: 051-shot.png, 090-shot.png
8. [major] (22) at 900×600 the toast sits on top of the first shop cards. Those were Crew and Front-runner, the only two I could afford. shot: 215-small.png
9. [major] (5) setup, starting-resource pick — a double-click on Magenta used both of my picks (2 magenta) with no confirm and no undo. A doubled click shouldn't spend two separate decisions. shot: 194-shot.png
10. [major] (1) round I, Even Swap preview — "+1 follower" was promised and my followers stayed at 4 → 4 after the swap. Either the preview is wrong or the gain is hidden. shot: 031-hover.png, 065-shot.png
11. [major] (12) setup pick — the "Redistribute" space hover opened over the "Pick 1 of 2" panel and covered the color labels I was choosing between (Magenta / Silver / White / Yellow cut in half). shot: 190-shot.png
12. [major] (4, 23) Random table — the Silver members, White members and colorless members (Insider) are nearly the same grey on grey. At card size, Toastmaster (silver), Exporter (white) and Insider (colorless) read as one color. The only way to tell is a 2× zoom on the cost dot. shot: 191-costs.png, 221-shot.png
13. [major] (6) round III — two bot minions (P2 cactus and P4 skull) sit on the same +6 green space. The rulebook says each space holds one minion per round. Nothing on screen says why (some member allowing it?). I had to guess. shot: 134-shot.png
14. [major] (26) bot turns — Tax Collector paid P4 +1 gold every time I bought followers (P4 went 2→3 gold across my buys). Nothing travels from my buy to P4's seat, and it isn't in my toast. A rival profiting from my move should be visible as it happens. shot: 164-shot.png, 166-shot.png
15. [major] (4) buying followers — a multi-color purchase opens the pay picker. A single-color one pays instantly with no dialog (4→3 at 120, 10→10 at 151). The same button behaves two ways, and in 151 my follow-up click landed on the board. shot: 120-shot.png, 151-shot.png
16. [major] (25) round-end Reckoning — about 5–6 s of overlays, one quadrant at a time, before the summary (067). It's legible, but in round III it's 6 more seconds with nothing to decide. The Skip button is the small grey pill bottom-right, far from the overlay. shot: 067-idle-frames.png, 175-idle-frames.png
17. [major] (8) Kickback rival pick — all four seats get a glowing border, my own included, and the header says "Click a rival's cult". My own seat looks pickable. shot: 115-shot.png
18. [major] (14) log line "P3 Bandwagon (+1 ● red per recruit by all): +6 ● gold" — the space says red, the gain is gold, no reason given. A copy, a member? I couldn't tell. shot: 096-shot.png
19. [polish] (29, 26) the wheel spin (drag or arrow key) springs back to its home position, and mid-spin the rim and space text is upside down. The rulebook says "You can spin the wheel", but it won't stay where I put it, so there's no point. Arrow key: 514 ms to first change. shot: 203-frames.png
20. [polish] (9) clicking the disabled 8→6 tile does nothing: no "Need 8, you have 4" by the pointer. Unaffordable shop cards do explain themselves in the hover, so the tiles are the odd one out. shot: 221-shot.png
21. [polish] (9) Redistribute spam-click on P2 — correctly refused, with a note by the pointer, but the note was clipped off the top of the screen (first line cut at y<0). shot: 211-shot.png
22. [polish] (1) during a steal, the stolen coin doesn't leave the rival's stack until the whole steal finishes. P2 still showed 3 silver after "1 left". It reads as if the click did nothing. shot: 211-shot.png
23. [polish] (15) toast after a steal: "+2 ● magenta / 1 ● from P2 / 1 ● from P4" says the same 2 coins twice, once in each color. shot: 213-shot.png
24. [polish] (5) pay picker — the faded "paying" coin and the faded "you have none of this" coin are the same pale disc (red at 109: paying; blue/green: empty). The only difference is a number under the stack. shot: 081-pay.png, 109-pay3.png
25. [polish] (7) pay picker default — for Middleman it proposed paying gold, my scoring color, and kept red. I had to retap. A default that spends what you're leading in is a bad suggestion. shot: 080-shot.png
26. [polish] (16) pay header for "6 followers" draws three follower figures, and "10 followers" draws three too. The icon count is decoration that looks like a count. shot: 107-shot.png, 138-shot.png
27. [polish] (8) during the buy step, wheel spaces stay bright cream (only taken ones dim), so the board still looks placeable after I've placed. shot: 041-buy.png, 076-shot.png
28. [polish] (19) shop sorted by cost — a refill drops a new card mid-grid and slides every card after it, so the card I was eyeing moved under my pointer between turns (Snob, Ensemble). shot: 112-shot.png, 123-shot.png
29. [polish] (2) Encore hover: "about +1 ●, +1 member, +3 👤 your best pick" — "about"? It's a computed preview; hedged copy makes it feel unsure. Its "Most green: You'd have 0 or 6" line is about a different pick than the "best pick". shot: 169-hover.png
30. [polish] (13) Echo / single-target copy — with one copyable target it still asked for a second click on a highlighted space. shot: 037-click.png
31. [polish] (2) Open Door / Hand-pick preview says "+1 member … your best pick" without naming the member. I had to guess which card it meant. shot: 048-hover.png, 124-hover.png
32. [polish] (6) the rivals' "+3" / "+5" small marks beside their member rows (hidden members?) have no hover explanation I could find; I took them for followers. shot: 096-shot.png, 134-shot.png
33. [polish] (4) setup: picking an emoji another seat holds silently swaps that seat's emoji; the picker shows no "taken" state. shot: 008-click.png, 009-click.png
34. [polish] (4) the setup seats have teal/pink/lilac underlines that match nothing in the game. shot: 007-seat.png
35. [polish] (4) the intro showed a pizza leader although I'd picked the crab. shot: 014-i2.png
36. [polish] (4) my seat shows the robed leader with a tiny crab emblem; rivals show their bare emoji. Two ways to draw "a player". shot: 017-board.png
37. [polish] (29) a stray thin vertical line runs down the left of the seat column (x≈40, y≈110–410), with dots and a down-arrow. Its meaning (turn order track?) never became clear. shot: 017-board.png, 070-shot.png
38. [polish] (30) home screen: the name I typed ("Sk") in setup doesn't come back in the home name field. shot: 182-shot.png
39. [polish] (8) results: "You & members" column header; "the rims' prizes" — "rims" is the rulebook's word, but "ring prizes" vs "rim prizes" vs "round-end prizes" appear in different places. shot: 178-results.png
40. [polish] (13) results hovers are good, but the hover for "Bought 47" calls them "trades" ("the 2→1, 4→3 … trades"): a fourth name for buying followers. shot: 179-hover.png
41. [polish] (22) Kickback hover covers half the wheel and the Free recruit space under it, 280 px wide on a 140 px target. Most hovers are wider than they need to be. shot: 113-hover.png
42. [polish] (21) at 900×600 the space faces drop their small print ("+2 ●" alone, no phrase), and "Since your last turn" moves to the top right, truncated to "recruited…". shot: 215-small.png
43. [polish] (17) glyph count before my first move was about 9 (four resource dots, the split "any" dot, the follower mark, ring numerals, the "EACH ROUND" badge, the deck eye, the minion icons). Learnable, but over the 7 budget.
44. [polish] (6) a colorless member's hover says "Colorless here: it counts as a member of no color", but the card art is tinted grey like Silver. The art contradicts the rule. shot: 221-shot.png
45. [polish] (25) on Quick, bot turns still take ~1–2 s each with 4 moves landing in the log while I watched; fine. On Steady, a full bot cycle was 8–12 s with a few dead seconds. Acceptable, noted.

## The ten audits

1. Call to action — Setup pick: the "Pick 1 of 2" panel in the wheel hub is clear; good. Place: glowing spaces plus the header "place a minion on a glowing space"; strong. Recruit or buy: affordable cards and tiles go bright and the rest dim; strong; Pass is a small pill but fine. Choose a rival (Kickback): every seat glows, mine included; weak. Copy (Encore): the chip grid wins the eye over the outlined spaces; wrong target. Pay: the dark "Pay" button wins; right. Round end: "Start round II" pill; right. Results: "Play again"; right.
2. Card anatomy (Middleman, shop face) — loudest: portrait; then colored card tint; then the name in caps; then the cost "2● 2◕" and "1👤" in the footer at ~11 px. The hover: portrait, name, one-sentence ability. The order is right for Cory's call (who + cost on the face, ability in the hover). The cost is the smallest text on the card; for a buy decision it should be one step bigger.
3. Glyph census — 4 resource dots (one per table color); split "any" dot; follower mark; ring numerals I/II/III; minion emoji; leader figure; the deck's eye sigil; struck price; "USE" tag; "+N" overflow marks on member rows; the vertical turn rail with dots and an arrow. 11–12. Silver dot vs White dot vs "any" dot are near-twins at 1×. The rail's dots carry no meaning I could learn.
4. Duplicate census — the toast repeats the log's latest line (keep the log line, shrink the toast); the steal toast lists both the magenta gain and the coins taken (keep one); the round summary repeats the rim prizes already shown during the Reckoning (fine, a summary is a summary); "EACH ROUND +1●" on the seat repeats the member's hover (fine).
5. Prominence — Place (every turn): biggest thing on screen, right. Recruit (most turns): 10 big cards, right. Buy followers (often): four tiles top right, right size. Release (rare): only words in the subtitle, "or release a member"; I never found how to do it without hovering every member. Pass (often): small pill, acceptable. Use a member (rare): a ring on the member plus a Use button in the hover; findable.
6. Order — Shop: by cost, with a cost/color toggle; visible and usable, but refills reshuffle positions. Seats: turn order with "now / next / in N again"; clear. Members in a seat: recruit order; not stated, fine. Encore chips: no visible order (not by value, not by color).
7. Hover census — every wheel space, card, seat member, rim and result number opened something, anchored next to the pointer (12–20 px). Space hovers carry "You'd get / Why / Most X" and are genuinely useful; that's the best thing on the screen. Noise: the "Most members" line on hovers where the pick doesn't change members. Missing: the 8→6 disabled tile, the rail dots, the "+3" overflow marks.
8. Motion and art — placing: the minion travels to the space and coins fly to the seat (~1–2 s on Steady, followable). Recruit: the card flies from the shop to the seat (046 frames). Steal: the coin glows but only moves at the end. Wheel spin: springs back. Sprites: crisp pixel portraits, distinct poses, but a samey palette within a color; Silver/White/colorless are near-identical.
9. Space budget — the wheel (~560×560, center): right, it's the game. The shop (~290×520, right): right. Seats (~300×430, left): right. "Since your last turn" plus the toast (~300×200, bottom left): too much for the toast, too little for the log it crowds. Follower tiles (~290×120): right.
10. Decipher test — "+1● per recruit by all this round" → I guessed "+1 red each time anyone recruits"; right. "Copy a space a rival just took" → right. "swap, equal cost" → I guessed swapping resources; it's a member swap; wrong. "Buy 3 times this turn" → right. "Top up +1 of your fewest" → right. "+2● +1 per rival with more 👤" → right. "EACH ROUND +1●" on the seat → right. "+3" after a member row → guessed followers; unresolved. "8 left" under 8→6 → right. "MOST FULL SETS · ties: yellow" → guessed "a set = one of each color"; never confirmed on screen.

## Verdict

NOT YET.

## Grades

- Flow: B. Whose turn, which step and what bots did are always readable; the toast attribution bug and the chip grid break it.
- Feedback/feel: C. Everything travels and answers, but at 150–500 ms per input on the board; it feels heavy, not tactile.
- Learnability: B. The rulebook plus "You'd get / Why" hovers taught me the game by mid round I; I guessed wrong only on "swap, equal cost" and the double-occupied space.
- Legibility: B. Scores add up by hand in every round summary and on the results screen; Silver/White/colorless and the hidden Tax Collector payouts hurt.
- Craft: B-. A consistent, warm, chosen look; stale toast content, duplicate glyph systems for players, and spring-back spin are rushed edges.
- Robustness: B+. 0 page errors, double-clicks and spam guarded, resize reflows and restores, the game always finished; one double-click consumed two picks.
- Overall: B-. A friend would play it tonight. It isn't a product yet: too slow to the touch, and a few screens tell small lies.

## Misreads

- The bottom-left toast "You took Spree +3 ● 3 ● from P2 …": I took it to mean Spree had given me gold. It was the previous move's result. Found by checking my resources (12 → 12). shot: 162-shot.png
- "swap, equal cost" (+1 red space): I read it as a resource swap. It's a member swap. Found in the hover. shot: 058-shot.png
- Two minions on one space: I first took it for a rendering glitch, then for a rule I'd missed. Still unexplained. shot: 134-shot.png
- The "+3"/"+5" after rival member rows: I took them for followers from members. Unresolved. shot: 096-shot.png
- Tribute Band "Use: +7": I took it as the full payout and expected no further choice. A steal choice followed and paid +4 more. shot: 153-shot.png
- Encore chip "Tithe (Sk): +3": I read it as my gain; it's the original taker's. shot: 101-shot.png
- Insider (colorless) read as a Silver member until its hover. shot: 221-shot.png
- The vertical rail left of the seats: I took it for a scrollbar. shot: 017-board.png
- Rule I got wrong from the screen: I expected every follower buy to open the pay picker; single-color buys don't, and my next click hit the board.

## What genuinely works

- The space hovers ("You'd get / Why / Most X, who has what") are the best teaching tool I've seen in a prototype; they make every placement an informed choice.
- Every round summary and the results table add up to the follower, and the results line ("P2 won by 10, mostly from the rims' prizes") explains the win.
- Robust under abuse: no errors, steals refuse over-takes with a reason, resize recovers, keyboard Tab walks the spaces with a focus ring and hover.

## Felt unfair or unfun

- P3 went from 36 to 55 in one bot turn in round III (copy-all-my-spaces plus two 10→10 buys). Felt helpless: I could see their 28 gold coming, but there's no way to touch a rival's pile except one 3-coin steal.
- Watching P4 earn +1 gold every time I bought followers (Tax Collector). Mildly cheated, mostly because I only noticed by counting coins; it would sting in a fun way if I saw it land.
- The round-III Reckoning: six seconds of overlays I couldn't affect, after the game was already decided. Bored.
- Even Swap's promised +1 follower that didn't show up. Annoyed, and it made me distrust the previews for a turn.
- Being the steal target never hurt much (1 coin), and stealing on the Magenta table felt good: small, chosen, aimed. That's the right sting.

## Table talk

It's a nice-looking little wheel game, warm wood and pixel people, and the hovers tell you exactly what each spot would get you, so you never feel lost.
The tension is in round III: everyone's been hoarding, and suddenly people are buying ten followers at a time. I went from 18 to 57 in one round and still came last.
Best moment was copying someone's red jackpot with Encore and dumping it straight into the 8-for-6 buy.
Most boring stretch was watching the round-end scoring tick through four colors when I already knew who'd won them.
My choices mattered early (which engine to build) but late it felt like everyone just converts gold to followers as fast as they can.
It feels a bit sluggish to click around, like the board is thinking.
I'd play again with the Magenta table and three friends; stealing from whoever's ahead is the fun part.
