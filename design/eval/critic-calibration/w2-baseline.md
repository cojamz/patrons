# Calibration baseline: the old wave-2 panel on w2 (8f93858)

Build: 8f93858 (05:48 UTC, 2026-10-15; worktree .v4-wt/w2, frozen on :5191). Per miss-matrix §1, Cory's morning build (≈05:00–06:30) brackets w2 closely, so w2 is the nearest frozen build to what he played.
Key: answer-key.md items 1–47. Panel scored: wave2/tester-a (report.md + sweep.md) and wave2/tester-b (report.md + sweep.md), merged. Rules from results.md: hit = same problem on the same element (1); half = the element plus a neighbouring problem (0.5); miss = 0. An opposite verdict ("too cramped" for "mostly empty") is a miss, as in round 1's item 7.
Evidence for presence: w2 source (src/v4, src/engine/v4 in the worktree), git history 8f93858..44e22bd, miss-matrix-2026-10-15.md, overnight-wave2.md, and the testers' own w2 screenshots (tester-a 043-myturn1.png, tester-b 027-click.png, 065-now.png). v4-eyes was not needed; the screenshots settled the visual questions.
Finding refs: A#n / B#n are numbered findings; A E3, B E9 etc. are the ten audits; "sweep" is the tester's running notes.

## 1. Presence on 8f93858

| # | Item | On w2 | Reason |
|---|---|---|---|
| 1 | Not snappy | present | Same perf era as w3 (quiet perf at 07:36 still "turn wait 20s"); both testers saw 300–1400 ms placements, 52 s bot cycles. |
| 2 | Wheel spins slowly | present | Testers measured drag coast >6 s (A) / 3 s settle (B), 0.9–1.6 s per arrow step. |
| 3 | Hovers docked away from pointer | present | Seat and own-member hovers dock 228–494 px away (A#14, B#20); "anchored seat cards" landed only at 07:12 (0ae9227). Space and card hovers are anchored. |
| 4 | Setup pick has no call to action | present | Starting pick is a panel bottom-left beside the wheel (B shot 027); moved to centre only after w3. |
| 5 | Member effect doesn't read first | unsure | Reshaped by Cory's call: card face is picture/name/cost/worth, ability lives in the hover where it is the largest text (Info.jsx MemberCard). Whether the original complaint still applies is a judgment. |
| 6 | Cost spells color names | present | "Colorless here: its 6 magenta is paid in any colors" in the pay dialog; "You're short 2 blue"; Talent Scout "Costs 2 magenta + 2 any". |
| 7 | "Need N" shouts | absent | MemberCard shows only a quiet "You're short … to recruit it" line; code comment: "Cory: 'need N' never shouts". |
| 8 | Card/hover clutter lines | absent | ShopCardHover: "no 'You pay', no 'Leaves', no contest lines, no click hint" (HoverCards.jsx:346); "Pays 6●" was a later regression. |
| 9 | Too many currency symbols | present | Testers counted 17 and 19 glyphs; split "any" dot still in use. |
| 10 | Steal picked from a list | absent | Steals are picked on lit rival stacks (both testers praise it). |
| 11 | Pay dialog unintuitive | present | Same pay sheet; default payment, ×2 tokens, payment shown three times. |
| 12 | Follower shop hidden | absent | Four large follower tiles top right (B shot 065); both prominence audits judged it right. |
| 13 | Top score row redundant | absent | No separate rank row; ranks fold into the seat total (CultSeat.jsx seatRanks). |
| 14 | Seats waste space | present | Round-I rival seats are ~300×80 boxes, mostly empty (B shot 065, A shot 043); matrix ✓ on w3/w4. |
| 15 | Shop unsorted | absent | Shop sorted by cost with a cost/color toggle. |
| 16 | Deck hover noise | absent | Deck count opens nothing (B#43). |
| 17 | Round end too fast and confusing | present | Same Reckoning; staging and "a beat before scoring" landed at 07:05 (b225c56), after w2; matrix ✓ on w3. |
| 18 | Redistribute's "more than you" | present | Hover text "Take 1 resource from each rival holding more than you"; panel "Steal 1 each from richer rivals". |
| 19 | Some members have no hover | present | Release chips name members with only a native title, no card (GameScreen.jsx ~349); Talent Scout's sheet chip has no picture. Same form as w3's "swap/ransom picks". |
| 20 | Pixel art not distinctive | present | Seat sprites ~16 px, samey (both testers). |
| 21 | Pixel animations weak | present | Matrix ✓ on w3/w4; no art pass before 07:33. |
| 22 | Spaces overlap rim rules | absent | Screenshots show spaces inside the rim, rim text uncovered (only leader sprites touch the lettering, which is item 41). |
| 23 | Action spaces slapdash (taste) | present | Mixed panel grammar (bold verbs vs "+N ●") visible in B shot 027. |
| 24 | Blue doesn't work (taste) | unsure | "Badged" was dropped before w2 (decisions.md:413) and Blue is the market quadrant scoring most blue; matrix still marks it ✓ (direction waits on Cory). |
| 25 | Rim dot, not color word | absent | Rims read "MOST BLUE" (Wheel.jsx). |
| 26 | Cryptic panel shorthand | present | "pick who gets 1", "Take a member", "per player ahead", "Ransom a member". |
| 27 | Text clips in panels | absent | No clipping in any w2 screenshot checked; neither tester reports it. |
| 28 | Available spaces unclear | absent | Cream lit vs dark spaces; squint test passed by both. |
| 29 | Choices as chip/button lists | present | Snap Up pay, Talent Scout, Your Call, Release chips; moved to the board at 07:27 (01b5595). |
| 30 | Picker uses shaped coins | absent | Plain dots on the starting picker (B shot 027). |
| 31 | Shorthand ability text on shop cards | absent | Card faces show no ability text. |
| 32 | Seat hover repeats Followers/Has | absent | Seat hover lists members with state (A sweep "matches Cory call"). |
| 33 | No discoverable way to use a member | present | Faint glow on a 16 px sprite plus an italic header line; "Use now" only in the hover. |
| 34 | Since-strip takes a third of the screen | unsure | On w2 it is a quiet list under the seats (~300×250, since.css), not a third of the screen, but both testers call that box oversized/often empty. |
| 35 | Seat panels tall and mostly empty | present | As 14. |
| 36 | Unplaced minions float round the leader | absent | Minions stand in a column beside the seat total (screenshots; B#15). |
| 37 | Log names open nothing | absent | Strip and log names open anchored cards (B#48, A sweep). |
| 38 | Pass hard to find | present | Pass is a small pill in the header buy prompt (GameScreen.jsx ~360). |
| 39 | Gift's two-step pick confusing | present | comboStep 'give': your color stack, then a rival seat (boardPick.js:64); Good Deed on Silver. |
| 40 | Turn-order rail confusing | present | The exact "in 4 ×2" / dots / arrow form Cory quoted (screenshots). |
| 41 | Wheel emojis too big and out of line | present | Leaders at 1.7× band (shrunk ~07:10), minions sit on panel words (A shot 043). |
| 42 | Catch Up never pays | present | Same rule: estimate counts your minion (behind(ctx,p,1)), purple.js:116–119. |
| 43 | Purple spaces charge to use | present | Overtime "Pay 8 purple: take 2 extra turns", Crunch Time spends purple. |
| 44 | Hovers fill in after opening | present | HoverCards.jsx:137 "content that fills in a moment later (the dry run's 'You'd get')". |
| 45 | Too fast even on Relaxed | present | Relaxed = 1.55× Steady (motion.js:13). |
| 46 | "Still clunky" (taste) | present | Both testers C+. |
| 47 | Catch Up text can't be decoded | present | Panel "+1 purple / +2 per rival ahead / in minions out"; hover is the engine sentence Cory quoted. |

Count: 28 present, 3 unsure (5, 24, 34), 16 absent.

## 2. Scoring the wave-2 panel (A + B merged) against the present items

| # | Item | Score | Findings | Note |
|---|---|---|---|---|
| 1 | Not snappy | 1 | A#19 (bot cycle ~52 s, "a long wait"), A#41 (no pressed state for 1.5 s), A#51; B header ms | Hedged as box load, but named as findings. |
| 2 | Wheel spins slowly | 1 | A#42 (drag coasts >6 s, 1.6 s per arrow step), B#42 (3065 ms settle, ~900 ms per step) | Framed partly as affordance/ghost popover; durations are the finding. |
| 3 | Hovers docked | 1 | A#14 (328/341/296 px), B#20 (228–494 px) | |
| 4 | Setup pick no call to action | 1 | A#43, B#25 ("eye lands on the wheel"), A E1, B E1 | |
| 6 | Color names beside costs | 1 | A#47, A#18, B#54, B#8 | |
| 9 | Too many symbols | 1 | A E3 (17, "over budget"), B E3 (19, "too many") | |
| 11 | Pay dialog | 1 | A#5, A#11, A#38, A#39 | |
| 14 | Seats waste space | 0 | A#15, A E9, B E9 say the opposite (too cramped in round III) | Opposite verdict = miss. |
| 17 | Round end too fast/confusing | 0.5 | B#23 + sweep (scoring already on 4 of 4), A#3, A#31 (unlabeled bubbles), A#33 | Both judged the Reckoning itself legible. |
| 18 | Redistribute "more than you" | 0.5 | B#6 (count wrong), A#20 (error text); B E10 "guessed right" | Element, neighbouring problem. |
| 19 | Members with no hover | 0.5 | B#50 (name opens the wrong card), B#9 (chip with no picture) | No "opens nothing" finding. |
| 20 | Art not distinctive | 1 | B#22, B E8, A E8 ("at seat size they blur") | |
| 21 | Pixel animations weak | 0.5 | B#13 (white rectangle flash) | Motion defect; sprite quality never judged. |
| 23 | Spaces slapdash (taste) | 1 | B#35 (panel hierarchy inconsistent: bold verbs vs "+N ●"), B#52 | Judgment call: names the missing single grammar, on the panels. |
| 26 | Cryptic shorthand | 1 | A#46, A E10, B#24, B#36, B#37, B E10 | |
| 29 | Choices as chip lists | 1 | B#8, B#9, B#10, B#11, A#13 | |
| 33 | Using a member undiscoverable | 1 | A#44, A E5, B E1, B E5 | |
| 35 | Seats tall and empty | 0 | as 14 | |
| 38 | Pass hard to find | 0 | A E5, B E5 judged the small Pass pill right | |
| 39 | Gift's two-step pick | 0.5 | A E1 ("lit stacks. Right, though the italic prompt is small"), A#21, B#5 (lit pills cover counts) | Neither took Good Deed; cue judged right. |
| 40 | Turn-order rail | 1 | A#28, B#44, A misreads ("in 3 ×2" as a multiplier), A E3 (two ×2 lookalikes) | |
| 41 | Wheel emojis | 0.5 | A#52 (rim leaders overlap dividers and lettering) | Overlap only; size and alignment not raised. |
| 42 | Catch Up never pays | 0 | none | No purple on either table. |
| 43 | Purple spaces charge | 0 | none | No purple. |
| 44 | Hovers fill in late | 0 | none | B logged 340–660 ms hovers "for the record" only. |
| 45 | Too fast on Relaxed | 0.5 | B E8 (toasts replace each other within ~2 s at Normal), B#23 (no beat before scoring) | Speed never changed. |
| 46 | Still clunky (taste) | 0.5 | both C+ | Same rule as the miss matrix. |
| 47 | Catch Up text | 0 | none | No purple. |

Unsure items, scored for the sensitivity line only: 5 = 0.5 (A E2 anatomy on the card, but about cost rank, not the effect); 24 = 0 (no Blue finding); 34 = 1 (A E9 "strip plus toast … oversized", B E9 "often empty while seats are cramped").

## 3. Totals

| Scope | Items | Score | Recall |
|---|---|---|---|
| All present items | 28 | 17.0 | **61%** |
| Items 1–37 present | 18 | 14.0 | 78% |
| Items 38–47 | 10 (all present) | 3.0 | **30%** |
| Sensitivity: present + unsure | 31 | 18.5 | 60% |

Reading:
- On the problems still on screen from Parts 1–2, the old panel holds up (78%). Part 3 drags it down: 30% on 38–47, close to the w3 (39%) and w4 (44%) panels in the miss matrix.
- Four of the 38–47 zeros come from coverage (42, 43, 47: no purple table; 44: latency was set aside on a loaded box). Two come from taste verdicts that went the other way (38 Pass "right", 14/35 seats "too cramped").
- The full hits are the ones a screen-only tester stumbles on: docking, the rail, chip sheets, shorthand, glyph count.
