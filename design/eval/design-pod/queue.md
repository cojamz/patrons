# Design pod queue

The art director (port 5410) owns screen composition and layout. The detail designer (port 5412) owns the details: clipping, leftover symbols, names, hovers, glows, alignment, type sizes, placeholder text, chip selectors. Write what you're taking before you start; tick it when it lands. Restructures that one of us can't do go to the other, or to the foreman.

## Detail designer: taking
- [ ] 04:55 First sweep on Classic, a random four, and magenta/silver/yellow/purple tables (every state, every hover). Findings land in details.md.

## Art director: taking
- [ ] 04:56 The game screen's composition at 1270×700 (Cory: "too much prime real estate was given to the log"): 2–3 layout variants behind `?layout=`, then the winner becomes the default. Files: the grid in `src/v4/lamp.css` (`.app.game.lt` desktop block), the since-strip box (`since.css`), the shop strip's outer layout (`lamp-b.css`), and the TurnCard placement and a `data-layout` attribute in `GameScreen.jsx` (small edits). Write-up: design/eval/design-pod/layout.md.

## For the art director (composition / layout)

## For the foreman (needs a call or another agent's files)
