// Shop benefit resolver — handles all shop effects.
// Pure functions: (state, playerId, shopColor, shopRound, decisions) → { state, log, pendingDecision? }

import {
    getPlayer, getOtherPlayers, addResources, addVP, addEffect,
    applyDoubleEffect, formatPlayerName,
    createResult, createDecisionRequest,
    updatePlayer, addWorkersToPlace, addSkippedTurn, totalResources,
    setOccupiedSpaces
} from '../stateHelpers.js';
import { getActionTitle, getRepeatableActions } from '../rules.js';
import { calculateYellowShopAutoVP } from '../scoring.js';

/**
 * Resolve a shop benefit.
 * @param {Object} state - Game state
 * @param {number} playerId - Player using the shop
 * @param {string} shopColor - Color of the shop (red, yellow, etc.)
 * @param {number|string} shopRound - Round of the shop (1, 2, 3, or 'vp')
 * @param {Object} decisions - Pre-supplied decisions
 * @returns {{ state, log, pendingDecision? }}
 */
export function resolveShop(state, playerId, shopColor, shopRound, decisions) {
    const shopId = `${shopColor}${shopRound}`;
    const player = getPlayer(state, playerId);

    switch (shopId) {
        // === RED SHOPS ===
        case 'red1': {
            // Repeat one of your patron's Round 1 actions
            const repeatableActions = getRepeatableActions(state, playerId, [
                'redRepeatAction', 'blueR1ShopBenefit', 'blueAnyShopBenefit', 'purpleShopHybrid'
            ]).filter(spaceId => {
                // Only R1 actions
                for (const layer of Object.values(state.gameLayers || {})) {
                    const action = layer.actions?.find(a => a.id === spaceId);
                    if (action) return action.round === 1;
                }
                return false;
            });

            if (repeatableActions.length === 0) {
                return createResult(state, [`${formatPlayerName(player)}: Red R1 shop → No valid Round 1 workers to repeat`]);
            }

            if (!decisions?.actionChoice) {
                const options = repeatableActions.map(spaceId => ({
                    label: `Repeat: ${getActionTitle(spaceId, state.gameLayers)}`,
                    value: spaceId
                }));
                return createDecisionRequest(state, {
                    type: 'actionChoice',
                    title: 'Choose an action to repeat',
                    options
                });
            }

            return {
                state,
                log: [`${formatPlayerName(player)}: Red R1 shop → Repeating ${getActionTitle(decisions.actionChoice, state.gameLayers)}`],
                executeAction: { actionId: decisions.actionChoice, playerId, recursionDepth: 1 }
            };
        }

        case 'red2': {
            // Place the next player's patron — too complex for pure sync without UI
            // Return a decision request for the caller to handle
            if (!decisions?.actionChoice) {
                return createDecisionRequest(state, {
                    type: 'red2Placement',
                    title: "Choose where to place the next player's patron"
                });
            }
            // Handled externally
            return createResult(state, [`${formatPlayerName(player)}: Red R2 shop executed`]);
        }

        case 'red3': {
            // Repeat all actions by chosen player
            if (!decisions?.targetPlayer) {
                return createDecisionRequest(state, {
                    type: 'targetPlayer',
                    title: "Choose a player to repeat all their actions",
                    excludePlayer: playerId
                });
            }
            // Returns executeActions for the caller
            const targetActions = Object.entries(state.occupiedSpaces)
                .filter(([_, pid]) => pid === decisions.targetPlayer)
                .map(([spaceId]) => spaceId);

            return {
                state,
                log: [`${formatPlayerName(player)}: Red R3 shop → Repeating ${targetActions.length} actions`],
                executeActions: targetActions.map(actionId => ({ actionId, playerId, recursionDepth: 1 }))
            };
        }

        // === YELLOW SHOPS ===
        case 'yellow1': {
            state = addEffect(state, playerId, 'Next gain will be doubled');
            return createResult(state, [`${formatPlayerName(player)}: Yellow R1 shop → Next gain will be doubled`]);
        }

        case 'yellow2': {
            const completeSets = calculateYellowShopAutoVP(state, playerId);
            if (completeSets > 0) {
                state = addVP(state, playerId, completeSets, 'yellowAutoVP');
            }
            const colors = Object.keys(state.gameLayers || {}).length;
            return createResult(state, [`${formatPlayerName(player)}: Yellow R2 shop → +${completeSets} VP (${completeSets} complete sets of ${colors} colors)`]);
        }

        case 'yellow3': {
            if (!decisions?.gemSelection) {
                return createDecisionRequest(state, {
                    type: 'gemSelection',
                    title: 'Choose 10 gems of any color',
                    maxGems: 10
                });
            }
            let resources = { ...decisions.gemSelection };
            const doubleResult = applyDoubleEffect(state, playerId, resources);
            state = doubleResult.state;
            resources = doubleResult.resources;

            state = addResources(state, playerId, resources);
            const total = Object.values(resources).reduce((s, a) => s + a, 0);
            const suffix = doubleResult.wasDoubled ? ' (DOUBLED!)' : '';
            return createResult(state, [`${formatPlayerName(player)}: Yellow R3 shop → Gained ${total} gems${suffix}`]);
        }

        // === BLUE SHOPS ===
        case 'blue1': {
            if (!decisions?.shopToggle) {
                return createDecisionRequest(state, {
                    type: 'shopToggle',
                    title: 'Choose a shop to toggle (Closed/Open)',
                    closedShops: state.closedShops
                });
            }
            const isCurrentlyClosed = state.closedShops[decisions.shopToggle];
            if (isCurrentlyClosed) {
                const newClosed = { ...state.closedShops };
                delete newClosed[decisions.shopToggle];
                state = { ...state, closedShops: newClosed };
                return createResult(state, [`${formatPlayerName(player)}: Opened ${decisions.shopToggle} shop`]);
            } else {
                state = { ...state, closedShops: { ...state.closedShops, [decisions.shopToggle]: true } };
                return createResult(state, [`${formatPlayerName(player)}: Closed ${decisions.shopToggle} shop`]);
            }
        }

        case 'blue2': {
            // Flip all shops
            const flippedShops = {};
            const colors = Object.keys(state.gameLayers || {});
            colors.forEach(color => {
                [1, 2, 3].forEach(round => {
                    const sid = `${color}${round}`;
                    flippedShops[sid] = !state.closedShops[sid];
                });
                flippedShops[`${color}vp`] = !state.closedShops[`${color}vp`];
            });
            state = { ...state, closedShops: flippedShops };
            return createResult(state, [`${formatPlayerName(player)}: Blue R2 shop → All shops toggled!`]);
        }

        case 'blue3': {
            // Use any shop benefit — delegates back to this resolver
            if (!decisions?.shopChoice) {
                const colors = Object.keys(state.gameLayers || {});
                const options = [];
                colors.forEach(color => {
                    options.push({ color, round: 1 });
                    options.push({ color, round: 2 });
                    if (color !== 'blue') options.push({ color, round: 3 });
                    options.push({ color, round: 'vp' });
                });
                return createDecisionRequest(state, {
                    type: 'shopChoice',
                    title: 'Choose any shop benefit (ignores closed status)',
                    options
                });
            }
            // Recursive resolution
            return resolveShop(state, playerId, decisions.shopChoice.color, decisions.shopChoice.round, decisions.innerDecisions);
        }

        // === PURPLE SHOPS ===
        case 'purple1': {
            state = addEffect(state, playerId, 'Will take an extra turn after this one');
            state = updatePlayer(state, playerId, { extraTurns: (player.extraTurns || 0) + 1 });
            return createResult(state, [`${formatPlayerName(player)}: Purple R1 shop → Will take an extra turn after this one`]);
        }

        case 'purple2': {
            const workersToAdd = Math.min(2, player.workersLeft);
            if (workersToAdd === 0) {
                return createResult(state, [`${formatPlayerName(player)}: Purple R2 shop → No patrons left to place`]);
            }
            state = addWorkersToPlace(state, workersToAdd);
            state = addEffect(state, playerId, `Can place ${workersToAdd} more patron${workersToAdd > 1 ? 's' : ''} this turn`);
            return createResult(state, [`${formatPlayerName(player)}: Can place ${workersToAdd} more patron${workersToAdd > 1 ? 's' : ''} this turn!`]);
        }

        case 'purple3': {
            const remaining = player.workersLeft;
            if (remaining > 0) {
                state = addWorkersToPlace(state, remaining);
                state = addEffect(state, playerId, `Can place ${remaining} more patrons this turn`);
            }
            return createResult(state, [`${formatPlayerName(player)}: Can place all ${remaining} remaining patrons!`]);
        }

        // === GOLD SHOPS ===
        case 'gold1': {
            // 1 Gold + 1 Any → 2 Gold
            if (player.resources.gold < 1 || totalResources(player) < 2) {
                return createResult(state, [`${formatPlayerName(player)}: Gold R1 shop → Need 1 gold + 1 resource`]);
            }
            if (!decisions?.gemSelection) {
                return createDecisionRequest(state, {
                    type: 'gemSelection',
                    title: 'Choose 1 resource to pay',
                    maxGems: 1,
                    fromPlayer: playerId
                });
            }
            // Pay costs
            const cost = { gold: -1 };
            Object.entries(decisions.gemSelection).forEach(([color, amt]) => {
                cost[color] = (cost[color] || 0) - amt;
            });
            state = addResources(state, playerId, cost);
            // Gain with doubling
            let goldGain = 2;
            const dr = applyDoubleEffect(state, playerId, { gold: goldGain });
            state = dr.state;
            goldGain = dr.resources.gold;
            state = addResources(state, playerId, { gold: goldGain });
            return createResult(state, [`${formatPlayerName(player)}: Gold R1 shop → Gained ${goldGain} gold${dr.wasDoubled ? ' (DOUBLED!)' : ''}`]);
        }

        case 'gold2': {
            if (player.resources.gold < 2 || totalResources(player) < 4) {
                return createResult(state, [`${formatPlayerName(player)}: Gold R2 shop → Need 2 gold + 2 resources`]);
            }
            if (!decisions?.gemSelection) {
                return createDecisionRequest(state, {
                    type: 'gemSelection',
                    title: 'Choose 2 resources to pay',
                    maxGems: 2,
                    fromPlayer: playerId
                });
            }
            const cost = { gold: -2 };
            Object.entries(decisions.gemSelection).forEach(([color, amt]) => {
                cost[color] = (cost[color] || 0) - amt;
            });
            state = addResources(state, playerId, cost);
            let goldGain = 4;
            const dr = applyDoubleEffect(state, playerId, { gold: goldGain });
            state = dr.state;
            goldGain = dr.resources.gold;
            state = addResources(state, playerId, { gold: goldGain });
            return createResult(state, [`${formatPlayerName(player)}: Gold R2 shop → Gained ${goldGain} gold${dr.wasDoubled ? ' (DOUBLED!)' : ''}`]);
        }

        case 'gold3': {
            const goldAmount = player.resources.gold || 0;
            if (goldAmount < 3 || totalResources(player) < 6) {
                return createResult(state, [`${formatPlayerName(player)}: Gold R3 shop → Need 3 gold + 3 resources`]);
            }
            if (!decisions?.gemSelection) {
                return createDecisionRequest(state, {
                    type: 'gemSelection',
                    title: 'Choose 3 resources to pay',
                    maxGems: 3,
                    fromPlayer: playerId
                });
            }
            const cost = { gold: -3 };
            Object.entries(decisions.gemSelection).forEach(([color, amt]) => {
                cost[color] = (cost[color] || 0) - amt;
            });
            state = addResources(state, playerId, cost);
            let goldGain = goldAmount * 2;
            const dr = applyDoubleEffect(state, playerId, { gold: goldGain });
            state = dr.state;
            goldGain = dr.resources.gold;
            state = addResources(state, playerId, { gold: goldGain });
            return createResult(state, [`${formatPlayerName(player)}: Gold R3 shop → Doubled gold${dr.wasDoubled ? ' (DOUBLE DOUBLED!)' : ''}`]);
        }

        // === WHITE SHOPS ===
        case 'white1': {
            if (player.victoryPoints < 1) {
                return createResult(state, [`${formatPlayerName(player)}: White R1 shop → Need at least 1 VP`]);
            }
            state = addVP(state, playerId, -1, 'whiteShop');
            let gemsToGain = 1;
            const dr = applyDoubleEffect(state, playerId, { _count: gemsToGain });
            state = dr.state;
            if (dr.wasDoubled) gemsToGain *= 2;
            if (!decisions?.gemSelection) {
                return createDecisionRequest(state, {
                    type: 'gemSelection',
                    title: `Choose ${gemsToGain} gem${gemsToGain > 1 ? 's' : ''} to gain`,
                    maxGems: gemsToGain
                });
            }
            state = addResources(state, playerId, decisions.gemSelection);
            return createResult(state, [`${formatPlayerName(player)}: White R1 shop → -1 VP, gained ${gemsToGain} gem${gemsToGain > 1 ? 's' : ''}${dr.wasDoubled ? ' (DOUBLED!)' : ''}`]);
        }

        case 'white2': {
            if (player.victoryPoints < 3) {
                return createResult(state, [`${formatPlayerName(player)}: White R2 shop → Need at least 3 VP`]);
            }
            state = addVP(state, playerId, -3, 'whiteShop');
            // Skip next player
            const currentIndex = state.turnOrder.indexOf(state.currentPlayer);
            const nextIndex = (currentIndex + state.turnDirection + state.turnOrder.length) % state.turnOrder.length;
            const nextPlayerId = state.turnOrder[nextIndex];
            state = addSkippedTurn(state, nextPlayerId);
            return createResult(state, [`${formatPlayerName(player)}: White R2 shop → -3 VP, Player ${nextPlayerId} will skip next turn`]);
        }

        case 'white3': {
            if (player.victoryPoints < 3) {
                return createResult(state, [`${formatPlayerName(player)}: White R3 shop → Need at least 3 VP`]);
            }
            if (!decisions?.workerMove) {
                return createDecisionRequest(state, {
                    type: 'workerMove',
                    title: 'Choose a worker to move, then choose destination'
                });
            }
            state = addVP(state, playerId, -3, 'whiteShop');
            // Move worker
            const newOccupied = { ...state.occupiedSpaces };
            delete newOccupied[decisions.workerMove.from];
            newOccupied[decisions.workerMove.to] = playerId;
            state = setOccupiedSpaces(state, newOccupied);
            return {
                state,
                log: [`${formatPlayerName(player)}: White R3 shop → -3 VP, moved worker to ${decisions.workerMove.to}`],
                executeAction: { actionId: decisions.workerMove.to, playerId, recursionDepth: 0 }
            };
        }

        // === BLACK SHOPS ===
        case 'black1':
        case 'black2':
        case 'black3': {
            const vpAmounts = { black1: 1, black2: 3, black3: 5 };
            const vpToSteal = vpAmounts[shopId];
            const others = getOtherPlayers(state, playerId);
            if (others.length === 0) {
                return createResult(state, [`${formatPlayerName(player)}: Black R${shopRound} shop → No other players`]);
            }
            if (!decisions?.targetPlayer) {
                return createDecisionRequest(state, {
                    type: 'targetPlayer',
                    title: `Choose a player to steal ${vpToSteal} VP from`,
                    excludePlayer: playerId
                });
            }
            const target = getPlayer(state, decisions.targetPlayer);
            const actualSteal = Math.min(vpToSteal, target.victoryPoints);
            state = addVP(state, decisions.targetPlayer, -actualSteal, 'blackShop');
            state = addVP(state, playerId, actualSteal, 'blackShop');
            // Black automatic VP
            state = addVP(state, playerId, 1, 'blackAutomatic');
            return createResult(state, [
                `${formatPlayerName(player)}: Black R${shopRound} shop → Stole ${actualSteal} VP from ${formatPlayerName(target)}`,
                `${formatPlayerName(player)}: +1 VP (Black automatic: stealing bonus)`
            ]);
        }

        // === SILVER SHOPS ===
        case 'silver1': {
            state = addVP(state, playerId, 2, 'silverShop');
            return createResult(state, [`${formatPlayerName(player)}: Silver R1 shop → +2 VP`]);
        }

        case 'silver2': {
            state = addVP(state, playerId, 4, 'silverShop');
            const others = getOtherPlayers(state, playerId);
            if (others.length === 0) {
                return createResult(state, [`${formatPlayerName(player)}: Silver R2 shop → +4 VP (no other players)`]);
            }
            if (others.length === 1) {
                state = addVP(state, others[0].id, 4, 'silverShop');
                return createResult(state, [`${formatPlayerName(player)}: Silver R2 shop → +4 VP, ${formatPlayerName(others[0])} +4 VP`]);
            }
            if (!decisions?.targetPlayer) {
                return createDecisionRequest(state, {
                    type: 'targetPlayer',
                    title: 'Choose a player to give 4 VP',
                    excludePlayer: playerId
                });
            }
            state = addVP(state, decisions.targetPlayer, 4, 'silverShop');
            const target = getPlayer(state, decisions.targetPlayer);
            return createResult(state, [`${formatPlayerName(player)}: Silver R2 shop → +4 VP, gave ${formatPlayerName(target)} +4 VP`]);
        }

        case 'silver3': {
            let silverAmount = 7;
            const dr = applyDoubleEffect(state, playerId, { silver: silverAmount });
            state = dr.state;
            silverAmount = dr.resources.silver;

            state = addResources(state, playerId, { silver: silverAmount });
            getOtherPlayers(state, playerId).forEach(other => {
                state = addResources(state, other.id, { silver: 2 });
            });
            return createResult(state, [`${formatPlayerName(player)}: Silver R3 shop → +${silverAmount} silver${dr.wasDoubled ? ' (DOUBLED!)' : ''}, others +2 silver`]);
        }

        default:
            return createResult(state, [`Shop benefit ${shopId} not implemented`]);
    }
}
