# Design pod log: art director

Each pass captures the key states at 1270×700 (scripts/design-pod/capture.mjs, live dev server :5410) and judges them against design/taste.md: the ten rules and the slop list. Format: time · state · finding · fix (or where it went).

## 05:00–06:00 · Layout (Cory: "too much prime real estate was given to the log")
The full reasoning and every variant's shots are in layout.md. The result is three full-height columns: seats and their story, the wheel, the shop. It's the default from 1200px wide.

## 06:10 · Pass 1 (shots/0610/, then 0630/)
- **place** · The three columns' first edges don't line up: the first seat's top is at y=8, the follower tiles at y=28 (under their label) and the prompt between them. That's a near miss (rule 5). → *Pending:* drop the seat column 20px so the seats and tiles start on one line.
- **buy** · The question wraps beside Release… and Pass, and its first line touches the screen's top edge (y≈2): text touching an edge is slop. → **Fixed:** the prompt row is now 72px from 1200px up. The wheel is limited by its width there, so the taller row costs it nothing (layout.css).
- **buy** · The lit follower tiles looked cut off at the column's foot. The column clipped their glow and shadow, because the tiles sat flush with its edges (R3 caught this). → **Fixed:** the follower buys lead the column, and the member grid takes the rest and shrinks on short screens. The column no longer clips. Seen at 700 and 620 tall.
- **place/buy** · Long one-word names overflow the card: Doppelganger is 99px and Benchwarmer 97px, but the box at 11px tracked caps holds 80px (the layout gate failed). The old 92px strip cards break the same way. → **Fixed:** a long word gets a soft hyphen at its natural seam (Doppel-ganger, Bench-warmer, Impres-sionist, Toast-master). `src/v4/game/hyphen.js`, the name in ShopCards.jsx, and `hyphens:manual` on `.nm`.
- **round III** · The since-strip dropped its sixth line while 112px under it sat empty, kept for a turn card that wasn't showing. → **Fixed:** that space is held only while a turn card is up (`:has(> .turn-card)`). The oldest lines give way first.
- **round III** · The since rows ended in an ellipsis that cut a member's name ("recruited Stunt Dou…", from the detail designer). → **Fixed:** a long row wraps once, with its second line hanging under the name (since.css).
- **results** · Every score appears three times: in the table, as the seat's own total, and as a big number beside the seat (RC1 #107, from the detail designer). → **Fixed:** the cards under the table drop the rank and the big number (lamp.css). The table gives the place and total, and each card shows what that cult built.
- **reckon** · The scoring's count badges ("1" in a circle) hang off each seat panel's right edge into the gutter, so they read as stray badges. The banner covers the lower third of the wheel. → *Queued (Reckoning.jsx is the layout agent's):* seat the count inside the panel, beside the total it will climb into.
- **pick** (Help Yourself) · Clear: the rivals' lit stacks are the only glow, and the prompt says what to click. No change.
- **summary** · A centered modal with good hierarchy. No change from me (the detail designer has its words).
- **home** · The capture fired before the page drew (a blank shot). → Capture fixed: it waits for the home screen.
- **1100px laptops** (old grid) · The member strip turns into 5 columns and the second row is clipped, so only 5 of 10 members show. → *Pending* (lamp-b.css's 1100px rule).
- **Harness** · The live layout.css was served empty for a while: vite read it mid-write and cached it, and the "old layout" came back on the live server. → I touched the file to re-serve it. Lesson: write CSS in place (Edit), never truncate and rewrite under a dev server.
