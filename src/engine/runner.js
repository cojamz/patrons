// Headless game runner — simulate full games without UI.

import { createGame, executeAction, endTurn, advanceRound, isGameOver, getAvailableActions } from './GameEngine.js';
import { getPlayer } from './stateHelpers.js';
import { isBasicGain } from './actions/basicActions.js';
import { pickAction as heuristicPickAction } from './heuristicAI.js';

/**
 * Random decision function — makes random valid choices for any decision type.
 * Used for basic balance testing and smoke testing.
 */
export function randomDecisionFn(state, playerId, pendingDecision) {
    switch (pendingDecision.type) {
        case 'gemSelection': {
            const maxGems = pendingDecision.maxGems || 1;
            const activeColors = Object.keys(state.gameLayers || {});
            if (activeColors.length === 0) return { gemSelection: { red: maxGems } };

            // If selecting from player's inventory, respect what they have
            if (pendingDecision.fromPlayer) {
                const fromPlayer = getPlayer(state, pendingDecision.fromPlayer);
                const selection = {};
                let remaining = maxGems;

                // Pick random colors from what the player has
                const availableColors = Object.entries(fromPlayer.resources)
                    .filter(([color, amount]) => amount > 0 && color !== 'gold')
                    .sort(() => Math.random() - 0.5);

                for (const [color, amount] of availableColors) {
                    if (remaining <= 0) break;
                    const take = Math.min(amount, remaining);
                    selection[color] = take;
                    remaining -= take;
                }

                return { gemSelection: selection };
            }

            // Free selection — distribute randomly across active colors
            const selection = {};
            let remaining = maxGems;
            while (remaining > 0) {
                const color = activeColors[Math.floor(Math.random() * activeColors.length)];
                selection[color] = (selection[color] || 0) + 1;
                remaining--;
            }
            return { gemSelection: selection };
        }

        case 'targetPlayer': {
            const others = state.players.filter(p => p.id !== (pendingDecision.excludePlayer || playerId));
            if (others.length === 0) return {};
            const target = others[Math.floor(Math.random() * others.length)];
            return { targetPlayer: target.id };
        }

        case 'actionChoice': {
            if (!pendingDecision.options || pendingDecision.options.length === 0) return {};
            const choice = pendingDecision.options[Math.floor(Math.random() * pendingDecision.options.length)];
            return { actionChoice: choice.value || choice };
        }

        case 'actionOrder': {
            // Shuffle the remaining actions
            const remaining = [...(pendingDecision.remainingActions || [])];
            for (let i = remaining.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remaining[i], remaining[j]] = [remaining[j], remaining[i]];
            }
            return { actionOrder: remaining };
        }

        case 'shopChoice': {
            if (!pendingDecision.options || pendingDecision.options.length === 0) return {};
            const choice = pendingDecision.options[Math.floor(Math.random() * pendingDecision.options.length)];
            return { shopChoice: choice };
        }

        case 'stealGems': {
            const target = getPlayer(state, pendingDecision.fromPlayer);
            if (!target) return { stealGems: {} };
            const maxSteal = pendingDecision.maxGems || 1;
            const selection = {};
            let remaining = maxSteal;

            const available = Object.entries(target.resources)
                .filter(([_, amount]) => amount > 0)
                .sort(() => Math.random() - 0.5);

            for (const [color, amount] of available) {
                if (remaining <= 0) break;
                const take = Math.min(amount, remaining);
                selection[color] = take;
                remaining -= take;
            }
            return { stealGems: selection };
        }

        case 'workerSelection': {
            if (!pendingDecision.options || pendingDecision.options.length === 0) return {};
            const choice = pendingDecision.options[Math.floor(Math.random() * pendingDecision.options.length)];
            if (pendingDecision.subType === 'myWorker') return { myWorker: choice.value };
            if (pendingDecision.subType === 'otherWorker') return { otherWorker: choice.value };
            return {};
        }

        case 'shopToggle': {
            // Pick a random shop to toggle
            const colors = Object.keys(state.gameLayers || {});
            const color = colors[Math.floor(Math.random() * colors.length)];
            const round = Math.floor(Math.random() * 3) + 1;
            return { shopToggle: `${color}${round}` };
        }

        case 'workerMove': {
            // Pick a random worker and random destination
            const myWorkers = Object.entries(state.occupiedSpaces)
                .filter(([_, pid]) => pid === playerId);
            if (myWorkers.length === 0) return {};
            const [from] = myWorkers[Math.floor(Math.random() * myWorkers.length)];

            const available = getAvailableActions(state);
            if (available.length === 0) return {};
            const to = available[Math.floor(Math.random() * available.length)];

            return { workerMove: { from, to } };
        }

        default:
            return {};
    }
}

/**
 * Simulate a complete game.
 * @param {Object} options
 * @param {number} [options.playerCount=2]
 * @param {Object} [options.gameLayers]
 * @param {'basic'|'advanced'} [options.gameMode='basic']
 * @param {Function} [options.decisionFn=randomDecisionFn]
 * @param {Function} [options.actionPickerFn] - Custom action selection (default: random)
 * @param {number} [options.maxTurns=200] - Safety limit
 * @returns {{ finalState, gameLog, turns }}
 */
export function simulateGame({
    playerCount = 2,
    playerNames,
    gameLayers,
    gameMode = 'basic',
    decisionFn = randomDecisionFn,
    actionPickerFn,
    maxTurns = 200
} = {}) {
    let state = createGame({ playerCount, playerNames, gameLayers, gameMode });
    const gameLog = [];
    let turns = 0;

    while (!isGameOver(state) && turns < maxTurns) {
        turns++;
        const currentPlayerId = state.currentPlayer;
        const player = getPlayer(state, currentPlayerId);

        if (!player || player.workersLeft <= 0) {
            // End turn if player can't act
            const turnResult = endTurn(state);
            state = turnResult.state;
            gameLog.push(...turnResult.log);

            if (turnResult.needsRoundAdvance) {
                const roundResult = advanceRound(state);
                state = roundResult.state;
                gameLog.push(...roundResult.log);
            }
            continue;
        }

        // Pick an action (heuristic or random)
        const available = getAvailableActions(state);
        if (available.length === 0) {
            const turnResult = endTurn(state);
            state = turnResult.state;
            gameLog.push(...turnResult.log);

            if (turnResult.needsRoundAdvance) {
                const roundResult = advanceRound(state);
                state = roundResult.state;
                gameLog.push(...roundResult.log);
            }
            continue;
        }

        const actionId = actionPickerFn
            ? actionPickerFn(state, currentPlayerId)
            : available[Math.floor(Math.random() * available.length)];

        // Place the worker
        state = {
            ...state,
            occupiedSpaces: { ...state.occupiedSpaces, [actionId]: currentPlayerId },
            players: state.players.map(p =>
                p.id === currentPlayerId ? { ...p, workersLeft: p.workersLeft - 1 } : p
            ),
            workerPlacedThisTurn: true,
            workersToPlace: Math.max(0, state.workersToPlace - 1)
        };

        // Execute the action — resolve any pending decisions with the decision function
        let result = executeAction(state, currentPlayerId, actionId);
        let decisionAttempts = 0;

        while (result.pendingDecision && decisionAttempts < 10) {
            const decisions = decisionFn(result.state, currentPlayerId, result.pendingDecision);
            result = executeAction(result.state, currentPlayerId, actionId, decisions);
            decisionAttempts++;
        }

        state = result.state;
        gameLog.push(...result.log);

        // Check if player has more workers to place (from playTwoWorkers, etc.)
        if (state.workersToPlace > 0 && player.workersLeft > 1) {
            // Continue placing (the loop will handle it on next iteration by keeping same player)
            continue;
        }

        // End turn
        const turnResult = endTurn(state);
        state = turnResult.state;
        gameLog.push(...turnResult.log);

        if (turnResult.needsRoundAdvance) {
            const roundResult = advanceRound(state);
            state = roundResult.state;
            gameLog.push(...roundResult.log);
        }
    }

    return { finalState: state, gameLog, turns };
}
