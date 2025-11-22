# Implementation Plan: Systematic Action & Shop Interaction Verification

**Created**: 2025-11-21
**Status**: Awaiting Approval
**Type**: Analysis & Verification (NO CODING)

## Objective
Systematically verify that our most complex actions and shops in BASIC layers (Red, Yellow, Blue, Black) correctly interact with each other, including all R1/R2/R3/VP shops and auto VP mechanics.

## Scope
**IN SCOPE:**
- Basic layers only: Red, Yellow, Blue, Black
- All actions (R1, R2, R3) for these layers
- All shops (R1, R2, R3, VP) for these layers
- Auto VP mechanics for these layers
- Cross-layer interactions between complex mechanics
- Recursion depth handling
- Multiplayer modal routing
- Resource tracking and lastGain mechanics

**OUT OF SCOPE:**
- Purple, White, Silver, Gold layers (save for later)
- New feature development
- Performance optimization
- UI/UX improvements

## Complexity Rankings

### Layers by Overall Complexity (Descending)
1. **Red** (Patron Manipulation) - Swapping, repeating, recursion, multiplayer modals
2. **Blue** (Shop Control) - Shop state manipulation, cost modifiers, free execution, auto VP
3. **Yellow** (Resource Manipulation) - Resource selection, lastGain tracking, trade all
4. **Black** (Stealing/VP) - Player targeting, resource/VP/patron stealing

### Top 5 Most Complex Mechanics to Verify

#### 1. redRepeatAll (Red R3 Action)
**Complexity**: VERY HIGH
- Repeats ALL actions where player has patrons
- Player chooses order (sequential modals)
- Must handle action execution in chosen sequence
- Recursion depth tracking critical
- Exclusion list prevents infinite loops
- Interacts with: All other layers' actions, shops triggered during repeats

#### 2. redHybrid1 (Red R1 Action - Swap Patrons, Both Execute)
**Complexity**: VERY HIGH
- Swaps two patrons between players
- Both players execute their NEW action
- Multiplayer modal routing (each player sees their own modals)
- Must handle resource selection actions (yellow gems)
- Must handle player targeting actions (black steal)
- Interacts with: All actions that have modals, multiplayer state sync

#### 3. Red R1 Shop (Repeat Round 1 Action)
**Complexity**: HIGH
- Repeats one Round 1 action via executeRepeatAction
- Round filtering (allowedRounds parameter)
- Exclusion list (no shop benefits, no repeat actions)
- Recursion depth tracking
- Interacts with: All R1 actions, other shops if R1 action triggers shops

#### 4. blueAnyShopBenefit (Blue R3 Action)
**Complexity**: VERY HIGH
- Execute ANY shop benefit for free (ignores closed status, no cost)
- Includes R1, R2, R3, AND VP shops
- Recursion into executeShopBenefit
- Exclusion list prevents infinite loop (can't be repeated by Red R1 shop)
- Interacts with: All shops, all shop benefits, potentially triggers Blue auto VP

#### 5. yellowHybrid2 (Yellow R2 Action - Copy Last Gain)
**Complexity**: HIGH
- Copies previous player's last resource gain
- Requires lastGain tracking (updated on OTHER players' gains, not own)
- Must handle empty lastGain (give default resources)
- Must handle doubling effects
- Interacts with: All resource-generating actions, Yellow shops, other players' state

### Honorable Mentions (Also Complex)
- **blackStealWorker** (Black R2) - Steal patron + up to 4 resources, player targeting
- **Blue auto VP** - +1 VP to ALL players when ANYONE uses shop
- **Blue R1 shop** - Gain R1 shop benefit (similar to blueR1ShopBenefit but as shop)
- **Yellow R2 shop** - Trigger Yellow auto VP manually (VP calculation)
- **Black VP shop** - Steal 2 VP from each player (multiplayer loop)

## Analysis Approach

For each of the top 5 mechanics, we will:

### Step 1: Document Expected Behavior
**What**: Write out exactly what SHOULD happen from a player perspective
**Files**: Implementation plan (this file)
**Output**: Detailed scenario descriptions for each mechanic

### Step 2: Identify Interaction Scenarios
**What**: List specific cross-layer interactions to verify
**Files**: Implementation plan (this file)
**Output**: Matrix of interactions (e.g., "redRepeatAll → yellowHybrid2 → lastGain tracking")

### Step 3: Trace Code Execution (Ultrathink)
**What**: For each interaction, trace through the actual code to verify behavior
**Files**: src/App.jsx, src/data/allGameLayers.js, src/data/shopData.js
**Method**: Read code, trace execution paths, verify recursion depth, check exclusions

### Step 4: Identify Discrepancies
**What**: Document where expected behavior doesn't match code
**Files**: Implementation plan (this file)
**Output**: List of bugs/issues to fix

### Step 5: Create Test Scenarios
**What**: For each interaction, create manual test scenarios
**Files**: Implementation plan (this file)
**Output**: Step-by-step test cases for multiplayer testing

## Detailed Analysis Plan

### Mechanic 1: redRepeatAll (Red R3)

#### Expected Behavior
1. Player places patron on redRepeatAll
2. System finds ALL actions where player has patrons (excluding swap/repeat actions)
3. Player is shown modal with list of actions, chooses first to repeat
4. Action executes (with full recursion depth tracking)
5. Player shown modal again with remaining actions, chooses next
6. Repeat until player cancels or all actions repeated
7. Each repeated action should execute as if player just placed patron there

#### Comprehensive Interaction Analysis

**RED LAYER INTERACTIONS:**
- **redRepeatAll → gain3red / gain2red**
  - Simple resource gain during repeat sequence
  - Verify resources added correctly
  - No modal, should execute instantly

- **redRepeatAll → redHybrid1 (swap both execute)**
  - Should be EXCLUDED from repeat list
  - Verify exclusion list includes 'redHybrid1'
  - If not excluded: infinite complexity (swap during repeat during repeat...)

- **redRepeatAll → redRepeatAction**
  - Should be EXCLUDED from repeat list
  - Verify exclusion list includes 'redRepeatAction'
  - If not excluded: infinite loop (repeat during repeat)

- **redRepeatAll → redVPFocus (R2: +1 red, +1 VP per red patron)**
  - Count red patrons during repeat
  - VP should be calculated at time of repeat execution
  - Verify VP calculation correct

- **redRepeatAll → redHybrid2 (R2: swap only you execute)**
  - Should be EXCLUDED from repeat list
  - Verify exclusion list includes 'redHybrid2'

**YELLOW LAYER INTERACTIONS:**
- **redRepeatAll → gain3yellow / gain2yellow**
  - Player chooses gems during repeat sequence
  - Modal routing should work (show gem selection)
  - Verify targetPlayerId = player.id during repeat
  - lastGain tracking: Does repeating gain3yellow update OTHER players' lastGain?

- **redRepeatAll → steal2Gems (trade all resources)**
  - Trade all resources during repeat
  - Player chooses NEW resources equal to current total
  - Total resource count stays same
  - Verify modal shows, player can choose

- **redRepeatAll → yellowHybrid1 (+2 yellow)**
  - Simple resource gain
  - No modal, instant execution

- **redRepeatAll → steal3Gems (R2: gain 4 any)**
  - Player chooses 4 gems during repeat
  - Modal routing should work
  - Verify gem selection modal appears

- **redRepeatAll → yellowHybrid2 (R2: copy last gain)**
  - Copies previous player's last gain DURING repeat sequence
  - If player has multiple actions, which lastGain is used?
  - Should use current lastGain at time of execution
  - Does executing yellowHybrid2 during repeat update OTHER players' lastGain?

- **redRepeatAll → yellowSwapResources (R3: 3 of each color)**
  - Gain 3 of each color in game during repeat
  - Simple execution, no modal
  - Verify correct colors (only colors in game)

**BLUE LAYER INTERACTIONS:**
- **redRepeatAll → gain3blue / gain2blue**
  - Simple resource gain
  - No modal, instant execution

- **redRepeatAll → blueR1ShopBenefit**
  - Execute R1 shop benefit during repeat
  - Player chooses which R1 shop to use
  - Does Blue auto VP trigger? (Shop was used)
  - Does this trigger for ALL players in multiplayer?
  - Recursion depth: repeat (depth 1) → shop benefit (depth 2) → shop action (depth 3)
  - Verify depth < 5

- **redRepeatAll → blueReduceCosts (R1: -1 shop cost this round)**
  - Reduce shop costs by 1 for this round
  - Effect applies DURING repeat sequence
  - If player buys shop later in repeat, does discount apply?
  - Verify shopCostModifier updated correctly

- **redRepeatAll → blueIncreaseCosts (R2: +2 cost for others)**
  - Increase OTHER players' shop costs by 2
  - Effect applies immediately
  - Multiplayer: verify other players see increased costs

- **redRepeatAll → blueToggleShops (R2: toggle all shop status)**
  - Toggle all shops open ↔ closed during repeat
  - Affects subsequent shop availability
  - If player uses blueR1ShopBenefit later in sequence, are toggled shops available?

- **redRepeatAll → blueAnyShopBenefit (R3: any shop for free)**
  - Execute ANY shop benefit during repeat
  - Player chooses which shop (R1/R2/R3/VP)
  - Deep recursion: repeat → any shop → shop benefit → shop action
  - Verify recursion depth tracking
  - Does Blue auto VP trigger?

**BLACK LAYER INTERACTIONS:**
- **redRepeatAll → gain3black / gain2black**
  - Simple resource gain
  - No modal, instant execution

- **redRepeatAll → blackSteal1VP**
  - Target player and steal 1 VP during repeat
  - Modal: choose player to steal from
  - Multiplayer: verify modal routing (player doing repeat sees modal)
  - Verify VP transfer correct

- **redRepeatAll → blackSteal2Any (R1: steal 2 gems)**
  - Two modals: (1) choose target player, (2) choose 2 gems to steal
  - Verify both modals route to player doing repeat
  - Verify resources transferred correctly
  - Multiplayer: does other player see their resources decrease?

- **redRepeatAll → blackHybrid1 (R1: +1 black + 2 VP)**
  - Simple: +1 black, +2 VP
  - No modal, instant execution

- **redRepeatAll → blackStealWorker (R2: steal patron + 4 resources)**
  - Complex multi-modal: (1) choose target player, (2) choose gems to steal
  - Patron stolen DURING repeat sequence
  - Verify patron ownership transfers
  - Verify resources stolen correctly
  - Multiplayer: modal routing to player doing repeat

- **redRepeatAll → blackSteal3VP (R3)**
  - Target player and steal 3 VP
  - Modal: choose player
  - Verify VP transfer

**SHOP INTERACTIONS:**
- **Can shops be purchased DURING redRepeatAll sequence?**
  - If action gives resources, can player pause repeat to buy shop?
  - Expected: NO (action execution is atomic, shops bought between actions)
  - Verify turn phase doesn't change to 'shop' during repeat

- **redRepeatAll → After using Red R1 shop**
  - Red R1 shop: Repeat an R1 action
  - Player then uses redRepeatAll
  - Can redRepeatAll repeat the action that was repeated by shop?
  - Verify patron still on that action

- **Does repeating actions that give resources update lastGain?**
  - Player repeats gain3yellow via redRepeatAll
  - Do OTHER players' lastGain update?
  - Expected: YES (UPDATE_RESOURCES should update lastGain for all other players)

**AUTO VP INTERACTIONS:**
- **Blue auto VP during redRepeatAll**
  - If player repeats blueR1ShopBenefit, does Blue auto VP trigger for ALL players?
  - Expected: YES (shop was used, even via action repeat)

#### Code Locations to Verify
- `executeAction` - redRepeatAll implementation (~line 2020-2080)
- `executeRepeatAction` - Exclusion list, round filtering (~line 4470-4520)
- Recursion depth tracking (max 5)
- Modal routing during repeat sequence
- lastGain updates during repeats
- Shop phase transitions during repeats

---

### Mechanic 2: redHybrid1 (Red R1 - Swap Patrons, Both Execute)

#### Expected Behavior
1. Player A places patron on redHybrid1, gets +1 red
2. Player A chooses one of THEIR OTHER patrons to swap (e.g., on action X)
3. Player A chooses another player's patron to swap with (e.g., Player B's patron on action Y)
4. Patrons swap: Player A's patron moves to Y, Player B's patron moves to X
5. Player A executes action Y (sees modals, makes choices, gets resources)
6. Player B executes action X (sees modals, makes choices, gets resources)
7. In multiplayer, each player sees ONLY their own modals

#### Comprehensive Interaction Analysis

**RED LAYER INTERACTIONS:**
- **redHybrid1 → Player swaps onto gain3red / gain2red**
  - Simple resource gain after swap
  - No modal, instant execution
  - Verify player receives resources
  - Other player also executes their swapped action

- **redHybrid1 → Player swaps onto another redHybrid1**
  - Should be EXCLUDED from swap selection
  - Cannot swap onto swap actions (prevents infinite complexity)
  - Verify exclusion list includes 'redHybrid1'

- **redHybrid1 → Player swaps onto redHybrid2**
  - Should be EXCLUDED from swap selection
  - Verify exclusion list includes 'redHybrid2'

- **redHybrid1 → Player swaps onto redRepeatAction (R1)**
  - Player A ends up on redRepeatAction
  - Should see modal to choose an action to repeat
  - Verify modal routes to Player A (effectiveTargetPlayerId)
  - Player A can repeat any of their actions
  - Recursion depth: swap (depth 1) → repeat (depth 2) → repeated action (depth 3)

- **redHybrid1 → Player swaps onto redVPFocus (R2)**
  - Player gains +1 red + VP equal to red patron count
  - VP calculated based on swapped player's patron configuration
  - Verify correct VP calculation

- **redHybrid1 → Player swaps onto redRepeatAll (R3)**
  - Player A ends up on redRepeatAll
  - Player A shown modal with ALL their actions
  - Player A chooses sequence to repeat
  - Deep recursion potential: swap → repeat all → multiple actions
  - Verify recursion depth tracking
  - Multiplayer: only Player A sees repeat sequence modals

**YELLOW LAYER INTERACTIONS:**
- **redHybrid1 → Player swaps onto gain3yellow / gain2yellow**
  - Critical multiplayer modal routing test
  - Player A swaps onto Player B's gain3yellow
  - Player A should see gem selection modal
  - Modal should show Player A's name/context
  - Player A chooses gems and receives them
  - Player B executes their swapped action (sees their own modals)
  - Verify effectiveTargetPlayerId = Player A's ID for the modal
  - lastGain tracking: Does Player A's gain update OTHER players' lastGain?

- **redHybrid1 → Player swaps onto steal2Gems**
  - Player sees modal to trade all resources
  - Chooses new resource distribution
  - Total resource count stays same
  - Verify modal routing to correct player
  - No targeting involved (just own resources)

- **redHybrid1 → Player swaps onto yellowHybrid1**
  - Simple +2 yellow gain
  - No modal, instant execution

- **redHybrid1 → Player swaps onto steal3Gems (R2)**
  - Player chooses 4 any gems
  - Modal routes to player who swapped onto this action
  - Verify gem selection modal appears

- **redHybrid1 → Player swaps onto yellowHybrid2 (R2)**
  - Player copies previous player's lastGain
  - Uses the swapped player's lastGain state
  - If Player A swaps onto Player B's yellowHybrid2, whose lastGain is used?
  - Expected: Player A's lastGain (the player executing)
  - Verify correct lastGain reference

- **redHybrid1 → Player swaps onto yellowSwapResources (R3)**
  - Player gains 3 of each color in game
  - Simple execution
  - No modal needed

**BLUE LAYER INTERACTIONS:**
- **redHybrid1 → Player swaps onto gain3blue / gain2blue**
  - Simple resource gain
  - No modal, instant execution

- **redHybrid1 → Player swaps onto blueR1ShopBenefit**
  - Critical test: shop benefit via swap
  - Player chooses which R1 shop to execute
  - Modal routes to swapped player
  - Shop executes for free (ignores cost/status)
  - Does Blue auto VP trigger? (Shop was used)
  - Should trigger for ALL players in multiplayer
  - Verify recursion: swap (depth 1) → shop benefit action (depth 2) → shop execution (depth 3)

- **redHybrid1 → Player swaps onto blueReduceCosts (R1)**
  - Player's shop costs reduced by 1 this round
  - Effect applies to the swapped player's shopCostModifier
  - Verify correct player's modifier updated

- **redHybrid1 → Player swaps onto blueIncreaseCosts (R2)**
  - OTHER players' shop costs increase by 2
  - Effect applied to all other players (not the swapped player)
  - Multiplayer: verify cost increases visible to all

- **redHybrid1 → Player swaps onto blueToggleShops (R2)**
  - All shops toggle open ↔ closed
  - Affects game-wide shop availability
  - Both players' actions execute, both see updated shop states

- **redHybrid1 → Player swaps onto blueAnyShopBenefit (R3)**
  - Player chooses ANY shop to execute for free
  - Modal routing critical (which player sees shop selection?)
  - Deep recursion: swap → any shop benefit → shop execution
  - Verify recursion depth tracking
  - Does Blue auto VP trigger?

**BLACK LAYER INTERACTIONS:**
- **redHybrid1 → Player swaps onto gain3black / gain2black**
  - Simple resource gain
  - No modal, instant execution

- **redHybrid1 → Player swaps onto blackSteal1VP**
  - Critical multiplayer test: targeting via swap
  - Player A swaps onto blackSteal1VP
  - Player A sees modal to choose target player
  - Player A steals 1 VP from chosen target
  - Modal must route to Player A (effectiveTargetPlayerId)
  - Verify VP transfer correct
  - Player B also executes their swapped action

- **redHybrid1 → Player swaps onto blackSteal2Any (R1)**
  - Complex double-modal scenario
  - Player A swaps onto this action
  - Modal 1: Player A chooses target player
  - Modal 2: Player A chooses 2 gems to steal from target
  - Both modals must route to Player A
  - Verify resources transferred correctly
  - Multiplayer: verify target sees resource decrease

- **redHybrid1 → Player swaps onto blackHybrid1 (R1)**
  - Simple: +1 black + 2 VP
  - No modal, instant execution

- **redHybrid1 → Player swaps onto blackStealWorker (R2)**
  - Very complex multi-modal scenario
  - Modal 1: Choose target player
  - Modal 2: Choose target's patron to steal
  - Modal 3: Choose up to 4 resources to steal
  - All modals route to swapped player
  - Patron ownership transfers
  - Resources transfer
  - Verify complete execution sequence
  - Multiplayer: verify both players see patron movement

- **redHybrid1 → Player swaps onto blackSteal3VP (R3)**
  - Modal: choose target player
  - Steal 3 VP from target
  - Verify VP transfer
  - Modal routing to swapped player

**SHOP INTERACTIONS:**
- **redHybrid1 → Swapping affects shop usage**
  - Player A has not used VP shop this turn
  - Player A swaps, uses Red R1 shop in swapped action
  - Does this count as Player A's shop usage?
  - Verify shop usage tracking

- **redHybrid1 → Both players have doubling effects**
  - Player A has Yellow R1 shop effect (double next gain)
  - Player B has Yellow R1 shop effect (double next gain)
  - They swap onto gain3yellow and gain2yellow
  - Does each player's doubling effect apply to their swapped action?
  - Expected: YES (effects belong to player, not action)
  - Verify doubling effects apply correctly

- **redHybrid1 → Swapping with shop cost modifiers**
  - Player A has reduced shop costs (used blueReduceCosts)
  - Player B has normal shop costs
  - Player A swaps onto action with shop benefit
  - Does Player A's cost modifier apply?
  - Expected: YES (per-player modifier)

- **redHybrid1 → Red R1 shop → repeat redHybrid1**
  - Player uses Red R1 shop
  - Can they choose to repeat redHybrid1?
  - Should be EXCLUDED from Red R1 shop repeat list
  - Verify exclusion prevents this

**AUTO VP INTERACTIONS:**
- **redHybrid1 → Blue auto VP during swap**
  - Player swaps onto blueR1ShopBenefit
  - Executes R1 shop
  - Should trigger Blue auto VP for ALL players
  - Verify all players get +1 VP

- **redHybrid1 → Yellow auto VP during swap**
  - Player swaps onto action that gains yellow resources
  - Do complete sets of yellow gems trigger Yellow auto VP?
  - Verify VP calculation if player completes sets

**EDGE CASES:**
- **redHybrid1 → Cannot swap patron on redHybrid1 itself**
  - The patron placed on redHybrid1 is excluded from swap selection
  - Verify UI doesn't show it as swappable

- **redHybrid1 → Both players get same action type**
  - Player A has patron on gain3yellow
  - Player B has patron on gain3yellow (different location)
  - They swap
  - Both should execute gain3yellow with their own modals
  - Verify modal routing keeps them separate

- **redHybrid1 → Swapping in 3-4 player games**
  - Player A can swap with any other player's patron
  - Choice modal should show all available swap targets
  - Verify targeting works with 3-4 players

- **redHybrid1 → Recursion depth tracking**
  - Swap increments depth to 1
  - Each swapped action execution increments further
  - Verify depth < 5 maintained
  - If swapped action has modals leading to more actions, track depth

- **redHybrid1 → lastGain tracking during swap**
  - Player A swaps onto gain3yellow, gains resources
  - Does this update OTHER players' lastGain?
  - Expected: YES (UPDATE_RESOURCES should update lastGain)
  - Player B swaps onto yellowHybrid2, should see Player A's gain in lastGain

#### Code Locations to Verify
- `executeAction` - redHybrid1 implementation (~line 1830-1940)
- `effectiveTargetPlayerId` usage in swapped action execution (~line 1928, 1932)
- `gain3yellow` and `gain2yellow` modal routing (~line 1208, 1299)
- Exclusion of swap actions from swap selection (~line 1845-1849)

---

### Mechanic 3: Red R1 Shop (Repeat Round 1 Action)

#### Expected Behavior
1. Player purchases Red R1 shop (cost: based on shopCosts)
2. Player sees modal with ALL their R1 actions (excluding excluded actions)
3. Player chooses one R1 action to repeat
4. Action executes as if patron just placed
5. Cannot repeat: shop benefit actions, other repeat actions

#### Comprehensive Interaction Analysis

**RED LAYER INTERACTIONS:**
- **Red R1 Shop → Repeat gain3red / gain2red**
  - Simple resource gain
  - Player chooses to repeat gain3red
  - Gains 3 red resources
  - No modal, instant execution
  - Verify resources added correctly

- **Red R1 Shop → Repeat redHybrid1 (swap both execute)**
  - Should be EXCLUDED from repeat list
  - Prevents infinite complexity (shop → swap → shop → swap...)
  - Verify exclusion list includes 'redHybrid1'
  - If not excluded: risk of cascading swaps

- **Red R1 Shop → Repeat redRepeatAction**
  - Should be EXCLUDED from repeat list
  - Prevents infinite loop (shop repeat → repeat action → shop repeat...)
  - Verify exclusion list includes 'redRepeatAction'
  - Critical exclusion for game stability

- **Red R1 Shop → No R2/R3 red actions available**
  - Round filtering: allowedRounds = [1]
  - redVPFocus (R2) should NOT appear in list
  - redRepeatAll (R3) should NOT appear in list
  - Verify only R1 actions shown

**YELLOW LAYER INTERACTIONS:**
- **Red R1 Shop → Repeat gain3yellow / gain2yellow**
  - Player purchases Red R1 shop
  - Chooses to repeat gain3yellow
  - Modal appears for gem selection (3 gems)
  - Player chooses gems and receives them
  - lastGain tracking: Does this update OTHER players' lastGain?
  - Expected: YES (normal resource gain)
  - Verify modal routing works correctly

- **Red R1 Shop → Repeat steal2Gems (trade all)**
  - Player repeats steal2Gems via shop
  - Sees modal to choose new resource distribution
  - Total resources stay same, just redistributed
  - No R2/R3 yellow actions available (round filtering)

- **Red R1 Shop → Repeat yellowHybrid1**
  - Simple +2 yellow gain
  - No modal needed
  - Instant execution via shop repeat

**BLUE LAYER INTERACTIONS:**
- **Red R1 Shop → Repeat gain3blue / gain2blue**
  - Simple resource gain
  - No modal needed
  - Player repeats and gains resources

- **Red R1 Shop → Repeat blueR1ShopBenefit**
  - CRITICAL EXCLUSION TEST
  - Should be EXCLUDED from repeat list
  - Prevents infinite loop: Red R1 shop → blueR1ShopBenefit → another shop → Red R1 shop...
  - Verify exclusion list includes 'blueR1ShopBenefit'
  - If not excluded: potential infinite recursion
  - Check exclusion at ~line 4473-4478

- **Red R1 Shop → Repeat blueReduceCosts**
  - Player repeats blueReduceCosts
  - Shop costs reduced by 1 for this round
  - Effect stacks with previous uses?
  - Verify shopCostModifier calculation
  - If player already used blueReduceCosts, does repeat reduce by another 1?

- **Red R1 Shop → No R2/R3 blue actions in list**
  - blueIncreaseCosts (R2) should NOT appear
  - blueToggleShops (R2) should NOT appear
  - blueAnyShopBenefit (R3) should NOT appear
  - Verify round filtering works

**BLACK LAYER INTERACTIONS:**
- **Red R1 Shop → Repeat gain3black / gain2black**
  - Simple resource gain via repeat
  - No modal needed

- **Red R1 Shop → Repeat blackSteal1VP**
  - Player repeats blackSteal1VP
  - Modal appears: choose target player
  - Player steals 1 VP from target
  - Verify modal routing
  - VP transfer should work correctly

- **Red R1 Shop → Repeat blackSteal2Any**
  - Player repeats blackSteal2Any
  - Modal 1: choose target player
  - Modal 2: choose 2 gems to steal
  - Both modals should appear sequentially
  - Verify resources transferred correctly
  - Multiplayer: verify target player sees decrease

- **Red R1 Shop → Repeat blackHybrid1**
  - Simple: +1 black + 2 VP
  - No modal needed
  - Resources and VP added instantly

- **Red R1 Shop → No R2/R3 black actions in list**
  - blackStealWorker (R2) should NOT appear
  - blackSteal3VP (R3) should NOT appear
  - Verify round filtering

**SHOP INTERACTIONS:**
- **Red R1 Shop → Then use another shop same turn**
  - Player purchases Red R1 shop, repeats action
  - Can player then purchase another shop this turn?
  - Expected: YES (unless VP shop used, which ends turn)
  - Verify shop purchase flow continues

- **Red R1 Shop → Cost with modifiers**
  - Player used blueReduceCosts earlier (-1 cost)
  - Red R1 shop cost should reflect modifier
  - Verify shopCostModifier applied correctly
  - Different players see different costs (per-player modifier)

- **Red R1 Shop → Repeat action that triggers another shop**
  - Player repeats action that gives resources
  - Player then buys another shop with those resources
  - Verify shop phase continues after repeat
  - Resources available immediately after repeat

- **Red R1 Shop → Used via blueAnyShopBenefit**
  - Player uses blueAnyShopBenefit (R3 action)
  - Chooses Red R1 shop benefit
  - Should execute for FREE (no cost)
  - Player then repeats an R1 action
  - Recursion: blueAnyShopBenefit → Red R1 shop → repeated action
  - Verify recursion depth tracking (depth should be ~3)

- **Red R1 Shop → Used via Blue R1 shop**
  - Player uses Blue R1 shop (get R1 shop benefit)
  - Chooses Red R1 shop
  - Deep recursion: Blue R1 shop → Red R1 shop → repeat action
  - Verify recursion depth increments correctly
  - Check max depth = 5 not exceeded

- **Red R1 Shop → Multiple times same turn**
  - Can player use Red R1 shop multiple times?
  - Each shop can only be purchased once per turn (general rule)
  - But via blueAnyShopBenefit/blueR1ShopBenefit, could execute multiple times
  - Verify behavior is correct

**AUTO VP INTERACTIONS:**
- **Red R1 Shop → Blue auto VP trigger**
  - Player purchases Red R1 shop (shop was used)
  - Should trigger Blue auto VP for ALL players
  - Expected: +1 VP to all players
  - Verify VP added to all players in multiplayer
  - Check gameReducer or executeShopBenefit for trigger

- **Red R1 Shop → Repeat action that uses shop**
  - Player repeats blueR1ShopBenefit via Red R1 shop (if not excluded)
  - Actually, should be excluded
  - But if it worked: would trigger Blue auto VP twice?
  - First trigger: Red R1 shop purchase
  - Second trigger: blueR1ShopBenefit uses a shop
  - Verify exclusion prevents this complexity

**EDGE CASES:**
- **Red R1 Shop → No R1 actions available**
  - Player has no patrons on R1 actions
  - Or all R1 actions are excluded
  - What happens when player purchases shop?
  - Expected: Modal shows empty list or "no actions available"
  - Player should not lose resources if no action to repeat
  - Verify error handling

- **Red R1 Shop → Exclusion list completeness**
  - Exclusion list should include: 'redRepeatAction', 'blueR1ShopBenefit', 'blueAnyShopBenefit', 'purpleShopHybrid'
  - Verify all excluded actions are actually excluded
  - Check ~line 4473-4478 in executeRepeatAction

- **Red R1 Shop → Recursion depth tracking**
  - Shop execution depth starts at current depth + 1
  - Repeated action execution increments depth further
  - If repeated action has modals leading to more actions, depth continues
  - Verify depth < 5 at all times
  - Test: depth 4 shop → repeat action → should work
  - Test: depth 5 shop → should prevent execution

- **Red R1 Shop → Player with doubling effect**
  - Player has Yellow R1 shop effect (double next gain)
  - Player uses Red R1 shop, repeats gain3yellow
  - Should doubling effect apply to repeated gain?
  - Expected: YES (effect applies to next gain, regardless of source)
  - Verify doubling effect consumed after repeat

- **Red R1 Shop → Multiplayer shop state**
  - Player A purchases Red R1 shop
  - Shop status changes to 'used' for all players
  - Player B cannot purchase same shop this round
  - Verify shop state syncs correctly in multiplayer

- **Red R1 Shop → With force red placement active**
  - Player has force red effect active (from white action)
  - Does force red affect the repeated action?
  - Expected: NO (force red applies when placing patron, not when repeating)
  - Verify force red does not interfere with repeat

- **Red R1 Shop → lastGain tracking**
  - Player uses Red R1 shop, repeats gain3yellow
  - Player gains 3 gems
  - Do OTHER players' lastGain update with this gain?
  - Expected: YES (UPDATE_RESOURCES updates lastGain for all other players)
  - Verify lastGain tracking works through shop repeats

#### Code Locations to Verify
- `executeShopBenefit` - Red R1 shop (~line 5435)
- `executeRepeatAction` - allowedRounds parameter (~line 4470)
- Exclusion list (~line 4473-4478)
- Recursion depth tracking

---

### Mechanic 4: blueAnyShopBenefit (Blue R3 Action)

#### Expected Behavior
1. Player places patron on blueAnyShopBenefit
2. Player sees modal with ALL shop options (R1, R2, R3, VP shops from all layers)
3. Shop status (open/closed) ignored
4. Player chooses one shop
5. Shop benefit executes WITHOUT cost payment
6. If shop benefit gives VP, player gets VP
7. Blue auto VP (+1 VP to all players) should trigger? (Need to verify)

#### Comprehensive Interaction Analysis

**RED LAYER INTERACTIONS:**
- **blueAnyShopBenefit → Red R1 shop (Repeat R1 action)**
  - Player uses blueAnyShopBenefit action
  - Chooses Red R1 shop from modal
  - Executes Red R1 shop benefit for FREE (no cost)
  - Player then sees modal to choose R1 action to repeat
  - Recursion: blueAnyShopBenefit (depth 1) → Red R1 shop (depth 2) → repeated action (depth 3)
  - Verify recursion depth tracking
  - Verify modal routing correct
  - Does Blue auto VP trigger? (Shop was used via action)

- **blueAnyShopBenefit → Red R2 shop (Gain red = patrons)**
  - Player chooses Red R2 shop
  - Gains red resources equal to red patron count
  - No modal needed
  - Executes for free

- **blueAnyShopBenefit → Red R3 shop (Repeat all twice)**
  - Player chooses Red R3 shop
  - Can repeat all actions TWICE
  - Complex recursion: blueAnyShopBenefit → Red R3 shop → repeat all sequence (2x)
  - Each repeated action increments depth
  - Verify max depth = 5 not exceeded
  - Verify exclusion lists work during repeats

- **blueAnyShopBenefit → Red VP shop (VP per red patron)**
  - Player chooses Red VP shop
  - Gains VP equal to red patron count
  - Executes for free
  - Does this count as VP shop usage? (vpShopUsed flag)
  - Expected: YES (should set flag, end turn)
  - Verify turn ends after VP shop via blueAnyShopBenefit

**YELLOW LAYER INTERACTIONS:**
- **blueAnyShopBenefit → Yellow R1 shop (Double next gain)**
  - Player chooses Yellow R1 shop
  - Sets doubling effect for next resource gain
  - No cost paid
  - Player's next resource gain should be doubled
  - Verify effect persists after blueAnyShopBenefit execution

- **blueAnyShopBenefit → Yellow R2 shop (Trigger Yellow auto VP)**
  - Critical auto VP test
  - Player chooses Yellow R2 shop
  - Yellow auto VP calculation runs:
    - Count complete sets of 4 different yellow gems
    - Award VP based on set count
  - Does Blue auto VP ALSO trigger? (Shop was used)
  - Expected: YES (shop usage via action should trigger Blue auto VP)
  - Verify both VP systems work correctly

- **blueAnyShopBenefit → Yellow R3 shop (Trade all, +1 yellow per trade)**
  - Player chooses Yellow R3 shop
  - Modal: player trades all resources for new distribution
  - Gains +1 yellow per resource traded
  - Verify modal routing
  - Verify resource calculation correct

- **blueAnyShopBenefit → Yellow VP shop (VP per yellow patron)**
  - Player chooses Yellow VP shop
  - Gains VP equal to yellow patron count
  - Executes for free
  - Should set vpShopUsed flag, end turn
  - Verify turn ends correctly

**BLUE LAYER INTERACTIONS:**
- **blueAnyShopBenefit → Blue R1 shop (Get R1 shop benefit)**
  - Deep recursion scenario
  - Player uses blueAnyShopBenefit, chooses Blue R1 shop
  - Blue R1 shop benefit: Execute any R1 shop benefit for free
  - Recursion: blueAnyShopBenefit (depth 1) → Blue R1 shop (depth 2) → chosen R1 shop (depth 3) → shop benefit (depth 4)
  - If chosen shop is Red R1 (repeat action): depth could reach 5
  - Verify max depth = 5 enforced
  - Does Blue auto VP trigger once or multiple times?

- **blueAnyShopBenefit → Blue R2 shop (Gain blue = patrons)**
  - Player chooses Blue R2 shop
  - Gains blue resources equal to blue patron count
  - No modal needed
  - Executes for free

- **blueAnyShopBenefit → Blue R3 shop (Gain 1 each, +VP per pair)**
  - Player chooses Blue R3 shop
  - Gains 1 of each resource color in game
  - Gains VP for each pair of resources
  - VP calculation should work correctly
  - Executes for free

- **blueAnyShopBenefit → Blue VP shop (+1 VP per Blue auto VP trigger)**
  - Player chooses Blue VP shop
  - Gains VP based on Blue auto VP counter (how many times shops used)
  - Executes for free
  - Should set vpShopUsed flag, end turn
  - Verify VP calculation from auto VP counter

**BLACK LAYER INTERACTIONS:**
- **blueAnyShopBenefit → Black R1 shop (Steal yellow, give red)**
  - Player chooses Black R1 shop
  - Modal: choose target player
  - Steals yellow resources from target, gives them red
  - Executes for free
  - Verify modal routing
  - Verify resource transfers

- **blueAnyShopBenefit → Black R2 shop (Steal = VP given)**
  - Player chooses Black R2 shop
  - Steals resources equal to VP given to player this turn
  - Calculation based on VP gains this turn
  - Verify VP tracking and resource calculation

- **blueAnyShopBenefit → Black R3 shop (Steal VP, place patron)**
  - Player chooses Black R3 shop
  - Modal 1: Choose player to steal VP from
  - Modal 2: Choose action to place stolen patron on
  - Complex multi-modal scenario
  - Executes for free
  - Verify both modals route correctly
  - Verify patron placement works

- **blueAnyShopBenefit → Black VP shop (Steal 2 VP from each)**
  - Critical multiplayer test
  - Player chooses Black VP shop
  - Steals 2 VP from EACH other player
  - Multiplayer loop: for each other player, steal 2 VP
  - Executes for free
  - Should set vpShopUsed flag, end turn
  - Verify VP transfers from all players
  - Verify turn ends correctly

**SHOP INTERACTIONS:**
- **blueAnyShopBenefit → VP shop usage flag**
  - Player uses blueAnyShopBenefit, chooses VP shop
  - Does vpShopUsed flag get set?
  - Expected: YES (VP shops always end turn)
  - Verify turn ends after VP shop execution
  - Verify player cannot use another VP shop this turn

- **blueAnyShopBenefit → Closed shops**
  - All shops are closed (via blueToggleShops)
  - Player uses blueAnyShopBenefit
  - Should see ALL shops in modal (status ignored)
  - Can choose and execute closed shops
  - Verify shop status check bypassed

- **blueAnyShopBenefit → Already used shops**
  - Player purchases Red R1 shop earlier
  - Player uses blueAnyShopBenefit
  - Can choose Red R1 shop again?
  - Expected: YES (blueAnyShopBenefit ignores shop usage state)
  - Verify shop can be executed multiple times via action

- **blueAnyShopBenefit → Cost modifiers don't matter**
  - Player has increased shop costs (+2 from opponent)
  - Player uses blueAnyShopBenefit
  - All shops execute for FREE (cost ignored)
  - Verify no cost deducted

- **blueAnyShopBenefit → Recursion via Red R1 shop**
  - Player uses blueAnyShopBenefit → Red R1 shop
  - Red R1 shop lets player repeat an R1 action
  - Can player repeat blueAnyShopBenefit again?
  - Should be EXCLUDED from Red R1 shop repeat list
  - Verify exclusion list includes 'blueAnyShopBenefit'
  - Check ~line 4473-4478

- **blueAnyShopBenefit → Via redRepeatAll**
  - Player has patron on blueAnyShopBenefit
  - Player uses redRepeatAll, includes blueAnyShopBenefit in sequence
  - Should work (not excluded from repeat all)
  - Player chooses shop during repeat sequence
  - Verify modal routing during repeat
  - Verify recursion depth tracking

**AUTO VP INTERACTIONS:**
- **blueAnyShopBenefit → Blue auto VP trigger**
  - When player uses blueAnyShopBenefit and chooses a shop
  - Does Blue auto VP trigger for ALL players?
  - Question: Is blueAnyShopBenefit itself considered "using a shop"?
  - Or: Does only the chosen shop trigger Blue auto VP?
  - Expected behavior needs verification
  - Check code for trigger conditions
  - Test: Player uses blueAnyShopBenefit → Red R1 shop
  - Should ALL players get +1 VP? (Shop was used)

- **blueAnyShopBenefit → Yellow R2 shop → Both auto VPs**
  - Player uses blueAnyShopBenefit, chooses Yellow R2 shop
  - Yellow auto VP triggers (calculate sets)
  - Does Blue auto VP also trigger?
  - Expected: YES (shop was used)
  - Verify both VP calculations work
  - Verify all players get Blue auto VP

**EDGE CASES:**
- **blueAnyShopBenefit → No shops available**
  - All shops in excluded list (edge case)
  - Player uses blueAnyShopBenefit
  - What shops are shown?
  - Expected: ALL shops from all layers (R1/R2/R3/VP)
  - Should be many options available

- **blueAnyShopBenefit → Modal shows all layers**
  - Modal should show shops organized by layer/round
  - Red shops: R1, R2, R3, VP
  - Yellow shops: R1, R2, R3, VP
  - Blue shops: R1, R2, R3, VP
  - Black shops: R1, R2, R3, VP
  - Verify UI shows all options clearly
  - Verify player can select any shop

- **blueAnyShopBenefit → Recursion depth limit**
  - Test deep recursion: blueAnyShopBenefit → Blue R1 shop → Red R1 shop → repeat action with modal → another action
  - Verify depth counter increments at each step
  - Verify depth = 5 prevents further execution
  - Verify error handling at max depth

- **blueAnyShopBenefit → Multiplayer modal routing**
  - Player A uses blueAnyShopBenefit
  - Chooses shop with modals (e.g., Black R1 shop)
  - All modals should route to Player A
  - Other players should not see modals
  - Verify effectiveTargetPlayerId used correctly

- **blueAnyShopBenefit → Turn ending**
  - Player uses blueAnyShopBenefit, chooses non-VP shop
  - Turn should continue (player can place more patrons)
  - Player uses blueAnyShopBenefit, chooses VP shop
  - Turn should END immediately
  - Verify turn phase transitions correct

- **blueAnyShopBenefit → lastGain tracking**
  - Player uses blueAnyShopBenefit, chooses shop that gives resources
  - Example: Red R2 shop (gain red = patrons)
  - Do OTHER players' lastGain update?
  - Expected: YES (if UPDATE_RESOURCES called)
  - Verify lastGain tracking through shop benefits

- **blueAnyShopBenefit → Doubling effects**
  - Player has Yellow R1 shop effect (double next gain)
  - Player uses blueAnyShopBenefit, chooses shop that gives resources
  - Should doubling effect apply?
  - Expected: YES (effect applies to next gain, regardless of source)
  - Verify doubling effect consumed

- **blueAnyShopBenefit → Excluded from repeat**
  - Verify blueAnyShopBenefit is in exclusion list for:
    - Red R1 shop (repeat R1 action)
    - redRepeatAction
  - Check exclusion list at ~line 4473-4478
  - Prevents infinite loops

#### Code Locations to Verify
- `executeAction` - blueAnyShopBenefit (~line 2525-2600)
- `executeShopBenefit` - All shop implementations
- VP shop handling in blueAnyShopBenefit (~line 2553-2580)
- Blue auto VP triggering (~line in gameReducer or executeShopBenefit)
- Exclusion list for Red R1 shop (~line 4473)

---

### Mechanic 5: yellowHybrid2 (Yellow R2 - Copy Last Gain)

#### Expected Behavior
1. Player places patron on yellowHybrid2, gets +1 yellow
2. System checks player.lastGain (resources gained by OTHER players, not self)
3. If lastGain exists and has resources, player gains same resources
4. If lastGain empty or null, player gets default resources
5. lastGain should be updated whenever ANY player gains resources (via UPDATE_RESOURCES)
6. lastGain should NOT track own gains, only other players' gains

#### Comprehensive Interaction Analysis

**RED LAYER INTERACTIONS:**
- **yellowHybrid2 → After another player uses gain3red / gain2red**
  - Player A uses gain3red (gains 3 red)
  - Player B's lastGain updates to {red: 3}
  - Player B uses yellowHybrid2
  - Player B should gain 3 red (copying Player A's gain)
  - Verify lastGain tracking works for simple gains
  - Verify resources transferred correctly

- **yellowHybrid2 → After another player uses redVPFocus (R2)**
  - Player A uses redVPFocus (+1 red + VP per red patron)
  - Player A has 3 red patrons, gains 1 red + 3 VP
  - Player B's lastGain updates to {red: 1}
  - Player B uses yellowHybrid2, gains 1 red (VP not copied, only resources)
  - Verify only resources tracked in lastGain, not VP

- **yellowHybrid2 → After another player uses redRepeatAll**
  - Player A uses redRepeatAll, repeats 3 actions:
    - First action: gains {red: 2, blue: 1}
    - Second action: gains {yellow: 3}
    - Third action: gains {black: 2}
  - Which gain is tracked in Player B's lastGain?
  - Expected: LAST gain (most recent) = {black: 2}
  - Player B uses yellowHybrid2, should gain {black: 2}
  - Verify lastGain updates with each resource gain during repeat
  - Verify most recent gain is what gets copied

- **yellowHybrid2 → After own gain (same player)**
  - Player A uses gain3yellow, gains {yellow: 3}
  - Player A's own lastGain should NOT update (own gains excluded)
  - Player A uses yellowHybrid2 on same turn
  - Player A should copy PREVIOUS other player's lastGain
  - Verify own gains don't overwrite lastGain

- **yellowHybrid2 → After another player swaps via redHybrid1**
  - Player A uses redHybrid1, swaps onto gain3yellow
  - Player A gains {yellow: 3} during swap execution
  - Player B's lastGain updates to {yellow: 3}
  - Player B uses yellowHybrid2, gains {yellow: 3}
  - Verify lastGain tracking works through swap actions

**YELLOW LAYER INTERACTIONS:**
- **yellowHybrid2 → After another player uses gain3yellow / gain2yellow**
  - Critical test for color variety
  - Player A uses gain3yellow, chooses 2 red + 1 blue
  - Player B's lastGain updates to {red: 2, blue: 1}
  - Player B uses yellowHybrid2
  - Player B should gain 2 red + 1 blue (exact copy)
  - Verify multi-color lastGain tracking works

- **yellowHybrid2 → After another player uses steal2Gems**
  - Player A uses steal2Gems (trades all resources)
  - Player A had 5 resources, trades for 5 different resources
  - Player A's new distribution: {red: 2, yellow: 2, blue: 1}
  - Is this tracked as lastGain? (5 resources gained?)
  - Or is it not tracked? (no NET gain, just trade)
  - Need to verify if trades update lastGain
  - Player B uses yellowHybrid2, what happens?

- **yellowHybrid2 → After another player uses steal3Gems (R2)**
  - Player A uses steal3Gems, gains 4 any resources
  - Player A chooses {red: 2, yellow: 2}
  - Player B's lastGain updates to {red: 2, yellow: 2}
  - Player B uses yellowHybrid2, gains {red: 2, yellow: 2}
  - Verify multi-resource lastGain copying

- **yellowHybrid2 → Chaining yellowHybrid2**
  - Player A uses yellowHybrid2, copies {red: 3} from previous player
  - Player A gains {red: 3}
  - Player B's lastGain updates to {red: 3}
  - Player B uses yellowHybrid2, also gains {red: 3}
  - Verify yellowHybrid2 gains propagate to other players' lastGain
  - "Telephone game" of copying gains

- **yellowHybrid2 → After another player uses yellowSwapResources (R3)**
  - Player A uses yellowSwapResources (gain 3 of each color)
  - Player A gains {red: 3, yellow: 3, blue: 3, black: 3}
  - Player B's lastGain updates to all these resources
  - Player B uses yellowHybrid2, gains {red: 3, yellow: 3, blue: 3, black: 3}
  - Verify large multi-color lastGain copying

**BLUE LAYER INTERACTIONS:**
- **yellowHybrid2 → After another player uses gain3blue / gain2blue**
  - Simple single-color copying
  - Player A gains {blue: 3}
  - Player B copies {blue: 3}
  - Verify works correctly

- **yellowHybrid2 → After another player uses blueR1ShopBenefit**
  - Player A uses blueR1ShopBenefit, executes shop
  - Shop gives resources (depends which shop chosen)
  - Example: Red R2 shop, Player A gains red = patron count
  - Player A gains {red: 4}
  - Player B's lastGain updates to {red: 4}
  - Player B uses yellowHybrid2, gains {red: 4}
  - Verify lastGain tracks resources from shop executions

- **yellowHybrid2 → After another player uses blueAnyShopBenefit (R3)**
  - Player A uses blueAnyShopBenefit, chooses shop that gives resources
  - Player A gains resources from chosen shop
  - Player B's lastGain updates
  - Player B uses yellowHybrid2, copies those resources
  - Verify lastGain tracking through complex shop actions

**BLACK LAYER INTERACTIONS:**
- **yellowHybrid2 → After another player uses gain3black / gain2black**
  - Simple black resource copying
  - Player A gains {black: 3}
  - Player B copies {black: 3}
  - Verify works correctly

- **yellowHybrid2 → After another player uses blackSteal2Any (R1)**
  - Player A uses blackSteal2Any
  - Steals 2 resources from target
  - Player A gains {red: 1, yellow: 1}
  - Player B's lastGain updates to {red: 1, yellow: 1}
  - Player B uses yellowHybrid2, gains {red: 1, yellow: 1}
  - Verify stolen resources tracked in lastGain

- **yellowHybrid2 → After another player uses blackStealWorker (R2)**
  - Player A uses blackStealWorker
  - Steals patron + up to 4 resources from target
  - Player A gains {red: 2, blue: 2}
  - Player B's lastGain updates to {red: 2, blue: 2}
  - Player B uses yellowHybrid2, gains {red: 2, blue: 2}
  - Verify resources (not patron) tracked in lastGain

- **yellowHybrid2 → After another player uses blackHybrid1 (R1)**
  - Player A uses blackHybrid1 (+1 black + 2 VP)
  - Player A gains {black: 1}
  - Player B's lastGain updates to {black: 1}
  - Player B uses yellowHybrid2, gains {black: 1}
  - Verify only resource tracked, not VP

**SHOP INTERACTIONS:**
- **yellowHybrid2 → With Yellow R1 shop (Double next gain)**
  - Player A has NOT used Yellow R1 shop
  - Player B has used Yellow R1 shop (doubling effect active)
  - Player A gains {red: 3}
  - Player B's lastGain updates to {red: 3}
  - Player B uses yellowHybrid2
  - Should Player B gain {red: 6} (3 × 2 with doubling)?
  - Expected: YES (doubling applies to next gain, including copied gain)
  - Verify doubling effect works with yellowHybrid2
  - Verify doubling effect consumed after yellowHybrid2

- **yellowHybrid2 → After another player uses shop-generated resources**
  - Player A purchases Red R2 shop (gain red = patrons)
  - Player A gains {red: 5}
  - Player B's lastGain updates to {red: 5}
  - Player B uses yellowHybrid2, gains {red: 5}
  - Verify shop-generated gains tracked in lastGain

- **yellowHybrid2 → With shop cost modifiers**
  - Shop cost modifiers should NOT affect yellowHybrid2
  - yellowHybrid2 is an action, not a shop
  - Player uses yellowHybrid2 regardless of shop states
  - Verify no interference from shop mechanics

- **yellowHybrid2 → After another player uses Red R1 shop**
  - Player A uses Red R1 shop, repeats gain3yellow
  - Player A gains {yellow: 3} from repeated action
  - Player B's lastGain updates to {yellow: 3}
  - Player B uses yellowHybrid2, gains {yellow: 3}
  - Verify gains from shop-repeated actions tracked

- **yellowHybrid2 → After Yellow R2 shop (auto VP trigger)**
  - Player A purchases Yellow R2 shop (triggers Yellow auto VP)
  - Does shop purchase itself give resources tracked in lastGain?
  - Expected: NO (shop purchase doesn't give resources directly)
  - Player B uses yellowHybrid2, copies previous lastGain (not shop)

**AUTO VP INTERACTIONS:**
- **yellowHybrid2 → Does not trigger Yellow auto VP directly**
  - Player uses yellowHybrid2, copies {yellow: 4} (1 of each yellow gem)
  - Player now has complete set of 4 yellow gems
  - Does Yellow auto VP trigger?
  - Expected: Depends on implementation (check if resource gain triggers auto VP check)
  - Verify Yellow auto VP calculation after yellowHybrid2

- **yellowHybrid2 → After Blue auto VP triggered**
  - Player A uses shop, all players get +1 VP (Blue auto VP)
  - VP gain does NOT update lastGain (only resources tracked)
  - Player B uses yellowHybrid2, copies previous RESOURCE gain
  - Verify VP gains don't interfere with lastGain tracking

**EDGE CASES:**
- **yellowHybrid2 → Empty lastGain (no previous gains)**
  - Game start, no player has gained resources yet
  - Player uses yellowHybrid2
  - Player's lastGain is empty/null
  - What happens?
  - Expected: Player gets default resources (e.g., {yellow: 1})
  - Verify default gain when lastGain empty
  - Check ~line 2088-2130 for default behavior

- **yellowHybrid2 → lastGain with many resource types**
  - Player A gains {red: 1, yellow: 2, blue: 1, black: 1, purple: 1}
  - Player B's lastGain updates to all these
  - Player B uses yellowHybrid2
  - Player B should gain exact copy of all resources
  - Verify multi-type resource copying

- **yellowHybrid2 → In 3-4 player games**
  - 3 players: A, B, C
  - Player A gains {red: 3}
  - Players B and C's lastGain both update to {red: 3}
  - Player B uses yellowHybrid2, gains {red: 3}
  - Now Players A and C's lastGain update to {red: 3}
  - Player C uses yellowHybrid2, gains {red: 3}
  - Verify lastGain propagates correctly in multiplayer

- **yellowHybrid2 → After own gain, then another player's gain**
  - Player A gains {red: 2} (own gain, doesn't update own lastGain)
  - Player B gains {blue: 3} (updates Player A's lastGain to {blue: 3})
  - Player A uses yellowHybrid2
  - Player A should gain {blue: 3} (not own previous gain)
  - Verify own gains properly excluded from own lastGain

- **yellowHybrid2 → Repeated via redRepeatAll**
  - Player has patron on yellowHybrid2
  - Player uses redRepeatAll, includes yellowHybrid2
  - yellowHybrid2 executes during repeat sequence
  - Uses current lastGain at time of execution
  - Verify lastGain reference is correct during repeats

- **yellowHybrid2 → Repeated via Red R1 shop**
  - Player uses Red R1 shop, repeats yellowHybrid2
  - Copies current lastGain
  - Verify works correctly via shop repeat

- **yellowHybrid2 → Swapped onto via redHybrid1**
  - Player A uses redHybrid1, swaps onto Player B's yellowHybrid2
  - Player A executes yellowHybrid2
  - Uses Player A's lastGain (not Player B's)
  - Verify correct player's lastGain used after swap

- **yellowHybrid2 → lastGain persistence across rounds**
  - Round 1: Player A gains {red: 3}
  - Player B's lastGain = {red: 3}
  - Round 2 starts
  - Player B's lastGain should still be {red: 3} (persists)
  - Player B uses yellowHybrid2, gains {red: 3}
  - Verify lastGain persists across round boundaries
  - lastGain only updates when NEW resource gains occur

- **yellowHybrid2 → Zero-resource lastGain**
  - Player A gains 0 resources (edge case, shouldn't happen)
  - Or lastGain = {} (empty object)
  - Player B uses yellowHybrid2
  - Should get default resources
  - Verify empty lastGain handled gracefully

- **yellowHybrid2 → Doubling effect stacking**
  - Player has doubling effect active
  - Player uses yellowHybrid2, copies {red: 2}
  - Should gain {red: 4} (2 × 2)
  - Doubling effect consumed
  - Player uses yellowHybrid2 again (via repeat)
  - No doubling effect, gains normal amount
  - Verify doubling effect only applies once

- **yellowHybrid2 → UPDATE_RESOURCES logic**
  - Check gameReducer UPDATE_RESOURCES action
  - Should update lastGain for ALL players EXCEPT the gaining player
  - Format: player.lastGain = resourcesGained
  - Verify logic in reducer handles this correctly
  - Verify lastGain not updated for self

#### Code Locations to Verify
- `executeAction` - yellowHybrid2 (~line 2088-2130)
- `gameReducer` - UPDATE_RESOURCES, lastGain tracking
- lastGain update logic (should exclude self, include others)
- Doubling effect application to copied gains

---

## Interaction Matrix

| Mechanic 1 | Mechanic 2 | Interaction | Risk Level |
|------------|------------|-------------|------------|
| redRepeatAll | yellowHybrid2 | lastGain tracking through repeats | HIGH |
| redRepeatAll | blueR1ShopBenefit | Recursion + auto VP | HIGH |
| redRepeatAll | blackStealWorker | Modal routing in repeats | MEDIUM |
| redHybrid1 | gain3yellow | Modal routing (multiplayer) | HIGH |
| redHybrid1 | blackSteal2Any | Modal routing (double modal) | HIGH |
| redHybrid1 | blueR1ShopBenefit | Both execute shop benefit | MEDIUM |
| Red R1 Shop | blueR1ShopBenefit | Exclusion (infinite loop) | CRITICAL |
| Red R1 Shop | redRepeatAction | Exclusion (infinite loop) | CRITICAL |
| blueAnyShopBenefit | Red R1 Shop | Recursion depth | HIGH |
| blueAnyShopBenefit | Yellow R2 Shop | VP calculation + auto VP | MEDIUM |
| blueAnyShopBenefit | Black VP Shop | Multiplayer VP stealing | MEDIUM |
| yellowHybrid2 | redRepeatAll | lastGain after multi-repeat | HIGH |
| yellowHybrid2 | Yellow R1 Shop | Doubling effect on copy | MEDIUM |

## Edge Cases & Considerations

### Recursion Depth
- Max depth = 5
- Must track across: actions → shops → actions → shops
- Verify depth increments at each executeAction call
- Verify depth passed through all execution paths

### Multiplayer Modal Routing
- targetPlayerId must route to correct player
- Each player sees only THEIR modals
- Modal state should not sync to Firebase (local only)
- Verify effectiveTargetPlayerId used everywhere

### Exclusion Lists
- redRepeatAction excludes: 'redRepeatAction', 'blueR1ShopBenefit', 'blueAnyShopBenefit', 'purpleShopHybrid'
- redHybrid1/redHybrid2 exclude: swap actions from selection
- Verify exclusions prevent infinite loops

### Auto VP Mechanics
- Blue auto VP: +1 VP to ALL players when ANYONE uses shop
- Must trigger in multiplayer for all players
- Must trigger when shops used via blueAnyShopBenefit/blueR1ShopBenefit

### lastGain Tracking
- Updated on UPDATE_RESOURCES for OTHER players only
- Not updated for own gains
- Must persist across turns/rounds
- Must handle empty/null lastGain

### VP Shop Interactions
- vpShopUsed flag limits 1 VP shop per turn
- Does blueAnyShopBenefit bypass this limit? (Need to verify)
- VP shop should end turn after purchase
- Verify VP shops work through blueAnyShopBenefit

## Test Strategy

### Phase 1: Single-Player Tests
For each of the top 5 mechanics:
1. Test in isolation (no interactions)
2. Verify expected behavior matches code
3. Test with console logs to trace execution

### Phase 2: Interaction Tests (Single-Player)
For each interaction in the matrix:
1. Set up scenario in single-player
2. Execute interaction
3. Verify resource gains, VP changes, modal behavior
4. Check console logs for recursion depth, exclusions

### Phase 3: Multiplayer Tests
For key interactions (marked HIGH risk):
1. Set up 2-player game
2. Execute interaction with both players
3. Verify modal routing (each player sees their own)
4. Verify state sync (both players see correct state)
5. Test edge cases (disconnects, simultaneous actions)

### Phase 4: Recursion & Exclusion Tests
1. Attempt infinite loop scenarios (Red R1 shop → blueR1ShopBenefit)
2. Verify exclusion lists prevent loops
3. Test max recursion depth (depth > 5 should prevent execution)
4. Test deeply nested scenarios (repeat → swap → shop → repeat)

## Verification Approach

### For Each Mechanic:
1. **Read expected behavior** (this plan)
2. **Ultrathink trace through code** (src/App.jsx)
3. **Document code path** (write out execution sequence)
4. **Compare expected vs actual** (identify discrepancies)
5. **Flag issues** (add to issues list)
6. **Create test case** (manual test scenario)

### Ultrathink Prompts:
- "Trace execution of redRepeatAll when player has 3 patrons on R1 actions"
- "What happens when redHybrid1 swaps patrons on gain3yellow in multiplayer?"
- "Does blueAnyShopBenefit trigger Blue auto VP? Trace the code."
- "How is lastGain updated when player uses gain3yellow? Trace UPDATE_RESOURCES."

## Deliverables

After completing analysis:

1. **Verification Report** (in this file)
   - For each mechanic: Expected ✓ or ✗, Code behavior, Issues found

2. **Issue List** (separate section in this file)
   - Each issue: Description, Severity, Fix required

3. **Test Scenarios** (in this file)
   - Step-by-step manual test cases for multiplayer

4. **Code Fix Plan** (if issues found)
   - Which files to modify
   - What to change
   - How to test fix

## Next Steps After Approval

1. User reviews this plan
2. User approves or requests changes
3. Begin systematic analysis (NO CODING)
4. Document findings in this file
5. Report issues to user
6. Create fix plan for any bugs found
7. User approves fixes
8. Implement fixes step-by-step

---

**Ready for review!**
