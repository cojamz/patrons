/**
 * Patrons v3 — Yellow God Action Handlers
 *
 * Each handler: (state, playerId, gods, decisions?, recursionDepth?) => { state, log, pendingDecision? }
 * All pure functions. No mutation.
 */

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

function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

function formatResources(resources) {
  return Object.entries(resources)
    .filter(([, amt]) => amt > 0)
    .map(([color, amt]) => `${amt} ${color}`)
    .join(', ');
}

// --- Yellow Actions ---

/** forage: Gain 3 resources of any colors */
export function forage(state, playerId, gods, decisions = {}) {
  if (!decisions.gemSelection) {
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'gemSelection',
        count: 3,
        title: 'Choose 3 resources to gain',
      },
    };
  }

  const selection = decisions.gemSelection;
  const total = Object.values(selection).reduce((sum, v) => sum + v, 0);
  if (total !== 3) {
    return { state, log: ['Invalid selection: must choose exactly 3 resources'] };
  }

  const newState = addResources(state, playerId, selection);
  return { state: newState, log: [`Gained ${formatResources(selection)}`] };
}

/** gather: Gain 2 resources of any colors */
export function gather(state, playerId, gods, decisions = {}) {
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

/** bless: +2 yellow */
export function bless(state, playerId) {
  const newState = addResources(state, playerId, { yellow: 2 });
  return { state: newState, log: [`+2 yellow`] };
}

/** trade: +1 yellow, trade ALL your resources for new ones (same total count) */
export function trade(state, playerId, gods, decisions = {}) {
  // Always gain +1 yellow first
  let newState = addResources(state, playerId, { yellow: 1 });
  const player = getPlayer(newState, playerId);

  // Count total resources (after gaining +1 yellow)
  const totalResources = Object.values(player.resources).reduce((sum, v) => sum + Math.max(0, v), 0);

  if (totalResources === 0) {
    return { state: newState, log: [`+1 yellow`, `No resources to trade`] };
  }

  if (!decisions.gemSelection) {
    return {
      state: newState,
      log: [`+1 yellow`],
      pendingDecision: {
        type: 'gemSelection',
        count: totalResources,
        title: `Redistribute your ${totalResources} resources (same total count)`,
      },
    };
  }

  const selection = decisions.gemSelection;
  const total = Object.values(selection).reduce((sum, v) => sum + v, 0);
  if (total !== totalResources) {
    return { state: newState, log: [`+1 yellow`, `Invalid selection: must distribute exactly ${totalResources} resources`] };
  }

  // Remove all current resources
  const allResources = { ...player.resources };
  newState = removeResources(newState, playerId, allResources);
  // Add the new distribution
  newState = addResources(newState, playerId, selection);

  return { state: newState, log: [`+1 yellow`, `Traded all resources for ${formatResources(selection)}`] };
}

/** harvest: Gain 4 resources of any colors */
export function harvest(state, playerId, gods, decisions = {}) {
  if (!decisions.gemSelection) {
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'gemSelection',
        count: 4,
        title: 'Choose 4 resources to gain',
      },
    };
  }

  const selection = decisions.gemSelection;
  const total = Object.values(selection).reduce((sum, v) => sum + v, 0);
  if (total !== 4) {
    return { state, log: ['Invalid selection: must choose exactly 4 resources'] };
  }

  const newState = addResources(state, playerId, selection);
  return { state: newState, log: [`Gained ${formatResources(selection)}`] };
}

/** commune: +2 yellow, copy previous player's last resource gain */
export function commune(state, playerId) {
  let newState = addResources(state, playerId, { yellow: 2 });
  const log = [`+2 yellow`];

  // Find the previous player in turn order
  const playerIndex = state.players.findIndex(p => p.id === playerId);
  const prevIndex = playerIndex > 0 ? playerIndex - 1 : state.players.length - 1;
  const prevPlayer = state.players[prevIndex];

  if (prevPlayer && prevPlayer.id !== playerId && prevPlayer.lastGain) {
    const gain = prevPlayer.lastGain;
    const hasGain = Object.values(gain).some(v => v > 0);
    if (hasGain) {
      newState = addResources(newState, playerId, gain);
      log.push(`Copied ${prevPlayer.id}'s last gain: ${formatResources(gain)}`);
    } else {
      log.push(`Previous player has no last gain to copy`);
    }
  } else {
    log.push(`No previous player gain to copy`);
  }

  return { state: newState, log };
}

/** flourish: Gain 3 of each active god color */
export function flourish(state, playerId) {
  const activeGods = state.gods || ['gold', 'black', 'green', 'yellow'];
  const gain = {};
  for (const color of activeGods) {
    gain[color] = 3;
  }

  const newState = addResources(state, playerId, gain);
  return { state: newState, log: [`Flourish: gained ${formatResources(gain)}`] };
}

export const yellowActions = {
  yellow_forage: forage,
  yellow_gather: gather,
  yellow_bless: bless,
  yellow_trade: trade,
  yellow_harvest: harvest,
  yellow_commune: commune,
  yellow_flourish: flourish,
};
