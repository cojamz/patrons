# Animation review — 2026-10-16

Cory: wheel spins and round-end screens feel laggy; review animations and interactions for snappy, smooth, clear motion.

## Changes

- Wheel spins and drag settles now rotate cached SVG layers with CSS transforms, just as dragging already did. SVG group attributes no longer change on every animation frame. React reconciles once at landing. Slot labels remain upright and travel with their spaces.
- Wheel reads initial slot geometry before writing transforms, avoiding a forced first-frame layout.
- Round-end winner cheers animate sprites through Web Animations instead of restarting CSS classes through synchronous `offsetWidth` reads for each member.
- Round-end shop/prompt dimming uses opacity instead of animated filters over whole regions.
- Secondary action prose is weight 500 (previously 600); primary gains stay 800. A screenshot comparison confirmed a calmer hierarchy without changing text sizes, fit geometry, or rules.
- The snappy gate now observes SVG layer CSS motion as well as the final SVG attribute commit, so it measures the visible spin rather than only its landing.

## Measurements

Isolated production build, Chromium, 1440×900. Normal CPU and Chrome 4× CPU slowdown. Repeatable command:

```
V4_URL=http://localhost:5318 V4_PERF_SHOTS=/tmp/patrons-perf-final node e2e/v4/performance-probe.mjs
```

| Interaction | Normal CPU | 4× CPU slowdown |
|---|---|---|
| Wheel spin, four runs each | Worst frame 17.7ms | Worst frame 17.7ms |
| Shop hover, three arrivals each | Opens 225–227ms including intentional 200ms delay | Opens 218–223ms including intentional 200ms delay |
| Hover worst frame | 17.7ms | 17.8ms |
| Full round-end scoring | 712 frames, p95 17.6ms, max 17.7ms | 713 frames, p95 17.6ms, max 33.3ms |
| Round-end long tasks >50ms | None | None |

No measured frame exceeded 34ms. SVG transform writes dropped from roughly 68 per warm spin to 11, concentrated at reconciliation. Warm pre-change spins were also smooth on this host; the baseline included cold 217ms and 67ms gaps. These results establish a clean rendering path, not a general CPU speedup claim. Browser CPU throttling is not physical phone testing.

The profile used an isolated production build. No builds or unit checks overlapped, but a separate full-game browser check overlapped part of capture; repeat the final integrated profile without other browser checks before treating the table as the release measurement. Development/HMR checks are not used for the table above. The full dev snappy check passed hover, input-frame, speed scaling and between-turn budgets, but its placement subcheck encountered a `Session closed` toast while concurrent source edits were happening. The production release gate must recheck that interaction against the integrated frozen build.

## Verification

- Wheel unit checks: 4 passed.
- Final-score checks: 7 passed.
- Browser scoring: passed; four contests followed by two sourced member bonuses, final totals stable, skipping settles every remaining award.
- Inspected screenshot pair: `/tmp/patrons-perf-final/wheel-weight600.png`, `wheel-weight500.png`.
- Raw measurements: `/tmp/patrons-perf-before.log`, `/tmp/patrons-perf-after.log`, `/tmp/patrons-perf-final.log`.

## Further review

Existing token/member flights already use Web Animations; number counts write text directly instead of rerendering the table every frame. Preserve their information order and intentional dwell times. The next meaningful check is the combined production browser gate, followed by live observation; do not shorten explanatory sequences to mask rendering stalls.
