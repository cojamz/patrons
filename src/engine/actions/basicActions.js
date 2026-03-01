// Basic gain actions — 14 simple resource gains, no decisions needed.
// Pure functions: (state, playerId, gameLayers, decisions, recursionDepth) → { state, log }

import {
    getPlayer, addResources, addVP,
    applyDoubleEffect, formatResources, formatPlayerName, createResult
} from '../stateHelpers.js';
import { isRedAction, getActionTitle } from '../rules.js';

/**
 * Map of action IDs to their resource gains.
 */
export const basicGains = {
    'gain3red': { red: 3 },
    'gain2red': { red: 2 },
    'gain3blue': { blue: 3 },
    'gain2blue': { blue: 2 },
    'gain3purple': { purple: 3 },
    'gain2purple': { purple: 2 },
    'gain2gold': { gold: 2 },
    'gain1gold': { gold: 1 },
    'gain3white': { white: 3 },
    'gain2white': { white: 2 },
    'gain3black': { black: 3 },
    'gain2black': { black: 2 },
    'gain3silver': { silver: 3 },
    'gain2silver': { silver: 2 }
};

/**
 * Check if an action ID is a basic gain action.
 */
export function isBasicGain(actionId) {
    return actionId in basicGains;
}

/**
 * Execute a basic gain action.
 */
export function executeBasicGain(state, playerId, actionId, gameLayers, recursionDepth = 0) {
    const gain = basicGains[actionId];
    if (!gain) return null;

    const player = getPlayer(state, playerId);
    let resources = { ...gain };
    const log = [];

    // Check for doubling effect
    const doubleResult = applyDoubleEffect(state, playerId, resources);
    state = doubleResult.state;
    resources = doubleResult.resources;

    const actionTitle = getActionTitle(actionId, gameLayers);
    const resourceList = formatResources(resources);

    if (doubleResult.wasDoubled) {
        log.push(`${formatPlayerName(player)} used ${actionTitle} and gained ${resourceList} (DOUBLED!)`);
    } else {
        log.push(`${formatPlayerName(player)} used ${actionTitle} and gained ${resourceList}`);
    }

    // Apply resource gains
    state = addResources(state, playerId, resources);

    // RED AUTOMATIC VP: Award 1 VP for red actions at top level only
    if (isRedAction(actionId, gameLayers) && recursionDepth === 0) {
        state = addVP(state, playerId, 1, 'redAction');
        log.push(`${formatPlayerName(player)} gained +1 VP (red action bonus)`);
    }

    return createResult(state, log);
}
