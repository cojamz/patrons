/**
 * Patrons v3 — Black God Action Handlers (Balance Rework)
 *
 * Each handler: (state, playerId, gods, decisions?, recursionDepth?) => { state, log, pendingDecision? }
 * All pure functions. No mutation.
 */

import { hasModifier } from '../rules.js';

// --- Helpers ---

function addResources(state, playerId, resources) {
  const player = state.players.find(p => p.id === playerId);
  const hasDouble = player?.effects?.includes('doubleNextGain');
  const effective = hasDouble
    ? Object.fromEntries(Object.entries(resources).map(([c, a]) => [c, a * 2]))
    : resources;
  const newColors = Object.entries(effective)
    .filter(([color, amount]) => amount > 0 && (player.resources[color] || 0) === 0)
    .map(([color]) => color);
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
  let newState = { ...state, players };
  if (newColors.length > 0) {
    const prev = newState._pendingNewColors || [];
    newState._pendingNewColors = [...prev, { playerId, newColors }];
  }
  return newState;
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

function canStealFrom(state, playerId) {
  return !hasAegis(state, playerId) && !hasModifier(state, playerId, 'steal_immunity');
}

/**
 * Check for doubleNextTheft effect, return multiplier and consume the effect.
 * Returns { state, multiplier } — multiplier is 2 if active, 1 otherwise.
 */
function consumeDoubleTheft(state, playerId) {
  const player = getPlayer(state, playerId);
  if (!player?.effects?.includes('doubleNextTheft')) return { state, multiplier: 1 };
  const newState = {
    ...state,
    players: state.players.map(p => {
      if (p.id !== playerId) return p;
      const newEffects = [...(p.effects || [])];
      const idx = newEffects.indexOf('doubleNextTheft');
      if (idx >= 0) newEffects.splice(idx, 1);
      return { ...p, effects: newEffects };
    }),
  };
  return { state: newState, multiplier: 2 };
}

// --- Black Actions ---

/** skulk: +3 black */
export function skulk(state, playerId) {
  const newState = addResources(state, playerId, { black: 3 });
  return { state: newState, log: ['+3 black'] };
}

/** ransack: Steal 2 resources from a player */
export function ransack(state, playerId, gods, decisions = {}) {
  if (!decisions.targetPlayer) {
    // Filter: must be stealable AND have resources to take
    const validTargets = state.players.filter(p => {
      if (p.id === playerId) return false;
      if (!canStealFrom(state, p.id)) return false;
      const total = Object.values(p.resources).reduce((sum, v) => sum + v, 0);
      return total > 0;
    }).map(p => p.id);
    if (validTargets.length === 0) {
      return { state, log: ['Ransack: no opponents have resources to steal'] };
    }
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to steal 2 blessings from',
        excludePlayer: playerId,
        options: validTargets,
      },
    };
  }

  const targetId = decisions.targetPlayer;
  if (!canStealFrom(state, targetId)) {
    return { state, log: ['Steal blocked: target is protected'] };
  }

  // Check doubleNextTheft effect for steal count
  const { multiplier: theftMult } = consumeDoubleTheft(state, playerId);
  const baseStealCount = 2 * theftMult;

  if (!decisions.stealGems) {
    const target = getPlayer(state, targetId);
    const totalAvailable = Object.values(target.resources).reduce((sum, v) => sum + v, 0);
    if (totalAvailable === 0) {
      return { state, log: [`Ransack: target has no resources to steal`] };
    }
    const stealCount = Math.min(baseStealCount, totalAvailable);
    return {
      state,
      log: theftMult > 1 ? ['Double theft active!'] : [],
      pendingDecision: {
        type: 'stealGems',
        count: stealCount,
        title: `Choose ${stealCount} resource${stealCount > 1 ? 's' : ''} to steal from ${targetId}`,
        targetResources: { ...target.resources },
        targetPlayer: targetId,
      },
    };
  }

  const stealGems = decisions.stealGems;
  const target = getPlayer(state, targetId);
  for (const [color, amount] of Object.entries(stealGems)) {
    if ((target.resources[color] || 0) < amount) {
      return { state, log: [`Target doesn't have enough ${color}`] };
    }
  }

  // Consume doubleNextTheft effect on the actual steal
  let newState = consumeDoubleTheft(state, playerId).state;
  newState = removeResources(newState, targetId, stealGems);
  newState = addResources(newState, playerId, stealGems);

  return {
    state: newState,
    log: [`Stole ${formatResources(stealGems)} from ${targetId}`],
    penalizedPlayers: [targetId],
    resourcesStolen: [{ playerId, targetPlayerId: targetId, resources: stealGems }],
    isStealing: true,
  };
}

/** pickpocket: +1 black, steal 2 Favor from a player */
export function pickpocket(state, playerId, gods, decisions = {}) {
  let newState = decisions._continued ? state : addResources(state, playerId, { black: 1 });

  if (!decisions.targetPlayer) {
    const validTargets = state.players.filter(p =>
      p.id !== playerId && !hasModifier(state, p.id, 'glory_reduction_immunity')
    ).map(p => p.id);
    if (validTargets.length === 0) {
      return { state: newState, log: ['+1 black', 'No valid targets (all immune)'], abort: false };
    }
    return {
      state: newState,
      log: ['+1 black'],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to steal 2 Favor from',
        excludePlayer: playerId,
        options: validTargets,
      },
    };
  }

  const targetId = decisions.targetPlayer;
  if (hasModifier(newState, targetId, 'glory_reduction_immunity')) {
    return { state: newState, log: ['+1 black', 'Steal blocked: target has Favor immunity'] };
  }

  // Consume doubleNextTheft effect
  const { state: postTheftState, multiplier: theftMult } = consumeDoubleTheft(newState, playerId);
  newState = postTheftState;
  const stolen = 2 * theftMult;
  newState = removeGlory(newState, targetId, stolen, 'pickpocket_victim');
  newState = addGlory(newState, playerId, stolen, 'pickpocket');

  const logPrefix = decisions._continued ? [] : ['+1 black'];
  if (theftMult > 1) logPrefix.push('Double theft active!');
  return {
    state: newState,
    log: [...logPrefix, `Stole ${stolen} Favor from ${targetId}`],
    penalizedPlayers: [targetId],
    gloryStolen: [{ playerId, targetPlayerId: targetId, amount: stolen }],
    isStealing: true,
  };
}

/** tribute: Each other player gives you 1 resource or 1 Favor (their choice) */
export function tribute(state, playerId) {
  // Auto-resolve: each opponent gives resources or Favor.
  // TODO: Add interactive tributeChoice decision for multiplayer
  const { state: postTheftState, multiplier: theftMult } = consumeDoubleTheft(state, playerId);
  let newState = postTheftState;
  const log = [];
  let totalResourcesGained = {};
  const tributeAmount = 1 * theftMult;

  if (theftMult > 1) log.push('Double theft active!');

  for (const player of state.players) {
    if (player.id === playerId) continue;

    const resources = player.resources || {};
    const totalResources = Object.values(resources).reduce((sum, v) => sum + Math.max(0, v), 0);

    if (totalResources > 0) {
      // Give most abundant resource(s)
      const mostAbundant = Object.entries(resources)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)[0];
      if (mostAbundant) {
        const [color] = mostAbundant;
        const takeAmount = Math.min(tributeAmount, resources[color] || 0);
        newState = removeResources(newState, player.id, { [color]: takeAmount });
        totalResourcesGained[color] = (totalResourcesGained[color] || 0) + takeAmount;
        log.push(`${player.id} gave ${takeAmount} ${color}`);
      }
    } else {
      // No resources — lose Favor
      if (!hasModifier(newState, player.id, 'glory_reduction_immunity')) {
        newState = removeGlory(newState, player.id, tributeAmount, 'tribute');
        newState = addGlory(newState, playerId, tributeAmount, 'tribute');
        log.push(`${player.id} gave ${tributeAmount} Favor`);
      } else {
        log.push(`${player.id} has nothing to give (immune)`);
      }
    }
  }

  // Grant all collected resources
  if (Object.keys(totalResourcesGained).length > 0) {
    newState = addResources(newState, playerId, totalResourcesGained);
  }

  return { state: newState, log: ['Tribute: each opponent pays tribute', ...log], isStealing: true };
}

/** plunder: Steal half a player's resources of one color (rounded down) */
export function plunder(state, playerId, gods, decisions = {}) {
  if (!decisions.targetPlayer) {
    // Filter: must be stealable AND have resources to take
    const validTargets = state.players.filter(p => {
      if (p.id === playerId) return false;
      if (!canStealFrom(state, p.id)) return false;
      const total = Object.values(p.resources).reduce((sum, v) => sum + v, 0);
      return total > 0;
    }).map(p => p.id);
    if (validTargets.length === 0) {
      return { state, log: ['Plunder: no opponents have resources to steal'] };
    }
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to plunder',
        excludePlayer: playerId,
        options: validTargets,
      },
    };
  }

  const targetId = decisions.targetPlayer;
  if (!canStealFrom(state, targetId)) {
    return { state, log: ['Steal blocked: target is protected'] };
  }

  if (!decisions.chooseColor) {
    const target = getPlayer(state, targetId);
    const colors = Object.entries(target.resources)
      .filter(([, v]) => v >= 2) // need at least 2 to steal half
      .map(([color]) => color);
    if (colors.length === 0) {
      return { state, log: [`${targetId} has no color with 2+ resources to plunder`] };
    }
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'chooseColor',
        title: `Choose a color to steal half of from ${targetId}`,
        options: colors,
        targetPlayer: targetId,
        targetResources: { ...target.resources },
        // Carry forward targetPlayer so GameProvider can pass it back
        _carryForward: { targetPlayer: targetId },
      },
    };
  }

  const color = decisions.chooseColor;
  const target = getPlayer(state, targetId);
  const halfAmount = Math.floor((target.resources[color] || 0) / 2);

  if (halfAmount <= 0) {
    return { state, log: [`${targetId} has too few ${color} to plunder`] };
  }

  // Consume doubleNextTheft effect
  const { state: postTheftState, multiplier: theftMult } = consumeDoubleTheft(state, playerId);
  const stealAmount = Math.min(halfAmount * theftMult, target.resources[color] || 0);
  let newState = removeResources(postTheftState, targetId, { [color]: stealAmount });
  newState = addResources(newState, playerId, { [color]: stealAmount });

  const theftLog = theftMult > 1 ? ' (doubled!)' : '';
  return {
    state: newState,
    log: [`Plundered ${stealAmount} ${color} from ${targetId}${theftLog}`],
    penalizedPlayers: [targetId],
    resourcesStolen: [{ playerId, targetPlayerId: targetId, resources: { [color]: stealAmount } }],
    isStealing: true,
  };
}

/** dread: +2 black, all other players lose Favor equal to their power card count */
export function dread(state, playerId) {
  let newState = addResources(state, playerId, { black: 2 });
  const log = ['+2 black'];
  const penalizedPlayers = [];

  for (const player of state.players) {
    if (player.id === playerId) continue;
    const champion = state.champions[player.id];
    const cardCount = champion?.powerCards?.length || 0;
    if (cardCount > 0) {
      newState = removeGlory(newState, player.id, cardCount, 'dread');
      log.push(`${player.id} lost ${cardCount} Favor (${cardCount} power card${cardCount > 1 ? 's' : ''})`);
      penalizedPlayers.push(player.id);
    } else {
      log.push(`${player.id}: 0 power cards, no Favor lost`);
    }
  }

  return { state: newState, log: ['Dread: +2 black, penalize by power card count', ...log], penalizedPlayers };
}

/** annihilate: Spend all black — each other player loses that much Favor */
export function annihilate(state, playerId) {
  const player = getPlayer(state, playerId);
  const blackOwned = player.resources.black || 0;

  if (blackOwned <= 0) {
    return { state, log: ['Annihilate: no black to spend'] };
  }

  let newState = removeResources(state, playerId, { black: blackOwned });
  const log = [`Spent ${blackOwned} black`];
  const penalizedPlayers = [];

  for (const p of state.players) {
    if (p.id === playerId) continue;
    newState = removeGlory(newState, p.id, blackOwned, 'annihilate');
    log.push(`${p.id} lost ${blackOwned} Favor`);
    penalizedPlayers.push(p.id);
  }

  return { state: newState, log: [`Annihilate: spent ${blackOwned} black`, ...log], penalizedPlayers };
}

export const blackActions = {
  black_skulk: skulk,
  black_ransack: ransack,
  black_pickpocket: pickpocket,
  black_tribute: tribute,
  black_plunder: plunder,
  black_dread: dread,
  black_annihilate: annihilate,
};
