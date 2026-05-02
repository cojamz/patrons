# God Rework Notes — Balance Sprint

## Process
For each god:
1. Theme audit — 1-sentence identity. Does every action/shop/card serve it?
2. Action audit — Are all 7 distinct? Is T1→T2→T3 arc satisfying?
3. Shop rework — Costs achievable? Effects worth a buy? Extend strategy?
4. Power card pass — Create decisions or just buff? Broken? Boring?
5. Cost normalization — Consistent pricing framework across gods
6. Simulate — Headless games, win rates, Favor sources, shop/card usage
7. Playtest — Manual games for feel

## Weak Shops (LOCKED)
All cost 1 of their color. Simple, on-identity, always worth considering.

- **Gold** (Aurum, God of Riches): 1 gold → +2 Favor
- **Black** (Noctis, God of Shadows): 1 black → steal 1 Favor
- **Green** (Chronis, God of Time): 1 green → place your next worker now, no buy after
- **Yellow** (Solara, God of Abundance): 1 yellow → gain 2 of any colors

## Design Principle
**Each god is a sandbox.** Camp in one god and find a complete game loop (earn → spend → score), or dip into multiple for cross-god synergies. Each should work on its own as a satisfying puzzle.

Every god needs:
- **Income** — way to get your color
- **A verb** — the unique thing you DO with your color
- **A scoring loop** — Favor condition that rewards doing the verb well
- **Shops/cards that deepen the verb**

| God | Verb | Loop |
|-----|------|------|
| Gold | Accumulate | Hoard gold → convert wealth to Favor |
| Black | Take | Steal/punish → Favor from aggression |
| Green | Replay | Repeat/copy/compress → Favor from tempo |
| Yellow | Transform | Swap/convert/cycle → Favor from cycling colors |

## Yellow — Identity Rework
**Old identity:** Gain lots of any-color resources, rewarded for diversity
**New identity:** Exchange/Conversion. Yellow is fuel for transforming resources. Alchemy.

### Favor Condition (LOCKED)
**+1 Favor each time you gain a resource color you had 0 of.**
- Rewards cycling through colors, not just sitting on a diverse pile
- You WANT to spend down to zero and refill
- Scales with skill: bad play 1-2/round, good play 3-5/round
- Natural resilience to Black (nothing to steal if you're cycling to zero)

### Income Principle (ALL GODS)
T1 max income is +2 of your color, not +3. Shops are more prominent now, so base income should be lower.

### Actions
| Tier | Effect | Status |
|------|--------|--------|
| T1 | +2 yellow | LOCKED |
| T1 | +2 any colors | LOCKED |
| T1 | +1 yellow, swap 2 any → 2 any | LOCKED |
| T1 | Steal 2 any from a player, they get +1 yellow | LOCKED |
| T2 | Spend all of one color → that many +2 of another | LOCKED |
| T2 | +1 yellow, gain 1 of each color you have 0 of | LOCKED |
| T3 | Gain 2 of each active color (Flourish) | LOCKED |

### Shops
- Weak: 1 yellow → 2 any colors (LOCKED)
- Strong: 2 yellow → double your next resource gain (LOCKED)
- VP: 4 yellow → spend all non-yellow resources, +1 Favor per resource spent (LOCKED)

### Power Cards (LOCKED)
| Card | Cost | Effect |
|------|------|--------|
| Rainbow Crest | 2y+1any | +1 any when gaining 2+ colors (action or shop) |
| Extraction Vial | 2y+1any | When you gain resources from a non-yellow god's action, +1 yellow |
| Slag Catcher | 1y+2any | Spent 3+ resources in a turn → gain 1 yellow (once/turn) |
| Alchemist's Trunk | 2y+2any | Redistribute all resources (same total) now + each round |
| Philosopher's Stone | 2y+2any | All colors count as any color for purchases |
| Horn of Plenty | 3y+2any | +1 of each active color now + start of each round |

### Rules Notes
- Philosopher's Stone: purchases only (not Favor conditions), but DOES count for Gold's Favor condition (all resources count as gold for scoring)
- Start-of-round trigger ordering: players choose the order of their own round-start effects (e.g., Horn of Plenty before Alchemist's Trunk)

### Design direction
- Yellow is fuel — you spend yellow to power conversions
- Swap mechanic fires triggers (on-gain-gold, multi-color, etc.)
- Favor condition rewards going 0→N of a color, so you want to empty + refill
- Chains: swap into yellow → weak shop → spend yellow for 2 any (new colors) → Favor triggers

## Gold — Identity Rework
**Old identity:** Repetitive gold accumulation, 4 of 7 actions were "gain gold" or "trade for gold"
**New identity:** God of Riches. Hoard, tax, invest. Wealth = power.

### Favor Condition (LOCKED)
**+1 Favor per 2 gold owned at end of each round.**
- Rewards hoarding — every gold matters
- Tension with spending on shops/Cash In

### Actions (LOCKED)
| Tier | Name | Effect |
|------|------|--------|
| T1 | Patronage | +2 gold, give 1 gold to a player of your choice |
| T1 | Levy | Take 1 gold from each other player |
| T1 | Hoard | +3 gold, cannot shop this turn |
| T1 | Haggle | +1 gold, next shop or power card costs 2 less this turn |
| T2 | Austerity | +1 gold per empty power card slot |
| T2 | Tariff | +1 gold, +1 gold per god you have one of your workers on |
| T3 | Cash In | Convert all gold to Favor 1:1 |

### Shops (LOCKED)
| Shop | Cost | Effect |
|------|------|--------|
| Weak | 1 gold | +2 Favor |
| Strong | 3 gold | Gain the Aegis (occupies an artifact slot, resources can't be stolen, only one player holds it — new buyer takes it) |
| VP | 4 gold | Trigger your Favor condition now |

### Power Cards (LOCKED)
| Card | Cost | Effect |
|------|------|--------|
| Golden Scepter | 3g+1any | +1 extra gold when gaining gold from actions (actions only) |
| Rainbow Scepter | 1g+3any | +1 any other color when gaining gold from actions (actions only) |
| Golden Ring | 2g+2any | +1 gold at start of each turn |
| Gold Crown | 3g+2any | Game end: +1 Favor per 2 gold |
| Golden Scope | 2g+2any | When a player steals from you, they lose 1 Favor |
| Golden Idol | 4g+1any | Whenever you gain Favor from a gold source, +1 extra Favor |

### Rules Notes
- Levy/Tax counts as stealing (triggers Golden Scope, steal immunity, etc.)
- Any involuntary resource loss counts as stealing
- Aegis does NOT block Tribute (Tribute is giving, not stealing)
- Golden Idol is additive (+1 extra), not multiplicative
- Haggle discount applies to shops AND power cards
- Cash In: gold is gone after conversion, round-end condition scores remaining gold (0 if fully cashed)

## Black — Identity Rework
**Old identity:** Generic steal and punish, boring income actions, one-note aggression
**New identity:** God of Shadows. Steal, siphon, intimidate. Every action touches another player.

### Favor Condition (LOCKED)
**+1 Favor each time you use an action or shop to steal resources or Favor from a player.**
- Fires once per action, regardless of how many players affected or amount stolen
- Does NOT fire on penalties (area Favor loss like T3)
- Stealing = taking from a specific player. Penalizing = reducing without taking.

### Actions (LOCKED)
| Tier | Name | Effect |
|------|------|--------|
| T1 | ??? | +3 black |
| T1 | Ransack | Steal 2 resources from a player |
| T1 | Pickpocket | +1 black, steal 2 Favor from a player |
| T1 | Tribute | Each other player gives you 1 resource or 1 Favor (their choice) |
| T2 | ??? | Steal half a player's resources of one color (rounded down) |
| T2 | ??? | +2 black, all other players lose Favor equal to their power card count |
| T3 | ??? | Spend all black — each other player loses that much Favor |

### Shops (LOCKED)
| Shop | Cost | Effect |
|------|------|--------|
| Weak | 1 black | Steal 1 Favor from a player (not repeatable) |
| Strong | 3 black | Your next theft is doubled (persists until used) |
| VP | 5 black | Permanently gain +1 extra Favor when stealing |

### Power Cards (LOCKED)
| Card | Cost | Effect |
|------|------|--------|
| Thieves' Gloves | 1b+2any | When you steal resources, +1 any resource (resource steals only) |
| Onyx Spyglass | 2b+1any | When another player buys a power card, gain 1 black |
| Voodoo Doll | 2b+2any | End of round, steal 2 Favor from a player (triggers Favor condition) |
| Skeleton Key | 2b+2any | Non-black god actions → steal 1 resource from a player on that god |
| Poisoned Blade | 3b+2any | Your steal actions/shops steal extra 1 Favor |
| Tome of Deeds | 1b+3any | Your Favor cannot be reduced |

### Rules Notes
- Favor condition: one trigger per steal action, not per point stolen or per player affected
- VP shop upgrade: only applies to stealing, not penalizing
- Strong shop "doubled": persists as a buff until next theft, then consumed
- Thieves' Gloves: resource steals only (not Favor steals)
- Voodoo Doll: steals Favor (not just "lose"), triggers Favor condition
- Skeleton Key: only triggers on the god where you physically place your worker, not on repeated/copied actions

## Green — Identity Rework
**Old identity:** Repeat/copy with boring income actions, Hourglass broke blocking permanently for cheap
**New identity:** God of Time. Repeat, copy, echo. Every action involves replaying something.

### Favor Condition (LOCKED)
**+1 Favor every time you repeat or copy an action.**
- Fires once per repeat/copy
- VP shop upgrades to +2 per repeat/copy
- Diadem doubles the condition (fires twice), so base+Diadem = +2, VP shop+Diadem = +4

### Actions (LOCKED)
| Tier | Name | Effect |
|------|------|--------|
| T1 | ??? | +3 green |
| T1 | Relive | +1 green, repeat one of your T1 actions |
| T1 | Echo | +1 green, repeat another player's T1 action |
| T1 | ??? | +1 green, repeat an unoccupied T1 action |
| T2 | ??? | +1 green, repeat another player's T2 action (any god) |
| T2 | ??? | +1 green, repeat an unoccupied T2 action (any god) |
| T3 | ??? | Repeat all actions where you have workers placed this round |

### Shops (LOCKED)
| Shop | Cost | Effect |
|------|------|--------|
| Weak | 1 green | Place your next worker now, no buy phase after |
| Strong | 3 green | Next repeated action happens twice (one-shot, consumed after use) |
| VP | 5 green | Permanently gain +1 Favor per repeat/copy (upgrades condition from +1 to +2) |

### Power Cards (LOCKED)
| Card | Cost | Effect |
|------|------|--------|
| Flux Capacitor | 2g+2any | When you gain green from a green god action, +1 extra green |
| Resonance Crystal | 1g+2any | When you repeat another god's action, gain 1 of that god's color |
| Temporal Patent | 2g+1any | When you repeat a player's action, that player loses 2 Favor |
| Diadem of Expertise | 6g+2any | Your Favor condition triggers twice per repeat/copy instead of once |
| Timeline Splitter | 4g+2any | You can place workers on occupied action spaces |
| Chrono Compass | 1g+2any | At start of each round, choose your position in turn order |

### Rules Notes
- Repeat actions cannot target other repeat actions (prevents infinite chains)
- All T1 repeats limited to T1 actions only, T2 repeats limited to T2 actions only
- T3 replays all your placed workers' actions but not the T3 itself
- Strong shop "happens twice": one-shot buff, consumed on first repeat, applies to one action only during T3
- Temporal Patent: triggers when YOU repeat someone's action, not when anyone repeats
- Resonance Crystal: only triggers on non-green god actions (repeating green actions doesn't give extra green — that's Flux Capacitor's role)

## Remaining Work

### Design (no code yet)
- [x] Yellow — full rework (actions, shops, power cards)
- [x] Gold — full rework (actions, shops, power cards)
- [x] Black — full rework (actions, shops, power cards)
- [x] Green — full rework (actions, shops, power cards)
- [ ] Cross-god cost pass — consider multicolor requirements for power cards
- [ ] Action naming pass — Yellow, Black, Green actions still need names
- [ ] Simulation + balance tuning after implementation

### Implementation (after design is complete)
- [ ] Update gods.js with new Yellow actions, shops, Favor condition
- [ ] Update gods.js with new Gold actions, shops, Favor condition
- [ ] Update powerCards.js with new/renamed Yellow cards (Extraction Vial, Slag Catcher, Philosopher's Stone)
- [ ] Update powerCards.js with new/renamed Gold cards (Rainbow Scepter, Golden Scope, Golden Idol, remove Gold Vault/Gold Idol)
- [ ] Update action handlers (goldActions.js, yellowActions.js) for new mechanics
- [ ] Update event handlers (goldHandlers.js, yellowHandlers.js) for new card triggers
- [ ] Update shopResolver.js for new shop effects
- [ ] Update stateHelpers.js for new Favor conditions
- [ ] Update tests for all changed mechanics
- [ ] Simulate — headless games for balance validation
- [ ] Playtest — manual games for feel

### Global Rules to Implement
- [ ] Start-of-round trigger ordering: players choose order of their own round-start effects
- [ ] Haggle shop discount: shops only, not power cards
- [ ] Philosopher's Stone: all colors wild for purchases + Gold Favor condition
- [ ] Involuntary resource loss = stealing (for Golden Scope, steal immunity, etc.)
