---
name: eval-quadrant
description: Run a Patrons quadrant, set of quadrants, or fragment (action/item/scoring/price) through the design evaluator — lints, value model, interplay graph, 3 blind judges, aggregate, revise. Use whenever proposing or iterating quadrant designs.
argument-hint: <path to spec, or inline spec>
user-invocable: true
---

# Evaluate quadrant designs

Sources of truth, in priority order:
1. `.claude/rules/design-principles.md`, which holds Cory's calls.
2. `design/eval/rubric.md`, which holds the criteria and the procedure. Always use its latest version.
3. `design/eval/value-model.md`, which holds the numbers.
4. `design/eval/spec-format.md`, which holds the input shape.

## Steps
1. Normalize the input into the spec format. Mark unknowns as `?`.
2. **Lints.** Run L1–L9 yourself and record a table. Word counts must be actual counts.
3. **Value.**
   - Compute each space's value against its ring band.
   - For each item, compute EV, its price as a percentage of EV, and its payback.
   - Compute the silo index and spill ratio.
   - Flag outliers.
4. **Graph.** List what each quadrant emits and consumes, draw the links between them, then run the swap test: remove each quadrant in turn and list any hook left dangling.
5. **Judges.** Spawn 3 `design-critic` agents in parallel, in one message. Give each the spec(s), the principles and the rubric, and nothing else: no scores or opinions. Each judge returns:
   - Q1–Q8 per quadrant (and S1–S6 for a set);
   - a one-line reason for each score;
   - its top 3 fixes;
   - one thing it would protect at all costs.
6. **Aggregate.** Take the median per criterion. A spread of 2 or more is a disagreement: say whether the cause is design ambiguity or rubric vagueness.
7. **Report.** Write it to `design/eval/runs/<batch>-<name>.md`. Include:
   - the lint table;
   - the value flags;
   - the graph and swap test;
   - the median scores, with disagreements;
   - the fixes, ranked.
8. **Revise** if asked: fix lint fails first, then the lowest medians. Re-run only the changed parts.
9. **Meta.** Append any rubric weakness you noticed to `design/eval/meta-notes.md`. If the same weakness shows up twice, revise the rubric, bump its version, and log why.
