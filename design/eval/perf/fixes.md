# Perf fixes: render counts before and after (2026-10-15)

The box ran at load 10–30 while this was done, so every number here is a deterministic count, not a time. They come from `src/test/v4/ui/render-budget.test.jsx`. It walks React's fibers on the devtools hook, the tracer's own method, and counts every component that rendered in each commit. The setup is a 4-seat game: you plus three Normal bots, seeds 21 and 33, in a jsdom dev build. Each test prints its counts as `[render-budget] …` lines. The quiet machine's timing baseline (README.md) is what to compare wall-clock against.

| # | Interaction | Before | After |
|---|---|---|---|
| 1 | Click a lit space: what renders before the click's frame can paint | 3 commits, **396 components** (GameScreen 2, Wheel 2, CultSeat 4, ShopCards 2) | **0 components**. The table follows in a transition (404 components, the same work, after the paint). |
| 2 | One rival step (GameScreen renders) | 2, plus a third whenever the step was held | 2 (a step the table holds no longer renders the table) |
| 2 | The shop and minion snapshots (`getBoundingClientRect` + `outerHTML` on 10 cards, every state) | every state | only when a card leaves the shop. Minions are measured only once all are out, when the round can end next. |
| 3 | CultSeat renders per rival step (place, buy, pay; two bots) | 5, 4, 5, 5, 5, 5 = **29** | 2, 0, 5, 3, 0, 5 = **15**. A step inside a turn never redraws all four chairs. The step that ends a turn does, because every chair's place in the turn order changes. |
| 4 | Three space hovers (with their previews landing) | ShopCards 3, **318 components** | ShopCards 0, **57 components** (the hover card, plus ShopTicks rendering null) |
| 5 | One arrow-key wheel spin | the motion pass already paints it to the DOM | confirmed: **37 painted angles, Wheel 1 render, GameScreen 1** (on landing) |
| 6 | "You'd get" for a hovered space | queued behind the whole warmup batch in the worker | jumps the queue. The worker now runs one space per task and puts a hovered space (`front`) first. |

## What changed
1. **GameScreen.jsx `useTable.show`**: the table's `setTable` runs inside `startTransition`, and so do `busy` and the undo tick. The click's own frame paints first. The engine call and the undo checkpoint are unchanged: `session.submit` still applies the move at once. A `busyNow` ref keeps a second click from sending a stale move while the transition renders.
2. **GameScreen.jsx**:
   - `setTick` on every session emit became `setUndoSeen`, which updates only when undo's kind or seat changes.
   - `snapshotShop` moved from the flight layout effect (which ran on every state) to `beforeShow`. useTable calls it while the DOM still shows the old table, and only when a card is about to leave.
   - `snapshotMinions` runs only once every minion is out.
3. **seatMemo.js `sameSeat`**: memo's comparator for CultSeat. The engine `structuredClone`s the whole state on every step, so the comparator compares a per-chair signature, cached per state. The signature covers the player, its cards, its turn place, rank, income, last space, round, and any new log line naming it. The other props had to become stable too:
   - chairs get the stable `shopPick`, not `onPick`
   - `now` is a strict boolean
   - `options` is one shared empty map when it isn't your turn
4. **ShopCards.jsx**: the shop no longer subscribes to the hovered space. A null-rendering `ShopTicks` subscribes to the hover and the preview. It lights the unlocked cards in a layout effect: it adds the `.tick` tag the card used to render and drops `dim`, the way useCopyTargets lights spaces. Markup and styles are untouched.
5. **Wheel.jsx**: no change needed (see row 5).
6. **previewWorker.js and Info.jsx**: the worker keeps a queue per state generation. `usePreview` asks with `front: true`, and a new state drops the old queue.

## The hover misses on the quiet box (snappy s2: 13 of 18)
The cards did open. In every miss, the target's own card was up, on screen, at opacity 1. The gate's arrival detection missed them. It moved the pointer in two steps from the parking spot at (4, 696). The midpoint lands on a shop card, and that card opened first. So when the pointer reached the target, a card was already up, and the gate only arms an arrival when no card is up. The gate now moves in one step, straight onto the target. Each miss now also prints what was under the pointer, which card was up, and whether the previous card failed to close. The limits are unchanged. At load 10 on this box, the gate fell from 2 misses in 14 to none in a clean run. A later run at load 27 timed out everywhere (dev build, other agents' gates running).

## Left
- **A transition restarts when a higher-priority update arrives**: a hover change, or a Tick counting.
  - A click followed by fast pointer movement could delay the minion. If the quiet-box s3 regresses, switch `show`'s hand-off to `requestAnimationFrame` (an unsliced render after the paint), and flush rAF in the UI tests.
- **App.jsx saves the whole state to localStorage on every session emit, inside the click.** Defer it to idle, with a flush on `pagehide`.
- **GameScreen still renders twice per rival step.** The second render comes from `setSince` (a new array every time) and the turn card.
- **The reckoning and bot pacing (baseline items 6, 7) and the always-on CSS loops (item 9) are untouched.**
