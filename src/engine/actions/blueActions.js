// Blue layer action handlers — shop control.

import {
    getPlayer, addResources, addVP,
    formatPlayerName, createResult, createDecisionRequest, updatePlayer
} from '../stateHelpers.js';
import { getActionTitle } from '../rules.js';

/**
 * blueR1ShopBenefit: Gain an R1 Shop Benefit (even if closed)
 * This needs a shop choice decision, then delegates to shop execution.
 */
export function blueR1ShopBenefit(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (!decisions?.shopChoice) {
        const colors = Object.keys(state.gameLayers || {});
        return createDecisionRequest(state, {
            type: 'shopChoice',
            title: 'Choose any R1 shop benefit (ignores closed status)',
            options: colors.map(color => ({ color, round: 1 }))
        });
    }

    // The actual shop execution will be handled by the shop resolver
    // For now, return a result indicating the shop choice was made
    return createDecisionRequest(state, {
        type: 'executeShop',
        shopColor: decisions.shopChoice.color,
        shopRound: 1,
        freeExecution: true
    }, [`${formatPlayerName(player)} chose ${decisions.shopChoice.color} R1 shop benefit`]);
}

/**
 * blueReduceCosts: +1 blue, reduce all shop costs by 1 for this player
 */
export function blueReduceCosts(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);

    state = addResources(state, playerId, { blue: 1 });
    state = updatePlayer(state, playerId, {
        shopCostModifier: (getPlayer(state, playerId).shopCostModifier || 0) - 1
    });

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('blueReduceCosts', gameLayers)}, gained 1 blue, and reduced their shop costs by 1`]);
}

/**
 * blueIncreaseCosts: +2 blue, increase all shop costs by 2 for other players
 */
export function blueIncreaseCosts(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);

    state = addResources(state, playerId, { blue: 2 });

    // Increase cost modifier for all other players
    state = {
        ...state,
        players: state.players.map(p => {
            if (p.id === playerId) return p;
            return { ...p, shopCostModifier: (p.shopCostModifier || 0) + 2 };
        })
    };

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('blueIncreaseCosts', gameLayers)}, gained 2 blue, and increased all other players' shop costs by 2`]);
}

/**
 * blueToggleShops: +2 blue, toggle all shop status
 */
export function blueToggleShops(state, playerId, gameLayers) {
    const player = getPlayer(state, playerId);

    state = addResources(state, playerId, { blue: 2 });

    // Flip all shops
    const flippedShops = {};
    const colors = Object.keys(state.gameLayers || {});
    const rounds = [1, 2, 3];
    colors.forEach(color => {
        rounds.forEach(round => {
            const shopId = `${color}${round}`;
            flippedShops[shopId] = !state.closedShops[shopId];
        });
        const vpShopId = `${color}vp`;
        flippedShops[vpShopId] = !state.closedShops[vpShopId];
    });

    state = { ...state, closedShops: flippedShops };

    return createResult(state, [`${formatPlayerName(player)} used ${getActionTitle('blueToggleShops', gameLayers)}, gained 2 blue, and toggled all shops`]);
}

/**
 * blueAnyShopBenefit: Gain ANY shop benefit (even if closed)
 */
export function blueAnyShopBenefit(state, playerId, gameLayers, decisions) {
    const player = getPlayer(state, playerId);

    if (!decisions?.shopChoice) {
        const colors = Object.keys(state.gameLayers || {});
        const options = [];
        colors.forEach(color => {
            options.push({ color, round: 1 });
            options.push({ color, round: 2 });
            // Exclude Blue R3 to prevent infinite recursion
            if (color !== 'blue') {
                options.push({ color, round: 3 });
            }
            options.push({ color, round: 'vp' });
        });

        return createDecisionRequest(state, {
            type: 'shopChoice',
            title: 'Choose any shop benefit (ignores closed status)',
            options
        });
    }

    // Delegate to shop execution
    return createDecisionRequest(state, {
        type: 'executeShop',
        shopColor: decisions.shopChoice.color,
        shopRound: decisions.shopChoice.round,
        freeExecution: true
    }, [`${formatPlayerName(player)} chose ${decisions.shopChoice.color} R${decisions.shopChoice.round} shop benefit`]);
}

export const blueActionHandlers = {
    blueR1ShopBenefit,
    blueReduceCosts,
    blueIncreaseCosts,
    blueToggleShops,
    blueAnyShopBenefit
};
