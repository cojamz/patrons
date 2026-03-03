/**
 * Patrons v3 — Shop Resolver (Balance Rework)
 *
 * Routes shopId to the correct benefit handler.
 * Handles cost validation, payment, and modifier checks.
 *
 * Shop handlers: (state, playerId, decisions?) => { state, log, pendingDecision?, executeAction? }
 */

import { hasModifier, getShopDef, getShopCost, canAfford, payCost } from '../rules.js';

// --- Helpers ---

function addResources(state, playerId, resources) {
  const player = state.players.find(p => p.id === playerId);
  const hasDouble = player?.effects?.includes('doubleNextGain');
  const effective = hasDouble
    ? Object.fromEntries(Object.entries(resources).map(([c, a]) => [c, a * 2]))
    : resources;
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const newResources = { ...p.resources };
    Object.entries(effective).forEach(([color, amount]) => {
      newResources[color] = (newResources[color] || 0) + amount;
    });
    let newEffects = p.effects;
    if (hasDouble) {
      newEffects = [...(p.effects || [])];
      const idx = newEffects.indexOf('doubleNextGain');
      if (idx >= 0) newEffects.splice(idx, 1);
    }
    return { ...p, resources: newResources, lastGain: { ...effective }, ...(hasDouble ? { effects: newEffects } : {}) };
  });
  return { ...state, players };
}

function removeResources(state, playerId, resources) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const newResources = { ...p.resources };
    Object.entries(resources).forEach(([color, amount]) => {
      newResources[color] = Math.max(0, (newResources[color] || 0) - amount);
    });
    return { ...p, resources: newResources };
  });
  return { ...state, players };
}

function addGlory(state, playerId, amount, source) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const glorySources = { ...p.glorySources, [source]: ((p.glorySources || {})[source] || 0) + amount };
    return { ...p, glory: (p.glory || 0) + amount, glorySources };
  });
  return { ...state, players };
}

function removeGlory(state, playerId, amount, source) {
  if (hasModifier(state, playerId, 'glory_reduction_immunity')) return state;
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const newGlory = (p.glory || 0) - amount;
    const glorySources = source
      ? { ...(p.glorySources || {}), [source]: ((p.glorySources || {})[source] || 0) - amount }
      : p.glorySources;
    return { ...p, glory: newGlory, glorySources };
  });
  return { ...state, players };
}

function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

function formatResources(resources) {
  return Object.entries(resources)
    .filter(([, amt]) => amt > 0)
    .map(([color, amt]) => `${amt} ${color}`)
    .join(', ');
}

function hasAegis(state, playerId) {
  return state.aegisHolder === playerId;
}

// --- Cost Checking ---

/**
 * Check if player can afford a shop.
 */
export function canAffordShop(state, playerId, shopId) {
  const cost = getShopCost(state, playerId, shopId);
  if (!cost) return false;
  return canAfford(state, playerId, cost);
}

/**
 * Pay for a shop. Returns { state, canAfford, pendingDecision? }
 */
export function payShopCost(state, playerId, shopId, decisions = {}) {
  const cost = getShopCost(state, playerId, shopId);
  if (!cost) return { state, canAfford: false };
  return payCost(state, playerId, cost, decisions);
}

// ============================================================
// GOLD SHOPS
// ============================================================

/** gold_weak: 1 gold → +2 Favor */
function goldWeak(state, playerId) {
  const newState = addGlory(state, playerId, 2, 'gold_weak_shop');
  return { state: newState, log: ['Gold shop: +2 Favor'] };
}

/** gold_strong: 3 gold → gain Aegis token */
function goldStrong(state, playerId) {
  let newState = state;

  // If someone else holds Aegis, they lose it
  const previousHolder = state.aegisHolder;
  if (previousHolder && previousHolder !== playerId) {
    // Previous holder regains their power card slot (Aegis no longer occupies it)
    // Just clear the holder — the slot is freed automatically
  }

  // Transfer Aegis to purchaser
  newState = { ...newState, aegisHolder: playerId };

  const log = previousHolder && previousHolder !== playerId
    ? [`Gold shop: gained Aegis (taken from ${previousHolder}). Resources cannot be stolen.`]
    : ['Gold shop: gained Aegis. Resources cannot be stolen.'];

  return { state: newState, log };
}

/** gold_vp: 4 gold → trigger Gold Favor condition now (+1 per 2 gold owned) */
function goldVp(state, playerId) {
  const player = getPlayer(state, playerId);
  const goldOwned = player.resources.gold || 0;
  const favorGained = Math.floor(goldOwned / 2);

  if (favorGained <= 0) {
    return { state, log: ['Gold VP shop: no gold to score (0 Favor)'] };
  }

  const newState = addGlory(state, playerId, favorGained, 'gold_vp_shop');
  return { state: newState, log: [`Gold VP shop: +${favorGained} Favor (${goldOwned} gold / 2)`] };
}

// ============================================================
// BLACK SHOPS
// ============================================================

/** black_weak: 1 black → steal 1 Favor from a player (once per turn) */
function blackWeak(state, playerId, decisions = {}) {
  if (!decisions.targetPlayer) {
    const validTargets = state.players
      .filter(p => p.id !== playerId && !hasModifier(state, p.id, 'glory_reduction_immunity'))
      .map(p => p.id);
    if (validTargets.length === 0) {
      return { state, log: ['Black shop: no valid targets (all immune)'] };
    }
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to steal 1 Favor from',
        excludePlayer: playerId,
        options: validTargets,
      },
    };
  }

  const targetId = decisions.targetPlayer;
  if (hasModifier(state, targetId, 'glory_reduction_immunity')) {
    return { state, log: ['Black shop: steal blocked (target has Favor immunity)'] };
  }

  const target = getPlayer(state, targetId);
  const stolen = Math.min(1, Math.max(0, target.glory || 0));
  let newState = state;
  const gloryStolen = [];
  if (stolen > 0) {
    newState = removeGlory(newState, targetId, stolen, 'black_weak_shop_victim');
    newState = addGlory(newState, playerId, stolen, 'black_weak_shop');
    gloryStolen.push({ playerId, targetPlayerId: targetId, amount: stolen });
  }

  return {
    state: newState,
    log: [`Black shop: stole ${stolen} Favor from ${targetId}`],
    gloryStolen,
    isStealing: true,
  };
}

/** black_strong: 3 black → double next theft */
function blackStrong(state, playerId) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, effects: [...(p.effects || []), 'doubleNextTheft'] };
  });
  const newState = { ...state, players };
  return { state: newState, log: ['Black shop: next steal will be doubled'] };
}

/** black_vp: 5 black → permanently +1 Favor per steal */
function blackVp(state, playerId) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const permanentBuffs = [...(p.permanentBuffs || []), 'extra_steal_favor'];
    return { ...p, permanentBuffs };
  });
  const newState = { ...state, players };
  return { state: newState, log: ['Black VP shop: permanently +1 extra Favor per steal action'] };
}

// ============================================================
// GREEN SHOPS
// ============================================================

/** green_weak: 1 green → place your next worker now, no buy phase after */
function greenWeak(state, playerId) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, effects: [...(p.effects || []), 'tempoPlay'] };
  });
  const newState = { ...state, players };
  return { state: newState, log: ['Green shop: place your next worker immediately (no buy phase)'] };
}

/** green_strong: 3 green → next repeated action happens twice */
function greenStrong(state, playerId) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, effects: [...(p.effects || []), 'repeatHappensTwice'] };
  });
  const newState = { ...state, players };
  return { state: newState, log: ['Green shop: next repeated action will happen twice'] };
}

/** green_vp: 5 green → permanently +1 Favor per repeat (upgrades condition from +1 to +2) */
function greenVp(state, playerId) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const permanentBuffs = [...(p.permanentBuffs || []), 'extra_repeat_favor'];
    return { ...p, permanentBuffs };
  });
  const newState = { ...state, players };
  return { state: newState, log: ['Green VP shop: permanently +1 extra Favor per repeat/copy'] };
}

// ============================================================
// YELLOW SHOPS
// ============================================================

/** yellow_weak: 1 yellow → gain 2 any colors */
function yellowWeak(state, playerId, decisions = {}) {
  if (!decisions.gemSelection) {
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'gemSelection',
        count: 2,
        title: 'Choose 2 resources to gain',
      },
    };
  }

  const selection = decisions.gemSelection;
  const total = Object.values(selection).reduce((sum, v) => sum + v, 0);
  if (total !== 2) {
    return { state, log: ['Invalid selection: must choose exactly 2 resources'] };
  }

  const newState = addResources(state, playerId, selection);
  return { state: newState, log: [`Yellow shop: gained ${formatResources(selection)}`] };
}

/** yellow_strong: 2 yellow → double your next resource gain */
function yellowStrong(state, playerId) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, effects: [...(p.effects || []), 'doubleNextGain'] };
  });
  const newState = { ...state, players };
  return { state: newState, log: ['Yellow shop: next resource gain will be doubled'] };
}

/** yellow_vp: 4 yellow → spend all non-yellow resources, +1 Favor per resource spent */
function yellowVp(state, playerId) {
  const player = getPlayer(state, playerId);
  const activeGods = state.gods || ['gold', 'black', 'green', 'yellow'];
  let totalSpent = 0;
  const spent = {};

  for (const color of activeGods) {
    if (color === 'yellow') continue;
    const amount = player.resources[color] || 0;
    if (amount > 0) {
      spent[color] = amount;
      totalSpent += amount;
    }
  }

  if (totalSpent <= 0) {
    return { state, log: ['Yellow VP shop: no non-yellow resources to spend (0 Favor)'] };
  }

  let newState = removeResources(state, playerId, spent);
  newState = addGlory(newState, playerId, totalSpent, 'yellow_vp_shop');

  return {
    state: newState,
    log: [`Yellow VP shop: spent ${formatResources(spent)} → +${totalSpent} Favor`],
  };
}

// --- Shop Router ---

const shopBenefits = {
  gold_weak: goldWeak,
  gold_strong: goldStrong,
  gold_vp: goldVp,
  black_weak: blackWeak,
  black_strong: blackStrong,
  black_vp: blackVp,
  green_weak: greenWeak,
  green_strong: greenStrong,
  green_vp: greenVp,
  yellow_weak: yellowWeak,
  yellow_strong: yellowStrong,
  yellow_vp: yellowVp,
};

/**
 * Resolve a shop benefit.
 * @returns {{ state, log, pendingDecision?, executeAction?, gloryStolen?, isStealing? }}
 */
export function resolveShop(state, playerId, shopId, decisions = {}) {
  const handler = shopBenefits[shopId];
  if (!handler) {
    return { state, log: [`Unknown shop: ${shopId}`] };
  }
  return handler(state, playerId, decisions);
}
