# v0.9.2 release check (Oct 28)

Live: v0.9.2, build 4560383, served by Pages (main bef455c).

## What was checked
- Engine crash sweeps on the real rules: about 7,500 full games (random tables, copy-heavy tables with Squatter, Tribute Band, Doppelganger, Impostor, Stunt Double, Greatest Hits, Tryout, Loyalists and Agents, and Tryout on every member). Zero crashes. Two edge cases found and fixed: members back in the pile kept Night Owl's mark, and Farewell left the shop one short.
- Full games in the built game: 17 at 1270x700 and 1100x700, all finished, no freezes.
- Online: a 3-player game to the end, and Say between two players (lines arrive in about 50 ms).
- Lag rig (quiet machine, 3 runs each): round III idle cost 30% to 3%, choose clicks p95 573 to 258 ms. The fix that caused 2-minute round III freezes was pulled before release.
- Blind testers (AI players, fresh, URL and rulebook only): 3 full 4-player games, no crash, softlock or lost state (browser restarts mid-choice, reloads and Back all held). The 4th tester never got a browser.

## Fixed tonight from the panel
- Spree ended after one recruit when that recruit was a member you can use (Speculator). Live since before v0.9.1.
- Panel's Demote picker was titled "Swap any two equal-cost members".
- Past games on the home screen was jammed at the bottom edge and didn't open.

## Table talk (AI players)
- "Greatest Hits after setting up Tithe and Double Down felt amazing. 38 gold in one click."
- "Round III was a blast: Spree into Greatest Hits, chaining steals and copies."
- "The bots won by just buying followers and hoarding blue; recruiting felt a bit pointless."
- "P4 demoting my 13-cost Mob into an Alchemist stung. Tense in a good way, but I only understood it from the round recap."
- "Round I felt thin. Rounds II and III are where it's fun."
- "I couldn't tell how far behind I was until the end."

## Open, ranked (none blocks play)
1. Greatest Hits pick: Tithe's wheel tile shows today's amount (+14) but the copy pays what its taker got (+10), per the rulebook. Reads like a broken promise.
2. Pay sheet suggests spending your only red, blue and green (contest colors) on followers while you hold 25+ gold.
3. Doppelganger copying Mob still shows worth 1 in its hover header.
4. Escape backs out of the pay sheet but not the artifact pick, Churn or Collect Debts picks.
5. Twins paid with no pay sheet; the "Paid 3" stamp landed on the refill card.
6. Panel's member list is clipped with no scrollbar.
7. Being demoted shows only in a tooltip and the round recap's "-6 from members who left".
8. Pay sheet "Keeping" shows an empty dashed circle for leftover gold.
9. Polish: seat name cut to "Y..." by "two turns in a row"; details view loses portraits on long cards; follower gain floats by the wrong number; Penny Pincher line on every pay sheet; round III summary hides P4's row; "Use Hot Streak" stays offered when it can't do anything.
10. Tests, not the game: Relaxed is 1.22x Steady (want 1.3x), same on v0.9.1; the turn-card check at 1100x700 is slow on this build (games themselves finish).
