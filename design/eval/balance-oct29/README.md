# Balance runs, Oct 29 overnight (v0.9.842 to v0.9.846)

Four rounds of bot games on the 2.0 colors (Red, Green, Magenta, Purple, Blue, White) plus the 15 guests, prices only.
An independent cross-check thread re-ran every round on its own seeds and its own runner (design/eval/xcheck/ on
claude/project-thread-awhu3b) and signed off on the shipped set.

## Instruments
- Normal bots and Hard bots (thinking, full lookahead, no clock); a stronger Hard (budget 300) for the "is the bot the
  bottleneck" check. Random tables of the 2.0 colors, one color per seat, 2, 3 and 4 players. Every 5th game one seat
  only buys followers.
- Lift = a seat's win share minus the win share of all seats with the same member count at the same player count, in
  points (25 points = a whole fair share at 4 players). It removes "owners win because they own more members". It
  does not remove "rich players buy pricey cards", so the 8+ cost members read high when rarely bought.
- Rounds 2 to 4 are paired: the same games played with and without the price changes.

## Reproduce
- `scripts/v4-balance.mjs` (one game per line; PRICE="id=colored/any,..." changes prices only),
  `scripts/v4-balance-run.sh <out> <level> <seats> <first> <games> [shard] [parallel]` (resumable),
  `scripts/v4-balance-report.mjs`, `scripts/v4-balance-compare.mjs`, `scripts/v4-balance-matrix.mjs`, `scripts/v4-balance-chart.mjs`.
- Game g uses seededRandom(g*7717+3+seats*101). Raw files: /mnt/project-files/balance-oct29/raw/ (base, hardA, hardB).
- Builds: round 0 and 1 on 2ae057de (v0.9.842 plus Launderers' split); rounds 2 to 4 on 0f28454d (v0.9.846, Coach loop fixed).

| Run | Bots | Players | Games | Seeds |
| --- | --- | --- | --- | --- |
| Round 0 | Normal | 4 / 3 / 2 | 1,975 / 1,500 / 1,499 | 1+ |
| Round 0 | Hard | 4 / 3 / 2 | 200 / 300 / 300 | 1+, 1001+ |
| Round 0 | Hard, budget 300 | 4 | 145 | 2001+ |
| Round 1 | Normal | 4 | 1,500 | 5001+ |
| Round 2 (paired) | Normal | 4 / 3 / 2 | 1,500 / 1,000 / 1,000 each arm | 9001+ |
| Round 3 (paired) | Normal; Hard | 4, 3; 4 | 1,500, 800; 80 + 120 | 13001+, 14001+ |
| Round 4 (paired) | Normal | 4 / 3 / 2 | 1,500 / 800 / 800 each arm | 17001+ |

## Rounds (Normal, 4 players, lift before → after)
- Round 1: Tiebreaker 4→5 +15→+12; Heiress 6→7 +9→+14; Saboteur 5→6 +9→+10; Accomplice 2→3 +9→+6; Agents 4→3 −10→−8; Impostor 6→5 −5→−3. Buy-followers-only 27%→32%: raising only strong cards pushes play toward buying followers, so later rounds pair raises with cuts. Saboteur flips by player count (4p strong, 2p weak), so it left the set; Impostor wasn't off in the cross-check, so it left too.
- Round 2: Accomplice 3 +11→+4; Grifter 4→5 +9→+6; Launderers 5→4 −7→−4; Front-runner 3→2 −7→−2; Bait 4→3 −4→−3; Connoisseur 4→3 0→−2 (3p −11→−2, 2p −14→+1); Window Dresser 4→3 −3→0; Agents 3 −10→−10; Tiebreaker 5 +13→+13; Heiress 8 +15→+19.
- Round 3: Tiebreaker 6 +14→+10 but bought 46%→14% (strong when owned at any price: not a price problem); Heiress 9 bought 26%→4% (too far, back to 8); Bodyguard 9→8 bought 6%→16%, owners +12→+8; Night Owl 9→8 bought 8%→19%, +11→+10; Extra Hand 10→8 bought 3%→10%, +11→+8; Con Men 6→7 −1→+2 (not needed).
- Round 4 (the shipped set): 4p buy-followers-only 27%→26%, 3p 34%→34%, 2p 47%→49%; nothing broke. Cross-check, Hard 4p paired (200 games): Agents −18→−9, Bait −11→−6, Accomplice +5→+8, buy-followers-only 7.5%→8.8%.

## Shipped (v0.9.848)
Heiress 6→8, Exporter 6→7, Grifter 4→5, Accomplice 2→3 (reverses Cory's 2), Bodyguard 9→8, Night Owl 9→8, Extra Hand 10→8, Launderers 5→4, Agents 4→3, Bait 4→3, Connoisseur 4→3, Scout 4→3.

## Round 0 grids (lift per run; * past 2 SE)
Members: r0-members-matrix.txt beside this file. Artifacts, colors and spaces below.

```
Artifacts                         N4     N3     N2     H4     H3     H2   HB4
Recruiter (Red)                 +11*   +16*    +9*   +20*   +14*   +19*    +9
Pocket Watch (Purple)            +6*    +6*   +13*    -2     +6    +14*    -2
Fence (Magenta)                  -1     +2     +9*    -1     +7     +5    +10
Bargain Bin (Blue)               +1     +3     +1     +2     +9*    -2    -3
Impressionist (Green)            -7*   -11*   -13*     0     -9*    -1    +3
Money Changer (White)           -11*   -16*   -21*   -13*   -17*   -17*   -11*

Main color (3+ members)           N4     N3     N2     H4     H3     H2
White                            +1    +22*   +32*   +23*      .      .
Magenta                          +7*    +7*    +8*    +7    +11*   +13*
Red                              +7*   +12*   +10*    +6     +9     +8
Purple                           +9*    +5     +5     +4    +13    +14
Blue                             +1     +1     +2     +1     +3     +8
Green                            +3*     0     -1     +5     -8     +7

Spaces (takers)                   N4     N3     N2     H4     H3     H2
Greatest Hits (Green, III)      +37*   +31*   +23*   +33*   +38*   +22*
Last Call (Purple)              +14*   +15*   +15*    +7     +9*    +8
Crowd In (Purple, III)          +12*    +8*    +5*   +11*   +13*   +12*
Allowance (White)                +3*    +4*    +9*    +2     +3     +9*
Cover (Green)                    -4*    -8*    -9*    -1     -1     -1
Recruit Twice (Blue)             -7*    -6*   -11*    -3     +2     -4
Spree (Blue)                     -6*    -4*    -3     -3     -7    -11*
Gather (Red)                     -3*    -7*   -10*    -6*    -3    -13*
```

Buy-followers-only seat, round 0: Normal 27% / 32% / 48% (4, 3, 2 players; fair 25 / 33 / 50), Hard 10% / 11% / 25%,
stronger Hard 7%. Against good play, recruiting beats buying followers by a wide margin; read that target on Hard.

## Lessons
- A rules loop (Tribute Band copies Tryout, Tryout uses Coach, Coach refreshes Tribute Band) hung a Normal game forever;
  the runner now caps a game at 4,000 moves and logs it as stuck.
- A price change moves a card between round decks (3 or less: round I), which changes more than its price
  (Tiebreaker 4→5 left the round I deck); say so with any price call.
- Pricey members read strong on lift because rich players buy them; judge them by paired price cuts (buys go up, owners still ahead).
