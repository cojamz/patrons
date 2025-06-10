# Patrons Game Testing Checklist

## Core Mechanics Testing

### 🎯 Worker Placement
- [ ] Place worker on empty space
- [ ] Cannot place on occupied space
- [ ] Extra workers from purple actions work
- [ ] Skip turns consume extra turns properly
- [ ] Force red placement requires red actions
- [ ] Worker swap excludes swap actions

### 💰 Resource Management
- [ ] Basic gain actions give correct amounts
- [ ] Yellow "gain different colors" works
- [ ] Resource stealing works (black actions)
- [ ] Resource swapping works (yellow R3)
- [ ] Double gain effects apply and consume
- [ ] Gold conversion shops work correctly

### 🏪 Shop System
- [ ] Shop phase 1 → Worker phase → Shop phase 2
- [ ] Cost validation for specific + any combinations
- [ ] Shop cost modifiers stack properly
- [ ] Closed shops cannot be used (except blue)
- [ ] Blue shop benefits bypass closure
- [ ] Victory shops award correct VP

### 🏆 Victory Points
- [ ] VP can go negative
- [ ] Stealing VP works from any amount
- [ ] Automatic VP triggers correctly:
  - [ ] Red: On any red action
  - [ ] Yellow: End of round for diversity
  - [ ] Blue: When anyone uses shops
  - [ ] Purple: First/last out of workers
  - [ ] Gold: 1 per gold at round end
  - [ ] Silver: Leader gets resources, others get VP
- [ ] VP breakdown tooltip shows all sources

## Action Testing by Quad

### 🔴 Red Actions
- [ ] Swap workers (both players get actions)
- [ ] Swap workers (only you get action)
- [ ] Repeat single action (excludes swap/repeat)
- [ ] Repeat all actions (excludes swap/repeat)
- [ ] Force red placement works

### 🟡 Yellow Actions
- [ ] Gain different colored gems
- [ ] Trade all resources for equal amount
- [ ] Steal gems from players
- [ ] Swap all resources (R3)

### 🔵 Blue Actions
- [ ] Gain R1 shop benefit (even if closed)
- [ ] Gain any shop benefit (R3, excludes itself)
- [ ] Reduce shop costs (player only)
- [ ] Increase shop costs (all players)
- [ ] Flip all shop statuses

### 🟣 Purple Actions
- [ ] Skip turn mechanics in snake draft
- [ ] Take back worker (different quad only)
- [ ] Play multiple workers in one turn
- [ ] Wait for others mechanic (R3)

### 🟨 Gold Actions
- [ ] Basic gold gains
- [ ] VP per gold (R3)
- [ ] Gold counts as any color

### ⚪ White Actions
- [ ] VP gains/losses
- [ ] Can spend VP into negative
- [ ] High risk/reward mechanics

### ⚫ Black Actions
- [ ] Steal VP (can go negative)
- [ ] Steal resources
- [ ] Steal workers (R2)
- [ ] All lose VP (R3)

### 🩶 Silver Actions
- [ ] Mutual benefit mechanics
- [ ] High VP for you, resources for others

## Round Transitions
- [ ] Turn order updates by ascending VP
- [ ] Player cards reorder visually
- [ ] R2/R3 shops open naturally
- [ ] Worker counts correct (5 in R2, 6 in R3)
- [ ] Effects clear that should clear
- [ ] Shop states persist (except natural openings)

## Multiplayer Testing
- [ ] Room creation and joining
- [ ] State syncs between players
- [ ] Turn validation (can't act out of turn)
- [ ] Resources update for all players
- [ ] Modal displays only for active player
- [ ] Round advancement syncs properly
- [ ] Emoji display consistency

## Edge Cases
- [ ] Recursion depth limits (max 5)
- [ ] No infinite loops in red/blue chains
- [ ] Snake draft with skips
- [ ] Multiple players waiting (purple)
- [ ] All players at 0 or negative VP
- [ ] No resources available to steal/swap
- [ ] All shops closed/flipped

## UI/UX Testing
- [ ] Turn position badges display
- [ ] Current player indicator clear
- [ ] Shop phase indicator works
- [ ] Gem selection modal intuitive
- [ ] Error messages helpful
- [ ] Action log shows useful info
- [ ] VP breakdown on hover
- [ ] Recursion depth in logs

## Performance Testing
- [ ] 4-player game runs smoothly
- [ ] All 8 quads enabled works
- [ ] Many workers on board
- [ ] Complex action chains
- [ ] Rapid clicking doesn't break
- [ ] Browser refresh handling