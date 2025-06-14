# Multiplayer Decision Pattern - Meta Solution

## Design Principles

### 1. Single Decision Maker Pattern (Current)
- **Pros**: Simple, no waiting, no sync issues
- **Cons**: Limited interaction, targets are passive
- **When to use**: Most actions where active player needs to choose targets

### 2. Deferred Decision Pattern (Proposed)
- **Concept**: Queue decisions for other players to make on their next turn
- **Implementation**: Store pending decisions in game state
- **When to use**: Actions requiring consent or selection from other players

### 3. Pre-Selection Pattern (Alternative)
- **Concept**: Players pre-select defensive options during their turn
- **Implementation**: Store defensive preferences in player state
- **When to use**: Common defensive scenarios (e.g., "protect from steal")

## Implementation Guide

### Pattern 1: Fix Current Single Decision Maker
```javascript
// Replace all showPlayerSelection calls with this pattern:
async function selectTargetPlayer(dispatch, title, players, currentPlayerId, workerInfo = null) {
    const playerOptions = players
        .filter(p => p.id !== currentPlayerId)
        .map(p => ({
            label: `${p.name} ${p.emoji} (${formatPlayerResources(p)})`,
            value: p.id
        }));
    
    if (playerOptions.length === 0) {
        dispatch({ type: 'ADD_LOG', message: 'No valid targets available' });
        return null;
    }
    
    const targetId = await showChoice(dispatch, title, playerOptions, false, workerInfo);
    return targetId ? players.find(p => p.id === targetId) : null;
}
```

### Pattern 2: Deferred Decision Queue
```javascript
// Add to game state
deferredDecisions: {
    playerId: {
        id: 'decision_123',
        type: 'CHOOSE_RESOURCE',
        fromPlayer: 2,
        options: ['red', 'blue', 'yellow'],
        context: 'Player 2 wants you to choose a resource',
        expires: roundNumber + 1
    }
}

// Check at turn start
if (state.deferredDecisions[currentPlayer]) {
    // Show decision modal
    // Process result
    // Clear decision
}
```

### Pattern 3: Pre-Selection Defense
```javascript
// In player state
defensiveSettings: {
    protectFromSteal: ['red', 'gold'], // Resources to protect
    autoDecline: ['skipTurn'],         // Effects to auto-reject
    preferredLoss: 'yellow'            // Resource to lose first
}
```

## Recommended Approach

### Phase 1: Fix Immediate Issues
1. Create `selectTargetPlayer()` utility function
2. Replace all 9 broken `showPlayerSelection()` calls
3. Test in single and multiplayer

### Phase 2: Enhance Interaction (Optional)
1. Add notification system for affected players
2. Show animation when resources are stolen
3. Add confirmation for destructive actions

### Phase 3: Advanced Features (Future)
1. Implement deferred decisions for consent-based actions
2. Add defensive pre-selections
3. Create interrupt/counter-play system

## Code Template

```javascript
// utils.js (new file or add to react-game.html)
const MultiplayerDecisionUtils = {
    // Standard target selection (current player chooses)
    selectTarget: async function(dispatch, title, players, currentPlayerId, workerInfo) {
        // Implementation above
    },
    
    // Queue decision for another player
    queueDecision: function(state, targetPlayerId, decision) {
        dispatch({
            type: 'QUEUE_DECISION',
            playerId: targetPlayerId,
            decision: {
                id: Date.now(),
                ...decision
            }
        });
    },
    
    // Check for pending decisions
    checkPendingDecisions: function(state, playerId) {
        return state.deferredDecisions?.[playerId] || null;
    },
    
    // Process deferred decision result
    processDecisionResult: function(state, decisionId, result) {
        // Apply the deferred effect based on result
    }
};
```

## Usage Examples

### Example 1: Fix Black Steal VP
```javascript
// OLD (broken):
const targetPlayer = await showPlayerSelection(dispatch, 'Choose player to steal from', otherPlayers);

// NEW (working):
const targetPlayer = await selectTargetPlayer(
    dispatch, 
    'Choose player to steal 1 VP from', 
    currentState.players,
    player.id,
    workerInfo
);
```

### Example 2: Future Consent-Based Action
```javascript
// Silver offers VP to another player
const target = await selectTargetPlayer(...);
if (target) {
    if (state.roomCode) {
        // Multiplayer: queue decision
        queueDecision(state, target.id, {
            type: 'ACCEPT_VP',
            amount: 2,
            fromPlayer: player.id,
            message: `${player.name} offers you 2 VP`
        });
    } else {
        // Single player: auto-accept
        dispatch({ type: 'UPDATE_VP', playerId: target.id, vp: 2 });
    }
}
```

## Testing Checklist

- [ ] All 9 broken actions work in single player
- [ ] All 9 broken actions work in multiplayer
- [ ] Current player can always make decisions
- [ ] Non-current players see results in log
- [ ] State syncs correctly after decisions
- [ ] Cancel/undo works properly
- [ ] No hanging states or infinite waits

## Benefits of This Approach

1. **Immediate Fix**: Gets game working without major refactor
2. **Extensible**: Can add more complex patterns later
3. **Backwards Compatible**: Doesn't break existing working actions
4. **Clear Ownership**: Always clear who makes decisions
5. **No Sync Issues**: Avoids complex distributed state problems