/**
 * Patrons v3 — God Definitions (Balance Rework)
 *
 * Pure data. No logic. Each god defines:
 *   - Identity (id, name, title, color)
 *   - 7 action spaces (4 tier-1, 2 tier-2, 1 tier-3)
 *   - 3 shops (weak, strong, VP)
 *   - Favor condition (unique scoring trigger)
 *
 * All mechanical effect types and event triggers are strings from constants.js,
 * designed for an event-driven engine to register handlers against.
 */

import { EFFECT_TYPES, GLORY_TRIGGERS } from './constants.js';

const gods = {

  // =========================================================================
  // GOLD — God of Riches
  // Identity: Hoard, tax, invest. Wealth = power.
  // =========================================================================
  gold: {
    id: 'gold',
    name: 'Aurum',
    title: 'God of Riches',
    color: 'gold',

    actions: [
      // --- Tier 1 (Round 1) — 4 actions ---
      {
        id: 'gold_patronage',
        name: 'Patronage',
        tier: 1,
        effect: '+2 gold, give 1 gold to a player of your choice',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE],
        resources: { gold: 2 },
        giveResource: { gold: 1 },
        targetType: 'choosePlayer',
      },
      {
        id: 'gold_levy',
        name: 'Levy',
        tier: 1,
        effect: 'Take 1 gold from each other player',
        effectType: EFFECT_TYPES.STEAL_RESOURCE,
        stealFromAll: { gold: 1 },
        isStealing: true,
      },
      {
        id: 'gold_hoard',
        name: 'Hoard',
        tier: 1,
        effect: '+3 gold, cannot shop this turn',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.NO_SHOP],
        resources: { gold: 3 },
        noShopThisTurn: true,
      },
      {
        id: 'gold_haggle',
        name: 'Haggle',
        tier: 1,
        effect: '+1 gold, next shop or power card costs 2 less this turn',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.SHOP_DISCOUNT],
        resources: { gold: 1 },
        shopDiscount: 2,
      },

      // --- Tier 2 (Round 2) — 2 actions ---
      {
        id: 'gold_austerity',
        name: 'Royalties',
        tier: 2,
        effect: '+1 gold per power card owned',
        effectType: EFFECT_TYPES.SCALE_GAIN,
        scaleSource: 'ownedPowerCards',
        scaleResource: 'gold',
      },
      {
        id: 'gold_tariff',
        name: 'Tariff',
        tier: 2,
        effect: '+1 gold, +1 gold per god you have a worker on',
        effectType: EFFECT_TYPES.SCALE_GAIN,
        resources: { gold: 1 },
        scaleSource: 'godsWithWorkers',
        scaleResource: 'gold',
      },

      // --- Tier 3 (Round 3) — 1 action ---
      {
        id: 'gold_cashIn',
        name: 'Cash In',
        tier: 3,
        effect: 'Convert all gold to Favor 1:1',
        effectType: EFFECT_TYPES.GAIN_GLORY,
      },
    ],

    shops: [
      {
        type: 'weak',
        cost: { gold: 1 },
        effect: '+2 Favor',
        effectType: EFFECT_TYPES.GAIN_GLORY,
        glory: 2,
      },
      {
        type: 'strong',
        cost: { gold: 3 },
        effect: 'Gain the Aegis (resources can\'t be stolen)',
        effectType: EFFECT_TYPES.AEGIS,
      },
      {
        type: 'vp',
        cost: { gold: 4 },
        effect: 'Trigger your Gold Favor condition now',
        effectType: EFFECT_TYPES.TRIGGER_GLORY_CONDITION,
        triggerGod: 'gold',
      },
    ],

    gloryCondition: {
      description: '+1 Favor per gold above your richest opponent when using a gold action',
      trigger: GLORY_TRIGGERS.ROUND_END,
      formula: 'goldAboveRichestOpponent',
    },
  },

  // =========================================================================
  // BLACK — God of Shadows
  // Identity: Steal, siphon, intimidate. Every action touches another player.
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
        id: 'black_ransack',
        name: 'Ransack',
        tier: 1,
        effect: 'Steal 2 resources from a player',
        effectType: EFFECT_TYPES.STEAL_RESOURCE,
        stealCount: 2,
        targetType: 'choosePlayer',
        isStealing: true,
      },
      {
        id: 'black_pickpocket',
        name: 'Pickpocket',
        tier: 1,
        effect: '+1 black, steal 2 Favor from a player',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.STEAL_GLORY],
        resources: { black: 1 },
        stealGlory: 2,
        targetType: 'choosePlayer',
        isStealing: true,
      },
      {
        id: 'black_tribute',
        name: 'Tribute',
        tier: 1,
        effect: 'Each other player gives you 1 resource or 1 Favor (their choice)',
        effectType: EFFECT_TYPES.TRIBUTE,
        targetType: 'allOthers',
      },

      // --- Tier 2 (Round 2) — 2 actions ---
      {
        id: 'black_plunder',
        name: 'Plunder',
        tier: 2,
        effect: 'Steal half a player\'s resources of one color (rounded down)',
        effectType: EFFECT_TYPES.STEAL_HALF,
        targetType: 'choosePlayer',
        isStealing: true,
      },
      {
        id: 'black_dread',
        name: 'Dread',
        tier: 2,
        effect: '+2 black, all other players lose Favor equal to their power card count',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.SCALE_PENALIZE],
        resources: { black: 2 },
        penaltyScale: 'powerCardCount',
        targetType: 'allOthers',
      },

      // --- Tier 3 (Round 3) — 1 action ---
      {
        id: 'black_annihilate',
        name: 'Annihilate',
        tier: 3,
        effect: 'Spend all black — each other player loses that much Favor',
        effectType: EFFECT_TYPES.SPEND_ALL_PENALIZE,
        spendColor: 'black',
        targetType: 'allOthers',
      },
    ],

    shops: [
      {
        type: 'weak',
        cost: { black: 1 },
        effect: 'Steal 1 Favor from a player (once per turn)',
        effectType: EFFECT_TYPES.STEAL_GLORY,
        stealGlory: 1,
        targetType: 'choosePlayer',
        isStealing: true,
        oncePerTurn: true,
      },
      {
        type: 'strong',
        cost: { black: 3 },
        effect: 'Your next theft is doubled',
        effectType: EFFECT_TYPES.DOUBLE_NEXT_THEFT,
      },
      {
        type: 'vp',
        cost: { black: 5 },
        effect: 'Permanently gain +1 extra Favor when stealing',
        effectType: EFFECT_TYPES.PERMANENT_UPGRADE,
        upgradeType: 'stealFavorBonus',
      },
    ],

    gloryCondition: {
      description: '+1 Favor each time you use an action or shop to steal',
      trigger: GLORY_TRIGGERS.ON_STEAL_ACTION,
      formula: 'perStealAction',
    },
  },

  // =========================================================================
  // GREEN — God of Time
  // Identity: Repeat, copy, echo. Every action involves replaying something.
  // =========================================================================
  green: {
    id: 'green',
    name: 'Chronis',
    title: 'God of Time',
    color: 'green',

    actions: [
      // --- Tier 1 (Round 1) — 4 actions ---
      {
        id: 'green_gather',
        name: 'Gather',
        tier: 1,
        effect: '+3 green',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { green: 3 },
      },
      {
        id: 'green_relive',
        name: 'Relive',
        tier: 1,
        effect: '+1 green, repeat one of your Ⅰ actions',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.REPEAT_ACTION],
        resources: { green: 1 },
        repeatSource: 'self',
        repeatTierLimit: 1,
      },
      {
        id: 'green_echo',
        name: 'Echo',
        tier: 1,
        effect: '+1 green, repeat another player\'s Ⅰ action',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.COPY_ACTION],
        resources: { green: 1 },
        repeatSource: 'otherPlayer',
        repeatTierLimit: 1,
      },
      {
        id: 'green_recall',
        name: 'Recall',
        tier: 1,
        effect: '+1 green, repeat an unoccupied Ⅰ action',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.REPEAT_ACTION],
        resources: { green: 1 },
        repeatSource: 'unoccupied',
        repeatTierLimit: 1,
      },

      // --- Tier 2 (Round 2) — 2 actions ---
      {
        id: 'green_rewind',
        name: 'Rewind',
        tier: 2,
        effect: '+1 green, repeat another player\'s Ⅱ action',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.COPY_ACTION],
        resources: { green: 1 },
        repeatSource: 'otherPlayer',
        repeatTierLimit: 2,
      },
      {
        id: 'green_foresight',
        name: 'Foresight',
        tier: 2,
        effect: '+1 green, repeat an unoccupied Ⅱ action',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.REPEAT_ACTION],
        resources: { green: 1 },
        repeatSource: 'unoccupied',
        repeatTierLimit: 2,
      },

      // --- Tier 3 (Round 3) — 1 action ---
      {
        id: 'green_eternity',
        name: 'Eternity',
        tier: 3,
        effect: 'Repeat all actions where you have workers placed this round',
        effectType: EFFECT_TYPES.REPEAT_ACTION,
        repeatSource: 'allOwn',
      },
    ],

    shops: [
      {
        type: 'weak',
        cost: { green: 1 },
        effect: 'Place your next worker now, no buy phase after',
        effectType: EFFECT_TYPES.EXTRA_TURN,
        tempoPlay: true,
        noBuyAfter: true,
      },
      {
        type: 'strong',
        cost: { green: 3 },
        effect: 'Next repeated action happens twice',
        effectType: EFFECT_TYPES.DOUBLE_GLORY_TRIGGER,
        repeatHappensTwice: true,
      },
      {
        type: 'vp',
        cost: { green: 5 },
        effect: 'Permanently gain +1 Favor per repeat/copy (upgrades to +2)',
        effectType: EFFECT_TYPES.PERMANENT_UPGRADE,
        upgradeType: 'repeatFavorBonus',
      },
    ],

    gloryCondition: {
      description: '+1 Favor every time you repeat an action',
      trigger: GLORY_TRIGGERS.ON_REPEAT_OR_COPY,
      formula: 'perRepeatOrCopy',
    },
  },

  // =========================================================================
  // YELLOW — God of Abundance
  // Identity: Exchange/Conversion. Yellow is fuel for transforming resources.
  // =========================================================================
  yellow: {
    id: 'yellow',
    name: 'Solara',
    title: 'God of Abundance',
    color: 'yellow',

    actions: [
      // --- Tier 1 (Round 1) — 4 actions ---
      {
        id: 'yellow_harvest',
        name: 'Harvest',
        tier: 1,
        effect: '+2 yellow',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { yellow: 2 },
      },
      {
        id: 'yellow_forage',
        name: 'Forage',
        tier: 1,
        effect: '+2 any colors',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { any: 2 },
        playerChoosesColors: true,
      },
      {
        id: 'yellow_transmute',
        name: 'Transmute',
        tier: 1,
        effect: '+1 yellow, swap 2 any → 2 any',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.TRADE_RESOURCE],
        resources: { yellow: 1 },
        tradeIn: 2,
        tradeOut: 2,
      },
      {
        id: 'yellow_siphon',
        name: 'Siphon',
        tier: 1,
        effect: 'Steal 2 any from a player, they get +1 yellow',
        effectType: EFFECT_TYPES.STEAL_RESOURCE,
        stealCount: 2,
        targetType: 'choosePlayer',
        compensation: { yellow: 1 },
        isStealing: true,
      },

      // --- Tier 2 (Round 2) — 2 actions ---
      {
        id: 'yellow_distill',
        name: 'Distill',
        tier: 2,
        effect: 'Spend all of one color → gain that many +3 of another',
        effectType: EFFECT_TYPES.SPEND_ALL_CONVERT,
        bonus: 3,
      },
      {
        id: 'yellow_attune',
        name: 'Attune',
        tier: 2,
        effect: 'Gain 1 of each color you have 0 of, then +1 yellow',
        effectType: [EFFECT_TYPES.GAIN_RESOURCE, EFFECT_TYPES.GAIN_PER_ZERO],
        resources: { yellow: 1 },
      },

      // --- Tier 3 (Round 3) — 1 action ---
      {
        id: 'yellow_flourish',
        name: 'Flourish',
        tier: 3,
        effect: 'Gain 2 of each active color',
        effectType: EFFECT_TYPES.GAIN_PER_ACTIVE,
        perActiveColor: 2,
      },
    ],

    shops: [
      {
        type: 'weak',
        cost: { yellow: 1 },
        effect: 'Gain 2 any colors',
        effectType: EFFECT_TYPES.GAIN_RESOURCE,
        resources: { any: 2 },
        playerChoosesColors: true,
      },
      {
        type: 'strong',
        cost: { yellow: 2 },
        effect: 'Double your next resource gain',
        effectType: EFFECT_TYPES.DOUBLE_RESOURCE_GAIN,
      },
      {
        type: 'vp',
        cost: { yellow: 4 },
        effect: 'Spend all non-yellow resources, +1 Favor per resource spent',
        effectType: EFFECT_TYPES.GAIN_GLORY,
        gloryFormula: 'spendAllNonYellowForFavor',
      },
    ],

    gloryCondition: {
      description: '+1 Favor each time you gain a resource you had 0 of',
      trigger: GLORY_TRIGGERS.ON_GAIN_NEW_COLOR,
      formula: 'onGainNewColor',
    },
  },
};

export default gods;
