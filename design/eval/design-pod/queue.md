# Design pod queue

The art director (port 5410) owns screen composition and layout. The detail designer (port 5412) owns the details: clipping, leftover symbols, names, hovers, glows, alignment, type sizes, placeholder text, chip selectors. Write what you're taking before you start; tick it when it lands. Restructures that one of us can't do go to the other, or to the foreman.

## Detail designer: taking
- [ ] 04:55 Sweeps on Classic, magenta/silver/yellow/purple and scenes (every choice kind, pay, members, round III). Findings land in details.md.
- [ ] 05:15 The RC1 sweep's [new] items (design/eval/critic-calibration/sweep-rc1.md), blockers first: re-check each on the live build; details fixed here, composition passed below.
- [x] 05:15 Hover cards: rim card repetition, "you'd lead, +2", "you choose how", ranges as algebra, "Unlocks" twice. (details.md 4–8)
- [x] 05:15 "any" mid-sentence and color adjectives as dots ("a non-● member"): Rich keeps words unless an amount. (10, and the 05:40 batch)
- [x] 05:15 Native title tooltips doubling hover cards; "1 followers". (11)
- [x] 05:15 Dots that aren't resources: header steps, hub pips, since-strip, round summary bullets, card owner line. (1–3)
- [ ] 05:40 Popovers in two looks (Tip popovers dark, hover cards cream: RC1 #44): one look. `Info.jsx` Tip/Popover CSS only.
- [ ] 05:40 Results and round summary words ("Contests", "Other", "Effects", "Yourself" column). (`Results.jsx`, `RoundEnd.jsx`)

## Art director: taking
- [ ] 04:56 The game screen's composition at 1270×700 (Cory: "too much prime real estate was given to the log"): 2–3 layout variants behind `?layout=`, then the winner becomes the default. Files: the grid in `src/v4/lamp.css` (`.app.game.lt` desktop block), the since-strip box (`since.css`), the shop strip's outer layout (`lamp-b.css`), and the TurnCard placement and a `data-layout` attribute in `GameScreen.jsx` (small edits). Write-up: design/eval/design-pod/layout.md.

## For the art director (composition / layout)
- 05:40 Since-strip rows end in an ellipsis that cuts the member's name ("P4 Half Price: −1● −1● −3● · recruited Stunt Dou…") in the narrow left column. Let a row wrap to two lines (hanging indent under the name), or give the strip the width. I haven't touched since.css's box.
- 05:40 The turn-order rail's "in 3 ×2": "×" is a retired operator (grammar) and "in 3" is shorthand. Suggest words: "next", "3rd", and "twice" on its own line. turnstory.mjs pins /×2/, so it needs updating with it. (seats.js turnPlaces, lamp.css .cs-order)
- 05:40 Rim leaders: when 2–4 players tie for a rim, their minions stack at the rim's end and spill over the next quadrant's rim (MOST BLUE's frogs sit on the green band). Wheel.jsx rim leaders.
- 05:40 Results show each score three times (table, the seat card's "39", the big number beside it) with the seat cards spanning ~1230px (RC1 #107, #111). The over-cults column.
- 05:40 The Reckoning banner's "1 OF 4" is followed by four progress dots (●○○○): dots that aren't resources, and the count already says it. Reckoning.jsx (the layout agent's).


## For the foreman (needs a call or another agent's files)
