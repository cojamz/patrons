# Portrait sweep (Cory, 2026-10-29: "members that are 2+ need to reflect that in their images" and "a full image sweep and improvement")

Read BRIEF.md first; everything there still holds (anatomy, keys, the loop, the Launderer as the bar). This adds:

## The count rule
A member's picture shows exactly as many people as the card counts as members (`members` in your in-sweep JSON; a card
worth N followers counts as N members). One person for 1, two for 2, three for 3, a packed crowd of five faces for 5.
- 2: two heads side by side, both full faces with eyes, like Twins or Mentor & Protégé. 3: three heads, the middle one
  a row or two higher or lower (Panel, Retinue). 5: overlap them (Mob).
- A singular name worth 2+ (Proselytizer, Night Owl, Shopaholic, Trendsetter, Broker...) is the named person in front
  with their companions beside or just behind (a convert, a twin owl, a shopping buddy, two copycats in the same look).
  The named person should still read first. The card text tells you who the companions are.
- A plural name worth 1 (Raiders, Timekeepers) shows one person now.
- Count the faces at 32px (seat size): a stranger must count them right.

## The improvement pass
For every portrait in your batch: does a stranger read the name from the 32px picture? Does it match the card text
today (many cards were renamed; some art was borrowed from cut cards)? Is it as finished as the Launderer? Redraw the
ones that fail. Keep the ones that pass exactly as they are (copy their px through unchanged). Missing px = draw new.

## Your output
- `portraits/out-z-<batch>.json`: EVERY member of your in-sweep-<batch>.json (kept or redrawn), with id, name, kind,
  sphere, px. Scripts in `portraits/src/sweep-<batch>/`. Scratch images in /tmp/sweep-<batch>/.
- `python3 kit.py check portraits/out-z-<batch>.json` prints ok. Render your sheet and Read it at least three times
  while iterating; Read 4x close-ups of every multi-person portrait.
- Final answer: one line per portrait you changed (id: what you drew and why), and the ids you kept unchanged.

## Raised bar (Cory, 2026-10-29 12:10am: "as much of an image upgrade as we can, iterate all you want until they all look super high quality")
Redraw every portrait in your batch, not only the failing ones: more detail, richer shading (use all four ramp steps
and the skin/hair shades), crisper expressions, distinct silhouettes, small story props that explain the card. Keep the
anatomy and keys so a seat still reads as one family. Iterate as many rounds as it takes: render, Read, critique each
one honestly against the Launderer, fix, repeat. Time is not the constraint; quality is.
