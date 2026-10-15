# Overnight plan, 2026-10-15

Cory (04:35 UTC): "Tomorrow I'd like to wake up to a really snappy, polished version of my game with better visual design and quality of life and scannability etc. … keep improving, thoughtfully, as a tasteful human would."

Every screen agent works from design/taste.md, with plate1b.png and grammar.md as the look. Checkpoints go to the PR branch (Cory: "don't hold back the commits"); the PR's preview is the link. Heavy verdicts and measurements run on quiet remote machines. A send_later check-in about every 45 minutes keeps the loop going if agents stall.

## Wave 1: land what's in flight (now to ~05:45)
- R1 tokens, dot currency and marks; R2 wheel panels and rims; R3 cards, hovers and shop.
- Layout: seats in a turn-order column with the snake marker, the plate's seat panels, the Reckoning slow and clear.
- Measurement: the `?trace=1` tracer and scripts/v4-perf.mjs. Its baseline runs on a quiet remote machine.
- Critic calibration: screen-only testers (scripts/v4-eyes.mjs), a checklist, recall against Cory's notes.
- Market Spree bar re-derived from a measurement.
- Integrate, quiet-box verdict, push.

## Wave 2: look hard, fix by region (~05:45 to ~07:30)
- A frozen build goes to a calibrated, screen-only panel: ui-critic, a laptop newcomer and a game-skeptic, each listing everything. Their findings are triaged into one ranked list (design/eval/overnight-wave2.md).
- Fix pods by region, each owning its files: wheel; seats and the since-strip; shop and cards; dialogs and choices (pay screen redesign, swaps on the board, the choice caption off the wheel, the keyboard list folded away); round end and results; intro and home.
- Perf pod: the top ten from the quiet baseline (render costs, bot cloning in bots.js if it shows, any long tasks on hover or click).

## Wave 3: tune, verify, hand over (~07:30 to morning)
- Bench pooled results (~07:15) feed balance pass 3: only cards both bots flag, reprices only, gut calls logged. No card text changes.
- A second calibrated panel on the new frozen build, then fixes.
- The final full gate on a quiet machine, then the game-skeptic's grade.
- A morning note for Cory (design/morning-note.md): the link, three pictures, what changed in his words, and his decisions as a numbered list.

## Waiting on Cory (proposals only, nothing built)
1. Hold the ×1.25 member price rise.
2. Turn the "+1 when…" members into relative payoffs (Reseller and Groupie first).
3. Make member payoffs visible: build the rendering, no rule change. The motion pass already flies gains from members.
4. Blue's direction (spaces give blue plus a bargain, round III is the shopping day, the rim scores the priciest member).
5. Hustler and Lender from balance pass 2.
6. Ideas: a discard pile, members that are items, better pixel animations.
