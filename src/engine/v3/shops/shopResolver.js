/**
 * Patrons v3 — Shop Resolver
 *
 * Routes shopId to the correct benefit handler.
 * Handles cost validation, payment, and modifier checks.
 */

import { hasModifier, getShopDef, getShopCost, canAfford, payCost, getRepeatableActions, getActionTier, isRepeatExcluded } from '../rules.js';

// --- Helpers (inline for now) ---

function addResources(state, playerId, resources) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const newResources = { ...p.resources };
    Object.entries(resources).forEach(([color, amount]) => {
      newResources[color] = (newResources[color] || 0) + amount;
    });
    return { ...p, resources: newResources, lastGain: { ...resources } };
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

function removeGlory(state, playerId, amount) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, glory: Math.max(0, (p.glory || 0) - amount) };
  });
  return { ...state, players };
}

function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
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

// --- Shop Benefit Handlers ---

/** gold_weak: Gain 2 gold */
function goldWeak(state, playerId) {
  const newState = addResources(state, playerId, { gold: 2 });
  return { state: newState, log: ['Gold shop: +2 gold'] };
}

/** gold_strong: Double your gold */
function goldStrong(state, playerId) {
  const player = getPlayer(state, playerId);
  const currentGold = player.resources.gold || 0;
  const newState = addResources(state, playerId, { gold: currentGold });
  return { state: newState, log: [`Gold shop: doubled gold (${currentGold} -> ${currentGold * 2})`] };
}

/** gold_vp: +4 Glory */
function goldVp(state, playerId) {
  const newState = addGlory(state, playerId, 4, 'gold_vp_shop');
  return { state: newState, log: ['Gold shop: +4 Glory'] };
}

/** black_weak: Steal 1 Glory from target */
function blackWeak(state, playerId, decisions = {}) {
  if (!decisions.targetPlayer) {
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to steal 1 Glory from',
        excludePlayer: playerId,
      },
    };
  }

  const targetId = decisions.targetPlayer;

  if (hasModifier(state, targetId, 'glory_steal_immunity')) {
    return { state, log: ['Black shop: steal blocked (target has Glory immunity)'] };
  }

  const target = getPlayer(state, targetId);
  const stolen = Math.min(1, target.glory || 0);
  let newState = state;
  if (stolen > 0) {
    newState = removeGlory(newState, targetId, stolen);
    newState = addGlory(newState, playerId, stolen, 'black_weak_shop');
  }

  return { state: newState, log: [`Black shop: stole ${stolen} Glory from ${targetId}`] };
}

/** black_strong: Steal 3 Glory from target */
function blackStrong(state, playerId, decisions = {}) {
  if (!decisions.targetPlayer) {
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to steal 3 Glory from',
        excludePlayer: playerId,
      },
    };
  }

  const targetId = decisions.targetPlayer;

  if (hasModifier(state, targetId, 'glory_steal_immunity')) {
    return { state, log: ['Black shop: steal blocked (target has Glory immunity)'] };
  }

  const target = getPlayer(state, targetId);
  const stolen = Math.min(3, target.glory || 0);
  let newState = state;
  if (stolen > 0) {
    newState = removeGlory(newState, targetId, stolen);
    newState = addGlory(newState, playerId, stolen, 'black_strong_shop');
  }

  return { state: newState, log: [`Black shop: stole ${stolen} Glory from ${targetId}`] };
}

/** black_vp: Steal 2 Glory from each other player */
function blackVp(state, playerId) {
  let newState = state;
  let totalStolen = 0;
  const log = [];

  for (const player of state.players) {
    if (player.id === playerId) continue;

    if (hasModifier(newState, player.id, 'glory_steal_immunity')) {
      log.push(`${player.id}: steal blocked (Glory immunity)`);
      continue;
    }

    const stolen = Math.min(2, player.glory || 0);
    if (stolen > 0) {
      newState = removeGlory(newState, player.id, stolen);
      totalStolen += stolen;
      log.push(`Stole ${stolen} Glory from ${player.id}`);
    }
  }

  if (totalStolen > 0) {
    newState = addGlory(newState, playerId, totalStolen, 'black_vp_shop');
  }

  return { state: newState, log: [`Black VP shop: stole Glory from other players`, ...log] };
}

/** green_weak: Repeat one Tier 1 action */
function greenWeak(state, playerId, decisions = {}) {
  if (!decisions.actionChoice) {
    // Only Tier 1 repeatable actions
    const repeatable = getRepeatableActions(state, playerId)
      .filter(id => {
        const tier = getActionTier(id, state.gods);
        return tier === 1;
      });

    return {
      state,
      log: [],
      pendingDecision: {
        type: 'actionChoice',
        title: 'Choose a Tier 1 action to repeat',
        options: repeatable,
      },
    };
  }

  const actionId = decisions.actionChoice;
  const tier = getActionTier(actionId, state.gods);

  if (tier !== 1) {
    return { state, log: ['Green shop: action must be Tier 1'] };
  }

  if (isRepeatExcluded(actionId)) {
    return { state, log: [`Green shop: cannot repeat ${actionId}`] };
  }

  return {
    state,
    log: [`Green shop: repeating ${actionId}`],
    executeAction: {
      playerId,
      actionId,
      decisions: {},
      recursionDepth: 1,
    },
  };
}

/** green_strong: Copy another player's last action */
function greenStrong(state, playerId) {
  const roundActions = state.roundActions || [];
  if (roundActions.length === 0) {
    return { state, log: ['Green shop: no previous action to copy'] };
  }

  // Find last action by another player
  const lastOtherAction = [...roundActions].reverse().find(ra => ra.playerId !== playerId);
  if (!lastOtherAction) {
    return { state, log: ['Green shop: no action by another player to copy'] };
  }

  if (isRepeatExcluded(lastOtherAction.actionId)) {
    return { state, log: [`Green shop: cannot copy ${lastOtherAction.actionId}`] };
  }

  return {
    state,
    log: [`Green shop: copying ${lastOtherAction.actionId} from ${lastOtherAction.playerId}`],
    executeAction: {
      playerId,
      actionId: lastOtherAction.actionId,
      decisions: {},
      recursionDepth: 1,
    },
  };
}

/** green_vp: +4 Glory + extra turn */
function greenVp(state, playerId) {
  let newState = addGlory(state, playerId, 4, 'green_vp_shop');

  const players = newState.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, extraTurns: (p.extraTurns || 0) + 1 };
  });
  newState = { ...newState, players };

  return { state: newState, log: ['Green VP shop: +4 Glory, extra turn'] };
}

/** yellow_weak: Double your next resource gain */
function yellowWeak(state, playerId) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, effects: [...(p.effects || []), 'doubleNextGain'] };
  });
  const newState = { ...state, players };
  return { state: newState, log: ['Yellow shop: next resource gain will be doubled'] };
}

/** yellow_strong: Trigger Yellow Glory condition (distinct colors owned = Glory) */
function yellowStrong(state, playerId) {
  const player = getPlayer(state, playerId);
  const resources = player.resources || {};
  const colorsOwned = Object.keys(resources).filter(c => (resources[c] || 0) > 0);
  const count = colorsOwned.length;

  if (count <= 0) {
    return { state, log: ['Yellow shop: no resources owned, no Glory gained'] };
  }

  const newState = addGlory(state, playerId, count, 'yellow_strong_shop');
  return { state: newState, log: [`Yellow shop: +${count} Glory (${count} different colors owned)`] };
}

/** yellow_vp: +1 Glory per complete set of all active colors owned */
function yellowVp(state, playerId) {
  const player = getPlayer(state, playerId);
  const activeGods = state.gods || ['gold', 'black', 'green', 'yellow'];
  const resources = player.resources || {};

  // A complete set = 1 of each active color. Count = min across all active colors.
  const completeSets = Math.min(
    ...activeGods.map(color => resources[color] || 0)
  );

  if (completeSets <= 0) {
    return { state, log: ['Yellow VP shop: no complete sets, no Glory gained'] };
  }

  const newState = addGlory(state, playerId, completeSets, 'yellow_vp_shop');
  return { state: newState, log: [`Yellow VP shop: +${completeSets} Glory (${completeSets} complete sets)`] };
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
 * @returns {{ state, log, pendingDecision?, executeAction? }}
 */
export function resolveShop(state, playerId, shopId, decisions = {}) {
  const handler = shopBenefits[shopId];
  if (!handler) {
    return { state, log: [`Unknown shop: ${shopId}`] };
  }
  return handler(state, playerId, decisions);
}
