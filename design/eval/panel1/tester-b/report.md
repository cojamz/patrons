# Panel 1, tester B (ui-critic). Build e43ada1. Grade C+.

Played a Classic game to the end, a Custom table (Purple, Silver, Yellow, Magenta) into round II, a phone session and an abuse pass. Box load was 9 to 22, so timings are indicative only.
Shots are in /tmp/eyes/tester-b/; the ledger and sweep are in scratchpad/panel1/tester-b/.

## Blockers
1. Bot member steals (Even Swap took Tax Collector, then Twins in R3) are invisible. The only trace is a clipped strip line; the seat never flags the loss.
2. R1 scoring started while the pay dialog was still closing, and the four-step reckoning finished before the player looked (load 19).

## Majors
- Hovers: shop 113–562 ms, spaces 613–1197 ms, both filling in over 2–4 bursts.
- Pay is inconsistent: the dialog opens sometimes and is silent other times. It opened for a 4-for-3 with exactly 4 held. Faded coin means both "pays" and "hold 0".
- Hover explanations are wrong while the payouts are right:
  - Name Drop's headline +1 vs +5.
  - Snap Up omits its own +2.
  - Open Door lists "+1 member" twice.
  - Greatest Hits' Why shows +1 where each paid +2.
- Bandwagon is dead early but doesn't look it.
- Not-yet-open spaces and the hub have no hover.
- Panel text reflows with rotation.
- Drag-spin coasts ~10 s.
- The bee token covers Kickback's words.
- The setup pick card covers member hovers and the middle and inner spaces.
- The snake isn't shown.
- Big Spender fires with no glow and no Use button.
- The swap sheet is centred, covers the wheel, takes 3 clicks, and in R3 overflowed onto the shop.
- Hustler's colour is picked on the seat, ~1030 px away, and is shown nowhere afterwards.
- Pass sits ~680 px from the last decision.
- Toasts sit bottom-left and duplicate the strip.
- Members are truncated to "+N more" although the round prize counts members.
- Relaxed vs Steady is 1.08×.
- The setup modal jumps from 520 to 1000 px on Custom.
- How to play is a wall of text.
- P3's income dropped from +2 to +1 after a steal, unexplained.
- Lie Low skipped the buy step silently.
- Design: the 10-for-10 buy dominated (P2 won with 4 members and +50 bought).

## Polish
- The "Bea" vs "You" naming.
- "No moves since yours yet" before any turn.
- A clipped strip line.
- A stray "0" bubble during scoring.
- Debug-like ranges ("1 or 3").
- Kickback's header duplicates its picker.
- The deck count has no hover.
- The setup click focuses the P4 field.
- A silent fifth-colour pick.
- The run-on results headline.
