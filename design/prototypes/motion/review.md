# Motion review (the motion designer, against grammar.md)

Each round: what reads wrong, at which ms, and the fix. Numbered across rounds, so a fix can be named by number. Every finding names its instrument.

Instruments:
- **Plan probe:** `planChain` (src/v4/game/director.js) over whole 4-bot games played by Normal bots with effect streams, P1 counted as "you". It uses the plan's own 450px typical distance, needs no screen, and isn't affected by the box's load. It's bundled with esbuild from the designer's scratchpad (`md/plan-entry.mjs`). It measures the targets H2–H4 and H7–H9 at the level of the plan; the real table can only be slower.
- **Live trace:** a Playwright run on the designer's dev server (:5414, live tree, `?trace=1&speed=steady`) that logs every `Element.animate`, ghost, held number and phase change with page timestamps. The box ran at load 31–37 on 4 CPUs, so absolute times are noise. The trace is good for order and for numbers that change at the wrong moment.

## Round 1 (05:20, director.js as of 05:08)

### Blocking the budget (H2, H3)
Plan probe, Steady, 6 games: **a rival's turn is 3.22s p50 and 6.61s p95** (target 2.0 / 3.0). **The wait between your turns is 9.31s p50 and 19.7s p95** (target 6.5 / 9). Placement chains are fine (0.96s p50). The time goes to four things:

1. **A step with nothing to show costs 600ms even when the same bot moves again.** `useTable`: `dwell = chainMs || base`, so a bot's "what to buy" step (before its "how to pay" step) and its choice steps each sit for `BOT.pace` with nothing on screen: 257 'buy' steps at p50 600 = the floor. Fix: when the next step is the same bot's, a step with no chain costs 0; a pass that ends the turn holds 300ms at Steady (Quick 150, Relaxed 500). Measured with the probe: the wait goes from 9.31s to 7.55s, and a rival's turn from 3.22s to 2.62s.
2. **A rival's recruit waits 320ms before its coins leave** ("0:card(335) 320:piece…"). That's `MO.rivalBuyHold` 200 on top of the 120 lift. The grammar now has no extra hold at Quick or Steady (M7: the card stays lifted while the coins fly into it, and that is the telegraph). Fix: `rivalBuyHold: [0, 0, 160]`. Saves 200ms on each rival recruit.
3. **The card waits for the last coin to land** (coins land at 655/695, and the card leaves at 695 and lands at 1030). M7 step 3: the card leaves when the last coin is two-thirds there. The coins aim at the card's lifted spot and fade in their last 15%, so nothing shows a miss. Saves about 110ms per recruit.
4. **When the same bot moves again, its next step waits for the chain's last landing (plus its rolls).** The grammar now says the next step shows at this chain's hand-off (the last piece two-thirds along). Fix: `planChain` returns `handoff` as well as `total`; the table advances at `handoff` when the next step is the same bot's, and at `total + breath` when the turn passes. Saves about 110–250ms per bot step, two or three steps a turn.

With 1–4, the probe's arithmetic puts a rival turn at about 2.0s p50 and the wait at about 6.3s. I'll re-measure when they land.

### Wrong in the plan
5. **A rival's placement pulses after its read hold instead of inside it** ("0:minion(380) 540:pulse(90) 620:piece"). S2: the pulse is the last 90ms of the 160ms hold (450–540), and the first piece leaves at 540. Fix: `at(landed + readHold - pulse, pulse)`; `t = landed + readHold`. Saves 80ms on each rival placement.
6. **The worth hop's tick lands 95ms after its follower mark** ("1030:piece(240)x1 … 1365:land(240)"). `pieces()` schedules the landing at `fly(from, to)` (335), while the piece flies `opt.dur` (240). The count ticks after the mark has already vanished. Fix: in `pieces()`, use `opt.dur ?? fly(from, to)` for both the flight and the landing.

### Wrong on screen (live trace, Kickback with Prospector, your turn, round II)
7. **The turn card shows the result before anything flies.** "You took Kickback +3 / Prospector: +1" mounts at +50ms after your minion stands, and the gold pieces leave about 570ms later. Principle 1: the summary appears with the chain's last landing. Fix: `showTurnCard` waits for the chain's `total` (or a skip).
8. **Under load the chain bunches, and numbers tick before their pieces land.** The three gold pieces left at +0, +27 and +73ms (the plan says 60ms apart). Prospector hopped at +74ms, while the main pieces were still in their first fifth (the plan says at the last piece's two-thirds, about +365ms). The gold's held number went 5 → 6 → 7 → 8 at +140, +232 and +246, all before the first piece could land (+367), and it let go to the final 9 at +288, about 80–200ms before the last pieces arrived. Cause: every atom is its own `setTimeout` from the chain's start, and each landing tick is a timer of its own. When the main thread stalls, the due timers fire together, and the tick timers run ahead of the pieces' animations, which start late. Fix (grammar §5, "the timeline bends, it never bunches"): run the chain on one clock that stops while a frame is late (rAF time, capped at about 50ms per frame), and tick each landing from that piece's `animation.finished`, not a separate timer. The engine's numbers still win on skip or at the safety net. Slow phones will hit this too, not only this box.
9. **Ghosts linger after they land.** The four gold pieces' ghosts were removed at +1866ms, but their flights ended by about +500ms. A piece that lands with opacity 1 and `fill: forwards` sits on the stack as a second dot for over a second. Fix: remove the ghost on `finished`, and make the landing frame fade it (opacity 0 over its last 15%, as the stack's settle takes over), so a missed `onfinish` still leaves nothing visible.

### Right already (keep)
- Your minion stands at once (a 140ms stamp), with a 180ms trail and the space's pulse at +0: S1 as written.
- Flight time from distance: 367ms for about 556px, exactly the Steady formula.
- Payments before purchases; the owner's gains before the spill; the paired magenta steal; 4+ as one bundle.
- The held number is set in a layout effect, so the final number never flashes before the hold (checked: the text and the hold change in the same task).

## Round 2 (05:30, live tree as of 05:2x on the designer's frozen-watch server)

Instruments: two more live traces (a gain plus a recruit, then three bot turns; Golden Years with Prospector, round II), one of them with animations slowed to 0.4× through CDP for screenshots. The box was at load 28–37.

### Blocking
10. **A stack shows a negative number.** Golden Years (+4 as a bundle), then Prospector (+1): your gold should read 5, then roll to 9, then tick to 10. Trace 2: the held number went 5 → **2** at the bundle's landing, then rolled 5 → 9. Trace 3: it went 5 → **−37** at the landing and rolled up through −32 … −25 over about 2s; on screen the stack read "−2x●" (`review-r2-stack-negative.png`). Nothing left the gold stack in this chain, so something steps its hold down: a departure whose source resolves to the wrong stack, or two holds racing on one element. Fix the cause, and guard every held number so it stays between that stack's before and after values (clamp, with a dev warning). It is the one thing on screen that's outright false.
11. **The refill is dealt before the bought card lifts.** `useDeal` (MemberDeck.jsx) runs at the recruit's commit: in trace 2 the deal started 55ms before the card's flight, so the new card turns up in the slot while the old card is still lifting out of it. B4: the deal is bookkeeping in the chain. The row closes its gap once the card has left, and then the pile deals. Make the deal a chain atom (after the card's departure plus the shop slide). Also, the deal turns face up in its first 32% (rotateY 88 → 0 by offset .32); B4 has it travel face down and turn up in its last 40%, so the card is revealed where it lands.

### Wrong (more evidence for 8, under load)
12. **The coin flew into an empty slot after the card had gone.** Trace 2, your Intern recruit: the card's one long animation (lift, wait, travel: 853ms) started at +0, and the red coin's drop left at +964ms, after the card had already landed in your crowd. The card's travel and the coins are on different clocks: the card is one WAAPI animation with its wait baked in, and the coins are `setTimeout`s that ran late. Same fix as 8: the card's travel starts from the coins' real arrival (their `finished`), not from a precomputed wait.
13. **The follower count jumped before the worth hop.** Same recruit: your count's text changed to 7 at +2.1s, and the worth hop's follower left at +4.4s and landed at +5.1s. M7: the count never changes on the card's landing without the hop, and it ticks when the mark lands. The count's `Tick` and the worth piece aren't coupled. Hold the count like a stack (or have `Tick` wait on `arrivalFor`) until the worth piece's `finished`.
14. **A bundle's count label lands on top of the stack's number.** At the gold bundle's landing the screen read "5 +4● ●5●": the "+4" sits over the stack's "5" for the last frames (`review-r2-bundle-landing.png`). Fade the label out over the bundle's last 25%, so only the dot merges into the stack's dot and the stack's own number rolls.

### Verify on a quiet box (couldn't tell under this load)
15. P2's placement in trace 2 logged no minion flight: the space pulsed and its pieces flew, but no `minion-flight` ghost appeared for seat 2 (seat 3's did, later). Check that a rival's placement shown while your previous chain is still playing still flies its minion (S2).
16. P2's release: the refund's piece left about 730ms **before** the member's drop to the pile. M8 has the card leave first, with the refund leaving at 40% of its flight. It may just be timer drift under load (8).

## Round 3 (05:35, director.js and GameScreen.jsx as of 05:27)

Fixes 1–4 have landed: a bot step with nothing to show costs nothing when the same bot continues, a turn-ending pass holds `MO.passHold`, `rivalBuyHold` is 0 at Steady, and the same bot's next step shows at the plan's `handoff`. Plan probe, 8 games, Normal bots, a turn counted from each placement:

| Steady | Round 1 | Now | With 17 | Target |
|---|---|---|---|---|
| A rival's turn, p50 / p95 | 3.22s / 6.61s | 1.97s / 2.91s | **1.85s / 2.83s** | ≤ 2.0 / ≤ 3.0 (H3) |
| Your turn's chains, p50 | 1.90s | 1.49s | 1.43s | about 1.2–1.6 |
| The wait between your turns, p50 / p95 | 9.31s / 19.7s | 6.84s / 13.3s | **6.44s / 12.7s** | ≤ 6.5 (H2) |
| A rival's placement chain, p50 | 0.96s | 0.76s | | |
| A rival's recruit chain, p50 | 1.39s | 1.11s | | |

Quick now: a rival turn 1.25s, the wait 3.99s (both in budget). Relaxed: a rival turn 3.77s, the wait 12.2s (3.35s and 11.7s with 17).

17. **Tighten three Steady holds to land the wait at 6.5s.** A rival's minion flight 380 → 340ms, the read hold 160 → 130, the breath 180 → 120 (Quick 220 / 60 / 60, Relaxed 520 / 280 / 300). Measured by patching those three values into the probe: the wait goes 6.84s → 6.44s, a rival turn 1.97s → 1.85s. A space still gets 130ms of stillness to be read before anything leaves it, and turns still separate. The grammar's table is updated.
18. **H2's p95 was set wrong.** In snake order your wait is sometimes six rival turns in a row (the turnaround), so the p95 is that gap: 12.7s at 1.85s a turn. No honest pacing gets it to 9s without making those turns unreadable. The grammar now states it as "the snake's long gap ≤ 13s", with H2 judged at p50. Relaxed's targets are now a rival's turn ≤ 3.5s and the wait ≤ 12s: it's slower by design.

Landed as well: 5 (the pulse is now inside the read hold) and 6 (the worth hop's tick uses its own duration). Still open from rounds 1–2: 7 (the turn card before the pieces; not re-checked), 8 / 12 / 13 (the timeline bunches under load; the coins and the count run on their own clocks), 9 (ghosts linger), **10 (a stack showing −37: blocking)**, 11 (the deal before the card lifts), 14 (the bundle label over the number).

### Round 3 re-check (05:37, director.js and flight.js as of 05:32)
- 10: **not reproduced** on the 05:32 code (one live run: the gold's hold went 5 → 9, then let go at 10). Keep the clamp guard anyway; a held number outside a stack's before and after values should never reach the screen.
- 7: **still open.** The turn card mounts at +474ms, and the bundle leaves at +1113ms.

## Round 4 (05:44, live tree as of 05:39): deterministic filmstrips
New instrument: **filmstrip** (`design/prototypes/motion/film.mjs`). Playwright's fake clock drives every timer, rAF and `performance.now`, and each Web Animation is seeked to the same virtual time before each screenshot. A frame at "400" is exactly 400ms into the chain at Steady, whatever the box's load. Usage: `node design/prototypes/motion/film.mjs <url> <outdir> steady 4 "<space regex>" <ms> <step> 2 place|rival`. Unlike the live traces, everything below is load-free.

19. **Your stack shows the final number at the click, then goes back.** Golden Years with Prospector: at 0ms your gold reads **10** (the final), at 50ms **5** (the hold), and later 10 again (`review-r4-gain-stack-filmstrip.png`, the first two frames). That's a 5 → 10 → 5 → … → 10 flicker on every gain. The holds are set inside `schedule(base, …)` (director.js), so they land a frame after React has painted the new state. Fix: set every hold synchronously in the layout effect, before the first paint of the new state.
20. **The roll lags its landing, then gets cut short.** The "+4" bundle lands at about 400–450ms, but the number still reads 5 until about 600, reads 7 at 650–700, and then jumps to **10** at 750. 8 and 9 are never shown, and Prospector's +1 lands into a jump instead of a tick. Expected: 5 → 9 rolling 420–660, then 9 → 10 as Prospector's dot lands. Fix: start the roll on the bundle's own landing, and when another arrival comes mid-roll, retarget the roll; never `done()` a hold while a roll is running (§5, "numbers stay honest").
21. **A minion placed on a space that's already taken never flies (Squatter).** "P3 joined P2 on Grove": P3's frog stands next to P2's minion with no flight from P3's column, no stamp and no pulse, and its "+5" leaves the space at 325ms (`review-r4-squat-no-flight.png`). `planChain` finds placements as slots that were empty before (`before.slots[k] === undefined`), so a second minion on a taken space (Squatter) and a Straggler's move are invisible. This is the cause of 15. Fix: find the placement from the move or the actor's `lastSlot`, not from newly filled slots.
22. **The cost-sorted shop reshuffles diagonally.** When the row changes on a rival's turn, every card after the change slides to its new cell at once, and the cards that change rows travel diagonally across the others. At 2470ms Blue Devotee overlaps Intern, and Tinker sits half over Investor (`review-r4-shop-reflow.png`). It's bookkeeping, but it's the loudest motion on screen. Fix: a card that stays in its row slides along it; a card that changes rows fades out where it was (80ms) and fades in at its new cell (160ms), never crossing the grid. A refill deals only after the row has settled (11).
7 (again, load-free): the turn card mounts with the state: "P3 joined P2 on Grove" at 260ms, the same frame P3's minion appears and before its "+5" leaves.

The good, load-free: the "+4" bundle reads as one handful with its count (300–350ms); its arc from the space to the stack is clean; Prospector hops at the bundle's two-thirds point and its dot leaves the member and lands after the bundle (500–650ms). The order is right; the numbers aren't yet.

## Round 5 (05:47, filmstrips of your recruit and the next rival's turn; live tree as of 05:39)
`review-r5-recruit-filmstrip.png` (your Intern, 0–500ms) and `review-r5-release-filmstrip.png` (P3's gain and release, 1250–1500ms).

23. **The end state paints at the click, then the chain rewinds it (cards too).** At 0ms the Intern is already in your crowd and your red reads 4. At 100ms the chip is gone, your red reads 5 again, and the Intern is back in the shop, lifted. The same root as 19 (the holds and the "not landed yet" hiding run a frame late). Fix as in 19: hide a recruited chip and hold every number in the layout effect, before the first paint of the new state.
24. **A released member flies as a blank square, after its refund.** P3 releases Benchwarmer. The 1 red refund leaves where the chip was at 1300ms and lands at 1500, and only then does a blank cream square (the chip's ghost, with no portrait) appear and leave for the pile. M8: the member's own picture leaves first, as a drop to the pile, and the refund leaves when the card is 40% along. This is 16, now confirmed without load. Fix the ghost's HTML (use the chip's portrait) and the order.
25. **A hover card opens by itself and covers the bought card.** The refill dealt under your resting pointer opened "Green Helper · costs 2●" at 0ms, and it sits over the shop's top row for the whole lift (0–500ms), right beside the Intern being bought. Hovers should open on pointer movement only, never because something moved under a still pointer. (Fixing 11 helps too: the new card shouldn't be in the slot yet.)
26. **The card being bought looks washed out.** From 100 to 400ms the lifted Intern is pale, as if disabled (the ghost copies the card after it lost its `.can` state). It's the subject of the beat: it should be the solid, lifted card, the way it looked when you clicked it.
27. **The header runs ahead of the table.** All through your recruit chain the header reads "P3 is placing a minion…", while your own card is still in flight and P3 hasn't moved on screen. The header should change when the next player's story starts (when the chain ends, or at the hand-off), so the one-glance line says what the screen is showing.

The good, load-free: the payment really comes before the purchase (the coin leaves your red at about 150–200ms; the card holds lifted and leaves at about 450, when the coin is most of the way there); the card's flight from the shop over the wheel to your crowd is one clean arc; P3's "+5" bundle reads at a glance.

## Round 6 (05:50, filmstrip of a 10-for-10 follower buy; live tree as of 05:39)
`review-r6-follower-buy-filmstrip.png` (your count on the left, the rates on the right, 0–1550ms).

28. **The follower count counts late, dim and slow.** The coins drop into the 10-for-10 tile (650ms), and the "+10" bundle reaches your count at about 1000. Its label lands over the count's digit ("6 +10★", as in 14). The count then changes in a dimmed tan instead of its cream (6 → 7 → 12 → 15 → 16, 1100 to about 1650ms): that's `Tick`'s 300ms + 30ms a step, capped at 550, starting about 100ms after the landing. M11 and §4: on the bundle's landing the count rolls in 240ms at full brightness with a 1.24 settle. A dimmed number reads as disabled; the eye should see the score jump up, not fade through it.
25 (again): when the pay dialog closed, the "Intro Offer" hover opened under the resting pointer and covered the middle of the wheel from 0 to about 900ms, the whole time the coins were in flight.

The good: every coin goes into the right tile (they pass over the 2-for-1 on the way, which reads fine), and the "+10" bundle with its trail reads as one big handful.

## Round 7 (05:55, re-filmed on the 05:44–05:47 code)
`review-r7-gain-stack-filmstrip.png`, `review-r7-recruit-filmstrip.png`.

Fixed (seen in the filmstrips):
- **19:** the stacks no longer flash their final number at the click. Your gold reads 5 at 0ms and 5 until the bundle lands.
- **20 (mostly):** the roll now shows every number: 5 → 7 → 8 → 9 → 10 between 600 and 850ms, with Prospector's +1 folded in, and no jump. Left over: it starts about 120ms after the bundle's lead dot lands (about 450–480ms). Start it on the lead's landing.
- **11:** the refill is dealt after the bought card has left (the Green Helper deals in at about 600–700ms, and the Intern leaves the slot at about 450).
- **26:** the lifted card is solid now.
- The recruit reads as written: the card lifts, the red coin leaves your stack at about 200ms and travels to the card, the card leaves at about 450 and arcs over the wheel to your crowd (lands at about 850), and its follower rises from the chip at about 900 and reaches your count at about 1050.

Still wrong:
- **23 (the chip):** at 0ms the Intern is already standing in your crowd, and the shop slot is empty. At 50ms the chip is gone and the card is back in the shop, lifted. The numbers are held in time now; the recruited chip and the shop card aren't. Hide the incoming chip, and keep the bought card's slot, in the same layout effect that sets the holds.
- **25:** the "Green Helper" hover still opens under the resting pointer and sits over the shop for the whole chain.
- **14:** the "+4" label still lands over the stack's number ("5̶+4" at 450ms).
- Not re-checked this round: 7, 21, 22, 24, 27, 28.

## Round 8 (06:03, filmstrip of round II's Reckoning; Reckoning.jsx as it stands)
`review-r8-reckoning-overview.png` (0–6000ms, every 300ms), `review-r8-reckoning-prize.png` (the first prize, 1200–1950ms). Seed 1, your last placement of round II, then pass.

Cory asked for this slower and clearer ("way too fast and confusing… one quadrant at a time, readable, with totals climbing as each prize lands", decisions.md). So the grammar's B6 now gives each rim about 1.6s at Steady, not my first draft's 0.9s (H10 is now ≤ 7s for four rims). The build takes about 2.7s a rim (11s for four), and most of the extra is still time:

29. **The rim being scored is hidden.** The "Most gold" card sits at the bottom of the wheel, over the Most Gold rim. The rim's light and its leader's emoji can't be seen, and the "+4" appears from behind the card's corner (1350ms, lower left). B6: the explanation never covers the rim it scores. Put it on the far side of the wheel from that rim, or beside the seats; the prize should visibly lift off the engraving.
30. **"counting…" is 900ms with nothing moving** (300 → 1200ms, and again 3000 → 3900). Meanwhile each seat's count (7, 5, 8, 3) is already shown beside it from the first frame. Make the counting the motion: the counts stamp in seat by seat, 100ms apart, then the leader's count and emoji hop. The suspense stays, and the dead air goes.
31. **The winner's count ticks about 500ms after the prize lands.** The "+4" reaches P2's count at about 1800ms; it still reads 10 at 1950 and 14 by 2400. It should roll on the landing (1800–2040). Same root as 28 (`Tick` runs on its own schedule).
32. **Per rim: about 2.7s now, 1.6s targeted.** Taking out 30's still time (about 900ms) and 31's lag (about 400ms) gets there without hurrying any step.

The good: one quadrant at a time; the measured count beside every seat, with the leader's ringed, reads at a glance (the "counted from" idea of B9); and the prize's flight from the rim's end to the winner's count is clear and well paced (about 450ms).

## Round 9 (06:06, filmstrip of your Collect Debts: 3 gold taken from P2, with Prospector)
`review-r9-steal-filmstrip.png` (0–1200ms, every 100ms; your three picks answered at 0, 50 and 100ms).

The take reads right. P2's gold is lit, the pieces leave it and travel straight down to your gold (no arc: a take, not a gift), and P2's number drops as they go (3 → 0 by 400ms). Prospector's +1 then leaves the member at about 600ms.

33. **Numbers trail their pieces, everywhere.** The three taken pieces are in your gold by about 500ms, but your gold reads 5 → 6 (500) → 7 (600) → 8 (800) → 9 (900). The last tick is about 400ms after the last stolen piece, and about 200ms after Prospector's. With 20's residue (the gain roll), 28 (the follower count) and 31 (the Reckoning prize), that makes four places where the number lags its piece by 100–500ms. Root fix, once for all of them: drive each destination's number from its piece's `finished` (or the bundle lead's), not from a timer or `Tick`'s own schedule. Principle 4 is the heart of "obvious": you can count along only if the number changes the instant the piece arrives.
34. **A ringed gold dot sits still over your red stack from about 400 to 600ms.** A gold piece with a light halo rests over the red stack's dot, between your gold and blue, for about 200ms, then goes. It's neither a take (those land on the gold) nor Prospector's (that one leaves the member at 600). Find out what it is: a mis-aimed piece, a pick highlight left behind, or a ghost from the third pick's chain landing on the wrong place.
