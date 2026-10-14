# In flight — catalogue at handoff (2026-10-14, ~17:00 UTC)

Resumed 2026-10-14 ~17:10 UTC in a new session: items 1–5 relaunched as fresh agents from these briefs, each told to read git log and continue. Agents never commit; the foreman checkpoints. Each agent runs check:v4 on its own V4_OUTDIR/V4_PORT (a1 5281, ui 5282, a3 5283, a4 5284, a5 5285). Baseline at resume: one failing UI test (GameScreen.test.jsx handoff dialog), build green.

Five agents were running in the old session. They don't carry over, but their work lands in git through frequent WIP checkpoints. A new session should check `git log` and the files below, then restart whatever isn't finished.

1. **Cost change + top tier + tuning.**
   - On disk already: member costs ×2 in content/*.js; TIERS in core.js are 2→1, 4→3, 8→6 (limited 2/player, the clock) and 10→10 (4 colors, limited 4).
   - Remaining:
     - Tune so the pure "big followers" strategy wins ~25% (15–30% band) with ~6–7 members per player, and a good engine (thinking bot) beats it.
     - Measure the pricier set 3→1, 5→3, 8→6 (as a comparison only).
     - Decide whether the 8→6 or the 10-tier is the clock.
     - Write design/eval/top-tier.md.
     - Rulebook text for the new rates.
     - check:v4 green.
   - Tools: scripts/v4-big-followers.mjs (pure buyer vs 3 bots, Release on/off), scripts/v4-member-value.mjs.
2. **UI agent.** Owns src/v4, e2e, and the content/index.js registration.
   - Table picker: register all spheres; setup "Table" option (default, random 4, custom); `?table=gold,red,thieves,echo`; online passes the table; colors for every resource; e2e/v4/tables.mjs smoke.
   - PRIORITY bug: a reload near game end erased a hot-seat game (only patrons.v4.roundStart left). Never clear the save before results render, keep a round-start fallback, add a reload-at-every-step session test.
   - Bug: the prompt pill stays stuck on "Placement undone — place again". Clear it on the next state change and gate it in e2e.
   - Panel 7 fixes:
     - Laptop V: the choice panel overlaps the buy row; the recruit flight reflows its text; the digit roller shows "-10"; shop text is unreadable while placing; bots too fast on desktop; dropped steal clicks; "×2" wording; 900px clipping; 6-step type scale; ring labels I/II/III.
     - Phone W: own moves snap (gate e may be checking the wrong thing); the end-notice is offscreen; landscape popover; round III modal; chips clip; labels collide with discs; setup undo; "+2 recruited"; ★ on chips; fling steps; dead band on cards; "Hustler (Gold)"; worker label; tray hint.
     - Saboteur X: the Take panel draws over the shop; count-ups need ≥3 intermediate values (gate at 1270×700 and phone); fold hot-seat handoff into the next modal; verb by pointer type; results headline wording; "take all"; reserve the Undo slot; focus after handoff.
   - Report when check:v4 passes. Claude commits after verifying on a frozen build.
3. **Cross-sphere integration.**
   - New: src/test/engine/v4/fuzz-tables.test.js plus fuzz-tables-runner.js (random 4-sphere tables from all 11 quadrants, invariants, determinism).
   - Targeted interaction tests for risky pairs: Echo×steal/extra turn/sale, Linger, Doppelganger, Silver gifts×Guest×JV, Midas/Underdog on copies, Blue recruits×Recruiting Drive, Heist/Double Agent×once-per-game state, White selling, Hideout×Steal/Ransom.
   - Fix real bugs minimally; list unclear rules for Cory, one line each, with a recommendation.
4. **Smarter bots** (bots.js, thinker.js; scripts/v4-bot-levels.mjs).
   - Fix hoarding (ended a game holding 50 gold) and recruiting everything.
   - Easy/Normal/Hard levels via player.bot.
   - Measure Normal vs Easy, Hard vs Normal, members/player, leftover resources, and the pure buyer vs Normal.
   - Then expose the levels in the setup UI.
5. **Rule-bending members** (content/benders.js; design/rule-benders.md; commit 2f14216 priced them from the member-value sim).
   - Remaining:
     - Straggler (after the round's last placement, move one of your workers to an unused space and take that action).
     - Rename Purple's old Straggler.
     - Release as a base rule on trial (flag, on by default).
     - Interaction tests.
     - The big-followers rate with and without Release.
     - Report one line per member to Cory.
6. **Next, in order:**
   - Apply each draft sphere's critic defaults (design/spheres/*.md).
   - Freeze a build.
   - Screenshot it yourself.
   - Blind panel of 3 on MIXED tables (Magenta, Purple, Echo, Silver, White, Blue, Yellow), with the "felt unfair or unfun" section.
   - Fix.
   - Send Cory a link where he can pick any 4 spheres.
