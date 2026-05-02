/**
 * Patrons v3 — Rules & Validation
 *
 * Pure functions for querying game state: available actions,
 * affordability checks, cost payment, and repeat eligibility.
 */

import gods from './data/gods.js';
import { powerCards } from './data/powerCards.js';

// --- Action IDs that cannot be repeated (only Eternity — infinite replay risk) ---
// T1/T2 green repeat actions CAN be targets of other repeats (e.g. Rewind → Foresight).
// The recursion depth limit (5) prevents infinite chains.
// Only Eternity is globally excluded from repeat targets (infinite replay risk).
// Other green repeat actions CAN be targets of other repeats (e.g. Echo → Relive).
// Each handler self-excludes from its own options. Recursion depth limit (5) prevents chains.
const REPEAT_EXCLUDED = new Set([
  'green_eternity',   // repeat all — can't be repeated
]);

// --- Modifier checking ---

/**
 * Check if a player has a specific modifier from their champion power cards.
 * Uses powerCards.js definitions (card.modifiers[].type).
 */
export function hasModifier(state, playerId, modifierType) {
  const champion = (state.champions || {})[playerId];
  if (!champion || !champion.powerCards) return false;

  for (const cardId of champion.powerCards) {
    const card = powerCards[cardId];
    if (!card || !card.modifiers) continue;
    if (card.modifiers.some(mod => mod.type === modifierType)) return true;
  }
  return false;
}

/**
 * Find a power card definition by its id across all gods.
 */
function findPowerCard(cardId) {
  for (const god of Object.values(gods)) {
    const card = god.powerCards.find(c => c.id === cardId);
    if (card) return card;
  }
  return null;
}

// --- Action Queries ---

/**
 * Get all action definitions for the active gods.
 */
export function getAllActions(state) {
  const activeGods = state.gods || ['gold', 'black', 'green', 'yellow'];
  const actions = [];
  for (const godColor of activeGods) {
    const god = gods[godColor];
    if (god) actions.push(...god.actions);
  }
  return actions;
}

/**
 * Get available action IDs for this round.
 * Filters by tier unlock, occupied spaces, and nullified spaces.
 */
export function getAvailableActions(state, playerId = null) {
  // No more actions if worker already placed this turn
  if (state.workerPlacedThisTurn) {
    return [];
  }

  // No actions if player has no workers left
  if (playerId) {
    const player = state.players?.find(p => p.id === playerId);
    if (player && player.workersLeft <= 0) return [];
  }

  const round = state.round || 1;
  const allActions = getAllActions(state);
  const occupied = state.occupiedSpaces || {};
  const nullified = state.nullifiedSpaces || {};

  const canIgnoreOccupied = playerId && hasModifier(state, playerId, 'ignore_occupied');

  // Get player's total resources for cost checks
  const player = playerId ? state.players?.find(p => p.id === playerId) : null;
  const totalResources = player
    ? Object.values(player.resources || {}).reduce((sum, v) => sum + Math.max(0, v), 0)
    : Infinity;

  return allActions
    .filter(action => action.tier <= round)
    .filter(action => !nullified[action.id])
    .filter(action => {
      if (canIgnoreOccupied) return true;
      return !occupied[action.id];
    })
    .filter(action => {
      // Filter out trade actions the player can't afford
      if (!action.cost) return true;
      const anyCost = action.cost.any || 0;
      return totalResources >= anyCost;
    })
    .map(action => action.id);
}

/**
 * Get which god color owns this action.
 */
export function getActionGod(actionId, activeGods) {
  const godColors = activeGods || ['gold', 'black', 'green', 'yellow'];
  for (const color of godColors) {
    const god = gods[color];
    if (!god) continue;
    if (god.actions.some(a => a.id === actionId)) return color;
  }
  return null;
}

/**
 * Get the tier of an action.
 */
export function getActionTier(actionId, activeGods) {
  const godColors = activeGods || ['gold', 'black', 'green', 'yellow'];
  for (const color of godColors) {
    const god = gods[color];
    if (!god) continue;
    const action = god.actions.find(a => a.id === actionId);
    if (action) return action.tier;
  }
  return null;
}

/**
 * Get the action definition object by id.
 */
export function getActionDef(actionId, activeGods) {
  const godColors = activeGods || ['gold', 'black', 'green', 'yellow'];
  for (const color of godColors) {
    const god = gods[color];
    if (!god) continue;
    const action = god.actions.find(a => a.id === actionId);
    if (action) return action;
  }
  return null;
}

/**
 * Returns true if the action cannot be repeated.
 */
export function isRepeatExcluded(actionId) {
  return REPEAT_EXCLUDED.has(actionId);
}

/**
 * Get actions a player can repeat.
 * - Their own placed workers this round (from roundActions)
 * - Excluding repeat/copy actions
 * - If repeat_unoccupied modifier: also include unoccupied available actions
 */
export function getRepeatableActions(state, playerId) {
  const roundActions = state.roundActions || [];
  const round = state.round || 1;

  // Player's own placed actions this round, minus repeat-excluded
  const ownActions = roundActions
    .filter(ra => ra.playerId === playerId)
    .map(ra => ra.actionId)
    .filter(id => !isRepeatExcluded(id));

  // Deduplicate
  const repeatable = [...new Set(ownActions)];

  // If player has repeat_unoccupied modifier, add unoccupied actions too
  if (hasModifier(state, playerId, 'repeat_unoccupied')) {
    const occupied = state.occupiedSpaces || {};
    const allActions = getAllActions(state);
    for (const action of allActions) {
      if (action.tier <= round && !occupied[action.id] && !isRepeatExcluded(action.id) && !repeatable.includes(action.id)) {
        repeatable.push(action.id);
      }
    }
  }

  return repeatable;
}

// --- Cost / Affordability ---

/**
 * Get which wildcard modifiers a player has.
 * Returns a map of color → true for colors where any resource can substitute.
 * Philosopher's Stone (wildcard_all) makes ALL colors wildcard.
 */
function getWildcards(state, playerId) {
  if (hasModifier(state, playerId, 'wildcard_all')) {
    const allColors = {};
    for (const color of (state.gods || ['gold', 'black', 'green', 'yellow'])) {
      allColors[color] = true;
    }
    return allColors;
  }
  const wildcards = {};
  if (hasModifier(state, playerId, 'wildcard_black')) wildcards.black = true;
  if (hasModifier(state, playerId, 'wildcard_green')) wildcards.green = true;
  if (hasModifier(state, playerId, 'wildcard_yellow')) wildcards.yellow = true;
  return wildcards;
}

/**
 * Check if a player can afford a cost.
 * Cost: { gold: 2, any: 1 } — 'any' means any color resources.
 * Wildcard modifiers let any resource count as a specific color.
 */
export function canAfford(state, playerId, cost) {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return false;

  const resources = { ...player.resources };
  const wildcards = getWildcards(state, playerId);
  let remaining = 0;

  // First deduct specific color costs
  for (const [color, amount] of Object.entries(cost)) {
    if (color === 'any') {
      remaining += amount;
      continue;
    }
    const available = resources[color] || 0;
    if (available >= amount) {
      resources[color] -= amount;
    } else if (wildcards[color]) {
      // Wildcard: use what we have of this color, rest comes from any resource
      const shortfall = amount - available;
      resources[color] = 0;
      remaining += shortfall;
    } else {
      return false;
    }
  }

  // Then check if remaining resources cover 'any' cost + wildcard shortfalls
  if (remaining > 0) {
    const totalRemaining = Object.values(resources).reduce((sum, v) => sum + Math.max(0, v), 0);
    if (totalRemaining < remaining) return false;
  }

  return true;
}

/**
 * Deduct cost from player, handling 'any' with gemSelection decision.
 * Wildcard modifiers convert specific color shortfalls into 'any' costs.
 * Returns { state, canAfford, pendingDecision? }
 */
export function payCost(state, playerId, cost, decisions = {}) {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { state, canAfford: false };

  const resources = { ...player.resources };
  const wildcards = getWildcards(state, playerId);
  let anyCost = cost.any || 0;

  // Deduct specific color costs (wildcards convert shortfall to 'any')
  for (const [color, amount] of Object.entries(cost)) {
    if (color === 'any') continue;
    const available = resources[color] || 0;
    if (available >= amount) {
      resources[color] -= amount;
    } else if (wildcards[color]) {
      const shortfall = amount - available;
      resources[color] = 0;
      anyCost += shortfall;
    } else {
      return { state, canAfford: false };
    }
  }

  // Handle 'any' portion (original + wildcard shortfalls)
  if (anyCost > 0) {
    const gemSelection = decisions.gemSelection;
    if (!gemSelection) {
      return {
        state,
        canAfford: true,
        pendingDecision: {
          type: 'gemSelection',
          count: anyCost,
          title: `Choose ${anyCost} resource${anyCost > 1 ? 's' : ''} to pay`,
          remainingResources: { ...resources },
        },
      };
    }

    const selectionTotal = Object.values(gemSelection).reduce((sum, v) => sum + v, 0);
    if (selectionTotal !== anyCost) {
      return { state, canAfford: false };
    }

    // Deduct selected gems
    for (const [color, amount] of Object.entries(gemSelection)) {
      if ((resources[color] || 0) < amount) {
        return { state, canAfford: false };
      }
      resources[color] -= amount;
    }
  }

  // Apply the new resources
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, resources };
  });

  return { state: { ...state, players }, canAfford: true };
}

// --- Shop Queries ---

/**
 * Get a shop definition by shopId (e.g. 'gold_weak', 'black_vp').
 */
export function getShopDef(shopId) {
  const [color, type] = shopId.split('_');
  const god = gods[color];
  if (!god) return null;
  return god.shops.find(s => s.type === type) || null;
}

/**
 * Get the cost of a shop, factoring in player's shopCostModifier and Haggle discount.
 */
export function getShopCost(state, playerId, shopId) {
  const shopDef = getShopDef(shopId);
  if (!shopDef) return null;

  const player = state.players.find(p => p.id === playerId);
  const modifier = player?.shopCostModifier || 0;

  const cost = { ...shopDef.cost };

  // Apply modifier to 'any' cost first, then to specific colors
  if (modifier !== 0) {
    if (cost.any !== undefined) {
      cost.any = Math.max(0, cost.any + modifier);
    }
  }

  // Apply Haggle shopDiscount effect (reduces total cost by 2)
  if (player?.effects?.includes('shopDiscount')) {
    let discount = 2;
    // Apply discount to 'any' cost first, then to specific colors
    if (cost.any !== undefined && cost.any > 0) {
      const reduction = Math.min(discount, cost.any);
      cost.any -= reduction;
      discount -= reduction;
    }
    if (discount > 0) {
      for (const color of Object.keys(cost)) {
        if (color === 'any' || discount <= 0) continue;
        const reduction = Math.min(discount, cost[color]);
        cost[color] -= reduction;
        discount -= reduction;
      }
    }
  }

  return cost;
}
