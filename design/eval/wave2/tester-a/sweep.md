# w2a sweep (running notes)

## 1. Home + How to play
- Home: logo wheel slowly rotates; Play on this device primary; online box has its own name field; How to play pill. Click How to play 353 ms first change (loaded box). Esc closes it.
- How to play = rulebook text verbatim, long scroll; no pictures of the board.
## 2. Setup
- Emoji picker opens inline under P1; Start/Back footer floats over the P4 row while picker is open (overlap).
- Name field holds "P1" as a real value, not a placeholder: click + type gives "P1Wren" (6/14). Typed name renders in dim gold, same as placeholder look. "4/14" counter is noise.
- Gold chip under Table: hover opens nothing.
## 3. Start + picks
- Start click: 1442 ms first change, 2066 settle; then an intro cutscene ~23 s of idle motion before Begin (014-idle-frames). Begin 1292 settle.
- Picks screen (016): left seats with "1 of 2 / 2 of 2" chips; shop+wheel visible. Gold pick: first click on Gold (106,490) only previewed?/first click registered after 616 ms; second click needed? (038 vs 040). Bot picks animate ~3.8 s (041).
## 4. First turn
- Header "Your turn — place a minion on a glowing space", steps PLACE / RECRUIT OR BUY. Glowing spaces = cream, unavailable = grey. Squint works.
- Wheel drag: first change 408 ms, input→paint 848 ms, still moving after 6 s (044/045). ArrowRight spin 494 ms first change, 1597 settle (046/047).
- Kickback (+3 gold, pick who gets 1): click on space → NO VISIBLE CHANGE 1.5s reported, then prompt "Kickback: give 1 gold to... Click a rival's cult" (049). Seat hover highlights seat (050). Give → 1182 settle; toast "You took Kickback +3 gold / P3 +1 gold" (051).
- Shop hover popovers anchored left of card; "You're short 2 blue to recruit it." footer. Twins/Intern hover (affordable) show no text at all, just header (081, 087).
- 2→1 hover: "2 resources → 1 follower · Any colors, any mix, as your one buy. Unlimited. You can buy it now." 8→6 hover "8 left at this table (2 per player at the start). You hold 5: 3 short."
- Buy 2→1 = one click, no confirm, 1116 ms settle; then went straight to bot (P2 is shopping...). Hover popover stuck open after click (069).
- Bandwagon hover: "You'd get +6 red", Most members standings. "after Bandwagon" green badges on shop cards when hovering a space (073/074) = preview of affordability.
- Paying Squatter (8 any): pay dialog modal center, coins row + piles, "Colorless here: its 6 magenta is paid in any colors (magenta isn't on this table)" — contradicts card face "8 any" (098). Tap gold pile swaps 1 coin (099). Pay → dialog closes 344 ms.
- My member Squatter hover: text + "Yours", no Use button / state (103). Used automatically by clicking a taken space (Open Door hover: "Taken P3 — you can join it") (112).
- Open Door click: "NO VISIBLE CHANGE within 1.5 s", then auto-pass "Nothing you can afford. Turn passes." toast and round end began without me seeing my Open Door result (115).
## 8. Round I end
- Reckoning: per-quadrant banner bottom-center "ROUND I SCORING · 1 OF 4 · Most gold · Counts the gold you hold when the round ends · P4 wins +2 followers", round badges by each seat with counts. "counting..." state on Most members. Skip button bottom right. ~23 s total (115).
- Summary modal "Round I scored" (114/116): per quadrant winner + standings; player table PRIZES / THIS ROUND / FOLLOWERS; followers count up after modal opens (6→8).
## Round II
- Start round II click: NO VISIBLE CHANGE 1.5 s reported, then seats re-sorted (120).
- Seats re-ordered by turn order (You first). "in 3 ×2" label under P4 rail = snake? unclear.
- Chronicle (log) panel right; names underlined, hover opens space card WITH live "You'd get" for the current state (123) — the log hover for Open Door shows today's preview, not what happened. Squatter log hover = card.
- Log entries read in reverse-chronological order within each round, but round I lists oldest-at-bottom: mixed.
- Middle ring hover: Greatest Hits/Hand-pick show "Opens round III" (126/127). Collect Debts: "Take up to 3 gold from rivals, split however you like", prompt "Collect Debts: take 3 gold · 3 left · Click a lit stack on a rival's cult" with Undo placement. Rival gold stacks glow (136). -1 badge on P4 stack (139). 3 clicks for steal of 3.
- After steal: toast "You took Collect Debts +3 gold / from P2 1 / from P4 2". Buy step: Release... / Pass buttons (141).
- Big Spender bought in 1 click with no pay dialog (auto-paid 3 gold + 1 red) (143). "Undo buy" appeared. Big Spender = Once per round buy twice; "used this round" appears in seat hover even though I never chose to use it (159).
- Release... opens dropdown chips "Squatter +6 any", "Intern +1 red" (146). Release Squatter → choose colors: header chips "All 6 as gold/red/blue/green" + click seat chips one by one (148/150). Wren name in header (only place my name shows).
- Penny Pincher bought one click (154). Bot turns: ~52 s of idle for 3 bots x 2 actions (156).
- Echo: "Copy which rival's space (taken since your last turn)?" lit spaces on board (161). Picked Open House → "Take a face-up member costing 4 or less, free" (163). Toast "Muse: P4 +2 green" (P4's Muse triggered from my echo?).
- Tax Collector click bought instantly (Penny Pincher doubling) and card slid out; next card (Middleman) slid under pointer and opened its hover (168). Header "Your turn again (snake order) — place a minion" + italic subline overlaps seat column: "ROUND II OF 3" collides with cat emoji (170).
