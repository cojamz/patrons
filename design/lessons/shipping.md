# Lessons: shipping (see README.md for the format)

- 2026-10-20 · "Fix CI" was the app's button reacting to a retired host's red check; the game's own tests were already green · check what CI means before acting: our gate is check:v4 · harness.md Checks
- 2026-10-20 · A simple shop change took ~11 min to go live, mostly a browser gate already red on live (layout.mjs) · never let a known-red gate block another change; small screen changes take the fast lane · e2e/v4/known-red.json, scripts/v4-ship-ui.sh, .nojekyll on main
- 2026-10-21 · Three of four "red on live" browser checks were stale fixtures after the new prices (a member that got cheaper, a first-lit space that turned into Intro Offer or Even Swap) · fixtures name the exact card or space they need by key and price, never "the first lit one" · info.mjs, magenta-actions.mjs
- 2026-10-26 · Testers given the live URL all failed: the box can't reach cojamz.github.io · serve main's play/ and rules/ on localhost and give testers that URL
- 2026-10-28 · One stalled check held a release overnight · every check stage has a limit and a stall is named, screenshotted and shipped around · scripts/v4-check.mjs, design/releasing.md
- 2026-10-28 · Seven version bumps in one morning · small publishes are sub-steps (v0.9.801) · scripts/v4-version.mjs; old releases pruned by build time in v4-play.sh
