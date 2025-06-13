# Multiplayer Decision Architecture Analysis

## Current Architecture Issues

### 1. **Core Modal System**
The game uses a modal system for player decisions with this pattern:
- `showChoice()` - Shows a modal with options to select from
- `showConfirm()` - Shows a yes/no confirmation modal
- Returns a Promise that resolves when player makes selection

**Current Implementation:**
```javascript
function showChoice(dispatch, title, options, columnMode = false, workerInfo = null) {
    return new Promise((resolve) => {
        dispatch({
            type: 'SHOW_MODAL',
            modal: {
                type: 'choice',
                title,
                options,
                columnMode,
                onSelect: resolve,
                onCancel: () => {
                    if (workerInfo) {
                        dispatch({ type: 'UNDO_LAST_WORKER', ...workerInfo });
                    }
                    resolve(null);
                }
            }
        });
    });
}
```

### 2. **Critical Multiplayer Issue**
**Modal visibility is restricted to current player only:**
```javascript
state.modal && (!state.roomCode || state.myPlayerId === state.currentPlayer) && React.createElement(Modal, ...)
```

This means:
- Only the current player sees modals
- Non-current players cannot make decisions when needed
- Actions requiring other player input will hang indefinitely

### 3. **Broken Function: showPlayerSelection**
The code calls `showPlayerSelection()` in multiple places but this function is **never defined**:
- Black steal actions (lines 4193, 4254, 4331)
- Silver R2 shop (line 6296)
- Other player-targeting actions

This causes runtime errors when these actions are triggered.

## Actions Requiring Non-Current Player Decisions

### 1. **Red Worker Swap Actions**
- Current player chooses their worker
- Current player chooses another player's worker to swap
- **Issue**: Second player has no say in the swap

### 2. **Silver R2 Shop - "Pick Another Player to Gain 4 VP"**
- Current player gains 4 VP
- Current player picks who else gets 4 VP
- **Issue**: Target player doesn't need to accept/decline

### 3. **Steal Actions (Black)**
- Steal VP: Current player picks target
- Steal gems: Current player picks target AND which gems
- Steal worker: Current player picks target AND which worker
- **Issue**: Target player has no defensive options

### 4. **Other Player-Affecting Actions**
- Yellow swap all resources
- Force placement on red
- Repeat another player's worker actions

## Architectural Patterns Observed

### Pattern 1: Automatic Resolution
When only one valid target exists, action resolves automatically:
```javascript
if (otherPlayers.length === 1) {
    const targetPlayer = otherPlayers[0];
    // Apply effect directly
    return;
}
```

### Pattern 2: Current Player Makes All Choices
All decisions flow through the current player:
```javascript
const targetId = await showChoice(dispatch, 'Choose player to steal from', targetOptions);
const targetPlayer = state.players.find(p => p.id === targetId);
```

### Pattern 3: No Defensive Mechanisms
Target players cannot:
- Decline being targeted
- Choose which resources to lose
- Make counter-offers or negotiations

## Recommended Architecture Fix

### Option 1: Fix showPlayerSelection Function
Create the missing function that wraps showChoice properly:
```javascript
async function showPlayerSelection(dispatch, title, players, workerInfo = null) {
    const options = players.map(p => ({
        label: `Player ${p.id}${p.name ? ` - ${p.name}` : ''}`,
        value: p.id
    }));
    
    const selectedId = await showChoice(dispatch, title, options, false, workerInfo);
    return selectedId ? players.find(p => p.id === selectedId) : null;
}
```

### Option 2: Multi-Phase Decision System
For actions requiring other player input:
1. Current player initiates action
2. Game state enters "waiting for response" mode
3. Target player sees special modal
4. Resolution continues after response

### Option 3: Synchronous Turn Design
Keep all decisions with current player but add:
- Clear UI showing what's happening to other players
- Notification system for affected players
- Option to review what happened on your turn

## Immediate Fixes Needed

1. **Define showPlayerSelection function** - Critical bug fix
2. **Document decision flow** - Which player makes which choices
3. **Add error handling** - Graceful fallback when functions undefined
4. **Consider target player agency** - Should they have any input?

## Testing Scenarios

1. **Red worker swap in multiplayer**
   - Does it work at all?
   - Can both players see what's happening?
   
2. **Silver R2 shop benefit**
   - Does selection work?
   - Does target player get VP?
   
3. **Black steal actions**
   - Do they trigger errors?
   - Can gems/workers be properly selected?

## Architectural Recommendation

The current architecture assumes all decisions are made by the current player. This is simple and avoids complex async flows, but limits strategic depth. 

**Recommended approach:**
1. Fix immediate bugs (undefined functions)
2. Keep current player decision model for now
3. Add clear notifications to affected players
4. Consider adding "reaction" system in future versions