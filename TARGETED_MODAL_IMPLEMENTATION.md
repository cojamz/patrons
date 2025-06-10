# Targeted Modal Implementation Plan

## Cases Where Target Player Should Decide:

### 1. **steal3Gems** - Choose which resources to lose
- Current: Attacker picks which gems to steal
- New: Target player chooses which 3 gems to give up

### 2. **Red Hybrid 1** - Both players benefit from swap
- Current: Active player chooses both workers
- New: Each player chooses their own worker to swap

### 3. **Silver R2 Shop** - Receiving 4 VP gift
- Current: Auto-accepts gift
- New: Target confirms acceptance (with thank you message)

### 4. **Black Steal VP** - Defensive options
- Current: Auto-loses VP
- New: Could pay resources to reduce loss (optional enhancement)

## Implementation Approach:

### Step 1: Modify showChoice to support targetPlayerId
```javascript
function showChoice(dispatch, title, options, columnMode = false, workerInfo = null, targetPlayerId = null) {
    return new Promise((resolve) => {
        dispatch({
            type: 'SHOW_MODAL',
            modal: {
                type: 'choice',
                title,
                options,
                columnMode,
                targetPlayerId, // NEW: who should see this modal
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

### Step 2: Create new showTargetedChoice function
```javascript
async function showTargetedChoice(dispatch, targetPlayerId, title, options, context = {}) {
    // Add context about who is asking
    const enhancedTitle = context.fromPlayer 
        ? `${context.fromPlayer.name} ${context.fromPlayer.emoji}: ${title}`
        : title;
    
    return showChoice(dispatch, enhancedTitle, options, false, null, targetPlayerId);
}
```

### Step 3: Update specific actions

#### steal3Gems Example:
```javascript
// OLD: Attacker chooses
const selectedGems = await showStealGems(dispatch, 'Steal 3 gems', targetPlayer, 3);

// NEW: Target chooses
if (state.roomCode && targetPlayer.id !== state.myPlayerId) {
    // Multiplayer: target player chooses
    const selectedGems = await showTargetedChoice(
        dispatch,
        targetPlayer.id,
        'Choose 3 gems to give up',
        createGemOptions(targetPlayer.resources, 3),
        { fromPlayer: player, action: 'stealing' }
    );
} else {
    // Single player or stealing from self(?): use current system
    const selectedGems = await showStealGems(...);
}
```

## Message Templates:

### For Stealing:
- Title: `${attackerName} is stealing from you!`
- Subtitle: `Choose 3 resources to give up:`

### For Gifting:
- Title: `${giverName} wants to give you 4 VP!`
- Options: `[Accept Gift] [Politely Decline]`

### For Worker Swap:
- Title: `${playerName} wants to swap workers with you`
- Subtitle: `Choose which of your workers to swap:`

## State Sync Considerations:

1. **Blocking**: Current player's turn pauses until target responds
2. **Timeout**: 30 second timeout, then auto-select
3. **Notification**: Show waiting spinner to current player
4. **Resume**: Continue turn after response received

## Simple Firebase Sync:
```javascript
// When showing targeted modal
if (state.roomCode) {
    database.ref(`rooms/${roomCode}/pendingDecision`).set({
        id: Date.now(),
        type: 'TARGETED_CHOICE',
        forPlayer: targetPlayerId,
        fromPlayer: currentPlayerId,
        context: { action: 'steal3Gems', ... }
    });
}

// Listen for responses
database.ref(`rooms/${roomCode}/decisionResponse`).on('value', (snapshot) => {
    const response = snapshot.val();
    if (response && response.decisionId === pendingDecisionId) {
        // Process the response
        completePendingAction(response.choice);
    }
});
```