/**
 * Patrons v3 — Yellow God Action Handlers (Balance Rework)
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

// --- Yellow Actions ---

/** harvest: +2 yellow */
export function harvest(state, playerId) {
  const newState = addResources(state, playerId, { yellow: 2 });
  return { state: newState, log: ['+2 yellow'] };
}

/** forage: +2 any colors (player chooses) */
export function forage(state, playerId, gods, decisions = {}) {
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
  return { state: newState, log: [`Gained ${formatResources(selection)}`] };
}

/** transmute: +1 yellow, swap 2 any → 2 any */
export function transmute(state, playerId, gods, decisions = {}) {
  let newState = decisions._continued ? state : addResources(state, playerId, { yellow: 1 });
  const logPrefix = decisions._continued ? [] : ['+1 yellow'];

  // Step 1: Choose 2 resources to give up
  if (!decisions.gemSelection) {
    const player = getPlayer(newState, playerId);
    const totalResources = Object.values(player.resources).reduce((sum, v) => sum + Math.max(0, v), 0);
    if (totalResources < 2) {
      return { state: newState, log: [...logPrefix, 'Not enough resources to transmute'] };
    }
    return {
      state: newState,
      log: ['+1 yellow'],
      pendingDecision: {
        type: 'gemSelection',
        count: 2,
        title: 'Choose 2 resources to give up',
        mode: 'spend',
      },
    };
  }

  // Step 2: Choose 2 resources to gain
  if (!decisions.gemSelectionGain) {
    const spentSelection = decisions.gemSelection;
    // Verify player has the resources to spend
    const player = getPlayer(newState, playerId);
    for (const [color, amount] of Object.entries(spentSelection)) {
      if ((player.resources[color] || 0) < amount) {
        return { state: newState, log: [...logPrefix, `Not enough ${color} to trade`] };
      }
    }
    // Remove the spent resources
    newState = removeResources(newState, playerId, spentSelection);
    return {
      state: newState,
      log: logPrefix,
      pendingDecision: {
        type: 'gemSelection',
        count: 2,
        title: 'Choose 2 resources to gain',
        _resolveField: 'gemSelectionGain',
      },
    };
  }

  // Resolve gain
  const gainSelection = decisions.gemSelectionGain;
  const gainTotal = Object.values(gainSelection).reduce((sum, v) => sum + v, 0);
  if (gainTotal !== 2) {
    return { state: newState, log: [...logPrefix, 'Invalid selection: must choose exactly 2 resources to gain'] };
  }

  newState = addResources(newState, playerId, gainSelection);
  return {
    state: newState,
    log: [...logPrefix, `Traded ${formatResources(decisions.gemSelection)} for ${formatResources(gainSelection)}`],
  };
}

/** siphon: Steal 2 any from a player, they get +1 yellow */
export function siphon(state, playerId, gods, decisions = {}) {
  if (!decisions.targetPlayer) {
    const validTargets = state.players.filter(p =>
      p.id !== playerId && canStealFrom(state, p.id)
    ).map(p => p.id);
    if (validTargets.length === 0) {
      return { state, log: ['No valid targets (all immune to steal)'], abort: true };
    }
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'targetPlayer',
        title: 'Choose a player to siphon 2 resources from',
        excludePlayer: playerId,
        options: validTargets,
      },
    };
  }

  const targetId = decisions.targetPlayer;
  if (!canStealFrom(state, targetId)) {
    return { state, log: ['Steal blocked: target is protected'] };
  }

  if (!decisions.stealGems) {
    const target = getPlayer(state, targetId);
    const totalAvailable = Object.values(target.resources).reduce((sum, v) => sum + v, 0);
    if (totalAvailable === 0) {
      // Still give compensation
      let newState = addResources(state, targetId, { yellow: 1 });
      return { state: newState, log: [`Target has no resources to steal. ${targetId} gained 1 yellow as compensation.`] };
    }
    const stealCount = Math.min(2, totalAvailable);
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'stealGems',
        count: stealCount,
        title: `Choose ${stealCount} resource${stealCount > 1 ? 's' : ''} to siphon from ${targetId}`,
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

  let newState = removeResources(state, targetId, stealGems);
  newState = addResources(newState, playerId, stealGems);
  // Compensation: target gets +1 yellow
  newState = addResources(newState, targetId, { yellow: 1 });

  return {
    state: newState,
    log: [`Siphoned ${formatResources(stealGems)} from ${targetId}. ${targetId} gained 1 yellow.`],
    penalizedPlayers: [targetId],
    resourcesStolen: [{ playerId, targetPlayerId: targetId, resources: stealGems }],
    isStealing: true,
  };
}

/** distill: Spend all of one color → gain that many ×2 of another */
export function distill(state, playerId, gods, decisions = {}) {
  // Step 1: Choose color to spend all of
  if (!decisions.chooseColor) {
    const player = getPlayer(state, playerId);
    const colors = Object.entries(player.resources)
      .filter(([, v]) => v > 0)
      .map(([color]) => color);
    if (colors.length === 0) {
      return { state, log: ['Distill: no resources to spend'] };
    }
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'chooseColor',
        title: 'Choose a color to spend ALL of',
        options: colors,
        playerResources: { ...player.resources },
      },
    };
  }

  // Step 2: Choose color to gain
  if (!decisions.chooseColorGain) {
    const spendColor = decisions.chooseColor;
    const player = getPlayer(state, playerId);
    const spendAmount = player.resources[spendColor] || 0;
    if (spendAmount <= 0) {
      return { state, log: [`No ${spendColor} to spend`] };
    }
    const activeColors = state.gods || ['gold', 'black', 'green', 'yellow'];
    const gainOptions = activeColors.filter(c => c !== spendColor);
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'chooseColor',
        title: `Spending ${spendAmount} ${spendColor} — choose color to gain ${spendAmount * 2} of`,
        options: gainOptions,
        _resolveField: 'chooseColorGain',
        spendColor,
        spendAmount,
      },
    };
  }

  const spendColor = decisions.chooseColor;
  const gainColor = decisions.chooseColorGain;
  const player = getPlayer(state, playerId);
  const spendAmount = player.resources[spendColor] || 0;
  const gainAmount = spendAmount * 2;

  let newState = removeResources(state, playerId, { [spendColor]: spendAmount });
  newState = addResources(newState, playerId, { [gainColor]: gainAmount });

  return {
    state: newState,
    log: [`Distill: spent ${spendAmount} ${spendColor} → gained ${gainAmount} ${gainColor}`],
  };
}

/** attune: +1 yellow, gain 1 of each color you have 0 of */
export function attune(state, playerId) {
  let newState = addResources(state, playerId, { yellow: 1 });
  const player = getPlayer(newState, playerId);
  const activeColors = state.gods || ['gold', 'black', 'green', 'yellow'];
  const zeroColors = activeColors.filter(c => (player.resources[c] || 0) === 0);

  if (zeroColors.length === 0) {
    return { state: newState, log: ['+1 yellow', 'All colors already owned — no zero-color gain'] };
  }

  const gain = {};
  for (const color of zeroColors) {
    gain[color] = 1;
  }
  newState = addResources(newState, playerId, gain);

  return {
    state: newState,
    log: [`+1 yellow, gained 1 of each zero color: ${formatResources(gain)}`],
  };
}

/** flourish: Gain 2 of each active color */
export function flourish(state, playerId) {
  const activeGods = state.gods || ['gold', 'black', 'green', 'yellow'];
  const gain = {};
  for (const color of activeGods) {
    gain[color] = 2;
  }

  const newState = addResources(state, playerId, gain);
  return { state: newState, log: [`Flourish: gained ${formatResources(gain)}`] };
}

export const yellowActions = {
  yellow_harvest: harvest,
  yellow_forage: forage,
  yellow_transmute: transmute,
  yellow_siphon: siphon,
  yellow_distill: distill,
  yellow_attune: attune,
  yellow_flourish: flourish,
};
