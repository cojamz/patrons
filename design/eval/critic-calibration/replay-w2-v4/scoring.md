# Panel v4 replay on wave-2 build 8f93858 (2026-10-15 afternoon)

Build: 8f93858 (wave 2, 05:48 UTC), inside the window Cory's stale preview showed this morning (miss-matrix §1). Frozen at .v4-wt/w2/.v4-panel/w2, :5191. Two fresh blind testers on brief/checklist v4 (commit 1d85887), launched in parallel on the local 4-CPU box (load 4–9 throughout: timings are upper bounds). House style = taste.md's "Cory's own calls" as of 8f93858, so none of this morning's calls leaked in. Blindness audit: neither transcript touched /home/user/patrons except running v4-eyes. Tester A: Custom Silver/Magenta/Purple/Yellow, 57 findings, D+. Tester B: Classic + Custom Silver/Yellow/White/Blue, 48 findings, C−. Files: tester-a/, tester-b/ (sweep, ledger, motion log). Presence of each item on 8f93858 and the old panel's scores: ../w2-baseline.md.

| # | Item | Old (wave 2) | v4 | v4 findings |
|---|---|---|---|---|
| 1 | Not snappy | 1 | 1 | A#21, B#15, every hover over 100 ms |
| 2 | Wheel spin slow | 1 | 0 | neither spun it (both say so) |
| 3 | Hovers docked | 1 | 0.5 | A#50 (shop hover placement varies), B#16 (pay dialog 590 px from the card); no seat docking named |
| 4 | Setup pick no call to action | 1 | 1 | A#35, B#18 (470 px eye travel) |
| 6 | Color names beside costs | 1 | 1 | B#7 ("its 6 purple is paid in any colors") |
| 9 | Too many symbols | 1 | 1 | A E3 (12), B#39 |
| 11 | Pay dialog | 1 | 1 | A#2, A#5, B#47 |
| 14 | Seats waste space | 0 | 1 | A E9 (rival seats ~60% empty) |
| 17 | Round end too fast/confusing | 0.5 | 1 | A#38 (could only narrate from the summary) |
| 18 | Redistribute's "more than you" | 0.5 | 0 | not named |
| 19 | Members with no hover | 0.5 | 1 | A#16, B#11 (pick-mode members open nothing) |
| 20 | Art not distinctive | 1 | 1 | B#40 |
| 21 | Pixel animations weak | 0.5 | 0 | not named |
| 23 | Spaces slapdash (taste) | 1 | 0.5 | A#7, B#38 (panels lead with names, not the gain) |
| 26 | Cryptic shorthand | 1 | 1 | A#8, A E10, B#23, B E10 |
| 29 | Choices as chip lists | 1 | 1 | A#6 (Release chips), A#40 |
| 33 | Using a member undiscoverable | 1 | 1 | B#9 (Squatter never glowed) |
| 35 | Seats tall and empty | 0 | 1 | as 14 |
| 38 | Pass hard to find | 0 | 1 | A#26 (330 px from the shop), B#17 |
| 39 | Gift's two-step pick confusing | 0.5 | 1 | B#12 (Good Deed lights my own stacks, reads as spending, 500 px away) |
| 40 | Turn-order rail | 1 | 1 | A#29, B#21 (both: "could it go?") |
| 41 | Wheel emojis too big, out of line | 0.5 | 1 | B#28 (overlap, bigger than the rim lettering) |
| 42 | Catch Up never pays | 0 | 1 | A#11 (paid +0 both times, outcome ledger) |
| 43 | Purple spaces charge you | 0 | 0 | A took Overtime; the cost was legible so no finding. The principle was written only at 14:52, after this build. |
| 44 | Hovers fill in late | 0 | 1 | A#17, A#18, B#13 (2–5 bursts, frames show fill-in) |
| 45 | Too fast on Relaxed, not smooth | 0.5 | 1 | A ladder (Relaxed placement 2403 ms vs Steady 2978: not slower), B#30 stutters, A+B Quick≈Steady |
| 46 | Still clunky (taste) | 0.5 | 1 | D+ and C− |
| 47 | Catch Up text undecodable | 0 | 1 | A E10 decipher misread |

Totals over the 28 items present on 8f93858:
- Old wave-2 panel (brief v3): 17.0 / 28 = **61%**; items 38–47: 3 / 10 = **30%**.
- Panel v4: 23.0 / 28 = **82%**; items 38–47: 9 / 10 = **90%**.

Gained by v4's new parts: 38 and 39 (eye distance, assigned coverage), 42 and 47 (assigned purple table, outcome ledger, decipher), 44 (hover complete), 45 (speed ladder), 14/35 (space budget read with restraint), 41 (house style plus wheel tokens).
Lost: 2 (nobody spun the wheel: now step 4 of the walk, first thing), 18 and 21 (single-tester items; noise), 3 half.
Not caught: 43, which is a design principle Cory stated after this build; with today's house style it is a direct violation.

Extra, not in the key, worth Cory's eye if still live: a rival's ransom took a member with only a "let it go" button (A#1), an instant buy that spent a lead-holding color with no pay step (A#4, B#2), Extra Hand bought in round III never added its minion (B#1, logged fixed later the same morning), Quick and Steady barely differ (A, B ladders), resources changing between turns with no cause shown (A#3, B#46).
Caveat: both ran together on a loaded box. Speed and stutter numbers are upper bounds; the next run goes to quiet machines.
