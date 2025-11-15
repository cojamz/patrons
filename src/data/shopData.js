// Shop definitions and costs for all game layers

export const shopData = {
    red: {
        1: 'Repeat a worker\'s action',
        2: 'Place the next player\'s worker',
        3: 'Repeat all actions taken this round'
    },
    yellow: {
        1: 'Double your next gain action',
        2: 'Gain 5⭐',
        3: 'Gain 7⭐'
    },
    blue: {
        1: 'Toggle any shop (open/closed)',
        2: 'Toggle all shop statuses',
        3: 'Gain any shop benefit'
    },
    purple: {
        1: 'Take an extra turn',
        2: 'Play 2 more workers this turn',
        3: 'Play all remaining workers'
    },
    gold: {
        1: '1 Gold + 1 Any = 2 Gold',
        2: '2 Gold + 2 Any = 4 Gold',
        3: '3 Gold + 3 Any = Double Your Gold'
    },
    white: {
        1: 'Lose 1 VP, Gain 1 ⭐',
        2: 'Lose 3 VP, Skip next player\'s turn',
        3: 'Lose 5 VP, Move worker to action'
    },
    black: {
        1: 'Steal 1 VP from another player',
        2: 'Steal 3 VP from another player',
        3: 'Steal 5 VP from another player'
    },
    silver: {
        1: 'Gain 2 VP',
        2: 'Gain 4 VP, Pick Another Player to Gain 4 VP',
        3: 'Gain 7 Silver, Each Other Player Gains 2 Silver'
    }
};

export const shopCosts = {
    red: { 1: '1🔴+2⭐', 2: '2🔴+2⭐', 3: '4🔴+4⭐' },
    yellow: { 1: '1🟡+1⭐', 2: '2🟡+2⭐', 3: '3🟡+3⭐' },
    blue: { 1: '1🔵+1⭐', 2: '2🔵+2⭐', 3: '3🔵+3⭐' },
    purple: { 1: '1🟣+2⭐', 2: '2🟣+2⭐', 3: '3🟣+3⭐' },
    gold: { 1: '1🟨+1⭐', 2: '2🟨+2⭐', 3: '3🟨+3⭐' },
    white: { 1: '1VP', 2: '2VP', 3: '3VP' },
    black: { 1: '1⚫+1⭐', 2: '2⚫+2⭐', 3: '3⚫+3⭐' },
    silver: { 1: '1🩶+1⭐', 2: '2🩶+2⭐', 3: '3🩶+3⭐' }
};

export const vpShopData = {
    red: { cost: '5 red', vp: 5 },
    yellow: { cost: '5 ⭐', vp: 3 },
    blue: { cost: '5 blue', vp: 5 },
    purple: { cost: '6 purple', vp: 5 },
    white: { cost: '4 white', vp: 4 },
    black: { cost: '6 black', vp: 'Steal 2 from each' },
    silver: { cost: '6 silver', vp: 8 },
    gold: null // Gold has no VP shop
};
