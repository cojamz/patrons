# Motion audit: from input to "you can act again" (snappy pod, 2026-10-15)

Cory: "it just doesn't feel snappy at all", "the way the wheel spins is really slow". Then: "animations for actions and follower gain, member gain, etc, should all go clearly directly to their source on the screen. There should be a super tactile feel."

Every budget now lives in one place: **`src/v4/motion.js`** (`MO`, `BOT`, `spinEase`) and the **`--mo-*` tokens** at the top of `src/v4/v4.css`. Change a number there, not in a component.

**Blocks** means the player waits on it before the result shows or before they can act. **Decor** means it plays while they can already act. Line numbers are as of this pass (other agents are editing the same files).

## Targets (gut calls, Cory's "go with your gut")
- Input shows a visible response within 100ms. Hover opens in 60ms or less, with no transition delay.
- A wheel spin takes 250 to 350ms with a crisp ease-out. Flights take 200 to 350ms.
- Decoration never blocks the next input, and nothing the player triggered waits on an animation before it shows its result.
- Bots at Normal: about 600ms per visible step (paced for legibility, not speed).
- The Reckoning (round-end scoring) is excluded: another agent owns its pacing.

## Inventory

| What | Where | Before | After | Blocks? |
|---|---|---|---|---|
| Wheel spin (arrow key, swipe, fling, drag settle) | Wheel.jsx `animateTo` | 420ms ease-out cubic, **one React render of the whole wheel per frame** (under load, 130–320ms frames, so 4–6 frames per spin) | `MO.spin` 300ms ease-out quart; frames paint straight to the DOM (paper and rim `transform`, spaces `translate`), and React renders once when the spin lands | Blocks (you're aiming) |
| Wheel drag | Wheel.jsx `onMove` | React render per pointer move | DOM paint per move, one render on release | Blocks |
| Space hover card | HoverCards.jsx `OPEN_MS/CLOSE_MS` | 0 / 150ms (already instant) | `MO.hoverOpen/hoverClose` 0 / 150 | — |
| Hover card fade | lamp-b.css `.lt-hover.popover` | opacity 60ms linear | unchanged | Decor |
| Keyword tip open | Info.jsx `TIP_MS` | 260ms (the clarity agent cut it to 50) | `MO.tipOpen` 50ms | Blocks reading |
| Tip popover rise | v4.css `.popover` | `rise .18s` | unchanged (opacity starts at once) | Decor |
| Shop-card hover (old) | GameScreen `onHoverCard` 160/120ms | dead code (nothing calls it) | left for its owner | — |
| Your minion on the space | v4.css `.slot.flash .worker` + flight.js `flyWorker` | hidden for **240–380ms** (CSS delay), then hidden again until the 480ms flight landed; measured 886–1117ms click → visible under load | visible from the first frame and settles (`land`, `--mo-land` 200ms); a 200ms trail (`MO.minionTrail`) flies from your leader and fades onto it; measured 173ms under load 44 | **Blocked**, now fixed |
| Rival's minion flight | flight.js `flyWorker` | 480ms, hidden until it lands | `MO.minionFly` 300ms | Decor (bot pacing) |
| Space press / lit hover | lamp.css `.slot.can:active/.hover .base` | hover scale had no transition; no press | presses to .96 on pointerdown (`--mo-press` 70ms), hover lift eases (`--mo-quick`) | Feedback |
| Space lit/unlit | lamp.css `.slot .base/.face` | opacity .25s | `--mo-fade` 150ms | Decor |
| Wheel/shop dim between phases | lamp.css `.lt-wheel,.lt-shop` filter | .35s | `--mo-dim` 200ms | Decor |
| Seat "now" glow | lamp.css `.lt > .lt-seat` | .3s | `--mo-dim` 200ms | Decor |
| Buttons, cards press | v4.css `.btn,.card…` | .12s ease; cards scale .98 | `--mo-quick` with ease-out, presses at `--mo-press`, cards go down 1px | Feedback |
| Recruit card flight | flight.js `flyCards` | **760ms** with a hold, chip glow 900ms after 620ms | `MO.cardFly` 340ms, glow `MO.chipGlow` 500ms at 85% | Decor |
| Shop slide after a recruit | flight.js `slideShop` | 300ms | `MO.shopSlide` 240ms | Decor |
| Deal from the deck | MemberDeck.jsx `useDeal` | 560ms + 70ms stagger; **the new card is hidden until it lands** | `MO.deal` 300ms + 40ms stagger | Blocked buying the new card, now 300ms |
| Minions fly home (new round) | flight.js `flyMinionsHome` | 520ms + 45ms stagger | `MO.minionsHome` 340ms + 30ms | Decor |
| Ghost easing | flight.js `ghostFly` | ease-in-out | ease-out (quick off the mark) | — |
| Number count (Tick) | Tick.jsx `countMs` | 400 + 40/step, capped at 650ms; skipped numbers when frames were late | `MO.tick*` 300 + 30/step, capped at 550ms; one whole number per painted frame for changes up to 12 | Decor |
| Your recruit that ends your turn | GameScreen `useTable` dwell | **1500ms** before the next player's move shows | `BOT.myRecruitHold` 500ms | Blocked the table |
| Bot step on screen (Normal) | App.jsx `PACE` + GameScreen dwell | 700ms; a bot recruit +350ms (1050ms) | `BOT.pace` 600ms; a recruit +150ms (750ms). Slow 1000, Fast 350 | Paced on purpose |
| Bot think time | App.jsx `BOT_DELAY` | 250ms (Normal) | `BOT.think`, unchanged | Hidden behind the pace |
| Catch-up after the round card | GameScreen `STEP_MS` | 320ms | `BOT.catchUp` 320 | Paced |
| "Nothing you can afford" toast | GameScreen | after 650ms | after `MO.afterFlight` 360ms | Decor |
| Double-tap guard on a new step | GameScreen `lockUntil` | 400ms, near presses only | `MO.stepLock` 400 (unchanged; a deliberate press elsewhere is never eaten) | Guard |
| Same option twice | GameScreen `lastPick` | 350ms | `MO.doubleClick` 350 | Guard |
| Seat reactions (hop, gesture, scheme, celebrate) | CultSeat.jsx `REACT_MS`, lamp-b.css | class held 900ms; CSS .5–.8s | `MO.react` 900 (unchanged) | Decor |
| Turn card hold and fold | GameScreen `showTurnCard` | 2600 / 3100ms | unchanged (turn-story agent's; pointer-events none) | Decor |
| Toasts, nudges, gift floaters, robbed flash | GameScreen | 1600–2400ms | unchanged | Decor |
| Deny note, shake | Wheel.jsx, lamp.css | 1700ms note, 340ms shake | unchanged | Feedback |
| Long-press tip (touch) | Info.jsx | 450ms hold | unchanged (that's the gesture) | — |
| Pay dialog | v4.css `.overlay` fade .2s, `.slot-coin` .22s | | unchanged (opens at once, fades in) | Decor |
| Setup → play stage resize | lamp.css @media setup | .45s | unchanged (once per game) | Decor |
| Reckoning | Reckoning.jsx, flyToken 640ms | | **not touched** (owned elsewhere) | — |

## New: every gain travels from its source (Cory, 2026-10-15)
- `src/v4/game/gains.js` (pure, unit-tested in `src/test/v4/ui/gains.test.js`) reads each state change: the engine's resource, follower and member diff, plus its log for whose member did it and who bought what. It names a source and a target for every unit. A member's own line flies from that member. A loss paired with a gain (a steal, a gift) goes stack to stack. A payment goes to the recruited card's slot, the follower buy, or the space's trade. Anything else comes from the space just taken, or from the cult's members at a new round. Follower buys fly from the rate, and a recruit's followers fly from its card. The test checks that the pieces add up to the engine's diff in whole bot games.
- `flight.js flyGains` is the one helper every piece goes through: one piece per unit (capped at 10), `MO.pieceStagger` 40ms apart, `MO.pieceFly` 260ms each. Each piece wears the stack's own glyph or the follower mark. A stack's number counts the pieces as they land (`b.num[data-hold]`). The follower Tick starts counting when the first piece lands (`arrivalFor`). Each landing bumps the destination, and each departure dips the source.

## Guards
- `e2e/v4/snappy.mjs` (a solo gate in check:v4), at 1270×700. (s1) a spin starts within 100ms and lands within 400ms. (s2) hover p95 is within 100ms over spaces, shop cards and keyword tips. (s3) a click on a lit space shows your minion, painted, within 150ms. It is frame-honest: each limit allows one of the box's own idle frames on top (about 17ms on a quiet box), and each check takes the best of a few tries.
- `e2e/v4/motion.mjs` (m1) is unchanged: it still needs 3 values between. Tick now paints every whole number for small changes, so a loaded box slows the count instead of skipping numbers.

## Measured on this box (load 33–45 on 4 CPUs, production build, frames 120–450ms; read as direction only)
- Spin: before 566–737ms in 4–6 frames; after 400–496ms in 2–3 frames.
- Click to your minion: before 886–1117ms; after 173ms.
- Hover: the box's frames dominate (p95 375–616ms both before and after). info.mjs measures it on a quieter slot.
