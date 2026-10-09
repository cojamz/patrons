## Verdant: The Evergreen Circle (Ritualists)
Pitch: Every rite returns, renewed.
Verbs: echo (repeat or copy, never an echo of an echo), plant
Scoring: The Rite. At round end, +1 follower per echo you made this round, max I 1 / II 2 / III 3. Any player's echoes count. Game total at most 6.
Emits: echo, give (Mirror Twin)
Consumes: rivals' spaces (Mirror), rivals' members (Graft), echoes from any source (Rite, Tend)

| Ring | Action | Effect (≤14 words) |
|---|---|---|
| I | Tend | +2 verdant, or +3 if you've echoed this round. |
| I | Mirror | Echo a space a rival took this round (none yet: +2 verdant). |
| I | Plant | +1 verdant. Plant up to 2 resources; they return doubled at your next placement. |
| II | Return | Echo any space you took this round or last round. |
| II | Graft | Echo one ability of a rival's member (none: +3 verdant). |
| III | Renewal | Echo two spaces you took in earlier rounds. |

| Member | Cost | Effect (≤14 words) | Extra followers |
|---|---|---|---|
| Seedling | 1 | At each round start, +1 verdant. | 0 |
| Gardener | 2 | You may plant 1 more resource. | 0 |
| Mirror Twin | 3 | When you echo a rival's space, you both gain 1 resource. | 0 |
| Circle Elder | 4 | Whenever you echo, also gain 1 resource of any color. | 0 |
| Timekeeper | 5 | Once per round, echo a round-I space right after you take it. | 0 |
| World Tree | 7 | Planting counts as an echo, and planted resources return tripled. | +2 |

Notes:
- Termination (fixes the v2 L9 fail): an echo can never copy a space or ability that is itself an echo. Renewal is capped at two spaces, and Timekeeper is once per round.
- The Rite now has ring caps (1/2/3), down from uncapped (~8+). Eternity (~20u) becomes Renewal: two earlier-round spaces, about 2.5 + 4 = 6.5u plus up to 2 followers inside the R3 cap, so ~9.5u. That's the top of the band and the intended round-III burst.
- Dead turns fixed: Mirror falls back when nobody has placed yet; Return reaches into last round, so it always has a target in round II and later; Graft falls back when rivals have no members. Plant has a +1 baseline and returns at your next placement (at round end if you have none left), so it still works in round III instead of paying out after the game ends.
- Values: Tend 2-3; Mirror ~2.5 + 1 follower the first time (~4, within +40% of band); Plant ~3; Return ~3.5 + follower; Graft ~3 + follower; Renewal ~9.5. Round-I echoes grow naturally because later rings hold bigger spaces to copy.
- Graft on a passive ability (e.g. paying in another color) applies it for this turn only. Flag as a UI clarity point.
- Members: Seedling 1/~2.5-3 = ~40% (cheap-recruit tier, intended); Gardener 2/3.5 = 57%; Mirror Twin 3/4.5 = 67% (self +1 per echo, spill ratio 1.0; v2's Echo Chamber gave the owner nothing); Circle Elder 4/~6.3 = 63%; Timekeeper 5/~8 = 62% (was a 40% auto-buy at 4 when it could echo any space); World Tree 7/~10 = 70% (3 followers + tripled plants + Rite ticks). Cuttings is cut: its only emitter was this sphere.
- Silo index ~0.55: Return and Renewal are self-echoes, while Mirror, Graft and Mirror Twin need the table.
- Lints: L1 pass, L2 pass, L3 pass, L4 n/a, L5 warn (planted tray on the panel, as in v2), L6 pass, L7 pass, L8 pass, L9 pass, L10 pass.