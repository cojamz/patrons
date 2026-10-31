# Panel 1, tester C (ui-critic). Build e43ada1. Grade C.

The table was Silver, Yellow, White and Green with 3 Normal bots. Cory lost 52 to 79. A phone round I and an abuse pass were also played.
The box load was 4 to 22 for the whole run, so every timing is an upper bound.
Shots are under scratchpad/panel1/tester-c/ (laptop/, phone/, ledger.md, sweep.md).

## Blockers
1. A space payment (Cheap Seats via Straggler) gave up the silver lead (+4) with no warning; the shop pay sheet does warn.
2. Greatest Hits copied Toast for +9, but the rulebook says a copy gives "what it gave its taker" (+19). The hover agrees with the engine, so the rule text and the engine disagree.

## Major, routed
- **Fixer 1 (pay, rules honesty):**
  - The Top Up tie pays one of each, which only the hover explains.
  - The WHY row omits Grand Host's doubling.
  - Translator was recruited with no pay sheet (same as the Stunt Double bug).
  - Late Bloomer's seat income drops its condition.
  - An unexplained +1 silver to P3 during an Echo turn.
  - The Translator pill is undecoded.
- **Fixer 2 (words):**
  - "up to 2 more each round".
  - "+2 to a rival" (2 of what?).
  - "loose followers" vs "bought or won".
  - Rising Tide "half the richest".
  - "Save 4".
  - Summary "in play" and "members lost".
  - Summary order unlabelled.
  - Whose turn is shown 4 times.
  - Collect Debts "take 3" when only 2 exist.
- **Fixer 3 (speed):**
  - Space hovers took 400 to 1060 ms in 2 to 4 bursts.
  - Shop hovers took 247 to 730 ms.
  - The seat hover took ~500 ms.
  - Log hovers took ~700 ms.
- **Tactile thread (motion):**
  - Bot combos land in one blink.
  - Relaxed/Steady is only about 1.3×.
  - Stutters (load-tainted).
  - The result toast sits bottom-left, far from the action.
- **Needs Cory, because it changes how a choice is made:**
  - Choices should light their targets on the board (the Good Deed and Kickback chip grids; Goody Bags and Cheap Seats pickers sit ~600 px away on the seat).
  - Pass is still ~600 px from the space you used.
- **Phone:** out of scope (laptop only).

## Other majors and polish
- Space hovers are ~400×250 and cover neighbouring spaces.
- Minion emoji cover the space's words.
- Silver and white are hard to tell apart (dots, empty rings, sprites).
- Clicking a taken or used space during the buy shows "You'd get".
- Members overflow into "+N more".
- At 800 px, my own seat drops below the fold.
- The leader portrait doesn't match the emoji picked in setup.
- Undo pick is 350 px from the picker.
- Harvest's hover has no standings row.
- The pile has no hover.
- Pay sheet: the Grand Host cost is shown as 8●4◐ vs 12●, and the Pay button jumps.
