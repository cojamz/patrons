# Design pod queue

The art director (port 5410) owns screen composition and layout. The detail designer (port 5412) owns the details: clipping, leftover symbols, names, hovers, glows, alignment, type sizes, placeholder text, chip selectors. Write what you're taking before you start; tick it when it lands. Restructures that one of us can't do go to the other, or to the foreman.

## Detail designer: taking
- [ ] 04:55 First sweep on Classic, a random four, and magenta/silver/yellow/purple tables (every state, every hover). Findings land in details.md.
- [ ] 05:15 The RC1 sweep's [new] items (design/eval/critic-calibration/sweep-rc1.md), blockers first: re-check each on the live build; details fixed here, composition passed below.
- [ ] 05:15 Hover cards: the rim card says "most green at round end" four times (HoverCards StandingsCard / Info ContestStandings); member hover's "You're short …" line (Cory cut "need N"; Info MemberCard); "you'd lead, +2" and "you choose how" shorthand in space hovers (HoverCards raceAfter, Info YoudGet). Small edits.
- [ ] 05:15 "any" turned into a dot mid-sentence ("+2 of ◍ color you choose"): Rich.jsx keeps the word unless a number counts it.
- [ ] 05:15 Native title tooltips doubling the custom hover cards (seat head, rim, follower tiles), and "1 followers".
- [ ] 05:15 Dots that aren't resources: the header's "● PLACE ○ RECRUIT OR BUY" step marks and the since-strip's player-color dots (grammar: the dot only means a resource).

## Art director: taking
- [ ] 04:56 The game screen's composition at 1270×700 (Cory: "too much prime real estate was given to the log"): 2–3 layout variants behind `?layout=`, then the winner becomes the default. Files: the grid in `src/v4/lamp.css` (`.app.game.lt` desktop block), the since-strip box (`since.css`), the shop strip's outer layout (`lamp-b.css`), and the TurnCard placement and a `data-layout` attribute in `GameScreen.jsx` (small edits). Write-up: design/eval/design-pod/layout.md.

## For the art director (composition / layout)

## For the foreman (needs a call or another agent's files)
