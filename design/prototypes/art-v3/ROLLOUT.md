# Rollout brief: every member in the v3 style (batch artists read this first)

You are a pixel artist drawing member portraits for Cults, a cozy-sinister board game about leading a cult; members
are quirky townsfolk. The designer said the old set "looks pretty bad"; a very picky art director will review your
batch. The bar is professional indie pixel portraiture (Papers Please, Citizen Sleeper, Eastward). The reference
portrait is thieves.kingpin in samples.json (src/kingpin.py): match its finish, head size and construction.

Read, in this folder: STYLE-BRIEF.md, ROLLOUT-NOTES.md, critique/round1.md, critique/round2.md, FORMAT.md, template.py,
audit.md, palette.py (keys and ramps), draw.py (toolkit), and src/kingpin.py + src/doorman.py as worked examples.
Render samples.json with `python3 render.py sheet samples.json /tmp/x.png` and look at it before you start.

Your batch: in-<b>.json (id, name, card text, members = how many people the picture must show, sphere).
- One script per portrait in src-<b>/<key>.py defining PORTRAIT = {id, name, kind:'member', sphere, people, accent, px}.
- `python3 build_batch.py <b>` writes out/<b>.json and _renders/<b>/sheet.png (+ 8x zooms); it fails over 22 colors.
- Write audit-<b>.md: the tone-to-role table (id, role, each person's tone, front/back, expression) for your batch.

Rules that are locked:
- 48x48, light from the top-left, no doorway (transparent), sel-out outline by the renderer, palette.py ramps only.
  Do NOT edit palette.py, draw.py, render.py, template.py or anything outside your own files; if you need a color
  that doesn't exist, use the nearest one and say so in your report.
- Head standard from template.py; faces by hand with the face recipe; about one in three in true 3/4; vary head shape,
  age, build, hair and expression (audit.md's allowed list). No toothy grins, no tooth bars, no half-lid smirks, no winks.
- Count rule: exactly `members` people. Multi-person depth rule from template.py (back people lower, darker, sel-out edge).
- One story prop per card, readable at 48px, clusters of 3+ px. The name and card text decide who they are.
- Skin tones: picked per person, varied across your batch (use the whole SKINS list), groups mix tones.
- Sensitivity (hard rule): no tone or ethnicity reads as the joke, the threat or a service trope; shady roles span
  tones in proportion; the darkest person in a group is never the one behind/in shadow/least friendly; no caricature
  features; no cultural costume as a gag. But keep charm: solve it by who is cast where, never by stripping character.
- The color of the sphere must dominate the clothes so a seat reads by color at a glance.

Loop: draw, build, Read the sheet and the 8x zooms, critique each honestly against Kingpin, fix. At least three rounds.
Write files early and often (the machine can restart). No git commands.
Final answer: one line per portrait (id: who you drew), the ones you're least happy with, any color you needed.
