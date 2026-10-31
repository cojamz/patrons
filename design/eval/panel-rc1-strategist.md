# RC1 blind panel: laptop strategist vs 3 Hard bots (Classic), 2026-10-15

Blind tester (URL + rulebook only) on the frozen RC1 build fd4d734. Verbatim report; screenshots were in /tmp/patrons-shots/panel-strategist/. Triage: panel-rc1-triage.md.

CULTS: blind playtest by the strategist panel. One full game against 3 Hard bots on the Classic table, about 40 minutes. I won 90–62–45–42 (P4, P2, P3 in that order).
Screenshots are in /tmp/patrons-shots/panel-strategist/ and the move log is in /tmp/panel-strategist/movelog.md (copied below).

**Could I form a plan in round I and carry it out?**
Yes. My round-I plan was:
- Start with Gold+Gold.
- Buy Front-runner (cost 2, "always pick first") so I'm guaranteed Double Down at the start of round III.
- Win the gold contest along the way.

The plan bent but held. Collect Debts plus a copy of it took 6 of my 12 gold in round II, so Double Down only doubled 10. But Penny Pincher + Underdog turned out to be the real engine: spend gold down below a rival, and the next gold gain doubles (Tithe paid 18, Echo/Golden Years paid 12). Big Spender, Treasurer and Extra Hand stacked on top. Round II had 4 real choices and a sweep of three contests (+12).

Choices that felt real:
- Copying Bandwagon for +8 red instead of Golden Years for +4.
- Gambling Tithe before Double Down, or not (I didn't).
- Spending down on purpose to re-arm Underdog.
- My last-turn math: 10→10 versus reaching 11 members to beat P4's red tiebreak.

Choices that felt obvious or empty:
- The two starting picks.
- Most of round III: 4 of my 6 buys were the same 10→10 click.

**What I needed mid-game and couldn't find on screen**
1. **Underdog vs Hustler timing.** Underdog didn't double my round-III Kickback, though I held 9 gold to P2's 11. Only the log shows why: Hustler's +3 lands first, so I'm already richer when Underdog checks.
2. **Whether Midas was on.** Its pill said "Off", yet Snap Up's 2 blue came in as gold.
3. **Penny Pincher in the pay dialog.** 2 gold coins pay a "4 gold" cost and the dialog says nothing about gold counting double.
4. **What the bots did between my turns.** "The log" lives in the ☰ menu; I found it only after the game. In round II my gold went from 12 to 6 with no explanation.
5. **What "badged" means.** I inferred ◆ = badged from the icons.
6. **Card icons are tiny.** Crowd-Pleaser's "+1 ●" is +1 red, not +1 follower; I needed a zoomed hover to tell.

**Grades**
- Decisions: B+. Round II is great; round I openers and round III conversion are thin.
- Tension: C. Nothing threatened me after round II; the gold mugging was the only sting.
- Reading the board: B−. Previews ("YOU GET +21") are excellent; rims, log and toggle state are hard to read.
- Round end: B+. The scored table explains everything; the end-game bonus line is cut off below "More below ↓".
- Fun: B. Round II engine clicks felt great; round III was arithmetic.

**Top 8 issues, worst first**

The game itself is weak:
1. **Runaway engine, dead endgame.** Front-runner (2 coins) means first pick every round. Combined with Penny Pincher, Underdog, Tithe and Double Down, I won by 28, and round III was 10→10 ×5. Shots: 49-after20.png, 70-results.png. Smallest fix: make Front-runner cost far more, or limit it to one round.
2. **Underdog's on/off depends on the order triggers fire, and nothing shows it.** Shots: 60-kick3.png, 61.png. Smallest fix: when Underdog will or won't fire, show "Underdog: ×2" or "Underdog: off" in the preview.

The screen confused me:
3. **Turn toast is stale and merges turns.** Titled "You took Collect Debts" but it includes Kickback's "P3 +1" and "paid 4". After a double placement it still names the previous space. Shots: 61.png, 54-tithe3.png. Fix: one toast per placement.
4. **Midas pill reads "Off" while Midas is on**, and the pill has no hover. Shots: 46-dd.png, 64-snap3.png. Fix: "Midas: ON" plus a hover.
5. **"Extra turn: place one more minion" at the snake turnaround** reads as a card bonus. Shots: 35.png, 53.png. Fix: "Your turn again (snake order)".
6. **Mentor & Protégé's free pick is titled "Open Door: which of the cheapest members?"** I never took Open Door. Shot: 33-aftermp.png. Fix: title it with the card's name.
7. **Affordability signals disagree.**
   - Lottery Winner says "NEED 8 more" and ignores the active −4 Intro Offer, while the shop says "7 you can afford". Shot: h-lottery.png.
   - Snap Up's list leaves out Underdog even though the shop highlights it as affordable (Penny Pincher isn't applied inside Snap Up). Shot: 16-snapup.png.
   - Fix: one affordability rule everywhere, plus a "gold ×2" line in the pay dialog.
8. **Rim standings are hard to hit.** The rim band sits under the spaces, and about half my hovers landed on a space instead. Shots: h-rimred.png (missed) vs h-rimred2.png (hit). Also, a space's hover only shows the top 3 players, so one player silently drops off ("You 0 · P2 0 · P3 0"). Fix: make the rim label the hit target, and list all players.

Smaller things:
- The 3RD/4TH/NEXT seat chips confused me; P4 read "4TH" right after it moved.
- In round III, before I'd placed anything, Hand-pick's preview said "CAN COPY Golden Years, Tithe, Kickback" — my round-II spaces.
- Follower-buy buttons have no hover during the placement phase.
- On the results screen, the player rows fill the full width but are mostly empty (70-results.png).

**Felt unfair or unfun**
- Losing 6 gold in one rotation (Collect Debts plus an echo of it) and learning it only from the number dropping.
- Round I members tie 3–3 lost to the red tiebreak when I had no red options at all.
- Round III felt like an accountant's turn: 10→10, confirm, 10→10.
- Front-runner felt like a cheat code for 2 coins.

**Table talk**
1. "Two coins for first pick every round? Why did nobody else buy Front-runner?"
2. "Penny Pincher plus Underdog: stay broke on purpose and your gold doubles. That's the cool part."
3. "Round three was just me clicking ten-for-ten five times."
4. "Who took six of my gold? Oh, Collect Debts, and then someone copied it. Where's the log?"
5. "The Midas switch says Off, but blue keeps turning into gold?"

**Worst three screenshots**
- /tmp/patrons-shots/panel-strategist/61.png (merged, mislabelled toast)
- /tmp/patrons-shots/panel-strategist/64-snap3.png (Midas "Off" but on)
- /tmp/patrons-shots/panel-strategist/33-aftermp.png ("Open Door" title on Mentor & Protégé)

---
**Appendix: move log** (/tmp/panel-strategist/movelog.md)
- Setup: me = Strat (P1); 3 Hard bots, Fast speed, Classic table.
- S1. Picked Gold, Gold. Plan: hoard gold for the gold contest; Front-runner to take Double Down first in round III; Tithe in round II; convert at 10→10 late.
- R1-1. Golden Years (+2 → 4 gold). Bought Front-runner: pick first every round; it's worth 1 follower anyway.
- R1-2. Intro Offer (−4), then Penny Pincher for free (gold spent on members counts double). Kept my 2 gold.
- R1-3. Snap Up (+2 blue). Its recruit didn't offer Underdog, so I recruited nothing and bought Underdog with 2 gold (counts double) + 2 blue.
- R1 end: P3 10, P2 7, me 4, P4 2. I tied members 3–3 but lost on the red tiebreak.
- R2-1. Picked first. Golden Years +8 (Underdog doubled it). Big Spender gave an immediate second buy, so I took Treasurer, which paid +5 gold. Now 9 gold, 5 members.
- R2-2. Encore copying P4's Bandwagon: +8 red, beating a +4 Golden Years copy. Bought Mentor & Protégé (8 red + 1 gold); its free cheapest member was Hustler, set to gold.
- R2-3. Snake turnaround (shown as "Extra turn"). Tithe +9 → 17 gold. Bought Extra Hand (5 gold): 6 minions in round III, and a badge.
- R2-4. P3's Collect Debts plus P2's echo of it had taken 6 of my 12 gold. Kickback +5, gift to P4 (last place). Bought Midas (4 gold), giving me the badged lead. Now 7 gold, 9 members.
- R2 end: swept gold, members and badged (+12). Me 22, P3 17, P2 14, P4 10.
- R3-1. Double Down: (7 + 3 Hustler) ×2 = 20 gold. Two 10→10 buys via Big Spender → 42 followers, 0 gold. Emptied out on purpose: re-arms Underdog and leaves nothing to steal.
- R3-2. Echo copying Golden Years: +12 (doubled). 10→10 → 52 followers, 2 gold.
- R3-3. Tithe +21 (doubled). 10→10 → 62 followers, 13 gold.
- R3-4. Collect Debts: Hustler +3, plus all 3 from gold leader P2 → 19 gold. 10→10 → 72 followers, 9 gold.
- R3-5. Kickback +6 (not doubled: Hustler fired first), gift to P3. Bought only 2→1, keeping 13 gold above P2's 11.
- R3-6. Snap Up: the +2 came as gold (Midas was on). Recruited Benchwarmer, then bought Tycoon (3 gold) → 11 members beats P4's 10, and 11 gold wins the gold contest.
- Final: 90 for me (+51 bought, +24 contests, Tycoon +3), P4 62, P2 45, P3 42.
