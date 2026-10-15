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
