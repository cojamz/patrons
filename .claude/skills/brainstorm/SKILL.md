---
name: brainstorm
description: Come up with and pitch Cults design ideas to Cory: spaces (actions) for a color's round I/II/III slots, members, a color's direction, fixes for a card he dislikes, or "what could X do". Use it whenever you're about to propose any card text, space, member, ability or design option, including one-line fill-ins in a color redesign thread, even if he didn't say "brainstorm". It holds how the game plays and wins, each color's fantasy, why his favorite spaces landed, and his past verdicts.
argument-hint: <the slot or question, e.g. "White round I, two empty slots">
---

# Brainstorm with Cory

Cory designs Cults; Claude brings ideas he can react to. He has called the ideas lackluster and asked whether Claude understands the game. Those moments came from three causes: an idea built on a piece of the game that doesn't work that way, an idea never played through a turn, or a small formula on your own pile dressed up as a design.

**Speed is part of the job.** He's in a live conversation. A pitch takes about a minute, never a quoted wait ("15 minutes????? what the fuck"). The heavy reading happens once per thread; after that, pitch from what you already know.

## Every pitch: four gates, in order, none skipped

Oct 30, Yellow: eight nos in a morning ("small ball gains", "how do you have NO clue how the game works????", "are you using the skill?"). Every one came from skipping a gate below to answer fast. Speed means no padded waits, never skipped steps: a list takes the time the gates take, and you say a real time.

**Gate 1. The live game, not the notes.** Once per thread: read design/rulebook.md end to end and `RING_VALUE`, the shop sizes and `ROUND_CUTOFFS` in src/engine/v4/core.js, then [references/cheatsheet.md](references/cheatsheet.md) and [references/design-core.md](references/design-core.md). Notes lag the game (they said contests paid 2/4/6 when live was 4/6/10). Never describe a piece you haven't seen in the rulebook: the rim only prints what a contest counts; no rule lives there.

**Gate 2. Cory's sentence and the anchor.** Before any slot, write in one line what the color is *for*, in his words if he's said it (Yellow, Oct 30: "rewards going broad… translate currencies"), and the round III action it builds toward. If either is missing, ask him for it in one question and pitch nothing else. Never pitch round I or II for a color whose round III isn't agreed. Never invent the identity from the color's name or an adjacent color's job (Yellow was pitched as the contests color, a separate color he'd parked).

**Gate 3. Generate wide, then play every idea on paper, in writing.** About 12 seeds per slot, each a verb on a different real piece (design-core section 4 shapes; game-model.md section 1 pieces). For a fresh angle, hand the whole brief (gates 1 and 2, the slot, his refusals) to a general-purpose subagent and generate there too; never pass its output on unread. Then for every seed, write down, not in your head:
- the card text as it would print;
- a 4-player turn in round I and in round III: what you get here versus the best other space, by name and number;
- the decision it creates, and for whom (the taker gives something up, or a rival chooses or reacts). No decision: cut it, however clean;
- both sides of every choice: play the chooser; if one option always wins for them, it isn't a choice (verdicts.md 15, "give you 1 or you steal 2");
- why only this color could print it (not a Green copy, a Red swap, a Magenta steal, a Blue shop move, a guest's text);
- its best case and Greatest Hits copying it.

**Gate 4. Filter, then send.** Cut on the cheatsheet kill list and every line of [references/verdicts.md](references/verdicts.md), and against this color's lines in design/pitch-ledger.md: anything that resembles a refused idea in shape (a "+1 of another color, more each round" after "Mix" was refused is the same idea) is out. What survives is usually 2 to 4, not 5; send what survives, and if nothing does, say so and ask one sharp question. Each line: the printed text, what changes for a player, your pick in brackets. At most eight lines.

**After a no.** Two nos on the same slot in a row: stop pitching that slot. Re-run gates 2 and 3 properly (subagent included) before the next list, and tell Cory the real time it takes. Rapid re-pitches after a no are how one no became eight.

**Log** each pitch at the top of design/pitch-ledger.md and his answer the same turn; a verdict that shows a new pattern goes into references/verdicts.md.

## Deeper work (a new color or direction, or when he says the ideas miss)

Only when there's time, never while he's waiting on a short list.

## 1. Load the real game

Once per thread, or when he says the ideas miss; the game changes daily.

- Read [references/game-model.md](references/game-model.md) in full. It's the pieces, the scarce things by round, and the math.
- Read [references/verdicts.md](references/verdicts.md) in full. It's what he said yes and no to, and why.
- Print the live cards: `node .claude/skills/brainstorm/scripts/live-board.mjs <color-id> red echo thieves market` (add `--members` for members). Live code wins over every doc. Ids: red, echo (Green), thieves (Magenta), market (Blue), purple, gold, silver, yellow, trading (White). A color in rework may have approved spaces not built yet: read its spec in design/spheres/ and its latest lines in design/decisions.md (`grep -n "<Color>" design/decisions.md | tail -20`).
- Read the top of design/pitch-ledger.md for this color: what's already been pitched and refused, so you don't send it again.
- Answer the six questions at the end of game-model.md to yourself. If any answer is shaky, you aren't ready to pitch.

## 2. Frame the slot

Write these down privately, in a few lines:

- **The slot**: color, ring (round it opens), and what sits around it (the color's approved spaces, quoted).
- **The anchor**: the color's round III action. Earlier slots build toward it; they never preview a smaller version of it.
- **What's scarce** in this slot's round (resources early, the recruit late), and what this slot should feed (for White, white or followers for the cash-in; for Purple, timing).
- **The bar**: the strongest reworked space in the same ring, quoted with its total. Round II's bar is Promote and Shake Down.
- **His gist**, if he gave one, in his words. Ideas that grow out of his own words land far more often than ideas from nowhere.

## 3. Go wide on pieces, not numbers

Write about 12 seeds privately. Build each one as **a verb on a piece**: pick a piece from game-model.md section 1 (a space, a minion, a turn, the recruit, the shop row, the pile, a member of yours, a rival's member, recruited followers, a color of resource, a contest) and a verb (take, give, swap, copy, bury, double, skip, move, cash in, reveal, block, match). Cover at least six different pieces. A seed whose whole effect is "your pile changes by a formula" can stay only if this color still lacks its one plain scaling gain.

For each seed, write the decision it creates: what the taker gives up, or what a rival now has to choose or watch for. A space with no decision in it is a number, and he reads numbers as flat.

## 4. Play each one through a real turn

This is the step that was skipped every time he lost patience. For every seed still standing, write a short turn in game words:

- At 4 players (and 2 if it counts rivals or spaces): which round, who you are (holding what, roughly), what else you could place this minion on, and what you get here instead. The gain is this space minus the best alternative, not this space alone.
- The same space taken in round III (round I spaces stay open all game), and what Green's copies do with it.
- Placement accounting: does it hand back a minion or a turn and nothing else? Then it nets zero.
- Does it finish the moment it's taken? A space that watches for later events or waits for round end is a member effect; move the idea to members or drop it.
- What a rival at the table feels: nothing, a sting, a gift, a reason to block it.

Two short examples of the walkthrough deciding:

> White round II, "Send one of your members to the bottom of the pile, gain white equal to its cost." (+1 white.) Round II, 4 players: you hold a 6-cost member worth 2 whose ability you've used up. Send it: 7 white. In round III, "Turn all your white into followers" turns those 7 into 7 followers with no recruit spent. You traded 2 followers of worth for 7, and kept your recruit. Placed elsewhere, the best round II space gave you about 4. Real sacrifice, real payoff: pitch it. (He said yes.)

> Purple round II, "+1 purple. Take one turn after this one." You place here and then place your next minion right away. Without it you'd place both anyway, one now and one next turn. Net: one turn moved earlier, and a minion spent on a space whose gain is 1. It's a smaller Crunch Time. Cut it. (Pitched anyway, it drew "do you understand this game at all?")

## 5. Filter

Run each survivor past every failure mode in verdicts.md. Then compare with the bar from step 2: equal or better total, different side effect. Drop anything already refused in the ledger unless you can say in a few words what's different. From what's left, keep the 5 or so that touch the most different pieces. If nothing survives, say so and ask him a sharper question about the color instead of sending filler; a thin list costs more trust than a short one.

## 6. Send

One message, at most eight lines, in the foreman voice:

- A numbered list he can answer by number. Each line quotes the card text as it would print, then what changes for a player in a few words. Say what a card makes happen in its own printed terms; a loose summary ("does it twice", "basically a steal") reads to him as not knowing the card. One played example if the effect isn't obvious from the text.
- Your default in brackets. Numbers are your fill-ins; say so once.
- About 5 ideas per open slot in one message, one line each, never one at a time.
- No prices on members unless he asks. No file names, system words or coined labels.

## 7. Log the same turn

- Add each pitch at the top of design/pitch-ledger.md: `- date · pitch · … no verdict yet · tags: …`.
- When he answers: flip it to ✅ / ❌ / ↔ with his words, log any call in design/decisions.md (date, one line, why), update the color's spec in design/spheres/, and refresh the color's section in design/strategy.md if the color's shape changed.
- If the verdict surprised you, add the lesson to design/lessons/design.md, and if it's a new pattern, a line to references/verdicts.md here so the next thread doesn't repeat it.
- Commit and push.

Never start building a pick he hasn't confirmed. His answer replaces your suggestion unless he says "also".

## Members

The same steps, with two changes: members come after a color's spaces are set (he said not to design members for colors whose actions aren't done), and a set is a range from strong to weak with a few of the color's own counters (design/member-process.md). Members he loves bend a rule, give steady income or score; small "+1 when…" triggers read as weak. Don't pitch a member that is only "Worth N followers" with no ability (Cory, Oct 22: "I don't like when it's like just worth followers and no ability"), and go easy on "Now and at round start" income, which the redesigned colors mostly dropped. For a deep "how does this play" question, the `strategist` agent can help; check its answer against the live board before using it.
