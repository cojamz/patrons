# Tester panel, Oct 26 (v0.8.86)

Four fresh testers played the live build (a local copy; this box can't reach the site). Full reports: design/eval/panel-2026-10-26/ on the branch. Grades: playtester no grade, UI critic C-, skeptic C ("not yet"), board-game fan B-.

## What more than one tester hit
- Rival turns you can't read. Losing a member to a swap, or a steal through a chain of copies, shows nowhere on your seat; only the log says it. (all four)
- Wheel faces print the effect ("Steal 1 and 1"), but the log and toasts use names (Help Yourself, Spree, Poach). (skeptic, UI critic)
- "Pick an artifact" at the start isn't in the rulebook, and the phone calls it a resource. (all four)
- The suggested payment spends the color whose contest you lead. (skeptic, UI critic, fan)
- Wheel hovers fill in late, in bursts (230 to 1300 ms; the box was loaded, the bursts are real). (playtester, skeptic, UI critic)
- Promote's picker cuts off P4's row; its hover says "COULD SWAP 98 lit pairs". (skeptic, UI critic)
- The shop reshuffles after a buy and seats reorder each round. (skeptic, UI critic)
- "+6 won / -4 lost" in round summaries counts steals as wins. (skeptic, UI critic)
- Phone: your own seat sits below the wheel and shop; shop members are cut off on the right. (skeptic, UI critic)
- Ability toasts cut off ("Whenever a rival recruits more tha…"). (playtester, skeptic)

## Single-tester blockers worth fixing
- Phone, Churn: the sheet's button says "Recruit" but sends the card to the bottom. (UI critic)
- Redistribute's steal dialog moves ~60 px after the first pick, so the second click hit the wrong player. (skeptic)
- Spree's "Done, no recruit" ends only one of the three recruits; the screen looks the same. (skeptic)
- Shake Down asks "P4 holds Trendsetter: keep it for 3?" when you hold it and P4 is the thief. The engine is right; the words read backwards. (skeptic; checked in the code)
- Spam-clicking Pay falls through and opens the Members catalog. (skeptic)

## Design calls (Cory's)
- Help Yourself takes a rival's own starting follower (P4 went 1 to 0). The rulebook says only followers you recruit or win can be stolen; the game counts every follower. Checked in the code: Claude's Oct 22 fill-in said "nobody drops below 0" and the Oct 23 rulebook line says otherwise.
- Your own Agents stops your own copies (Stunt Double, Reprise) with no warning before you pay.
- Round III follower buying swamps rounds I and II (fan and playtester: led after round II, then lost to hoarders; 30 to 55 bought in round III).
- Fan only, non-2.0 colors: Double Down copied by Greatest Hits, plus Tycoon, made 98 gold and +47 at the end.

## What works
- Round-end scoring and the final results table (every tester).
- Hovers and "you'd get" previews; steal pickers light the rival's chips on the seats.
- Snake order, contest rims and rings opening by round: "will my space still be open?" is real.
- Phone tap sheet with "Place here".
