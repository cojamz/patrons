# Why the critics missed Cory's ten minutes (2026-10-15)

Evidence: the three RC1 panel transcripts (newcomer ab1bc2f1, strategist a85e36bf, saboteur ad23243f in the session's tasks/ folder), their scripts in /tmp/panel-*/, the reports (panel-rc1-*.md, ui-critic-round2.md, meta-round2.md) and the answer key (answer-key.md, 24 items).

**Baseline recall of the old instrument:** the RC1 panel plus ui-critic round 2 together hit about 2 of 24 items (8%): the tokens covering the rim (ui-critic round 2, #4), half of round-end legibility (the newcomer "never saw the Reckoning" in round I) and half of Blue (the strategist had to guess what "badged" meant). Several misses were worse than silence: the critics praised or asked for the very things Cory cut.

## The hypotheses, checked

**(a) They drove the page through the DOM: held.**
- Every tester ran a server that evals arbitrary page code (/tmp/panel-newcomer/server.mjs, /tmp/panel-strategist/server.cjs, /tmp/panel-saboteur/lib.mjs with `text(page) = document.body.innerText`).
- Saboteur: 108 of 124 commands read `innerText`, 78 used locators/getByText, 27 read aria-labels, only 18 clicked a coordinate.
- Newcomer: 33 of 89 commands clicked by locator. It bought followers five times with `getByRole("button", {name: /10\s*→\s*10/})`, so it never had to find the follower shop by eye (answer #12). It waited for its turn by polling `body.innerText` for "Your turn".
- Strategist: dumped every button, role and label on the setup screen through `querySelectorAll`; read tooltip text with `innerText` (ht.sh) instead of looking at where the tooltip opened (answer #3); read rim standings from `.rim-hit` aria-labels.
- The brief said "play by sight" but handed them full Playwright, and "selectors only for reading back state" became the main channel.

**(b) They act at agent speed, so slowness is never felt: held.**
- Median 11–13 s between actions for all three testers (the model thinking), and every action was followed by a fixed `waitForTimeout(1200–2500)` before the screenshot. Every animation had finished before they looked; no tester ever took a burst.
- The strategist set bot speed to **Fast** (and the saboteur toggled it).
- The words "slow", "snappy" or "sluggish" appear zero times across all four reports. Snappiness was Cory's headline (#1, #2) and the round-end Reckoning "way too fast" (#17) was invisible to anyone who screenshots 1.5 s later.

**(c) "Top 8 + a grade" rewards triage and leniency: held.**
- The RC1 briefs capped the report at 900 words and "Top 8 issues"; ui-critic caps at 12 and grades from A down ("each section starts at A").
- With 8 slots, testers spent them on logic bugs they could prove (turn card netting, Midas pill, Snap Up pricing) and dropped everything that was "just" ugly. The newcomer graded "Knowing what to do each turn: B+", praising "the 'need N' badges and the payment picker" that Cory called shouting and unintuitive.

**(d) They judge "does it work and add up", not "would a picky designer ship this": held, and it is the biggest one.**
- 17 of the RC1 panel's 20 triaged items are correctness or explanation bugs; the other 3 are panels covering things. None is about hierarchy, density, sorting, symbol count, art or layout economy (answers #5–9, #13–16, #20–23).
- The rubric itself pushed the other way: ui-critic's "one glance or one tap" and "every number explains itself" reward adding text. Round 2's fixes followed it: the docked "one fixed inspector slot" (ui-critic round 2, issue #8) is exactly Cory's #3; the ranked score row (meta round 2, #7) is Cory's #13; "need N" with colors and the "YOU PAY / LEAVES" lines (praised in Q5) are Cory's #7 and #8. The critics didn't just miss the fruit; they planted some of it.

**(e) Coverage: new.** The newcomer and strategist played the Classic table, which has no stealing quadrant, so nobody ever saw the steal selector (#10) or Redistribute's text (#18). Hover sweeps were rare and aimed (17 hovers in the newcomer's whole game, most by name), so dead hovers (#19) and the useless deck hover (#16) never came up.

## What the new instrument changes
- `scripts/v4-eyes.mjs`: screenshots, coordinates and timings only. No DOM, no text, no selectors, no JavaScript. Every action prints ms to first change and to settle, and where on screen it changed (a popover opening 800 px from the pointer shows up as a number). `frames` shows the motion after an action or while you were away.
- `checklist.md`: Nielsen plus a board-game screen list that asks taste questions (hierarchy, duplication, symbol count, prominence of primary actions, order, direct manipulation, dead space, overlaps, art, response time, round-end legibility).
- `brief.md`: walk every screen state (setup, each turn step, a steal on a table that has one, pay, round end at normal speed, results), hover-sweep every element three times, list everything (at least 40), no grade until the list is done, grade from D up.
