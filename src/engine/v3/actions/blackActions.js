/**
 * Patrons v3 — Black God Action Handlers
 *
 * Each handler: (state, playerId, gods, decisions?, recursionDepth?) => { state, log, pendingDecision? }
 * All pure functions. No mutation.
 */

import { hasModifier } from '../rules.js';

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

function formatResources(resources) {
  return Object.entries(resources)
    .filter(([, amt]) => amt > 0)
    .map(([color, amt]) => `${amt} ${color}`)
    .join(', ');
}

// --- Black Actions ---

/** skulk: +3 black */
export function skulk(state, playerId) {
  const newState = addResources(state, playerId, { black: 3 });
  return { state: newState, log: [`+3 black`] };
}

/** lurk: +2 black */
export function lurk(state, playerId) {
  const newState = addResources(state, playerId, { black: 2 });
  return { state: newState, log: [`+2 black`] };
}

/** pickpocket: +1 black, steal 1 Glory from target */
export function pickpocket(state, playerId, gods, decisions = {}) {
  // Always gain +1 black
  let newState = addResources(state, playerId, { black: 1 });

  if (!decisions.targetPlayer) {
    return {
      state: newState,
      log: [`+1 black`],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to steal 1 Glory from',
        excludePlayer: playerId,
      },
    };
  }

  const targetId = decisions.targetPlayer;

  // Check glory steal immunity
  if (hasModifier(newState, targetId, 'glory_steal_immunity')) {
    return {
      state: newState,
      log: [`+1 black`, `Steal blocked: target has Glory steal immunity`],
    };
  }

  const target = getPlayer(newState, targetId);
  const stolen = Math.min(1, target.glory || 0);
  if (stolen > 0) {
    newState = removeGlory(newState, targetId, stolen);
    newState = addGlory(newState, playerId, stolen, 'pickpocket');
  }

  return {
    state: newState,
    log: [`+1 black`, stolen > 0 ? `Stole ${stolen} Glory from ${targetId}` : `Target has no Glory to steal`],
    penalizedPlayers: stolen > 0 ? [targetId] : [],
  };
}

/** ransack: Steal 2 resources from target */
export function ransack(state, playerId, gods, decisions = {}) {
  if (!decisions.targetPlayer) {
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to steal 2 resources from',
        excludePlayer: playerId,
      },
    };
  }

  const targetId = decisions.targetPlayer;

  // Check steal immunity
  if (hasModifier(state, targetId, 'steal_immunity')) {
    return {
      state,
      log: [`Steal blocked: target has resource steal immunity`],
    };
  }

  if (!decisions.stealGems) {
    const target = getPlayer(state, targetId);
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'stealGems',
        count: 2,
        title: `Choose 2 resources to steal from ${targetId}`,
        targetResources: { ...target.resources },
        targetPlayer: targetId,
      },
    };
  }

  const stealGems = decisions.stealGems;
  const total = Object.values(stealGems).reduce((sum, v) => sum + v, 0);
  if (total !== 2) {
    return { state, log: ['Invalid selection: must steal exactly 2 resources'] };
  }

  // Verify target has the resources
  const target = getPlayer(state, targetId);
  for (const [color, amount] of Object.entries(stealGems)) {
    if ((target.resources[color] || 0) < amount) {
      return { state, log: [`Target doesn't have enough ${color}`] };
    }
  }

  let newState = removeResources(state, targetId, stealGems);
  newState = addResources(newState, playerId, stealGems);

  return {
    state: newState,
    log: [`Stole ${formatResources(stealGems)} from ${targetId}`],
    penalizedPlayers: [targetId],
  };
}

/** extort: +1 black, steal 3 resources from target */
export function extort(state, playerId, gods, decisions = {}) {
  // Always gain +1 black
  let newState = addResources(state, playerId, { black: 1 });

  if (!decisions.targetPlayer) {
    return {
      state: newState,
      log: [`+1 black`],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to steal 3 resources from',
        excludePlayer: playerId,
      },
    };
  }

  const targetId = decisions.targetPlayer;

  // Check steal immunity
  if (hasModifier(newState, targetId, 'steal_immunity')) {
    return {
      state: newState,
      log: [`+1 black`, `Steal blocked: target has resource steal immunity`],
    };
  }

  if (!decisions.stealGems) {
    const target = getPlayer(newState, targetId);
    return {
      state: newState,
      log: [`+1 black`],
      pendingDecision: {
        type: 'stealGems',
        count: 3,
        title: `Choose 3 resources to steal from ${targetId}`,
        targetResources: { ...target.resources },
        targetPlayer: targetId,
      },
    };
  }

  const stealGems = decisions.stealGems;
  const total = Object.values(stealGems).reduce((sum, v) => sum + v, 0);
  if (total !== 3) {
    return { state: newState, log: [`+1 black`, 'Invalid selection: must steal exactly 3 resources'] };
  }

  const target = getPlayer(newState, targetId);
  for (const [color, amount] of Object.entries(stealGems)) {
    if ((target.resources[color] || 0) < amount) {
      return { state: newState, log: [`+1 black`, `Target doesn't have enough ${color}`] };
    }
  }

  newState = removeResources(newState, targetId, stealGems);
  newState = addResources(newState, playerId, stealGems);

  return {
    state: newState,
    log: [`+1 black`, `Stole ${formatResources(stealGems)} from ${targetId}`],
    penalizedPlayers: [targetId],
  };
}

/** hex: All other players -2 Glory */
export function hex(state, playerId) {
  let newState = state;
  const log = [];
  const penalizedPlayers = [];

  for (const player of state.players) {
    if (player.id === playerId) continue;
    newState = removeGlory(newState, player.id, 2);
    log.push(`${player.id} lost 2 Glory`);
    penalizedPlayers.push(player.id);
  }

  return { state: newState, log: [`Hex: all other players -2 Glory`, ...log], penalizedPlayers };
}

/** ruin: +2 black, all other players -4 Glory */
export function ruin(state, playerId) {
  let newState = addResources(state, playerId, { black: 2 });
  const log = [`+2 black`];
  const penalizedPlayers = [];

  for (const player of state.players) {
    if (player.id === playerId) continue;
    newState = removeGlory(newState, player.id, 4);
    log.push(`${player.id} lost 4 Glory`);
    penalizedPlayers.push(player.id);
  }

  return { state: newState, log: [`Ruin: +2 black, all other players -4 Glory`, ...log], penalizedPlayers };
}

export const blackActions = {
  black_skulk: skulk,
  black_lurk: lurk,
  black_pickpocket: pickpocket,
  black_ransack: ransack,
  black_extort: extort,
  black_hex: hex,
  black_ruin: ruin,
};
