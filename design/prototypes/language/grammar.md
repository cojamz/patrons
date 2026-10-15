# Cults: how the screen speaks (draft grammar, for Cory's reaction)

The plate is `plate.html` / `plate.png` (2× crops: `plate-detail-board.png`, `plate-detail-cards.png`). Nothing here is wired into the game.

## Ten rules, taken from the games that read in one glance
1. **A closed alphabet.** About ten drawn marks, reused everywhere, never a one-off icon. (Race for the Galaxy, Dune: Imperium)
2. **The amount first, and loudest.** "+3●": the number is the biggest thing, the noun follows it. (Slay the Spire's intents, Into the Breach's damage)
3. **Left to right, give → get.** One arrow means "becomes"; what you give is on its left. (Everdell, Lords of Waterdeep, Dune: Imperium)
4. **One mark per idea.** "/" only ever means per, "×" only ever means times. A separator never borrows an operator's shape. (Wingspan)
5. **Yours big, the rest small.** The big line is what you get. How it scales, where it comes from and who else gets something go in the fine print under it. (Lords of Waterdeep)
6. **Light means "you can act here".** One warm-white glow for the one thing under your hand. Color only ever means a resource or its quadrant. (Into the Breach, Balatro)
7. **Pixels say who, glyphs say what.** Pixel art is identity (members, leaders, minions). Rules are never drawn into art. (Wingspan, Spirit Island, Inscryption)
8. **Fixed anatomy.** Every space and every card keeps each part in the same spot, so the eye learns one map. (Wingspan, Root)
9. **Glyphs for nouns, words for the rest.** Rare verbs and conditions are plain words. The full sentence is always one hover away. (Root digital, Slay the Spire's keywords)
10. **One grid, three sizes, one stroke, one corner.** Polish is consistency. (Balatro, Into the Breach)

## The alphabet (10)
Drawn: **● resource dot** (a flat disc in its color) · **any** (the wheel in miniature: four quarters in the table's colors, each where its quadrant sits) · **follower** (head and shoulders) · **member** (a card with a person on it) · **minion** (the worker) · **rival** (a hood, like every leader's) · **→ becomes** (⇄ for swap, same stroke) · **↻ extra turn**.
Typed in the numeral face: **/ per** · **× times**. Plus and minus belong to the number ("+3", "−4"); they aren't marks of their own.
Retired: the ring for "any", per-color shapes, the badge, every space's pixel icon on its face.

## Composition
- **A space:** name (small caps, top) · big line (what you get, at most 4 tokens) · fine print (plain words). If its number depends on the round, the big line shows this round's value, and the fine print shows the ladder "2 · 4 · 6 by round". Taken: the minion stands where the name was and the rest fades to half. Later rings: an engraved outline with the text at low contrast, so you can plan. Hover: the sentence in plain words, then "You'd get …".
- **A member:** portrait (top) · name (small caps) · when (a plain clause, at most two lines, sitting right on the effect) · effect (the same big-line grammar as a space) · cost bottom-left · worth bottom-right. The when-clauses form a short set: *When recruited · Each round · When … · Once a game · Once a round · At game end*; nothing at all means always on. Hover: name, cost, worth, the sentence, then one live line tying it to the board ("Golden Years would give you 5● instead of 4●").
- **A cost:** number before dot, colored part first, then any: "2● 2◐". No color names and no "need N". What you can't afford is shown by fading the card, not by text.
- **A rim rule:** "MOST ● +4☺", then the leading player's minion. It's engraved in light type on the dark band, never on paper, so it can't be mistaken for a space.
- **Sentences:** a dot stands in for its color word ("gives you ●"). Numbers are always heavy.

## The 15 hardest actions under it (big line · fine print)
1. Kickback: `+3●` · a rival gets 1●
2. Golden Years: `+4●` · 2 · 4 · 6 by round
3. Intro Offer: `▯−4` · off your next member
4. Collect Debts: `+3●` · up to 3, from rivals
5. Tithe: `+1● / ▯` · per member you have
6. Double Down: `×2 ●` · doubles what you hold
7. Snap Up: `+2● +▯` · recruit one now, pay in any colors
8. Half Price: `▯ ×½` · as your buy, any colors
9. Spree: `buy ×3` · this turn
10. Catch Up: `+1● +2● / ⛤` · per rival with more minions out
11. Overtime: `8● → ↻↻` · can't pay? +3●
12. Even Swap: `+1● ▯⇄▯` · with a rival, equal cost
13. Cheap Seats: `◐ → ☺` · 1 for 1, up to 2 · 4 · 6
14. Hold Court: `+1☺ / 2●` · keep the ●; everyone else +2●
15. Echo: `copy ⛤` · a space a rival took since your turn
Poach, Shake Down and Crunch Time need two clauses; they get the same big line plus a second fine-print line, never a new mark.

## Type, grid, line, color
- **Type:** Alegreya Sans only, lining tabular numerals. 12px (names in tracked caps 700; fine print; when-clauses), 16px (sentences, seat numbers, costs), 28px (the big line, your follower total). Glyphs are 0.8em of the type they sit in.
- **Grid:** 4px. Paddings 12/16; 8px between spaces, 16 between cards; 32px from the screen edge.
- **Line and corner:** glyph strokes are 1/8 of the glyph (2 on its 16 grid), round ends; structure is 1px hairlines; every container has an 8px corner, art boxes 4px, dots are round. Paper sits on the dark table by value alone, with no borders.
- **Color tokens:** table #191310, seat #221a15, board #2b2119; paper #f2e8d2 (lit #fbf6ea, taken #cfc2a6); ink #2b2018 / #6e5c49 / #a39078; cream #f2e8d2 / #b9a98c / #7d6e5a; light #fff3d4 (the one accent); gold #d49b27, red #c4533f, blue #4a80b8, green #3f9467.

## Reading a rival's build at a glance (Cory: "I have no idea what the bots' builds are")
Their seat answers four questions in one row each, the same alphabet throughout: **what they hold** (dots, zeros faded), **who they've recruited** (portraits, grouped by color: the color mix is their lean), **what that makes each round** ("each round +3● +2●", the sum of their round-start members), and **what they just did** ("just took Kickback", kept for one turn). **What they're going for** is on the board: their minion stands on every rim they lead. Hovering their portraits opens each member in the same card grammar.

## Open risks
- The dots differ by color alone (Cory's lean). Colorblind players and a White table (a cream dot on cream paper) need a fix: an inner mark per color, or darker paper.
- Long when-clauses ("Whenever the rival with the most followers buys followers") won't fit two lines on a 140px card. They'd need a shorter set of clause words, and that's untested across the 157 members.
