// Pure validation and query functions for game rules.
// Zero React, zero Firebase.

/**
 * Check if an action belongs to the red layer.
 */
export function isRedAction(actionId, gameLayers) {
    const redLayer = gameLayers?.red;
    if (!redLayer) return false;
    return redLayer.actions.some(a => a.id === actionId);
}

/**
 * Get the display title for an action ID.
 */
export function getActionTitle(actionId, gameLayers) {
    for (const [color, layer] of Object.entries(gameLayers || {})) {
        const action = layer.actions?.find(a => a.id === actionId);
        if (action) return action.title;
    }
    return actionId;
}

/**
 * Get the color layer an action belongs to.
 */
export function getActionColor(actionId, gameLayers) {
    for (const [color, layer] of Object.entries(gameLayers || {})) {
        if (layer.actions?.some(a => a.id === actionId)) return color;
    }
    return null;
}

/**
 * Get all available (unoccupied, round-appropriate) action IDs.
 */
export function getAvailableActions(state) {
    const available = [];
    const hasAnyPatronsPlaced = Object.keys(state.occupiedSpaces || {}).length > 0;

    if (!state.gameLayers) return available;

    Object.keys(state.gameLayers).forEach(color => {
        const layer = state.gameLayers[color];
        if (!layer?.actions) return;

        layer.actions.forEach(action => {
            if (!action?.id) return;
            if (state.occupiedSpaces[action.id]) return; // occupied
            if ((action.round || 1) > state.round) return; // future round

            // Skip repeat/swap actions if no patrons placed yet
            const id = action.id.toLowerCase();
            if ((id.includes('repeat') || id.includes('swap')) && !hasAnyPatronsPlaced) return;

            available.push(action.id);
        });
    });

    return available;
}

/**
 * Check if a player can place a worker on a given action.
 */
export function canPlaceWorker(state, playerId, actionId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.workersLeft <= 0) return false;
    if (state.occupiedSpaces[actionId]) return false;

    // Check round availability
    if (state.gameLayers) {
        for (const layer of Object.values(state.gameLayers)) {
            const action = layer.actions?.find(a => a.id === actionId);
            if (action) {
                return (action.round || 1) <= state.round;
            }
        }
    }
    return false;
}

/**
 * Actions excluded from repeat mechanics (prevent infinite loops).
 */
export const REPEAT_EXCLUDED_ACTIONS = [
    'redRepeatAction',
    'redRepeatAll',
    'redHybrid1',
    'redHybrid2'
];

/**
 * Actions excluded from redRepeatAll.
 */
export const REPEAT_ALL_EXCLUDED_ACTIONS = [
    'redRepeatAction', 'redRepeatAll', 'redHybrid1', 'redHybrid2',
    'blueAnyShopBenefit',
    'playTwoWorkers', 'playThreeWorkers', 'gain4purpleWaitAll',
    'gain2purpleTakeBack'
];

/**
 * Get actions a player has workers on that can be repeated.
 */
export function getRepeatableActions(state, playerId, excludedActions = REPEAT_EXCLUDED_ACTIONS) {
    return Object.entries(state.occupiedSpaces)
        .filter(([spaceId, pid]) => pid === playerId && !excludedActions.includes(spaceId))
        .map(([spaceId]) => spaceId);
}

/**
 * Check if game is over.
 */
export function isGameOver(state) {
    return state.gameOver === true || state.round > 3;
}

/**
 * Max recursion depth for action chains.
 */
export const MAX_RECURSION_DEPTH = 5;
