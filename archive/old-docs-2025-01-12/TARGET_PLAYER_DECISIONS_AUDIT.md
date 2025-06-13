# Target Player Decisions Audit

## Overview
This document identifies all actions and effects in Patrons where a player other than the current player should make a decision. These represent opportunities for enhanced player agency and strategic depth.

## Current Implementation Status
Currently, ALL decisions are made by the active player, even when it affects other players. This creates situations where:
- Victims have no defensive agency when being stolen from
- Players receiving benefits have no choice in what they receive
- Strategic depth is reduced because targets are passive

## Actions Requiring Target Player Decisions

### 1. Defensive Choices (When Being Stolen From)

#### steal3Gems Action (Yellow Layer)
- **Current**: Active player chooses which 3 resources to steal from target
- **Should Be**: Target player chooses which 3 resources to lose
- **Location**: Line 3177 in react-game.html
- **Strategic Impact**: High - allows defensive resource management

#### Black Shop Effects (Steal VP)
- **black1**: Steal 1 VP from another player (Line 6488)
- **black2**: Steal 3 VP from another player (Line 6492)
- **black3**: Steal 5 VP from another player (Line 6496)
- **Current**: Active player just takes the VP
- **Should Be**: Consider defensive mechanics or VP protection options

#### Black Victory Shop (steal2FromEach)
- **Effect**: Steal 2 VP from each other player
- **Current**: Automatic theft from all players
- **Should Be**: Each player could choose to pay resources to prevent VP loss

### 2. Benefit Choices (When Receiving Resources)

#### Silver R2 Shop
- **Effect**: Active player gains 4 VP, chooses another player to gain 4 VP
- **Current**: Active player chooses who gets the benefit
- **Should Be**: Two-step process where chosen player accepts/declines
- **Location**: Line 6284 (executeSilver2Shop)

#### Silver R3 Shop
- **Effect**: Active player gains 7 silver, all other players gain 2 silver
- **Current**: Automatic distribution
- **Potential**: Players could choose alternative resources (2 of any color?)
- **Location**: Line 6340 (executeSilver3Shop)

#### silver8VPOthers3S Action (Silver Layer)
- **Effect**: Active player gains 8 VP, all others gain 3 silver
- **Current**: Automatic distribution
- **Potential**: Similar to Silver R3 shop enhancement
- **Location**: Line 4683

### 3. Worker Management Decisions

#### Red Hybrid Actions (redHybrid1 & redHybrid2)
- **Effect**: Swap workers between actions
- **Current**: Active player chooses both workers to swap
- **Should Be**: 
  - redHybrid1: Both players should benefit, so target should confirm/choose
  - redHybrid2: Current implementation is appropriate (active player benefit only)
- **Location**: Line 2924

#### Red R2 Shop
- **Effect**: Place another player's worker
- **Current**: Active player chooses where to place target's worker
- **Should Be**: Consider notification or veto option for target player
- **Location**: Line 6524 (executeRed2Shop)

### 4. Other Strategic Decisions

#### Trade All Resources (steal2Gems - renamed)
- **Current**: Active player trades all their own resources
- **Note**: This is appropriately a self-only action
- **Location**: Line 3124

#### Blue Increase Costs Action
- **Effect**: All other players' shop costs increase by 1
- **Current**: Automatic penalty to all
- **Potential**: Players could pay resources to avoid increase
- **Location**: Line 3681

#### White R2 Shop
- **Effect**: Skip next player's turn
- **Current**: Automatic skip
- **Potential**: Target could pay resources to avoid skip
- **Location**: Line 6480

## Implementation Priority

### High Priority (Core Gameplay)
1. **steal3Gems** - Most common defensive choice scenario
2. **Red Hybrid 1** - Worker swap should benefit both players
3. **Silver R2 Shop** - Gift-giving should involve recipient

### Medium Priority (Enhanced Strategy)
1. **Black VP Theft** - Add defensive options
2. **Silver/Resource Distribution** - Allow choice in received resources
3. **Red R2 Shop** - Notification system for placed workers

### Low Priority (Future Enhancements)
1. **Penalty Avoidance** - Pay to avoid negative effects
2. **Counter-play System** - Interrupt/response mechanics
3. **Pre-selection Defense** - Set defensive preferences in advance

## Design Patterns to Consider

### 1. Immediate Resolution (Simple)
- Current player makes all choices
- Add visual feedback for affected players
- Quick and maintains game flow

### 2. Deferred Decisions (Complex)
- Queue decisions for other players
- Resolve on their next turn
- More strategic but slower

### 3. Pre-Selection (Hybrid)
- Players set defensive preferences
- Auto-resolve based on preferences
- Balance of agency and flow

### 4. Notification Only (Minimal)
- Keep current system
- Add better notifications/animations
- Least development effort

## Recommendation

Start with high-priority actions using the Immediate Resolution pattern, but with enhanced UI feedback:
1. For steal3Gems, show target's resources clearly and let them arrange resources before theft
2. For worker swaps, show both players' benefits clearly
3. For gift-giving, add celebration animations

This maintains game flow while adding visual agency and strategic information.