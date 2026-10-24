# RC1 panel triage (2026-10-15)

Instruments: two blind AI testers on RC1 (fd4d734): a laptop newcomer vs 3 Normal bots, and a laptop strategist vs 3 Hard bots. The saboteur is still playing. "Both" means the two testers found it independently. A claim from one tester gets checked before anyone fixes it.

## Screen (routed to fix agents)
1. The turn card nets later gains against the payment and names the wrong action (both). One card per action, gross amounts, the right name. Goes to UI turn-story.
2. The snake turnaround reads "Extra turn" and the NEXT chip skips it (both). It should say "Your turn again (snake order)" and count the double. Goes to UI turn-story.
3. Bot turns pass unexplained, and the log is buried in ☰ (both). Add a "since your last turn" strip, with the log one tap from the board. Goes to UI turn-story.
4. The Midas switch reads "Off" while Midas is on: it shows the action, not the state, and has no hover. Checked in CultSeat.jsx. Goes to UI turn-story.
5. Rim standings are hard to hit, and a space's hover drops the 4th player (both). Goes to UI clarity.
6. The round-III summary hides the end-game bonuses below "More below ↓" (both). Goes to UI clarity.
7. The starting-resource panel covers half the wheel (newcomer). Goes to UI clarity.
8. The pay dialog never says Penny Pincher counts gold double (strategist). Goes to UI clarity.
9. Front-runner "released for 2 in any colors" looked like a rule break. It isn't one: its 2 is a purple part, and purple isn't on Classic, so the card shows the part as "any". The member card should state its release refund (or "can't be released"). Goes to UI clarity.
10. Smaller: follower buys have no hover during placement; result rows are wide and empty; icons on hover cards are tiny; the 3RD/4TH seat chips are unclear. Split between both UI agents.

## Rules and preview (routed to the engine agent)
11. Mentor & Protégé's free pick is titled "Open Door: …" (it reuses Open Door's chooser; checked in red.js:149). Every choice should name the card that asked.
12. The affordability signals disagree (strategist): Lottery Winner says "need 8 more" and ignores Intro Offer; Snap Up's list leaves out Underdog because Penny Pincher isn't applied; the newcomer's "need 4" names no color. Fix: one engine price/shortfall rule used everywhere, and "need 4 green".
13. In round III, before any placement, Hand-pick's preview offered round-II spaces (strategist). Verify, then fix.
14. Underdog vs Hustler: trigger order decides whether ×2 fires, and the preview doesn't say so (strategist). The preview should show the real number, with the reason on hover.

## Game (for Cory, not fixed on our own)
- Round III turns into clicking 10-for-10 again and again (both: "an accountant's turn"; the newcomer got 50 of 60 followers from five 10-for-10 buys; the strategist had 4 of 6 round-III buys at 10-for-10). Members feel like a detour unless they make resources. Context: pure follower buying wins 8.5% (Normal bots), below the 15–30% band, so it's the endgame's feel, not a dominant strategy.
- Greatest Hits (Green center, "Copy every space you took this round") gave +4: copies can't reach the center, so it skipped Double Down (newcomer). The bench also reads it weak, but its probe places first and so can't measure a copy space.
- Front-runner (2, "You always pick first") felt like a cheat code to the strategist. The bench reads it at fair 2.4 / 0.7 (Normal / Hard-20). That's one AI game against the bench, so watch it in human play.
- Collect Debts plus a copy of it took 6 of 12 gold in one rotation (strategist), and Collect Debts after the newcomer's last turn cost them the gold contest. Both felt fair but stung, and both wanted to see who took it, which is item 3.

## Not acted on
- `?intro=1` on the home screen: the intro plays after Start, which is how it's built. The intro's pizza leader against the seat's ninja: the intro is a generic example, and Cory picked pizza.
- "Badged ◆" confusion: Cory has already dropped badged (content agent).

## Saboteur (robustness B; no crash, no double-applied move, totals always added up)
15. One game open in two tabs splits into two games saving to the same slot, and moves are lost silently. The newer tab should take over and the older one say so. Goes to the session agent.
16. Reloading Game over wipes the result, with no Resume and no results. Keep the finished game's results reachable from home. Goes to the session agent.
17. Reloading during the Reckoning or the round summary skips it, and bot turns resolve unseen. Resume into the summary. Goes to the session agent.
18. Member cards in the bottom seats open under the shop strip and past y=700. Goes to UI clarity.
19. Collect Debts offers "Take all 3 from P3" when P3 has 1, and its counter resets after a mid-split reload. The Social Climber choice labels are inconsistent. Goes to the engine agent.
20. Smaller: the pay dialog doesn't take focus, so Enter does nothing; seat totals show the final numbers at step 1 of the Reckoning. Goes to UI clarity.
