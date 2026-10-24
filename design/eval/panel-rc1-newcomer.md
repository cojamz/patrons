# RC1 blind panel: laptop newcomer (3 Normal bots, Classic), 2026-10-15

Blind tester (URL + rulebook only) on the frozen RC1 build fd4d734. Verbatim report; screenshots were in /tmp/patrons-shots/panel-newcomer/. Triage: panel-rc1-triage.md.

I played one full game: laptop at 1270×700, 3 Normal bots, Classic table, about 40 minutes. I watched the whole intro (about 21 seconds, not skipped). I won 60 to 59 (P3 40, P2 38), and 50 of my 60 followers came from five 10→10 buys.

One note on the intro: `?intro=1` only showed the normal home screen. The intro played after I pressed Start.

Screenshots are in /tmp/patrons-shots/panel-newcomer/. The move log is /tmp/panel-newcomer/movelog.md, copied at the end.

**Grades**
- **First five minutes: B-.** The intro and the "you get" hovers are lovely. But the starting-resource panel covers the bottom half of the wheel, so I had to find out by accident that I could spin it.
- **Knowing what to do each turn: B+.** The glowing spaces, the "recruit or buy / Pass" header, the "need N" badges and the payment picker all work well.
- **Knowing why my numbers changed: C.** Several bot turns fly by while you aren't looking. The "You took X" card misreports what happened. The log exists, but it's hidden in the ☰ menu and I only found it after the game.
- **Round end: B.** The summary table is clear and the Reckoning banner is nice. In round I, I never saw the Reckoning. The round III modal is cut off at 700px.
- **The intro: A-.** It's charming and teaches leader, minions and followers. It never mentions the contests or the follower buys, and those turned out to decide everything.
- **Fun: B-.** The finish was tense. But the strategy collapsed into "grab the most resources, convert at 10→10".

**Top 8 issues, worst first**
1. **The action card misreports what you paid** (107-reprise-done.png, 123-tithe.png, 151-r3-buy10b.png).
   - After I took Reprise, the card read "You took Golden Years · paid 6 gold" when I had paid 10. After Tithe it read "You took Show Off · paid 3 gold, 4 blue" when I had paid 6 gold. After Greatest Hits it said "from P2 2" when I took 3 (P2 got 1 back from Tax Collector).
   - It seems to net later gains against the earlier payment and never names the later action. I stopped trusting my numbers.
   - Fix: one card per action, with gross amounts.
2. **The "NEXT" chip skips your snake double turn** (115 says P2 NEXT, then 122 says "Extra turn"; same again at 141).
   - The "Extra turn" wording made me think I'd earned a bonus.
   - Fix: count the double in the chips and call it "Your second turn (snake)".
3. **Bot turns go by unexplained** (078-r1end-0.png).
   - At the end of round I, P4 jumped from 1 to 5 gold and tied me for gold. Only the end-of-game log revealed that P4 had released Penny Pincher.
   - Fix: keep a short "since your last turn" strip on screen, and pull the log out of the menu.
4. **The setup panel hides half the wheel** (013-game-first.png). Fix: dock it lower or shrink it while the wheel is visible.
5. **The rim hover target is too thin** (157/159/160: aiming at the rim kept opening the neighbouring space).
   - The rim standings are the most important info at round end, and I needed three tries to reach them.
   - Fix: a wider hover band, or make the rim leader emoji itself hoverable.
6. **The round III summary is cut off** (172-final-reckon3.png). "More below ↓" hides the end-game bonuses that decided a one-point game. Fix: show the bonus lines first.
7. **The "need N" shop badge doesn't say which color** (103: Busker said "need 4" while I held 15 gold). Fix: "need 4 green".
8. **A release that contradicts the rulebook.**
   - The log says "P3 released Front-runner … for 2 in any colors". Front-runner costs "2 any · colorless", and the rulebook says a member with no colored part can't be released.
   - Either the engine or the rulebook is wrong.
   - Also minor: the intro leader wears a pizza while my seat showed a ninja.

**Felt unfair or unfun**
- **Losing the round II gold contest.** P2's Collect Debts came after my last turn, took 3 of my 4 gold and lost me the contest. I lost all four contests that round, and P4 swept +12. I could have seen it coming, because Collect Debts was open, so it was fair. It still stung.
- **Greatest Hits as a round III center space.** It gave me only +4, because it can't copy Double Down (also a center space). The preview did warn me, but a "copy every space" center that copies almost nothing feels like a trap.
- **10→10 dominates.** It never felt unfair, just flat. Members felt like a detour unless they made resources: Banker plus Doppelganger copying it gave me 6 gold every round start. Every turn became "take the biggest-number space, then click 10→10".

**The screen confused me**
- The action card netting, the NEXT chip, the hidden log, the thin rims, the uncolored "need" badges and the cut-off summary.

**The game itself is weak**
- 10→10 at 1:1 makes followers the obvious sink. I won with 3 members against P3's 12.
- Contests mattered but felt like weather: I couldn't fight 12 members.
- Copies can't reach the center, so Greatest Hits is weak.

**What felt good**
- Intro Offer into Banker for 4 gold.
- Echo copying Bandwagon for +4 red.
- The first 10→10 jump from 9 to 19.
- A 50–50 tie on the very last placement of the game, decided by +2 blue making exactly 10.

**What felt dead**
- Passes where I sat on gold for a contest.
- Watching 4 to 6 bot moves blur past.

**Table talk**
- "Wait, why does P4 suddenly have five gold?"
- "Banker plus Doppelganger is basically a money printer. I just clicked 10→10 all game."
- "Ugh, Collect Debts right after my last turn. There goes the gold bonus."
- "Won by one on the very last minion. Okay, that was actually tense."
- "P3 had twelve members and still lost? Then what are members even for?"

**Worst three screenshots**
- /tmp/patrons-shots/panel-newcomer/107-reprise-done.png
- /tmp/patrons-shots/panel-newcomer/078-r1end-0.png
- /tmp/patrons-shots/panel-newcomer/013-game-first.png

---
**Appendix: move log** (/tmp/panel-newcomer/movelog.md)
- **Home:** `?intro=1` showed the normal home screen. "How to play" opened the rulebook text.
- **Setup:** I'm "Ana", P2–P4 are Normal bots, Classic table, bot speed Normal. Watched the whole intro (pizza leader). Picked Gold and Gold, aiming at gold members. P4 also took 2 gold.
- **R1 T1:** P2 Snap Up'd the Penny Pincher I wanted. I took Kickback (+3 gold) and gave the 1 gold to P3, who wasn't racing for gold. Passed my buy to save for the Intro Offer + Banker combo.
- **R1 T2:** Intro Offer, then recruited Banker for 4 gold (+3 gold right away).
- **R1 T3:** Echo copying Bandwagon (+4 red). Bought Doppelganger, which copied Banker (+3 gold). Ended the round with 5 gold.
- **R1 end:** Scored gold (tied with P4), members and badged: +6, for 9 followers against 5/5/4.
- **R2 start:** Banker and Doppelganger paid +3 each, so 11 gold.
- **R2 T1:** Golden Years (+4), then 10→10. Up to 19.
- **R2 T2 ("Extra turn"):** Reprise (+2 green, copied Golden Years for +4 gold). Bought Impressionist.
- **R2 T3:** Show Off (+4 blue), then 10→10. Up to 30.
- **R2 T4 ("Extra turn"):** Tithe (+3). Passed my buy to hold gold.
- **R2 end:** P2's Collect Debts took 3 of my gold. I lost every contest. Scores 30 / 23 / 12 / 8.
- **R3 start:** +6 gold, so 7.
- **R3 T1:** Collect Debts, taking 2 from P4 and 1 from P2, for 10. Passed my buy. The Undo button vanished halfway through the steal choice.
- **R3 T2:** Double Down to 20 gold, then 10→10. Up to 40.
- **R3 T3:** Greatest Hits (+4, and 3 taken from P2), then 10→10. Up to 50.
- **R3 T4:** Show Off (+4 blue). Held 8.
- **R3 T5:** Tied 50–50 with P4. New Faces (+2 blue) made exactly 10, then 10→10. Up to 60.
- **Final:** P3 got +18 from contests and +3 from Tycoon. P4 got +6 from green and +3 from Mob. I won 60–59.
