# Bots and member swaps, before vs after v0.9.857 (Oct 29)

Instrument: Hard bots (uncapped look-ahead), 4 players, 40 seeded games, Red plus three random 2.0 colors on every
table, every 5th game one buy-followers-only seat. Same seeds, old engine (4750da75) vs new (v0.9.857).
`MUST=red node scripts/v4-swap-batch.mjs <first> <count> <out.jsonl> [engineDir]`; raw rows beside this file.

| | before | after |
|---|---|---|
| moves touching a rival's cult | 151 | 161 |
| Saboteur put into a rival's cult | 14 | 22 |
| Agents taken from a rival | 1 | 0 |
| Loyalists taken from a rival | 2 | 0 |
| Anarchist uses | 11 | 5 (only when the swap beats not swapping) |
| Headhunter uses | 6 | 5 |
| Double Agent uses | 16 | 22 |
| buy-followers-only seat wins | 1 of 8 | 1 of 8 |

Owners' win rates per card are 1 to 5 wins out of 5 to 19 owners: too few games to read either way.
Agents now protects its owner ("Your actions can't be copied"), so bots handing it to a rival would be a mistake;
they don't, before or after.

## Hard looks ahead on swaps and steals (v0.9.870)
Hard now plays out its top few swaps and members-to-take like placements and buys. Head-to-head
(`scripts/v4-hard-vs.mjs`, 40 Red tables, each played twice with the seats' bots swapped): the new Hard seat won 13,
the previous Hard seat 6, with +7 followers of margin on average (22 games better, 18 worse). Raw: vs-lookahead-*.jsonl.
