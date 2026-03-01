// Yellow layer action handlers — resource selection and manipulation.

import {
    getPlayer, addResources, addVP,
    applyDoubleEffect, formatPlayerName, formatResources, totalResources,
    createResult, createDecisionRequest, setResources
} from '../stateHelpers.js';
import { getActionTitle } from '../rules.js';

/**
 * gain3yellow: Gain 3 resources (any colors, player chooses)
 */
export function gain3yellow(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Select 3 Resources (any colors)',
            maxGems: 3
        });
    }

    let resources = { ...decisions.gemSelection };
    // Filter out zeros
    Object.keys(resources).forEach(k => { if (resources[k] === 0) delete resources[k]; });

    const doubleResult = applyDoubleEffect(state, playerId, resources);
    state = doubleResult.state;
    resources = doubleResult.resources;

    state = addResources(state, playerId, resources);
    const resourceList = formatResources(resources);
    const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('gain3yellow', gameLayers)} and gained ${resourceList}${suffix}`]);
}

/**
 * gain2yellow: Gain 2 resources (any colors, player chooses)
 */
export function gain2yellow(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Select 2 Resources (any colors)',
            maxGems: 2
        });
    }

    let resources = { ...decisions.gemSelection };
    Object.keys(resources).forEach(k => { if (resources[k] === 0) delete resources[k]; });

    const doubleResult = applyDoubleEffect(state, playerId, resources);
    state = doubleResult.state;
    resources = doubleResult.resources;

    state = addResources(state, playerId, resources);
    const resourceList = formatResources(resources);
    const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('gain2yellow', gameLayers)} and gained ${resourceList}${suffix}`]);
}

/**
 * steal2Gems: +1 yellow, then trade ALL resources for new ones (same total count)
 */
export function steal2Gems(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);
    const log = [];

    // Add +1 yellow first
    state = addResources(state, playerId, { yellow: 1 });

    // Recalculate total after adding yellow
    const updatedPlayer = state.players.find(p => p.id === playerId);
    const total = totalResources(updatedPlayer);

    if (total === 0) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('steal2Gems', gameLayers)} but has no resources to trade`]);
    }

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: `Trade all ${total} resources for new ones`,
            maxGems: total
        });
    }

    // Clear all current resources
    const clearResources = {};
    Object.entries(updatedPlayer.resources).forEach(([color, amount]) => {
        if (amount > 0) clearResources[color] = -amount;
    });
    state = addResources(state, playerId, clearResources);

    // Add new resources
    state = addResources(state, playerId, decisions.gemSelection);

    const resourceList = formatResources(decisions.gemSelection);
    log.push(`${formatPlayerName(player)} used ${getActionTitle('steal2Gems', gameLayers)}, gained 1 yellow, and traded all resources for ${resourceList}`);
    return createResult(state, log);
}

/**
 * steal3Gems (actually "Gain 4 resources"): Gain 4 resources (any colors)
 */
export function steal3Gems(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (!decisions?.gemSelection) {
        return createDecisionRequest(state, {
            type: 'gemSelection',
            title: 'Select 4 Resources (any colors)',
            maxGems: 4
        });
    }

    let resources = { ...decisions.gemSelection };
    const doubleResult = applyDoubleEffect(state, playerId, resources);
    state = doubleResult.state;
    resources = doubleResult.resources;

    state = addResources(state, playerId, resources);
    const resourceList = formatResources(resources);
    const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('steal3Gems', gameLayers)} and gained ${resourceList}${suffix}`]);
}

/**
 * yellowHybrid1: Simple +2 yellow
 */
export function yellowHybrid1(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    let yellowAmount = 2;

    const doubleResult = applyDoubleEffect(state, playerId, { yellow: yellowAmount });
    state = doubleResult.state;
    yellowAmount = doubleResult.resources.yellow;

    state = addResources(state, playerId, { yellow: yellowAmount });
    const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('yellowHybrid1', gameLayers)} and gained ${yellowAmount} yellow${suffix}`]);
}

/**
 * yellowHybrid2: +1 yellow, copy previous player's last gain
 */
export function yellowHybrid2(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    const log = [];

    // +1 yellow first
    state = addResources(state, playerId, { yellow: 1 });

    // Find previous player
    const currentIndex = state.players.findIndex(p => p.id === playerId);
    const previousIndex = (currentIndex - 1 + state.players.length) % state.players.length;
    const previousPlayer = state.players[previousIndex];

    const lastGain = previousPlayer.lastGain || {};
    const totalGained = Object.values(lastGain).reduce((sum, amt) => sum + amt, 0);

    if (totalGained === 0) {
        state = addResources(state, playerId, { yellow: 1 });
        log.push(`${formatPlayerName(player)} used ${getActionTitle('yellowHybrid2', gameLayers)}: +1 yellow + 1 yellow (no gain to copy, default)`);
        return createResult(state, log);
    }

    state = addResources(state, playerId, lastGain);
    const copiedText = formatResources(lastGain);
    log.push(`${formatPlayerName(player)} used ${getActionTitle('yellowHybrid2', gameLayers)}: +1 yellow, copied ${copiedText} from ${formatPlayerName(previousPlayer)}`);
    return createResult(state, log);
}

/**
 * yellowSwapResources: Gain 3 of each color in the game
 */
export function yellowSwapResources(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);
    const activeColors = Object.keys(state.gameLayers || {});

    if (activeColors.length === 0) {
        return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('yellowSwapResources', gameLayers)} but no active colors`]);
    }

    const resources = {};
    let amount = 3;

    const doubleResult = applyDoubleEffect(state, playerId, { _count: amount });
    state = doubleResult.state;
    if (doubleResult.wasDoubled) amount = 6;

    activeColors.forEach(color => { resources[color] = amount; });

    state = addResources(state, playerId, resources);
    const total = activeColors.length * amount;
    const colorList = activeColors.map(c => `${amount} ${c}`).join(', ');
    const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';
    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('yellowSwapResources', gameLayers)} and gained ${colorList} (${total} total)${suffix}`]);
}

export const yellowActionHandlers = {
    gain3yellow,
    gain2yellow,
    steal2Gems,
    steal3Gems,
    yellowHybrid1,
    yellowHybrid2,
    yellowSwapResources
};
