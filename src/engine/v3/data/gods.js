/**
 * Patrons v3 — God Definitions
 *
 * Pure data. No logic. Each god defines:
 *   - Identity (id, name, title, color)
 *   - 7 action spaces (4 tier-1, 2 tier-2, 1 tier-3)
 *   - 3 shops (weak, strong, VP)
 *   - Glory condition (unique scoring trigger)
 *   - 6 power cards (deal 2-3 face-up per game)
 *
 * All mechanical effect types and event triggers are strings from constants.js,
 * designed for an event-driven engine to register handlers against.
 */

import { EFFECT_TYPES, GLORY_TRIGGERS, EVENT_TYPES } from './constants.js';

const gods = {

  // =========================================================================
  // GOLD — God of Riches
  // =========================================================================
  gold: {
    id: 'gold',
    name: 'Aurum',
    title: 'God of Riches',
    color: 'gold',

    actions: [
      // --- Tier 1 (Round 1) — 4 actions ---
      {
        id: 'gold_collectTribute',
        name: 'Collect Tribute',
        tier: 1,
        effect: '+2 gold',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { gold: 2 },
      },
      {
        id: 'gold_barter',
        name: 'Barter',
        tier: 1,
        effect: 'Trade 2 any resources for 2 gold',
        effectType: EFFECT_TYPES.TRADE_RESOURCE,
        cost: { any: 2 },
        resources: { gold: 2 },
      },
      {
        id: 'gold_scavenge',
        name: 'Scavenge',
        tier: 1,
        effect: '+1 gold',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { gold: 1 },
      },
      {
        id: 'gold_appraise',
        name: 'Appraise',
        tier: 1,
        effect: 'Trade 1 any resource for 1 gold',
        effectType: EFFECT_TYPES.TRADE_RESOURCE,
        cost: { any: 1 },
        resources: { gold: 1 },
      },

      // --- Tier 2 (Round 2) — 2 actions ---
      {
        id: 'gold_meditateOnWealth',
        name: 'Meditate on Wealth',
        tier: 2,
        effect: '+3 gold, skip your next action',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.SKIP_NEXT_ACTION],
        resources: { gold: 3 },
      },
      {
        id: 'gold_brokerDeal',
        name: 'Broker Deal',
        tier: 2,
        effect: 'Trade 3 any resources for 3 gold',
        effectType: EFFECT_TYPES.TRADE_RESOURCE,
        cost: { any: 3 },
        resources: { gold: 3 },
      },

      // --- Tier 3 (Round 3) — 1 action ---
      {
        id: 'gold_cashIn',
        name: 'Cash In',
        tier: 3,
        effect: '+1 Glory per gold you own',
        effectType: EFFECT_TYPES.GAIN_GLORY,
        gloryFormula: 'perResourceOwned:gold',
      },
    ],

    shops: [
      {
        type: 'weak',
        cost: { gold: 1, any: 1 },
        effect: 'Gain 2 gold',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { gold: 2 },
      },
      {
        type: 'strong',
        cost: { gold: 4, any: 4 },
        effect: 'Double your gold',
        effectType: EFFECT_TYPES.DOUBLE_RESOURCE_GAIN,
        targetResource: 'gold',
      },
      {
        type: 'vp',
        cost: { gold: 3 },
        effect: '+4 Glory',
        effectType: EFFECT_TYPES.GAIN_GLORY,
        glory: 4,
      },
    ],

    gloryCondition: {
      description: '+1 Glory per gold owned at end of each round',
      trigger: GLORY_TRIGGERS.ROUND_END,
      formula: 'perResourceOwned:gold',
    },

    powerCards: [
      {
        id: 'gold_goldenScepter',
        name: 'Golden Scepter',
        cost: { gold: 2, any: 1 },
        effect: 'Whenever you gain gold, gain +1 extra',
        trigger: EVENT_TYPES.ON_GAIN_GOLD,
        effectType: EFFECT_TYPES.POWER_CARD_PASSIVE,
        mechanicalDetail: 'Intercepts all gold gain events and adds +1',
      },
      {
        id: 'gold_goldIdol',
        name: 'Gold Idol',
        cost: { gold: 3 },
        effect: '+2 gold when purchased and at the start of each round',
        trigger: EVENT_TYPES.ROUND_START,
        effectType: [EFFECT_TYPES.POWER_CARD_ON_PURCHASE, EFFECT_TYPES.POWER_CARD_ROUND_START],
        mechanicalDetail: 'Immediate +2 gold on purchase, then +2 gold at each round start',
        onPurchaseGain: { gold: 2 },
        roundStartGain: { gold: 2 },
      },
      {
        id: 'gold_goldenChalice',
        name: 'Golden Chalice',
        cost: { gold: 1, any: 2 },
        effect: 'When you gain gold from an action, also gain 1 of any other resource',
        trigger: EVENT_TYPES.ON_GAIN_GOLD,
        effectType: EFFECT_TYPES.POWER_CARD_PASSIVE,
        mechanicalDetail: 'On gold gain from action (not shops/cards), player chooses 1 non-gold resource',
        filterSource: 'action',
      },
      {
        id: 'gold_goldenRing',
        name: 'Golden Ring',
        cost: { gold: 2, any: 1 },
        effect: 'When another player gains gold, you gain 1 gold',
        trigger: EVENT_TYPES.ON_GAIN_GOLD,
        effectType: EFFECT_TYPES.POWER_CARD_PASSIVE,
        mechanicalDetail: 'Listens for gold gain events from OTHER players, grants 1 gold to card owner',
        filterSource: 'otherPlayer',
      },
      {
        id: 'gold_goldCrown',
        name: 'Gold Crown',
        cost: { gold: 4, any: 2 },
        effect: 'Game end: +1 Glory per 2 gold you own',
        trigger: EVENT_TYPES.GAME_END,
        effectType: EFFECT_TYPES.GAIN_GLORY,
        mechanicalDetail: 'End-game scoring bonus: floor(gold / 2) Glory',
        gloryFormula: 'perResourceOwned:gold:divisor2',
      },
      {
        id: 'gold_goldVault',
        name: 'Gold Vault',
        cost: { gold: 2, any: 1 },
        effect: 'Your resources cannot be stolen',
        trigger: EVENT_TYPES.ON_STEAL_RESOURCE,
        effectType: EFFECT_TYPES.PROTECT_RESOURCES,
        mechanicalDetail: 'Blocks all steal-resource effects targeting this player',
      },
    ],
  },

  // =========================================================================
  // BLACK — God of Shadows
  // =========================================================================
  black: {
    id: 'black',
    name: 'Noctis',
    title: 'God of Shadows',
    color: 'black',

    actions: [
      // --- Tier 1 (Round 1) — 4 actions ---
      {
        id: 'black_skulk',
        name: 'Skulk',
        tier: 1,
        effect: '+3 black',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { black: 3 },
      },
      {
        id: 'black_lurk',
        name: 'Lurk',
        tier: 1,
        effect: '+2 black',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { black: 2 },
      },
      {
        id: 'black_pickpocket',
        name: 'Pickpocket',
        tier: 1,
        effect: '+1 black, steal 1 Glory from a player',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.STEAL_GLORY],
        resources: { black: 1 },
        stealGlory: 1,
        targetType: 'choosePlayer',
      },
      {
        id: 'black_ransack',
        name: 'Ransack',
        tier: 1,
        effect: 'Steal 2 resources from a player',
        effectType: EFFECT_TYPES.STEAL_RESOURCE,
        stealCount: 2,
        targetType: 'choosePlayer',
      },

      // --- Tier 2 (Round 2) — 2 actions ---
      {
        id: 'black_extort',
        name: 'Extort',
        tier: 2,
        effect: '+1 black, steal 3 resources from a player',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.STEAL_RESOURCE],
        resources: { black: 1 },
        stealCount: 3,
        targetType: 'choosePlayer',
      },
      {
        id: 'black_hex',
        name: 'Hex',
        tier: 2,
        effect: 'All other players lose 2 Glory',
        effectType: EFFECT_TYPES.PENALIZE_ALL,
        gloryPenalty: 2,
        targetType: 'allOthers',
      },

      // --- Tier 3 (Round 3) — 1 action ---
      {
        id: 'black_ruin',
        name: 'Ruin',
        tier: 3,
        effect: '+2 black, all other players lose 4 Glory',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.PENALIZE_ALL],
        resources: { black: 2 },
        gloryPenalty: 4,
        targetType: 'allOthers',
      },
    ],

    shops: [
      {
        type: 'weak',
        cost: { black: 1, any: 1 },
        effect: 'Steal 1 Glory from a player',
        effectType: EFFECT_TYPES.STEAL_GLORY,
        stealGlory: 1,
        targetType: 'choosePlayer',
      },
      {
        type: 'strong',
        cost: { black: 3, any: 3 },
        effect: 'Steal 3 Glory from a player',
        effectType: EFFECT_TYPES.STEAL_GLORY,
        stealGlory: 3,
        targetType: 'choosePlayer',
      },
      {
        type: 'vp',
        cost: { black: 5 },
        effect: 'Steal 2 Glory from each other player',
        effectType: EFFECT_TYPES.STEAL_GLORY,
        stealGlory: 2,
        targetType: 'allOthers',
      },
    ],

    gloryCondition: {
      description: '+1 Glory each time you steal from or penalize another player',
      trigger: GLORY_TRIGGERS.ON_STEAL_OR_PENALIZE,
      formula: 'perStealOrPenalize',
    },

    powerCards: [
      {
        id: 'black_onyxSpyglass',
        name: 'Onyx Spyglass',
        cost: { black: 3 },
        effect: 'When another player buys a power card, gain 1 black',
        trigger: EVENT_TYPES.ON_POWER_CARD_PURCHASE,
        effectType: EFFECT_TYPES.POWER_CARD_PASSIVE,
        mechanicalDetail: 'Listens for power card purchases by OTHER players, grants 1 black to card owner',
        filterSource: 'otherPlayer',
        gain: { black: 1 },
      },
      {
        id: 'black_voodooDoll',
        name: 'Voodoo Doll',
        cost: { black: 3, any: 1 },
        effect: 'At end of each round, choose a player — they lose 2 Glory',
        trigger: EVENT_TYPES.ROUND_END,
        effectType: EFFECT_TYPES.PENALIZE_ALL,
        mechanicalDetail: 'Round-end trigger, requires target player selection',
        gloryPenalty: 2,
        targetType: 'choosePlayer',
      },
      {
        id: 'black_thievesGloves',
        name: "Thieves' Gloves",
        cost: { black: 1, any: 2 },
        effect: 'When you take a steal action, also gain +1 of any resource',
        trigger: EVENT_TYPES.ON_STEAL_RESOURCE,
        effectType: EFFECT_TYPES.POWER_CARD_PASSIVE,
        mechanicalDetail: 'Triggers on steal actions (not shops). Player chooses which resource color.',
        filterSource: 'action',
      },
      {
        id: 'black_tomeOfDeeds',
        name: 'Tome of Deeds',
        cost: { black: 2, any: 1 },
        effect: 'Your Glory cannot be stolen',
        trigger: EVENT_TYPES.ON_STEAL_GLORY,
        effectType: EFFECT_TYPES.PROTECT_GLORY,
        mechanicalDetail: 'Blocks all steal-glory effects targeting this player',
      },
      {
        id: 'black_obsidianCoin',
        name: 'Obsidian Coin',
        cost: { black: 2, any: 1 },
        effect: 'Any resource counts as black for purchases',
        trigger: EVENT_TYPES.ON_POWER_CARD_PURCHASE,
        effectType: EFFECT_TYPES.WILDCARD_RESOURCE,
        mechanicalDetail: 'When paying costs that require black, any resource can substitute. Applies to power card and shop purchases.',
        wildcardColor: 'black',
      },
      {
        id: 'black_cursedBlade',
        name: 'Cursed Blade',
        cost: { black: 2, any: 2 },
        effect: 'Your steal actions and shops steal an extra 1 Glory',
        trigger: EVENT_TYPES.ON_STEAL_GLORY,
        effectType: EFFECT_TYPES.POWER_CARD_PASSIVE,
        mechanicalDetail: 'Whenever this player steals Glory (action or shop), add +1 to the steal amount',
        bonusStealGlory: 1,
      },
    ],
  },

  // =========================================================================
  // GREEN — God of Time
  // =========================================================================
  green: {
    id: 'green',
    name: 'Chronis',
    title: 'God of Time',
    color: 'green',

    actions: [
      // --- Tier 1 (Round 1) — 4 actions ---
      {
        id: 'green_bide',
        name: 'Bide',
        tier: 1,
        effect: '+3 green',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { green: 3 },
      },
      {
        id: 'green_meditate',
        name: 'Meditate',
        tier: 1,
        effect: '+2 green',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { green: 2 },
      },
      {
        id: 'green_relive',
        name: 'Relive',
        tier: 1,
        effect: '+1 green, repeat 1 of your other actions',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.REPEAT_ACTION],
        resources: { green: 1 },
        repeatCount: 1,
        repeatSource: 'self',
      },
      {
        id: 'green_echo',
        name: 'Echo',
        tier: 1,
        effect: '+1 green, copy the last action any player took',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.COPY_ACTION],
        resources: { green: 1 },
        copySource: 'lastActionAnyPlayer',
      },

      // --- Tier 2 (Round 2) — 2 actions ---
      {
        id: 'green_loop',
        name: 'Loop',
        tier: 2,
        effect: '+1 green, repeat 2 of your other actions',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.REPEAT_ACTION],
        resources: { green: 1 },
        repeatCount: 2,
        repeatSource: 'self',
      },
      {
        id: 'green_accelerate',
        name: 'Accelerate',
        tier: 2,
        effect: '+2 green, take another turn right after this',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.EXTRA_TURN],
        resources: { green: 2 },
      },

      // --- Tier 3 (Round 3) — 1 action ---
      {
        id: 'green_unravel',
        name: 'Unravel',
        tier: 3,
        effect: '+1 green, repeat 3 of your other actions',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.REPEAT_ACTION],
        resources: { green: 1 },
        repeatCount: 3,
        repeatSource: 'self',
      },
    ],

    shops: [
      {
        type: 'weak',
        cost: { green: 1, any: 2 },
        effect: 'Repeat one of your Tier 1 actions',
        effectType: EFFECT_TYPES.REPEAT_ACTION,
        repeatCount: 1,
        repeatSource: 'self',
        repeatTierLimit: 1,
      },
      {
        type: 'strong',
        cost: { green: 3, any: 3 },
        effect: "Copy another player's last action",
        effectType: EFFECT_TYPES.COPY_ACTION,
        copySource: 'lastActionAnyPlayer',
      },
      {
        type: 'vp',
        cost: { green: 4 },
        effect: '+4 Glory, take another turn',
        effectType: [EFFECT_TYPES.GAIN_GLORY, EFFECT_TYPES.EXTRA_TURN],
        glory: 4,
      },
    ],

    gloryCondition: {
      description: '+1 Glory every time you repeat or copy an action',
      trigger: GLORY_TRIGGERS.ON_REPEAT_OR_COPY,
      formula: 'perRepeatOrCopy',
    },

    powerCards: [
      {
        id: 'green_hourglass',
        name: 'Hourglass',
        cost: { green: 4, any: 2 },
        effect: 'You can take actions at occupied spaces',
        trigger: EVENT_TYPES.BEFORE_ACTION,
        effectType: EFFECT_TYPES.IGNORE_BLOCKING,
        mechanicalDetail: 'Overrides the blocking check — this player can place at already-occupied action spaces',
      },
      {
        id: 'green_capacitor',
        name: 'Capacitor',
        cost: { green: 1, any: 2 },
        effect: 'When you repeat an action during your turn, +1 green',
        trigger: EVENT_TYPES.ON_ACTION,
        effectType: EFFECT_TYPES.POWER_CARD_PASSIVE,
        mechanicalDetail: 'Triggers when action source is "repeat". Grants 1 green.',
        filterSource: 'repeat',
        gain: { green: 1 },
      },
      {
        id: 'green_crystalWatch',
        name: 'Crystal Watch',
        cost: { green: 3 },
        effect: '+3 green when purchased and at the start of each round',
        trigger: EVENT_TYPES.ROUND_START,
        effectType: [EFFECT_TYPES.POWER_CARD_ON_PURCHASE, EFFECT_TYPES.POWER_CARD_ROUND_START],
        mechanicalDetail: 'Immediate +3 green on purchase, then +3 green at each round start',
        onPurchaseGain: { green: 3 },
        roundStartGain: { green: 3 },
      },
      {
        id: 'green_diademOfExpertise',
        name: 'Diadem of Expertise',
        cost: { green: 3, any: 1 },
        effect: 'Your repeat actions trigger Glory condition twice',
        trigger: EVENT_TYPES.ACTION_REPEAT,
        effectType: EFFECT_TYPES.DOUBLE_GLORY_TRIGGER,
        mechanicalDetail: 'When a repeat/copy triggers the Green glory condition, it fires twice instead of once',
      },
      {
        id: 'green_crystalBall',
        name: 'Crystal Ball',
        cost: { green: 2, any: 1 },
        effect: 'You can repeat actions from unoccupied spaces',
        trigger: EVENT_TYPES.ON_ACTION,
        effectType: EFFECT_TYPES.REPEAT_FROM_UNOCCUPIED,
        mechanicalDetail: 'Normally you can only repeat your own placed actions. This lets you repeat any action space that exists but has no worker on it.',
      },
      {
        id: 'green_emeraldCoin',
        name: 'Emerald Coin',
        cost: { green: 2, any: 1 },
        effect: 'Any resource counts as green for purchases',
        trigger: EVENT_TYPES.ON_POWER_CARD_PURCHASE,
        effectType: EFFECT_TYPES.WILDCARD_RESOURCE,
        mechanicalDetail: 'When paying costs that require green, any resource can substitute. Applies to power card and shop purchases.',
        wildcardColor: 'green',
      },
    ],
  },

  // =========================================================================
  // YELLOW — God of Abundance
  // =========================================================================
  yellow: {
    id: 'yellow',
    name: 'Solara',
    title: 'God of Abundance',
    color: 'yellow',

    actions: [
      // --- Tier 1 (Round 1) — 4 actions ---
      {
        id: 'yellow_forage',
        name: 'Forage',
        tier: 1,
        effect: 'Gain 3 resources (any colors, you choose)',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { any: 3 },
        playerChoosesColors: true,
      },
      {
        id: 'yellow_gather',
        name: 'Gather',
        tier: 1,
        effect: 'Gain 2 resources (any colors)',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { any: 2 },
        playerChoosesColors: true,
      },
      {
        id: 'yellow_bless',
        name: 'Bless',
        tier: 1,
        effect: '+2 yellow',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { yellow: 2 },
      },
      {
        id: 'yellow_trade',
        name: 'Trade',
        tier: 1,
        effect: '+1 yellow, trade all your resources for new ones (same total count)',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.REDISTRIBUTE_RESOURCE],
        resources: { yellow: 1 },
        redistributeAll: true,
      },

      // --- Tier 2 (Round 2) — 2 actions ---
      {
        id: 'yellow_harvest',
        name: 'Harvest',
        tier: 2,
        effect: 'Gain 4 resources (any colors)',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { any: 4 },
        playerChoosesColors: true,
      },
      {
        id: 'yellow_commune',
        name: 'Commune',
        tier: 2,
        effect: "+2 yellow, copy previous player's last resource gain",
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.COPY_ACTION],
        resources: { yellow: 2 },
        copySource: 'lastGainPreviousPlayer',
      },

      // --- Tier 3 (Round 3) — 1 action ---
      {
        id: 'yellow_flourish',
        name: 'Flourish',
        tier: 3,
        effect: 'Gain 3 of each active color in the game',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { eachActiveColor: 3 },
      },
    ],

    shops: [
      {
        type: 'weak',
        cost: { yellow: 1, any: 1 },
        effect: 'Double your next resource gain',
        effectType: EFFECT_TYPES.DOUBLE_RESOURCE_GAIN,
        mechanicalDetail: 'Sets a flag on the player. Next time they gain resources from any source, the amount is doubled. Clears after one use.',
      },
      {
        type: 'strong',
        cost: { yellow: 3, any: 3 },
        effect: 'Trigger your Glory condition right now',
        effectType: EFFECT_TYPES.TRIGGER_GLORY_CONDITION,
        mechanicalDetail: 'Immediately evaluates the Yellow glory condition (count distinct resource colors owned, gain that much Glory)',
      },
      {
        type: 'vp',
        cost: { yellow: 4 },
        effect: '+1 Glory per complete set of all active colors you own',
        effectType: EFFECT_TYPES.GAIN_GLORY,
        gloryFormula: 'perCompleteColorSet',
      },
    ],

    gloryCondition: {
      description: '+1 Glory per different resource color you own at end of each round',
      trigger: GLORY_TRIGGERS.ROUND_END,
      formula: 'perDistinctColorOwned',
    },

    powerCards: [
      {
        id: 'yellow_hornOfPlenty',
        name: 'Horn of Plenty',
        cost: { yellow: 3, any: 1 },
        effect: 'Gain 1 of each active color now and at the start of each round',
        trigger: EVENT_TYPES.ROUND_START,
        effectType: [EFFECT_TYPES.POWER_CARD_ON_PURCHASE, EFFECT_TYPES.POWER_CARD_ROUND_START],
        mechanicalDetail: 'Immediate gain of 1 of each active color on purchase, then same at each round start',
        onPurchaseGain: { eachActiveColor: 1 },
        roundStartGain: { eachActiveColor: 1 },
      },
      {
        id: 'yellow_prismaticGem',
        name: 'Prismatic Gem',
        cost: { yellow: 2, any: 1 },
        effect: 'Yellow resources count as any color for purchases',
        trigger: EVENT_TYPES.ON_POWER_CARD_PURCHASE,
        effectType: EFFECT_TYPES.WILDCARD_RESOURCE,
        mechanicalDetail: 'When paying costs, yellow resources can substitute for any specific color requirement',
        wildcardColor: 'yellow',
        wildcardTarget: 'any',
      },
      {
        id: 'yellow_rainbowCrest',
        name: 'Rainbow Crest',
        cost: { yellow: 1, any: 2 },
        effect: 'When you gain resources of 2+ different colors in one action, gain +1 of any color',
        trigger: EVENT_TYPES.ON_GAIN_RESOURCE,
        effectType: EFFECT_TYPES.POWER_CARD_PASSIVE,
        mechanicalDetail: 'After resolving a gain, if 2+ distinct colors were gained, player chooses 1 additional resource of any color',
        filterCondition: 'multiColorGain',
      },
      {
        id: 'yellow_alchemistsTrunk',
        name: "Alchemist's Trunk",
        cost: { yellow: 2, any: 2 },
        effect: 'Now and at the start of each round, redistribute all your resources however you want (same total)',
        trigger: EVENT_TYPES.ROUND_START,
        effectType: [EFFECT_TYPES.POWER_CARD_ON_PURCHASE, EFFECT_TYPES.REDISTRIBUTE_RESOURCE],
        mechanicalDetail: 'On purchase and each round start, player may reassign all their resources to any color distribution keeping the same total count',
      },
      {
        id: 'yellow_abundanceCharm',
        name: 'Abundance Charm',
        cost: { yellow: 1, any: 2 },
        effect: 'Your basic gain actions (+2/+3 resource actions) gain +1 extra',
        trigger: EVENT_TYPES.ON_GAIN_RESOURCE,
        effectType: EFFECT_TYPES.POWER_CARD_PASSIVE,
        mechanicalDetail: 'When a gain-resource action resolves with a base amount of 2 or 3, add +1 to the total. Does not apply to trades, steals, or shop gains.',
        filterCondition: 'basicGainAction',
      },
      {
        id: 'yellow_travelersJournal',
        name: "Traveler's Journal",
        cost: { yellow: 2, any: 1 },
        effect: 'When you gain 2+ different resource colors on your turn, +1 Glory',
        trigger: EVENT_TYPES.TURN_END,
        effectType: EFFECT_TYPES.GAIN_GLORY,
        mechanicalDetail: 'At turn end, checks if player gained 2+ distinct colors this turn. If so, +1 Glory.',
        gloryFormula: 'conditionalMultiColorGain',
        glory: 1,
      },
    ],
  },
};

export default gods;
