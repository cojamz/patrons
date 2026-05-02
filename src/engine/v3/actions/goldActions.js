/**
 * Patrons v3 — Gold God Action Handlers (Balance Rework)
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
  // Track 0→N transitions for Yellow Favor condition
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

// --- Gold Actions ---

/** patronage: +2 gold, give 1 gold to a player of your choice */
export function patronage(state, playerId, gods, decisions = {}) {
  let newState = decisions._continued ? state : addResources(state, playerId, { gold: 2 });
  const logPrefix = decisions._continued ? [] : ['+2 gold'];

  if (!decisions.targetPlayer) {
    const validTargets = state.players.filter(p => p.id !== playerId).map(p => p.id);
    if (validTargets.length === 0) {
      return { state: newState, log: [...logPrefix, 'No other players to gift gold to'] };
    }
    return {
      state: newState,
      log: ['+2 gold'],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to give 1 gold to',
        excludePlayer: playerId,
        options: validTargets,
      },
    };
  }

  const targetId = decisions.targetPlayer;
  newState = addResources(newState, targetId, { gold: 1 });
  return { state: newState, log: [...logPrefix, `Gave 1 gold to ${targetId}`] };
}

/** levy: Take 1 gold from each other player */
export function levy(state, playerId) {
  let newState = state;
  const log = [];
  const penalizedPlayers = [];
  const resourcesStolen = [];
  let totalStolen = 0;

  for (const player of state.players) {
    if (player.id === playerId) continue;

    // Aegis blocks stealing
    if (hasAegis(newState, player.id)) {
      log.push(`${player.id}: steal blocked (Aegis)`);
      continue;
    }
    // Steal immunity blocks stealing
    if (hasModifier(newState, player.id, 'steal_immunity')) {
      log.push(`${player.id}: steal blocked (steal immunity)`);
      continue;
    }

    const available = player.resources.gold || 0;
    const stolen = Math.min(1, available);
    if (stolen > 0) {
      newState = removeResources(newState, player.id, { gold: stolen });
      totalStolen += stolen;
      penalizedPlayers.push(player.id);
      resourcesStolen.push({ playerId, targetPlayerId: player.id, resources: { gold: stolen } });
      log.push(`Took ${stolen} gold from ${player.id}`);
    } else {
      log.push(`${player.id} has no gold`);
    }
  }

  if (totalStolen > 0) {
    newState = addResources(newState, playerId, { gold: totalStolen });
  }

  return {
    state: newState,
    log: ['Levy: taxed all players', ...log],
    penalizedPlayers,
    resourcesStolen,
    isStealing: true,
  };
}

/** hoard: +3 gold, cannot shop this turn */
export function hoard(state, playerId) {
  let newState = addResources(state, playerId, { gold: 3 });
  // Set noShopThisTurn effect
  const players = newState.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, effects: [...(p.effects || []), 'noShopThisTurn'] };
  });
  newState = { ...newState, players };
  return { state: newState, log: ['+3 gold, cannot shop this turn'] };
}

/** haggle: +1 gold, next shop or power card costs 2 less this turn */
export function haggle(state, playerId) {
  let newState = addResources(state, playerId, { gold: 1 });
  // Set shopDiscount effect
  const players = newState.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, effects: [...(p.effects || []), 'shopDiscount'] };
  });
  newState = { ...newState, players };
  return { state: newState, log: ['+1 gold, next purchase costs 2 less'] };
}

/** royalties: +1 gold per power card owned */
export function austerity(state, playerId) {
  const champion = state.champions[playerId];
  if (!champion) {
    return { state, log: ['No champion — no power cards'] };
  }
  const ownedCards = (champion.powerCards || []).length;

  if (ownedCards === 0) {
    return { state, log: ['Royalties: no power cards owned'] };
  }

  const newState = addResources(state, playerId, { gold: ownedCards });
  return { state: newState, log: [`Royalties: +${ownedCards} gold (${ownedCards} power card${ownedCards > 1 ? 's' : ''})`] };
}

/** tariff: +1 gold, +1 gold per god you have a worker on */
export function tariff(state, playerId) {
  // Count distinct gods where this player has a worker placed
  const roundActions = state.roundActions || [];
  const godsWithWorkers = new Set();
  for (const ra of roundActions) {
    if (ra.playerId !== playerId) continue;
    const actionId = ra.actionId;
    // Determine god from action ID prefix
    const godColor = actionId.split('_')[0];
    godsWithWorkers.add(godColor);
  }

  const bonusGold = godsWithWorkers.size;
  const totalGold = 1 + bonusGold;
  const newState = addResources(state, playerId, { gold: totalGold });
  return { state: newState, log: [`Tariff: +${totalGold} gold (1 base + ${bonusGold} from ${bonusGold} god${bonusGold !== 1 ? 's' : ''} with workers)`] };
}

/** cashIn: Convert all gold to Favor 1:1 */
export function cashIn(state, playerId) {
  const player = getPlayer(state, playerId);
  const goldCount = (player.resources || {}).gold || 0;

  if (goldCount === 0) {
    return { state, log: ['Cash In: no gold to convert'] };
  }

  let newState = removeResources(state, playerId, { gold: goldCount });
  newState = addGlory(newState, playerId, goldCount, 'cash_in');

  return { state: newState, log: [`Cash In: converted ${goldCount} gold → ${goldCount} Favor`] };
}

export const goldActions = {
  gold_patronage: patronage,
  gold_levy: levy,
  gold_hoard: hoard,
  gold_haggle: haggle,
  gold_austerity: austerity,
  gold_tariff: tariff,
  gold_cashIn: cashIn,
};
