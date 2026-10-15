# Design pod queue

The art director (port 5410) owns screen composition and layout. The detail designer (port 5412) owns the details: clipping, leftover symbols, names, hovers, glows, alignment, type sizes, placeholder text, chip selectors. Write what you're taking before you start; tick it when it lands. Restructures that one of us can't do go to the other, or to the foreman.

## Detail designer: taking
- [ ] 04:55 Sweeps on Classic, magenta/silver/yellow/purple and scenes (every choice kind, pay, members, round III). Findings land in details.md.
- [ ] 05:15 The RC1 sweep's [new] items (design/eval/critic-calibration/sweep-rc1.md), blockers first: re-check each on the live build; details fixed here, composition passed below.
- [x] 05:15 Hover cards: rim card repetition, "you'd lead, +2", "you choose how", ranges as algebra, "Unlocks" twice. (details.md 4–8)
- [x] 05:15 "any" mid-sentence and color adjectives as dots ("a non-● member"): Rich keeps words unless an amount. (10, and the 05:40 batch)
- [x] 05:15 Native title tooltips doubling hover cards; "1 followers". (11)
- [x] 05:15 Dots that aren't resources: header steps, hub pips, since-strip, round summary bullets, card owner line. (1–3)
- [x] 05:40 Popovers in two looks (RC1 #44): one paper look. (details 32)
- [x] 05:40 Results and round summary words. (26, 27)
- [x] 05:55 A number and its dot as one unbreakable unit (R3's note): Rich, the wheel's Said, cost dots. (29)
- [x] 06:00 Screens around the game: home, setup (custom, emoji), menu, How to play, the log drawer. (34–39)
- [x] 06:10 Guards: lib/textclip.mjs now reads the wheel's panel faces and skips screen-reader-only text; new lib/legacy.mjs (retired marks, symbols, color-only player dots, browser tooltips on hover-card targets) runs every step in hotseat.mjs and with every hover card open in info.mjs (r).

## Art director: taking
- [ ] 08:05 (foreman: loop runs to ~13:00 UTC) Compose the screens Cory sees first: home, setup (table pick), the round summary, results.
- [x] 04:56 The game screen's composition at 1270×700 (Cory: "too much prime real estate was given to the log"): 2–3 layout variants behind `?layout=`, then the winner becomes the default. Files: the grid in `src/v4/lamp.css` (`.app.game.lt` desktop block), the since-strip box (`since.css`), the shop strip's outer layout (`lamp-b.css`), and the TurnCard placement and a `data-layout` attribute in `GameScreen.jsx` (small edits). Write-up: design/eval/design-pod/layout.md. Landed 05:45 as `src/v4/game/layout.css` (≥1200px wide; no flag).
- [x] 06:10 Since-strip rows: wrap to two lines with a hanging indent instead of the ellipsis (since.css row only).
- [x] 06:10 Results: each score shown three times; the over-cults column's composition (lamp.css results block).
- [x] 06:10 1100px laptops (old grid): the member strip switches to 5 columns and hides the second row (5 of 10 members visible). lamp-b.css's 1100px rule.
- [x] 06:10 First full capture pass (every state, 1270×700) → log.md.
- [x] 06:30 Order rail "×2" → "twice" (CultSeat.jsx, seats.js; turnstory.mjs t1 follows).
- [x] 06:35 Type scale on the game screen (detail designer's 06:20 note): 14 / 18 / 36 plus 11px caps labels (log.md 06:35). Detail designer: wheel faces and hover cards are yours to fit to the same scale.

- [x] 06:55 Wave-2 tester B, composition items #14, #15, #22, #25, #40, #48 and the space budget (log.md 06:50–07:10).

- [x] 07:10 Wave-2 tester A: #15, #17, #52, #42/E5, E9; and the snappy spin landing (log.md 07:10–07:30).

## For the art director (composition / layout)
- [x] (06:10) 05:40 Since-strip rows end in an ellipsis that cuts the member's name ("P4 Half Price: −1● −1● −3● · recruited Stunt Dou…") in the narrow left column. Let a row wrap to two lines (hanging indent under the name), or give the strip the width. I haven't touched since.css's box.
- [x] (06:30: "twice") 05:40 The turn-order rail's "in 3 ×2": "×" is a retired operator (grammar) and "in 3" is shorthand. Suggest words: "next", "3rd", and "twice" on its own line. turnstory.mjs pins /×2/, so it needs updating with it. (seats.js turnPlaces, lamp.css .cs-order)
- [x] (07:25: leaders at the band's height, 4 more units from each divider) 05:40 Rim leaders: when 2–4 players tie for a rim, their minions stack at the rim's end and spill over the next quadrant's rim (MOST BLUE's frogs sit on the green band). Wheel.jsx rim leaders.
- [x] (06:10) 05:40 Results show each score three times (table, the seat card's "39", the big number beside it) with the seat cards spanning ~1230px (RC1 #107, #111). The over-cults column.
- [x] (07:47, art director: hidden; "2 of 4" says it) 05:40 The Reckoning banner's "1 OF 4" is followed by four progress dots (●○○○): dots that aren't resources, and the count already says it. Reckoning.jsx (the layout agent's).


- [x] (06:35) 06:05 Type sizes: the game screen still shows about ten sizes (11, 12, 13, 14, 15, 16, 18, 22, 36 plus the wheel's fitted ones). I removed the half sizes and the 10px; getting to the grammar's three needs the strips re-composed (shop numbers 15 vs rate numbers 17→18, seat stacks 14 vs 18, the prompt's 22). Yours if you take it; I'll follow your scale.

## For the layout agent (from the motion engineer, 06:13)
- [ ] Keep a stable hook on each unplaced minion: `.lt-cult-seat[data-seat] .cs-minions [data-minion][data-k]` (k = 0 at the top). The chain (src/v4/game/director.js) flies a placed minion from the slot just past the last one still standing, and the minions walk home into `.cs-minions` at round end. If the column's markup changes, keep these attributes.

- [x] (05:55: the deck is the member grid's first cell, beside the first card; (h) passes on :5410) 06:15 info.mjs (h) now fails on the live tree: "the deck is not before the first shop card" (the Followers block moved above Members). Either the layout or the gate should change, your call.

## For the turn-story agent
- 07:05 w2b #49: a placement that gives nothing tells only "You took Bumper Crop". Say it: "nothing this time (no full sets)". w2b #46: "recruited Gardener (paid 2)" repeats the payment line; Robin Hood's "+1 follower" shows twice.

## For the foreman (needs a call or another agent's files)
- 09:00 (art director) Large screens (≥1600px): the wheel scales, the side columns don't (shots/0900-1920/place.png). Proposal: zoom the game root from ~1600px so the 1270 composition scales whole. It needs the hover layer and flight ghosts checked under zoom (both position from getBoundingClientRect). Not started; your call on priority.
- [x] 07:58 (art director) Phone (390×664): at setup the starting-resource picker sat below the fold (top y=723). Done 08:05 by the art director (UI-A, the phone's owner, is done): your pick stands at the screen's foot, without the duplicate "for sale" list; the whole wheel stays in view (layout.css; shots/0800-phone/setup.png).
- 07:58 (art director) **For the QA agent (owner of hotseat.mjs's flakes):** "center click after undo did not place (3 -> 3)" is timing under the new choreography, not a bug. By hand (live :5410, rich save): place → Undo → a click on the lit space's centre lands on `.slot.can` and the worker count goes 0 → 1 within 600ms. The gate reads the count 150ms after Undo and 250ms after the click (hotseat.mjs ~line 310–317); suggest `waitForFunction` on the worker count (≤ 2s) instead of fixed waits. Same shape for "game did not finish in 4 minutes" under Steady pacing (fails on the old layout too).
- 06:05 RC1 #29: Undo disappears as soon as you pick the first stolen resource, so a mis-steal can't be taken back. A session/rules question, not a detail.
- 06:05 Dialogs pod: in the pay dialog, a resource you hold none of shows "0" with no dot under it (the others show a faded dot), so one column reads as a bare number; and the coin "×2" (PayPicker `.x`) is a typed × the grammar retired. The keyboard-only "Pick from a list" button, when focused, lands on top of the "ROUND I OF 3" line.

## For the art director (from QA, 06:45): layout stability
- Chairs "moving 3–9px between steps" (hotseat gate) was the gate, not the layout: chair heights hold all round (fixed rows), and the only move is the round-start re-sort (the .35s slide to the new turn order). The gate re-read the chairs a fixed 900ms after the round changed and, on a loaded box, caught the slide mid-way. hotseat.mjs now waits until every chair's transform reaches its --y. Nothing in the layout changed.
- The shop strip grew about 1.5% from its centre during a choice (hotseat: 973,8,279,684 -> 971,3,283,694): a scale on the strip itself. Most likely source (read from the code, not caught in the act): the motion chain hops or pops its target (scale 1.08 / 1.1), and when a card's own slot or the deck isn't on screen it falls back to the whole `.lt-shop`. director.js now never hops or pops an element that is a region (`[data-region]`): the furniture never scales; the thing inside it still moves.

## For the art director (from the detail designer, 08:05): phone (iPhone 13) seats and wheel
- [x] (09:40 art director: the pill no longer wraps or carries "twice" on phones and sits under the name, clear of the total; shots/0940-phone/round3.png) P4's "NEXT" pill sits on top of its follower total ("14"): the rail label is inline after the name and the total doesn't make room. shots/phone-wheel-fit-after.png (top right).
- [ ] A rival's "each round +3● +2◐" runs off the right edge on phone (the third seat's column).
- [ ] The phone wheel's panels are short of room: I made a tight panel's line 1 shrink to fit on a wheel under 416 units (down to 9px) so words no longer overlap their neighbours (before/after in shots/phone-wheel-overlap-before.png, phone-wheel-fit-after.png), but 2–4 verbs per table still spill 2–9px at 9px ("Swap a member", "Members pay out"). More wheel on phone, or fewer words there, is a composition call.

## For the foreman (from the detail designer, 08:35): two calls
- [x] (built 08:50, details 99: one Speed setting, Quick / Steady / Relaxed, in setup and the menu) Two speed settings with different words: setup has "Bot speed: Slow / Normal / Fast" (bot delay and pace), the ☰ menu has "Quick / Steady / Relaxed" (animation). A player can't tell which one makes the game faster. One control, one vocabulary? (Needs a call: they set different things.)
- [x] (built 08:55, details 100: paid price on the face, list struck; hover names it) RC1 round-3 #33: a shop card's face prints its list cost while a discount applies (Intro Offer: free; Save 4; Underbidder −2). Only the hover's "Pays" line tells the real price. Showing the price you'd pay on the face (the list cost struck, or "free") is a face-design call.
- 08:10 (QA, correcting the 06:45 note) The chairs' 1–20px "moves" had a product cause after all: the column (GameScreen) set each chair's --y only after a React commit, so a window resize left the chairs at the other size's places, or at the 108px fallback when the column had been hidden (phone size). They overlapped the tall "You" chair by up to 41px until the next move. GameScreen now re-lays the column on resize. hotseat waits for the chairs to stand after its phone-size screenshots. Nothing changed in lamp.css.
- 08:10 (QA) hotseat on the live tree at 1270×700, buy step: the headline "You've placed this turn — recruit, buy followers or pass" spills 58–63px out of its `span.say`. First seen on the 08:03 live-tree build, not on ee9b0f8 (07:37). The 900×700 shop-card ".ft" overflow from the 79dee80 verdict no longer reproduces (layout.mjs passes at all three sizes).
- [x] (done 09:00, details 101–104; guard lib/typescale.mjs in hotseat and info) (detail designer, 08:40) Type scale census, two full games: setup page 15/13/22, results 13/15/22/28 and its seat heads 16/22/25, pay sheet 16 are off the 11/14/18/36 scale. The game screen, hover cards, choice notes and round summary are on it now.

## From the art director (10:40)
- For the detail designer: I removed the dotted "taken since your last turn" edge (your #76). w3a A44 and w3b #31 still couldn't read it after w2a #30. The space's hover line "Taken: P2, since your last turn" stays, and the strip's locate does the job (layout.css, one rule; easy to revert).
- For the perf pod (via the foreman): my A13 rule (layout.css, the shop stepping back on a rival's turn) keys on `.lt[data-yours="0"][data-phase]`, the root attributes you're moving off. Re-key it with the rest. Any new rules from me key on regions.
- For the plain-words agent: the buy line under the headline can carry "A member from the shop, or followers; or use Lottery Winner · or release a member". It now wraps to two lines instead of cutting, but it's long. A shorter wording is yours.
