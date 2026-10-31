# Wave 3: merged findings (2026-10-15, ~09:40 UTC)

Frozen build w3 = 44e22bd. Two blind screen-only testers on brief v3 (tester A: a laptop newcomer on Classic, then round I of a random table; tester B: a strategist against three Hard bots on a random table), each graded C+ (A: 58 findings, B: 60). A blind game-feel reviewer played two full games on a quiet machine and graded B−. Reports: wave3/tester-a/report.md, wave3/tester-b/report.md, boardgame-enthusiast-w3.md. Its economy claims were checked against 336 bot games (bench/economy-claims.md).

What all three praised: the wheel and the snake draft; space, shop and rim hovers anchored beside what you point at, with "you'd get" and standings; every target picked on the board; names in the strip and log that open their card and light the space; recruits flying to the seat; a round end you can narrate; results that add up.

## Ranked themes, each with an owner
1. **The header lies at hand-offs.** "Choose how to pay ···" and "P4 is placing…" linger into other players' turns; the header and the rail disagree; the toast lingers ~10s. (A1, A11, A36, B8, B9.) Perf pod (header in the hand-off frame); detail designer (voice of the pay line).
2. **Effects that don't travel.** Steals in round III, gifts, ransoms, poaches, swaps, member Uses, follower buys, conversions ("arrives as magenta"), New Faces, and the bots' starting picks all just change numbers. Round III's burst is ~13s and unreadable. (A9, A10, A20, A46, A47, B7, B22, B33, B34, game-feel #6, #10.) New motion agent.
3. **Panel words that fail the decipher test.** Ransom a member, Crunch Time, Overtime, Roll Call vs Plan Ahead (fixed), "richer rivals", Goody Bags' color, "+4 trade silver", "per loose followers", Snap Up's any-colors, Gold's 2·4·6 and Your Call's scaling shown two ways. (A21, A52, A54, A56, A57, B12, B13, B18, B19.) Detail designer.
4. **Random tables' colors don't read.** White reads as empty, silver as plain grey, the split "any" dot as a magenta or brown blob at card size, and the white and silver rims are both grey. (A4 blocker, B29.) Art director.
5. **Blind picks.** Hovering a lit member in a swap or ransom pick opens nothing. (A3 blocker, B32.) Detail designer (ransom fixed; swap next).
6. **Unexplained turn order.** "P3 picks first" while it leads (Front-runner), with no reason on screen. (A2 blocker.) Detail designer.
7. **Paying and buying is unpredictable.** One click buys 2→1, 4→3 and 8→6 at once, while 10→10 and some members open the pay sheet; the pay sheet's numbers are unlabeled. (A6, A7, B24, B25, B26.) Detail designer (labels). The one-way rule stays (gut call below).
8. **Things look pressable when they aren't.** In rivals' turns the 2→1 tile is the brightest thing on screen and affordable cards stay lit; Pass and Undo look identical. (A13, A42.) Art director.
9. **Seats.** Your own members fold to 3 plus "+N" because the income line takes the row. Sprites at 24px look alike. The seat body and the follower number open nothing, and the number gives no breakdown. Seat hovers sit 136–488px from the pointer. (A8, A16, A17, A58, B38, B39, B54.) Art director (row); members UX (hovers, breakdown, rivals' spending power).
10. **Small duplicates and noise.** Hovers repeat cost and worth; "colorless" beside costs; "N you can afford" beside the fade; dead results columns; "End-game bonuses: none"; the log runs newest first and the strip oldest first. (A23, A24, A33, A40, A49, A55, B45, B49, B52.) Detail designer.

## Calls (Claude, under go-with-your-gut)
- One click buys when there is exactly one way to pay; the pay sheet opens only when there's a real choice. This stays for speed. Two testers found it unpredictable, so the coins must visibly fly out of your pile, and the hover's click line ("pays 8● at once" or "choose how to pay") stays.
- The starting pick moves to where the eye lands (art director).

## Design notes for Cory (not built)
- Members feel weak. Cory said it, both blind players said it, and their member engines lost to follower buying against Hard bots. The bots disagree on Classic, where the top recruiters win 44% and the bottom 16%. So it's a matter of feel: payoffs are small and quiet. Calls 2 and 3 in the morning note address it.
- Round-III rims decide about a third of bot games, and a quarter are won uncontested (call 7).
- Round I's last placement can be dead: no resources, and only Cheap Seats left. (B57)
