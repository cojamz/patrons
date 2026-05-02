/**
 * Patrons v3 — Yellow God Handler Resolvers (Balance Rework)
 *
 * Each resolver: (state, handler, eventData, options) => { state, log, pendingDecisions }
 * All pure functions. No mutation.
 */

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

function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

// --- Resolvers ---

/**
 * Rainbow Crest: +1 any when gaining 2+ colors (action or shop).
 * Returns a pending decision so the player can choose which resource to gain.
 */
function rainbowCrestResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const resources = eventData.resources || {};
  const colorsGained = Object.keys(resources).filter(c => resources[c] > 0);

  if (colorsGained.length < 2) {
    return { state, log: [], pendingDecisions: [] };
  }

  const activeColors = state.gods || ['gold', 'black', 'green', 'yellow'];

  return {
    state,
    log: ['Rainbow Crest: gained 2+ colors — choose a resource to gain'],
    pendingDecisions: [{
      type: 'gemSelection',
      count: 1,
      title: 'Rainbow Crest: Choose 1 resource to gain',
      ownerId: handler.ownerId,
      playerId: handler.ownerId,
      sourceId: 'rainbow_crest',
      colors: activeColors,
    }],
  };
}

/**
 * Extraction Vial: When you gain resources from a non-yellow god's action, +1 yellow.
 */
function extractionVialResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  if (eventData.source !== 'action') {
    return { state, log: [], pendingDecisions: [] };
  }

  const godColor = eventData.godColor || '';
  if (godColor === 'yellow' || !godColor) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addResourceToPlayer(state, handler.ownerId, 'yellow', 1);
  return {
    state: newState,
    log: [`Extraction Vial: +1 yellow (${godColor} god action)`],
    pendingDecisions: [],
  };
}

/**
 * Slag Catcher: Spent 3+ resources in a turn → gain 1 yellow (once/turn).
 * Fires at turn end. Checks turn spending tracking.
 */
function slagCatcherResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Check turn spending (tracked in turnResourceSpending or calculated from state)
  const turnSpending = (state.turnResourceSpending || {})[handler.ownerId] || 0;
  if (turnSpending < 3) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addResourceToPlayer(state, handler.ownerId, 'yellow', 1);
  return {
    state: newState,
    log: ['Slag Catcher: +1 yellow (spent 3+ resources this turn)'],
    pendingDecisions: [],
  };
}

/**
 * Alchemist's Trunk: At round start, return pending decision for resource redistribution.
 */
function alchemistsTrunkResolver(state, handler, _eventData, _options) {
  const player = getPlayer(state, handler.ownerId);
  const totalResources = Object.values(player?.resources || {}).reduce((s, v) => s + Math.max(0, v), 0);

  if (totalResources === 0) {
    return { state, log: ["Alchemist's Trunk: no resources to redistribute"], pendingDecisions: [] };
  }

  return {
    state,
    log: ["Alchemist's Trunk: redistribute resources"],
    pendingDecisions: [{
      type: 'redistributeResources',
      title: "Alchemist's Trunk: Redistribute your resources",
      playerId: handler.ownerId,
      ownerId: handler.ownerId,
      sourceId: 'alchemists_trunk',
      totalResources,
      colors: state.gods || ['gold', 'black', 'green', 'yellow'],
    }],
  };
}

/**
 * Horn of Plenty: At round start, +1 of each active color.
 */
function hornOfPlentyResolver(state, handler, _eventData, _options) {
  const activeColors = state.gods || ['gold', 'black', 'green', 'yellow'];
  let newState = state;

  for (const color of activeColors) {
    newState = addResourceToPlayer(newState, handler.ownerId, color, 1);
  }

  return {
    state: newState,
    log: [`Horn of Plenty: +1 of each active color (${activeColors.join(', ')})`],
    pendingDecisions: [],
  };
}

/**
 * Yellow Favor Condition: +1 Favor each time you gain a resource color you had 0 of.
 * Fires inline during gameplay on ON_GAIN_NEW_COLOR events.
 */
function yellowGloryConditionResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // eventData should include how many new colors were gained (0→N transitions)
  const newColorsCount = eventData.newColorsCount || 1;

  const newState = addGloryToPlayer(state, handler.ownerId, newColorsCount, 'yellow_glory_condition');
  return {
    state: newState,
    log: [`Yellow Favor: +${newColorsCount} Favor (gained ${newColorsCount} new color${newColorsCount > 1 ? 's' : ''})`],
    pendingDecisions: [],
  };
}

export const yellowHandlers = {
  rainbow_crest: rainbowCrestResolver,
  extraction_vial: extractionVialResolver,
  slag_catcher: slagCatcherResolver,
  alchemists_trunk: alchemistsTrunkResolver,
  horn_of_plenty: hornOfPlentyResolver,
  yellow_glory_condition: yellowGloryConditionResolver,
};
