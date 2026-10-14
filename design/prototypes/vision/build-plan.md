# Building the Lamplit Table (approved by Cory, 2026-10-14)

Source of truth for the look: `vision.md` and `shots/f1-place.png`, `f2-buy.png`, `f3-round-end.png`, `f4-phone.png` (HTML sources beside them: reuse their CSS, px.js, board.js freely).
Cory's adjustments win over the frames:
1. **Actions readable without hover.** Every space shows its icon plus a short effect in words/pips ("+3 ●", "steal 2", "copy ↺", "−4 cost"), legible at 1270×700 and on phone. Hover adds the full text and "you get".
2. **Members are distinct pixel characters** (not one hooded silhouette), tinted in their sphere's color, so players learn them over time.
3. **The cult is visible.** Each player's members stand as their figures (sphere-tinted), plus a compact mark for followers that grows with them (e.g. small figures/dots in clusters of 5 and 10), without taking much space. Your own cult on your table; rivals' as a mini crowd on their seat (hover for detail).
4. **The wheel still spins**, but nothing else on screen changes with its orientation. No "facing quadrant" panel: the quadrant rule list is gone; the board is the rules (rim plaque per quadrant, hover for standings).
5. Yes to: pay by dropping coins into cost slots; the hierarchy rule (≤ 7 groups always on screen, the rest one hover/long-press away); round end as the Reckoning; a seat rail with sigils; the walnut/cream palette and Alegreya type; a single menu glyph for How to play / Leave / log.

## Regions (laptop 1270×700; phone in brackets)
- **Prompt** (top left): one question, italic emphasis ("Your turn — *place a worker*"). Undo lives inline here.
- **Seat rail** (top right) [phone: top strip]: seats in this round's snake order, sigil figure, followers, workers left, the current turn lit; a mini crowd per seat. Hover a seat → that rival's resources, members, last 3 moves.
- **Wheel** (left, hero ~45% width) [phone: full width]: spinning paper wheel; spaces = icon + short effect; worker figures on taken spaces (sigil shapes, not colors); fresh moves wear a dashed ring; rim plaque per quadrant with its rule glyph and the leader's sigil; hover/long-press a space → card with full text, YOU GET (engine dry-run), contest effect, UNLOCKS (shop cards you could then afford), Place here.
- **Shop** (right, 5×2 cream cards) [phone: swipe row]: pixel figure, name, timing tag, cost as pips, worth; unaffordable dim; while placing, a "✓ after Rush" tick; hover → full text, pay breakdown, what's left, contest warnings. Followers: one quiet rate line (2→1 4→3 8→6 10→10 with stock), not four boxes.
- **Your table** (bottom right) [phone: bottom dock]: resource stacks (one shape per color), workers left as figures, your cult (member figures + follower mark), drag/tap to place.
- **Pay**: pick a card → suggested coins lift off your stacks into its cost slots; tap a coin to swap; Recruit. One tap when there's only one way.
- **Round end — the Reckoning**: quadrants pay one at a time; a line flies to each leader; the panel lists all four with engine counts.
- **Log** → a drawer (the chronicle), card names link to cards.
- **Gone**: quadrant rule-list panel, "facing you" text and spin arrows on desktop (spin by drag/keys still works), "Since your turn" line, ROUND I/II/III labels on spaces, "you can afford" text, boxed follower buttons + Pass box (Pass becomes a quiet link), header buttons, "no members yet / 0 members / no workers" text, player color dots.

## Split
- **UI-A**: theme tokens (walnut, cream, inks, Alegreya via Google Fonts in index.html), layout shell and fixed regions, the wheel (readable spaces, figures, plaques, spin kept), prompt + inline Undo, pay-with-coins, the Reckoning, phone layout.
- **UI-B**: shop cards, your table and the cult crowd, seat rail with mini crowds, every hover card (space you-get, card, contest standings, rival, keyword), the log drawer, glossary. Pixel icons: `design/prototypes/pixel-art/icons*.js` → `src/v4/art/` + a `<Sprite id sphere size>` component (24×24 data, crisp SVG); use the calibration icons now, the full set as it lands.
- **Both**: keep every existing e2e semantic gate green (update selectors, never weaken assertions); add gates for: actions readable without hover (each open space shows non-empty effect text ≥ 11px), no region moves between place and buy phases, hover/long-press exists on every game-meaningful element, nothing changes with wheel orientation except the wheel.
- **Verify**: screenshots of your build next to the matching vision frame; the foreman compares on a frozen commit before anything ships.
