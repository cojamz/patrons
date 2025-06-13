# Red Action Fixes and Edge Cases

## Current Issues

### 1. Swap Workers Can Target Itself
**Problem**: Workers on redHybrid1/redHybrid2 can be swapped, causing the swapped worker to trigger another swap
**Solution**: Exclude the current swap action from the list of swappable workers

### 2. Repeat Action Edge Cases
- Can repeat another repeat action
- Can repeat blue shop benefit actions
- Can repeat swap actions

### 3. Blue R1 Shop Interactions
- Blue R1 shop can grant red shop benefits
- Red shop can repeat blue shop benefit action
- This can create complex chains

## Proposed Fixes

### Fix 1: Exclude Swap Action from Swappable Workers
```javascript
// In redHybrid1 and redHybrid2
const myWorkers = allWorkers.filter(([spaceId, pid]) => 
    pid === player.id && spaceId !== actionId  // Exclude current action
);
const otherWorkers = allWorkers.filter(([spaceId, pid]) => 
    pid !== player.id && spaceId !== actionId  // Exclude current action
);
```

### Fix 2: Clear Action Categories
Define which actions can be repeated:
- Basic resource gains: YES
- Shop benefit actions: YES (but with recursion depth)
- Swap actions: NO (too confusing)
- Repeat actions: NO (to prevent confusion)

### Fix 3: Better UI Feedback
- Show which actions are repeatable
- Show recursion depth in logs
- Warn when approaching recursion limit

## Edge Case Matrix

| Scenario | Current Behavior | Proposed Behavior |
|----------|------------------|-------------------|
| Swap worker on swap action | Infinite loop possible | Not allowed - excluded from options |
| Repeat a repeat action | Allowed, can chain | Not allowed - excluded from options |
| Repeat blue shop benefit | Allowed | Allowed but counts toward recursion |
| Blue shop → Red shop → Repeat | Complex chain | Allowed with recursion tracking |
| Swap during force red | Can swap to non-red | Should validate red placement |

## Implementation Priority
1. Fix swap excluding itself (Critical)
2. Add clear exclusions for repeat actions
3. Improve UI feedback
4. Document all interactions