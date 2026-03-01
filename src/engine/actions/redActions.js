// Red layer action handlers — repeat actions, swap workers, VP focus.
// These are the most complex: they involve recursion, player targeting, and action selection.

import {
    getPlayer, getOtherPlayers, addResources, addVP,
    formatPlayerName, createResult, createDecisionRequest,
    setOccupiedSpaces
} from '../stateHelpers.js';
import {
    isRedAction, getActionTitle, getActionColor,
    REPEAT_EXCLUDED_ACTIONS, REPEAT_ALL_EXCLUDED_ACTIONS,
    getRepeatableActions, MAX_RECURSION_DEPTH
} from '../rules.js';

/**
 * redRepeatAction: +1 red, repeat one of your workers' actions
 */
export function redRepeatAction(state, playerId, gameLayers, decisions, recursionDepth = 0) {
    const player = getPlayer(state, playerId);
    const log = [];

    // Give +1 red
    state = addResources(state, playerId, { red: 1 });

    // RED AUTOMATIC VP for this action
    state = addVP(state, playerId, 1, 'redAction');
    log.push(`${formatPlayerName(player)} gained +1 VP (red action bonus)`);

    // Find repeatable actions
    const repeatableActions = getRepeatableActions(state, playerId);

    if (repeatableActions.length === 0) {
        log.push(`${formatPlayerName(player)} used ${getActionTitle('redRepeatAction', gameLayers)} and gained 1 red (no valid patrons to repeat)`);
        return createResult(state, log);
    }

    if (!decisions?.actionChoice) {
        const options = repeatableActions.map(spaceId => ({
            label: `Repeat: ${getActionTitle(spaceId, gameLayers)}`,
            value: spaceId
        }));

        return createDecisionRequest(state, {
            type: 'actionChoice',
            title: 'Choose an action to repeat',
            options
        }, log);
    }

    // The chosen action will be executed via the engine's executeAction
    const repeatedTitle = getActionTitle(decisions.actionChoice, gameLayers);
    log.push(`${formatPlayerName(player)} gained 1 red and is repeating: ${repeatedTitle}`);

    // Return with executeAction request for the chosen action
    return {
        state,
        log,
        executeAction: {
            actionId: decisions.actionChoice,
            playerId,
            recursionDepth: recursionDepth + 1
        }
    };
}

/**
 * redHybrid1/redHybrid2: +1 red, swap workers with opponent
 * redHybrid1: Both players execute their new action
 * redHybrid2: Only you execute your new action
 */
export function redHybrid(state, playerId, actionId, gameLayers, decisions, recursionDepth = 0) {
    const player = getPlayer(state, playerId);
    const log = [];

    // Give +1 red
    state = addResources(state, playerId, { red: 1 });

    // RED AUTOMATIC VP
    state = addVP(state, playerId, 1, 'redAutomatic');
    log.push(`${formatPlayerName(player)} gained +1 VP (red action bonus)`);

    // Find swappable workers
    const allWorkers = Object.entries(state.occupiedSpaces);
    if (allWorkers.length < 2) {
        log.push(`${formatPlayerName(player)} used ${getActionTitle(actionId, gameLayers)} and gained 1 red (not enough patrons to swap)`);
        return createResult(state, log);
    }

    const myWorkers = allWorkers.filter(([spaceId, pid]) =>
        pid === playerId && spaceId !== actionId && spaceId !== 'redHybrid1' && spaceId !== 'redHybrid2'
    );
    const otherWorkers = allWorkers.filter(([spaceId, pid]) =>
        pid !== playerId && spaceId !== actionId && spaceId !== 'redHybrid1' && spaceId !== 'redHybrid2'
    );

    if (myWorkers.length === 0 || otherWorkers.length === 0) {
        log.push(`${formatPlayerName(player)} used ${getActionTitle(actionId, gameLayers)} and gained 1 red (not enough valid patrons to swap)`);
        return createResult(state, log);
    }

    // Need two sequential decisions: pick your worker, then pick opponent's worker
    if (!decisions?.myWorker) {
        const options = myWorkers.map(([spaceId, pid]) => {
            const color = getActionColor(spaceId, gameLayers);
            return {
                label: `Your patron on: ${color} - ${getActionTitle(spaceId, gameLayers)}`,
                value: { spaceId, playerId: pid }
            };
        });
        return createDecisionRequest(state, {
            type: 'workerSelection',
            subType: 'myWorker',
            title: 'Choose your patron to swap',
            options
        }, log);
    }

    if (!decisions?.otherWorker) {
        const options = otherWorkers.map(([spaceId, pid]) => {
            const otherPlayer = getPlayer(state, pid);
            const color = getActionColor(spaceId, gameLayers);
            return {
                label: `${formatPlayerName(otherPlayer)}'s patron on: ${color} - ${getActionTitle(spaceId, gameLayers)}`,
                value: { spaceId, playerId: pid }
            };
        });
        return createDecisionRequest(state, {
            type: 'workerSelection',
            subType: 'otherWorker',
            title: "Choose another player's worker to swap with",
            options
        }, log);
    }

    // Perform the swap
    const newOccupiedSpaces = { ...state.occupiedSpaces };
    newOccupiedSpaces[decisions.myWorker.spaceId] = decisions.otherWorker.playerId;
    newOccupiedSpaces[decisions.otherWorker.spaceId] = decisions.myWorker.playerId;
    state = setOccupiedSpaces(state, newOccupiedSpaces);

    const otherPlayer = getPlayer(state, decisions.otherWorker.playerId);
    const action1Title = getActionTitle(decisions.myWorker.spaceId, gameLayers);
    const action2Title = getActionTitle(decisions.otherWorker.spaceId, gameLayers);
    log.push(`${formatPlayerName(player)} swapped patrons with ${formatPlayerName(otherPlayer)} (${action1Title} ↔ ${action2Title})`);
    log.push(`${formatPlayerName(player)} used ${getActionTitle(actionId, gameLayers)} and gained 1 red`);

    // Queue up action executions for post-swap
    const skipActions = ['playTwoWorkers', 'playThreeWorkers'];
    const executeActions = [];

    if (actionId === 'redHybrid1') {
        // Both players execute where their workers END UP
        if (!skipActions.includes(decisions.myWorker.spaceId)) {
            executeActions.push({
                actionId: decisions.myWorker.spaceId,
                playerId: decisions.otherWorker.playerId,
                recursionDepth: recursionDepth + 1
            });
        }
        if (!skipActions.includes(decisions.otherWorker.spaceId)) {
            executeActions.push({
                actionId: decisions.otherWorker.spaceId,
                playerId: decisions.myWorker.playerId,
                recursionDepth: recursionDepth + 1
            });
        }
    } else {
        // redHybrid2: Only current player executes their new position
        if (!skipActions.includes(decisions.otherWorker.spaceId)) {
            executeActions.push({
                actionId: decisions.otherWorker.spaceId,
                playerId,
                recursionDepth: recursionDepth + 1
            });
        }
    }

    return { state, log, executeActions };
}

/**
 * redVPFocus: +1 red, +1 VP per red worker placed
 */
export function redVPFocus(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);

    state = addResources(state, playerId, { red: 1 });

    // Count red workers (including this one)
    const redLayer = state.gameLayers?.red;
    const redActionIds = redLayer ? redLayer.actions.map(a => a.id) : [];
    const redWorkerCount = Object.entries(state.occupiedSpaces)
        .filter(([actionId, pid]) => pid === playerId && redActionIds.includes(actionId))
        .length;

    // +1 VP for using red action + 1 per red worker
    const totalVP = 1 + redWorkerCount;
    state = addVP(state, playerId, totalVP, 'redAction');

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('redVPFocus', gameLayers)}, gained 1 red and ${totalVP} VP (${redWorkerCount} red patron${redWorkerCount > 1 ? 's' : ''})`]);
}

/**
 * redRepeatAll: Repeat ALL your workers' actions in any order
 */
export function redRepeatAll(state, playerId, gameLayers, decisions, recursionDepth = 0) {
    const player = getPlayer(state, playerId);
    const log = [];

    // RED AUTOMATIC VP for the action itself
    state = addVP(state, playerId, 1, 'redAction');
    log.push(`${formatPlayerName(player)} gained +1 VP (red action bonus)`);

    // Find all repeatable actions (with stricter exclusion list)
    const playerSpaces = Object.entries(state.occupiedSpaces)
        .filter(([spaceId, pid]) =>
            pid === playerId &&
            !REPEAT_ALL_EXCLUDED_ACTIONS.includes(spaceId) &&
            spaceId !== 'redRepeatAll'
        )
        .map(([spaceId]) => spaceId);

    if (playerSpaces.length === 0) {
        log.push(`${formatPlayerName(player)} used ${getActionTitle('redRepeatAll', gameLayers)} but has no valid patrons to repeat`);
        return createResult(state, log);
    }

    log.push(`${formatPlayerName(player)} used ${getActionTitle('redRepeatAll', gameLayers)} and is repeating ${playerSpaces.length} action${playerSpaces.length > 1 ? 's' : ''}`);

    // Need sequential action choices
    if (!decisions?.actionOrder) {
        const options = playerSpaces.map(spaceId => {
            const color = getActionColor(spaceId, gameLayers);
            return {
                label: `${color} - ${getActionTitle(spaceId, gameLayers)}`,
                value: spaceId
            };
        });

        return createDecisionRequest(state, {
            type: 'actionOrder',
            title: `Choose next action to repeat (${playerSpaces.length} remaining)`,
            options,
            remainingActions: playerSpaces
        }, log);
    }

    // Execute all actions in the given order
    const executeActions = decisions.actionOrder.map(actionId => ({
        actionId,
        playerId,
        recursionDepth: recursionDepth + 1
    }));

    return { state, log, executeActions };
}

export const redActionHandlers = {
    redRepeatAction,
    redHybrid1: (state, playerId, gameLayers, decisions, recursionDepth) =>
        redHybrid(state, playerId, 'redHybrid1', gameLayers, decisions, recursionDepth),
    redHybrid2: (state, playerId, gameLayers, decisions, recursionDepth) =>
        redHybrid(state, playerId, 'redHybrid2', gameLayers, decisions, recursionDepth),
    redVPFocus,
    redRepeatAll
};
