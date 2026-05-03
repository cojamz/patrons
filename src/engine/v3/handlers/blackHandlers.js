/**
 * Patrons v3 — Black God Handler Resolvers (Balance Rework)
 *
 * Each resolver: (state, handler, eventData, options) => { state, log, pendingDecisions }
 * All pure functions. No mutation.
 */

import { hasModifier } from '../rules.js';

// --- Helpers ---

function addResourceToPlayer(state, playerId, color, amount) {
  const player = state.players.find(p => p.id === playerId);
  const hadZero = (player.resources[color] || 0) === 0;
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
  let newState = { ...state, players: updatedPlayers };
  if (hadZero && amount > 0) {
    const prev = newState._pendingNewColors || [];
    newState._pendingNewColors = [...prev, { playerId, newColors: [color] }];
  }
  return newState;
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
 * Prompts the player to choose who to steal from among players on that god.
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

  // Filter to valid targets (not protected by Aegis, have resources)
  const validTargets = otherPlayersOnGod.filter(pid => {
    if (state.aegisHolder === pid || hasModifier(state, pid, 'steal_immunity')) return false;
    const p = getPlayer(state, pid);
    const total = Object.values(p.resources || {}).reduce((s, v) => s + Math.max(0, v), 0);
    return total > 0;
  });

  if (validTargets.length === 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  // If only 1 valid target, auto-steal from them
  if (validTargets.length === 1) {
    const targetId = validTargets[0];
    const target = getPlayer(state, targetId);
    const mostAbundant = Object.entries(target.resources || {})
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)[0];

    if (!mostAbundant) {
      return { state, log: [], pendingDecisions: [] };
    }

    const [color] = mostAbundant;
    let newState = removeResourceFromPlayer(state, targetId, color, 1);
    newState = addResourceToPlayer(newState, handler.ownerId, color, 1);

    return {
      state: newState,
      log: [`Skeleton Key: stole 1 ${color} from player ${targetId} (${godColor} god action)`],
      pendingDecisions: [],
      isStealing: true,
    };
  }

  // Multiple valid targets — prompt the player to choose
  return {
    state,
    log: ['Skeleton Key: choose a player to steal from'],
    pendingDecisions: [{
      type: 'targetPlayer',
      title: 'Skeleton Key: Choose a player to steal 1 resource from',
      ownerId: handler.ownerId,
      excludePlayer: handler.ownerId,
      options: validTargets,
      effect: { stealCount: 1 },
      sourceId: 'skeleton_key',
      isStealing: true,
    }],
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
 * Black Favor Condition: +1 Favor for each opponent harmed by an action/shop/card.
 * Fires once per (action × victim). Harm = penalize, steal Favor, or steal resources.
 * Repeats fire because the action re-executes and re-emits PLAYER_HARMED.
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
    log: [`Black Favor: +${favorGain} Favor (harmed opponent)${hasExtraBuff ? ' [+1 from permanent buff]' : ''}`],
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
