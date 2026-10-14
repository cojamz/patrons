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

## Making it clear what's happening (Cory, 2026-10-14)
- **Round end, animated (the Reckoning):** quadrants resolve one at a time (~1.2s each, skippable with a tap): the lamp moves to that quadrant's rim plaque; each player's count ticks up beside their sigil (numbers from the engine's contestTable); the winner's sigil and mini crowd pulse; "+N" followers fly in an arc from the plaque to the winner's seat, whose follower mark grows; ties fly to every tied leader; "no one scores" fades the plaque. Then the summary panel (f3) with Continue. Gate: motion e2e sees ≥3 count-up frames and a flight per winner.
- **Every turn told in one place** (UX solver spec (a), design/eval/cory-notes-2026-10-14.md §5): a rival's turn builds line by line on one turn card near the rail (placed → gained → bought), with the affected stacks and figures pulsing where they live, then folds into that seat's "last move" icon. Your own move animates the same way (no snapping). Steals and gifts draw a short arc between the two seats.

## Intro and follower symbol (Cory, 2026-10-14)
- **Intro:** on a player's first game start (and from the menu later), a ~20s skippable pixel animation of the gist: you lead a cult → place a worker on the wheel → gain resources → recruit members (they join your crowd) → buy followers (the crowd grows) → each round the quadrant leaders win followers → most followers after round III wins. Per player: shown locally, never blocks other seats online; Skip always visible; respects reduced-motion (a still storyboard instead).
- **Follower symbol:** a small pixel follower figure (not ★) used everywhere a follower count or "worth N" appears; distinct from member figures and from resource pips.

## Minions and cult leaders (Cory, 2026-10-14)
- Workers are **minions**. Each player picks one of ~20 pixel emojis (Santa, unicorn, surfer, bug…) when joining (unique per table; bots get a random free one). All their minions are that emoji as a small pixel creature, placed on wheel spaces.
- Each player's **cult leader** is a robed pixel figure with their emoji on the robe: the player's identity on the seat rail, their table and the Reckoning. This replaces seat sigils/colours as identity (keep a muted seat colour as an accent).
- Size order everywhere: leader > members > minions > followers.
- Say "minion(s)" everywhere a player reads "worker(s)": rulebook, screen, card texts, log, intro.

