# Redraw every member as a little scene (Oct 29)

Cory picked style F, the "diorama, closer" look, and wants everything live for a playtest today. Each artist draws one batch.

## Read first
- STYLE.md: the rules. Every portrait follows them.
- samples_art.py: the four reference scenes (Kingpin, Mob, Tiebreaker, Launderers). Match their look and quality.
- kit.py: the shared kit. Don't edit it. If you need more helpers, put them in b<N>/_kit2.py; files starting with _ aren't built.
- ../art-v3/critique/lessons-from-batches.md: casting and sensitivity lessons.

## Your batch: batch-<N>.json
Each entry has the member's id, name, sphere (its card colour), n and text (the card's rule).
- Draw each member in its own file, b<N>/<short>.py, defining `PORTRAIT = ('<id>', fn)`, where fn() returns (64 rows of 64 chars, palette dict).
- Members already done are in b<N>/ as files that import samples_art. Leave them alone.

## Each portrait
- **A little scene that says the role at a glance.** The person, a prop in hand and a place (room, street, stage, shop, field) that names what they are: a Banker at a counter with coins, a Busker on a street corner with a guitar case. Pick the most obvious picture of the name. The card text can add a detail.
- **The sphere colour features in the clothes,** so a row of one colour reads as a set. Colourless is grey. The colours are red, green, magenta, purple, blue, white, gold, silver and yellow.
- **People:**
  - If n > 1, show exactly n people. Triplets shows three alike siblings.
  - If n is 1, show one person. A plural name (Crew, Chefs, Con Men, Revelers, Fan Club…) can show 2-3, kept small.
- **Skin:** keep each member's skin tone from oldPeople, in order, so the set keeps its range: pale, light, olive, warmtan/tan, brown, deep or verydeep. Use kit's PALE, LIGHT, OLIVE, MED, DEEP and VDEEP.
- **Distinct:** no two portraits in your batch share a pose and setting.
- **Extra Hand (if yours):** Cory said the old picture "looks real fucking weird". Draw something plain and clear, such as a farmhand or temp worker arriving with a toolbox, with no extra or odd hands.

## Build and check
Run `python3 build.py <N>` from this folder. It writes out/batch-<N>.json and _renders/b<N>/ (sheet.png, plus <id>-4x.png for each portrait), and warns about anything over 24 colours.
- Look at each portrait at 96px and 32px.
- Fix whatever reads wrong: a mystery mark, boxy hands, ink seams, banding, busy backgrounds.
- Do at least 2 passes per portrait.

## Time
About 75 minutes for the batch. Finish all of them before polishing any one.

## Don't
- Don't commit.
- Don't touch other batches.
- Use only your own scratch subfolder: /tmp/claude-0/-home-user-patrons/65f83dbc-0ddd-5601-aa89-c8636143d2f8/scratchpad/b<N>/.

## Report
Send a list of any portrait you're unsure about, and why.
