# Generator brief (rework panel, phase 2)

You are one of several designers working the same night, each on one scope from a given seat. Critics (pricing, table feel, a Cory-judge calibrated on his verdicts, a skeptic) will attack your work next, then the foreman picks what reaches Cory. Fewer, better ideas. No slop.

## Read first, in this order (all in design/eval/rework-panel-2026-10-21/ unless noted)
1. brief.md — the job, scope, economy, tonight's verdicts.
2. strategy-read.md — how the game plays and wins now; the identity map; proposed spread (a proposal, not a decision).
3. member-shape.md — the principles for members, from Cory's verdicts.
4. pricing.md — how to price cost and followers.
5. deck-visibility.md — how much of the deck a game shows (design members to stand alone).
6. cory-judge.md — rubric v3 (at the end) predicts his yes/no. Run your survivors through it.
7. design/strategy.md, design/pitch-ledger.md, and the live content file for your color (src/engine/v4/content/), plus its old spec in design/spheres/.

## Method
1. **Go wide privately.** Write 10–12 seeds for your scope before developing any. Force spread: at least one from tempo, space, the shop/members, interaction with rivals, holding vs spending, and "what if this color didn't exist; what would the table miss?". List the seeds in an appendix with one line each and why it was cut.
2. **Filter.** Cut anything sharing a ❌ tag in the ledger unless you can say in a few words why it's different. Cut variations of existing cards in any color.
3. **Develop 2 concepts** (the two furthest apart that survive). For an action color, each concept is a whole color:
   - Identity in one mechanic, distinct from Red (moves members), Green (copies actions), Magenta (steals), Blue (shop and number of buys), and the other open colors.
   - Round III first (the burst), then round II ×2 (must rival Promote and Shake Down: change what you own or how much you buy), then round I ×3 (equal-ish total gain, different side effects, each still worth taking in round III).
   - Card text for each action, one line, precise and minimal, ending "+1 <color>".
   - Arithmetic per round: what the taker walks away with in round I/II/III, against the bands (round I about 2–4 resources total incl. the +1; round II more; round III about 8–12).
   - Contest (default: most of the color held).
   - How it touches other colors through the board, generically.
   - A 10-member deck sketch: name, text (≤12 words, a rule-bender up to ~20), cost colored+any, followers; follow the deck shape in member-shape.md and the ladder in pricing.md, and say in one line per card why that price. Keep any existing card that already fits (say so).
   - For a members-only scope, a concept is a full 10-card deck with a one-line thesis, and you develop 2 decks that differ in thesis.
4. **Self-critique each concept** in 6–10 lines: how a round plays for the specialist, a rival, a newcomer; what it does at 2 and 4 players; what Cory would say (rubric v3), honestly; the weakest card and why you kept it.
5. **Recommend one** of your two, in three lines.

## Rules
- Everything you invent is a fill-in: mark the file header "All card texts and numbers are Claude's fill-ins, not approved."
- Never name another specific color in card text. No sims, no game runs, no code changes. Write only your own output file.
- Plain words. No hype. Cory's words: members, followers, minions, buy followers, the wheel, contest, shop, pile.
- Return to the foreman at most 30 lines: your two concepts in a few lines each and your recommendation.
