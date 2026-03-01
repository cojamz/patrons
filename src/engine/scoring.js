// Scoring module — auto VP calculations and end-of-round scoring.
// Extracted from gameReducer.js ADVANCE_ROUND logic.

import { addVP, addResources } from './stateHelpers.js';

/**
 * Calculate Yellow auto VP: +1 VP per different color resource owned.
 * Only active if yellow layer is in the game.
 */
export function calculateYellowAutoVP(state, playerId) {
    if (!state.gameLayers?.yellow) return { vp: 0, description: '' };
    const player = state.players.find(p => p.id === playerId);
    const differentColors = Object.entries(player.resources)
        .filter(([_, amount]) => amount > 0)
        .length;
    return {
        vp: differentColors,
        description: differentColors > 0
            ? `+${differentColors} VP for ${differentColors} different color resources`
            : ''
    };
}

/**
 * Calculate Gold auto VP: +1 VP per gold owned.
 * Only active if gold layer is in the game.
 */
export function calculateGoldAutoVP(state, playerId) {
    if (!state.gameLayers?.gold) return { vp: 0, description: '' };
    const player = state.players.find(p => p.id === playerId);
    const goldAmount = player.resources.gold || 0;
    return {
        vp: goldAmount,
        description: goldAmount > 0
            ? `+${goldAmount} VP for ${goldAmount} gold resources`
            : ''
    };
}

/**
 * Calculate Silver auto VP at round end:
 * - Player(s) with most VP get +3 silver
 * - All other players get +2 VP
 * Only active if silver layer is in the game.
 * Returns updates to apply (doesn't mutate state).
 */
export function calculateSilverAutoVP(state) {
    if (!state.gameLayers?.silver) return [];

    const maxVP = Math.max(...state.players.map(p => p.victoryPoints));
    const leaderIds = state.players.filter(p => p.victoryPoints === maxVP).map(p => p.id);

    return state.players.map(player => {
        if (leaderIds.includes(player.id)) {
            return { playerId: player.id, type: 'silver', amount: 3, description: '+3 Silver (most VP)' };
        } else {
            return { playerId: player.id, type: 'vp', amount: 2, source: 'silverAutomatic', description: '+2 VP (Silver automatic)' };
        }
    });
}

/**
 * Calculate Purple worker VP: first AND last player to run out of workers get +4 VP each.
 * Only active if purple layer is in the game.
 */
export function calculatePurpleWorkerVP(state, playersOutOfWorkers) {
    if (!state.automaticVPs?.purple) return [];
    const updates = [];

    // First to run out
    if (playersOutOfWorkers.length >= 1) {
        updates.push({
            playerId: playersOutOfWorkers[0],
            vp: 4,
            reason: 'first to run out of workers'
        });
    }

    // Last to run out (all players have 0 workers)
    const allOut = state.players.every(p => p.workersLeft === 0);
    if (allOut && playersOutOfWorkers.length > 1) {
        const lastId = playersOutOfWorkers[playersOutOfWorkers.length - 1];
        // Don't double-count if same player is both first and last (2-player edge case)
        if (lastId !== playersOutOfWorkers[0]) {
            updates.push({
                playerId: lastId,
                vp: 4,
                reason: 'last to run out of workers'
            });
        }
    }

    return updates;
}

/**
 * Apply all round-end auto VP scoring.
 * Returns { state, log }.
 */
export function calculateRoundEndScoring(state) {
    let newState = state;
    const log = [];

    // Yellow auto VP for each player
    newState.players.forEach(player => {
        const yellow = calculateYellowAutoVP(newState, player.id);
        if (yellow.vp > 0) {
            newState = addVP(newState, player.id, yellow.vp, 'yellowDiversity');
            log.push(`Player ${player.id}: ${yellow.description}`);
        }
    });

    // Gold auto VP for each player
    newState.players.forEach(player => {
        const gold = calculateGoldAutoVP(newState, player.id);
        if (gold.vp > 0) {
            newState = addVP(newState, player.id, gold.vp, 'goldAutomatic');
            log.push(`Player ${player.id}: ${gold.description}`);
        }
    });

    // Silver auto VP
    const silverUpdates = calculateSilverAutoVP(newState);
    silverUpdates.forEach(update => {
        if (update.type === 'silver') {
            newState = addResources(newState, update.playerId, { silver: update.amount });
        } else {
            newState = addVP(newState, update.playerId, update.amount, update.source);
        }
        log.push(`Player ${update.playerId}: ${update.description}`);
    });

    return { state: newState, log };
}

/**
 * Calculate Yellow auto VP specifically for the Yellow R2 shop trigger.
 * This counts "complete sets" — the minimum count across all active colors.
 */
export function calculateYellowShopAutoVP(state, playerId) {
    const activeColors = Object.keys(state.gameLayers || {});
    if (activeColors.length === 0) return 0;

    const player = state.players.find(p => p.id === playerId);
    const resourceCounts = activeColors.map(color => player.resources[color] || 0);
    return Math.min(...resourceCounts);
}
