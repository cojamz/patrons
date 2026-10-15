# Perf: making slowness visible

**Baseline (run on a quiet machine, from a clean checkout of the branch):**

```
npm ci && (npx vite --port 5368 --strictPort --host 127.0.0.1 > /tmp/vite.log 2>&1 &) && sleep 8 && for i in 1 2; do node scripts/v4-perf.mjs http://127.0.0.1:5368 base-cpu4-r$i --cpu=4 --vitelog=/tmp/vite.log; node scripts/v4-perf.mjs http://127.0.0.1:5368 base-cpu1-r$i --cpu=1 --vitelog=/tmp/vite.log; node scripts/v4-perf.mjs http://127.0.0.1:5368 base-online-lag80-r$i --online --lag=80 --cpu=4 --vitelog=/tmp/vite.log; done
```

That's two runs each of: local at 4× CPU (a mid laptop), local at 1×, and online over the RTDB emulator with 80ms each way at 4×. Each writes `design/eval/perf/<label>.md` and `.json`. The online run needs java and the emulator jar (`~/.cache/patrons/firebase-database-emulator-v4.11.2.jar`; `node e2e/v4/online.mjs` fetches it once). Compare r1 against r2 before trusting any number: the spread is the noise floor.

Don't take a baseline on a box someone is editing. Vite pushes every saved file into the page. A Fast Refresh of `App.jsx` runs the session's destroy cleanup ("Session closed.", 2026-10-15 03:58), and a full reload wipes the tracer's buffer. The harness counts both (`HMR/reloads during the run`, "the page reloaded mid-run") and stops after three dead clicks in a row with a screenshot. A load average above the CPU count also makes every number noise: the 2026-10-15 smoke ran at load 30–45 on 4 CPUs.

## The tracer: `?trace=1` (src/v4/perf.js)

It's off by default and costs nothing when off: no listener, observer or patch, and the exports are no-ops (src/test/v4/perf.test.js). With the flag on it records:

- **Input → next paint** for pointerdown, click and arrow/Enter/Escape keys. It uses Event Timing (durationThreshold 16) and falls back to rAF + a message for faster events. Each event is labelled: space, shop-card, option:<kind>, pay, pass, rate, seat, rim, next-round, place-confirm, key:<key>.
- **Hover open delay:** the pointer goes over a space, shop card, rim, chair (`.cs-head`) or keyword tip, and the tracer times how long until its card is in the DOM. For a space it also times when "You'd get" is filled in.
- **Long animation frames** (with their top scripts, invoker, source:char and forced layout) and long tasks.
- **React work per component.** A fiber walk on the devtools hook records renders and `actualDuration` (inclusive), and `<PerfProfiler id="GameScreen">` wraps the table in App.jsx. Durations exist only in dev builds; a production build still gets render counts.
- **Animations.** Every `Element.animate` (patched), CSS animation and transition is logged with its target, duration, easing and whether it loops. The wheel's rAF spins are caught from the `g.wheel` transform: frames per spin and the worst frame gap.
- **Session steps.** Each state the session publishes (bot or person) is followed to when the table shows it (`data-moves`) and paints it. The tracer also records the wait from the end of your turn to your next turn painted, and how much was still moving when your turn came.
- **Online.** Your move sent → host applied → state received → shown → painted, plus the snapshot's size. `?lag=MS` (it works without `?trace`) delays every transport write and every later notification by MS: a real network on localhost. A subscription's first value isn't delayed, because RTDB serves it from the room the lobby already holds; delaying it mounted the table on a null state.
- **Eaten clicks:** a click on a live option that changed nothing on screen within 1.2s.

`window.__perf` = `{ entries, summary(), reset(), mark(name) }`. A corner overlay shows p50/p95 input→paint, p50/p95 hover and the last slow event.

## The harness: `node scripts/v4-perf.mjs <url> <label> [--cpu=4] [--online] [--lag=MS] [--seed=N] [--think=MS] [--turns=N] [--max-turns=N] [--out=dir] [--vitelog=path] [--query=a=b]`

It runs Playwright Chromium (/opt/pw-browsers/chromium) at 1270×700 with CDP CPU throttling. `Math.random` is seeded in the page, so a seed replays the same game. Locally it plays one person against three Normal bots at normal speed; `--online` plays two people (host and guest, each in their own browser context) plus two bots over a fresh RTDB emulator.

The person plays at a human pace. They hover three open spaces, a taken one, a rival's chair, two shop cards and a rim. They spin the wheel once a round (arrow keys and a drag), then place, answer choices, recruit or buy followers or pass, and pay. The run plays through round I's end (the Reckoning, the round card) and `--turns` placements into round II. `--max-turns=1` is a quick smoke that stops once each person's first turn is through. Each run records the load average before and after.
