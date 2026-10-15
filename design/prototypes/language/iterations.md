# Language plate: iteration log

Each render is in `renders/<tag>-plate.png` (1×) with 2× crops beside it. Judged at 2× against the 10 rules in grammar.md.

## v1
What works: the wedge reads as a board, the big line on each space is legible at a glance, the follower and dot glyphs sit on the numerals' baseline, the lit space's light ring is the only warm-white thing on screen.

Failures, by rule:
- R10 (one grid, quiet): the three neighbor quadrants are drawn as gray paper at 22%: a heavy muddy mass that fights the gold wedge and looks unfinished.
- R8 (fixed anatomy): the cactus on Intro Offer sits on top of the name; the frog on Kickback is placed by eye. A taken space has no fixed spot for its minion.
- R8: the shop card's "When a space gives ●" wraps into the effect line. The card has no fixed slot for a two-line trigger.
- R9 (words where glyphs fail): fine print mixes a tiny rival glyph with words ("from ⛤ rivals"). At 12px the hood is a blob; the word alone is clearer.
- R6/R7: the hover card says "Gold member", a color name Cory asked to drop (the dot already says it).
- R2 (amount first): the rival seat's resources run together ("3●1●4●0●" reads as 3140).
- R10: the closed center space is a translucent gray smear, not a clear "later" state.
- Rim: the frog that leads the rule crowds "+4☺", with no gap to show it's a different kind of thing.
- The space hover sits at x=24 while every other edge is on 32.

## v2
Fixed: neighbors are now engraved hairlines; a taken space puts its minion where the name was (one fixed spot); fine print is plain words; the hover lost "Gold member"; the shop card has a fixed two-line slot for when it triggers; the rim's leader sits behind a hairline; everything starts on the 32px margin.

Still failing at 2×:
- R8: the rival seat's "EACH ROUND" and "JUST TOOK" wrap into two lines and crowd the member portraits.
- R8: Prospector's trigger breaks as "When a space gives you / ●", a lone dot on its own line.
- R9: sentences still say "gold ●" twice (the word and the dot). A dot is the word, so the sentence should use one or the other: the dot.
- R1: in the alphabet strip, "/" and "×" are set at caption size and look like afterthoughts beside the drawn glyphs.
- The hover's lone "worth" caption under the follower count reads as a stray word.

## v3
Fixed: the rival seat fits on two rows (holdings and followers; members, what they make each round, what they just took); Prospector's trigger breaks on purpose ("When a space / gives you ●"); dots replace color words in sentences; the operators in the alphabet are set at glyph size.

Still failing at 2×:
- R4 (one mark per operator): the rim's radial hairline before the leader's minion slants like "/", the mark that means "per". A separator must never borrow an operator's shape.
- R10: Double Down's name sits 2px under the center ring's top arc; its block is pushed outward by a stray +8.
- The hover sentence wraps to a one-word last line ("more."); sentences need balanced lines.
- Intro Offer: a full word space between the member glyph and "−4" splits one idea into two.
- Shop cards: the one-line triggers leave a 32px hole under the name. The art band can take 8px of it.

## v4
Fixed: no separator on the rim, only space; Double Down's block is centered in its ring; sentences wrap balanced ("Whenever a space gives / you ●, you get 1 more."); the member glyph and "−4" read as one unit.

Still failing at 1× and 2×:
- R8: moving the name down 8px made Prospector's two-line trigger touch the name (0px gap). The card needs 8px more height, not a squeeze.
- R10: the alphabet strip's last item ("extra turn") runs into the seat's left edge at x=784.

## v5 → v8
- v5: cards are 8px taller (trigger slot 104–136, 8px clear of the name); the alphabet strip ends at x≈750, clear of the seat.
- v6: Intro Offer's fine print "your next member" could read as "lose 4 members". Changed to "next member costs 4 less", but at 2× that grazed the narrowing cell edge.
- v7: "off your next member" fits, and with the big line it reads "−4 off your next member".
- v8: your unplaced cacti were unlabeled. Added "to place". Final: `plate.png`, with 2× crops in `plate-detail-board.png` and `plate-detail-cards.png`.

## Blind check (v8, read as a stranger with only the rulebook)
**Could a newcomer say what each action does in one glance?** Yes for five of six. Golden Years ("+4●, 2·4·6 by round"), Collect Debts ("+3●, up to 3, from rivals"), Tithe ("+1● / member"), Kickback ("+3●, a rival gets 1●") and Double Down ("×2●, opens in round III") read from the big line plus the fine print. Intro Offer needs its fine print: "▯−4" alone is ambiguous, but "off your next member" settles it. Two things need the rulebook once: the frog on the rim means "P3 leads this" (nothing says so), and the four-color dot means "any" (a stranger guesses it, the alphabet confirms it). The members read without a hover: "When recruited +1● / ▯", "When a space gives you ● +1●", "When you recruit +1●".

**Does anything look unaligned, cramped or inconsistent?** Nothing is off the 4px grid at 2×. Every container has an 8px corner, the three type sizes hold, and taken spaces put their minion in one spot. Remaining nits: the board's lower left is a large dark mass (on purpose, out of focus, but heavy); taken paper is a flat gray-beige; there's a hair of space between a dot and a following comma ("you ● ,").

**Would this pass for a shipped game?** The cards, seats and hovers would. The wheel slice is close but not there: the rim band is a flat fill, where a shipped board would give it material (a printed edge, pressed type). That's a material pass, not a grammar change, so I stopped here at the time box.

# Plate 2

Cory on plate 1: "pretty good". He wants an object that says "a place you send a minion", as distinct as the dot (money) and the card with a person (a member). Names come off the spaces and go into the hover. Decompress: more air, bigger effects, fewer words.

## Candidates (plate2-candidates.png, candidates.html)
Four objects, each in open / lit / taken / locked, with the same effects in each column so only the object changes.
- **A · Tile with a socket.** The round hollow is a clear spot for the minion, but the silhouette is a rounded rectangle, the same as a member card. It fails the brief's first test: a place must not look like a person.
- **B · Doorway.** The arch is a silhouette nothing else in the game uses (dot = circle, member = card). The door is the minion's spot, built into the object, and every state comes from the door itself: dark when open, lit from inside when it's yours to take, a minion standing in it when taken, shut with the round's numeral when locked. Lit becomes literal light, which is rule 6.
- **C · Plinth.** Distinct, and the minion on top reads well. But it's the only 3D object in a flat language, the top ellipse adds noise, and a minion on top pokes into the row above.
- **D · Banner.** It reads as a flag rather than a place. The minion stands outside the object, so "taken" is weak and "locked" has nothing to shut.

**Pick: B, the doorway.** It's the only candidate whose four states need no extra mark, and "send a minion through a door" is what placing is.
