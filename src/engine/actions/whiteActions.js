// White layer action handlers — VP trading.
// Pure functions: (state, playerId, gameLayers, decisions, recursionDepth) → { state, log, pendingDecision? }

import {
    getPlayer, addResources, addVP,
    applyDoubleEffect, formatPlayerName, totalResources,
    createResult, createDecisionRequest
} from '../stateHelpers.js';
import { getActionTitle } from '../rules.js';

/**
 * gain3vp: Gain 3 VP
 */
export function gain3vp(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    let vpGain = 3;
    const log = [];

    const doubleResult = applyDoubleEffect(state, playerId, { _vp: vpGain });
    state = doubleResult.state;
    if (doubleResult.wasDoubled) vpGain *= 2;

    state = addVP(state, playerId, vpGain, 'whiteAction');
    log.push(`${formatPlayerName(player)} used ${getActionTitle('gain3vp', gameLayers)} and gained ${vpGain} VP${doubleResult.wasDoubled ? ' (DOUBLED!)' : ''}`);
    return createResult(state, log);
}

/**
 * gain2vp: Gain 2 VP
 */
export function gain2vp(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    let vpGain = 2;
    const log = [];

    const doubleResult = applyDoubleEffect(state, playerId, { _vp: vpGain });
    state = doubleResult.state;
    if (doubleResult.wasDoubled) vpGain *= 2;

    state = addVP(state, playerId, vpGain, 'whiteAction');
    log.push(`${formatPlayerName(player)} used ${getActionTitle('gain2vp', gameLayers)} and gained ${vpGain} VP${doubleResult.wasDoubled ? ' (DOUBLED!)' : ''}`);
    return createResult(state, log);
}

/**
 * spend1AnyFor2VP: Trade 1 resource → 2 VP
 */
export function spend1AnyFor2VP(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (totalResources(player) < 1) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('spend1AnyFor2VP', gameLayers)} but has no gems`]);
    }

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Choose 1 gem to spend for 2 VP',
            maxGems: 1,
            fromPlayer: playerId
        });
    }

    // Remove selected gem
    const negResources = {};
    Object.entries(decisions.gemSelection).forEach(([color, amount]) => {
        negResources[color] = -amount;
    });
    state = addResources(state, playerId, negResources);
    state = addVP(state, playerId, 2, 'whiteAction');

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('spend1AnyFor2VP', gameLayers)} and spent 1 gem for 2 VP`]);
}

/**
 * spend2AnyFor3VP: Trade 2 resources → 3 VP
 */
export function spend2AnyFor3VP(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (totalResources(player) < 2) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('spend2AnyFor3VP', gameLayers)} but needs at least 2 gems`]);
    }

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Choose 2 gems to spend for 3 VP',
            maxGems: 2,
            fromPlayer: playerId
        });
    }

    const negResources = {};
    Object.entries(decisions.gemSelection).forEach(([color, amount]) => {
        negResources[color] = -amount;
    });
    state = addResources(state, playerId, negResources);
    state = addVP(state, playerId, 3, 'whiteAction');

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('spend2AnyFor3VP', gameLayers)} and spent 2 gems for 3 VP`]);
}

/**
 * lose1VPGain2Any: Lose 1 VP, gain 2 resources (any)
 */
export function lose1VPGain2Any(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (player.victoryPoints < 1) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('lose1VPGain2Any', gameLayers)} but needs at least 1 VP`]);
    }

    // Lose VP first
    state = addVP(state, playerId, -1, 'whiteAction');

    // Check doubling
    let gemsToGain = 2;
    const doubleResult = applyDoubleEffect(state, playerId, { _count: gemsToGain });
    state = doubleResult.state;
    if (doubleResult.wasDoubled) gemsToGain *= 2;

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: `Choose ${gemsToGain} gems to gain`,
            maxGems: gemsToGain
        });
    }

    state = addResources(state, playerId, decisions.gemSelection);
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('lose1VPGain2Any', gameLayers)}: -1 VP, gained ${gemsToGain} gems${doubleResult.wasDoubled ? ' (DOUBLED!)' : ''}`]);
}

/**
 * lose2VPGain4Any: Lose 2 VP, gain 4 resources (any)
 */
export function lose2VPGain4Any(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (player.victoryPoints < 2) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('lose2VPGain4Any', gameLayers)} but needs at least 2 VP`]);
    }

    state = addVP(state, playerId, -2, 'whiteAction');

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Choose 4 gems to gain',
            maxGems: 4
        });
    }

    state = addResources(state, playerId, decisions.gemSelection);
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('lose2VPGain4Any', gameLayers)}: -2 VP, gained 4 gems`]);
}

/**
 * gain5VPAnd5Any: Gain 5 VP and 5 resources (any)
 */
export function gain5VPAnd5Any(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    state = addVP(state, playerId, 5, 'whiteAction');

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Choose 5 gems to gain',
            maxGems: 5
        });
    }

    state = addResources(state, playerId, decisions.gemSelection);
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('gain5VPAnd5Any', gameLayers)} and gained 5 VP and 5 gems`]);
}

export const whiteActionHandlers = {
    gain3vp,
    gain2vp,
    spend1AnyFor2VP,
    spend2AnyFor3VP,
    lose1VPGain2Any,
    lose2VPGain4Any,
    gain5VPAnd5Any
};
