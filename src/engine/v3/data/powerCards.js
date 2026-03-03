/**
 * Patrons v3 — Power Card Definitions (Balance Rework)
 *
 * Pure data. No logic. All 24 power cards in a flat, engine-friendly
 * structure keyed by card ID.
 *
 * Each card has:
 *   - id, name, god (color), cost
 *   - description (human-readable)
 *   - handlers[] — event triggers the event system registers
 *   - modifiers[] — static passive effects checked by hasModifier()
 *   - onPurchase — one-time effect on buy
 */

export const powerCards = {
  // === GOLD (6 cards) ===
  golden_scepter: {
    id: 'golden_scepter',
    name: 'Golden Scepter',
    god: 'gold',
    cost: { gold: 3, any: 1 },
    description: '+1 extra gold when gaining gold from actions (actions only)',
    handlers: [{ eventType: 'resource.gained', config: { triggerOn: 'self', resourceFilter: 'gold', sourceFilter: 'action' } }],
  },
  rainbow_scepter: {
    id: 'rainbow_scepter',
    name: 'Rainbow Scepter',
    god: 'gold',
    cost: { gold: 1, any: 3 },
    description: '+1 any other color when gaining gold from actions',
    handlers: [{ eventType: 'resource.gained', config: { triggerOn: 'self', resourceFilter: 'gold', sourceFilter: 'action' } }],
  },
  golden_ring: {
    id: 'golden_ring',
    name: 'Golden Ring',
    god: 'gold',
    cost: { gold: 2, any: 2 },
    description: '+1 gold at start of each turn',
    handlers: [{ eventType: 'turn.start', config: { triggerOn: 'self' }, frequency: 'once_per_turn' }],
  },
  gold_crown: {
    id: 'gold_crown',
    name: 'Gold Crown',
    god: 'gold',
    cost: { gold: 3, any: 2 },
    description: 'Game end: +1 Favor per 2 gold',
    handlers: [{ eventType: 'phase.game_end', config: {} }],
  },
  golden_scope: {
    id: 'golden_scope',
    name: 'Golden Scope',
    god: 'gold',
    cost: { gold: 2, any: 2 },
    description: 'When a player steals from you, they lose 1 Favor',
    handlers: [{ eventType: 'resource.stolen', config: { triggerOn: 'target' } }],
  },
  golden_idol: {
    id: 'golden_idol',
    name: 'Golden Idol',
    god: 'gold',
    cost: { gold: 4, any: 1 },
    description: 'Whenever you gain Favor from a gold source, +1 extra Favor',
    handlers: [{ eventType: 'glory.gained', config: { triggerOn: 'self', sourceFilter: 'gold' } }],
  },

  // === BLACK (6 cards) ===
  thieves_gloves: {
    id: 'thieves_gloves',
    name: "Thieves' Gloves",
    god: 'black',
    cost: { black: 1, any: 2 },
    description: 'When you steal resources, +1 any resource',
    handlers: [{ eventType: 'resource.stolen', config: { triggerOn: 'self' } }],
  },
  onyx_spyglass: {
    id: 'onyx_spyglass',
    name: 'Onyx Spyglass',
    god: 'black',
    cost: { black: 2, any: 1 },
    description: 'When another player buys a power card, gain 1 black',
    handlers: [{ eventType: 'card.bought', config: { triggerOn: 'others' } }],
  },
  voodoo_doll: {
    id: 'voodoo_doll',
    name: 'Voodoo Doll',
    god: 'black',
    cost: { black: 2, any: 2 },
    description: 'End of round, steal 2 Favor from a player (triggers Favor condition)',
    handlers: [{ eventType: 'phase.round_end', config: { requiresDecision: true } }],
  },
  skeleton_key: {
    id: 'skeleton_key',
    name: 'Skeleton Key',
    god: 'black',
    cost: { black: 2, any: 2 },
    description: 'Non-black god actions → steal 1 resource from a player on that god',
    handlers: [{ eventType: 'action.executed', config: { triggerOn: 'self', excludeGod: 'black' } }],
  },
  poisoned_blade: {
    id: 'poisoned_blade',
    name: 'Poisoned Blade',
    god: 'black',
    cost: { black: 3, any: 2 },
    description: 'Your steal actions/shops steal extra 1 Favor',
    handlers: [{ eventType: 'glory.stolen', config: { triggerOn: 'self' } }],
  },
  tome_of_deeds: {
    id: 'tome_of_deeds',
    name: 'Tome of Deeds',
    god: 'black',
    cost: { black: 1, any: 3 },
    description: 'Your Favor cannot be reduced',
    modifiers: [{ type: 'glory_reduction_immunity' }],
  },

  // === GREEN (6 cards) ===
  flux_capacitor: {
    id: 'flux_capacitor',
    name: 'Flux Capacitor',
    god: 'green',
    cost: { green: 2, any: 2 },
    description: 'When you gain green from a green god action, +1 extra green',
    handlers: [{ eventType: 'resource.gained', config: { triggerOn: 'self', resourceFilter: 'green', sourceFilter: 'action', godFilter: 'green' } }],
  },
  resonance_crystal: {
    id: 'resonance_crystal',
    name: 'Resonance Crystal',
    god: 'green',
    cost: { green: 1, any: 2 },
    description: 'When you repeat another god\'s action, gain 1 of that god\'s color',
    handlers: [{ eventType: 'action.repeated', config: { triggerOn: 'self', excludeGod: 'green' } }],
  },
  temporal_patent: {
    id: 'temporal_patent',
    name: 'Temporal Patent',
    god: 'green',
    cost: { green: 2, any: 1 },
    description: 'When you repeat a player\'s action, that player loses 2 Favor',
    handlers: [{ eventType: 'action.repeated', config: { triggerOn: 'self', targetPlayerAction: true } }],
  },
  diadem_of_expertise: {
    id: 'diadem_of_expertise',
    name: 'Diadem of Expertise',
    god: 'green',
    cost: { green: 6, any: 2 },
    description: 'Your Favor condition triggers twice per repeat/copy',
    handlers: [{ eventType: 'action.repeated', config: { triggerOn: 'self', doubleGlory: true } }],
  },
  timeline_splitter: {
    id: 'timeline_splitter',
    name: 'Timeline Splitter',
    god: 'green',
    cost: { green: 4, any: 2 },
    description: 'You can place workers on occupied action spaces',
    modifiers: [{ type: 'ignore_occupied' }],
  },
  chrono_compass: {
    id: 'chrono_compass',
    name: 'Chrono Compass',
    god: 'green',
    cost: { green: 1, any: 2 },
    description: 'At start of each round, choose your position in turn order',
    handlers: [{ eventType: 'phase.round_start', config: { requiresDecision: true, decisionType: 'turnOrderChoice' } }],
  },

  // === YELLOW (6 cards) ===
  rainbow_crest: {
    id: 'rainbow_crest',
    name: 'Rainbow Crest',
    god: 'yellow',
    cost: { yellow: 2, any: 1 },
    description: '+1 any when gaining 2+ colors (action or shop)',
    handlers: [{ eventType: 'resource.gained', config: { triggerOn: 'self', multiColorTrigger: true } }],
  },
  extraction_vial: {
    id: 'extraction_vial',
    name: 'Extraction Vial',
    god: 'yellow',
    cost: { yellow: 2, any: 1 },
    description: 'When you gain resources from a non-yellow god\'s action, +1 yellow',
    handlers: [{ eventType: 'resource.gained', config: { triggerOn: 'self', sourceFilter: 'action', excludeGod: 'yellow' } }],
  },
  slag_catcher: {
    id: 'slag_catcher',
    name: 'Slag Catcher',
    god: 'yellow',
    cost: { yellow: 1, any: 2 },
    description: 'Spent 3+ resources in a turn → gain 1 yellow (once/turn)',
    handlers: [{ eventType: 'phase.turn_end', config: { triggerOn: 'self' }, frequency: 'once_per_turn' }],
  },
  alchemists_trunk: {
    id: 'alchemists_trunk',
    name: "Alchemist's Trunk",
    god: 'yellow',
    cost: { yellow: 2, any: 2 },
    description: 'Redistribute all resources (same total) now + each round',
    onPurchase: { type: 'redistribute' },
    handlers: [{ eventType: 'phase.round_start', config: { requiresDecision: true, decisionType: 'redistribute' } }],
  },
  philosophers_stone: {
    id: 'philosophers_stone',
    name: "Philosopher's Stone",
    god: 'yellow',
    cost: { yellow: 2, any: 2 },
    description: 'All colors count as any color for purchases',
    modifiers: [{ type: 'wildcard_all' }],
  },
  horn_of_plenty: {
    id: 'horn_of_plenty',
    name: 'Horn of Plenty',
    god: 'yellow',
    cost: { yellow: 3, any: 2 },
    description: '+1 of each active color now + start of each round',
    onPurchase: { type: 'resource_gain_each_color' },
    handlers: [{ eventType: 'phase.round_start', config: { effect: { type: 'resource_gain_each_color' } } }],
  },
};

export default powerCards;
