# Patrons — Game Rules Reference

## Core Loop
3 rounds. Each round: place workers on action spaces → use shops → score automatic VP → advance.
Workers per round: 3 (Round 1) → 4 (Round 2) → 5 (Round 3).
Turn order re-sorted by VP each round (lowest VP goes first).

## 8 Color Layers

### Red — Worker Manipulation
| Round | Action | Effect |
|-------|--------|--------|
| 1 | gain3red | +3 red |
| 1 | gain2red | +2 red |
| 1 | redHybrid1 | +1 red, swap workers with opponent (BOTH execute new action) |
| 1 | redRepeatAction | Repeat one of your workers' actions |
| 2 | redVPFocus | +1 red, +1 VP per red worker placed |
| 2 | redHybrid2 | +1 red, swap workers (only YOU execute new action) |
| 3 | redRepeatAll | Repeat ALL your workers' actions in any order |
**Auto VP:** +1 VP each time you use a red action (recursionDepth === 0 only)
**Shops:** R1: repeat R1 action (1r+2s) | R2: place next player's worker (2r+2s) | R3: repeat all round actions by any player (4r+4s) | VP: 5r→3VP

### Yellow — Resource Manipulation
| Round | Action | Effect |
|-------|--------|--------|
| 1 | gain3yellow | Gain 3 resources (any colors, player chooses) |
| 1 | gain2yellow | Gain 2 resources (any colors) |
| 1 | steal2Gems | Trade ALL your resources for equal number of chosen colors |
| 1 | yellowHybrid1 | +2 yellow |
| 2 | steal3Gems | Gain 4 resources (any colors) |
| 2 | yellowHybrid2 | +1 yellow, copy previous player's last gain |
| 3 | yellowSwapResources | Gain 3 of each active color |
**Auto VP:** End of round: +1 VP per different color gem owned
**Shops:** R1: double next gain (1y+1s) | R2: trigger yellow auto VP now (2y+2s) | R3: gain 10 resources any color (3y+3s) | VP: 5s→3VP

### Blue — Shop Control
| Round | Action | Effect |
|-------|--------|--------|
| 1 | gain3blue | +3 blue |
| 1 | gain2blue | +2 blue |
| 1 | blueR1ShopBenefit | Gain an R1 shop benefit (even if closed) |
| 1 | blueReduceCosts | +1 blue, reduce all shop costs by 1s this round |
| 2 | blueIncreaseCosts | Increase all shop costs by 2s for other players |
| 2 | blueToggleShops | +1 blue, toggle all shop status (including VP shops) |
| 3 | blueAnyShopBenefit | Gain ANY shop benefit (even if closed) |
**Auto VP:** +1 VP each time YOU use any shop
**Shops:** R1: toggle one shop open/closed (1b+1s) | R2: flip all shops (2b+2s) | R3: use any shop benefit free (3b+3s) | VP: 5b→5VP

### Purple — Timing/Order
| Round | Action | Effect |
|-------|--------|--------|
| 1 | gain4purpleSkip | +4 purple, skip next turn |
| 1 | gain3purple | +3 purple |
| 1 | gain2purpleTakeBack | +2 purple, take back a worker from different quad |
| 1 | playTwoWorkers | Place 2 more workers this turn |
| 2 | gain5purpleSkip | +5 purple, skip turn immediately |
| 2 | playThreeWorkers | Place 3 more workers this turn |
| 3 | gain4purpleWaitAll | +4 purple, take another turn after this one |
**Auto VP:** First AND last player to run out of workers each round get +4 VP each
**Shops:** R1: extra turn (1p+2s) | R2: +2 more workers this turn (2p+2s) | R3: play all remaining workers (3p+3s) | VP: 6p→5VP
**Known issues:** 12 documented bugs (on hold). Purple swapped out of basic mode.

### Gold — Trade Flexibility
| Round | Action | Effect |
|-------|--------|--------|
| 1 | gain2gold | +2 gold |
| 1 | convert2AnyTo2Gold | Trade 2 any resources → 2 gold |
| 1 | gain1gold | +1 gold |
| 1 | convert1AnyTo1Gold | Trade 1 any resource → 1 gold |
| 2 | gain3goldSkip | +3 gold, skip next turn |
| 2 | convert3AnyTo3Gold | Trade 3 any → 3 gold |
| 3 | goldVPPerGold | +1 VP per gold you own |
**Auto VP:** +1 VP per gold owned at round end
**Shops:** R1: 1g+1s→2g | R2: 2g+2s→4g | R3: 3g+3s→double gold | VP: none

### White — VP Trading
| Round | Action | Effect |
|-------|--------|--------|
| 1 | gain3vp | +3 VP |
| 1 | gain2vp | +2 VP |
| 1 | spend1AnyFor2VP | Trade 1 resource → 2 VP |
| 1 | spend2AnyFor3VP | Trade 2 resources → 3 VP |
| 2 | lose1VPGain2Any | -1 VP, gain 2 resources (any) |
| 2 | lose2VPGain4Any | -2 VP, gain 4 resources (any) |
| 3 | gain5VPAnd5Any | +5 VP and 5 resources (any) |
**Auto VP:** None (White IS the VP layer)
**Shops:** R1: -1VP→+1 resource (1VP) | R2: -3VP→skip opponent's turn (2VP) | R3: -5VP→move a worker to any action (3VP) | VP: 4w→4VP

### Black — Aggression
| Round | Action | Effect |
|-------|--------|--------|
| 1 | gain3black | +3 black |
| 1 | gain2black | +2 black |
| 1 | blackSteal1VP | +1 black, steal 1 VP from a player |
| 1 | blackSteal2Any | Steal 2 resources from a player |
| 2 | blackStealWorker | +1 black, steal 4 resources from a player |
| 2 | blackAllLose2VP | All other players -2 VP |
| 3 | blackAllLose4VP | +2 black, all other players -4 VP |
**Auto VP:** None
**Shops:** R1: steal 1VP (1b+1s) | R2: steal 3VP (2b+2s) | R3: steal 5VP (3b+3s) | VP: 6b→steal 2VP from each

### Silver — Mutual Benefit
| Round | Action | Effect |
|-------|--------|--------|
| 1 | silver4Others1 | +4 silver, all others +1 silver |
| 1 | silver3Others1 | +3 silver, all others +1 silver |
| 1 | silver2Plus1Others | +2 silver +1 any, others get 1 of same color |
| 1 | silver2VPBoth | +2 VP, pick a player for +2 VP |
| 2 | silverTakeBack2 | +2 silver, take back 2 workers (others take back 1) |
| 2 | silver3Plus2Others1 | +3 silver +2 any, others get 1 of that color |
| 3 | silver8VPOthers3S | +8 VP, all others +3 silver |
**Auto VP:** Leader gets +3 silver at round end; others get +2 VP
**Shops:** R1: +2VP (1s+1s) | R2: you+chosen player each +4VP (2s+2s) | R3: +7 silver, others +2 silver (3s+3s) | VP: 6s→8VP

## Critical Interaction Rules
- **Recursion cap:** Max depth 5 for repeat action chains
- **Repeat exclusions:** Cannot repeat redRepeatAction, redRepeatAll, or shop benefit actions
- **Shop cost modifiers:** Per-player, not global. Reset each round in ADVANCE_ROUND
- **Gold star payment:** Any resource counts as star for gold shop costs
- **Modal targeting:** targetPlayerId routes modals to correct player in multiplayer
- **Effect persistence:** Some effects (double gain, extra turn) persist across turns/rounds
- **VP shops:** 1 per turn, separate from regular shops, ends turn after use

## Game Modes
- **Basic:** Red, Yellow, Blue, Black (Purple swapped out due to bugs)
- **Advanced:** Random 4 of all 8 colors
