# Quadrants v2

These replace the first draft. The old items are only for cross-reference, in git history.
Checked against `.claude/rules/design-principles.md`. Interplay is generic: no quadrant names another.
Each quadrant has 3 round-I spaces, 2 round-II and 1 round-III, one scoring rule printed on its rings, and a deck of 6 items with 2 on its stall.

**Shared vocabulary:**
- **ahead of you** means more Favor than you.
- **echo** means you repeat or copy a space's effect without placing a worker.
- **set** means one of each color.

## Gold: the merchant
Gold turns anything into gold and profits from traffic.
Scoring, the Crown: most gold at the end of each round takes 1, then 2, then 4 Favor. Ties share.

| Ring | Action | Effect |
|---|---|---|
| I | Mint | +2 gold |
| I | Sponsor | +1 gold. Mark an empty space: whoever takes it, you both gain 1 gold |
| I | Exchange | Trade up to 2 resources for gold one-for-one, then +1 gold |
| II | Interest | +1 gold for every 2 you hold |
| II | Commission | +1 gold for every item bought this round, by anyone |
| III | Treasury | Double your gold |

| Item | Cost | Effect |
|---|---|---|
| Ledger | 2 | Mint gives +1 more |
| Broker's Scale | 2 | Once per round, pay gold in place of any other color |
| Guild Charter | 3 | When anyone takes a space you sponsored, you both gain +1 more |
| Tithe Box | 3 | Whenever a rival buys an item, gain 1 gold |
| Vault | 4 | Rivals can't take your gold |
| Crown Jewel | 7 | +2 Favor. Counts as 2 gold toward the Crown |

## Shadow: the thief
Shadow goes where others can't, and only robs the rich.
Scoring, the Shadow: most shadow at the end of each round takes 1, then 2, then 3 Favor from the leader. If you are the leader, take it from second place.

| Ring | Action | Effect |
|---|---|---|
| I | Skulk | +2 shadow |
| I | Slip | +1 shadow. Your next worker may share an occupied space |
| I | Pilfer | +1 shadow. Take 1 resource from someone ahead of you (if no one is ahead, +1 shadow instead) |
| II | Smuggle | +2 shadow. This turn, you may buy from any stall |
| II | Extort | Each player ahead of you gives you 1 resource of their choice |
| III | Heist | Take 2 resources from each player ahead of you |

| Item | Cost | Effect |
|---|---|---|
| Lockpick | 2 | When you share a space, +1 shadow |
| Veil | 2 | Rivals can't take resources from you |
| Informant | 3 | When a rival buys an item, you may pay 1 shadow to gain 1 of its color |
| Dagger | 3 | When you take from a player, take 1 more |
| Smuggler's Map | 4 | You may always buy from any stall |
| Black Pearl | 7 | +2 Favor. +1 shadow at each round start |

## Verdant: the gardener
Verdant copies, repeats, and lets things grow.
Scoring, the Echo: +1 Favor for every echo you make.

| Ring | Action | Effect |
|---|---|---|
| I | Gather | +2 verdant |
| I | Echo | Copy the space a rival took most recently |
| I | Plant | Set aside up to 3 resources. They come back doubled at round end |
| II | Relive | Echo one of your own spaces from this round |
| II | Graft | Use one rival's item once, as if it were yours |
| III | Eternity | Echo every space you've taken this round |

| Item | Cost | Effect |
|---|---|---|
| Trellis | 2 | Plant holds up to 5 |
| Perennial | 2 | +1 verdant at each round start |
| Echo Chamber | 3 | When you echo a rival's space, they gain 1 resource too |
| Cuttings | 3 | Whenever a rival echoes anything, gain 1 verdant |
| Hourglass | 4 | Once per round, echo the space you just took |
| World Tree | 7 | +2 Favor. Plant returns triple |

## Sunlight: the giver
Sunlight trades in variety and shares the harvest.
Scoring, Harmony: +1 Favor for every full set you hold at the end of each round.

| Ring | Action | Effect |
|---|---|---|
| I | Harvest | +2 sunlight |
| I | Forage | +2 resources, each a different color |
| I | Bounty | +3 of one color. Each rival gains 1 of it |
| II | Transmute | Change any of your resources into other colors, one-for-one |
| II | Prism | +1 of every color |
| III | Zenith | +2 of every color. Each rival gains 1 of every color |

| Item | Cost | Effect |
|---|---|---|
| Lens | 2 | Forage gives 3 |
| Sundial | 2 | +1 resource of your choice at each round start |
| Beacon | 3 | Whenever a rival gains 3 or more resources at once, gain 1 sunlight |
| Gift Basket | 3 | Once per turn, give a rival 1 resource to gain 2 sunlight |
| Kaleidoscope | 4 | Once per round, pay an item's cost in any colors |
| Golden Sun | 7 | +2 Favor. Counts as one of every color for sets |

## Fixtures (the market's heart, always open, any resources)
- **Laurel:** 2 for 1 Favor.
- **Garland:** 5 for 3 Favor.
- **Diadem:** 8 for 6 Favor. There are 2 per player. When the last one is bought, finish the round, then the game ends.

## How the interplay works, without naming names
- **Spillover**:
  - Sponsor, Bounty, Zenith, Echo Chamber and Gift Basket all give rivals a little too.
- **Watching the table**:
  - Tithe Box, Informant, Cuttings and Beacon all pay off when rivals act.
  - Echo and Graft borrow whatever the others have built.
- **Leader-only harm**:
  - Pilfer, Extort and Heist only reach up the table.
  - So does the Shadow scoring.
  - Vault and Veil defend against any quadrant that takes.
- **Breaking the rules of the board**:
  - Slip shares an occupied space.
  - Smuggle and Smuggler's Map buy from any stall.
  - Kaleidoscope and Broker's Scale bend costs.
  - Each of these only touches a shared rule, never a specific quadrant.

## Open risks to test
- Interest and Treasury in a long gold game. Treasury may need a cap.
- Eternity plus Hourglass echo counts in round 3. This is the intended burst, but watch its size.
- Plant in round 3 returns just before final scoring. Fine, but it may be too good there.
- Heist when one player is far ahead. It could pile on, so cap it at 2 per player.
