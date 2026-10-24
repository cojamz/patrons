# Tester B sweep
## Home / How to play / Setup / Intro / Starting picks (load 3.8-6.3, timings flagged)
- How to play: a wall of text in a modal, no diagram of the wheel/seat; opened 50/737ms (load 3.8). Esc closes. shot 002
- Setup: P1 avatar is a ghost, intro shows my leader wearing PIZZA, in-game seat shows a ghost/skull face → my identity changes across 3 screens. shots 004,005,008
- Start → an unasked 30-s intro autoplays; Skip intro top-right ~600px from Start button. shot 005
- Seat: lower half of every seat empty (dead space ~60%); resource row "0○0○" number-then-ring reads as "00" pairs. shot 008
- Followers shop: "any resources" header + split dot in each tile + "no limit" small text: restraint. shot 009
- Start pick: panel bottom-left at (210,610); header prompt at (640,36): ~700px apart; picked dot flies via P2 seat. 1st pick click first 195/complete 591ms 3 bursts (load 4.9). shot 011/012
- Penny Pincher hover repeats the card's picture+name (dup), covers right wheel spaces; 66/233ms 1 burst (load 5.1). shot 010
- Wheel drag: starts an "Even Swap" hover popover that stays open and rides along during the spin; 259ms first, 2252 complete (load 6). Space text reflows as wheel turns ("+1 to a rival you pick who" vs "+1 to a rival"). shot 015/016
- ArrowRight spins a quarter: 295/1044ms 3 bursts (load 6.3). shot 017
## R1 my turns
- First click on Kickback (a hovered space) did nothing; 2nd click placed (load 9). shot 022
- Kickback rival picker opens beside the space (good) but as a row of chip cards over the wheel centre, not by clicking seats. 125px from space. shot 024
- "You took Kickback" toast sits bottom-left (70,655) ~600px from the space I clicked. shot 025
- Kickback coin to P3 flies out off the wheel's left edge (220,477) before landing at P3 seat: path not source→dest. shot 026
- Pass ("Done, no buy") at (1110,165): ~400px from the picker my eye was on; it is in the buy column (house style ok).
- Buy step: wheel spaces still look lit/bright during "recruit or buy" though I can't place → unclear what's available. shot 038
- Snap Up hover "YOU'D GET up to +2●, +1 member (Planner), +1 ♟, next member −2, −4● your pick" — needs decoding; '-4 gold' then the pay dialog defaulted to all-gold. shot 032
- Snap Up: "Click a lit member in the shop" — target is ~550px from the space (560,570)→shop (1110,300). Prompt top-centre, 2 lines + 'Recruit nothing' + 'Undo placement'. shot 034
- Pay dialog: centred modal covering the board; "Faded coins pay. The number under each stack is what you keep." has to be decoded; stacks show what you KEEP not what you pay (inverted). Took 2 clicks on blue stack to swap 2 blue in (one click per coin). Dialog jumps 12px up when warning line appears. shots 035,037
- Shop discount display: struck list price ("10", "6", "8") collides with worth "1" ("101", "61") on Mentor & Protégé, Sponsor, Host, Busker. shot 040
## R1 later / round end
- Bandwagon: face "+1● per recruit by all this round"; hover "+1● per member recruited this round, by anyone" → paid +6 for 5 recruits I counted: the base +1 isn't in the hover sentence. shot 044/046
- Member hovers (Mob, Recruiter, Prospector) never say whether/how I can afford it, only when I can't. shot 047/048
- Shop card shows discounted "2● 4●" for Recruiter; pay dialog says "costs 4● 4●" + "Your discount −2": two different cost statements for the same card. shot 050
- Pay → bots' two turns + the whole round-I reckoning started while I was still on my pay animation; I never saw P3's and P2's last turns happen. shot 055
- Reckoning panel covers the wheel centre (rims visible though); scores count 0→N; overall finished in <12 s; the summary then repeats all 4 quadrants + follower totals that the seats already show. shot 055/056
- Summary: "Round II · 4 minions each · You pick first: fewest followers" good. Followers column duplicates seats. 'Most members' row adds "red members break ties" while others don't need it — fine.
## Round II
- Seats: unplaced minions stand in a 2×2 grid (mine, P4) or 2+1 (P2), not a column (house style). shot 058
- Seats collapse members to two + "+3 more"/"+5 more" — I can't count anyone's members at a glance (counting test fail); Most Members is a scored rule. shots 074,114
- P3 seat "EACH ROUND +6●" label — needed a hover to learn it means Banker (doubled by Underdog); seat hover then repeats it. shot 074/075
- Collect Debts hover: "P3 has 0, P4 has 0, P2 has 0, and +1 goes to the one you pick" while seats showed P3 3 gold, P4 1 gold — wrong numbers + Kickback's gift sentence pasted into a steal. shot 059
- Collect Debts: steal one coin per click on rival stacks (3 clicks); stacks ~575px from the space. Toast "+3● / 3● from P3" says it twice. shots 061-067
- Swap Sides / Even Swap pickers are a grid of chips (house style: pick on the board); P4/P2 rows clip at the bottom of the panel (Sommelier/Social Climber/Tribute Band cut). Chips show no cost, though the rule is cost-based. shots 078,080,108
- Swap toast first says only "You took Swap Sides"; detail ("took P3's Straggler, gave Planner") arrives a turn later. shot 083/085
- Banker swapped to me: card says "Now and at round start, +3●"; rulebook says it pays the moment it joins you; gold stayed 7. BLOCKER-level mismatch. shot 112
- Encore hover lists "Collect Debts (P1)" — 'P1' is me; the board calls me 'You'. shot 088
- Encore pick on the wheel (lit spaces) works well — the one choice that obeys "choose on the board". shot 090
- Open Door hover shows TWO popovers at once (card + small "Open Door (Red)" chip tooltip). shot 115
- Buying followers: 4→4 opens a pay dialog; 8→8 skipped it — inconsistent flow. shots 085,114
- Bot batches: 6 rival turns in ~12 s between my turns, the strip keeps only the last 1-3 lines ("5 earlier... open the log"). shot 098
- Delta "+4●" floats over P2's follower number. shot 098
- Log: left drawer covering seats; hovering names opens card + highlights the space (97-160 ms, 1 burst) — good. Log uses space names (Tithe, Echo, Hum) the board never shows. shot 100/104
- Round II end: reckoning started ~1 s after my last pick; I arrived at "3 of 4". Summary panel has "More below" scroll in a 700px window. "P3 picks first: Front-runner" unexplained. shot 119/120
## Round III / Results
- Hand-pick: hover says "Underbidder: next member costs 2 less" yet shop prices didn't change. 5 s of motion after choosing a free member (Steady, load 13). shot 137/139
- Straggler prompt (after my buy) waits on a small "Stay put" pill top-centre; nothing on the wheel/seat says the game is waiting on me — sat 18 s. shot 171
- Greatest Hits copies only Hum (+3); fine, hover was right. shot 150
- P4 Even Swap took my Big Family: the only rival turn I read instantly (red strip line + my follower drop). shot 162
- "Your turn" header shown while rival member cards are still flying across the board. shot 163
- Delta "+8" floats over P4's resource row; "+86" unreadable. shot 162
- Reckoning R3 (Relaxed): each quadrant ~4-5 s, counts tick up from 0 — legible; Most Members first frame showed all 0s then jumped. shot 173
- Round III summary: "End-game bonuses, still to add to these totals" box then table — two totals (72 vs final 73) for the same player within one click. shot 175
- Results: "Each number opens what it's made of" — hovering/clicking Bought 20 opened nothing. shot 178/181
- Results: player rows say "7 members" while column "Members + you (1)" says 10 (Twins counts 2) — two member counts disagree visually. shot 177
- Results seats at bottom: P2 card reflows ("+3 more" moves) as minions bob.
- Custom setup: to change picks you must first deselect all 4 (full set blocks new picks, no swap); 'Most full sets' (Yellow) undefined; card text 10px grey. shot 189/198
## Custom table / wrap
- Custom R1 reckoning (Steady): ~2.5-3 s per quadrant; quadrant 1 played out during my pass click's settle, so first frame I saw was "2 of 4".
- Pay dialog suggested coins broke my only full set (Yellow quadrant rule) and warned about silver lead instead.
- Trade Seeds warned "Spending yellow gives up your tie for most yellow" though I gave silver.
- Box load stayed 9-15/4 for the whole session; timing re-measure never possible.
