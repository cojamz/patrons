/**
 * Patrons v3 — Action Router
 *
 * Routes actionId to the correct handler and returns the result.
 * Handles recursion depth limiting for repeat action chains.
 */

import { goldActions } from './goldActions.js';
import { blackActions } from './blackActions.js';
import { greenActions } from './greenActions.js';
import { yellowActions } from './yellowActions.js';

const MAX_RECURSION_DEPTH = 5;

// Combined action handler map
const actionHandlers = {
  ...goldActions,
  ...blackActions,
  ...greenActions,
  ...yellowActions,
};

/**
 * Route an action to its handler.
 *
 * @param {object} state - Current game state
 * @param {string} playerId - Player taking the action
 * @param {string} actionId - Action identifier (e.g. 'gold_collectTribute')
 * @param {string[]} gods - Active god colors
 * @param {object} decisions - Player decisions for this action
 * @param {number} recursionDepth - Current recursion depth (for repeat chains)
 * @returns {{ state, log: string[], pendingDecision?, executeAction? }}
 */
export function routeAction(state, playerId, actionId, gods, decisions = {}, recursionDepth = 0) {
  // Recursion depth check
  if (recursionDepth >= MAX_RECURSION_DEPTH) {
    return {
      state,
      log: [`Max recursion depth (${MAX_RECURSION_DEPTH}) reached, action ${actionId} skipped`],
    };
  }

  const handler = actionHandlers[actionId];
  if (!handler) {
    return {
      state,
      log: [`Unknown action: ${actionId}`],
    };
  }

  return handler(state, playerId, gods, decisions, recursionDepth);
}
