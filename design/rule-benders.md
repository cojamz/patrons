# Rule-bending members: calibration set (Claude's fill-ins, for Cory to grade)

Direction (Cory, 2026-10-14): members that bend the rules, not new income.
Prices from design/eval/value-model.md (a member should land near cost + 1.5u). Estimates, not sims.

1. ✅ Squatter (2+1): once per round, place on a space someone already took. ~5u on 3.
2. ✅ Big Spender (4+2): once per round, buy twice in one turn. ~7.5u on 6.
3. ❌ Early Bird (3+1): once per round, take a space from next round's ring. ~6u on 4.
4. ✅ (Yellow) Freelancer (1+1): pay any member's colored part in any colors. ~4u on 2.
5. ✅ Insider (1+1): you may also recruit from the top 3 of the pile. ~3.5u on 2.
6. ✅ Extra Hand (4+2): +1 worker in round III. ~8.5u on 6.
7. ✅ (base rule) Fence (1+1): once per round, release one of your members for its cost in any colors. ~3.5u on 2.
8. ✅ Front-runner (2+1): you always pick first in a round. ~4.5u on 3.

## Built (2026-10-14) — src/engine/v4/content/benders.js, Release in core.js
Guest members: they join the shared deck (rule flag `guests`, on), lean to a sphere (color + counts as its member), and pay their colored part in any colors when that color isn't on the table. Each would later replace one of its sphere's 15.
Value = member-value sim, 4 normal bots, handed over at round II, 120–160 games, Release off (±1.5). Price = value × 1.5 − 1.5, even grid. References in the same run: Banker (4) 4.0, Twins (4) 3.7, Big Family (8) 4.5, Speculator (8) 4.8, Proselytizer (12) 5.3, Tycoon (12) 3.4, Sponsor (10) 8.3 (an outlier, 62% win).
- Squatter (Magenta lean), 8: Once per round, place a worker on a space a rival already took. Measured 3.5 / 2.9 (≈4), 29% win. Priced up on Cory's "very strong"; bots may underuse it.
- Big Spender (Gold), 4: Once per round, buy twice in one turn. Measured 1.8 (≈2), 28%. Bots rarely hold enough for two buys.
- Freelancer (Yellow), 4: You may pay any member's colored part in any colors. Measured 3.2, 38%.
- Insider (Blue/Market), 6: You may also recruit from the top 3 of the pile. Measured 4.3, 46%. Kin of Black Market.
- Extra Hand (Purple), 10: +1 worker in round III (taken after the snake). Measured 6.7 / 6.8, 53% win: highest bender, below Sponsor. The "round-I space only" version measured 6.4 (round-I spaces still pay well in round III), so it barely helps; the hook exists (extraWorkerRing).
- Front-runner (Purple), 2: You always pick first in a round. Two of them: the usual order between them (fewer followers first). Measured 0.8, 25%; bots can't value turn order, so this is a floor.
- Straggler (Purple), 8: Once per round, after the last worker is placed, move one of your workers to an unused space and do that action (old effect stays, no buy). Measured 5.6, 49%. Linger is the same move on your turn, followed by a buy, and it's a space you draft; Straggler is a last word after everyone's done, free, guaranteed every round.
- Release (base rule, flag `release`, on): once per round, in your buy step and before buying, release one of your members to the bottom of the pile for its printed cost in any colors (not a gain, so gain doublers skip it). Normal bots release ~1.3 times per player per game.
- Big followers (pure buyer vs 3 bots, 200–300 games): vs normal bots 7.3% (Release off) → 8.0% (on); vs easy bots 29.1% either way (easy bots never release). Release doesn't move it; the new normal bot does.
- Purple's old Straggler is renamed Late Riser.

## Re-measured after costs ×2 (2026-10-14, member-value sim, 160 games each, 4 normal bots, handed over at round II, Release on; baseline win 25%; value ±1.5)
- Extra Hand 10: value 5.7, 52% win. The formula says 8; kept at 10 (top win rate, Cory's "SUPER strong").
- Straggler 8: 5.4, 44%. Squatter 8: 5.2, 47% (formula 6; kept at 8 on Cory's "very strong"). Insider 6: 4.3, 45%. Freelancer 4: 3.6, 48%. Big Spender 4: 3.5, 42% (was 1.8 before the doubling). Front-runner 2: 0.6, 24% (a floor: bots can't value turn order).
- Big followers, pure buyer vs 3 normal bots, n=400: Release on 11.8% (CI 8.6–15.0, 3.0 releases a game), off 17.0% (13.3–20.7). Bots were mid-change during this run; the tuning agent re-measures on the final bots.
