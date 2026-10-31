# Quadrant Evaluator: Rubric v2

Use this to score a quadrant, a set of quadrants, or a fragment (one action, item or scoring rule).
It sits on top of `.claude/rules/design-principles.md`, which stays the source of truth for Cory's calls.
The rubric is firm, not rigid. A judge may overrule a score with a written reason, and repeated overrules are a signal to change the rubric.

The evaluation runs in five layers, each owned by a different agent on the team:
1. **Lints.** Mechanical pass/fail checks. Anyone running them should get the same answer.
2. **Value model.** Arithmetic on yields and prices (`value-model.md`).
3. **Judgment scores.** 1–5 on anchored scales, given by blind judges. We take the median and flag any spread of 2 or more.
4. **Mind-play.** Playtesters play real turns out move by move. They keep an explicit written ledger of the game state (resources, Favor, items, occupied spaces, turn order) and update it after every move, so knock-on effects are seen rather than guessed.
5. **Red team.** An adversary tries to break the design: dominant lines, loops, kingmaking, feel-bad moments, dead stalls, analysis paralysis.

---

## Layer 1: Lints (pass / fail / warn)

Apply these to every action, item and scoring rule.

| ID | Check | Fail when |
|---|---|---|
| L1 | One line | An action or item effect runs over 14 words, or needs more than one sentence plus a clause |
| L2 | Generic interplay | The text names another quadrant, its color, or its unique verb (it may name the generic verbs in `value-model.md` → Shared vocabulary) |
| L3 | No round-I tolls | A round-I space penalizes whoever takes it (every round-I space fills, so the last picker eats it) |
| L4 | Harm points up | It takes resources or Favor from anyone other than "a player ahead of you" or "the leader", or it can drop a player below 0 |
| L5 | Has a home | It can't be shown on the wheel, the market, or a player panel without a new kind of UI element (warn only) |
| L6 | One scoring rule | A quadrant has more than one way to earn Favor, items excepted |
| L7 | Ring shape | A quadrant doesn't have exactly 3 / 2 / 1 spaces, or doesn't have 6 items |
| L8 | No dead turns | A space can give nothing at all in some common state, with no fallback (warn only) |
| L9 | Termination | A loop (echo of an echo, repeat chains) has no stated limit |
| L10 | Round-end scoring | Favor changes anywhere but round end (warn if flagged as an experiment, otherwise fail). Item and fixture Favor is banked and counted at round end |

A **Fail** blocks a design from the library until it's fixed. A **Warn** gets noted.

---

## Layer 2: Value model

See `value-model.md`. For each action and item, compute:
- **Space value** in units, by ring, and in the states "early" and "late".
- **Item payback**: price ÷ expected value of its ability over the rest of the game, if bought at the start of round II.
- **Silo index**: the share of a quadrant's value that comes only from its own actions compounding (0 means fully table-dependent, 1 means fully self-contained).
- **Spill ratio**: what rivals gain ÷ what the actor gains, on actions that spill.

Flags:
- A space more than ±40% off the band for its ring.
- An item paying back in under 1 round (an auto-buy) or over 3 rounds (a trap).
- A quadrant silo index above 0.7.
- A spill ratio above 1 at 4 players (it feeds the table more than it feeds you).

---

## Layer 3: Judgment (1–5, anchored)

Score each quadrant on Q1–Q8. Then score the set on S1–S6.

### Quadrant scores
**Q1 Identity.** Can you say what it's about in five words, and do its actions, items and scoring rule all point the same way?
- 1 = a grab bag.
- 3 = mostly coherent.
- 5 = every piece is unmistakably this quadrant.

**Q2 Clarity.** Could a new player use it after one read?
- 1 = needs examples.
- 3 = one tricky card.
- 5 = obvious at a glance.

**Q3 Live decisions.** Is there a reason to take, or skip, each space in every round?
- 1 = a space is always right or always wrong.
- 3 = most spaces are situational.
- 5 = every space is a real read of the table.

**Q4 Engine & arc.** Does it set up an engine, and does it grow from small early choices into a round-3 burst without going exponential?
- 1 = flat, or explosive by round 2.
- 3 = it grows.
- 5 = early choices visibly shape a satisfying late payoff.

**Q5 Hookability.** Are its actions elemental verbs that items and later spaces can amplify?
- 1 = one-off effects.
- 3 = some verbs.
- 5 = a small, rich verb set with clear amplifiers.

**Q6 Scoring legibility.** At any moment, can everyone see who's winning this quadrant's contest and roughly by how much?
- 1 = hidden or retroactive.
- 3 = trackable with effort.
- 5 = readable from the board.

**Q7 Feel.** Do its interactions feel good to receive as well as to give?
- 1 = someone will hate this.
- 3 = neutral.
- 5 = even the victim smiles.

**Q8 Strength parity.** Is its power in line with the others (based on the Layer 2 numbers, plus judgment)?
- 1 = clearly dominant or clearly weak.
- 3 = probably fine.
- 5 = balanced across play styles.

### Set scores
**S1 Interplay density.** Count the generic emit→consume links in the set graph (see the procedure). The set should have at least 6 links, and each quadrant should both emit and consume at least one.
- 1 = islands.
- 3 = some threads.
- 5 = a web.

**S2 Swap resilience.** Remove each quadrant in turn. Does every remaining hook still have at least one emitter, or degrade gracefully?
- 1 = something breaks.
- 5 = nothing dangles.

**S3 Contrast.** Do the quadrants play differently (different verbs, different scoring shapes such as majority, per-event and set collection)?
- 1 = reskins.
- 5 = four distinct games in one.

**S4 Combination space.** Are there at least 3 interesting cross-quadrant combos, with no single combo that dominates?
- 1 = none, or one degenerate.
- 5 = many, all fair.

**S5 Table temperature.** Is the set interactive without feeling bad, with spillover, watching, and harm that only points up?
- 1 = solitaire or a slugfest.
- 5 = warm, tense, social.

**S7 Table character.** Does swapping spheres change the game's tempo and score scale (low-scoring versus explosive tables), while staying fair between players at any one table?
- 1 = every table plays the same.
- 5 = each table has its own economy.

**S6 Economy fit.** Do the quadrants feed the main loop (buy items, escalate, buy fixtures), with ring contests staying seasoning?
- 1 = contests dominate.
- 5 = contests shape where you place but the market decides who wins.

---

## Procedure
1. **Spec.** Write the design in the spec format (`spec-format.md`). Fragments are fine: leave unknown fields as `?`.
2. **Lints.** Run them yourself (they're mechanical) and record a pass/warn/fail table.
3. **Value pass.** Fill in the value table, and flag outliers.
4. **Interplay graph.** For each quadrant, list what it emits (generic signals: gains, buys, echoes, takes, shares space, gives, holds the most X) and what it consumes. Draw links between them. Then run the swap test.
5. **Blind judges.** Spawn 3 `design-critic` agents in parallel, each given only the spec, `design-principles.md` and this rubric (no prior scores). Each returns Q and S scores with one-line reasons and their top 3 fixes.
6. **Aggregate.** Take the median per criterion. Any spread of 2 or more becomes a "judge disagreement" note. That points either to a real ambiguity in the design or to a vague criterion in the rubric.
7. **Revise.** Fix lint failures first, then the lowest medians. Keep a changelog per quadrant.
8. **Meta.** After each batch, ask where the rubric failed to discriminate, or produced disagreement for bad reasons, and revise the rubric (bump its version and log why).

## Layer 4: Mind-play protocol
- **Setup.** Write a concrete state. 4 players, with seats and Favor. Each player gets two of the starting resource picks, plus a few items appropriate to the round. Every quadrant on the wheel is drawn from the set under test.
- **Personas, one per seat:**
  - **Builder**, who goes for engine first.
  - **Opportunist**, who reads the table and takes the best space now.
  - **Spoiler**, who blocks and denies, and is fair but sharp.
  - **Newcomer**, who takes whatever looks obvious.
- **Play.** At minimum, play one full round II and the start of round III, following the snake order.
  - After every move, update the ledger.
  - After every move, write down the ripple: who gained, who lost an option, what changed for the next player.
  - Resolve round-end scoring explicitly.
- **Report:**
  - final ledger;
  - every moment where a space was obviously right (a non-decision) or useless (dead);
  - every feel-bad moment, and who felt it;
  - the best combo seen;
  - whether the burst arrived in round III;
  - rule ambiguities found while resolving moves. Treat these as bugs.

## Layer 5: Red-team protocol
- **Goal:** break the design. Find a strategy that wins against reasonable play, a loop, a free lunch, a kingmaker lever, a griefing line, or a turn that forces a long think.
- **Each exploit comes with:**
  - a concrete line of play;
  - an estimated size in units or Favor;
  - the smallest fix.
- **Default to suspicion.** Anything that can't be ruled out goes in the report, marked as "plausible".

## Kill rule
- Don't get attached. If a quadrant fails the pass bar after 2 revision rounds, cut it from the pool and keep it only in the graveyard (`design/eval/graveyard.md`), with one line on why.
- A fresh idea beats a third patch.

## Pass bar for the library
- No lint fails.
- Every Q median is 3 or above.
- The mean of the Q medians is 3.8 or above.
- Value flags are either resolved or justified in writing.
- For a set: every S median is 3 or above.

## Changelog
- v1: first version.
- v2.1: added S7 (score scale should vary by table, Dominion-style; a Cory call). The ring-contest budget is relative to the table, not an absolute cap.
- v2: added L10 (Favor only at round end, a Cory call). Added the mind-play and red-team layers (Cory wants evaluators that hold a game state and see knock-on effects). The evaluator is now a team of agents, run as a workflow.
