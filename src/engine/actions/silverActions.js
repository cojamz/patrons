// Silver layer action handlers — mutual benefit.

import {
    getPlayer, getOtherPlayers, addResources, addVP,
    applyDoubleEffect, formatPlayerName,
    createResult, createDecisionRequest, removeWorker
} from '../stateHelpers.js';
import { getActionTitle } from '../rules.js';

/**
 * silver4Others1: +4 silver for you, +1 silver for all others
 */
export function silver4Others1(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    state = addResources(state, playerId, { silver: 4 });

    getOtherPlayers(state, playerId).forEach(other => {
        state = addResources(state, other.id, { silver: 1 });
    });

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('silver4Others1', gameLayers)}: +4 silver, all other players +1 silver`]);
}

/**
 * silver3Others1: +3 silver for you, +1 silver for all others
 */
export function silver3Others1(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    state = addResources(state, playerId, { silver: 3 });

    getOtherPlayers(state, playerId).forEach(other => {
        state = addResources(state, other.id, { silver: 1 });
    });

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('silver3Others1', gameLayers)}: +3 silver, all other players +1 silver`]);
}

/**
 * silver2Plus1Others: +2 silver + 1 resource for you (others get 1 of same color)
 */
export function silver2Plus1Others(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);
    state = addResources(state, playerId, { silver: 2 });

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Choose 1 gem (others will get the same)',
            maxGems: 1
        });
    }

    state = addResources(state, playerId, decisions.gemSelection);
    const chosenColor = Object.keys(decisions.gemSelection)[0];

    getOtherPlayers(state, playerId).forEach(other => {
        state = addResources(state, other.id, { [chosenColor]: 1 });
    });

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('silver2Plus1Others', gameLayers)}: +2 silver +1 ${chosenColor}, others +1 ${chosenColor}`]);
}

/**
 * silver2VPBoth: +2 VP for you, pick a player for +2 VP
 */
export function silver2VPBoth(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);
    state = addVP(state, playerId, 2, 'silverAction');

    if (!decisions?.targetPlayer) {
        const others = getOtherPlayers(state, playerId);
        if (others.length === 0) {
            return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('silver2VPBoth', gameLayers)}: +2 VP (no other players)`]);
        }
        return createDecisionRequest(state, {
            type: 'targetPlayer',
            title: 'Choose a player to also gain 2 VP',
            excludePlayer: playerId
        });
    }

    state = addVP(state, decisions.targetPlayer, 2, 'silverAction');
    const target = getPlayer(state, decisions.targetPlayer);
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('silver2VPBoth', gameLayers)}: +2 VP, ${formatPlayerName(target)} +2 VP`]);
}

/**
 * silverTakeBack2: +2 silver, take back 2 workers (others take back 1)
 */
export function silverTakeBack2(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    state = addResources(state, playerId, { silver: 2 });

    // Take back 2 workers for current player
    const occupiedByPlayer = Object.entries(state.occupiedSpaces || {})
        .filter(([_, pid]) => pid === playerId);

    let workersReturned = 0;
    for (let i = 0; i < Math.min(2, occupiedByPlayer.length); i++) {
        const [workerAction] = occupiedByPlayer[i];
        state = removeWorker(state, workerAction, playerId);
        workersReturned++;
    }

    // Each other player takes back 1 worker
    getOtherPlayers(state, playerId).forEach(other => {
        const theirWorkers = Object.entries(state.occupiedSpaces || {})
            .filter(([_, pid]) => pid === other.id);
        if (theirWorkers.length > 0) {
            state = removeWorker(state, theirWorkers[0][0], other.id);
        }
    });

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('silverTakeBack2', gameLayers)}: +2 silver, took back ${workersReturned} patrons, others took back 1`]);
}

/**
 * silver3Plus2Others1: +3 silver + 2 resources for you (others get 1 of that color)
 */
export function silver3Plus2Others1(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);
    state = addResources(state, playerId, { silver: 3 });

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Choose 1 color to get 2 gems of (others will get 1 of that color)',
            maxGems: 1
        });
    }

    const chosenColor = Object.keys(decisions.gemSelection)[0];
    state = addResources(state, playerId, { [chosenColor]: 2 });

    getOtherPlayers(state, playerId).forEach(other => {
        state = addResources(state, other.id, { [chosenColor]: 1 });
    });

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('silver3Plus2Others1', gameLayers)}: +3 silver +2 ${chosenColor}, others +1 ${chosenColor}`]);
}

/**
 * silver8VPOthers3S: +8 VP for you, +3 silver for all others
 */
export function silver8VPOthers3S(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    let vpGain = 8;

    const doubleResult = applyDoubleEffect(state, playerId, { _vp: vpGain });
    state = doubleResult.state;
    if (doubleResult.wasDoubled) vpGain *= 2;

    state = addVP(state, playerId, vpGain, 'silverAction');

    getOtherPlayers(state, playerId).forEach(other => {
        state = addResources(state, other.id, { silver: 3 });
    });

    const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('silver8VPOthers3S', gameLayers)}: +${vpGain} VP${suffix}, each other player +3 silver`]);
}

export const silverActionHandlers = {
    silver4Others1,
    silver3Others1,
    silver2Plus1Others,
    silver2VPBoth,
    silverTakeBack2,
    silver3Plus2Others1,
    silver8VPOthers3S
};
