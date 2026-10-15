# Motion review (the motion designer, against grammar.md)

Each round: what reads wrong, at which ms, and the fix. Numbered across rounds, so a fix can be named by number. Every finding names its instrument.

Instruments:
- **Plan probe:** `planChain` (src/v4/game/director.js) over whole 4-bot games played by Normal bots with effect streams, P1 counted as "you". It uses the plan's own 450px typical distance, needs no screen, and isn't affected by the box's load. It's bundled with esbuild from the designer's scratchpad (`md/plan-entry.mjs`). It measures the targets H2–H4 and H7–H9 at the level of the plan; the real table can only be slower.
- **Live trace:** a Playwright run on the designer's dev server (:5414, live tree, `?trace=1&speed=steady`) that logs every `Element.animate`, ghost, held number and phase change with page timestamps. The box ran at load 31–37 on 4 CPUs, so absolute times are noise. The trace is good for order and for numbers that change at the wrong moment.

## Round 1 (05:35, director.js as of 05:08)

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
