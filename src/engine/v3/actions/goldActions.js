/**
 * Patrons v3 — Gold God Action Handlers
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

// --- Gold Actions ---

/** collect_tribute: +2 gold */
export function collectTribute(state, playerId) {
  const gain = { gold: 2 };
  const newState = addResources(state, playerId, gain);
  return { state: newState, log: [`+2 gold`] };
}

/** barter: Trade 2 any resources for 2 gold */
export function barter(state, playerId, gods, decisions = {}) {
  if (!decisions.gemSelection) {
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'gemSelection',
        count: 2,
        title: 'Choose 2 resources to trade for 2 gold',
      },
    };
  }

  const selection = decisions.gemSelection;
  const total = Object.values(selection).reduce((sum, v) => sum + v, 0);
  if (total !== 2) {
    return { state, log: ['Invalid selection: must choose exactly 2 resources'] };
  }

  // Verify player has the resources
  const player = getPlayer(state, playerId);
  for (const [color, amount] of Object.entries(selection)) {
    if ((player.resources[color] || 0) < amount) {
      return { state, log: [`Not enough ${color} to trade`] };
    }
  }

  let newState = removeResources(state, playerId, selection);
  newState = addResources(newState, playerId, { gold: 2 });
  return { state: newState, log: [`Traded ${formatResources(selection)} for 2 gold`] };
}

/** scavenge: +1 gold */
export function scavenge(state, playerId) {
  const newState = addResources(state, playerId, { gold: 1 });
  return { state: newState, log: [`+1 gold`] };
}

/** appraise: Trade 1 any resource for 1 gold */
export function appraise(state, playerId, gods, decisions = {}) {
  if (!decisions.gemSelection) {
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'gemSelection',
        count: 1,
        title: 'Choose 1 resource to trade for 1 gold',
      },
    };
  }

  const selection = decisions.gemSelection;
  const total = Object.values(selection).reduce((sum, v) => sum + v, 0);
  if (total !== 1) {
    return { state, log: ['Invalid selection: must choose exactly 1 resource'] };
  }

  const player = getPlayer(state, playerId);
  for (const [color, amount] of Object.entries(selection)) {
    if ((player.resources[color] || 0) < amount) {
      return { state, log: [`Not enough ${color} to trade`] };
    }
  }

  let newState = removeResources(state, playerId, selection);
  newState = addResources(newState, playerId, { gold: 1 });
  return { state: newState, log: [`Traded ${formatResources(selection)} for 1 gold`] };
}

/** meditate_on_wealth: +3 gold, skip next action */
export function meditateOnWealth(state, playerId) {
  let newState = addResources(state, playerId, { gold: 3 });
  // Add skipNextAction effect
  const players = newState.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, effects: [...(p.effects || []), 'skipNextAction'] };
  });
  newState = { ...newState, players };
  return { state: newState, log: [`+3 gold, skip next action`] };
}

/** broker_deal: Trade 3 any resources for 3 gold */
export function brokerDeal(state, playerId, gods, decisions = {}) {
  if (!decisions.gemSelection) {
    return {
      state,
      log: [],
      pendingDecision: {
        type: 'gemSelection',
        count: 3,
        title: 'Choose 3 resources to trade for 3 gold',
      },
    };
  }

  const selection = decisions.gemSelection;
  const total = Object.values(selection).reduce((sum, v) => sum + v, 0);
  if (total !== 3) {
    return { state, log: ['Invalid selection: must choose exactly 3 resources'] };
  }

  const player = getPlayer(state, playerId);
  for (const [color, amount] of Object.entries(selection)) {
    if ((player.resources[color] || 0) < amount) {
      return { state, log: [`Not enough ${color} to trade`] };
    }
  }

  let newState = removeResources(state, playerId, selection);
  newState = addResources(newState, playerId, { gold: 3 });
  return { state: newState, log: [`Traded ${formatResources(selection)} for 3 gold`] };
}

/** cash_in: +1 Glory per gold owned */
export function cashIn(state, playerId) {
  const player = getPlayer(state, playerId);
  const goldOwned = player.resources.gold || 0;

  if (goldOwned <= 0) {
    return { state, log: ['Cash In: no gold owned, no Glory gained'] };
  }

  const newState = addGlory(state, playerId, goldOwned, 'cash_in');
  return { state: newState, log: [`Cash In: +${goldOwned} Glory (${goldOwned} gold owned)`] };
}

export const goldActions = {
  gold_collectTribute: collectTribute,
  gold_barter: barter,
  gold_scavenge: scavenge,
  gold_appraise: appraise,
  gold_meditateOnWealth: meditateOnWealth,
  gold_brokerDeal: brokerDeal,
  gold_cashIn: cashIn,
};
