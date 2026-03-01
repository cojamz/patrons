// Heuristic AI — "not obviously stupid" decision-making for simulation.
// Makes reasonable choices: prefers high-value actions, diversifies resources,
// targets VP leaders, uses shops when affordable.

import { getPlayer, getOtherPlayers, totalResources } from './stateHelpers.js';
import { getActionColor, getAvailableActions } from './rules.js';
import { basicGains, isBasicGain } from './actions/basicActions.js';

/**
 * Score an action for a given player and game state.
 * Higher = more desirable. Used to pick which action to place a worker on.
 */
function scoreAction(state, playerId, actionId) {
    const player = getPlayer(state, playerId);
    const color = getActionColor(actionId, state.gameLayers);
    let score = 0;

    // --- Basic gains: prefer higher amounts, prefer colors we need ---
    if (isBasicGain(actionId)) {
        const gains = basicGains[actionId];
        const [gainColor, gainAmount] = Object.entries(gains)[0];
        score += gainAmount * 2; // Base value from amount

        // Prefer colors we have less of (resource diversification for yellow auto VP)
        if (state.gameLayers?.yellow) {
            const currentAmount = player.resources[gainColor] || 0;
            if (currentAmount === 0) score += 3; // New color = big bonus
            else if (currentAmount < 3) score += 1;
        }

        // Prefer gold when gold layer is active (gold auto VP)
        if (state.gameLayers?.gold && gainColor === 'gold') {
            score += 3;
        }

        // Prefer the layer's own color (for shop purchases later)
        if (color && player.resources[color] < 3) {
            score += 1;
        }

        return score;
    }

    // --- Complex actions: score by type ---

    // VP actions are always good
    if (actionId === 'gain3vp') return 12;
    if (actionId === 'gain2vp') return 9;
    if (actionId === 'gain5VPAnd5Any') return 18;
    if (actionId === 'silver8VPOthers3S') return 14;
    if (actionId === 'silver2VPBoth') return 8;
    if (actionId === 'goldVPPerGold') {
        return 4 + (player.resources.gold || 0) * 2; // Scales with gold owned
    }
    if (actionId === 'redVPFocus') {
        const redWorkers = Object.entries(state.occupiedSpaces)
            .filter(([aid, pid]) => pid === playerId && getActionColor(aid, state.gameLayers) === 'red')
            .length;
        return 4 + redWorkers * 2;
    }

    // Resource selection actions (gain3yellow, etc.) — high value due to flexibility
    if (actionId === 'gain3yellow') return 8;
    if (actionId === 'gain2yellow') return 6;
    if (actionId === 'steal3Gems') return 10; // 4 resources any color
    if (actionId === 'yellowSwapResources') return 14; // 3 of each active color

    // Conversion actions — value depends on having spare resources
    if (actionId.includes('convert')) {
        const nonGold = Object.entries(player.resources)
            .filter(([c]) => c !== 'gold')
            .reduce((sum, [_, amt]) => sum + amt, 0);
        return nonGold >= 3 ? 7 : 2;
    }

    // Steal/aggression — more valuable in close games
    if (actionId === 'blackSteal1VP') return 5;
    if (actionId === 'blackSteal2Any') return 5;
    if (actionId === 'blackStealWorker') return 6;
    if (actionId === 'blackAllLose2VP') {
        return 3 + (state.players.length - 1) * 2; // Scales with player count
    }
    if (actionId === 'blackAllLose4VP') {
        return 5 + (state.players.length - 1) * 3;
    }

    // Silver mutual benefit — generally good
    if (actionId === 'silver4Others1') return 7;
    if (actionId === 'silver3Others1') return 6;
    if (actionId === 'silver2Plus1Others') return 6;
    if (actionId === 'silver3Plus2Others1') return 8;
    if (actionId === 'silverTakeBack2') return 7;

    // Blue shop control — situational
    if (actionId === 'blueR1ShopBenefit') return 6;
    if (actionId === 'blueReduceCosts') return 5;
    if (actionId === 'blueIncreaseCosts') return 5;
    if (actionId === 'blueToggleShops') return 4;
    if (actionId === 'blueAnyShopBenefit') return 9;

    // Purple timing — powerful but risky
    if (actionId === 'playTwoWorkers') return player.workersLeft >= 3 ? 9 : 3;
    if (actionId === 'playThreeWorkers') return player.workersLeft >= 4 ? 11 : 3;
    if (actionId === 'gain4purpleSkip') return 5; // skip is costly
    if (actionId === 'gain5purpleSkip') return 5;
    if (actionId === 'gain2purpleTakeBack') return 6;
    if (actionId === 'gain4purpleWaitAll') return 7;

    // Red repeat/swap — value depends on having good actions to repeat
    if (actionId === 'redRepeatAction') {
        const myActions = Object.entries(state.occupiedSpaces)
            .filter(([_, pid]) => pid === playerId).length;
        return myActions >= 2 ? 8 : 3;
    }
    if (actionId === 'redRepeatAll') {
        const myActions = Object.entries(state.occupiedSpaces)
            .filter(([_, pid]) => pid === playerId).length;
        return myActions >= 3 ? 14 : myActions >= 2 ? 8 : 3;
    }
    if (actionId === 'redHybrid1' || actionId === 'redHybrid2') return 5;

    // Yellow hybrid/steal
    if (actionId === 'yellowHybrid1') return 5;
    if (actionId === 'yellowHybrid2') return 5;
    if (actionId === 'steal2Gems') return totalResources(player) >= 4 ? 6 : 3;

    // Trade VP for resources (usually bad unless you need resources badly)
    if (actionId === 'spend1AnyFor2VP') return totalResources(player) >= 2 ? 7 : 2;
    if (actionId === 'spend2AnyFor3VP') return totalResources(player) >= 3 ? 7 : 2;
    if (actionId === 'lose1VPGain2Any') return player.victoryPoints >= 5 ? 5 : 2;
    if (actionId === 'lose2VPGain4Any') return player.victoryPoints >= 8 ? 5 : 2;

    // Gold skip
    if (actionId === 'gain3goldSkip') return state.gameLayers?.gold ? 6 : 3;

    // Default: mild interest
    return 4;
}

/**
 * Pick the best action from available actions.
 * Adds slight randomness so games aren't completely deterministic.
 */
export function pickAction(state, playerId) {
    const available = getAvailableActions(state);
    if (available.length === 0) return null;

    // Score all actions
    const scored = available.map(actionId => ({
        actionId,
        score: scoreAction(state, playerId, actionId) + Math.random() * 2 // slight noise
    }));

    // Sort by score descending, pick the best
    scored.sort((a, b) => b.score - a.score);
    return scored[0].actionId;
}

/**
 * Heuristic decision function — makes reasonable choices for any decision type.
 */
export function heuristicDecisionFn(state, playerId, pendingDecision) {
    const player = getPlayer(state, playerId);

    switch (pendingDecision.type) {
        case 'gemSelection': {
            const maxGems = pendingDecision.maxGems || 1;

            // If selecting from player's inventory (paying a cost), spend least-needed colors
            if (pendingDecision.fromPlayer) {
                const fromPlayer = getPlayer(state, pendingDecision.fromPlayer);
                const selection = {};
                let remaining = maxGems;

                // Spend colors we have the most of (preserve diversity)
                const availableColors = Object.entries(fromPlayer.resources)
                    .filter(([color, amount]) => amount > 0 && color !== 'gold')
                    .sort((a, b) => b[1] - a[1]); // most first

                for (const [color, amount] of availableColors) {
                    if (remaining <= 0) break;
                    const take = Math.min(amount, remaining);
                    selection[color] = take;
                    remaining -= take;
                }

                return { gemSelection: selection };
            }

            // Free selection — be strategic
            const activeColors = Object.keys(state.gameLayers || {});
            const selection = {};
            let remaining = maxGems;

            if (state.gameLayers?.yellow) {
                // Diversify: pick colors we don't have yet
                const colorsWeNeed = activeColors
                    .filter(c => (player.resources[c] || 0) === 0)
                    .slice(0, remaining);

                for (const color of colorsWeNeed) {
                    selection[color] = 1;
                    remaining--;
                }
            }

            if (state.gameLayers?.gold && remaining > 0) {
                // Hoard gold when gold layer is active
                const goldToAdd = Math.min(remaining, 2);
                selection.gold = (selection.gold || 0) + goldToAdd;
                remaining -= goldToAdd;
            }

            // Fill remaining with the color we have least of (among active)
            while (remaining > 0) {
                const leastColor = activeColors
                    .filter(c => c !== 'gold') // gold handled above
                    .sort((a, b) => (player.resources[a] || 0) - (player.resources[b] || 0))[0];

                if (leastColor) {
                    selection[leastColor] = (selection[leastColor] || 0) + 1;
                } else {
                    // Fallback
                    const fallback = activeColors[0] || 'red';
                    selection[fallback] = (selection[fallback] || 0) + 1;
                }
                remaining--;
            }

            return { gemSelection: selection };
        }

        case 'targetPlayer': {
            const others = state.players.filter(p => p.id !== (pendingDecision.excludePlayer || playerId));
            if (others.length === 0) return {};

            // Target the VP leader (most aggressive, most impactful)
            const sorted = [...others].sort((a, b) => b.victoryPoints - a.victoryPoints);
            return { targetPlayer: sorted[0].id };
        }

        case 'actionChoice': {
            if (!pendingDecision.options || pendingDecision.options.length === 0) return {};

            // Score each option using the action scorer
            const scored = pendingDecision.options.map(opt => {
                const actionId = opt.value || opt;
                return {
                    option: opt,
                    score: scoreAction(state, playerId, actionId) + Math.random()
                };
            });
            scored.sort((a, b) => b.score - a.score);

            return { actionChoice: scored[0].option.value || scored[0].option };
        }

        case 'actionOrder': {
            // Order by score — best action first
            const remaining = [...(pendingDecision.remainingActions || [])];
            remaining.sort((a, b) =>
                scoreAction(state, playerId, b) - scoreAction(state, playerId, a)
            );
            return { actionOrder: remaining };
        }

        case 'shopChoice': {
            if (!pendingDecision.options || pendingDecision.options.length === 0) return {};
            // Just pick the first available (shops are already filtered)
            return { shopChoice: pendingDecision.options[0] };
        }

        case 'stealGems': {
            const target = getPlayer(state, pendingDecision.fromPlayer);
            if (!target) return { stealGems: {} };
            const maxSteal = pendingDecision.maxGems || 1;
            const selection = {};
            let remaining = maxSteal;

            // Steal what the target has the most of (hurt them most)
            const available = Object.entries(target.resources)
                .filter(([_, amount]) => amount > 0)
                .sort((a, b) => b[1] - a[1]); // most first

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
            // Pick the first option (reasonable default)
            const choice = pendingDecision.options[0];
            if (pendingDecision.subType === 'myWorker') return { myWorker: choice.value };
            if (pendingDecision.subType === 'otherWorker') return { otherWorker: choice.value };
            return {};
        }

        case 'shopToggle': {
            // Toggle a closed shop open (prefer our color)
            const colors = Object.keys(state.gameLayers || {});
            for (const color of colors) {
                for (let round = 1; round <= 3; round++) {
                    const shopId = `${color}${round}`;
                    if (state.closedShops?.[shopId]) {
                        return { shopToggle: shopId };
                    }
                }
            }
            // All open — close something random
            const color = colors[0];
            return { shopToggle: `${color}1` };
        }

        case 'workerMove': {
            const myWorkers = Object.entries(state.occupiedSpaces)
                .filter(([_, pid]) => pid === playerId);
            if (myWorkers.length === 0) return {};

            const available = getAvailableActions(state);
            if (available.length === 0) return {};

            // Move worst worker to best available action
            const worstWorker = myWorkers
                .sort((a, b) => scoreAction(state, playerId, a[0]) - scoreAction(state, playerId, b[0]))[0];
            const bestAction = available
                .sort((a, b) => scoreAction(state, playerId, b) - scoreAction(state, playerId, a))[0];

            return { workerMove: { from: worstWorker[0], to: bestAction } };
        }

        default:
            return {};
    }
}
