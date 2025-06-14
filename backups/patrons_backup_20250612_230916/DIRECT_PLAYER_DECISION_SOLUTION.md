# Direct Player Decision Solution

## Why It Seems Difficult (But Isn't Really)

### Current Limitation:
```javascript
// Only current player sees modals
state.modal && (!state.roomCode || state.myPlayerId === state.currentPlayer)
```

### The Real Issue:
The game currently follows a strict "one player acts at a time" model. But for actions like "choose which of your resources to lose", the target player SHOULD make that choice!

## Simple Solution: Targeted Modals

### Step 1: Add Modal Target
```javascript
// In modal state
modal: {
    type: 'choice',
    targetPlayerId: 3,  // Who should see this modal
    title: 'Player 1 wants to steal from you. Choose 2 resources to lose:',
    options: [...],
    onSelect: (choice) => {
        // Process the defensive choice
    }
}
```

### Step 2: Update Modal Visibility
```javascript
// Change from:
state.modal && (!state.roomCode || state.myPlayerId === state.currentPlayer)

// To:
state.modal && (!state.roomCode || 
    state.myPlayerId === state.currentPlayer || 
    state.modal.targetPlayerId === state.myPlayerId)
```

### Step 3: Handle Async Flow
```javascript
// In steal action
if (actionId === 'steal2Gems') {
    const target = await selectTargetPlayer(...);
    
    if (state.roomCode && target) {
        // Queue decision for target player
        dispatch({
            type: 'SHOW_MODAL',
            modal: {
                type: 'defenseChoice',
                targetPlayerId: target.id,
                title: `${player.name} is stealing 2 gems. Choose which to lose:`,
                options: createResourceOptions(target.resources, 2),
                onSelect: (chosen) => {
                    // Execute the theft with chosen resources
                    executeTheft(player.id, target.id, chosen);
                }
            }
        });
        
        // Current player's turn continues or pauses?
        dispatch({ type: 'PAUSE_FOR_DECISION' });
    }
}
```

## Design Decisions Needed:

### 1. **Blocking vs Non-Blocking**
- **Blocking**: Current player waits for target's decision
- **Non-Blocking**: Current player continues, theft resolves later

### 2. **Timeout Handling**
- What if target player doesn't respond?
- Auto-select after 30 seconds?
- Let current player choose?

### 3. **State Management**
```javascript
// Add to game state
pendingDecisions: {
    id: 'decision_123',
    type: 'DEFENSIVE_CHOICE',
    waitingFor: 3,
    timeout: Date.now() + 30000,
    fallback: 'random'
}
```

## Simpler Alternative: Immediate Resolution

Instead of complex async flows, we could:

1. **Let current player see target's resources**
2. **Current player chooses what to steal** (like now)
3. **Add "protection" mechanics** where players can pre-designate protected resources

This keeps the game flowing while adding strategy!

## Example Implementation:

```javascript
// Simple targeted modal
function showTargetedChoice(dispatch, targetPlayerId, title, options) {
    return new Promise((resolve) => {
        if (!state.roomCode || targetPlayerId === state.myPlayerId) {
            // Single player or it's my decision
            dispatch({
                type: 'SHOW_MODAL',
                modal: {
                    type: 'choice',
                    targetPlayerId,
                    title,
                    options,
                    onSelect: resolve,
                    onCancel: () => resolve(null)
                }
            });
        } else {
            // Multiplayer - need to wait for other player
            dispatch({
                type: 'QUEUE_REMOTE_DECISION',
                decision: {
                    targetPlayerId,
                    title,
                    options,
                    requesterId: state.myPlayerId
                }
            });
            
            // How do we wait for response?
            // Option 1: Polling
            // Option 2: Firebase listener
            // Option 3: Just let current player choose
        }
    });
}
```

## The Real Question:

Do you want:
1. **True async multiplayer** where players can interrupt each other?
2. **Turn-based with notifications** where affected players are informed?
3. **Defensive pre-selections** where players set preferences ahead of time?

Each has different complexity and gameplay implications!