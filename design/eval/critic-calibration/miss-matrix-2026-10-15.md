# Miss matrix: why the panel and the design pod missed Cory's morning notes (2026-10-15)

Inputs: answer-key.md (items 1–46), the wave 3 and wave 4 reports (wave3/tester-a|b report.md + sweep.md, wave4/tester-a|b report.md, game-skeptic-w4.md, boardgame-enthusiast-w3*.md, overnight-wave2/3.md), the design pod files (design-pod/log.md, details.md, layout.md, queue.md), brief.md, checklist.md, .claude/agents/*.md, scripts/v4-eyes.mjs, design/taste.md (HEAD and as of 8ea3e24), and git history on origin/claude/gifted-newton-3lcy3i.

## 1. Which build Cory played

The strings came from `src/v4/game/panelText.js`:
- **"Ransom a member"** (Shake Down's verb) was there from 011b9ac (04:50) to 7b1e0db (09:38). f8c64cd (09:51) changed it.
- **"2 extra turns / for 8 purple"** (Overtime) was there from 011b9ac (04:50) to de47ade (09:09). 16603a2 (09:21) changed it to "Pay 8 purple / for 2 extra turns".
- **The rail's "in 4 ×2"** narrows it further. The answer key and decisions.md quote it verbatim. The ×2 chip (`CultSeat.jsx` `co-x"> ×2`) was there up to b01aa15 (06:30); 76d3efa (06:35) made it "twice". The Relaxed speed exists from 3686a71 (05:00).

**Likely build: 3686a71..b01aa15 (05:00–06:30 UTC).** Going by the two strings alone, the range is 011b9ac..de47ade (04:50–09:09).
- **wave2 8f93858 (05:48)** falls inside that window. Cory most likely saw a build within about 40 minutes of w2.
- **wave3 44e22bd (08:14)** is inside the strings' window but after "×2" was gone. It had "twice", smaller rim leaders and the same Overtime and Ransom text. (In-flight.md and overnight-wave3.md name 44e22bd as w3. The 08:21 commit 84182af is only the launch checkpoint.)
- **wave4 8ea3e24 (11:13)** comes after both strings changed.

So w2 brackets Cory's build from below and w3 from above, with w2 the closer one. Some notes describe forms that later changed: item 40's "×2", and item 41's leaders drawn at 1.7× the band (shrunk at about 07:10 and enlarged again at 10:25; see item 41). Every item 38–46 still exists in some form on both w3 and w4 (checked in code where noted).

## 2. The matrix

On w3/w4: ✓ present, ✗ absent or fixed, ~ changed form, ? unknown. "(code)" means checked in source; otherwise judged from the reports.

Found by: a3/b3 are the wave-3 testers, a4/b4 the wave-4 testers, sk = game-skeptic w4, en = boardgame-enthusiast w3, pod = design pod. ½ means a neighbouring problem on the same element.

### Part 3: items 38–46 (this morning)

| # | Item | w3 | w4 | Found by | Cause of the miss |
|---|---|---|---|---|---|
| 38 | Pass hard to find | ✓ (header pill) | ✓ | ½ a3 E1/E5 "Pass is the faintest thing on screen", a3 #42 (Pass and Undo look alike); ½ a4 E5 "a bit hidden"; b3, b4 and sk said "fine" | Buried in an audit and judged fine. The pod fixed the neighbour: Undo became a dotted word and Pass got a firmer pill (log 125), and it marked "Pass never moves" as done (details 95). No check asks how far Pass sits from where the buy is decided. |
| 39 | Gift's two-step pick in the seat corner | ✓ (code: comboStep) | ✓ | 1 for w3: a3 E1 "gift, steal, swap: the wheel still dominates; lit seats are thin outlines", a3 #14 (Hustler's own-color pick has no cue), b3 #22. ½ for w4: a4 E1 "the eye goes to the wheel first", b4 E1. en took Good Deed (G2 R3) and said nothing. | Found, but the fix kept the choice where it was: the pod made the chairs glow (log 102) and dimmed the shop (details 45), and called the two-step pick "fine" (details 48). taste.md at test time demanded it: "picked on the board (… the seat …). Pairs take two clicks." Good Deed itself came up only in en's game-design brief. |
| 40 | Turn-order rail confusing | ✓ ("twice") | ✓ ("again") | 1 for w3: a3 #11, #31, #32; b3 #42. 1 for w4: b4 #16, sk #37 ("took it for a scrollbar"). a4 called it clear. | Found every wave but graded polish. The pod relabelled it three times (×2, then twice, then again; log 25, details 119, 175) and never asked whether the rail should go. taste.md said "the snake visible". |
| 41 | Wheel emojis too big and out of line | ~ (leaders ~14 px; minions on the words) | ✓ (leaders 24 px; code dce4667) | ½ for w3: a3 #43 and b3 #30 (minions cover the words). a3 #27 asked for **bigger** leaders. 0 for w4: b4 "rim leader emojis told me who led at a glance", a4 "emoji minions clear". | A tester's taste call against Cory's was applied as a fix: the pod enlarged leaders to 24 px from a3 #27 (log 132), after shrinking them at 07:10 (log 48). Minions over the words were fixed only on panels of two or more lines. |
| 42 | Catch Up never pays | ✓ (code: counts your own minion) | ✓ (code) | 0. b3 decoded its panel (sweep, round II) but never took it. No w4 table had purple. | Never reached. No step compares a space's text with what actually landed in the seat and the log. Purple came up in 1 of 6 tables across the w3 and w4 runs. |
| 43 | Purple spaces charge you to use them | ✓ (Overtime, Crunch Time) | ✓ | 0. b3 #17 and #18 decoded the wording only, and the pod reworded Overtime (details 114). | The principle wasn't stated yet: taste.md got "No board action charges you" at 14:52, after the runs. The nearest older rule (decisions.md:59, rubric L3) covers round I only. Mechanics are outside the testers' and the pod's remit ("Cory's to decide"). Not reached on w4. |
| 44 | Hovers laggy (open, then fill in "You'd get") | ✓ (code: "computed just after it shows", a "You'd get: …" placeholder) | ✓ (code; still on 0c1cd51) | 0 for w3: both testers discarded latency because the box was loaded. 1 for w4: a4 #7, b4 #1, sk #1 (150–520 ms to first change, settle 530–960 ms), all put down to a fade-in or a busy thread. | The lag was measured but the fill-in never seen: the committed v4-eyes reported first change and whole-screen settle, not "complete" for the hovered region. No tester looked at the frames of a hover. The perf pod's "hover p95 ~0.1 s" timed the card appearing, not finishing. |
| 45 | Too fast even on Relaxed, and not smooth | ✓ (code: Relaxed = 1.55× Steady) | ✓ (code) | 0 for w3: a3 "comfortable at Relaxed", en "Steady ~1.7 s felt right". ½ for w4: a4 #29, #54, #65 (the Reckoning is too fast at Steady). | Every brief says "leave every speed setting at its default", so nobody compared speeds, and only a3 even tried Relaxed. Testers watch contact sheets, not live motion, and the tool had no stutter measure. taste.md set no bar for Relaxed. |
| 46 | "Still clunky" (taste) | ✓ | ✓ | ½: graded C+, C+ and B− in w3 and C+, C+ and B− (NOT YET) in w4 | The grade agreed. The loop treated C+ as progress and fixed lists instead of the whole. The A− bar came this morning. |

**Recall on 38–46:**
- **w3 panel (a3 + b3 + en): 3.5 of 9 (39%).**
- **w4 panel (a4 + b4 + sk): 4 of 9 (44%).** Over the 7 items its tables could reach (no purple, so 42 and 43 couldn't come up): 57%.
- Only 40 and 44 were really caught, and 44 only for its lag, not its cause. Compare 82% on the calibration key.

### Parts 1–2: items 1–37 (are they still there, and did the panels catch them?)

| # | Short | w3 | w4 | Found by (w3 / w4) | Note or cause of miss |
|---|---|---|---|---|---|
| 1 | Not snappy | ✓ | ✓ | en (150–350 ms clicks) / a4, b4, sk with ms | w3 testers discarded ms (loaded box) |
| 2 | Wheel spin slow | ✓ | ✓ | a3 #45, b3 #55 / a4 #14, b4 #34, sk #19 | caught |
| 3 | Hovers docked | ~ (seats) | ~ (errors) | a3 #8 (seat hovers 136–488 px away) / b4 #8 (refusal notes at the screen edge) | mostly fixed |
| 4 | Setup pick has no call to action | ✓ (bottom-left) | ✗ (moved to the centre) | a3 #41, b3 #5 / b4 praised it | fixed after w3 |
| 5 | Effect doesn't read first | ~ (moved to the hover by Cory's call) | ~ | a3 E2, b3 #28 / a4 E2, b4 #39 | reshaped |
| 6 | Color names beside costs | ✓ ("colorless") | ~ | a3 #23 / a4 #27, b4 #26 | caught |
| 7 | "Need N" shouts | ? | ? | none | likely removed; unverified |
| 8 | Hover clutter lines | ✓ ("Pays 6●") | ✓ | b3 #27, a3 #24 / a4 #23, #37 | caught. The pod later found "Pays 6●" was its own regression (details 134). |
| 9 | Too many symbols | ✓ | ✓ | a3 census 17, b3 16 / sk #43, b4 9 | caught |
| 10 | Steal picked from a list | ✗ | ✗ | (praised) | fixed |
| 11 | Pay dialog | ✓ | ✓ | a3 #7, b3 #25, #26 / a4 #39, #40, sk #24 | caught |
| 12 | Follower shop hidden | ✗ | ✗ | (prominence judged right) | fixed by layout A |
| 13 | Top score row | ✗ | ✗ | none | removed |
| 14 | Seats waste space | ✓ | ✓ | a3 E9 / b4 E9 | caught |
| 15 | Shop unsorted | ✗ | ~ | none / ½ b4 #36 | fixed (sort toggle) |
| 16 | Deck hover noise | ✗ | ✗ | a3 #17 / b4 #24 (asks for a hover) | taste disagreement |
| 17 | Round end too fast | ✓ | ✓ | judged legible (a3 #48, b3 #51) / a4 #29, #54, #65, b4 #6 | w3 judged it fine |
| 18 | Redistribute's "more than you" | ✓ ("richer") | ? | a3 #52 / none | caught on w3 |
| 19 | Members with no hover | ✓ (swap/ransom picks) | ✓ (seat regression) | a3 #3, #17, b3 #32 / b4 #2 | caught |
| 20 | Art not distinctive | ✓ | ✓ | a3 #58, b3 #54 / b4 E8, sk #12 | caught |
| 21 | Pixel animations weak | ✓ | ✓ | ½ a3 #9 (snaps) / ½ a4 #21 | sprite quality never judged |
| 22 | Spaces overlap the rim | ? | ? | none | the pod refit the disc; unverified |
| 23 | Spaces slapdash (taste) | ✓ | ✓ | ½ b3 #59 / ½ a4 #11, #15 | half |
| 24 | Blue doesn't work (taste) | ✓ | ✓ | none | judged fine; Blue's direction waits on Cory (plan item 4) |
| 25 | Rim dot instead of the word | ✗ | ✗ | none | fixed ("MOST BLUE") |
| 26 | Cryptic panel shorthand | ✓ | ✓ | a3 #57, b3 #16–19 / a4 #73, #74, b4 #11, sk decipher | caught |
| 27 | Text clips in panels | ~ | ~ | ½ a3 #15, b3 #46 / ½ a4 #15, b4 #18 | guarded by textclip |
| 28 | Available spaces unclear | ✗ | ✗ | squint test passes in every report | fixed |
| 29 | Choices as chip grids | ? | ✓ (Your Call, Encore) | none / b4 #4, sk #3 | caught on w4 |
| 30 | Shaped coins on the picker | ✗ | ✗ | none | fixed |
| 31 | Shorthand ability text on shop cards | ✗ | ✗ | none | fixed |
| 32 | Seat hover repeats | ✗ | ~ (no hover at all) | a3 census ✓ / b4 #2 | regression in a new form |
| 33 | No way to use a member | ✓ | ~ | a3 #5, b3 #47 / b4 #20, a4 #38 (release) | caught |
| 34 | Since-strip too big | ✗ | ✗ | ½ b3 #56 | fixed |
| 35 | Seats tall and empty | ✓ | ✓ | a3 E9 / b4 E9 | caught |
| 36 | Floating minions | ✗ | ✗ | none | column per Cory's call |
| 37 | Log names open nothing | ✗ | ~ | (praised) / b4 #27, a4 #60 | partial regression |

Recurrences this morning:
- 1 → 44 and 45 (snappy, then hover and motion pace).
- 10 and 29 → 39 (choices away from the eye).
- 22 and 36 → 41 (tokens on the words).
- 12 → 38 (the buy step's controls).
- 23 → 46 (the whole look).

Each earlier one was "fixed" to the letter of its note, and the underlying problem resurfaced in a new place.

## 3. Systemic causes, ranked

How many of 38–46 each cause explains (one item can have several causes):

1. **The test was told not to look (5: 38, 41, 44, 45, 46).**
   - The briefs fix speed at the default (brief.md, ui-critic, game-skeptic, playtester, boardgame-enthusiast).
   - Committed v4-eyes timed first change and whole-screen settle, with no "complete" for the hovered region and no stutter verdict.
   - w3 testers discarded latency on a loaded box, and nothing re-ran them on a quiet one.
   - Contact sheets show positions, not pace.
   - On 38 and 41, nothing measured distance (Pass from the buy, emoji size against the rim letters).
2. **The stated taste was missing or pointed the other way (5: 39, 40, 41, 43, 45).**
   - taste.md as of 8ea3e24 said "picked on the board (… the seat …). Pairs take two clicks", "the snake visible" and "default Steady (not slow)".
   - It said nothing on tolls, the size of tokens on the wheel, Relaxed or hover completeness.
   - Cory's six new calls landed at 14:52, after every run.
   - Blind testers can't infer a call, and the pod builds to the letter of the ones written.
3. **Found but fixed the wrong aspect, or graded too low (4: 38, 39, 40, 41).**
   - Each was on the record: a3 E1, a3 #42, b3 #22, the rail in every wave, the minions on the words.
   - The pod restyled Undo, lit the chairs and relabelled the rail ×2 → twice → again. These are fixes to the cue, never to the location, and never "delete it".
   - Restraint ("could this go?") was in the brief but not in the pod's loop.
4. **Coverage: never reached (3: 39 for Good Deed, 42, 43).**
   - Tables are random: purple came up once in six runs and was never played as an action.
   - Good Deed came up only for the game-design reviewer.
   - Nothing assigns tables or asks each ring-I space to be taken once across the panel.
5. **Rule never checked against outcome (1: 42; also sk #10, Even Swap).**
   - Testers decode panels, but nothing has them write "expected" before a placement and compare it with the seat change and the log after.
   - sk caught a lying preview only by luck.
6. **Taste disagreement, judged fine (4: 38, 40, 41, 45).**
   - "Pass … fine", "rail clear", "leaders at a glance", "comfortable at Relaxed".
   - Cause 2 is the fix for most of these: they stop being taste once a call is written.
7. **A tester's preference was applied against Cory's eye (1: 41).**
   - a3 #27 "leaders too small" became 24 px leaders on w4.
   - No step checks a tester-driven change against Cory's stated or likely taste before building it.
8. **The design pod couldn't see it (4: 42, 43, 44, 45).**
   - Its camera is static captures of hand-made saves (`scripts/design-pod/capture.mjs`: settled screenshots of 14 states).
   - It never plays a turn, times a hover or compares speeds, and mechanics are outside its remit.
   - It was briefed for composition and slop (in-flight roster 44 and 45), not feel.
9. **The build Cory played wasn't the build under test.**
   - He saw about 05:00–06:30 (≈ w2). The w3 and w4 panels tested later builds, so 40 and 41 changed form under them.
   - It isn't a cause of a miss, but scoring must be per build, and the preview must show its sha.

## 4. Recommended changes

Each change names the items it would catch.

### Brief (brief.md and the agents that build on it)
- **B1. Speed ladder** (45, 17, 2, 1)
  - Replace "leave every speed at its default" with: play at default, plus one block where you do the same own chain and one bot turn at Quick, Steady and Relaxed, using `watch`.
  - Report motion ms per speed and the ratio.
  - Say by eye whether you could follow each, and whether Relaxed reads as clearly slow.
- **B2. Hover complete** (44, 1)
  - In every hover sweep, report first → complete and bursts for the hovered region.
  - Two bursts (it appeared, then filled in) or not complete within 100 ms is a finding.
  - Look at the frames of at least three hovers.
- **B3. Outcome ledger** (42, sk #10)
  - Before each placement, write what its text says you'll get. After it, write what your seat and the log show.
  - Any mismatch is a blocker. Do it for at least 10 placements, including every ring-I space you take.
- **B4. Assigned coverage** (39, 42, 43)
  - The lead assigns tables so the two testers together cover all eight colors (A: Classic plus a table with purple and silver; B: the other four).
  - Each tester takes every gift, pair and steal space they meet at least once, and passes without buying at least twice.
- **B5. Restraint before relabel** (40, 41)
  - For every indicator you had to decode, ask first whether it could be deleted.
  - A decode finding is at least major, never polish.
- **B6. Quiet box or no verdict on feel** (44, w3)
  - If load is over 2, rerun the timing block later on a quiet machine; never just drop the latency findings.

### Checklist (checklist.md)
- **C1. Eye distance** (38, 39)
  - At every decision, measure in px from where your eye is (the thing you just acted on) to the control or cue that answers it: Pass vs the shop and follower tiles; a choice's first target vs the space you took.
  - Over about 250 px is a finding.
- **C2. Toll census** (43): list every space that charges to take it, and every space whose bonus can't pay in a normal snake.
- **C3. Wheel tokens** (41): measure leader and minion emoji against the rim letters with `zoom`, check they're upright, and flag any that sit over panel words.
- **C4. Turn-order indicator** (40): name every element that tells turn order, and count them. More than one is the duplicate census.
- **C5. "Always cover" update** (38, 39, 41, 43, 44, 45): replace with taste.md's current "Cory's own calls", including the six 2026-10-15 lines.

### Tooling (scripts/v4-eyes.mjs)
- **T1. Land the working-tree change** (44, 45)
  - It is uncommitted and being worked on now.
  - It adds `watch <ms>` (records past the 5 s settle cap, up to 20 s), the response region's first → complete with bursts and a "not complete within 100 ms" warning, and a smooth/STUTTERS/CHOPPY verdict with box load.
  - Point brief B1 and B2 at it.
- **T2. A `speed <quick|steady|relaxed>` command**, or a documented menu path, so B1 is one line (45).
- **T3. Log box load** on every timing line and mark lines over load 2 as "don't judge" (44, w3).

### Design pod (scripts/design-pod, its roster brief, taste.md)
- **P1. Add a feel camera** (44, 45)
  - Add hover-complete filmstrips and the speed ladder to capture.mjs, or have the pod run v4-eyes `watch` each pass.
  - "Settled screenshot looks fine" is not a pass.
- **P2. One live game per pass on a rotating table**, not only hand-made saves (38, 39, 42).
- **P3. Gate tester-driven changes against Cory's calls** (41)
  - A tester's "make it bigger/louder" that touches a Cory call (emoji, tokens, cues) goes to the foreman as a question, not a fix.
- **P4. For call-to-action and prominence findings, consider moving the control before restyling it** (38, 39). Write down which one was tried.
- **P5. Propose mechanics; don't let them pass silently** (42, 43)
  - Add "a space that charges to use it" and "a bonus that can't pay" to the slop list.
  - The pod logs them as one-line proposals to the foreman (taste.md already says propose, don't build).
- **P6. Taste upkeep**
  - When Cory's note overrides a written call ("pairs take two clicks", "snake visible"), the old line is edited the same hour, so pods stop building to it (39, 40).

### Scoring and process
- **S1. Score each item on the build Cory actually played**, and show the build sha on screen in the preview so a stale build is caught at a glance (all; 40 and 41 changed form).
- **S2. Re-run calibration with Part 3 included**, on 0c1cd51 or the next freeze, using the brief with B1–B4. Trust it again only at ≥80% recall on 38–46 for the merged two-tester panel.
