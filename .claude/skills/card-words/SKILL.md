---
name: card-words
description: Find the words for any Cults space or member, in every place the game prints them (card text, hover, wheel panel, short face, prompt, log), so a first-time player reads it right at a glance and the rules stay exact. Use it whenever you write or change what a card or space says, when Cory says text "reads weird", "is confusing" or "is wrong", when a new card or rule change lands, or when /review-text finds a mismatch. Use it before proposing any wording to Cory, even a one-line panel fix.
argument-hint: <the card or space, and what reads wrong, e.g. "Gather's panel: '+4 next round' reads like a promise">
---

# Card words

Cory's bar: intuitive to a human at the table, and crisp and precise. Those pull against each other. Exact text gets long, and short text gets ambiguous. Most of our misses came from writing what was true to us (we knew the rule) and never reading it as someone who didn't. "+3 more each round" was true to the code and wrong to every player. "+4 next round" fixed the number and read as a promise ("take it now, get 4 next round"). The method below exists to catch that before Cory does.

Card text is Cory's: propose, never ship a rule's new words without his yes. Panels, hovers, faces, prompts and log lines must say what the rule says. Their words are Claude's, under go-with-your-gut, logged in design/decisions.md.

## 1. Pin down what it does (before any words)

Write the effect as plain facts, not prose: who gains or loses, what, how many, from where (the bank, a rival, the shop, the pile), when (now, this turn, this round, round end), what decides the amount, and what the player chooses. Read the code in `src/engine/v4/content/<sphere>.js`, or run `node .claude/skills/review-text/scripts/text-sheet.mjs <sphere>` to see what it really did on a table. Check `grep -n "<name>" design/decisions.md | tail -5` for Cory's latest call. If you can't state a fact, you can't word it. Ask or read more.

## 2. Know which surface you're writing

Each place has one job. Words that fit one place are often wrong in another.

- **Card text (the rule):** complete and exact, all rounds, every condition. It's the log's, the rulebook's and the glossary's source. Forms in design/rule-style.md and `.claude/skills/brainstorm/references/wording.md`.
- **Hover:** the rule, one effect per line, this round's line lit for a growing effect (the I / II / III lines).
- **Wheel panel:** what taking it gives you now, in about 16 letters a line. Line 1 must stand alone because lines 2 and 3 drop when the panel is tight. Never say anything the rule doesn't.
- **Short face and pips:** the panel squeezed further, for small spots.
- **Prompt:** the decision as a verb, "<Card>: <what you decide>." with counts in brackets.
- **Log:** what happened, past tense, with numbers, naming the card.

## 3. Draft wide, then run the misread test

Write 3 to 5 candidates. Start with the forms the game already uses for the same idea: same idea, same words (Magic's templating rule; a new phrasing tells players the rule is different). Then, for each candidate, pretend you've never played. You glance at it for two seconds, and you read every word literally. Write down the two most likely wrong readings. [references/misreads.md](references/misreads.md) lists the traps this game keeps falling into: when, whose, where from, how many, in what order, promise or schedule. Check each candidate against them.

A candidate survives if its likely misreads are harmless or impossible. Then rank the survivors:

1. Read right the first time by a new player.
2. Exact: true in every round and edge case (zero to steal, a tie, round III).
3. Consistent with how the game already says it.
4. Short enough for its surface (panels: try it with the wheel check below).

Clarity beats brevity. Never buy a shorter line with a misread.

## 4. Check it in place

- Panels: `node .claude/skills/review-text/scripts/wheel-fit.mjs --shots <dir>` prints what the wheel shows at 1270×700 and which lines drop. Look at the screenshot yourself, and read the space next to its neighbors.
- Rules: `node .claude/skills/review-text/scripts/text-sheet.mjs <sphere>` shows every surface beside what the engine did.
- Read it aloud. A line that needs a second breath is two lines.

## 5. Bring it to Cory, or ship it

- A rule's words: a numbered list, at most 5 options, each quoted as it would print. After each option, say in a few words what a player sees and which misread it avoids. Put your pick in brackets. Then build his pick exactly.
- A surface that repeats the rule (panel, hover, prompt, log): pick the survivor, ship with a screenshot, and log the gut call.
- When the misread test can't separate the options because it's a feel call (cult flavor, tone), give Cory about 5 options at once, like "cast out".

## 6. Keep the phrasebook

Add every accepted and rejected form to [references/phrasebook.md](references/phrasebook.md), with the misread that killed the rejected ones. Check it first next time, so a rejected form like "+X next round" never comes back.

## References

- [references/misreads.md](references/misreads.md): the trap list with this game's real misses. Read it every time.
- [references/phrasebook.md](references/phrasebook.md): approved and rejected forms. Read it every time.
- [references/research.md](references/research.md): where the principles come from (card-game templating, rulebook writing, readability testing). Read it once per thread, or when a principle is in dispute.
