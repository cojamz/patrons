# w3a sweep notes (laptop newcomer, 1270x700), written as I went

Shots: /home/user/patrons/design/eval/wave3/tester-a/shots/ (copied from /tmp/eyes/w3a). Game 1 = Classic table (Gold/Red/Blue/Green), Game 2 = Random 4 (Red/Magenta/White/Silver), round I only.

## Round II / III / results (notes from the later half of game 1)
- Pay picker (125): coin stacks with numbers under, no color labels; "Snap Up: in any colors" footnote; Pay button summarises "Pay 3 gold 1 blue". Tapping a stack moves a coin in; unclear which stack is "in the cost" vs "in my hand". Faded ghost coins above stacks.
- Curator recruit: whole screen re-rendered (62%) on Pay; toast shows "recruited Curator (paid 3 gold, 1 blue)".
- Intern seat hover (129): opens 308px right of pointer; shows "Release: +1 red" button inside the hover. Good, but release lives only in a hover.
- Buy step after Pass in II: header "Your turn again (snake order) — place a minion" + "PLACE · RECRUIT OR BUY" step crumbs. "No moves since yours yet."
- Steal (133-142): Collect Debts header "take 3 gold · 3 left", rivals' gold stacks lit. A "-1" red badge stays on the stack after taking; second click on P4 at a different x did nothing (NO VISIBLE CHANGE). Taking resources snaps; no flight from the rival's seat to mine. Toast lists "from P2 1 gold / from P4 2 gold".
- Hustler (146-149): "Undo buy" next to header; instruction line truncated "Actions there give you +1 gold per ro…"; how to pick the color is not said on screen (I guessed: click a resource dot in my seat; it worked).
- Swap Sides (152-160): "pick yours · then theirs", my members lit, then rivals' lit. Hovering a lit rival member during the choice opened NOTHING (157) — I had to swap blind (I couldn't read what P2's member did). Result: "took P2's Minimalist / gave Intern to P2".
- 2-for-1 follower buy went through with no pay dialog and no confirmation when the mix was unambiguous (163) — header jumped straight to "Your turn again (snake order) — place a minion" with "Undo buy".
- Seat overflow: only 3 member sprites, then "+1"/"+2" tiny grey text (164). Hovering "+1" opened nothing useful; hover on seat lists all members (q12).
- "each round +2 blue" text on seat; its hover "At the start of each round, your members make +2 blue (Curator, Minimalist)" opens next to it. Good.
- Menu (172): How to play / How it works (20s) / The log / Animations Quick-Steady-Relaxed / Copy game record / Leave. Escape did not close the log immediately; it moved 62% of the screen.
- Log (175-179): "ROUND II" list, newest first; names underlined; hovering "Minimalist" opens its card next to the log; hovering "Hum" opens a space card AND outlines the space on the wheel. Good. But "P3 uses Squatter." etc. reads fine. Log covers the seats entirely.
- Round II summary (183/184): rule rows with leader + prize chips, then a PLAYER/PRIZES/THIS ROUND/FOLLOWERS table; "Round III · 5 minions each · P2 6 · P3 picks first" — "P2 6" is undecipherable.
- Round III: center spaces "Redo all your spaces", "Buy 3 times this turn", "Double your gold", "Free recruit any member". Hover of Greatest Hits says "nothing right now" when I had no spaces yet. Double Down hover "You'd get +6 gold, WHY Hustler: +3" good.
- Hover rival members in seats (seats3): Tribute Band / Squatter popover anchored to the sprite. Good. Hovering P4's & my member sprites at round III sometimes opened nothing (199/200).
- 10->10 buy hover (214): "10 resources -> 10 followers. Any colors, any mix, as your one buy. Unlimited. Choose how to pay". Pay dialog (216) shows a follower glyph as the "card" art; Pay 7 gold 2 blue 1 green.
- 8->6 buy: auto-paid, no dialog, no undo seen; bots started immediately; header said "Choose how to pay …" during P3's turn (224) and a stray blue dot floated over "ROUND III OF" text.
- Kickback gift (234): "Kickback: give 1 gold to... · Click a rival's cult"; all rival seats outlined. Good, on-board pick.
- Free recruit cost 4 or less (240): auto-picked Crowd-Pleaser with no choice (only one fit?), no confirmation.
- Round III scoring (242/243): banner "ROUND III SCORING · 2 OF 4 / Most members / Counts the members you hold (a card that counts as 2 members counts 2); red members break ties." covers top of wheel and the rim it scores; numbers in white circles beside seats; "+6" token flies; P2 swapped my Big Family away in its last turn; "since your last turn" highlights that row.
- Round III scored (244): "End-game bonuses: none this game."; You "-1 from new members" (negative "new members").
- Results (246): "P2 won by 17, mostly by buying followers (+32), then from the rims' prizes (+32; Most members two rounds of three, +10)" (two equal +32s, "mostly ... then"). Column "From members" has a follower glyph only there. Footnote mentions "raids" (not a rulebook word). Home screen afterwards has a "Last game's results" pill in the slot where "Play on this device" used to be — I mis-clicked into results again.

## Game 2 (Random 4: Red, Magenta, White, Silver)
- Setup (255): Random 4 shows "Reroll" + 4 dots. White and Silver dots both pale grey.
- Board (258-260): "any" split dot is now red/magenta/white/silver: at size it reads as a pinkish-grey blob that looks like magenta. White resource dot is a cream ring that reads as an empty circle ("+2○" reads "+2 nothing"). On the dark round-II ring, white vs silver vs any are indistinguishable. "MOST WHITE" and "MOST SILVER" rims are both grey.
- Pick (258): this time I picked FIRST (seat at top), "Pick 1 of 2" card with 4 dots "Red +1 / Magenta +1 / White +1 / Silver +1".
- Redistribute steal (276-279): only P3 lit (richer), "1 each from P3. Click a lit stack". Took white, arrived as magenta. Snap, no flight (1 changed frame).
- Lie Low hover (286): "You'd get +1 magenta / rivals −1 to 0 red, −1 to 0 white, −1 to 0 silver in all" — undecipherable; line break orphans the ")" after the dot; rim line "Most magenta members: If you take it: You 1 … you'd lead it (+2)" is about members, not this space's gain.
- Benefactor/Mole/Lookout/Insider (shop3, sfbn): "You're short 3 silver 1 any to recruit it" — the any dot and the magenta dot look the same.
- No member with a "Use" button appeared in either shop during my game; I could not exercise "use a member" (P3's log shows "P3 uses Squatter", so it exists).
