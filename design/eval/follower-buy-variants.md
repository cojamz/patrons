# Follower-buy variants: does buying the 6-follower pack every turn win?

2026-10-14. The trigger was a blind tester who won a 4-player game by taking the biggest resource space and buying 6 followers every turn. They recruited 3 members, and 39 of their 48 followers came from buying.

## Setup
- The engine is at HEAD (c6a0d14) and was run on a scratch copy; no tracked files were changed. Variants were applied at runtime: TIERS for the pack cost, member defs for ★ and cost, and one flag in `colorsCovered` that stops gold counting as wild for the limited tier.
- Greedy: 400 games, 4 greedy bots.
- Pure buyer: 1 pure buyer against 3 greedy bots, 400 games. 25% means parity. The buyer never recruits. Each turn it takes the space that adds the most resources, measured by playing that space on a copy of the game. I tried three buying styles and report the best one: "saver" holds for the 6-pack (smaller packs only on its last turn), "mid" buys 4→3 while waiting, and "eager" buys the biggest pack it can afford every turn. Saver was the best style in every variant.
- Thinker: 1 thinking bot (6 rollouts) against 3 greedy bots, 32 games per variant. 25% means parity.
- Winner shares are the share of the winner's final followers from each source. "Members" includes the 1 follower for yourself. "Other" is member triggers and end-game bonuses.
- I also tested three combinations that weren't on the list: G = F+C, H = F+D, I = F+E. The thinker ran 16 games each on G and H only.

## Results
Each line gives: members per player (greedy) · winner's followers as buy / members / contests / other · average followers · pure-buyer win rate (best style) · thinker win rate and the thinker's members per game.

- **A baseline:** 10.3 members · 21 / 36 / 35 / 9% · 47.4 · buyer **26%** · thinker 84%, 10.1 members
- **B gold not wild for the 6-pack:** 10.3 · 17 / 38 / 36 / 10% · 45.0 · buyer **26%** · thinker 84%, 10.0
- **C 6-pack costs 8:** 10.3 · 20 / 36 / 36 / 8% · 46.8 · buyer **4%** · thinker 81%, 10.9
- **D B + C:** 10.3 · 17 / 37 / 36 / 10% · 44.7 · buyer **5%** · thinker 84%, 10.2
- **E members ★+1:** 11.1 · 13 / 50 / 29 / 8% · 57.7 · buyer **3%** · thinker 81%, 11.5
- **F member costs ×2:** 5.4 · 41 / 20 / 38 / 1% · 39.7 · buyer **68%** · thinker 72%, 3.8
- G F + C (extra): 5.8 · 36 / 22 / 41 / 1% · 41.1 · buyer **31%** · thinker 81% over 16 games, 5.4
- H F + D (extra): 5.9 · 33 / 23 / 42 / 1% · 40.1 · buyer **30%** · thinker 75% over 16 games, 4.1
- I F + E (extra): 6.0 · 32 / 32 / 34 / 2% · 44.2 · buyer **46%** · no thinker run

Pure-buyer win rates for each style, saver / mid / eager:
- A: 26 / 5 / 2%
- B: 26 / 9 / 3%
- C: 4 / 1 / 1%
- D: 5 / 3 / 1%
- E: 3 / 0 / 0%
- F: 68 / 30 / 10%
- G: 31 / 21 / 10%
- H: 30 / 26 / 14%

## Caveats on the instruments
- The greedy bot over-recruits. It buys any face-up member that clears a low bar, which is why A–E sit at about 10 members per player. A human who buys followers on purpose recruits far fewer.
- So the baseline result "pure buyer at 26% against greedy" means pure buying is already as good as the bots' recruit-everything play. Against human opponents who recruit less well, that easily turns into the tester's win.
- The thinker plans with greedy rollouts, so it inherits some of that recruiting bias.
- The thinker wins about 80% in every variant. It is a strong player in all of them, so its win rate doesn't tell the variants apart. Its members per game and its buy share do.

## Recommendation
None of B–E moves members toward 6–7, because the greedy bots' recruiting habit hides it. What they change is whether pure buying works:
- B changes nothing measurable (buyer still 26%).
- C and D kill pure buying (4–5%). C also prices the 6-pack at 0.75 followers per resource, the same rate as 4→3, so escalating into bulk earns no premium.
- E kills buying and inflates scores.
- F alone is the only listed variant that lands near 6 members a player. As expected, it hands the game to buying: the pure buyer wins 68%, and even the thinker drops to 3.8 members with 42% of its followers bought.

The combination that does what the designer wants is F + C: member costs ×2, and the 6-pack costs 8 but still gives 6.
- Members land at 5.8 per player and 6.8 for the winner.
- The pure buyer is close to parity (31%), so buying is viable without being dominant.
- The thinker still recruits 5.4 members and buys about a third of its followers.
- Contests stay around 40%.

Adding B on top (H) only shaves buying a little more and costs the thinker members, so it isn't worth the extra rule. If F is rejected, C alone is the fix for the buy-every-turn exploit, but it makes the 6-pack a clock rather than a reward. A pack cost of 7 is the obvious next measurement.

Readings come from greedy bots and a greedy-rollout thinker, not humans. The next check should be a blind tester on F + C.
