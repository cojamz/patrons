# UI critic, round 2

Blind (had the rulebook), laptop 1270×700, frozen build 4da59a3 (.v4-panel/d8), table gold/thieves/silver/yellow. Before UI-A's minions-on-actions, inline rim emoji and turn card. Vision mock: design/eval/ui-critic-round2/wheel-is-scoreboard.html and vision.png; key shots copied beside it. Saved by the foreman.

**Verdict: NOT YET. Overall grade C** (computed 2.1/4 against the rubric; the cap would have allowed up to C+, because Q3 misses its 0-tap target). The game does well at explaining what an action will do before you commit and at summarising each round. It does badly at showing which spaces you can take right now, and at telling you why your own numbers changed.

**Scope and caveats**
- **Laptop only**, 1270×700, table gold, thieves, silver, yellow. Phone skipped as the designer asked; the abuse session was done.
- **No complete game.** The Chromium page crashed twice ("Target crashed"):
  - in game 1 at round III, turn 4;
  - in game 2 in round II.
  - Game 3 reached round II before the coordinator called time.
  - The crashes are probably the environment, not the game. The machine was at about 15.2 of 16 GB, held by other node and vitest processes, while my page used only 210–270 MB. `/console` was "(clean)" before the crash.
  - So I never saw the end screen: C8 is N/A.
- **I was not blind to the rules.** The rulebook was already in my prompt before I played, so I couldn't play round 1 without it.
- **Where the screenshots are:** game 1 is in `/tmp/patrons-shots/ui-critic/laptop-*.png`; games 2 and 3 are in `/tmp/patrons-shots/ui-critic/run2/` and `/run3/`.

## Question test (laptop; the phone wasn't tested)
| # | Target | Worst taps | Right? | Evidence |
|---|---|---|---|---|
| Q1 Whose turn | 0 | 0 | yes | headline "Your turn —" / "P4 is placing a minion…" (run3/010) |
| Q2 What to do | 0 | 0, but clipped | yes | headline cut to "Your turn — recruit a / member, buy followers, or…" (laptop-276, 300) |
| Q3 Legal options | 0 | **3** (2 silent misclicks, then a hover) | **wrong** at first | run3/012 and 013: only Discount was open, and it differed from the others only by darker label text |
| Q4 What a space or card does | 1 | 1 hover; names in the choice panels can't be inspected | yes | laptop-272 (Strike), 277 (Underdog), 100 (card name in the log) |
| Q5 Afford / what's left | 0/1 | 0 / 1 | yes | "need 4" tags and "2 you can afford" (laptop-300); "YOU PAY / LEAVES" in the tooltip (277) |
| Q6 Score and where it came from | 0/1 | 0 for the total; the breakdown appears only in the round summary; ∞ mid-round | partly | laptop-119 |
| Q7 Who's winning, by how much | 0 | 0, ~3 s comparing four corner numbers | yes | laptop-358 |
| Q8 Last opponent action / did it affect me | 0/1 | 0 (pill shows about 1–2 s); "affected me" needs **2** (menu → Chronicle) | yes | laptop-337, 359 |
| Q9 Why my number changed | 0/1 | **2** | yes, only via Chronicle | magenta 0→2 from P2's Alms with nothing shown on my seat: laptop-337 → 358 → 359 |
| Q10 Moves and rounds left | 0 | rounds 0 (centre dots); my minions: count the cat tokens, ~3 s, no number | partly | laptop-358 |
| Q11 What opponent X has | 1 | 0–1 (seat shows members and resources; hover popover) | yes | run2/004 |
| Q12 Scoring / game end | 1 | rim gives quadrant rules at 0; end condition only as "10→10 · 2 left"; full rules are in the menu, ≥2 taps | partly | laptop-098, 297 |
| Q13 Undo | 0 | 0 | yes | "Undo placement" → "Placement undone — place again" (laptop-254) |
| Q14 Round end | 1 / 0 | 1 before (tooltip "GOLD You 6 · P3 4 · P2 2 · you'd lead, +6"); 0 at the summary | yes | laptop-272, run2/sheet-g2r1end |

## Section grades
- **A (State at a glance): D.**
  - A3 FAIL (P1): open spaces differ from taken ones only by label darkness.
  - PARTIAL on A2 (prompt clips), A6 (no leader marker), A7 (no minions-left number) and A8 (the legal spaces aren't the most prominent thing).
  - A1, A4 and A5 pass.
- **B (Explanation in one tap): C.**
  - The space and card tooltips are excellent.
  - B9 FAIL (P2): tooltips cover the shop, my seat or the headline.
  - PARTIAL on B1, B2 and B8.
- **C (Cause and effect): C.**
  - C6 and C7 pass (consequence preview; summary that stays until you dismiss it).
  - PARTIAL on C1 (my resource changes are unexplained), C3 (dashed rings don't say who), C4 (toast pill is short and small) and C5 (log is 2 taps).
- **D (Prevent and recover): B+.** Undo works and reload keeps state. D2 FAIL (P2): illegal clicks are silent.
- **E (Legibility): C.**
  - E1: summary text 10.8–11px; setup labels are cream on cream.
  - E3: prompt ellipsis; minion tokens sit on top of rim and space labels.
  - E5: gold and yellow coins are nearly the same hue.
  - E6: I appear as "You" on my seat and "P1" in the summary and log.
- **F (Intuitiveness): B+.** The 20-second intro and the place → recruit order are clear. F2 PARTIAL: you can't tell open spaces from decoration.

## Top issues, worst first
1. **You can't see which spaces are legal.**
   - **What happened:** The prompt says "place a minion on a glowing space". The only open space (Discount) differed from the taken ones only by darker text. The dashed orange rings, the most glow-like thing on the board, mark spaces that are taken. I clicked Gift, then Bloom, before finding it.
   - **Where:** run3/012, 013, zoom-g3-wheel.png.
   - **Checks:** A3, Q3, F2, E5. P1, both devices.
   - **Smallest fix:** give open spaces a solid bright ring and a full-strength icon. Drop taken spaces to about 40% with the owner's minion standing in the middle of the space.
   - **Reference:** the Everdell and Root digital adaptations, which dim occupied locations and put the worker on them.
2. **Illegal clicks are silent** (taken space, unaffordable card).
   - **Where:** laptop-201, 202; run3/012.
   - **Check:** D2, P2.
   - **Fix:** shake the target and show a small note at the cursor ("Taken by P3" / "Need 2 more silver").
   - **Reference:** Slay the Spire's "I don't have enough energy".
3. **The headline prompt overflows and clips.** It reads "/our turn — recruit a / member, buy followers, or…", with the box top at y = −1 (measured: 22px). The phrasing is "joint Venture: give 1 gold to…".
   - **Where:** laptop-276, 299, 300, 326.
   - **Checks:** A2, E3. P2.
   - **Fix:** keep only the verb phrase in the headline and move the details to the sub-line.
4. **Minion tokens cover the rim scoring labels and the space labels.**
   - **Examples:** "MOST SILVE[ghost]6"; the ghost on Gather's "1 per member" (laptop-358); "MOST FULL SE[robot]" (run2).
   - **Where:** laptop-297, 358.
   - **Check:** E3. P2. This is the area being redesigned now.
   - **Fix:** give each space a fixed socket and keep the rim band free of tokens.
5. **Why did my resources change?**
   - **What happened:** P2's Alms gave me 2 magenta, and my seat showed nothing. The only explanation was in the Chronicle, two taps away.
   - **Where:** laptop-358, 359.
   - **Checks:** C1, Q9. P1.
   - **Fix:** a "+2 ◆ P2's Alms" chip that floats from the source to the resource for about 1.5 s, plus a dot on the resource until your next action.
   - **Reference:** Hearthstone's stat-change pops.
6. **The log is two taps away** (☰ → Chronicle) and the bot pill vanishes in about 1–2 s.
   - **Where:** laptop-098, 337.
   - **Checks:** C4, C5. P2.
   - **Fix:** an always-visible strip with the last 2–3 events under the headline; tapping it opens the Chronicle.
   - **Reference:** Board Game Arena's (BGA) always-on log.
7. **Gold and yellow look alike.**
   - **What happened:** In the setup picker and the payment modal they are plain circles of nearly the same hue: gold rgb(201,147,39) vs yellow rgb(196,169,58). The setup labels are invisible, cream (243,230,200) on cream.
   - **Where:** run2/zoom-setup-labels.png, laptop-302.
   - **Checks:** E5, E1. P2.
   - **Fix:** use the seat's distinct glyphs inside every coin, and darken the setup labels.
8. **Tooltips cover what you need.**
   - **Examples:** Underdog's tooltip covers the shop and my seat (laptop-277). P3's seat popover covers the setup prompt (run2/004). Tip-off's tooltip covers half the wheel (laptop-325).
   - **Check:** B9. P2.
   - **Fix:** one fixed inspector slot, for example between the right-hand seats. It swaps instantly with no fade, which also answers "hover doesn't feel quick".
   - **Reference:** Through the Ages' fixed card-zoom panel.
9. **No leader marker or margin.** The four scores sit in the four corners.
   - **Where:** laptop-358.
   - **Checks:** A6, Q7. P2.
   - **Fix:** a ranked pill row under the headline ("P4 41 · You 36 · …").
10. **No number for my minions left.**
    - **Where:** laptop-358.
    - **Checks:** A7, Q10. P2.
    - **Fix:** "3 of 4 minions left" in the status line and as pips on the seat.
11. **Small text.**
    - **Where:** round summary at 13 / 11 / 10.8px (laptop-119, measured); wheel space labels about 9–10px (my estimate; the hit box blocks `/at`).
    - **Check:** E1. P2.
    - **Fix:** a 12px floor.
12. **Names and copy are inconsistent.**
    - I am "You" on my seat but "P1" in the summary and Chronicle.
    - The header says "Release…" but the round-start prompt says "let … go".
    - One Chronicle line is broken: "everyone else gains 1 magenta (P4 took 2 magenta and)." (laptop-298).
    - The Tip-off tooltip reads "+3 ◆ · you choose how (roughly)", which I couldn't parse (laptop-325).
    - **Check:** E6. P2.

## Felt confusing (in order)
1. **Setup coins.** Four "+1" coins with unreadable labels; I couldn't tell gold from yellow. I had to measure with `/at` to learn the names. About 10 s. (run2/004)
2. **The small hooded figures on the rim** (teal at the silver arc, pink at the yellow arc). I took them for minions; they seem to mark each quadrant's current leader, but the screen never says so. (laptop-297)
3. **Dashed orange rings.** I took them as "glowing = legal"; they mark spaces that are taken. Cost: 2 misclicks and about 20 s. (run3/011–013)
4. **Who owns a taken space.** Minions sit between spaces, for example a frog between Tip-off and Pickpocket, so ownership is a guess. (run3/zoom-g3-wheel)
5. **My resources moved silently** (magenta 0→2, silver 0→1). I found out from the Chronicle. About 30 s. (laptop-359)
6. **P3 went from 21 to 47 followers in two bot turns**, explained only by a pill and then the Chronicle ("bought 10", "Jubilee +10"). (laptop-337, 358)
7. **Card modifiers change the numbers.** Joint Venture says "+3 · gift 1", but I ended up with more gold than that. The reason was a member's modifier, which nothing on the space shows. (run3/008)

## Misreads
- Read the dashed rings as the "glow" of legal spaces.
- Read the Gift space as open: its occupant (a frog) sat on the rim, not on the space.
- Read the rim figures as placed minions.
- Took "P1" in the round summary for another player before realising it was me.

## Buried in the rulebook (the screen should show it)
- Only loose followers can be sold or spent.
- When the last 10→10 is gone, the game ends after that round. The shop shows "2 left" but not the consequence.
- Ties all score unless a tiebreak is printed, and you need at least 1 to score.
- Release only works on a member you didn't recruit this round, and returns its coloured part.
- A cost is the coloured part plus "any".
- Copies never reach the centre or another copy.

## What works
- The space and card tooltips are the best I've seen in a prototype. They show YOU GET, the live standings ("you'd lead, +6") and what it UNLOCKS. (laptop-272)
- Round end works: the reckoning steps across the wheel with a Skip, and the "Round I scored" summary breaks down each contest and each player, and stays up until you dismiss it.
- Undo, payment auto-fill, the "need N" tags on unaffordable members, and the "your turn again (snake order)" prompt all work.

## Vision: make the wheel the whole game
1. **(b) The rim is the live scoreboard.** Each quadrant's rim carries a standings ribbon: players' heads ranked by count, a crown on the leader, and the prize printed once. At the reckoning each ribbon pulses and its prize token travels along the rim into the winner's seat.
   - Inspired by Wingspan's end-of-round goal board with player cubes, and by the live tracks in Through the Ages.
   - What you'd feel: every placement becomes "if I take Rush I pass P2 on the gold arc". The scoring stops being a modal and becomes a race you can see.
2. **(a) Actions as icon equations.** A big pixel icon plus a glyph sum ("+3 ●", "1 ● → ?", "take 1 from each richer ↑"), with the name as a small caption.
   - Open spaces get a bright ring. A taken space dims with its owner standing on it.
   - Inspired by Temple Gates' Dominion card grammar and the clearings in Root.
   - What you'd feel: the board reads like a menu you can scan in one sweep, and the blocking tension is visible.
3. **(c) Cults as congregations.** Four equal rectangular paper seats. Each shows the leader, members as a growing crowd of pixel people, minion pips, the score with a one-line source ("+2 Tip-off ↗"), and glyph coins with floating deltas.
   - A fixed inspector replaces the floating tooltips, so the wheel stays in focus.
   - Inspired by Root's faction boards and Hearthstone's hero frames.

**Mock of the biggest idea (1, combined with 2 and 3):** `/tmp/ui-critic/vision/wheel-is-scoreboard.html`, screenshot at `/tmp/patrons-shots/ui-critic/run3/laptop-029-vision.png`.
- Top: a ranked score pill row, and "You have 3 of 4 minions left" in the status line.
- On the rim: silver and gold standings ribbons with a crown on the leader; magenta and sets ribbons as side columns, each with its "+4".
- On the wheel: open spaces as bright-ringed icon equations; taken spaces dimmed with the owner's token on them.
- Seats: equal-sized, with member crowds and delta chips.

It's a quick static frame: the token positions on the taken spaces cover part of their text, and that's exactly the overlap a real socket layout would avoid.
