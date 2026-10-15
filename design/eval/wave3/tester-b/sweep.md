# w3b sweep (strategist, 3 Hard bots, Random 4) — running notes

Harness note: the scratchpad dir is shared with tester w3a; my first helper script was overwritten by theirs, so one Escape and one click (635,331) of mine landed in w3a's browser at ~08:17. Fixed with a uniquely named helper.

## Home / How to play
- How to play opens as a modal over home; click → first change 128 ms (SLOW >100), settled 577 ms. shot 002-click.png

## Setup
- Table picker: quadrant names have no hover; Custom tiles show only the scoring rule, so "which quadrant steals" can't be learned at setup (Magenta known only from rulebook). shots 013, 014, 015
- "Bot speed: Slow/Normal/Fast" vs taste's "Steady" default — naming mismatch. shot 010
- Typed name "Vera" never appears; seat says "You". shot 039
- Begin (after intro) 814 ms first change, 1492 settle. Intro frame 1 flashes the game board before the intro. shot 037
- Intro copy "to gain influence and followers" — "influence" is not a game word.

## Starting pick
- Pick panel bottom-left, cream, glowing: decent CTA but sits under seats far from the eye; header repeats "(1 of 2)" and panel "Pick 1 of 2" (duplicate). shot 039
- After my 2nd pick, all 3 bots' picks and 3 placements ran inside ~4.5 s; I never saw the bots' starting picks. shot 066/068
- Toast "P2 took Sob Story" stays up while P4 and P3 are already moving (stale narration). shot 068

## Round I, my turns
- Kickback hover "You'd get +3, rivals +1 in all"; "MOST GOLD If you take it: You 4 · P2 3" silently assumes the gift goes to P2. shot 071
- Intro Offer / Cheap Seats hovers show MOST GOLD / MOST WHITE projection lines that the space doesn't touch (noise). shot 073/077
- Your Call: hover says "Per round number: +1 or +2" — panel shows fixed "+1 or +2". "Per round number" is jargon. shot 075
- Cheap Seats panel shows "1 for 1, up to 2" AND sometimes "2 · 4 · 6 by round" (line appears/disappears between states). shots 077 vs 119/122
- Lie Low hover: orphaned ")." wraps to its own line; "rivals −1 to 0●, −1 to 0●, −1 to 0○ in all" undecipherable. shot 079
- Redistribute hover: "about +3", "−3 to −1●" range notation. shot 105
- Roll Call panel "per minion out" vs inner "per minion left": out/left easy to confuse. shot 085
- Gift choice: rival seats get a thin outline only; header says "Click a rival's cult". Weak CTA. shot 088
- Pay dialog: centered modal, 4 unlabeled columns, white/magenta columns show no dot, ghost vs solid coins swap meaning after a tap. shots 097, 098, 100
- Robin Hood: clicking the card recruited instantly with no pay dialog (forced payment) — no confirmation, no undo visible at once. shot 117
- Header "Choose how to pay ···" during a BOT's pay step, with no name: reads as an order to me. shot 117
- Steal: lit stacks on rival seats = good direct manipulation; P2's "already gave" tooltip clipped at the top edge of the window. shot 111
- Last placement of round I: only Cheap Seats left and I had 0 resources: "nothing right now" — dead turn for last seat. shot 121
- Spin by drag: works, momentum, 4.0 s to settle; arrow keys rotate 90°, ~1 s. Text stays upright. shots 122-125
- Taken spaces: minion sprite sits on top of the space text (e.g. "Steal 1 each" half-covered). shot 125

## Round I end
- Reckoning: banner jumps between top and bottom of the wheel per quadrant; count badges by seats; +2 chips fly. Narratable, ~10 s. shot 128
- Summary: "P2 2  P4 2" reads as "P22 P42". shot 130

## Round II
- Round start: wheel lights up ring II with all panels readable; seat order resorted (You first, now/next/in 3 twice). Start round click → 1408 ms first change. shot 132
- Ring II panels I misread before hovering: "Ransom a member" (thought: pay to get a member back; it's Shake Down: rival pays you its cost or you take it); "2 extra turns for 8●" (thought it costs 8 per turn); "+1● +2 per rival with more minions" (thought "on the board" meant placed minions — it does). shots 134-148
- Shake Down hover: "YOU'D GET it depends on your pick / a rival decides part of it" — honest but empty. shot 134
- Crime Wave hover: "about +3●, +2 followers / rivals −2 to 0●, −3 to 0●, −2 to 0○, −2 to 0● in all" — unreadable range soup. shot 136
- Dividend/Sell High: "loose follower" underlined, decent. Sell High's MOST WHITE line lists P2 1 · P3 1 · You 0 with no "you'd lead it" — inconsistent tail across hovers.
- A click on a space while its hover was open did nothing (first click eaten), second click placed. shots 180, 182
- Shake Down choice: lit members on rival seats, but hovering a lit member opens nothing → you ransom blind (don't know name or cost). shot 185
- Ransom resolved with no visible motion (NO VISIBLE CHANGE 1.5 s, frames: nothing moved), toast never names the member. shot 187
- Collect Debts: stack keeps showing the old count ("3") with a "−2" badge while pending. shot 196
- Collect Debts hover promised "+2 followers (Robin Hood)" but the steal choice never marks which rival is the follower leader; I picked P3 and got 0 followers. shot 202
- Middleman: one click recruited and auto-spent 3 gold + 1 magenta, no pay dialog (Big Spender earlier opened one). Inconsistent. shot 206
- Seat body hover: nothing; only the name row opens the seat card. Seat card lists members + abilities, says HARD BOT. Follower number has no breakdown. shots 172, 176
- Header "P4 is placing a minion ···" persisted while P3 and P2 took their turns (seat "now" marker moved; header didn't). shot 208
- "Since your last turn" strip clips its oldest entry mid-sentence ("Apprentice for 2●" orphan, "−2 · bought 3" orphan). shots 209, 217
- Toast "You took X" lingers through all three bot turns. shot 208
- Log: newest-first, cause listed below its effect (You stole 2 above You took Redistribute). Names open cards and highlight the space on the wheel (good). Log wording "+1● each time P2 takes a Gold space" vs card "per round number". Hustler's chosen color shown only in the log. shots 219, 221, 223
- Round II reckoning: same choreography; seat count badges; readable. Summary arithmetic checks out. shot 228, 229
