// All game layer definitions with actions for each color

export const allGameLayers = {
    red: {
        title: "Worker Manipulation",
        icon: "🔴",
        actions: [
            { id: 'gain3red', title: 'Gain 3 🔴', description: '', round: 1 },
            { id: 'gain2red', title: 'Gain 2 🔴', description: '', round: 1 },
            { id: 'redHybrid1', title: '+1 🔴 + Swap Workers', description: '(Both players get actions)', round: 1 },
            { id: 'redRepeatAction', title: 'Repeat an Action', description: '(That one of your workers is on)', round: 1 },
            { id: 'forceRedPlacement', title: 'Other Players Must Place on Red', description: '(Until red layer is full)', round: 2 },
            { id: 'redHybrid2', title: '+1 🔴 + Swap Workers', description: '(Only you get action)', round: 2 },
            { id: 'redRepeatAll', title: 'Repeat All Your Worker Actions', description: '(In any order you choose)', round: 3 }
        ]
    },
    yellow: {
        title: "Resource Manipulation",
        icon: "🟡",
        actions: [
            { id: 'gain3yellow', title: 'Gain 3 ⭐', description: '', round: 1 },
            { id: 'gain2yellow', title: 'Gain 2 ⭐', description: '', round: 1 },
            { id: 'steal2Gems', title: 'Trade All ⭐ for ⭐', description: '', round: 1 },
            { id: 'yellowHybrid1', title: 'Gain 2 ⭐', description: '', round: 1 },
            { id: 'steal3Gems', title: 'Steal 3 Resources', description: '', round: 2 },
            { id: 'yellowHybrid2', title: '+1 🟡 + Double Next Gain', description: '(Doesn\'t stack with shop)', round: 2 },
            { id: 'yellowSwapResources', title: 'Swap All Resources', description: '(Choose ⭐ player)', round: 3 }
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
            { id: 'gain2purpleTakeBack', title: 'Gain 2 🟣, Take Back Worker', description: '(From different quad)', round: 1 },
            { id: 'playTwoWorkers', title: 'Play 2 More Workers', description: '(This turn)', round: 1 },
            { id: 'gain5purpleSkip', title: 'Gain 5 🟣, Skip Turn', description: '', round: 2 },
            { id: 'playThreeWorkers', title: 'Play 3 More Workers', description: '(This turn)', round: 2 },
            { id: 'gain4purpleWaitAll', title: 'Gain 4 🟣, Take Another Turn', description: '(After this one)', round: 3 }
        ]
    },
    gold: {
        title: "Victory Points",
        icon: "🟨",
        actions: [
            { id: 'gain2gold', title: 'Gain 2 Gold', description: '', round: 1 },
            { id: 'convert2AnyTo2Gold', title: 'Turn 2 ⭐ to 2 Gold', description: '', round: 1 },
            { id: 'gain1gold', title: 'Gain 1 Gold', description: '', round: 1 },
            { id: 'convert1AnyTo1Gold', title: 'Turn 1 ⭐ to 1 Gold', description: '', round: 1 },
            { id: 'gain3goldSkip', title: 'Gain 3 Gold, Skip Next Turn', description: '', round: 2 },
            { id: 'convert3AnyTo3Gold', title: 'Turn 3 ⭐ to 3 Gold', description: '', round: 2 },
            { id: 'goldVPPerGold', title: 'Gain VP for Each Gold You Have', description: '', round: 3 }
        ]
    },
    white: {
        title: "White - VP Trading",
        icon: "⚪",
        actions: [
            { id: 'gain3vp', title: 'Gain 3 VP', description: '', round: 1 },
            { id: 'gain2vp', title: 'Gain 2 VP', description: '', round: 1 },
            { id: 'spend1AnyFor2VP', title: 'Spend 1 ⭐ for 2 VP', description: '', round: 1 },
            { id: 'spend2AnyFor3VP', title: 'Spend 2 ⭐ for 3 VP', description: '', round: 1 },
            { id: 'lose1VPGain2Any', title: 'Lose 1 VP, Gain 2 ⭐', description: '', round: 2 },
            { id: 'lose2VPGain4Any', title: 'Lose 2 VP, Gain 4 ⭐', description: '', round: 2 },
            { id: 'gain5VPAnd5Any', title: 'Gain 5 VP and 5 ⭐', description: '', round: 3 }
        ]
    },
    black: {
        title: "Destruction/Penalty",
        icon: "⚫",
        actions: [
            { id: 'gain3black', title: 'Gain 3 ⚫', description: '', round: 1 },
            { id: 'gain2black', title: 'Gain 2 ⚫', description: '', round: 1 },
            { id: 'blackSteal1VP', title: '+1 ⚫, Steal 1 VP', description: '(From another player)', round: 1 },
            { id: 'blackSteal2Any', title: 'Steal 2 ⭐', description: '(From another player)', round: 1 },
            { id: 'blackStealWorker', title: '+1 ⚫, Steal 4 ⭐', description: '(Steal 4 resources from another player)', round: 2 },
            { id: 'blackAllLose2VP', title: 'All Others Lose 2 VP', description: '', round: 2 },
            { id: 'blackAllLose4VP', title: '+2 ⚫, All Others Lose 4 VP', description: '', round: 3 }
        ]
    },
    silver: {
        title: "Information/Planning",
        icon: "🩶",
        actions: [
            { id: 'silver4Others1', title: '+4 Silver, Others +1', description: '(Other players get +1 Silver)', round: 1 },
            { id: 'silver3Others1', title: '+3 Silver, Others +1', description: '(Other players get +1 Silver)', round: 1 },
            { id: 'silver2Plus1Others', title: '+2 Silver + 1 ⭐', description: '(Others get 1 of same color)', round: 1 },
            { id: 'silver2VPBoth', title: '+2 VP, Pick Another +2 VP', description: '(Choose another player)', round: 1 },
            { id: 'silverTakeBack2', title: '+2 Silver, Take Back 2', description: '(Others take back 1 worker)', round: 2 },
            { id: 'silver3Plus2Others1', title: '+3 Silver + 2 ⭐', description: '(Others get 1 of that color)', round: 2 },
            { id: 'silver8VPOthers3S', title: '+8 VP, Others +3 Silver', description: '(Each other player gets +3 Silver)', round: 3 }
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
        availableLayers = ['red', 'yellow', 'blue', 'purple'];
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
