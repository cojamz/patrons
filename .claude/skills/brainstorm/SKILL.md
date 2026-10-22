---
name: brainstorm
description: Come up with and pitch Cults design ideas to Cory: spaces (actions) for a color's round I/II/III slots, members, a color's direction, fixes for a card he dislikes, or "what could X do". Use it whenever you're about to propose any card text, space, member, ability or design option, including one-line fill-ins in a color redesign thread, even if he didn't say "brainstorm". It holds how the game plays and wins, each color's fantasy, why his favorite spaces landed, and his past verdicts.
argument-hint: <the slot or question, e.g. "White round I, two empty slots">
---

# Brainstorm with Cory

Cory designs Cults; Claude brings ideas he can react to. He has called the ideas lackluster and asked whether Claude understands the game. Those moments came from three causes: an idea built on a piece of the game that doesn't work that way, an idea never played through a turn, or a small formula on your own pile dressed up as a design.

**Speed is part of the job.** He's in a live conversation. A pitch takes about a minute, never a quoted wait ("15 minutes????? what the fuck"). The heavy reading happens once per thread; after that, pitch from what you already know.

## Every pitch (about a minute)

1. Once per thread, before the first pitch: read [references/design-core.md](references/design-core.md) (how the game plays, each color's fantasy, why his favorite spaces landed) and [references/cheatsheet.md](references/cheatsheet.md) (the rules in ten lines and the kill list). About two minutes, then never again in that thread.
2. Write the color's theme in one line first ("Purple: I act when it matters most"; design-core section 3), and open the pitch to Cory with it so he can correct your read. Every idea must *be* that theme in one clean mechanic, not the theme plus a numeric bonus bolted on. Elegance test: could a player say what the space is about in three words that match the theme? Then consider the arc of this slot's round. Generate 6 or so ideas from the shapes in design-core section 4: trade one scarce thing for another, break a limit everyone feels, read the table, hand someone a choice, one visible count. Each idea names what the taker gives up and what it combines with (its members, other colors' spaces); the game is engines and synergy, not good picks in a vacuum. Think freely here, in any terms that help; the game's exact wording comes later and must never narrow the ideas.
3. Play each through one turn in your head: what you'd get here versus your best other space, in round I and round III. Cut anything on the cheatsheet's kill list.
4. Only now, write them up in the game's words ([references/wording.md](references/wording.md)), plainly and briefly. Send 1 to 3 that touch different pieces: numbered, the card text as it would print, what changes for a player, one played example if needed, your pick in brackets, numbers marked as yours. At most eight lines.
5. Log the pitch in design/pitch-ledger.md and push, after sending.

If nothing survives, say so in one line and ask him one sharp question about the color. Don't send filler.

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

Run each survivor past every failure mode in verdicts.md. Then compare with the bar from step 2: equal or better total, different side effect. Drop anything already refused in the ledger unless you can say in a few words what's different. From what's left, keep the 1 to 3 that touch the most different pieces. If nothing survives, say so and ask him a sharper question about the color instead of sending filler; a thin list costs more trust than a short one.

## 6. Send

One message, at most eight lines, in the foreman voice:

- A numbered list he can answer by number. Each line quotes the card text as it would print, then what changes for a player in a few words. Say what a card makes happen in its own printed terms; a loose summary ("does it twice", "basically a steal") reads to him as not knowing the card. One played example if the effect isn't obvious from the text.
- Your default in brackets. Numbers are your fill-ins; say so once.
- One or two ideas when calibrating a new slot or color; up to three when he asked for options. More only if he asks.
- No prices on members unless he asks. No file names, system words or coined labels.

## 7. Log the same turn

- Add each pitch at the top of design/pitch-ledger.md: `- date · pitch · … no verdict yet · tags: …`.
- When he answers: flip it to ✅ / ❌ / ↔ with his words, log any call in design/decisions.md (date, one line, why), update the color's spec in design/spheres/, and refresh the color's section in design/strategy.md if the color's shape changed.
- If the verdict surprised you, add the lesson to design/lessons/design.md, and if it's a new pattern, a line to references/verdicts.md here so the next thread doesn't repeat it.
- Commit and push.

Never start building a pick he hasn't confirmed. His answer replaces your suggestion unless he says "also".

## Members

The same steps, with two changes: members come after a color's spaces are set (he said not to design members for colors whose actions aren't done), and a set is a range from strong to weak with a few of the color's own counters (design/member-process.md). Members he loves bend a rule, give steady income or score; small "+1 when…" triggers read as weak. For a deep "how does this play" question, the `strategist` agent can help; check its answer against the live board before using it.
