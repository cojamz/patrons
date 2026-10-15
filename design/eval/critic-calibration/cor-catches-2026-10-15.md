# Cor's catches since 2026-10-15 ~05:00 UTC, beyond answer-key items 1–46

Sources read:
- Foreman session `session_017rw3aQa9iJEjdvvwQLY84z`: every human message from 12:41 to its end (14:18:42). Cor's play messages all fall between 13:57 and 14:18, with four screenshots.
- Handoff session `session_01QnEiHGPzrfb1Ccarn6JAaA`: one human message (14:19), a handoff that restates the notes above. Nothing new in it.
- Window 05:00–12:41: not read event by event (about 90 pages of agent traffic). decisions.md has no "(Cory)" entry committed between 04:54 and 14:52. Cor said "~05:00, off to sleep" and next wrote at 13:57.
- Other repo sessions dated 2026-10-15 are seeded tester and verdict agents with no human play feedback.
- `design/decisions.md` (the 2026-10-15 morning block), `HANDOFF.md` §5–6, `todo.md` "Now", and `/mnt/project-files/fixes/*.png`. Those two images are Claude's pictures of the fixes (the gift card beside the space; "Done, no buy" with the "next" seat labels), not Cor's notes.

Build: all morning notes were made on the stale PR preview (pre-10:00: "Ransom a member", "2 extra turns for 8", "2 · 4 · 6 by round").

## New catches (not in items 1–46)

1. **Catch Up's rule text can't be decoded.** Cor: "what does this mean? also it didnt seem to work." (screenshot of the hover)
   - Element: the Catch Up space hover: "+1 ●, and +2 per rival with more minions on the board than you." with a footer "Taken  P1".
   - Problem: the sentence doesn't say what is counted or when (minions placed this round? on the board now? before or after yours?), and the bare "Taken P1" footer adds no meaning. Item 42 is the payout bug; this item is the wording he couldn't parse before he ever tested it.
   - Build: stale preview. Type: UI and rules wording.
2. **Still not snappy overall, on the post-perf build.** Cor: "this still isn't very snappy - the hover overs espescially seem laggy/sluggish".
   - Element: the whole game, hovers first.
   - Problem: the overnight perf work didn't change how it feels to him. This is item 1 called again on a new build, the way item 35 re-scored item 14. Count it separately only if the key keeps that convention; otherwise it is item 1 plus item 44.
   - Build: stale preview. Type: feel.

Borderline, said just before 05:00 (logged 04:53–04:54), not in the key. Both are direction more than defect:

3. **An action's cascading effects aren't shown.** Cor: "all the cascading effects of an action should be obvious (in addition to the selection of that action itself)"; wants "a little show across the board".
   - Element: what happens after a placement (gains, steals, followers, member triggers).
   - Problem: effects land silently, so you can't see what an action caused. Score it as a hit if a tester says "I couldn't tell what my or a bot's action did".
   - Build: pre-RC1 live build. Type: motion.
4. **Speed should be "clear and steady", not "SLOW slow".** Cor's words exactly as quoted.
   - Element: animation pace.
   - Problem: a calibration line for item 45, not a separate defect. Too fast is wrong (45), and so is dragging.
   - Type: motion. Not scored.

Not game defects (process; don't score): "we never got above a B- grade… we should be aiming for at least A-" (the bar); "why are so many check-ins firing" (leftover triggers); "is there a better way for us to host this game other than netlify?" (the stale preview; the cause was the deploy, not the game).

## Cor's own words that sharpen items 38–46

- **38 Pass:** "the Pass button placement isn't very obvious." He says placement specifically: it's where it sits, not its label.
- **39 Gift pick:** "i dont see a way to act on Good Deed", then "thats very bad/confusing design." He couldn't find any way to act; it wasn't just awkward. His screenshot shows the only cues: the header "Good Deed: give 2", the caption "Pick a color, then who gets it", and your stacks lit in the bottom-left seat, all far from the wheel where he was looking. Score a hit if a tester reports being stuck on, or unable to see how to finish, a gift or steal.
- **40 Turn-order rail:** "this bar is confusing/maybe unnecessary." His screenshot is the vertical rail: "in 4 ×2", three dots, "now ×2", and a down arrow. He questions whether it should exist at all, not only how clear it is.
- **41 Wheel emojis:** "emojis on the wheel could be smaller and feel more in-line." The Good Deed screenshot shows rim leaders tilted off the rim and minions sitting over panel words (for example on "Free recruit the cheapest" and "+4 … round").
- **42 Catch Up:** "this did nothing, even when i was the last to play. in theory the bonus effect of this would never trigger?" Even placing last, he got nothing, and he worked out himself that the bonus can never fire.
- **43 Purple spending:** "in purple im seeing options to spend? none of the board actions should require any spending." He saw it as options to spend in Purple. The stale board shows "2 extra turns for 8 ●" and "Extra turns, spend all purple".
- **44 Hover lag:** "the hover overs espescially seem laggy/sluggish." It is the headline example inside his "still isn't very snappy" (new item 2).
- **45 Animation pace:** "the animations are still too fast even when i have it set to Relaxed. and they dont seem smooth." The word "still" means it was already a complaint.
- **46 Clunky:** "Im sure you did a lot of work, but again, the design is still clunky." Said with "to be fair, we've come a long long way!" "Again" means it is a repeat call.
