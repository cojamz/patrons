# R2 decipher test: panel lines vs the real rule (2026-10-15)

Each panel says at most three lines (Cory: "+resource / secondary effect / clarification", no pictures). The
lines live in `src/v4/game/panelText.js`. For every action on the Classic table and the other spheres, I read only
the panel's lines and wrote what a newcomer would think, then compared it with the rule text. Line 3 shows only where
every panel of that quadrant's ring has room (at 1270×700 it usually doesn't), so each panel has to make sense from
lines 1 and 2 alone. Line 3 and the full rule are always in the hover.

● is the resource dot and 👤 the follower mark. Values are for round II.

| Sphere | Action | Line 1 | Line 2 | Line 3 | A newcomer reads | Real rule | Verdict |
|---|---|---|---|---|---|---|---|
| Gold | Kickback | +3 ● | pick who gets 1 | | I get 3 gold; I choose someone to get 1 | +3 gold, and +1 gold to a player you choose | ok (was "a rival gets 1": who picks? fixed) |
| Gold | Golden Years | +4 ● | | 2 · 4 · 6 by round | 4 gold now, more later | +2 gold per round number | ok |
| Gold | Intro Offer | Save 4 | on next member | | my next member costs 4 less | next member costs 4 less | ok |
| Gold | Collect Debts | +3 ● | from rivals | | take 3 gold from rivals | take up to 3 gold from rivals, split as you like | ok |
| Gold | Tithe | +1 ● | per member | | 1 gold per member I have | +1 gold per member you have | ok |
| Gold | Double Down | Double your gold | | | double my gold | double your gold | ok |
| Red | Even Swap | +1 ● | swap a member | with a rival, equal cost | 1 red, and swap a member with someone | +1 red, swap one of yours for a rival's of equal cost | ok (equal cost in line 3 / hover) |
| Red | Bandwagon | +1 ● | per recruit by all | this round | 1 red per member anyone recruits | +1 red per member recruited this round, by anyone | ok (was "per recruit": mine only? fixed) |
| Red | Open Door | Free recruit | the cheapest | | recruit the cheapest member free | recruit the cheapest face-up member, free | ok |
| Red | Open House | Free recruit | cost 4 or less | | a free member costing 4 or less | a face-up member costing 4 or less, free | ok |
| Red | Swap Sides | Swap a member | with a rival | theirs can cost 2 more | trade one of mine for a rival's | swap for another player's costing up to yours +2 | ok |
| Red | Hand-pick | Free recruit | any member | | any member, free | any face-up member, free | ok |
| Blue (classic) | Tide · Swell · Flood | +3 ● · +5 ● · +8 ● | | | that much blue | +3 / +5 / +8 blue | ok |
| Blue (classic) | Current · Shoal · Harbor | +2 ● +1 ● (etc.) | | | two colors | +2 blue +1 red, etc. | ok |
| Green (classic) | Sprout … Bloom | +3 ● … +8 ● | | | as written | as written | ok |
| Yellow | Harvest | +1 ● | +1 per color held | other colors | 1 yellow plus 1 per color I hold | +1 yellow, plus 1 per other color you hold | ok (was "+1 per color": of what? fixed) |
| Yellow | Top Up | Top up | +1 of your fewest | | 1 more of what I have least | +1 of each color you hold fewest of (ties: all) | ok |
| Yellow | Trade Seeds | +1 ● | swap up to 3 | for other colors | swap 3 resources, get 1 yellow | swap up to 3 for other colors, then +1 yellow | ok |
| Yellow | Branch Out | Gain each color | per 3 ● | | 1 of each color per 3 yellow | +1 of each other color per 3 yellow (keep it) | ok |
| Yellow | Potluck | Members pay out | 1 of their color | | each member gives me 1 of its color | each member brings 1 of its color | ok |
| Yellow | Bumper Crop | Gain each color | per full set | | 1 of each color per set I hold | +1 of each other color per full set | ok |
| Blue (market) | Snap Up | +2 ● | then recruit | in any colors | 2 blue, then I can recruit | +2 blue, then you may recruit now, any colors | ok |
| Blue (market) | New Faces | +2 ● | refresh the shop | | 2 blue and new members in the shop | +2 blue, sweep the face-up row | ok |
| Blue (market) | Name Drop | +1 ● | +1 per blue on sale | members in the shop | 1 blue, +1 per blue member for sale | +1 blue, +1 per blue face-up member | ok (was "+1 per blue": blue what? fixed) |
| Blue (market) | Half Price | Half-price recruit | as your buy | | recruit at half price instead of buying | as your buy: a face-up member at half cost, any colors | ok |
| Blue (market) | Show Off | Gain blue | half your priciest | member's cost | blue worth half my priciest member | blue = half your priciest member's cost | ok (was "half your top cost": jargon, fixed) |
| Blue (market) | Spree | Buy 3 times | this turn | | three buys this turn | buy 3 times this turn | ok |
| Magenta | Help Yourself | +3 ● | from rivals | 2 · 3 · 4 by round | take 3 from rivals | take 2/3/4 resources from rivals, they arrive as magenta | ok (the color change is in the hover) |
| Magenta | Redistribute | Steal 1 each | from richer rivals | | 1 from each rival richer than me | 1 from each rival holding more resources | ok |
| Magenta | Lie Low | +1 ● | from a rival | then you're safe | take 1, then I'm safe | take 1; no one can steal from you this round | ok |
| Magenta | Crime Wave | +3 ● | from rivals | at least 1 each | take 3 from rivals | take 3, at least 1 from each | ok |
| Magenta | Shake Down | Ransom a member | they pay or lose it | costing 4 or less | a rival pays for their member or I take it | they pay its cost to keep it, or it's yours (cost ≤ 4) | ok |
| Magenta | Poach | Take a member | from any rival | they recruit free | steal any rival's member | take any rival's member; they recruit one up to its cost, free | ok |
| Purple | Clock In | +5 ● | | 4 · 5 · 6 by round | 5 purple | +4/+5/+6 purple by round | ok |
| Purple | Catch Up | +1 ● | +2 per rival ahead | in minions out | 1 purple, 2 more per rival ahead | +1, +2 per rival with more minions on the board | close: "ahead" is in minions (line 3 / hover) |
| Purple | Roll Call | +1 ● | per minion out | | 1 per minion I have on the board | +1 per minion on the board, this one included | ok |
| Purple | Plan Ahead | +1 ● | per minion left | | 1 per minion still to place | +1 per minion left to place this round | ok |
| Purple | Overtime | 2 extra turns | for 8 ● | can't pay? +3 ● | pay 8 purple for 2 turns | pay 8: 2 extra turns; if you can't, +3 | ok |
| Purple | Crunch Time | Extra turns | spend all purple | 1 per 4, plus 1 | spend my purple for turns | spend all: 1 turn per 4, plus 1 (up to 2); under 4, +4 | ok |
| Silver | Toast | +6 ● | others get 1 | 3 · 6 · 9 by round | 6 silver, everyone else 1 | +3 per round number, everyone else +1 | ok |
| Silver | Goody Bags | +2 ● | +2 of a color | others get 1 of it | 2 silver and 2 of a color I pick | +2 silver, +2 of another color, others 1 of it | ok |
| Silver | Good Deed | +4 ● | a rival gets 2 | | 4 silver, a rival gets 2 | +4 silver; a rival you choose gets 2 of a color you choose | ok |
| Silver | Sweet Talk | +4 ● | trade silver | others get 1 ● | 4 silver, then trade silver | +4, then swap silver for one other color 1:1; others +1 | ok |
| Silver | Rising Tide | Gain silver | half the richest | others get 1 | half of the richest rival's silver | others +1, then half the richest rival's silver | ok |
| Silver | Hold Court | +1 👤 | per 2 ● | others get 2 ● | a follower per 2 silver | 1 follower per 2 silver held (keep it); others +2 | ok |
| White | Sob Story | +2 ● | +1 per player ahead | in followers | 2 white, +1 per player ahead of me | +2, +1 per player with more followers | ok |
| White | Cheap Seats | Buy followers | 1 each, up to 4 | | buy up to 4 followers at 1 resource each | trade up to 2 per round number, 1 for 1 | ok |
| White | Your Call | +2 👤 | or +4 ● | | 2 followers, or 4 white | per round number: +1 follower or +2 white | ok |
| White | Sell High | Sell followers | 3 ● each | up to 2 | sell followers for 3 white each | sell up to 2 loose followers for 3 white each | ok |
| White | Dividend | +1 ● | per loose 👤 | | 1 white per loose follower | +1 white per loose follower | ok ("loose" is the rulebook's word) |
| White | All In | Cash in | all for followers | 1 for 1 | turn all my resources into followers | trade all for followers 1:1 (white optional) | ok |
| Green (echo) | Hum · Crescendo | +3 ● · +4 ● | | 2 · 4 · 6 by round | as written | as written | ok |
| Green (echo) | Echo | Copy a space | a rival just took | | do what a rival just did | copy a space a rival took since your last turn | ok |
| Green (echo) | Encore | Copy a space | taken this round | | copy any space used this round | copy any space taken this round | ok |
| Green (echo) | Reprise | +2 ● | and redo a space | one you took this round | 2 green and repeat one of mine | +2 green, copy one of your spaces this round | ok (was "copy yours": yours what? fixed) |
| Green (echo) | Greatest Hits | Redo every space | you took this round | | repeat all my spaces this round | copy every space you took this round | ok (was "Copy all yours", fixed) |

Fixed after the read: Kickback, Bandwagon, Harvest, Name Drop, Show Off, Reprise, Greatest Hits. Left close: Catch Up
("ahead" means more minions out; line 3 and the hover say so).

## Wave-2 re-check (design pod, 2026-10-15, after tester B's #2, #24, #36, #52)

Tester B (design/eval/wave2/tester-b/report.md) placed on "Gain each color" holding no full sets and got nothing, and read "Take a member" as a free shop recruit. The cause: a condition that decides the gain sat in line 3, which drops whenever the ring has no room, and on the center ring line 2 drops too (the panel falls back to line 1 alone). The rule now: a deciding condition is never only in line 3, and on the center ring it lives in line 1. Every action of every sphere was re-read from its lines alone (round II values), rendered on two tables in rounds I and III at 1270×700 (no clipping, every panel fits).

Changed:

| Sphere | Action | Line 1 | Line 2 | Line 3 | A newcomer reads | Real rule | Verdict |
|---|---|---|---|---|---|---|---|
| Yellow | Bumper Crop (center) | +1 each per full set | other colors | | 1 of each color for every full set I hold | +1 of each other color per full set you hold | ok (was "Gain each color": the condition was lost) |
| Yellow | Branch Out | +1 each other color | per 3 yellow | | 1 of each other color per 3 yellow | +1 of each other color per 3 yellow you have | ok (was "Gain each color") |
| Yellow | Harvest | +1 ● | +1 per other color | you hold | 1 yellow, plus 1 per other color I hold | +1 yellow, plus 1 per other color you hold | ok ("other" moved out of line 3) |
| Magenta | Lie Low | Steal 1 | then you're safe | from steals this round | steal 1, and then no one can steal from me | take 1 from a rival; no one can steal from you this round | ok (was "+1 ● from a rival": the protection was in line 3) |
| Magenta | Poach (center) | Take a rival's member | they recruit free | | take a rival's member; they get a free one | take any rival's member; they recruit one costing up to the same, free | ok (was "Take a member": read as a shop recruit) |
| Purple | Catch Up | +1 ● | +2 per rival with more minions | on the board | 1 purple, 2 more per rival with more minions out | +1 purple, +2 per rival with more minions on the board | ok (was "+2 per rival ahead": ahead in what?) |
| Purple | Crunch Time (center) | Extra turns for all purple | 1 per 4, plus 1 | | spend all my purple for extra turns | spend all purple: 1 extra turn per 4, plus 1 (up to 2) | ok (was "Extra turns": "spend all purple" dropped) |
| White | Sob Story | +2 ● | +1 per higher score | players with more 👤 | 2 white, 1 more per player scoring higher than me | +2 white, +1 per player with more followers | ok (was "+1 per player ahead": turn order or score?) |
| White | Cheap Seats | Trade for followers | 1 for 1, up to 4 | 2 · 4 · 6 by round | trade resources for followers, 1 each, up to 4 | trade up to 2 per round number for followers, 1 for 1 | ok (was "Buy followers", the follower tiles' name at other rates: #52) |
| White | Your Call | +2 👤 | or +4 ● | 1 · 2 · 3 by round | 2 followers or 4 white, more later | per round number: +1 follower or +2 white | ok (by-round note added, #2) |
| White | All In (center) | All for followers | 1 for 1 | | trade everything for followers | trade all your resources for followers, 1 for 1 | ok (was "Cash in", with "all for followers" dropping) |
| Green | Greatest Hits (center) | Redo all your spaces | from this round | | do every space I took again | copy every space you took this round | ok (was "Redo every space": "you took" dropped) |
| Red | Even Swap | +1 ● | swap, equal cost | a member with a rival | 1 red, swap a member for one of equal cost | +1 red, swap one of yours for a rival's of equal cost | ok ("equal cost" moved out of line 3) |

Re-read and unchanged (each reads right from lines 1–2): Kickback, Golden Years, Intro Offer, Collect Debts, Tithe, Double Down; Bandwagon, Open Door, Open House, Swap Sides, Hand-pick; the basic Blue and Green; Clock In, Roll Call, Plan Ahead, Overtime; Toast, Goody Bags, Good Deed, Sweet Talk, Rising Tide, Hold Court; Top Up, Trade Seeds, Potluck; Snap Up, New Faces, Name Drop, Half Price, Show Off, Spree; Help Yourself, Redistribute, Crime Wave, Shake Down; Sell High, Dividend; Hum, Crescendo, Echo, Encore, Reprise.
Not changed, on purpose: verb panels lead with a bold word ("Steal 1", "Top up") where the space gains nothing plain, as Cory's panel rule says (#35).
