// Purple layer action handlers — timing/order manipulation.

import {
    getPlayer, addResources, addVP, addEffect,
    applyDoubleEffect, formatPlayerName,
    createResult, createDecisionRequest,
    addSkippedTurn, addWorkersToPlace, updatePlayer, removeWorker
} from '../stateHelpers.js';
import { getActionTitle } from '../rules.js';

/**
 * gain4purpleSkip: Gain 4 purple, skip next turn
 */
export function gain4purpleSkip(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    let purpleGain = 4;

    const doubleResult = applyDoubleEffect(state, playerId, { purple: purpleGain });
    state = doubleResult.state;
    purpleGain = doubleResult.resources.purple;

    state = addResources(state, playerId, { purple: purpleGain });
    state = addSkippedTurn(state, playerId);

    const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('gain4purpleSkip', gameLayers)} and gained ${purpleGain} purple${suffix}, will skip next turn`]);
}

/**
 * gain2purpleTakeBack: Gain 2 purple, take back a worker from different quad
 */
export function gain2purpleTakeBack(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);
    let purpleGain = 2;

    const doubleResult = applyDoubleEffect(state, playerId, { purple: purpleGain });
    state = doubleResult.state;
    purpleGain = doubleResult.resources.purple;

    state = addResources(state, playerId, { purple: purpleGain });

    // Find workers on different quad (non-purple)
    const occupiedByPlayer = Object.entries(state.occupiedSpaces || {})
        .filter(([actionId, pid]) => {
            if (pid !== playerId) return false;
            const isPurpleAction = gameLayers['purple'] &&
                gameLayers['purple'].actions.some(a => a.id === actionId);
            return !isPurpleAction;
        });

    if (occupiedByPlayer.length === 0) {
        const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('gain2purpleTakeBack', gameLayers)} and gained ${purpleGain} purple${suffix} (no workers to take back)`]);
    }

    if (!decisions?.actionChoice) {
        const options = occupiedByPlayer.map(([actionId]) => {
            const layer = Object.keys(gameLayers).find(color =>
                gameLayers[color].actions.some(a => a.id === actionId)
            );
            const action = layer ? gameLayers[layer].actions.find(a => a.id === actionId) : null;
            return {
                label: action ? `${layer} - ${action.title}` : actionId,
                value: actionId
            };
        });

        return createDecisionRequest(state, {
            type: 'actionChoice',
            title: 'Choose a patron to take back',
            options
        });
    }

    state = removeWorker(state, decisions.actionChoice, playerId);
    const takenAction = getActionTitle(decisions.actionChoice, gameLayers);
    const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';

    return createResult(state, [
        `${formatPlayerName(player)} took back their patron from ${takenAction}`,
        `${formatPlayerName(player)} used ${getActionTitle('gain2purpleTakeBack', gameLayers)} and gained ${purpleGain} purple${suffix}`
    ]);
}

/**
 * playTwoWorkers: Place 2 more patrons this turn
 */
export function playTwoWorkers(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    const workersToAdd = Math.min(2, player.workersLeft);

    if (workersToAdd === 0) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('playTwoWorkers', gameLayers)} but has no patrons left to place`]);
    }

    state = addWorkersToPlace(state, workersToAdd);
    state = addEffect(state, playerId, `Can place ${workersToAdd} more patron${workersToAdd > 1 ? 's' : ''} this turn`);

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('playTwoWorkers', gameLayers)} and can now place ${workersToAdd} more patron${workersToAdd > 1 ? 's' : ''} this turn`]);
}

/**
 * gain5purpleSkip: Gain 5 purple, skip next turn
 */
export function gain5purpleSkip(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    let purpleGain = 5;

    const doubleResult = applyDoubleEffect(state, playerId, { purple: purpleGain });
    state = doubleResult.state;
    purpleGain = doubleResult.resources.purple;

    state = addResources(state, playerId, { purple: purpleGain });
    state = addSkippedTurn(state, playerId);

    const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('gain5purpleSkip', gameLayers)} and gained ${purpleGain} purple${suffix}, will skip next turn`]);
}

/**
 * playThreeWorkers: Place 3 more patrons this turn
 */
export function playThreeWorkers(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    const workersToAdd = Math.min(3, player.workersLeft);

    if (workersToAdd === 0) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('playThreeWorkers', gameLayers)} but has no patrons left to place`]);
    }

    state = addWorkersToPlace(state, workersToAdd);
    state = addEffect(state, playerId, `Can place ${workersToAdd} more patron${workersToAdd > 1 ? 's' : ''} this turn`);

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('playThreeWorkers', gameLayers)} and can now place ${workersToAdd} more patron${workersToAdd > 1 ? 's' : ''} this turn`]);
}

/**
 * gain4purpleWaitAll: Gain 4 purple, take another turn after this one
 */
export function gain4purpleWaitAll(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);

    state = addResources(state, playerId, { purple: 4 });
    state = addEffect(state, playerId, 'Will take an extra turn after this one');
    state = updatePlayer(state, playerId, { extraTurns: (getPlayer(state, playerId).extraTurns || 0) + 1 });

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('gain4purpleWaitAll', gameLayers)} and gained 4 purple, will take extra turn`]);
}

export const purpleActionHandlers = {
    gain4purpleSkip,
    gain2purpleTakeBack,
    playTwoWorkers,
    gain5purpleSkip,
    playThreeWorkers,
    gain4purpleWaitAll
};
