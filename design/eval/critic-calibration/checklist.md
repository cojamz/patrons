# Heuristic sweep checklist (screen-only critics), v3

Walk this list on every screen state, by sight, through `scripts/v4-eyes.mjs`. Each line is a question you answer with a screenshot. A "no" is a finding. Don't skip a line because the answer seems fine: look, then write down what you saw.

## A. Nielsen's ten, made concrete
1. **Status is visible.** Whose turn, what step, what's left (moves, rounds), what just happened: readable without hovering.
2. **The screen speaks the game's words.** No developer phrasing, raw ids, or terms the rulebook never defines. Every sentence reads with no "more what?" or "of what?" left over: every comparison and count names what it measures. **Decipher test:** read each short label on its own (space faces, chips, badges, rim lines), write down what you think it does, then open its hover and compare. Every invented abbreviation or symbol you misread, or couldn't read at all, is a finding.
3. **Control and freedom.** Undo is visible where it applies; every popover and dialog closes with one click or Esc.
4. **Consistency.** The same thing has one name, one symbol, one color and one look everywhere (shop, seats, hovers, log, summaries).
5. **Error prevention.** Illegal targets look illegal before you click; costly or turn-ending moves warn you first. Squint (or blur) the board on your turn: can you tell available, taken and not-yet-open places apart instantly, without relying on color alone?
6. **Recognition over recall.** Nothing you must remember from another screen: costs, rules and rival holdings are on screen or one hover away.
7. **Efficiency.** Count the clicks for the common moves (place, recruit, buy followers, pay, steal). More than two for a common move is a finding.
8. **Aesthetic and minimal.** Every line of text and every badge earns its place. A line that repeats what's already visible, or narrates the obvious, is a finding.
9. **Errors explain themselves** next to the pointer, in words ("Need 2 more red"), not silence.
10. **Help in context.** The rules you need right now are on the thing itself, not in a menu.

## B. Board-game screen checks
11. **Every decision point has an obvious call to action.** At setup, each step of a turn, each choice, pay and round end: is the thing to press the most prominent thing on screen? Squint at the shot: does your eye land on it first? Is there a pulse, glow, arrow or button that says "here"?
12. **Hovers anchor to their target.** A popover opens next to the thing you pointed at, stays on screen, and doesn't cover what you need. Check with `timing`: a region opening hundreds of px from the pointer is a docked popover, and that's a finding.
13. **Every element has a hover (or a tap).** Sweep the pointer across every element on screen, in every area, at several points in the game (things change as the game goes on). Note each one that opens nothing, and each one whose popover adds nothing (pure noise). Every name of a card or space, wherever it appears (board, prompts, toasts, log, summaries, results), opens the same card. A popover that repeats what its target already shows, instead of what you can't see there, is a finding.
14. **Every number explains itself.** Sample at least 10 numbers all over the screen: does each say what it counts, and does a hover give its source?
15. **No duplicate information.** The same fact shown twice on one screen, or said twice on one card, is a finding. Name both places.
16. **Each card has a clear hierarchy.** Read a card and its hover at a squint: what it does reads first, its cost second, everything else quiet. Anything louder than the effect is a finding; so is a cost you have to work out.
17. **A symbol set you can learn.** Count the distinct glyphs and marks you must learn. More than about 7 before your first move is a finding; so is any glyph you can't name after round I.
18. **The primary actions are visible without hunting.** The rulebook names the buys (recruit a member, buy followers). Is each one findable and inviting at a glance, with prominence that matches how often you use it? Same for the main board actions.
19. **Order and grouping.** Collections (the shop, each seat's members, choice lists) have an order you can see and use (by cost, by color), and related things sit together.
20. **Direct manipulation.** When a choice is about a thing on the board (a rival, their resources, a space, a card), you pick it on the board, not in a detached list of buttons. Count the clicks and the eye travel for every choice dialog.
21. **Space is used well.** Panels, seats and the shop: is any area mostly empty while other things are cramped or tiny? Measure the dead space. **Counting test:** for each player, count unspent workers, resources and members by sight. Anything you can't count at a glance (under ~2 s), or that drifts while you count, is a finding.
22. **Nothing overlaps.** Tokens, labels and text never sit on top of each other; text never clips. Zoom in (`zoom`) on every dense area.
23. **Art direction.** Do the characters, sprites and animations look finished and distinct from each other at the size they're shown, or samey and placeholder?

## C. Feel and time (use the numbers `v4-eyes` prints on every action)
24. **Input response under 100 ms.** Every click, hover and key shows something within 100 ms. List each action over 100 ms with its number.
25. **Nothing drags.** Transitions over ~400 ms that block you, and waits between turns: list them with their settle times. Trigger every motion you can cause yourself and time it.
26. **Animation follows the eye.** Use `frames`: does a change travel from its cause to its result (a coin flying to the seat, a card moving to the hand), or does it snap or flash somewhere you weren't looking?
27. **Round end is legible.** Watch the round-end scoring at normal speed with `frames` and `wait`: can you say who got what and why, before it moves on? If you can't narrate it, it's too fast or too busy.
28. **Bot turns are readable.** After `wait` while bots play, use `frames idle`: could a person follow each bot move as it happened?

## D. Craft
29. **Alignment and spacing.** Use `grid` and `zoom`: edges line up, gaps repeat, type sizes come from a small scale. Note every misalignment of 2 px or more, every uneven gap.
30. **Polish tells.** Placeholder copy, inconsistent capitalization, mismatched corner radii or shadows, a component that looks the same as another but behaves differently, anything that looks rushed or slapdash.

## E. Audits you fill in (by sight, as you play; each one feeds findings)
1. **Call to action:** at every decision point you meet (setup steps included), squint at the shot: what does your eye land on first, and is that the thing to press? One line per decision point.
2. **Card anatomy:** for one card face in the shop and its hover, list every element from loudest to quietest (size, color, weight). Is that the right order for a player deciding whether to buy? Which lines could go?
3. **Glyph census:** every distinct symbol, mark and shape on the game screen, what it means, and where it appears. Count them. Note any two that look alike, any one thing drawn two ways, and any symbol standing in for a word that would fit.
4. **Duplicate census:** every fact shown more than once on the main game screen or inside one popover (scores, turn order, resources, costs, standings, prompts): both places, and which one you'd keep.
5. **Prominence:** for every action the rulebook's turn structure gives you, where it sits, how big it is, and how inviting it looks, compared with how often you used it. A frequent action drawn small, or an occasional one drawn big, is a finding.
6. **Order:** every collection on screen (shop, seats, member lists, choice lists): the order it's in, and whether you could tell that order from the screen.
7. **Hover census:** in each hover sweep, every element: what opened, how far from the pointer (the timing line tells you), and whether it added anything you needed. Read every wheel space's full text once per ring, and every card's text at least once.
8. **Motion and art:** every motion you can trigger yourself (anything the rulebook says you can drag, spin or toggle), timed; and whether the characters, sprites and animations look finished and tell apart at the size shown.
9. **Space budget:** the five largest areas of the game screen, what each holds, and whether the room each gets matches how much a player needs it right now.
10. **Decipher test:** every short label you met, what you guessed it meant, and what it turned out to mean.

## Severity
- **Blocker:** you misread the game state, can't find how to act, or a common move fails.
- **Major:** the answer exists but costs a hunt, a guess, extra clicks or a wait; or a designer would refuse to ship it as is.
- **Polish:** craft, consistency, small text and spacing.
