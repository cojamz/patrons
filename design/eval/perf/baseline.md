# Snappiness baseline (draft): what makes Cults feel slow

**Status, 2026-10-15 04:10 UTC: these are estimates, not a baseline.** They come from reading the code, plus the tracer's smoke runs and probes on this box. The box ran at load 30–45 on 4 CPUs, with a dev build at 1× CPU, while other agents' edits were hot-reloading the page. Absolute numbers from those runs are inflated by several times. Only the mechanisms and the ratios carry over. The real baseline runs on a quiet machine with the one-line command in README.md (local 4× and 1×, online with 80ms lag, two runs each). Its numbers replace the "smoke" figures below.

Read "smoke" as: dev build, CPU 1×, load 30–45, `?trace=1`. The two usable runs were smoke-local (round I, 9 min) and probe2 (one turn, with an arrow-key spin).

## Top 10, ranked by how much each likely costs the feel

1. **Every click runs the whole move and re-renders the whole table before the press can paint.**
   - What happens: onPick → `session.submit` (GameScreen.jsx:598) → local `apply` → engine `step` → `emit` (session/local.js:107, :129) → `setTable` (GameScreen.jsx:120). React then flushes the full table synchronously, inside the discrete click event.
   - Smoke: the click handler on a space took 931ms p95 (smoke-local) and 1240ms (probe2); input → next paint p50 696ms.
   - Estimate at 4× on a quiet laptop: 100–250ms from press to paint, every placement.
   - Smallest fix: let the press paint first. Wrap useTable's `setTable` (and useSessionState's `setState`) in `startTransition`, or apply the step one frame later (`requestAnimationFrame` → `setTimeout 0`) in local `submit`. The space's own `:active` press style then shows at once.

2. **The wheel spin re-renders the whole Wheel on every animation frame.**
   - What happens: `animateTo` (Wheel.jsx:272) calls `applyRot` → `setRot` per rAF frame (Wheel.jsx:242–244). The sockets `useMemo` depends on `rot` (Wheel.jsx:631, deps :721), so every frame rebuilds all 24 sockets with their sprites, the paper SVG, the rim text and the rim emojis. The 300ms duration (motion.js `MO.spin`) and the ease-out quartic are fine. The frame cost is the problem.
   - Smoke: ArrowRight → next paint 1936ms. Each spin showed one or two positions, because one frame took longer than the whole 300ms spin. Wheel render p95 142ms (smoke-local), 513ms (smoke 2).
   - Estimate at 4× quiet: 30–80ms a frame, so 4–8 frames per spin. That is the choppy, "spins slowly" look.
   - Smallest fix: no React during a spin. Write the angle each frame to a CSS variable on `.stage` and to the two `<g>` transforms through refs. Place the sockets with `rotate(var(--rot)) translate(…) rotate(calc(-1 * var(--rot)))` (or one rotating wrapper with a counter-rotation per socket). Call `setRot` once, when the spin settles.

3. **Hovering a space re-renders the whole shop.**
   - What happens: ShopCards subscribes to the space under the pointer (ShopCards.jsx:63) and to its preview (:68) for the "✓ after X" ticks. Every space hover re-renders all ten cards, FollowerRates and their Tips.
   - Smoke: ShopCards 351 renders in round I, p50 71ms, p95 199ms; Tip 2186 renders.
   - Estimate at 4× quiet: 15–40ms of main thread per hover, landing in the same frame as the hover card.
   - Smallest fix: toggle a class on `[data-uid]` elements in an effect, the way HoverCards.jsx `useCopyTargets` lights copy targets, so a hover renders nothing. Or split each card into a memoised `ShopCard` that takes a `tick` boolean.

4. **The table re-renders on every session change, even while it's holding a step, and measures the DOM each time.**
   - What happens:
     - `session.subscribe(() => setTick(...))` (GameScreen.jsx:333) renders all of GameScreen on every emit, including bot moves that useTable is still holding back.
     - The flight layout effect snapshots every shop card (`getBoundingClientRect` plus `outerHTML`, flight.js:52) and every minion on each state (GameScreen.jsx:424–436). That forces layout inside the commit.
   - Smoke: GameScreen p50 129ms, p95 406ms, 69 renders in round I.
   - Smallest fix:
     - setTick only when undo availability changes (compare `session.undoKind` / `undoSeat`).
     - Snapshot the shop only when a card is about to leave it. onPick already does this before submit.

5. **All four chairs re-render on every state.**
   - What happens: `memo(CultSeat)` (GameScreen.jsx:11) never holds. Each state passes a new `seatState` object, a fresh `onPick` and `pick={pickParts[pid] || null}` (GameScreen.jsx:819).
   - Smoke: CultSeat 148 renders, p50 49ms, p95 195ms.
   - Smallest fix: pass each chair its own player object plus stable handlers (the `handlers.current` pattern the shop already uses, GameScreen.jsx:656). Rivals' chairs then skip renders when only someone else changed.

6. **Waiting between your turns: every bot step is shown one at a time.**
   - What happens: motion.js:53–54 sets bot think to 250ms and each visible step's hold to 600ms (+150 for a recruit). With three bots doing place, choice and buy, that is about 3 × (0.6 + 0.75) ≈ 4–6s between your turns in round I, and more in rounds II–III (more minions, more steps).
   - Not yet measured: no smoke run completed a full wait, so the tracer's `turnWait` is the number to read in the baseline.
   - The pace is Cory's call. The smallest mechanical fix: hold once per bot turn, not once per step. Then any click or key during rivals' turns fast-forwards the queue (pump with dwell 0).

7. **Each round end holds the table about 3s per quadrant.**
   - What happens: Reckoning.jsx:15 sets `STEP_MS` to 2900, so up to ~12s before the round card, three times a game. Cory asked for slower and clearer (roster 31), so keep the pace.
   - Smallest fix: a click or key advances to the next quadrant, and Enter/Space jumps to the card. The baseline's "Reckoning until the round card's button" line measures it.

8. **Hover cards fill in late.**
   - Smoke: the space card is in the DOM at p50 75ms, but p95 412ms, max 984ms. "You'd get" is filled at p95 452ms (probe2: 475ms). Shop card p95 267ms.
   - What happens:
     - HoverCardLayer rendered 702 times. On each target change its layout effect calls `dockFor`, which queries and measures three regions (HoverCards.jsx:101–123, :152–168).
     - The preview comes from the worker per state. If the warmup hasn't reached the hovered space, the card first shows "You'd get: …".
   - Smallest fix:
     - Cache the dock rects. Recompute them only on resize, with a ResizeObserver on the three regions.
     - Send the hovered key to the worker ahead of the warmup batch.

9. **Always-on decorative loops repaint the board every frame.**
   - What happens: lamp.css:146 `litbreath` animates an 18px `box-shadow` on every lit space (10–12 at once while you place), forever. Alongside it run `cult-blink`, `minion-bob`, `cult-breathe`, `cult-shift` (lamp-b.css:173–231) and `freshspin` (lamp.css:166).
   - Smoke: 1570 long animation frames in round I. Several of 880–900ms had no script at all (style, layout and paint only).
   - Smallest fix: make the lit glow a static pre-blurred layer that animates only `opacity` (compositor-only). Pause the `steps()` loops (`animation-play-state: paused`) while a spin or flight runs.

10. **Online: two clicks per placement, and the whole game on every move.**
    - What happens:
      - Wheel.jsx:421 `const touch = confirmPlace || …` makes every online placement pin-then-confirm, even with a mouse.
      - The host writes the full state JSON on every move inside a transaction (online.js:743). Every client re-parses it (online.js:622).
      - Your move costs about 2.5 network round trips before it shows: push, then the host's transaction, then the notification.
    - Smallest fix:
      - Confirm only on touch (drop `confirmPlace ||` for a mouse).
      - Show your own move at once by stepping the deterministic engine locally while the host confirms.
    - The online smoke didn't complete here (pages loaded slowly at load 40, plus HMR). The baseline's "Online round trips" section gives the real RTTs and snapshot size.

## Also seen
- **Turn-change step lock:** a deliberate click within 400ms of a new step, near the last press, is ignored (GameScreen.jsx:574, `MO.stepLock`). The tracer counts these as eaten clicks. No smoke run had a real one: the 14 seen in smoke-local came from a session HMR had closed.
- **Dev vs prod:** React's dev build costs roughly 2–3× more per render than what Cory plays on Netlify. Run the baseline once more against a production build to confirm the ranking holds: `npx vite build --outDir .v4-build-perf && npx vite preview --outDir .v4-build-perf --port 5369`, then the harness on :5369. Component durations need dev; LoAF and input→paint don't.
- **Motion already re-budgeted by E2** (motion.js, roster 30): spin 420 → 300ms, card flight 760 → 340ms, minion flight 480 → 300ms, bot pace 700 → 600ms. Items 1–5 and 9 are frame cost, not duration, so they still apply.
