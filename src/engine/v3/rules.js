/**
 * Patrons v3 — Rules & Validation
 *
 * Pure functions for querying game state: available actions,
 * affordability checks, cost payment, and repeat eligibility.
 */

import gods from './data/gods.js';
import { powerCards } from './data/powerCards.js';

// --- Action IDs that cannot be repeated (repeat/copy actions) ---
const REPEAT_EXCLUDED = new Set([
  'green_relive',
  'green_echo',
  'green_loop',
  'green_unravel',
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
  // (unless The Deft's extra action is available)
  if (state.workerPlacedThisTurn) {
    if (playerId) {
      const deftPlayer = state.players?.find(p => p.id === playerId);
      const hasDeftExtra = deftPlayer?.effects?.includes('extraActionThisTurn');
      if (!hasDeftExtra) return [];
    } else {
      return [];
    }
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
 * Check if a player can afford a cost.
 * Cost: { gold: 2, any: 1 } — 'any' means any color resources.
 */
export function canAfford(state, playerId, cost) {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return false;

  const resources = { ...player.resources };
  let remaining = 0;

  // First deduct specific color costs
  for (const [color, amount] of Object.entries(cost)) {
    if (color === 'any') {
      remaining += amount;
      continue;
    }
    if ((resources[color] || 0) < amount) return false;
    resources[color] -= amount;
  }

  // Then check if remaining resources cover 'any' cost
  if (remaining > 0) {
    const totalRemaining = Object.values(resources).reduce((sum, v) => sum + Math.max(0, v), 0);
    if (totalRemaining < remaining) return false;
  }

  return true;
}

/**
 * Deduct cost from player, handling 'any' with gemSelection decision.
 * Returns { state, canAfford, pendingDecision? }
 */
export function payCost(state, playerId, cost, decisions = {}) {
  const player = state.players.find(p => p.id === playerId);
  if (!player) return { state, canAfford: false };

  const resources = { ...player.resources };
  const anyCost = cost.any || 0;

  // Deduct specific color costs
  for (const [color, amount] of Object.entries(cost)) {
    if (color === 'any') continue;
    if ((resources[color] || 0) < amount) {
      return { state, canAfford: false };
    }
    resources[color] -= amount;
  }

  // Handle 'any' portion
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
 * Get the cost of a shop, factoring in player's shopCostModifier.
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

  return cost;
}
