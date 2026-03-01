// Pure state helper functions for immutable game state mutations.
// Zero React, zero Firebase, zero dispatch. Just state in → state out.

import { RESOURCE_TYPES } from '../data/constants.js';

const EMPTY_RESOURCES = { red: 0, yellow: 0, blue: 0, purple: 0, gold: 0, white: 0, black: 0, silver: 0 };

/**
 * Get a player object from state by ID
 */
export function getPlayer(state, playerId) {
    return state.players.find(p => p.id === playerId);
}

/**
 * Get all players except the specified one
 */
export function getOtherPlayers(state, playerId) {
    return state.players.filter(p => p.id !== playerId);
}

/**
 * Add resources to a player. Clamps at 0 (no negatives).
 * Also sets lastGain on OTHER players (for yellowHybrid2 copy mechanic).
 */
export function addResources(state, playerId, resources) {
    // Track what was actually gained (positive values only)
    const gainedResources = {};
    Object.entries(resources).forEach(([color, amount]) => {
        if (amount > 0) gainedResources[color] = amount;
    });

    return {
        ...state,
        players: state.players.map(player => {
            if (player.id === playerId) {
                const newResources = { ...player.resources };
                Object.entries(resources).forEach(([color, amount]) => {
                    newResources[color] = Math.max(0, (newResources[color] || 0) + amount);
                });
                return { ...player, resources: newResources };
            } else if (Object.keys(gainedResources).length > 0) {
                // Other players track the gaining player's last gain
                return { ...player, lastGain: gainedResources };
            }
            return player;
        })
    };
}

/**
 * Remove resources from a player (convenience wrapper, uses negative amounts).
 */
export function removeResources(state, playerId, resources) {
    const negated = {};
    Object.entries(resources).forEach(([color, amount]) => {
        negated[color] = -Math.abs(amount);
    });
    return addResources(state, playerId, negated);
}

/**
 * Set a player's resources directly (full replacement).
 */
export function setResources(state, playerId, resources) {
    return {
        ...state,
        players: state.players.map(player =>
            player.id === playerId ? { ...player, resources: { ...EMPTY_RESOURCES, ...resources } } : player
        )
    };
}

/**
 * Add VP to a player and track the source.
 */
export function addVP(state, playerId, amount, source) {
    return {
        ...state,
        players: state.players.map(player => {
            if (player.id !== playerId) return player;
            return {
                ...player,
                victoryPoints: player.victoryPoints + amount,
                vpSources: {
                    ...player.vpSources,
                    [source]: (player.vpSources?.[source] || 0) + amount
                }
            };
        })
    };
}

/**
 * Add an effect string to a player's effects array.
 */
export function addEffect(state, playerId, effect) {
    return {
        ...state,
        players: state.players.map(player =>
            player.id === playerId
                ? { ...player, effects: [...(player.effects || []), effect] }
                : player
        )
    };
}

/**
 * Remove the first effect matching a predicate from a player's effects.
 */
export function removeEffect(state, playerId, matchFn) {
    return {
        ...state,
        players: state.players.map(player => {
            if (player.id !== playerId) return player;
            const effects = [...(player.effects || [])];
            const idx = effects.findIndex(matchFn);
            if (idx !== -1) effects.splice(idx, 1);
            return { ...player, effects };
        })
    };
}

/**
 * Remove ALL effects matching a predicate from a player's effects.
 */
export function removeAllEffects(state, playerId, matchFn) {
    return {
        ...state,
        players: state.players.map(player =>
            player.id === playerId
                ? { ...player, effects: (player.effects || []).filter(e => !matchFn(e)) }
                : player
        )
    };
}

/**
 * Update arbitrary player fields.
 */
export function updatePlayer(state, playerId, updates) {
    return {
        ...state,
        players: state.players.map(player =>
            player.id === playerId ? { ...player, ...updates } : player
        )
    };
}

/**
 * Check if a player has an effect matching a predicate.
 */
export function hasEffect(player, matchFn) {
    return (player.effects || []).some(matchFn);
}

/**
 * Check if player has the "Next gain will be doubled" effect.
 */
export function hasDoubleEffect(player) {
    return hasEffect(player, e => e.includes('Next gain will be doubled'));
}

/**
 * Consume the doubling effect: double the resources, remove the effect, return updated state.
 * Returns { state, wasDoubled }.
 */
export function applyDoubleEffect(state, playerId, resources) {
    const player = getPlayer(state, playerId);
    if (!hasDoubleEffect(player)) {
        return { state, resources, wasDoubled: false };
    }

    const doubled = {};
    Object.entries(resources).forEach(([color, amount]) => {
        doubled[color] = amount * 2;
    });

    const newState = removeAllEffects(state, playerId, e => e.includes('Next gain will be doubled'));
    return { state: newState, resources: doubled, wasDoubled: true };
}

/**
 * Format resources object as a human-readable string: "3 red, 2 blue"
 */
export function formatResources(resources) {
    return Object.entries(resources)
        .filter(([_, amount]) => amount > 0)
        .map(([color, amount]) => `${amount} ${color}`)
        .join(', ');
}

/**
 * Format player name for logs: "🦊 Player 1"
 */
export function formatPlayerName(player) {
    return `${player.emoji || '👤'} ${player.name}`;
}

/**
 * Standard result shape for action/shop handlers.
 */
export function createResult(state, log = []) {
    return { state, log: Array.isArray(log) ? log : [log] };
}

/**
 * Result shape when a player decision is needed.
 */
export function createDecisionRequest(state, decision, log = []) {
    return {
        state,
        log: Array.isArray(log) ? log : [log],
        pendingDecision: decision
    };
}

/**
 * Count total resources a player has.
 */
export function totalResources(player) {
    return Object.values(player.resources).reduce((sum, amt) => sum + amt, 0);
}

/**
 * Count non-gold resources a player has.
 */
export function totalNonGoldResources(player) {
    return Object.entries(player.resources)
        .filter(([color]) => color !== 'gold')
        .reduce((sum, [_, amt]) => sum + amt, 0);
}

/**
 * Create an empty resources object.
 */
export function emptyResources() {
    return { ...EMPTY_RESOURCES };
}

/**
 * Create a fresh player object.
 */
export function createPlayer(id, name, emoji, options = {}) {
    return {
        id,
        name,
        emoji,
        resources: { ...EMPTY_RESOURCES },
        workersLeft: 4,
        effects: [],
        victoryPoints: 0,
        vpSources: {},
        shopCostModifier: 0,
        lastGain: {},
        isAI: options.isAI || false,
        aiDifficulty: options.aiDifficulty || null,
        extraTurns: 0
    };
}

/**
 * Set occupied spaces (for swaps, moves).
 */
export function setOccupiedSpaces(state, occupiedSpaces) {
    return { ...state, occupiedSpaces };
}

/**
 * Place a worker on an action space.
 */
export function placeWorker(state, actionId, playerId) {
    return {
        ...state,
        occupiedSpaces: { ...state.occupiedSpaces, [actionId]: playerId }
    };
}

/**
 * Remove a worker from an action space and give it back to the player.
 */
export function removeWorker(state, actionId, playerId) {
    const newOccupied = { ...state.occupiedSpaces };
    delete newOccupied[actionId];
    return {
        ...state,
        occupiedSpaces: newOccupied,
        players: state.players.map(player =>
            player.id === playerId
                ? { ...player, workersLeft: player.workersLeft + 1 }
                : player
        )
    };
}

/**
 * Set skipped turns for a player.
 */
export function addSkippedTurn(state, playerId) {
    return {
        ...state,
        skippedTurns: {
            ...state.skippedTurns,
            [playerId]: (state.skippedTurns[playerId] || 0) + 1
        }
    };
}

/**
 * Add workers to place this turn.
 */
export function addWorkersToPlace(state, count) {
    return {
        ...state,
        workersToPlace: state.workersToPlace + count
    };
}
