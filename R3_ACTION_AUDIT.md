# Round 3 Action Audit

## All R3 Actions in Game

### 🔴 Red R3: redRepeatAll
**Effect**: Repeat all your worker actions in any order
**Current Implementation**: Lines 2713-2741
**Edge Cases**:
- ✅ Already excludes repeat/swap actions
- ❓ What if player has no other workers?
- ❓ Order of execution matters for resource-dependent actions
- ❓ Can create very long chains with many workers

### 🟡 Yellow R3: yellowSwapResources
**Effect**: Swap all resources with chosen player
**Current Implementation**: Lines 2947-?
**Edge Cases**:
- ❓ What if target player has 0 resources?
- ❓ What if current player has 0 resources?
- ❓ Should it trigger yellow automatic VP for diversity?
- ❓ Interaction with "double next gain" effects

### 🔵 Blue R3: blueAnyShopBenefit
**Effect**: Gain any shop benefit (even if closed)
**Current Implementation**: Lines 3057-?
**Edge Cases**:
- ❓ Can choose R3 shops?
- ❓ Can choose victory shops?
- ❓ Recursion with red shops
- ❓ Cost modifiers don't apply (it's free)

### 🟣 Purple R3: gain4purpleWaitAll
**Effect**: Gain 4 purple, take another turn (wait for others)
**Current Implementation**: Lines 2345-?
**Edge Cases**:
- ❓ What if used when player is last with workers?
- ❓ Interaction with skip turns
- ❓ Interaction with extra turns
- ❓ Multiple players using this creates deadlock?

### 🟨 Gold R3: goldVPPerGold
**Effect**: Gain VP for each gold you have
**Current Implementation**: Lines 3389-?
**Edge Cases**:
- ❓ Simple VP gain, but what's the ratio?
- ❓ Should it consume the gold?
- ❓ Interaction with gold doubling effects

### ⚪ White R3: gain5VPAnd5Any
**Effect**: Gain 5 VP and 5 resources of choice
**Current Implementation**: Lines 3663-?
**Edge Cases**:
- ❓ Resource selection UI
- ❓ Can it trigger automatic VPs?
- ❓ High VP gain might be unbalanced

### ⚫ Black R3: blackAllLose4VP
**Effect**: +2 black, all others lose 4 VP
**Current Implementation**: Lines 3910-?
**Edge Cases**:
- ❓ What if player goes negative VP?
- ❓ Very aggressive - 12 VP swing in 4-player
- ❓ Order of operations with VP protections

### 🩶 Silver R3: silver8VPOthers3S
**Effect**: +8 VP for you, +3 silver for each other player
**Current Implementation**: Lines 4183-?
**Edge Cases**:
- ❓ Triggers silver automatic VP for receivers?
- ❓ Very high VP gain
- ❓ Benefits opponents significantly

## Priority Issues to Check
1. Purple R3 deadlock scenario
2. Blue R3 shop selection scope
3. VP swings from Black/Silver R3
4. Resource swap edge cases
5. Repeat all with many workers