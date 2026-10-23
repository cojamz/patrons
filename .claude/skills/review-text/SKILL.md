---
name: review-text
description: Deep check of Cults space and card text against what the game really does and shows. Use when Cory says text seems off, after any change to a space's or member's words or numbers, before shipping a text change, or when a playtest note is about what a card says. Finds missing or extra effects, the wrong part scaling, round numbers not shown, lines the wheel cuts, stale words, and house-style slips.
argument-hint: [sphere ids, e.g. "trading yellow"; default all]
---

# Review the text

A space's words live in five places that drift apart: the rule (the engine's `text`, also the log, rulebook and glossary), the hover's per-round lines (`byRound`), the wheel panel (`panelText.js`, three lines that drop when they don't fit), the short and pip faces (`shorts.js`), and the prompts and log lines the engine writes while it runs. Cory changes a rule mid-playtest and only the rule moves. This skill puts all five beside what the engine actually does, round by round, so every mismatch is visible.

Rule text is Cory's (design). Everything that should repeat the rule (hover lines, panel, faces, prompts, log) is a fix: Claude's, under go-with-your-gut, logged in design/decisions.md.

## 1. Get the evidence (about 5 minutes, no game runs)

- `node .claude/skills/review-text/scripts/text-sheet.mjs [spheres] --out design/eval/text-review/sheet-<date>.md` (about a minute). For each space and each open round: the rule, the hover's round lines, the wheel panel's lines, the short and pip faces, then a probe: a bot-played 4-player position at that round, P1 takes the space (the space is freed if a rival sat there), first real choice each time, on two piles ("lean": 3/2/1/0 by color, so fewest and none-of bite; "full": 3 of each). It prints what changed for every player, the questions asked, the log, and mechanical flags at the end.
- `node .claude/skills/review-text/scripts/wheel-fit.mjs --out design/eval/text-review/wheel-<date>.md` (a few minutes, its own vite server; needs `npm ci`). Three tables cover every color at rounds I, II and III at 1270×700: what each panel shows, and which lines dropped for lack of room. The wheel turns each turn, so a drop at one angle is real even if another angle fits.
- Once per thread: read design/rule-style.md and .claude/skills/brainstorm/references/wording.md, and `grep -n "<space name>" design/decisions.md | tail -5` for any space you're about to call wrong (the latest call wins; it may be newer than the text).

## 2. Read every space through eight questions

Write a finding only when you can quote both sides.

1. **Does it do what it says?** Every effect in the rule shows up in "did", and nothing in "did" is missing from the rule. Check the zero cases (nothing to steal, no members, no white). Who gets what: "steal" takes from a rival, "+N" comes from the bank.
2. **In the order it says?** The rule's order matters when one part feeds the next (Exchange gives its +1 white first, so that white can be turned in; the text says it last).
3. **Does every place say the same thing?** Rule, hover lines, panel, short, pips, prompt, log. Same numbers in each round, same verbs, same limits ("up to 2" vs exactly 2). After a Cory change, look for the old words left behind ("already", "+1 follower" where it now steals).
4. **Which part grows?** On a space that does two things, the words must say which one scales. "more each round" or "both grow" under two gains where only one grows is wrong (Cory, Oct 22: "'more each round' is confusing on actions that do multiple things"). A flat bonus printed beside a growing one of the same color ("+1 white and +1 white") reads as a typo.
5. **Is this round's number on screen?** A growing space shows this round's number on the panel and lights it in the hover. "× round" or a number with no "grows" note makes the player do math or think it's flat.
6. **Does the wheel print it whole?** A dropped line that carries a number, a condition, a rival's share or a second effect means the board lies by omission. Line 1 must stand alone.
7. **Would a new player read it right at the table?** Read it plainly, out loud, once. Ties, "fewest", "half or all", "your next", "this round" vs "this turn", "rival" vs "anyone". Play one concrete turn in game words when unsure.
8. **House style.** rule-style.md and wording.md: two effects are two sentences, digits, "you choose" (never "pick"), "each rival", growing-by-round form, openers on members.

Members get the same questions (print them with `node .claude/skills/brainstorm/scripts/live-board.mjs --members`), with the probe replaced by reading their code in `src/engine/v4/content/<sphere>.js`.

## 3. Sort and write it up

Rank: **wrong** (says X, does Y) › **hidden** (the board never shows a number or effect) › **unclear** (a table would argue about it) › **style**. Write design/eval/text-review/<date>.md: one line per finding with the space, what the player sees, what the game does, the fix, and whose call it is.

- Fixes to the panel, faces, hover lines, prompts and log so they match the rule: make them, check them (`npm run check:v4:quick -- --related <files>`), ship per the harness, log as gut calls.
- Any change to a rule's words or what it does: a yes/no question for Cory, with your proposed words in brackets. Never change card text without his OK.

## 4. Tell Cory

At most eight lines, foreman voice: what you found in a sentence, then the calls as a numbered list he answers by number, each quoting the card in a few words and saying what changes for a player, your default in brackets. Link the write-up. Say which fixes you're already making.

## Probe limits (don't report these as bugs)

- The probe picks the first real option, so a choice the player could make better isn't a bug. It stops at the recruit: Splurge, Recruit Twice and Spree show only their resource gain.
- A rival's answer (Shake Down's pay or lose) isn't probed. Members on the table fire too (Prospector, Snitch): read the log to tell them apart.
- "Space freed from P3" means a rival sat there and was lifted for the probe.

## Lessons

- 2026-10-23, first run: Sweet Talk's panel said "others get 2 silver" while the rule and the game give 1; Help Yourself's and Redistribute's panels kept words from before Cory's changes; Hold Up and Right Away grow by round but never light this round in the hover. All five surfaces drift on their own: check them all every time.
