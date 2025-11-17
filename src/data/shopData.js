// Shop definitions and costs for all game layers

export const shopData = {
    red: {
        1: 'Repeat one of your patron\'s R1 actions',
        2: 'Place the next player\'s patron for them',
        3: 'Pick another player. Repeat all actions where they have a patron'
    },
    yellow: {
        1: 'Double your next resource gain',
        2: 'Trigger Yellow auto VP now',
        3: 'Gain 10 resources (any colors)'
    },
    blue: {
        1: 'Open or close any one shop',
        2: 'Flip all shops (open ↔ closed)',
        3: 'Use any shop benefit for free'
    },
    purple: {
        1: 'Take an extra turn after this one',
        2: 'Place 2 more patrons this turn',
        3: 'Place all your remaining patrons now'
    },
    gold: {
        1: 'Trade: 1 Gold + 1 Any → 2 Gold',
        2: 'Trade: 2 Gold + 2 Any → 4 Gold',
        3: 'Trade: 3 Gold + 3 Any → Double your Gold'
    },
    white: {
        1: 'Lose 1 VP, gain 1 resource (any color)',
        2: 'Lose 3 VP, next player skips their turn',
        3: 'Lose 5 VP, move one patron to any action'
    },
    black: {
        1: 'Steal 1 VP from another player',
        2: 'Steal 3 VP from another player',
        3: 'Steal 5 VP from another player'
    },
    silver: {
        1: 'Gain 2 VP',
        2: 'You and another player each gain 4 VP',
        3: 'Gain 7 Silver, all others gain 2 Silver'
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
