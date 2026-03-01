// Gold layer action handlers — conversions and VP.
// Pure functions: (state, playerId, gameLayers, decisions, recursionDepth) → { state, log, pendingDecision? }

import {
    getPlayer, addResources, removeResources, addVP,
    applyDoubleEffect, formatPlayerName, formatResources,
    createResult, createDecisionRequest, totalNonGoldResources, addSkippedTurn
} from '../stateHelpers.js';
import { getActionTitle } from '../rules.js';

/**
 * convert2AnyTo2Gold: Trade 2 any resources → 2 gold
 */
export function convert2AnyTo2Gold(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    // Check if player has enough non-gold gems
    if (totalNonGoldResources(player) < 2) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('convert2AnyTo2Gold', gameLayers)} but needs at least 2 gems`]);
    }

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Choose 2 gems to convert to Gold',
            maxGems: 2,
            fromPlayer: playerId // gems come FROM this player's inventory
        });
    }

    // Remove selected gems and add 2 gold
    const resources = { gold: 2 };
    Object.entries(decisions.gemSelection).forEach(([color, amount]) => {
        resources[color] = (resources[color] || 0) - amount;
    });

    state = addResources(state, playerId, resources);
    const gemsConverted = formatResources(decisions.gemSelection);
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('convert2AnyTo2Gold', gameLayers)} and converted ${gemsConverted} to 2 gold`]);
}

/**
 * convert1AnyTo1Gold: Trade 1 any resource → 1 gold
 */
export function convert1AnyTo1Gold(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (totalNonGoldResources(player) < 1) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('convert1AnyTo1Gold', gameLayers)} but needs at least 1 gem`]);
    }

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Choose 1 gem to convert to Gold',
            maxGems: 1,
            fromPlayer: playerId
        });
    }

    const resources = { gold: 1 };
    Object.entries(decisions.gemSelection).forEach(([color, amount]) => {
        resources[color] = (resources[color] || 0) - amount;
    });

    state = addResources(state, playerId, resources);
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('convert1AnyTo1Gold', gameLayers)} and converted 1 gem to 1 gold`]);
}

/**
 * gain3goldSkip: Gain 3 gold, skip next turn
 */
export function gain3goldSkip(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    let goldGain = 3;
    const log = [];

    const doubleResult = applyDoubleEffect(state, playerId, { gold: goldGain });
    state = doubleResult.state;
    goldGain = doubleResult.resources.gold;

    state = addResources(state, playerId, { gold: goldGain });
    state = addSkippedTurn(state, playerId);

    log.push(`${formatPlayerName(player)} used ${getActionTitle('gain3goldSkip', gameLayers)} and gained ${goldGain} gold${doubleResult.wasDoubled ? ' (DOUBLED!)' : ''}, will skip next turn`);
    return createResult(state, log);
}

/**
 * convert3AnyTo3Gold: Trade 3 any resources → 3 gold
 */
export function convert3AnyTo3Gold(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (totalNonGoldResources(player) < 3) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('convert3AnyTo3Gold', gameLayers)} but needs at least 3 gems`]);
    }

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Choose 3 gems to convert to Gold',
            maxGems: 3,
            fromPlayer: playerId
        });
    }

    const resources = { gold: 3 };
    Object.entries(decisions.gemSelection).forEach(([color, amount]) => {
        resources[color] = (resources[color] || 0) - amount;
    });

    state = addResources(state, playerId, resources);
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('convert3AnyTo3Gold', gameLayers)} and converted 3 gems to 3 gold`]);
}

/**
 * goldVPPerGold: Gain 1 VP for each gold you have
 */
export function goldVPPerGold(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    const goldAmount = player.resources.gold || 0;

    if (goldAmount > 0) {
        state = addVP(state, playerId, goldAmount, 'goldVPPerGold');
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('goldVPPerGold', gameLayers)} and gained ${goldAmount} VP (1 per gold)`]);
    }
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('goldVPPerGold', gameLayers)} but has no gold`]);
}

export const goldActionHandlers = {
    convert2AnyTo2Gold,
    convert1AnyTo1Gold,
    gain3goldSkip,
    convert3AnyTo3Gold,
    goldVPPerGold
};
