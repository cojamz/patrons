/**
 * Patrons v3 — Black God Handler Resolvers (Balance Rework)
 *
 * Each resolver: (state, handler, eventData, options) => { state, log, pendingDecisions }
 * All pure functions. No mutation.
 */

import { hasModifier } from '../rules.js';

// --- Helpers ---

function addResourceToPlayer(state, playerId, color, amount) {
  const updatedPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;
    return {
      ...p,
      resources: {
        ...p.resources,
        [color]: (p.resources[color] || 0) + amount,
      },
    };
  });
  return { ...state, players: updatedPlayers };
}

function addGloryToPlayer(state, playerId, amount, source) {
  const updatedPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;
    return {
      ...p,
      glory: (p.glory || 0) + amount,
      glorySources: {
        ...p.glorySources,
        [source]: ((p.glorySources || {})[source] || 0) + amount,
      },
    };
  });
  return { ...state, players: updatedPlayers };
}

function removeGloryFromPlayer(state, playerId, amount, source) {
  if (hasModifier(state, playerId, 'glory_reduction_immunity')) return state;
  return addGloryToPlayer(state, playerId, -amount, source);
}

function removeResourceFromPlayer(state, playerId, color, amount) {
  const updatedPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;
    return {
      ...p,
      resources: {
        ...p.resources,
        [color]: Math.max(0, (p.resources[color] || 0) - amount),
      },
    };
  });
  return { ...state, players: updatedPlayers };
}

function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

// --- Resolvers ---

/**
 * Thieves' Gloves: When you steal resources, +1 any resource.
 * Auto-picks the stealer's lowest active resource for simplicity.
 */
function thievesGlovesResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const activeColors = state.gods || ['gold', 'black', 'green', 'yellow'];
  const player = getPlayer(state, handler.ownerId);
  const sortedColors = [...activeColors].sort((a, b) =>
    (player.resources[a] || 0) - (player.resources[b] || 0)
  );
  const chosenColor = sortedColors[0] || activeColors[0];

  const newState = addResourceToPlayer(state, handler.ownerId, chosenColor, 1);
  return {
    state: newState,
    log: [`Thieves' Gloves: +1 ${chosenColor} (bonus from stealing)`],
    pendingDecisions: [],
  };
}

/**
 * Onyx Spyglass: When another player buys a power card, +1 black to owner.
 */
function onyxSpyglassResolver(state, handler, eventData, _options) {
  if (eventData.playerId === handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addResourceToPlayer(state, handler.ownerId, 'black', 1);
  return {
    state: newState,
    log: ['Onyx Spyglass: +1 black (another player bought a power card)'],
    pendingDecisions: [],
  };
}

/**
 * Voodoo Doll: End of round, steal 2 Favor from a player (triggers Favor condition).
 * Returns a pending decision for target selection.
 */
function voodooDollResolver(state, handler, _eventData, _options) {
  const validTargets = state.players
    .filter(p => p.id !== handler.ownerId && !hasModifier(state, p.id, 'glory_reduction_immunity'))
    .map(p => p.id);

  if (validTargets.length === 0) {
    return { state, log: ['Voodoo Doll: no valid targets (all immune)'], pendingDecisions: [] };
  }

  return {
    state,
    log: ['Voodoo Doll: choose a player to steal 2 Favor from'],
    pendingDecisions: [{
      type: 'targetPlayer',
      title: 'Voodoo Doll: Choose a player to steal 2 Favor from',
      ownerId: handler.ownerId,
      excludePlayer: handler.ownerId,
      options: validTargets,
      effect: { glorySteal: 2 },
      sourceId: 'voodoo_doll',
      isStealing: true,
    }],
  };
}

/**
 * Skeleton Key: Non-black god actions → steal 1 resource from a player on that god.
 * Fires on action.executed when the action is not a black action.
 * Auto-steals from the first player with resources on that god's spaces.
 */
function skeletonKeyResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const actionId = eventData.actionId || '';
  const godColor = actionId.split('_')[0];

  // Skip black god actions
  if (godColor === 'black') {
    return { state, log: [], pendingDecisions: [] };
  }

  // Find other players who have workers on this god's actions this round
  const roundActions = state.roundActions || [];
  const otherPlayersOnGod = [...new Set(
    roundActions
      .filter(ra => ra.playerId !== handler.ownerId)
      .filter(ra => ra.actionId.startsWith(godColor + '_'))
      .map(ra => ra.playerId)
  )];

  if (otherPlayersOnGod.length === 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Auto-steal from first available target (pick player with most resources)
  let bestTarget = null;
  let bestTotal = 0;
  for (const pid of otherPlayersOnGod) {
    // Check Aegis and steal immunity
    if (state.aegisHolder === pid || hasModifier(state, pid, 'steal_immunity')) continue;
    const p = getPlayer(state, pid);
    const total = Object.values(p.resources || {}).reduce((s, v) => s + Math.max(0, v), 0);
    if (total > bestTotal) {
      bestTotal = total;
      bestTarget = pid;
    }
  }

  if (!bestTarget || bestTotal === 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Steal 1 of their most abundant resource
  const target = getPlayer(state, bestTarget);
  const mostAbundant = Object.entries(target.resources || {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)[0];

  if (!mostAbundant) {
    return { state, log: [], pendingDecisions: [] };
  }

  const [color] = mostAbundant;
  let newState = removeResourceFromPlayer(state, bestTarget, color, 1);
  newState = addResourceToPlayer(newState, handler.ownerId, color, 1);

  return {
    state: newState,
    log: [`Skeleton Key: stole 1 ${color} from ${bestTarget} (${godColor} god action)`],
    pendingDecisions: [],
    isStealing: true,
  };
}

/**
 * Poisoned Blade: Your steal actions/shops steal extra 1 Favor.
 * Fires on glory.stolen by self.
 */
function poisonedBladeResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Steal 1 extra Favor from the target
  const targetId = eventData.targetPlayerId;
  if (!targetId) {
    return { state, log: [], pendingDecisions: [] };
  }

  let newState = removeGloryFromPlayer(state, targetId, 1, 'poisoned_blade_victim');
  newState = addGloryToPlayer(newState, handler.ownerId, 1, 'poisoned_blade');

  return {
    state: newState,
    log: ['Poisoned Blade: stole 1 extra Favor'],
    pendingDecisions: [],
  };
}

/**
 * Black Favor Condition: +1 Favor each time you use an action or shop to steal.
 * Fires once per steal action (not per resource stolen).
 */
function blackGloryConditionResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Check for permanent buff from VP shop
  const player = getPlayer(state, handler.ownerId);
  const hasExtraBuff = (player.permanentBuffs || []).includes('extra_steal_favor');
  const favorGain = hasExtraBuff ? 2 : 1;

  const newState = addGloryToPlayer(state, handler.ownerId, favorGain, 'black_glory_condition');
  return {
    state: newState,
    log: [`Black Favor: +${favorGain} Favor (steal action)${hasExtraBuff ? ' [+1 from permanent buff]' : ''}`],
    pendingDecisions: [],
  };
}

export const blackHandlers = {
  thieves_gloves: thievesGlovesResolver,
  onyx_spyglass: onyxSpyglassResolver,
  voodoo_doll: voodooDollResolver,
  skeleton_key: skeletonKeyResolver,
  poisoned_blade: poisonedBladeResolver,
  black_glory_condition: blackGloryConditionResolver,
};
