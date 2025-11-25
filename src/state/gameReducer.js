// Game reducer and initial state
import { getRandomPlayerEmojis } from '../data/constants.js';

// Generate initial player emojis
const initialPlayerEmojis = getRandomPlayerEmojis(4);

export const initialState = {
    // Game state
    currentPlayer: 1,
    turnDirection: 1,
    gameMode: null, // 'basic' or 'advanced' - set when game starts
    players: [
        { id: 1, name: "Player 1", emoji: initialPlayerEmojis[0], resources: { red: 0, yellow: 0, blue: 0, purple: 0, gold: 0, white: 0, black: 0, silver: 0 }, workersLeft: 4, effects: [], victoryPoints: 0, vpSources: {}, shopCostModifier: 0, lastGain: {}, isAI: false, aiDifficulty: null },
        { id: 2, name: "Player 2", emoji: initialPlayerEmojis[1], resources: { red: 0, yellow: 0, blue: 0, purple: 0, gold: 0, white: 0, black: 0, silver: 0 }, workersLeft: 4, effects: [], victoryPoints: 0, vpSources: {}, shopCostModifier: 0, lastGain: {}, isAI: false, aiDifficulty: null },
        { id: 3, name: "Player 3", emoji: initialPlayerEmojis[2], resources: { red: 0, yellow: 0, blue: 0, purple: 0, gold: 0, white: 0, black: 0, silver: 0 }, workersLeft: 4, effects: [], victoryPoints: 0, vpSources: {}, shopCostModifier: 0, lastGain: {}, isAI: false, aiDifficulty: null },
        { id: 4, name: "Player 4", emoji: initialPlayerEmojis[3], resources: { red: 0, yellow: 0, blue: 0, purple: 0, gold: 0, white: 0, black: 0, silver: 0 }, workersLeft: 4, effects: [], victoryPoints: 0, vpSources: {}, shopCostModifier: 0, lastGain: {}, isAI: false, aiDifficulty: null }
    ],
    occupiedSpaces: {},
    round: 1,
    turnOrder: [1, 2, 3, 4], // Will be randomized when game starts
    workerPlacedThisTurn: false,
    workersToPlace: 1,
    shopUsedAfterWorkers: false, // Track if shop was used after placing all workers
    vpShopUsed: false, // Track if VP shop was used this turn
    modal: null,
    actionLog: [],
    gameLayers: null, // Will be set when game starts
    automaticVPs: {}, // Track which automatic VPs are active { blue: true, etc }
    closedShops: {}, // Track which shops are closed { 'red1': true, 'blue2': true, etc }
    // shopCostModifier is now per-player, not global
    skippedTurns: {}, // Track players who should skip turns { playerId: turnsToSkip }
    playersOutOfWorkers: [], // Track order players ran out of workers for purple VP
    waitingForOthers: {}, // Track players waiting for others to run out (purple R3)
    roundActions: [], // Track all actions taken this round for Red R3 shop
    roundAdvancing: false, // Track if round is currently being advanced

    // Multiplayer state
    roomCode: null,
    myPlayerId: null,
    myPlayerName: '',
    connectedPlayers: {},
    isHost: false,
    gameStarted: false,
    connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected'
    gameOver: false,
    syncingFromFirebase: false,
    stateVersion: 0,

    // Notification system for multiplayer
    notifications: [],

    // Optimistic locking for placement
    pendingPlacements: {}
};

export function gameReducer(state, action) {
    console.log('Reducer called with action:', action.type, action);
    const newState = (() => {
    switch (action.type) {
        case 'PLACE_WORKER':
            // Allow specifying which player's worker to place (for Red R2 shop effect)
            const workerOwner = action.playerId || state.currentPlayer;
            const isCurrentPlayerWorker = workerOwner === state.currentPlayer;

            const newWorkersToPlace = isCurrentPlayerWorker ? Math.max(0, state.workersToPlace - 1) : state.workersToPlace;
            const workerOwnerPlayer = state.players.find(p => p.id === workerOwner);
            // Don't reduce below 0 - when using "play more workers" effects
            const workerOwnerWorkersLeft = Math.max(0, workerOwnerPlayer.workersLeft - 1);

            // Check if player has "play more workers" effect active
            const hasPlayMoreWorkersEffect = (workerOwnerPlayer.effects || []).some(effect =>
                effect.includes('Can place') && effect.includes('more workers this turn')
            );

            // Only clear effect if we've placed ALL workers (including bonus workers)
            const shouldClearPlaceEffect = newWorkersToPlace === 0 && hasPlayMoreWorkersEffect;

            return {
                ...state,
                occupiedSpaces: {
                    ...state.occupiedSpaces,
                    [action.actionId]: workerOwner
                },
                players: state.players.map(player => {
                    if (player.id === workerOwner) {
                        const updatedPlayer = { ...player, workersLeft: workerOwnerWorkersLeft };
                        // Clear the "Can place X workers" effect if done placing
                        if (shouldClearPlaceEffect && isCurrentPlayerWorker) {
                            updatedPlayer.effects = (updatedPlayer.effects || []).filter(effect =>
                                !effect.includes('Can place') && !effect.includes('more workers this turn')
                            );
                        }
                        return updatedPlayer;
                    }
                    return player;
                }),
                workerPlacedThisTurn: isCurrentPlayerWorker ? true : state.workerPlacedThisTurn,
                workersToPlace: newWorkersToPlace,
                roundActions: [...state.roundActions, { playerId: workerOwner, actionId: action.actionId }],
                lastUpdatedBy: state.myPlayerId
            };

        case 'UPDATE_RESOURCES':
            console.log('UPDATE_RESOURCES reducer called with:', {
                playerId: action.playerId,
                resources: action.resources,
                currentPlayers: state.players.map(p => ({ id: p.id, resources: p.resources }))
            });

            // Calculate what the current player gained (for other players to track)
            const gainedResources = {};
            Object.keys(action.resources).forEach(color => {
                if (action.resources[color] > 0) {
                    gainedResources[color] = action.resources[color];
                }
            });

            const updatedState = {
                ...state,
                players: state.players.map(player => {
                    if (player.id === action.playerId) {
                        const newResources = {
                            red: Math.max(0, player.resources.red + (action.resources.red || 0)),
                            yellow: Math.max(0, player.resources.yellow + (action.resources.yellow || 0)),
                            blue: Math.max(0, player.resources.blue + (action.resources.blue || 0)),
                            purple: Math.max(0, player.resources.purple + (action.resources.purple || 0)),
                            gold: Math.max(0, player.resources.gold + (action.resources.gold || 0)),
                            white: Math.max(0, player.resources.white + (action.resources.white || 0)),
                            black: Math.max(0, player.resources.black + (action.resources.black || 0)),
                            silver: Math.max(0, player.resources.silver + (action.resources.silver || 0))
                        };

                        // Warn if resources would go negative
                        Object.keys(action.resources).forEach(color => {
                            const newValue = player.resources[color] + (action.resources[color] || 0);
                            if (newValue < 0) {
                                console.warn(`[UPDATE_RESOURCES] Player ${player.id} would have negative ${color}: ${player.resources[color]} + ${action.resources[color]} = ${newValue}. Clamping to 0.`);
                            }
                        });

                        console.log('UPDATE_RESOURCES - Updating player', player.id, 'from', player.resources, 'to', newResources);
                        console.log('UPDATE_RESOURCES - Other players will track gainedResources:', gainedResources);
                        // Don't update gaining player's lastGain (only track OTHER players' gains)
                        return {
                            ...player,
                            resources: newResources
                            // lastGain unchanged - only tracks other players' gains
                        };
                    } else {
                        // Other players track what the current player gained
                        if (Object.keys(gainedResources).length > 0) {
                            return {
                                ...player,
                                lastGain: gainedResources
                            };
                        }
                    }
                    return player;
                })
            };

            console.log('UPDATE_RESOURCES - Updated state players:', updatedState.players.map(p => ({ id: p.id, resources: p.resources })));
            console.log('UPDATE_RESOURCES - Returning updated state');
            return updatedState;

        case 'SET_RESOURCES':
            return {
                ...state,
                players: state.players.map(player =>
                    player.id === action.playerId
                        ? { ...player, resources: action.resources }
                        : player
                )
            };

        // ADD_VICTORY_POINTS is deprecated - use UPDATE_VP instead
        case 'ADD_VICTORY_POINTS':
            return {
                ...state,
                players: state.players.map(player =>
                    player.id === action.playerId
                        ? {
                            ...player,
                            victoryPoints: player.victoryPoints + action.points,
                            vpSources: {
                                ...player.vpSources,
                                victoryShop: (player.vpSources?.victoryShop || 0) + action.points
                            }
                        }
                        : player
                )
            };

        case 'UPDATE_VP':
            return {
                ...state,
                players: state.players.map(player =>
                    player.id === action.playerId
                        ? {
                            ...player,
                            // Allow negative VP for more strategic gameplay
                            victoryPoints: player.victoryPoints + action.vp,
                            vpSources: {
                                ...player.vpSources,
                                [action.source || 'other']: (player.vpSources?.[action.source || 'other'] || 0) + action.vp
                            }
                        }
                        : player
                )
            };

        case 'ADD_EFFECT':
            return {
                ...state,
                players: state.players.map(player =>
                    player.id === action.playerId
                        ? { ...player, effects: [...(player.effects || []), action.effect] }
                        : player
                )
            };

        case 'UPDATE_PLAYER_EFFECTS':
            return {
                ...state,
                players: state.players.map(player =>
                    player.id === action.playerId
                        ? { ...player, effects: action.effects }
                        : player
                )
            };

        case 'SET_WORKERS_TO_PLACE':
            return {
                ...state,
                workersToPlace: action.count,
                workerPlacedThisTurn: false
            };

        case 'ADD_WORKERS_TO_PLACE':
            return {
                ...state,
                workersToPlace: state.workersToPlace + action.count
            };

        case 'END_TURN':
            const currentPlayerObj = state.players.find(p => p.id === state.currentPlayer);

            // Track if player just ran out of workers
            let newPlayersOutOfWorkers = [...state.playersOutOfWorkers];
            if (currentPlayerObj.workersLeft === 0 && !newPlayersOutOfWorkers.includes(state.currentPlayer)) {
                newPlayersOutOfWorkers.push(state.currentPlayer);
            }

            // Purple VP: Check if this is first or last player to run out (only if purple is active)
            const purpleVPUpdates = [];
            if (state.automaticVPs?.purple) {
                const playersWithWorkers = state.players.filter(p => p.workersLeft > 0);

                // First player to run out gets 4 VP
                if (newPlayersOutOfWorkers.length === 1 && newPlayersOutOfWorkers[0] === state.currentPlayer) {
                    purpleVPUpdates.push({ playerId: state.currentPlayer, vp: 4, reason: 'first to run out of workers' });
                }
                // Last player to run out gets 4 VP (when this player runs out and all others already have 0)
                if (currentPlayerObj.workersLeft === 0 && playersWithWorkers.length === 0) {
                    // Current player just ran out and no one else has workers = last to run out
                    purpleVPUpdates.push({ playerId: state.currentPlayer, vp: 4, reason: 'last to run out of workers' });
                }
            }

            // First, determine if this is a snake draft reversal
            const currentIndex = state.turnOrder.indexOf(state.currentPlayer);
            let isSnakeDraftReversal = false;
            let nextPlayerPreview = null;

            if (state.turnDirection === 1) {
                if (currentIndex === state.turnOrder.length - 1) {
                    // At the end, reverse direction but stay on same player
                    isSnakeDraftReversal = true;
                    nextPlayerPreview = state.turnOrder[currentIndex];
                }
            } else {
                if (currentIndex === 0) {
                    // At the beginning, reverse direction but stay on same player
                    isSnakeDraftReversal = true;
                    nextPlayerPreview = state.turnOrder[currentIndex];
                }
            }

            // Check for extra turn effect or extraTurns property
            const hasExtraTurnEffect = currentPlayerObj.effects.some(effect =>
                effect.includes('Will take an extra turn after this one')
            );
            const hasExtraTurnProp = (currentPlayerObj.extraTurns || 0) > 0;
            const hasExtraTurn = hasExtraTurnEffect || hasExtraTurnProp;

            // Check if player has skipped turns
            const hasSkippedTurns = state.skippedTurns[state.currentPlayer] > 0;

            // If it's a snake draft reversal, don't consume the extra turn
            if (hasExtraTurn && !isSnakeDraftReversal) {
                // Update skippedTurns - if player has skips, consume one instead of taking extra turn
                const newSkippedTurns = { ...state.skippedTurns };
                let logMessage = '';

                if (hasSkippedTurns) {
                    // Consume a skip instead of taking an extra turn
                    newSkippedTurns[state.currentPlayer]--;
                    logMessage = `Player ${state.currentPlayer}: Extra turn consumed by skip (${newSkippedTurns[state.currentPlayer]} skips remaining)`;
                } else {
                    // No skips, so take the extra turn
                    logMessage = `Player ${state.currentPlayer}: Taking extra turn!`;
                }

                // Remove the extra turn effect and decrement extraTurns
                const updatedPlayers = state.players.map(player => {
                    const vpUpdate = purpleVPUpdates.find(u => u.playerId === player.id);
                    return player.id === state.currentPlayer
                        ? {
                            ...player,
                            effects: (player.effects || []).filter(effect => {
                                // Don't clear "play more workers" effect if we still have workers to place
                                if ((effect.includes('Can place') && effect.includes('more workers this turn')) && state.workersToPlace > 0) {
                                    return true;
                                }
                                return !effect.includes('Will take an extra turn after this one') &&
                                       !effect.includes('more workers this turn') &&
                                       !effect.includes('Can place');
                                // "Next gain will be doubled" persists across turns/rounds until used
                            }),
                            extraTurns: Math.max(0, (player.extraTurns || 0) - 1),
                            victoryPoints: player.victoryPoints + (vpUpdate ? vpUpdate.vp : 0),
                            vpSources: vpUpdate ? {
                                ...player.vpSources,
                                purpleWorkers: (player.vpSources?.purpleWorkers || 0) + vpUpdate.vp
                            } : player.vpSources
                        }
                        : {
                            ...player,
                            victoryPoints: player.victoryPoints + (vpUpdate ? vpUpdate.vp : 0),
                            vpSources: vpUpdate ? {
                                ...player.vpSources,
                                purpleWorkers: (player.vpSources?.purpleWorkers || 0) + vpUpdate.vp
                            } : player.vpSources
                        };
                });

                // If player had skips, proceed to next player; otherwise stay on same player
                if (hasSkippedTurns) {
                    // Continue to normal turn progression below
                } else {
                    // Stay on same player for extra turn
                    // Check if player has "play more workers" effect still active
                    const currentPlayerData = updatedPlayers.find(p => p.id === state.currentPlayer);
                    const hasActiveWorkerEffect = (currentPlayerData.effects || []).some(effect =>
                        effect.includes('Can place') && effect.includes('more workers this turn')
                    );

                    return {
                        ...state,
                        players: updatedPlayers,
                        workerPlacedThisTurn: false,
                        workersToPlace: hasActiveWorkerEffect ? state.workersToPlace : 1,
                        shopUsedAfterWorkers: false,
                        vpShopUsed: false,
                        playersOutOfWorkers: newPlayersOutOfWorkers,
                        skippedTurns: newSkippedTurns,
                        lastUpdatedBy: state.myPlayerId,
                        actionLog: [
                            ...state.actionLog.slice(-9),
                            logMessage,
                            ...purpleVPUpdates.map(u => `Player ${u.playerId}: +${u.vp} VP (${u.reason})`)
                        ].filter(Boolean)
                    };
                }
            } else if (hasExtraTurn && isSnakeDraftReversal) {
                // Snake draft reversal - player naturally gets another turn, so don't consume the extra turn
                console.log(`Player ${state.currentPlayer}: Snake draft reversal - extra turn preserved`);
                // Add a log message for clarity
                const logMessage = `Player ${state.currentPlayer}: At end of snake draft - gets another turn naturally (extra turn preserved)`;
                state.actionLog.push(logMessage);
            }

            // If we processed an extra turn with skips above, use updated values
            const effectiveSkippedTurns = hasExtraTurn && hasSkippedTurns && !isSnakeDraftReversal
                ? { ...state.skippedTurns, [state.currentPlayer]: state.skippedTurns[state.currentPlayer] - 1 }
                : state.skippedTurns;
            const effectivePlayers = hasExtraTurn && !isSnakeDraftReversal
                ? state.players.map(player => {
                    const vpUpdate = purpleVPUpdates.find(u => u.playerId === player.id);
                    return player.id === state.currentPlayer
                        ? {
                            ...player,
                            effects: (player.effects || []).filter(effect => {
                                // Don't clear "play more workers" effect if we still have workers to place
                                if ((effect.includes('Can place') && effect.includes('more workers this turn')) && state.workersToPlace > 0) {
                                    return true;
                                }
                                return !effect.includes('Will take an extra turn after this one') &&
                                       !effect.includes('more workers this turn') &&
                                       !effect.includes('Can place');
                                // "Next gain will be doubled" persists across turns/rounds until used
                            }),
                            extraTurns: Math.max(0, (player.extraTurns || 0) - 1),
                            victoryPoints: player.victoryPoints + (vpUpdate ? vpUpdate.vp : 0),
                            vpSources: vpUpdate ? {
                                ...player.vpSources,
                                purpleWorkers: (player.vpSources?.purpleWorkers || 0) + vpUpdate.vp
                            } : player.vpSources
                        }
                        : {
                            ...player,
                            victoryPoints: player.victoryPoints + (vpUpdate ? vpUpdate.vp : 0),
                            vpSources: vpUpdate ? {
                                ...player.vpSources,
                                purpleWorkers: (player.vpSources?.purpleWorkers || 0) + vpUpdate.vp
                            } : player.vpSources
                        };
                })
                : state.players.map(player => {
                    const vpUpdate = purpleVPUpdates.find(u => u.playerId === player.id);
                    return vpUpdate ? {
                        ...player,
                        victoryPoints: player.victoryPoints + vpUpdate.vp,
                        vpSources: {
                            ...player.vpSources,
                            purpleWorkers: (player.vpSources?.purpleWorkers || 0) + vpUpdate.vp
                        }
                    } : player;
                });

            // Add log message if extra turn was consumed by skip
            const extraTurnLogMessages = [];
            if (hasExtraTurn && hasSkippedTurns) {
                extraTurnLogMessages.push(`Player ${state.currentPlayer}: Extra turn consumed by skip (${effectiveSkippedTurns[state.currentPlayer]} skips remaining)`);
            }

            // Check if any waiting players should now play all workers
            let waitingPlayersUpdates = [];
            let newWaitingForOthers = { ...state.waitingForOthers };

            // If all non-waiting players are out of workers, activate waiting players
            const nonWaitingPlayersWithWorkers = state.players.filter(p =>
                !state.waitingForOthers[p.id] && p.workersLeft > 0
            );

            if (nonWaitingPlayersWithWorkers.length === 0) {
                // All non-waiting players are out, activate waiting players
                Object.keys(state.waitingForOthers).forEach(playerId => {
                    if (state.waitingForOthers[playerId]) {
                        const waitingPlayer = state.players.find(p => p.id === parseInt(playerId));
                        if (waitingPlayer && waitingPlayer.workersLeft > 0) {
                            waitingPlayersUpdates.push({
                                playerId: parseInt(playerId),
                                workers: waitingPlayer.workersLeft
                            });
                            delete newWaitingForOthers[playerId];
                        }
                    }
                });
            }

            // Find next player considering skips and waiting players
            let nextPlayer;
            let nextDirection = state.turnDirection;
            let attempts = 0;
            const maxAttempts = state.players.length * 2;
            const tempSkippedTurns = { ...effectiveSkippedTurns };
            const skippedPlayers = [];

            console.log('END_TURN: Skip turns state', {
                effectiveSkippedTurns,
                tempSkippedTurns,
                currentPlayer: state.currentPlayer,
                turnOrder: state.turnOrder,
                turnDirection: state.turnDirection
            });

            // Calculate the next player based on snake draft rules
            if (state.turnDirection === 1) {
                if (currentIndex === state.turnOrder.length - 1) {
                    // At the end, reverse direction but stay on same player
                    nextDirection = -1;
                    nextPlayer = state.turnOrder[currentIndex];
                } else {
                    nextPlayer = state.turnOrder[currentIndex + 1];
                }
            } else {
                if (currentIndex === 0) {
                    // At the beginning, reverse direction but stay on same player
                    nextDirection = 1;
                    nextPlayer = state.turnOrder[currentIndex];
                } else {
                    nextPlayer = state.turnOrder[currentIndex - 1];
                }
            }

            // Check for skips, waiting, and workers

            do {
                    attempts++;
                    if (attempts > maxAttempts) break; // Prevent infinite loop

                    // Check if player should skip and track it
                    if (tempSkippedTurns[nextPlayer] > 0) {
                        console.log(`Player ${nextPlayer} should skip turn. Skips remaining: ${tempSkippedTurns[nextPlayer]}`);
                        skippedPlayers.push(nextPlayer);
                        tempSkippedTurns[nextPlayer]--;

                        // Move to next player in turn order
                        const skipIndex = state.turnOrder.indexOf(nextPlayer);

                        // Calculate next player based on current direction
                        if (nextDirection === 1) {
                            if (skipIndex === state.turnOrder.length - 1) {
                                // At end going forward - player would normally get double turn
                                // Skip one turn but keep them as next player for their second turn
                                nextDirection = -1;
                                nextPlayer = state.turnOrder[skipIndex]; // Same player goes again
                            } else {
                                nextPlayer = state.turnOrder[skipIndex + 1];
                            }
                        } else {
                            if (skipIndex === 0) {
                                // At start going backward - player would normally get double turn
                                // Skip one turn but keep them as next player for their second turn
                                nextDirection = 1;
                                nextPlayer = state.turnOrder[skipIndex]; // Same player goes again
                            } else {
                                nextPlayer = state.turnOrder[skipIndex - 1];
                            }
                        }
                        continue;
                    }

                    // Check if player is waiting for others or has no workers
                    const isWaiting = newWaitingForOthers[nextPlayer];
                    const hasWorkers = state.players.find(p => p.id === nextPlayer).workersLeft > 0;

                    if (isWaiting || !hasWorkers) {
                        // Find next player
                        const currentIdx = state.turnOrder.indexOf(nextPlayer);
                        if (nextDirection === 1) {
                            if (currentIdx === state.turnOrder.length - 1) {
                                nextDirection = -1;
                                nextPlayer = state.turnOrder[currentIdx - 1];
                            } else {
                                nextPlayer = state.turnOrder[currentIdx + 1];
                            }
                        } else {
                            if (currentIdx === 0) {
                                nextDirection = 1;
                                nextPlayer = state.turnOrder[currentIdx + 1];
                            } else {
                                nextPlayer = state.turnOrder[currentIdx - 1];
                            }
                        }
                        continue;
                    }

                    // Found a valid player
                    break;

                } while (attempts < maxAttempts);

            // Update skip counts to reflect the skipped players
            const newSkippedTurns = { ...tempSkippedTurns };

            // Debug logging for skip turns
            if (skippedPlayers.length > 0) {
                console.log('Skip turn debug:', {
                    skippedPlayers,
                    currentPlayer: state.currentPlayer,
                    nextPlayer,
                    turnDirection: state.turnDirection,
                    nextDirection,
                    skippedTurns: newSkippedTurns
                });
            }

            // Set workers to place for waiting players who are now active
            const waitingPlayerUpdate = waitingPlayersUpdates.find(u => u.playerId === nextPlayer);
            const nextPlayerData = effectivePlayers.find(p => p.id === nextPlayer);
            const hasActiveWorkerEffect = (nextPlayerData?.effects || []).some(effect =>
                effect.includes('Can place') && effect.includes('more workers this turn')
            );
            // If player has active "play more workers" effect, preserve current workersToPlace
            const workersToPlace = waitingPlayerUpdate ? waitingPlayerUpdate.workers :
                                 (hasActiveWorkerEffect ? state.workersToPlace : 1);

            // Check if all players are out of workers (excluding waiting players)
            const totalWorkersRemaining = effectivePlayers.reduce((sum, p) => {
                if (newWaitingForOthers[p.id]) return sum; // Don't count waiting players
                return sum + p.workersLeft;
            }, 0);

            // Check if game should end (Round 3, no workers left, no extra turns)
            if (totalWorkersRemaining === 0 && state.round === 3) {
                // Check if any player has extra turns
                const anyExtraTurns = effectivePlayers.some(p =>
                    (p.extraTurns || 0) > 0 ||
                    (p.effects || []).some(effect => effect.includes('Will take an extra turn after this one'))
                );

                if (!anyExtraTurns) {
                    // Calculate final automatic VPs before ending game
                    const vpMessages = [];
                    const finalPlayers = effectivePlayers.map(player => {
                        let vpGained = 0;
                        const newVpSources = { ...player.vpSources };

                        // Yellow automatic VP - 1 VP per different color resource (only if Yellow is in game)
                        if (state.gameLayers && state.gameLayers.yellow) {
                            const differentColors = Object.entries(player.resources)
                                .filter(([color, amount]) => amount > 0)
                                .length;

                            if (differentColors > 0) {
                                vpGained += differentColors;
                                newVpSources.yellowDiversity = (player.vpSources?.yellowDiversity || 0) + differentColors;
                                vpMessages.push(`Player ${player.id}: +${differentColors} VP for ${differentColors} different color resources`);
                            }
                        }

                        // Gold automatic VP - 1 VP per gold resource (only if Gold is in game)
                        if (state.gameLayers && state.gameLayers.gold) {
                            const goldAmount = player.resources.gold || 0;
                            if (goldAmount > 0) {
                                vpGained += goldAmount;
                                newVpSources.goldAutomatic = (player.vpSources?.goldAutomatic || 0) + goldAmount;
                                vpMessages.push(`Player ${player.id}: +${goldAmount} VP for ${goldAmount} gold resources`);
                            }
                        }

                        if (vpGained > 0) {
                            return {
                                ...player,
                                victoryPoints: player.victoryPoints + vpGained,
                                vpSources: newVpSources
                            };
                        }
                        return player;
                    });

                    // End the game
                    return {
                        ...state,
                        players: finalPlayers,
                        gameOver: true,
                        actionLog: [...state.actionLog.slice(-9), ...vpMessages, 'Game Over! All players are out of workers.']
                    };
                }
                // If someone has extra turns, continue playing
            }

            // If no workers remaining and round < 3, flag for automatic round advance
            // This will trigger the round transition modal in the UI
            if (totalWorkersRemaining === 0 && state.round < 3 && !state.pendingRoundAdvance) {
                return {
                    ...state,
                    pendingRoundAdvance: true, // Flag to show round transition modal
                    lastUpdatedBy: state.myPlayerId,
                    actionLog: [
                        ...state.actionLog.slice(-9),
                        ...extraTurnLogMessages,
                        ...purpleVPUpdates.map(u => `Player ${u.playerId}: +${u.vp} VP (${u.reason})`),
                        ...waitingPlayersUpdates.map(u => `Player ${u.playerId}: Can now play all ${u.workers} workers!`),
                        `Round complete! All players are out of patrons.`
                    ].filter(Boolean)
                };
            }

            // Normal turn end (no auto-advance)
            return {
                ...state,
                currentPlayer: nextPlayer,
                turnDirection: nextDirection,
                workerPlacedThisTurn: false,
                workersToPlace: workersToPlace,
                shopUsedAfterWorkers: false,
                vpShopUsed: false,
                skippedTurns: newSkippedTurns,
                waitingForOthers: newWaitingForOthers,
                playersOutOfWorkers: newPlayersOutOfWorkers,
                players: effectivePlayers,
                lastUpdatedBy: state.myPlayerId,
                actionLog: [
                    ...state.actionLog.slice(-9),
                    ...extraTurnLogMessages,
                    ...purpleVPUpdates.map(u => `Player ${u.playerId}: +${u.vp} VP (${u.reason})`),
                    ...waitingPlayersUpdates.map(u => `Player ${u.playerId}: Can now play all ${u.workers} workers!`),
                    ...skippedPlayers.map(playerId => `Player ${playerId}: Turn skipped (${tempSkippedTurns[playerId]} skips remaining)`)
                ].filter(Boolean)
            };

        case 'ADVANCE_ROUND':
            // Prevent advancing beyond round 3
            if (state.round >= 3) {
                console.log('ADVANCE_ROUND: Already at round 3, ignoring');
                return state;
            }

            console.log('ADVANCE_ROUND reducer called, current state:', {
                round: state.round,
                occupiedSpaces: state.occupiedSpaces,
                players: state.players.map(p => ({ id: p.id, workersLeft: p.workersLeft }))
            });

            // Calculate automatic VPs before advancing round
            const vpMessages = [];
            const playersWithAutomaticVP = state.players.map(player => {
                let vpGained = 0;
                const newVpSources = { ...player.vpSources };

                // Yellow automatic VP - 1 VP per different color resource (only if Yellow is in game)
                if (state.gameLayers && state.gameLayers.yellow) {
                    const differentColors = Object.entries(player.resources)
                        .filter(([color, amount]) => amount > 0)
                        .length;

                    if (differentColors > 0) {
                        vpGained += differentColors;
                        newVpSources.yellowDiversity = (player.vpSources?.yellowDiversity || 0) + differentColors;
                        vpMessages.push(`Player ${player.id}: +${differentColors} VP for ${differentColors} different color resources`);
                    }
                }

                // Gold automatic VP - 1 VP per gold resource (only if Gold is in game)
                if (state.gameLayers && state.gameLayers.gold) {
                    const goldAmount = player.resources.gold || 0;
                    if (goldAmount > 0) {
                        vpGained += goldAmount;
                        newVpSources.goldAutomatic = (player.vpSources?.goldAutomatic || 0) + goldAmount;
                        vpMessages.push(`Player ${player.id}: +${goldAmount} VP for ${goldAmount} gold resources`);
                    }
                }

                if (vpGained > 0) {
                    return {
                        ...player,
                        victoryPoints: player.victoryPoints + vpGained,
                        vpSources: newVpSources
                    };
                }
                return player;
            });

            // SILVER automatic VP - Player(s) with most VP get 3 Silver, others get 2 VP (only if Silver is in game)
            let playersAfterSilverAuto = playersWithAutomaticVP;
            if (state.gameLayers && state.gameLayers.silver) {
                let maxVP = Math.max(...playersWithAutomaticVP.map(p => p.victoryPoints));
                const playersWithMostVP = playersWithAutomaticVP.filter(p => p.victoryPoints === maxVP);
                const playersWithMostVPIds = playersWithMostVP.map(p => p.id);

                playersAfterSilverAuto = playersWithAutomaticVP.map(player => {
                if (playersWithMostVPIds.includes(player.id)) {
                    // Players with most VP get 3 Silver
                    vpMessages.push(`Player ${player.id}: +3 Silver (most VP)`);
                    return {
                        ...player,
                        resources: {
                            ...player.resources,
                            silver: (player.resources.silver || 0) + 3
                        }
                    };
                } else {
                    // Other players get 2 VP
                    vpMessages.push(`Player ${player.id}: +2 VP (Silver automatic)`);
                    return {
                        ...player,
                        victoryPoints: player.victoryPoints + 2,
                        vpSources: {
                            ...player.vpSources,
                            silverAutomatic: (player.vpSources?.silverAutomatic || 0) + 2
                        }
                    };
                }
                });
            }

            // Open shops for the new round
            const newRound = state.round + 1;
            const updatedClosedShops = { ...state.closedShops };

            // Only open shops for colors that are in the game
            const activeColors = state.gameLayers ? Object.keys(state.gameLayers) : [];

            // Remove shops for the new round from closedShops (making them available)
            activeColors.forEach(color => {
                const shopKey = `${color}${newRound}`;
                console.log(`Opening shop ${shopKey} for round ${newRound}`);
                delete updatedClosedShops[shopKey];
            });

            // Sort players by VP (lowest to highest) for turn order
            const playersByVP = [...playersAfterSilverAuto].sort((a, b) => a.victoryPoints - b.victoryPoints);
            const newTurnOrder = playersByVP.map(p => p.id);

            // Check if game is over after round 3
            const gameOver = newRound > 3;

            if (gameOver) {
                console.log('ADVANCE_ROUND: Game is over! Setting gameOver to true');
            }

            const newState = {
                ...state,
                round: newRound,
                gameOver: gameOver,
                closedShops: updatedClosedShops,
                players: playersAfterSilverAuto.map(player => {
                    const baseWorkers = 3 + (state.round + 1);
                    const hasExtraWorkers = (player.effects || []).some(effect =>
                        effect.includes('Will get 2 extra workers next round')
                    );
                    const extraWorkers = hasExtraWorkers ? 2 : 0;

                    return {
                        ...player,
                        workersLeft: baseWorkers + extraWorkers,
                        effects: (player.effects || []).filter(effect =>
                            !effect.includes('Will get 2 extra workers next round') &&
                            !effect.includes('more workers this turn')
                        ),
                        shopCostModifier: 0 // Reset each player's shop cost modifier
                    };
                }),
                occupiedSpaces: {},
                turnOrder: newTurnOrder,
                currentPlayer: newTurnOrder[0],
                turnDirection: 1,
                workerPlacedThisTurn: false,
                workersToPlace: 1,
                shopUsedAfterWorkers: false, // Reset shop usage for new round
                vpShopUsed: false, // Reset VP shop usage for new round
                playersOutOfWorkers: [], // Reset for new round
                skippedTurns: {}, // Reset skip turns
                waitingForOthers: {}, // Reset waiting status
                roundActions: [], // Reset actions for new round
                roundAdvancing: false, // Reset flag after round advance
                pendingRoundAdvance: false, // Clear auto-advance flag
                lastUpdatedBy: state.myPlayerId,
                actionLog: [...state.actionLog.slice(-9), ...vpMessages, `Round ${state.round + 1} started! Extra workers applied.`]
            };

            console.log('ADVANCE_ROUND - New state:', {
                round: newState.round,
                occupiedSpaces: newState.occupiedSpaces,
                players: newState.players.map(p => ({ id: p.id, workersLeft: p.workersLeft })),
                turnOrder: newState.turnOrder,
                currentPlayer: newState.currentPlayer
            });

            return newState;

        case 'ADD_LOG':
            return {
                ...state,
                actionLog: [...state.actionLog.slice(-9), action.message] // Keep last 10 messages
            };

        case 'ADD_NOTIFICATION':
            // Only add notifications in multiplayer for actions by other players
            if (!state.roomCode || !action.notification) {
                return state;
            }
            return {
                ...state,
                notifications: [...state.notifications, {
                    id: Date.now(),
                    ...action.notification,
                    timestamp: Date.now()
                }].slice(-5) // Keep only last 5 notifications
            };

        case 'CLEAR_NOTIFICATION':
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.id)
            };

        case 'RESET_GAME':
            // Preserve player emojis on reset
            const newEmojis = getRandomPlayerEmojis(4);
            return {
                ...initialState,
                players: initialState.players.map((player, index) => ({
                    ...player,
                    emoji: action.preserveEmojis && state.players[index] ? state.players[index].emoji : newEmojis[index]
                }))
            };

        case 'SHOW_MODAL':
            // If showing a modal to another player, set waiting state
            const isWaitingForOther = action.modal?.targetPlayerId &&
                action.modal.targetPlayerId !== state.myPlayerId &&
                state.myPlayerId === state.currentPlayer;

            return {
                ...state,
                modal: action.modal,
                waitingForPlayer: isWaitingForOther ? action.modal.targetPlayerId : null
            };

        case 'HIDE_MODAL':
            return {
                ...state,
                modal: null,
                waitingForPlayer: null
            };

        case 'UNDO_LAST_WORKER':
            // Remove the last placed worker from the action space
            const undoOccupiedSpaces = { ...state.occupiedSpaces };
            delete undoOccupiedSpaces[action.actionId];

            return {
                ...state,
                occupiedSpaces: undoOccupiedSpaces,
                players: state.players.map(player =>
                    player.id === action.playerId
                        ? { ...player, workersLeft: player.workersLeft + 1 }
                        : player
                ),
                workerPlacedThisTurn: false,
                workersToPlace: state.workersToPlace + 1 // Removed cap - preserve "play more workers" effect
            };

        case 'UPDATE_OCCUPIED_SPACES':
            return {
                ...state,
                occupiedSpaces: action.occupiedSpaces,
                lastUpdatedBy: state.myPlayerId
            };

        case 'SET_TURN_ORDER':
            return {
                ...state,
                turnOrder: action.turnOrder
            };

        case 'CLOSE_SHOP':
            console.log('CLOSE_SHOP action:', action.shopId);
            return {
                ...state,
                closedShops: {
                    ...state.closedShops,
                    [action.shopId]: true
                },
                lastUpdatedBy: state.myPlayerId
            };

        case 'OPEN_SHOP':
            // Remove the shop from closedShops (or set to false)
            console.log('OPEN_SHOP action:', action.shopId);
            const newClosedShops = { ...state.closedShops };
            delete newClosedShops[action.shopId];
            return {
                ...state,
                closedShops: newClosedShops,
                lastUpdatedBy: state.myPlayerId
            };

        case 'FLIP_ALL_SHOPS':
            const flippedShops = {};
            // Flip all regular shops from active game layers only
            const colors = state.gameLayers ? Object.keys(state.gameLayers) : ['red', 'yellow', 'blue', 'purple'];
            const rounds = [1, 2, 3];
            colors.forEach(color => {
                rounds.forEach(round => {
                    const shopId = `${color}${round}`;
                    flippedShops[shopId] = !state.closedShops[shopId];
                });
                // Also flip victory shops
                const vpShopId = `${color}vp`;
                flippedShops[vpShopId] = !state.closedShops[vpShopId];
            });

            // Add notification if in multiplayer
            if (state.roomCode && action.playerId && action.playerId !== state.myPlayerId) {
                const newState = {
                    ...state,
                    closedShops: flippedShops,
                    notifications: [...state.notifications, {
                        id: Date.now(),
                        type: 'shop_toggle',
                        icon: '🔵',
                        title: 'All Shops Toggled!',
                        message: `${action.playerName || `Player ${action.playerId}`} flipped all shop statuses`,
                        timestamp: Date.now()
                    }].slice(-5),
                    lastUpdatedBy: state.myPlayerId
                };
                return newState;
            }

            return {
                ...state,
                closedShops: flippedShops,
                lastUpdatedBy: state.myPlayerId
            };

        case 'ADD_SHOP_COST_MODIFIER':
            return {
                ...state,
                players: state.players.map(player =>
                    player.id === action.playerId
                        ? { ...player, shopCostModifier: (player.shopCostModifier || 0) + action.modifier }
                        : player
                )
            };

        case 'USE_SHOP':
            // Mark that shop was used after placing all workers
            return {
                ...state,
                shopUsedAfterWorkers: true,
                lastUpdatedBy: state.myPlayerId
            };

        case 'USE_VP_SHOP':
            // Mark that VP shop was used this turn
            return {
                ...state,
                vpShopUsed: true,
                lastUpdatedBy: state.myPlayerId
            };


        // Multiplayer actions
        case 'SET_ROOM_INFO':
            return {
                ...state,
                roomCode: action.roomCode,
                isHost: action.isHost
            };

        case 'SET_MY_PLAYER_INFO':
            return {
                ...state,
                myPlayerId: action.playerId,
                myPlayerName: action.playerName
            };

        case 'UPDATE_CONNECTED_PLAYERS':
            return {
                ...state,
                connectedPlayers: action.connectedPlayers
            };

        case 'START_GAME':
            // Initialize future round shops as closed
            const initialClosedShops = {};
            const gameColors = state.gameLayers ? Object.keys(state.gameLayers) : ['red', 'yellow', 'blue', 'black'];
            // Always start at round 1 for new games
            const currentRound = 1;

            gameColors.forEach(color => {
                // Close shops from future rounds (R2, R3 only - VP shops start open!)
                initialClosedShops[`${color}2`] = true;
                initialClosedShops[`${color}3`] = true;
                // VP shops start OPEN, not closed!
            });

            // WHITE AUTOMATIC VP: If white is in play, all players start with 5 VP
            let playersWithInitialVP = state.players;
            if (state.gameLayers && state.gameLayers.white) {
                playersWithInitialVP = state.players.map(player => ({
                    ...player,
                    victoryPoints: player.victoryPoints + 5,
                    vpSources: {
                        ...player.vpSources,
                        whiteStarting: 5
                    }
                }));
            }

            // Randomize turn order at game start
            const shuffledTurnOrder = [...state.turnOrder];
            for (let i = shuffledTurnOrder.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledTurnOrder[i], shuffledTurnOrder[j]] = [shuffledTurnOrder[j], shuffledTurnOrder[i]];
            }

            return {
                ...state,
                gameStarted: true,
                closedShops: initialClosedShops,
                players: playersWithInitialVP,
                turnOrder: shuffledTurnOrder,
                currentPlayer: shuffledTurnOrder[0]
            };

        case 'SET_GAME_LAYERS':
            // Set automatic VPs based on which layers are active
            const automaticVPs = {};
            if (action.layers.blue) {
                automaticVPs.blue = true;
            }
            return {
                ...state,
                gameLayers: action.layers,
                automaticVPs: automaticVPs
            };

        case 'SET_GAME_MODE':
            return {
                ...state,
                gameMode: action.mode
            };

        case 'UPDATE_CONNECTION_STATUS':
            return {
                ...state,
                connectionStatus: action.status
            };

        case 'SET_SKIPPED_TURNS':
            return {
                ...state,
                skippedTurns: action.skippedTurns
            };

        case 'SET_WAITING_FOR_OTHERS':
            return {
                ...state,
                waitingForOthers: action.waitingForOthers
            };

        case 'REMOVE_WORKER':
            const removedWorkerSpaces = { ...state.occupiedSpaces };
            delete removedWorkerSpaces[action.actionId];
            return {
                ...state,
                occupiedSpaces: removedWorkerSpaces,
                players: state.players.map(player =>
                    player.id === action.playerId
                        ? { ...player, workersLeft: player.workersLeft + 1 }
                        : player
                )
            };

        case 'CLEAR_SYNC_FLAG':
            return {
                ...state,
                justSyncedFromFirebase: false
            };

        case 'SYNC_GAME_STATE':
            console.log('SYNC_GAME_STATE reducer called with:', {
                round: action.gameState.round,
                currentPlayer: action.gameState.currentPlayer,
                myPlayerId: state.myPlayerId,
                gameStarted: action.gameState.gameStarted,
                gameLayers: action.gameState.gameLayers ? Object.keys(action.gameState.gameLayers) : null,
                occupiedSpaces: action.gameState.occupiedSpaces,
                closedShops: action.gameState.closedShops,
                players: action.gameState.players?.map(p => ({
                    id: p.id,
                    resources: p.resources,
                    workersLeft: p.workersLeft
                }))
            });

            // Log the actual resources being received
            if (action.gameState.players) {
                console.log('SYNC_GAME_STATE - Player 1 resources from Firebase:',
                    action.gameState.players.find(p => p.id === 1)?.resources);
                console.log('SYNC_GAME_STATE - All players from Firebase:', action.gameState.players);
            }

            // Only accept updates from other players
            console.log('SYNC_GAME_STATE - Echo detection:', {
                lastUpdatedBy: action.gameState.lastUpdatedBy,
                myPlayerId: state.myPlayerId,
                isOurUpdate: action.gameState.lastUpdatedBy === state.myPlayerId
            });

            if (action.gameState.lastUpdatedBy &&
                state.myPlayerId &&
                action.gameState.lastUpdatedBy === state.myPlayerId) {
                console.log('SYNC_GAME_STATE - Ignoring our own update echo');
                return state;
            }

            // Merge remote game state while preserving local multiplayer state
            const mergedState = {
                ...state,
                ...action.gameState,
                syncingFromFirebase: true,
                // Handle undefined occupiedSpaces from Firebase
                occupiedSpaces: action.gameState.occupiedSpaces || {},
                // Ensure all players have effects array and emoji
                players: action.gameState.players ? action.gameState.players.map(player => ({
                    ...player,
                    effects: player.effects || [],
                    emoji: player.emoji || initialPlayerEmojis[player.id - 1] || '🎮',
                    resources: player.resources || {
                        red: 0, yellow: 0, blue: 0, purple: 0,
                        gold: 0, white: 0, black: 0, silver: 0
                    },
                    vpSources: player.vpSources || {},
                    shopCostModifier: player.shopCostModifier !== undefined ? player.shopCostModifier : 0,
                    isAI: player.isAI !== undefined ? player.isAI : false,
                    aiDifficulty: player.aiDifficulty !== undefined ? player.aiDifficulty : null
                })) : state.players,
                roomCode: state.roomCode,
                myPlayerId: state.myPlayerId,
                myPlayerName: state.myPlayerName,
                connectedPlayers: state.connectedPlayers,
                isHost: state.isHost,
                gameStarted: action.gameState.gameStarted !== undefined ? action.gameState.gameStarted : state.gameStarted,
                connectionStatus: state.connectionStatus,
                // Sync game layers if provided
                gameLayers: action.gameState.gameLayers || state.gameLayers,
                // Sync shop state
                closedShops: action.gameState.closedShops || state.closedShops,
                // Preserve automatic VPs from synced state or current state
                automaticVPs: action.gameState.automaticVPs || state.automaticVPs,
                // Sync pending placements
                pendingPlacements: action.gameState.pendingPlacements || {},
                // Track sync timestamp to handle race conditions
                lastSyncTimestamp: action.gameState.timestamp || Date.now(),
                // Mark that we just synced to prevent immediate re-sync
                justSyncedFromFirebase: true
            };

            console.log('🔄 SYNC_GAME_STATE - After merge, new state:', {
                myPlayerId: mergedState.myPlayerId,
                currentPlayer: mergedState.currentPlayer,
                turnMatch: mergedState.myPlayerId === mergedState.currentPlayer,
                round: mergedState.round,
                gameOver: mergedState.gameOver,
                occupiedSpaces: mergedState.occupiedSpaces,
                players: mergedState.players?.map(p => ({
                    id: p.id,
                    name: p.name,
                    emoji: p.emoji,
                    resources: p.resources,
                    workersLeft: p.workersLeft
                }))
            });

            return mergedState;

        case 'SET_PENDING_PLACEMENT':
            return {
                ...state,
                pendingPlacements: {
                    ...state.pendingPlacements,
                    [action.actionId]: action.playerId
                }
            };

        case 'CLEAR_PENDING_PLACEMENT':
            const newPendingPlacements = { ...state.pendingPlacements };
            delete newPendingPlacements[action.actionId];
            return {
                ...state,
                pendingPlacements: newPendingPlacements
            };

        case 'SET_PLAYER_AI':
            console.log('[SET_PLAYER_AI] Setting player', action.playerId, 'as AI:', action.isAI, 'difficulty:', action.aiDifficulty);
            const updatedPlayers = state.players.map(player =>
                player.id === action.playerId
                    ? {
                        ...player,
                        isAI: action.isAI,
                        aiDifficulty: action.aiDifficulty
                    }
                    : player
            );
            console.log('[SET_PLAYER_AI] Updated players:', updatedPlayers.map(p => ({ id: p.id, isAI: p.isAI, difficulty: p.aiDifficulty })));
            return {
                ...state,
                players: updatedPlayers
            };

        case 'SET_PLAYER_NAME':
            return {
                ...state,
                players: state.players.map(player =>
                    player.id === action.playerId
                        ? { ...player, name: action.name }
                        : player
                )
            };

        default:
            return state;
    }
    })();

    if (newState !== state) {
        console.log('Reducer returning new state for action:', action.type);
    }
    return newState;
}
