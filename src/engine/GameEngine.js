// GameEngine — Top-level API for the pure game engine.
// All functions are synchronous, pure, and return { state, log, pendingDecision? }.

import { routeAction } from './actions/index.js';
import { resolveShop } from './shops/shopResolver.js';
import { calculateRoundEndScoring } from './scoring.js';
import { getAvailableActions, isGameOver as checkGameOver, MAX_RECURSION_DEPTH } from './rules.js';
import { createPlayer, emptyResources } from './stateHelpers.js';
import { selectGameLayers } from '../data/allGameLayers.js';
import { getRandomPlayerEmojis } from '../data/constants.js';

/**
 * Create a new game state.
 * @param {Object} options
 * @param {number} options.playerCount - 2-4 players
 * @param {string[]} [options.playerNames] - Names for each player
 * @param {Object} [options.gameLayers] - Pre-selected layers (or auto-selected)
 * @param {'basic'|'advanced'} [options.gameMode='basic'] - Game mode
 * @returns {Object} Initial game state
 */
export function createGame({ playerCount = 2, playerNames, gameLayers, gameMode = 'basic' }) {
    const emojis = getRandomPlayerEmojis(playerCount);
    const layers = gameLayers || selectGameLayers(playerCount, gameMode);

    const players = [];
    for (let i = 0; i < playerCount; i++) {
        const name = playerNames?.[i] || `Player ${i + 1}`;
        players.push(createPlayer(i + 1, name, emojis[i]));
    }

    // WHITE AUTOMATIC VP: If white is in play, all players start with 5 VP
    let initialPlayers = players;
    if (layers.white) {
        initialPlayers = players.map(p => ({
            ...p,
            victoryPoints: p.victoryPoints + 5,
            vpSources: { ...p.vpSources, whiteStart: 5 }
        }));
    }

    // Automatic VPs based on active layers
    const automaticVPs = {};
    if (layers.blue) automaticVPs.blue = true;
    if (layers.purple) automaticVPs.purple = true;

    // Initialize closed shops (R2, R3 start closed, VP shops start OPEN)
    const closedShops = {};
    Object.keys(layers).forEach(color => {
        closedShops[`${color}2`] = true;
        closedShops[`${color}3`] = true;
    });

    // Randomize turn order
    const turnOrder = initialPlayers.map(p => p.id);
    for (let i = turnOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [turnOrder[i], turnOrder[j]] = [turnOrder[j], turnOrder[i]];
    }

    return {
        currentPlayer: turnOrder[0],
        turnDirection: 1,
        gameMode,
        players: initialPlayers,
        occupiedSpaces: {},
        round: 1,
        turnOrder,
        workerPlacedThisTurn: false,
        workersToPlace: 1,
        shopUsedAfterWorkers: false,
        vpShopUsed: false,
        actionLog: [],
        gameStarted: true,
        gameLayers: layers,
        automaticVPs,
        closedShops,
        skippedTurns: {},
        playersOutOfWorkers: [],
        waitingForOthers: {},
        roundActions: [],
        gameOver: false
    };
}

/**
 * Execute an action (place worker + action effect).
 * @param {Object} state - Current game state
 * @param {number} playerId - Player executing the action
 * @param {string} actionId - Action ID to execute
 * @param {Object} [decisions] - Pre-supplied decisions
 * @param {number} [recursionDepth=0] - Current recursion depth
 * @returns {{ state: Object, log: string[], pendingDecision?: Object, executeAction?: Object, executeActions?: Object[] }}
 */
export function executeAction(state, playerId, actionId, decisions, recursionDepth = 0) {
    if (recursionDepth > MAX_RECURSION_DEPTH) {
        return {
            state,
            log: ['Max recursion depth reached — stopping to prevent infinite loop']
        };
    }

    const result = routeAction(state, playerId, actionId, state.gameLayers, decisions, recursionDepth);

    // If the action returned executeAction(s), recursively execute them
    if (result.executeAction && !result.pendingDecision) {
        const subResult = executeAction(
            result.state,
            result.executeAction.playerId,
            result.executeAction.actionId,
            result.executeAction.decisions,
            result.executeAction.recursionDepth
        );
        return {
            state: subResult.state,
            log: [...result.log, ...subResult.log],
            pendingDecision: subResult.pendingDecision
        };
    }

    if (result.executeActions && !result.pendingDecision) {
        let currentState = result.state;
        const allLog = [...result.log];

        for (const action of result.executeActions) {
            const subResult = executeAction(
                currentState,
                action.playerId,
                action.actionId,
                action.decisions,
                action.recursionDepth
            );
            currentState = subResult.state;
            allLog.push(...subResult.log);
            if (subResult.pendingDecision) {
                return { state: currentState, log: allLog, pendingDecision: subResult.pendingDecision };
            }
        }

        return { state: currentState, log: allLog };
    }

    return result;
}

/**
 * Execute a shop benefit.
 */
export function executeShop(state, playerId, shopColor, shopRound, decisions) {
    const result = resolveShop(state, playerId, shopColor, shopRound, decisions);

    // Handle executeAction/executeActions in shop results
    if (result.executeAction && !result.pendingDecision) {
        const subResult = executeAction(
            result.state,
            result.executeAction.playerId,
            result.executeAction.actionId,
            result.executeAction.decisions,
            result.executeAction.recursionDepth
        );
        return {
            state: subResult.state,
            log: [...result.log, ...subResult.log],
            pendingDecision: subResult.pendingDecision
        };
    }

    if (result.executeActions && !result.pendingDecision) {
        let currentState = result.state;
        const allLog = [...result.log];

        for (const action of result.executeActions) {
            const subResult = executeAction(
                currentState,
                action.playerId,
                action.actionId,
                action.decisions,
                action.recursionDepth
            );
            currentState = subResult.state;
            allLog.push(...subResult.log);
            if (subResult.pendingDecision) {
                return { state: currentState, log: allLog, pendingDecision: subResult.pendingDecision };
            }
        }

        return { state: currentState, log: allLog };
    }

    return result;
}

/**
 * End the current player's turn (simplified — full END_TURN logic lives in gameReducer).
 * This handles basic turn progression for headless simulation.
 */
export function endTurn(state) {
    const log = [];
    const currentIndex = state.turnOrder.indexOf(state.currentPlayer);
    let nextPlayer;
    let nextDirection = state.turnDirection;

    // Track workers running out
    const currentPlayerObj = state.players.find(p => p.id === state.currentPlayer);
    const newPlayersOutOfWorkers = [...state.playersOutOfWorkers];
    if (currentPlayerObj.workersLeft === 0 && !newPlayersOutOfWorkers.includes(state.currentPlayer)) {
        newPlayersOutOfWorkers.push(state.currentPlayer);
    }

    // Snake draft turn progression
    if (state.turnDirection === 1) {
        if (currentIndex === state.turnOrder.length - 1) {
            nextDirection = -1;
            nextPlayer = state.turnOrder[currentIndex]; // Same player at boundary
        } else {
            nextPlayer = state.turnOrder[currentIndex + 1];
        }
    } else {
        if (currentIndex === 0) {
            nextDirection = 1;
            nextPlayer = state.turnOrder[currentIndex]; // Same player at boundary
        } else {
            nextPlayer = state.turnOrder[currentIndex - 1];
        }
    }

    // Handle skip turns
    let attempts = 0;
    const tempSkipped = { ...state.skippedTurns };
    while (tempSkipped[nextPlayer] > 0 && attempts < state.players.length * 2) {
        tempSkipped[nextPlayer]--;
        log.push(`Player ${nextPlayer}: Turn skipped`);
        const skipIndex = state.turnOrder.indexOf(nextPlayer);
        if (nextDirection === 1) {
            if (skipIndex >= state.turnOrder.length - 1) { nextDirection = -1; }
            else { nextPlayer = state.turnOrder[skipIndex + 1]; }
        } else {
            if (skipIndex <= 0) { nextDirection = 1; }
            else { nextPlayer = state.turnOrder[skipIndex - 1]; }
        }
        attempts++;
    }

    // Skip players with no workers
    attempts = 0;
    while (attempts < state.players.length * 2) {
        const p = state.players.find(pl => pl.id === nextPlayer);
        if (p && p.workersLeft > 0) break;
        const idx = state.turnOrder.indexOf(nextPlayer);
        if (nextDirection === 1) {
            if (idx >= state.turnOrder.length - 1) { nextDirection = -1; }
            else { nextPlayer = state.turnOrder[idx + 1]; }
        } else {
            if (idx <= 0) { nextDirection = 1; }
            else { nextPlayer = state.turnOrder[idx - 1]; }
        }
        attempts++;
    }

    // Check if all players are out of workers
    const totalWorkersRemaining = state.players.reduce((sum, p) => sum + p.workersLeft, 0);

    if (totalWorkersRemaining === 0) {
        if (state.round >= 3) {
            // Game over
            const scoring = calculateRoundEndScoring(state);
            return {
                state: { ...scoring.state, gameOver: true },
                log: [...log, ...scoring.log, 'Game Over! All players are out of workers.']
            };
        }
        // Round needs to advance
        return {
            state: { ...state, skippedTurns: tempSkipped, playersOutOfWorkers: newPlayersOutOfWorkers },
            log: [...log, 'Round complete! All players are out of patrons.'],
            needsRoundAdvance: true
        };
    }

    return {
        state: {
            ...state,
            currentPlayer: nextPlayer,
            turnDirection: nextDirection,
            workerPlacedThisTurn: false,
            workersToPlace: 1,
            shopUsedAfterWorkers: false,
            vpShopUsed: false,
            skippedTurns: tempSkipped,
            playersOutOfWorkers: newPlayersOutOfWorkers
        },
        log
    };
}

/**
 * Advance to the next round.
 */
export function advanceRound(state) {
    if (state.round >= 3) {
        return { state: { ...state, gameOver: true }, log: ['Game over — cannot advance past round 3'] };
    }

    // Calculate round-end scoring
    const scoring = calculateRoundEndScoring(state);
    let newState = scoring.state;
    const log = [...scoring.log];

    const newRound = state.round + 1;

    // Open shops for the new round
    const updatedClosedShops = { ...newState.closedShops };
    const activeColors = Object.keys(state.gameLayers || {});
    activeColors.forEach(color => {
        delete updatedClosedShops[`${color}${newRound}`];
    });

    // Sort players by VP (lowest first)
    const sortedPlayers = [...newState.players].sort((a, b) => a.victoryPoints - b.victoryPoints);
    const newTurnOrder = sortedPlayers.map(p => p.id);

    // Workers per round: 3 (R1) → 4 (R2) → 5 (R3)
    const baseWorkers = 2 + newRound;

    newState = {
        ...newState,
        round: newRound,
        closedShops: updatedClosedShops,
        players: newState.players.map(player => ({
            ...player,
            workersLeft: baseWorkers,
            effects: (player.effects || []).filter(e =>
                !e.includes('Will get 2 extra workers next round') &&
                !e.includes('more workers this turn')
            ),
            shopCostModifier: 0
        })),
        occupiedSpaces: {},
        turnOrder: newTurnOrder,
        currentPlayer: newTurnOrder[0],
        turnDirection: 1,
        workerPlacedThisTurn: false,
        workersToPlace: 1,
        shopUsedAfterWorkers: false,
        vpShopUsed: false,
        playersOutOfWorkers: [],
        skippedTurns: {},
        waitingForOthers: {},
        roundActions: []
    };

    log.push(`Round ${newRound} started!`);
    return { state: newState, log };
}

/**
 * Check if game is over.
 */
export function isGameOver(state) {
    return checkGameOver(state);
}

/**
 * Get available actions for the current game state.
 */
export { getAvailableActions };
