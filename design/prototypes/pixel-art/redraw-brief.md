# Members redraw (2026-10-15)

Cory: "it will also require better visual distinction between the pixel members … why stop there? let's get this upgraded!!!"
Today every member of a sphere is the same person (same head, same hair, same shoulders, same robe), told apart only by a
small prop. Players must be able to tell members apart at a glance in a chair (24px) and on the stage (48px), and see
which members are core to a rival's engine.

## What to make
Redraw every member of your sphere (ids `<quadrant>.<key>`) so that no two share a silhouette, and each reads as a
distinct person whose look hints at what the card does.
- Vary the **build**: slim, broad, stout, hunched, tall with a long neck, small and wiry, elderly and stooped.
- Vary the **outfit**: hooded robe, high collar, vest over shirt, apron, cloak with clasp, scarf, sash, tunic, uniform,
  shawl, fur trim. Clothes stay mostly the sphere colour (keys 1/2/3, about a third or more of filled pixels).
- Vary the **head**: bald, bun, long hair, braids, curls, beard, moustache, hats of many shapes (top hat, beret, cap,
  hood, turban, crown, bandana, wide brim), glasses, eyepatch.
- Keep **one prop** that says the card's job, sticking out of the silhouette (usually right).
- A rank ladder (the stand-in "Worth N followers" members: Recruit, Hand, Helper, Regular, Devotee, Elder, Pillar,
  Patron) stays a ladder in grandeur, but each rung is now a different person.

## Palette keys (24×24, one char per pixel)
`.` empty · `k` ink (inner lines only) · `d` dark · `m` mid · `l` light (paper, glints, sparkles, NOT skin)
`1` `2` `3` the sphere's shade / base / highlight
`s` **skin** · `h` **hair, beard or hat** · `a` **accent cloth** (one collar, scarf, sash, apron or trim)
Each member's s, h and a colours are picked per member by the game (several skin tones, eight hair colours, eight cloth
accents), so draw with the keys and never pick colours. Use `s` for all skin and `h` for all hair, so the variety lands.
Eyes are 1px `k` on `s`. Never draw the outer outline (the renderer adds it); leave row 0, row 23, col 0, col 23 empty.
Head and shoulders, shoulders cut off by the bottom edge. Full rules: design/prototypes/pixel-art/style.md (read it;
where it says "nothing else brings in a second hue", s/h/a are the exception).

## Files
- Read the current drawings for your sphere in `src/v4/art/icons/batch-*.js` (`sphere` field) and the card texts in
  `src/engine/v4/content/<quadrant>.js` (and `standins.js` for the ladder).
- Write ONLY `design/prototypes/pixel-art/redraw-<sphere>.js`:
  ```js
  globalThis.CultRedraw = globalThis.CultRedraw || {};
  globalThis.CultRedraw['<sphere>'] = [ { id: 'gold.banker', name: 'Banker', px: [ /* 24 strings of 24 */ ] }, ... ];
  ```
- Check: `node design/prototypes/pixel-art/lineup.mjs <sphere> /tmp/lineup-<sphere>.png`, then LOOK at the png (Read it).
  Today's row is on top, yours below, each at 48px and 24px. Iterate at least three passes: anything two members share
  (silhouette, hat, hair shape) or anything you couldn't name at 24px gets redrawn. The lineup script prints any
  drawing that fails validation (wrong size, unknown key, touches the border); fix those until it prints none.
  Don't run scripts/v4-art-import.mjs (the lead imports all spheres at once).
- Never edit any other file, never commit, never run git commands that change anything.
