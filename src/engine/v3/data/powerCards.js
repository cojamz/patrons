/**
 * Patrons v3 — Power Card Definitions
 *
 * Pure data. No logic. All 24 power cards extracted from gods.js
 * into a flat, engine-friendly structure keyed by card ID.
 *
 * Each card has:
 *   - id, name, god (color), cost
 *   - description (human-readable)
 *   - handlers[] — event triggers the event system registers
 *   - modifiers[] — static passive effects checked by hasModifier()
 *   - onPurchase — one-time effect on buy
 */

export const powerCards = {
  // === GOLD ===
  golden_scepter: {
    id: 'golden_scepter',
    name: 'Golden Scepter',
    god: 'gold',
    cost: { gold: 2, any: 1 },
    description: 'Whenever you gain gold, gain +1 extra',
    handlers: [{ eventType: 'resource.gained', config: { triggerOn: 'self', resourceFilter: 'gold' } }],
  },
  gold_idol: {
    id: 'gold_idol',
    name: 'Gold Idol',
    god: 'gold',
    cost: { gold: 3 },
    description: '+2 gold when purchased and at the start of each round',
    onPurchase: { type: 'resource_gain', resources: { gold: 2 } },
    handlers: [{ eventType: 'phase.round_start', config: { effect: { type: 'resource_gain', resources: { gold: 2 } } } }],
  },
  golden_chalice: {
    id: 'golden_chalice',
    name: 'Golden Chalice',
    god: 'gold',
    cost: { gold: 1, any: 2 },
    description: 'When you gain gold from an action, also gain 1 of any other resource',
    handlers: [{ eventType: 'resource.gained', config: { triggerOn: 'self', resourceFilter: 'gold', sourceFilter: 'action' } }],
  },
  golden_ring: {
    id: 'golden_ring',
    name: 'Golden Ring',
    god: 'gold',
    cost: { gold: 2, any: 1 },
    description: 'When another player gains gold, you gain 1 gold',
    handlers: [{ eventType: 'resource.gained', config: { triggerOn: 'others', resourceFilter: 'gold' } }],
  },
  gold_crown: {
    id: 'gold_crown',
    name: 'Gold Crown',
    god: 'gold',
    cost: { gold: 4, any: 2 },
    description: 'Game end: +1 Glory per 2 gold you own',
    handlers: [{ eventType: 'phase.game_end', config: {} }],
  },
  gold_vault: {
    id: 'gold_vault',
    name: 'Gold Vault',
    god: 'gold',
    cost: { gold: 2, any: 1 },
    description: 'Your resources cannot be stolen',
    modifiers: [{ type: 'steal_immunity' }],
  },

  // === BLACK ===
  onyx_spyglass: {
    id: 'onyx_spyglass',
    name: 'Onyx Spyglass',
    god: 'black',
    cost: { black: 3 },
    description: 'When another player buys a power card, gain 1 black',
    handlers: [{ eventType: 'card.bought', config: { triggerOn: 'others' } }],
  },
  voodoo_doll: {
    id: 'voodoo_doll',
    name: 'Voodoo Doll',
    god: 'black',
    cost: { black: 3, any: 1 },
    description: 'At end of each round, choose a player — they lose 2 Glory',
    handlers: [{ eventType: 'phase.round_end', config: { requiresDecision: true } }],
  },
  thieves_gloves: {
    id: 'thieves_gloves',
    name: "Thieves' Gloves",
    god: 'black',
    cost: { black: 1, any: 2 },
    description: 'When you take a steal action, also gain +1 of any resource',
    handlers: [{ eventType: 'resource.stolen', config: { triggerOn: 'self' } }],
  },
  tome_of_deeds: {
    id: 'tome_of_deeds',
    name: 'Tome of Deeds',
    god: 'black',
    cost: { black: 2, any: 1 },
    description: 'Your Glory cannot be stolen',
    modifiers: [{ type: 'glory_steal_immunity' }],
  },
  obsidian_coin: {
    id: 'obsidian_coin',
    name: 'Obsidian Coin',
    god: 'black',
    cost: { black: 2, any: 1 },
    description: 'Any resource counts as black for purchases',
    modifiers: [{ type: 'wildcard_black' }],
  },
  cursed_blade: {
    id: 'cursed_blade',
    name: 'Cursed Blade',
    god: 'black',
    cost: { black: 2, any: 2 },
    description: 'Your steal actions and shops steal an extra 1 Glory',
    handlers: [{ eventType: 'glory.stolen', config: { triggerOn: 'self' } }],
  },

  // === GREEN ===
  hourglass: {
    id: 'hourglass',
    name: 'Hourglass',
    god: 'green',
    cost: { green: 4, any: 2 },
    description: 'You can take actions at occupied spaces',
    modifiers: [{ type: 'ignore_occupied' }],
  },
  capacitor: {
    id: 'capacitor',
    name: 'Capacitor',
    god: 'green',
    cost: { green: 1, any: 2 },
    description: 'When you repeat an action during your turn, +1 green',
    handlers: [{ eventType: 'action.repeated', config: { triggerOn: 'self' } }],
  },
  crystal_watch: {
    id: 'crystal_watch',
    name: 'Crystal Watch',
    god: 'green',
    cost: { green: 3 },
    description: '+3 green when purchased and at the start of each round',
    onPurchase: { type: 'resource_gain', resources: { green: 3 } },
    handlers: [{ eventType: 'phase.round_start', config: { effect: { type: 'resource_gain', resources: { green: 3 } } } }],
  },
  diadem_of_expertise: {
    id: 'diadem_of_expertise',
    name: 'Diadem of Expertise',
    god: 'green',
    cost: { green: 3, any: 1 },
    description: 'Your repeat actions trigger Glory condition twice',
    handlers: [{ eventType: 'action.repeated', config: { triggerOn: 'self', doubleGlory: true } }],
  },
  crystal_ball: {
    id: 'crystal_ball',
    name: 'Crystal Ball',
    god: 'green',
    cost: { green: 2, any: 1 },
    description: 'You can repeat actions from unoccupied spaces',
    modifiers: [{ type: 'repeat_unoccupied' }],
  },
  emerald_coin: {
    id: 'emerald_coin',
    name: 'Emerald Coin',
    god: 'green',
    cost: { green: 2, any: 1 },
    description: 'Any resource counts as green for purchases',
    modifiers: [{ type: 'wildcard_green' }],
  },

  // === YELLOW ===
  horn_of_plenty: {
    id: 'horn_of_plenty',
    name: 'Horn of Plenty',
    god: 'yellow',
    cost: { yellow: 3, any: 1 },
    description: 'Gain 1 of each active color now and at the start of each round',
    onPurchase: { type: 'resource_gain_each_color' },
    handlers: [{ eventType: 'phase.round_start', config: { effect: { type: 'resource_gain_each_color' } } }],
  },
  prismatic_gem: {
    id: 'prismatic_gem',
    name: 'Prismatic Gem',
    god: 'yellow',
    cost: { yellow: 2, any: 1 },
    description: 'Yellow resources count as any color for purchases',
    modifiers: [{ type: 'wildcard_yellow' }],
  },
  rainbow_crest: {
    id: 'rainbow_crest',
    name: 'Rainbow Crest',
    god: 'yellow',
    cost: { yellow: 1, any: 2 },
    description: 'When you gain resources of 2+ different colors in one action, gain +1 of any color',
    handlers: [{ eventType: 'resource.gained', config: { triggerOn: 'self', multiColorTrigger: true } }],
  },
  alchemists_trunk: {
    id: 'alchemists_trunk',
    name: "Alchemist's Trunk",
    god: 'yellow',
    cost: { yellow: 2, any: 2 },
    description: 'Now and at the start of each round, redistribute all your resources however you want (same total)',
    onPurchase: { type: 'redistribute' },
    handlers: [{ eventType: 'phase.round_start', config: { requiresDecision: true, decisionType: 'redistribute' } }],
  },
  abundance_charm: {
    id: 'abundance_charm',
    name: 'Abundance Charm',
    god: 'yellow',
    cost: { yellow: 1, any: 2 },
    description: 'Your basic gain actions (+2/+3 resource actions) gain +1 extra',
    handlers: [{ eventType: 'resource.gained', config: { triggerOn: 'self', basicGainBonus: true } }],
  },
  travelers_journal: {
    id: 'travelers_journal',
    name: "Traveler's Journal",
    god: 'yellow',
    cost: { yellow: 2, any: 1 },
    description: 'When you gain 2+ different resource colors on your turn, +1 Glory',
    handlers: [{ eventType: 'phase.turn_end', config: { triggerOn: 'self' } }],
  },
};

export default powerCards;
