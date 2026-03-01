// Black layer action handlers — aggression, stealing, VP loss.

import {
    getPlayer, getOtherPlayers, addResources, addVP,
    formatPlayerName, totalResources,
    createResult, createDecisionRequest
} from '../stateHelpers.js';
import { getActionTitle } from '../rules.js';

/**
 * blackSteal1VP: +1 black, steal 1 VP from a player
 */
export function blackSteal1VP(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);
    const log = [];

    state = addResources(state, playerId, { black: 1 });

    const others = getOtherPlayers(state, playerId);
    if (others.length === 0) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('blackSteal1VP', gameLayers)} and gained 1 black (no other players)`]);
    }

    if (!decisions?.targetPlayer) {
        return createDecisionRequest(state, {
            type: 'targetPlayer',
            title: 'Choose a player to steal 1 VP from',
            excludePlayer: playerId
        });
    }

    state = addVP(state, decisions.targetPlayer, -1, 'blackSteal');
    state = addVP(state, playerId, 1, 'blackSteal');

    const target = getPlayer(state, decisions.targetPlayer);
    log.push(`${formatPlayerName(player)} used ${getActionTitle('blackSteal1VP', gameLayers)}, gained 1 black, and stole 1 VP from ${formatPlayerName(target)}`);

    // BLACK AUTOMATIC VP: +1 VP when stealing
    state = addVP(state, playerId, 1, 'blackAutomatic');
    log.push(`${formatPlayerName(player)} gained +1 VP (stealing bonus)`);

    return createResult(state, log);
}

/**
 * blackSteal2Any: Steal 2 resources from a player
 */
export function blackSteal2Any(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);
    const log = [];

    if (!decisions?.targetPlayer) {
        const others = getOtherPlayers(state, playerId).filter(p => totalResources(p) > 0);
        if (others.length === 0) {
            return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('blackSteal2Any', gameLayers)} but no players have gems to steal`]);
        }
        return createDecisionRequest(state, {
            type: 'targetPlayer',
            title: 'Choose a player to steal 2 gems from',
            excludePlayer: playerId
        });
    }

    if (!decisions?.stealGems) {
        const target = getPlayer(state, decisions.targetPlayer);
        const stealCount = Math.min(2, totalResources(target));
        if (stealCount === 0) {
            return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('blackSteal2Any', gameLayers)} but target has no gems`]);
        }
        return createDecisionRequest(state, {
            type: 'stealGems',
            title: `Choose ${stealCount} gems to steal`,
            maxGems: stealCount,
            fromPlayer: decisions.targetPlayer
        });
    }

    // Transfer the resources
    const negResources = {};
    Object.entries(decisions.stealGems).forEach(([color, amount]) => {
        negResources[color] = -amount;
    });
    state = addResources(state, decisions.targetPlayer, negResources);
    state = addResources(state, playerId, decisions.stealGems);

    const target = getPlayer(state, decisions.targetPlayer);
    const stolenList = Object.entries(decisions.stealGems).filter(([_, a]) => a > 0).map(([c, a]) => `${a} ${c}`).join(', ');
    log.push(`${formatPlayerName(player)} used ${getActionTitle('blackSteal2Any', gameLayers)} and stole ${stolenList} from ${formatPlayerName(target)}`);

    state = addVP(state, playerId, 1, 'blackAutomatic');
    log.push(`${formatPlayerName(player)} gained +1 VP (stealing bonus)`);

    return createResult(state, log);
}

/**
 * blackStealWorker: +1 black, steal 4 resources from a player
 */
export function blackStealWorker(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);
    const log = [];

    state = addResources(state, playerId, { black: 1 });

    if (!decisions?.targetPlayer) {
        const others = getOtherPlayers(state, playerId).filter(p => totalResources(p) > 0);
        if (others.length === 0) {
            return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('blackStealWorker', gameLayers)}: +1 black (no players have resources to steal)`]);
        }
        return createDecisionRequest(state, {
            type: 'targetPlayer',
            title: 'Choose player to steal 4 resources from',
            excludePlayer: playerId
        });
    }

    if (!decisions?.stealGems) {
        const target = getPlayer(state, decisions.targetPlayer);
        const stealCount = Math.min(4, totalResources(target));
        return createDecisionRequest(state, {
            type: 'stealGems',
            title: `Steal up to ${stealCount} resources`,
            maxGems: stealCount,
            fromPlayer: decisions.targetPlayer
        });
    }

    // Transfer
    Object.entries(decisions.stealGems).forEach(([color, count]) => {
        if (count > 0) {
            state = addResources(state, decisions.targetPlayer, { [color]: -count });
            state = addResources(state, playerId, { [color]: count });
        }
    });

    const stolenResources = Object.entries(decisions.stealGems).filter(([_, c]) => c > 0).map(([color, c]) => `${c} ${color}`).join(', ');
    log.push(`${formatPlayerName(player)} used ${getActionTitle('blackStealWorker', gameLayers)}: +1 black, stole ${stolenResources}`);

    state = addVP(state, playerId, 1, 'blackAutomatic');
    log.push(`${formatPlayerName(player)} gained +1 VP (stealing bonus)`);

    return createResult(state, log);
}

/**
 * blackAllLose2VP: All other players lose 2 VP
 */
export function blackAllLose2VP(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    const others = getOtherPlayers(state, playerId);

    others.forEach(other => {
        state = addVP(state, other.id, -2, 'blackPenalty');
    });

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('blackAllLose2VP', gameLayers)}: all other players lose 2 VP`]);
}

/**
 * blackAllLose4VP: +2 black, all other players lose 4 VP
 */
export function blackAllLose4VP(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);

    state = addResources(state, playerId, { black: 2 });

    const others = getOtherPlayers(state, playerId);
    others.forEach(other => {
        state = addVP(state, other.id, -4, 'blackPenalty');
    });

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('blackAllLose4VP', gameLayers)}: +2 black, all other players lose 4 VP`]);
}

export const blackActionHandlers = {
    blackSteal1VP,
    blackSteal2Any,
    blackStealWorker,
    blackAllLose2VP,
    blackAllLose4VP
};
