/**
 * AIEngine.js
 *
 * Core AI decision-making logic.
 * Evaluates available options and returns the best decision.
 *
 * This will be implemented in Phase 2+
 */

/**
 * Evaluate all available options and pick the best one
 *
 * @param {Object} gameState - Current game state
 * @param {Object} player - The AI player
 * @returns {Object} Decision object { type: 'placeWorker', actionId: string } or { type: 'endTurn' }
 */
export function evaluateAllOptions(gameState, player) {
    // Phase 1: Basic placeholder - just place worker randomly
    // If we need to place workers, find available actions
    if (gameState.workersToPlace > 0 && player.workersLeft > 0) {
        const availableActions = getAvailableActions(gameState);
        if (availableActions.length > 0) {
            // Pick a random available action
            const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
            return {
                type: 'placeWorker',
                actionId: randomAction
            };
        }
    }

    // If no workers to place or no available actions, end turn
    return { type: 'endTurn' };
}

/**
 * Get all available (unoccupied) action spaces
 */
function getAvailableActions(gameState) {
    const availableActions = [];

    // Count occupied spaces to check for prerequisites
    const hasAnyPatronsPlaced = Object.keys(gameState.occupiedSpaces || {}).length > 0;

    // Get all action IDs from game layers
    if (gameState.gameLayers) {
        Object.keys(gameState.gameLayers).forEach(color => {
            const layer = gameState.gameLayers[color];
            if (layer && layer.actions) {
                layer.actions.forEach(action => {
                    // Check if action is available
                    if (action && action.id && !gameState.occupiedSpaces[action.id]) {
                        // Check if action's round matches current round
                        const actionRound = action.round || 1;
                        if (actionRound > gameState.round) {
                            return; // Skip actions from future rounds
                        }

                        // Filter out actions that require prerequisites
                        const actionId = action.id.toLowerCase();

                        // Skip "repeat" actions if no patrons placed yet
                        if ((actionId.includes('repeat') || actionId.includes('swap')) && !hasAnyPatronsPlaced) {
                            console.log('[AIEngine] Skipping', action.id, '- requires existing patrons');
                            return;
                        }

                        availableActions.push(action.id);
                    }
                });
            }
        });
    }

    console.log('[AIEngine] Available actions:', availableActions.length, availableActions);
    return availableActions;
}

/**
 * Score a specific action for the AI player
 */
export function scoreAction(action, gameState, player, difficulty) {
    // Phase 2: Will implement
    return 0;
}

/**
 * Score a specific shop purchase for the AI player
 */
export function scoreShop(shop, gameState, player, difficulty) {
    // Phase 3: Will implement
    return 0;
}

export const AIEngine = {
    evaluateAllOptions,
    scoreAction,
    scoreShop
};
