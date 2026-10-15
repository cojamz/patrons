# Outcome ledger (tester B)
| # | Space | Expected (face+hover, my situation) | Got (seat/log) | Match? |
|---|---|---|---|---|
| 1 | Bandwagon (red outer, "+1● per recruit by all") | +3 red (3 recruits this round) ; me 1r1b -> 4r1b | | |
| 1 | (result) | | red 1->4 (+3), toast "You took Bandwagon +3●" | MATCH |
| 2 | Recruit Big Family (buy) | cost 2●red + 2 any; worth 3 followers -> 1->4 followers; I have 4r 1b | | |
| 2 | (result) | | paid 3r+1b (after swapping blue in), followers 1->4, Big Family icon in seat | MATCH |
| 3 | Kickback (gold outer "+3● pick who gets 1") | me +3 gold (0->3); one rival I pick +1 gold | | |
| 3 | (result) | | me gold 0->3, P2 gold 0->1; rival picked by clicking seat (outlined) | MATCH |
| - | Pass without buying #1 | turn ends, nothing spent | | |
| - | (Pass #1 result) | | turn ended, nothing spent; Pass sat top-center (840,24), ~350px from shop where I was deciding | MATCH |
| x | (rival) P2 Even Swap took my Big Family (3 followers), gave me Sommelier (1) | not announced as a "you lost" moment beyond a highlighted log line; log doesn't say what I received | followers 4->2 | note |
| 4 | Intro Offer ("Save 4 on next member") | next member costs 4 less, off any part | | |
| 4 | (result) | | toast "next member costs 4 less"; shop says "9 you can afford" but card faces/hovers still show undiscounted costs | MATCH (display gap) |
| 5 | Recruit Squatter (8 any) with -4 | pay 4 (3g+1r) -> 0 left; followers 2->3 | | |
| 5 | (result) | | Clicking Squatter recruited it at once with NO pay dialog and no confirmation: all my 3g+1r went; turn & round ended immediately. Followers 2->3 | MATCH, but no confirm (lost gold lead to it) |
| 6 | Collect Debts (gold mid, "+3● from rivals") | face says +3; hover "You'd get +1●, rivals -1●" (only P2 has 1 gold) -> me +1g, P2 -1g | | |
| 6 | (result) | | title said "take 3 gold · 3 left" though only 1 existed; clicked P2's lit gold stack; me +1g, P2 -1g; toast "+1● from P2 1●" | MATCH to hover, MISMATCH to face (+3 shown, 1 possible) |
| - | Pass without buying #2 | 0 affordable; pass | | |
| 7 | Swap Sides (red mid "Swap a member") | swap my member for a rival's costing ≤ mine+2; plan Sommelier(4,1f) for P2's Big Family(4,3f): me 3->5, P2 12->10 | | |
| 7 | (result) | | picked my Sommelier (tiny 25px icon) then P2's member - NO hover in pick mode so I couldn't confirm it was Big Family; toast "traded Sommelier for P2's Big Family +2 / P2 -2"; me 3->5, P2 12->10 | MATCH |
| 8 | Squatter effect: join Crescendo (taken by P4) "+2● per round number" | hover "You'd get +4● ... Taken P4 — you can join it" -> green 0->4 | | |
| 8 | (result) | | green 0->4 (ticked 2,4 at Relaxed), toast "You joined P4 on Crescendo +4● used Squatter". Squatter never glowed, no "Use" button, no state | MATCH |
| 9 | Buy followers 2->1 | pay 2 any (I have 1g 4gr) -> followers 5->6 | | |
| 9 | (result) | | pay dialog suggested 1g+1gr; followers 5->6 | MATCH |
| 10 | Half Price ("Half-price recruit as your buy") -> Choir (4gr+2any=6) | half = 3, any colors; pay 3 green; followers 6->7; uses my buy | | |
| 10 | (result) | | Choir paid 3 green automatically with no pay dialog; followers 6->7. Round ended instantly (last minion). Lit shop cards never showed the halved price | MATCH (no price preview) |
| x | Round II summary | P2 row "THIS ROUND —" though P2 lost Big Family (-2 followers) to my swap; losses not shown | | MISMATCH (summary) |
| 11 | Golden Years (gold outer "+6● 2·4·6 by round") | +6 gold (0->6) | | |
| 11 | (result) | | gold 0->6 | MATCH |
| 12 | Recruit Penny Pincher (4 gold) | pay 4g -> 2g left; followers 7->8 | | |
| 12 | (result) | | instant recruit, no pay dialog; gold 6->2, followers 7->8 | MATCH |
| 13 | Echo via Squatter (taken by P4) -> copy Crescendo | Crescendo gave P3 +6 green; + Choir +1 green => +7 green (0->7) | | |
| 13 | (result) | | green 0->7 (+6 copy, +1 Choir), toast lists both | MATCH |
| 14 | Buy 8->6 followers ("8 left") | pay 8 any (2g+6gr) -> followers 8->14 | | |
| 14 | (result) | | dialog pre-suggested 2g+6gr; followers 8->14, "7 left" | MATCH |
| 15 | Tithe ("+1● per member") | 4 members -> +4 gold (0->4) | | |
| 15 | (result) | | gold 0->4 | MATCH |
| 16 | Penny Pincher price effect (Extra Hand 10 any) | 4g counts 8 + 1gr = 9 -> short 1 | hover "You're short 1" | MATCH |
| 17 | Buy 4->3 followers | pay 4 -> followers 14->17 | | |
| 17 | (result) | | dialog suggested 3g+1gr; 14->17. (Later P2 Swap Sides took Big Family again: 17->15) | MATCH |
| 18 | Open Door ("Free recruit the cheapest") | hover "+1 follower, +1 member" -> Crowd-Pleaser (cost 2, cheapest); 15->16 | | |
| 18 | (result) | | Crowd-Pleaser recruited free, 15->16 | MATCH |
| 19 | Greatest Hits ("Redo every space") | hover "+10●, +3● (Choir +1)" — I expected Golden Years 6 + Tithe 5 (now 5 members) = 11g; Open Door repeat unmentioned | | |
| 19 | (result) | | +10 gold, +3 green (Choir x3). Matches hover; Open Door's free recruit silently not repeated (no explanation on face/hover) | MATCH to hover |
| 20 | Recruit Extra Hand (10 any, Penny: gold counts double) "+1 minion in round III" | pay e.g. 5g (=10) ; get a 6th minion now? followers 16->17 | | |
| 20 | (result) | | Pay dialog revealed hidden "6 purple paid in any colors" (card face just "10 any"); paid 4g(x2)+2gr; followers +1. The +1 minion in round III NEVER came: bots finished, round ended, no 6th placement. | MISMATCH (paid 10 for an ability that couldn't fire) |
| 19b | (log, after game) | Greatest Hits also tried to repeat Open Door: log "You copied Open Door: a member (≤2; none face up)" — hover never said Open Door would be "≤2", and original Open Door said "the cheapest" | | MISMATCH (rule differs on repeat, hidden) |
| x | P2 Kickback gave me +1 gold: only in log | | | note |
| C1 | Toast (silver "+3● others get 1") at QUICK | me +3 silver (0->3), each rival +1 silver | | |
| C1 | (result) | | me silver 0->3; P4, P2, P3 each +1 silver; toast lists each | MATCH (face omits "per round number" scaling) |
| - | Pass #3 (custom) | | | |
| x | unexplained +1 white arrived on my seat during bots' turns (1->2); no log line names me | | | MISMATCH (unattributed) |
| C2 | Sob Story ("+2○ +1 per player ahead") at STEADY | +5 white (2->7) | | |
| C2 | (result) | | white 2->7, ticks one by one | MATCH |
| C3 | Recruit Dowager (2 silver + 2 any, worth 3) paying mix silver+white | followers 1->4 | | |
| C3 | (result) | | Pay dialog SUGGESTED 3 silver + 1 yellow (my whole Most-silver lead and only yellow) while I held 7 white; swapped 2 white in by clicking stack (2 clicks). Followers 1->4 | MATCH (bad default) |
| C4 | Cheap Seats ("Buy followers 1 each, up to 2") at RELAXED | spend 2 white -> +2 followers (4->6) | | |
| C4 | (result) | | picked white on my seat twice; white 5->3, followers 4->6; toast itemizes | MATCH |
| - | Pass #4 | | | |
| C5 | Rising Tide ("Gain silver half the richest") at RELAXED | face: gain half richest (5->3). Hover adds hidden gift "everyone else +1 silver" first (richest becomes 6 -> +3). me 2->5; each rival +1 | | |
| C5 | (result) | | me silver 2->5; P3,P4,P2 +1 each | MATCH to hover; face hides the gift |
| C6 | Good Deed ("+4● a rival gets 2") at QUICK | me silver 5->9; pick P3, give 2 yellow | | |
| C6 | (result) | | me silver 5->9; gift: clicked yellow chip ON MY SEAT (looks like paying from my stash) then P3 seat; P3 yellow 0->2, my yellow unchanged 1 | MATCH (gift from bank, but the pick reads as spending mine) |
