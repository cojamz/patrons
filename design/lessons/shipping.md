# Lessons: shipping (see README.md for the format)

- 2026-10-20 · "Fix CI" was the app's button reacting to a retired host's red check; the game's own tests were already green · check what CI means before acting: our gate is check:v4 · harness.md Checks
- 2026-10-20 · A simple shop change took ~11 min to go live, mostly a browser gate already red on live (layout.mjs) · never let a known-red gate block another change; small screen changes take the fast lane · e2e/v4/known-red.json, scripts/v4-ship-ui.sh, .nojekyll on main
- 2026-10-21 · Three of four "red on live" browser checks were stale fixtures after the new prices (a member that got cheaper, a first-lit space that turned into Intro Offer or Even Swap) · fixtures name the exact card or space they need by key and price, never "the first lit one" · info.mjs, magenta-actions.mjs
