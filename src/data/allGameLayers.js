// All game layer definitions with actions for each color

export const allGameLayers = {
    red: {
        title: "Patron Manipulation",
        icon: "🔴",
        actions: [
            { id: 'gain3red', title: 'Gain 3 🔴', description: '', round: 1 },
            { id: 'gain2red', title: 'Gain 2 🔴', description: '', round: 1 },
            { id: 'redHybrid1', title: '+1 🔴 + Swap Patrons', description: '(Both execute their new action)', round: 1 },
            { id: 'redRepeatAction', title: 'Repeat an Action', description: '(That one of your patrons is on)', round: 1 },
            { id: 'redVPFocus', title: 'Gain 1🔴, +1 VP Per Red Patron', description: '(for each red action where you have a patron)', round: 2 },
            { id: 'redHybrid2', title: '+1 🔴 + Swap Patrons', description: '(Only you execute your new action)', round: 2 },
            { id: 'redRepeatAll', title: 'Repeat all actions where you have a patron', description: '(In any order you choose)', round: 3 }
        ]
    },
    yellow: {
        title: "Resource Manipulation",
        icon: "🟡",
        actions: [
            { id: 'gain3yellow', title: 'Gain 3 resources', description: '(any colors)', round: 1 },
            { id: 'gain2yellow', title: 'Gain 2 resources', description: '(any colors)', round: 1 },
            { id: 'steal2Gems', title: '+1🟡 + Trade all resources for new ones', description: '(keep same total count)', round: 1 },
            { id: 'yellowHybrid1', title: '+2🟡', description: '', round: 1 },
            { id: 'steal3Gems', title: 'Gain 4 resources', description: '(any colors)', round: 2 },
            { id: 'yellowHybrid2', title: '+1🟡 + Copy previous player\'s last gain', description: '', round: 2 },
            { id: 'yellowSwapResources', title: 'Gain 3 of each color in the game', description: '', round: 3 }
        ]
    },
    blue: {
        title: "Shop Control",
        icon: "🔵",
        actions: [
            { id: 'gain3blue', title: 'Gain 3 🔵', description: '', round: 1 },
            { id: 'gain2blue', title: 'Gain 2 🔵', description: '', round: 1 },
            { id: 'blueR1ShopBenefit', title: 'Gain an R1 Shop Benefit', description: '(Even if closed)', round: 1 },
            { id: 'blueReduceCosts', title: '+1 🔵 + Reduce All Shop Costs', description: '(By 1 ⭐ this round)', round: 1 },
            { id: 'blueIncreaseCosts', title: 'Increase All Shop Costs', description: '(By 2 ⭐ for other players)', round: 2 },
            { id: 'blueToggleShops', title: '+1 🔵 + Toggle All Shop Status', description: '(Including victory shops)', round: 2 },
            { id: 'blueAnyShopBenefit', title: 'Gain Any Shop Benefit', description: '(Even if closed)', round: 3 }
        ]
    },
    purple: {
        title: "Timing/Order",
        icon: "🟣",
        actions: [
            { id: 'gain4purpleSkip', title: 'Gain 4 🟣, Skip Next Turn', description: '', round: 1 },
            { id: 'gain3purple', title: 'Gain 3 🟣', description: '', round: 1 },
            { id: 'gain2purpleTakeBack', title: 'Gain 2 🟣, Take Back Patron', description: '(From different quad)', round: 1 },
            { id: 'playTwoWorkers', title: 'Place 2 More Patrons', description: '(This turn)', round: 1 },
            { id: 'gain5purpleSkip', title: 'Gain 5 🟣, Skip Turn', description: '', round: 2 },
            { id: 'playThreeWorkers', title: 'Place 3 More Patrons', description: '(This turn)', round: 2 },
            { id: 'gain4purpleWaitAll', title: 'Gain 4 🟣, Take Another Turn', description: '(After this one)', round: 3 }
        ]
    },
    gold: {
        title: "Victory Points",
        icon: "🟨",
        actions: [
            { id: 'gain2gold', title: 'Gain 2 Gold', description: '', round: 1 },
            { id: 'convert2AnyTo2Gold', title: 'Trade: 2 resources → 2 Gold', description: '(any colors)', round: 1 },
            { id: 'gain1gold', title: 'Gain 1 Gold', description: '', round: 1 },
            { id: 'convert1AnyTo1Gold', title: 'Trade: 1 resource → 1 Gold', description: '(any color)', round: 1 },
            { id: 'gain3goldSkip', title: 'Gain 3 Gold, skip your next turn', description: '', round: 2 },
            { id: 'convert3AnyTo3Gold', title: 'Trade: 3 resources → 3 Gold', description: '(any colors)', round: 2 },
            { id: 'goldVPPerGold', title: 'Gain 1 VP for each Gold you have', description: '', round: 3 }
        ]
    },
    white: {
        title: "White - VP Trading",
        icon: "⚪",
        actions: [
            { id: 'gain3vp', title: 'Gain 3 VP', description: '', round: 1 },
            { id: 'gain2vp', title: 'Gain 2 VP', description: '', round: 1 },
            { id: 'spend1AnyFor2VP', title: 'Trade: 1 resource → 2 VP', description: '(any color)', round: 1 },
            { id: 'spend2AnyFor3VP', title: 'Trade: 2 resources → 3 VP', description: '(any colors)', round: 1 },
            { id: 'lose1VPGain2Any', title: 'Lose 1 VP, gain 2 resources', description: '(any colors)', round: 2 },
            { id: 'lose2VPGain4Any', title: 'Lose 2 VP, gain 4 resources', description: '(any colors)', round: 2 },
            { id: 'gain5VPAnd5Any', title: 'Gain 5 VP and 5 resources', description: '(any colors)', round: 3 }
        ]
    },
    black: {
        title: "Destruction/Penalty",
        icon: "⚫",
        actions: [
            { id: 'gain3black', title: 'Gain 3 ⚫', description: '', round: 1 },
            { id: 'gain2black', title: 'Gain 2 ⚫', description: '', round: 1 },
            { id: 'blackSteal1VP', title: '+1 ⚫, steal 1 VP from a player', description: '', round: 1 },
            { id: 'blackSteal2Any', title: 'Steal 2 resources from a player', description: '(any colors)', round: 1 },
            { id: 'blackStealWorker', title: '+1 ⚫, steal 4 resources from a player', description: '(any colors)', round: 2 },
            { id: 'blackAllLose2VP', title: 'All other players lose 2 VP', description: '', round: 2 },
            { id: 'blackAllLose4VP', title: '+2 ⚫, all other players lose 4 VP', description: '', round: 3 }
        ]
    },
    silver: {
        title: "Information/Planning",
        icon: "🩶",
        actions: [
            { id: 'silver4Others1', title: '+4 Silver for you, +1 for all others', description: '', round: 1 },
            { id: 'silver3Others1', title: '+3 Silver for you, +1 for all others', description: '', round: 1 },
            { id: 'silver2Plus1Others', title: '+2 Silver + 1 resource for you', description: '(others get 1 of same color)', round: 1 },
            { id: 'silver2VPBoth', title: '+2 VP for you, pick a player for +2 VP', description: '', round: 1 },
            { id: 'silverTakeBack2', title: '+2 Silver, take back 2 patrons', description: '(others take back 1)', round: 2 },
            { id: 'silver3Plus2Others1', title: '+3 Silver + 2 resources for you', description: '(others get 1 of that color)', round: 2 },
            { id: 'silver8VPOthers3S', title: '+8 VP for you, +3 Silver for all others', description: '', round: 3 }
        ]
    }
};

/**
 * Select random game layers based on player count and game mode
 * @param {number} playerCount - Number of players (2-4)
 * @param {'basic'|'advanced'} gameMode - Basic (4 colors) or Advanced (8 colors)
 * @returns {Object} Selected game layers
 */
export function selectGameLayers(playerCount, gameMode = 'advanced') {
    let availableLayers;

    if (gameMode === 'basic') {
        // Basic mode always uses the original 4 colors
        availableLayers = ['red', 'yellow', 'blue', 'black'];
    } else {
        // Advanced mode uses all 8 colors
        availableLayers = Object.keys(allGameLayers);
    }

    // Use Fisher-Yates shuffle for true randomness
    const shuffled = [...availableLayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selectedLayerKeys = shuffled.slice(0, playerCount);

    const gameData = {};
    selectedLayerKeys.forEach(key => {
        gameData[key] = allGameLayers[key];
    });

    return gameData;
}
