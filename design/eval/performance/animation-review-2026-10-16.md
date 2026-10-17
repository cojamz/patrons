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

Final immutable release `3d97c4d`, Chromium, 1440×900, tested after the build, unit and full-game checks finished. Normal CPU and Chrome 4× CPU slowdown. Repeatable command:

```
V4_URL=http://localhost:5298 V4_PERF_SHOTS=/tmp/patrons-final-release-perf node e2e/v4/performance-probe.mjs
```

| Interaction | Normal CPU | 4× CPU slowdown |
|---|---|---|
| Wheel spin, four runs each | Worst frame 17.7ms | Worst frame 17.6ms |
| Shop hover, three arrivals each | Opens 220–223ms including intentional 200ms delay | Opens 218–221ms including intentional 200ms delay |
| Hover worst frame | 17.7ms | 17.7ms |
| Full round-end scoring | 712 frames, p95 17.4ms, max 17.7ms | 712 frames, p95 17.6ms, max 17.7ms |
| Summary entrance (800ms observation) | 62 frames, max 17.6ms | 67 frames, max 17.7ms |
| Scoring/summary long tasks >50ms | None | None |

No measured frame exceeded 34ms. SVG transform writes dropped from roughly 68 per warm spin to 11, concentrated at reconciliation. Warm pre-change spins were also smooth on this host; the baseline included cold 217ms and 67ms gaps. These results establish a clean rendering path, not a general CPU speedup claim. Browser CPU throttling is not physical phone testing.

This final capture ran without other browser checks, builds, or unit checks and supersedes the earlier profile that overlapped a separate full-game browser check. Development/HMR checks are not used in this release table. The earlier development placement check encountered a `Session closed` toast during source edits; the subsequent frozen production snappy check passed: placement showed in 38ms and its input frame arrived in 12ms, confirming that the earlier placement failure did not reproduce.

## Residual cold-spin caveat

The subsequent frozen 1270×700 snappy check passed its existing best-of-three gate, but its first spin took 601ms with a 450ms frame gap. The next spin landed in 330ms with an 18ms worst frame. All eight spins in the separate 1440×900 production profile were clean, including normal and 4× CPU runs. This difference leaves a cold first-spin/render-size/cache path to investigate; do not report that every first spin is guaranteed smooth. Raw evidence: `/tmp/patrons-final-release-snappy.log`.

## Verification

- Frozen production snappy gate: passed. Placement 38ms; input frame 12ms; hover p95 17ms after its intentional 200ms delay across all 21 arrivals; speed scaling and between-turn budgets passed. Cold-spin caveat above remains.
- Wheel unit checks: 4 passed.
- Final-score checks: 7 passed.
- Browser scoring: passed; four contests followed by two sourced member bonuses, final totals stable, skipping settles every remaining award.
- Inspected screenshot pair: `/tmp/patrons-perf-final/wheel-weight600.png`, `wheel-weight500.png`.
- Final wheel and round-summary screenshots: `/tmp/patrons-final-release-perf/`.
- Final raw measurements: `/tmp/patrons-final-release-perf.log`; earlier before/after evidence: `/tmp/patrons-perf-before.log`, `/tmp/patrons-perf-after.log`.

## Further review

Existing token/member flights already use Web Animations; number counts write text directly instead of rerendering the table every frame. Preserve their information order and intentional dwell times. The combined production release check passed (1,174 unit tests, build and full-game browser run). Follow with live observation; do not shorten explanatory sequences to mask rendering stalls.
