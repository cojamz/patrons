# w4b sweep notes (laptop 1270×700, 3 Hard bots, Random 4: Yellow Magenta Green White)

## Home / How to play / setup
- Home clean; How to play is a long scroll modal (Close top-right, Esc works, 113 ms).
- Setup: Random 4 rolled tables include both Yellow and Gold (one roll: Yellow Red Magenta Gold) — near-identical dots.
- Setup color chips: hover opens nothing; no way to learn what a quadrant does before starting.
- Start → intro: 496 ms to first paint. Intro shows pizza emoji leader, but setup gave me the caterpillar. Intro wheel puts names (KICKBACK, HUM) on panels; game does not.

## Starting pick (028-game0)
- "Pick 1 of 2" card sits in the wheel centre: obvious CTA. Covers ring II/III text.
- Shop hovers: 150–220 ms to first change, 370–590 to settle. Popover side varies (left, above, below): Accomplice's opens above and covers the card row; Light Fingers' below-ish.
- Deck (56) hover opens nothing.
- Front-runner hover: italic "Colorless here: it counts as a member of no color" — jargon.

## Round I, first turn (056-afterpick)
- After my 2nd pick the three bots picked and placed 3 minions (~5 s) before I could act; seats reordered under me (I went from top to bottom) mid-chain. 
- Turn rail labels "in 4 again", "now again": decipher fail at first; reads like a typo. Means "you go now, and again right after".
- Space hovers: 220–480 ms to first change, 530–960 ms settle (slow; bar is "at once").
- Panel guesses vs hover: "+2● from rivals" = Help Yourself steal (right). "Steal 1 each from rivals with more resources" (right). "Steal 1 then safe from steals" = Lie Low (right). "+1● +1 per other color" = Harvest (right). "+1● swap up to 3" = Trade Seeds, swaps happen first then +1 (order reversed on panel). "+2○ +1 per rival with more 👤" (right). "Trade for followers 1 for 1, up to 2" (right for round I; hover says it scales 4/6). "Copy a space a rival just took" = Echo, but hover says "since your last turn", not "just".
- Redistribute hover "You'd get about +3●" — "about" is vague when the rule is deterministic.
- Echo popover opens 300 px up at the top of the wheel, covering the ring and rim leaders; Help Yourself popover covers "Copy a space".
- Echo hover outlines the copyable spaces (Top up got a gold outline) — good.

## Round I play
- Redistribute: click a lit stack on each rival. Clicking P3 a 2nd time pops "Redistribute takes 1 from each richer rival, and P3 already gave theirs" — at the very top edge, clipped by the viewport (079-frames). Click→first change 173–440 ms; each take settles ~1 s.
- Prompt "Redistribute: take 3 · 3 left" says the count twice.
- "You took X" toast bottom-left is the largest text in the left column and stays up; it grows into a receipt (+3●, 1● from P2…) — useful but duplicates the log strip just above it.
- Kingpin bought in one click (auto-paid). Safecracker (2● + 2 any) also auto-paid with magenta: no chance to choose which resources pay "any" (no pay step seen).
- Placing Help Yourself: 394 ms to first change, settled 3.7 s.
- Trade Seeds (only space left): auto-picked my only resource to give; title truncated "Trade Seeds: 1 ● for 1 of..." with an ellipsis; "Swap nothing" button sits inside the title line.
- Bot turns: ~0.6–0.8 s per step; 3 bots' place+buy took ~5 s; the log strip + seat change were followable, wheel minion drops readable. Steal by P4 (Lie Low) took from me — my magenta drop was visible in the seat but no flight from my seat to P4 I could see.
- Round-end Reckoning: one quadrant at a time, card in wheel centre names rule + "P2 wins +2 followers", chips beside seats show each count. Legible. ~1.3 s per quadrant.
- Round I summary: clear table, "P3 picks first: Front-runner" explains the override. But nothing in it hovers (Front-runner name, prize chips) — 0 ms, no change.
- Rival read after round I (screen only): P3 dino = green/white engine (Lender, Front-runner), leads green+white, 7. P2 ghost = yellow sets (Gardener). P4 santa = buys followers, Lie Low. I could tell members by the tiny portraits in seats only by hovering.

## Round II start — hover sweep 2
- Order shown: P3 (Front-runner), P4, P2, You — matches rule (fewest first, tie → later). The rail hover explains it in a long run-on ("Places in 4 turns after you twice, P2, P4, then again right after…").
- Seat hover (mine and P3's): opens nothing (NO VISIBLE CHANGE). Cory's call: a seat's hover lists that player's members with state. Missing.
- Kingpin portrait in my seat: 975 ms before anything changed; popover then not in the settled shot.
- Safecracker hover: "USE" chip + "Nothing to gain now… found no magenta worth taking" + a "Use: +0" button. A +0 button you can press is noise.
- Ring II panel guesses vs hover: "A rival's member or its cost" = Shake Down: the RIVAL chooses to pay or give, and only members costing ≤4 — panel implies I choose; misread. "+1 per member in its own color" (right). "+3○ per follower sold" (right; hover adds "up to 2" and "loose"). "+1○ per 👤 bought or won" (right). "+1 each other color per 3●" (right). "Copy a space taken this round" (right). "+2● copy a space you took" (right). Inner "+1 each per full set" — hover says "+1 of each OTHER color per full set": panel drops "other".
- Shake Down hover "You'd get +4 likely / +1 member, +1 👤 at best" — reads like a forecast table, hard to parse.
- Sell High hover "+6○, −2👤 your best pick … You'd have 0 to 6, and could lead it (+4👤): it depends on your pick" — dense.
- Encore hover outlines copyable spaces (good) but its "You'd get about +5" is vague.

## Round II play
- Shake Down: lit members on rival seats, click one (direct manipulation, good). Hovering a lit member opens its card over the rival's name and score. P3 paid 4 → dots flew P3 seat → my seat (readable, ~1.4 s).
- Crime Wave / Redistribute: clicking a rival who already gave pops "…already gave theirs" — once at the top edge clipped (y≈0), once off the left edge of the seat column (x≈40), overlapping the next seat (173-rd2). Red "−1" badges on the robbed stack: good.
- I aimed at P2 by memory and hit P4: seats keep turn order, which changes each round, so the same rival moves rows between rounds — I mis-clicked twice.
- P2 seat grew an "EACH ROUND +1● +1● +1● +1○" strip mid-round — useful (hover explains Gardener), but it appears with no cue, and a P2 strip under the name competes with members.
- Every buy I made (Kingpin, Safecracker, Grifter, Crew, 2→1, 4→3) auto-paid in one click. Never saw a pay step even with "any" in the cost (I only held magenta). 1 click per buy: good.
- Safecracker in my seat gets a gold ring when usable + header "…or use Safecracker first"; its hover has a dark "Use: +1●" button. Clear. Earlier (round II start) it showed "Use: +0" with "Nothing to gain now" — button shouldn't be there.
- Kingpin hover in seat: "Release: +2●" chip — release is findable only by hovering each member.
- Toast "You took Crime Wave" stayed through the whole following bot sequence (~10 s), stale.
- The round-end reckoning played while I was waiting (no call to action between my last buy and the scoring); followers "+4/+5" marks float up and clip at the top edge (186-idle-frames frame 2).
- Round II summary: "THIS ROUND" column wraps to 2 lines ("−1 from members that left") — cramped; still no hovers.
- Rival read after round II: P3 = green engine (Hum/Reprise, Mime, Lender), 13. P2 = white + full sets (Gardener, Peddler), 9. P4 = Lie Low / follower trades, weakest (6). I could tell "who leads what" from rim emojis instantly; could NOT tell rivals' members without hovering each 30 px portrait.
