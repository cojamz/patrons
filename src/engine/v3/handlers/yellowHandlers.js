/**
 * Patrons v3 — Yellow God Handler Resolvers
 *
 * Each resolver: (state, handler, eventData, options) => { state, log, pendingDecisions }
 * All pure functions. No mutation.
 */

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

function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

// --- Resolvers ---

/**
 * Horn of Plenty: At round start, +1 of each active color.
 */
function hornOfPlentyResolver(state, handler, _eventData, _options) {
  const activeColors = state.activeColors || ['gold', 'black', 'green', 'yellow'];
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
 * Rainbow Crest: When you gain resources of 2+ different colors in one event, +1 of any color.
 * For now, picks the first active color.
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

  const activeColors = state.activeColors || ['gold', 'black', 'green', 'yellow'];
  const chosenColor = activeColors[0] || 'gold';

  const newState = addResourceToPlayer(state, handler.ownerId, chosenColor, 1);
  return {
    state: newState,
    log: [`Rainbow Crest: +1 ${chosenColor} (gained 2+ colors)`],
    pendingDecisions: [],
  };
}

/**
 * Alchemist's Trunk: At round start, return pending decision for resource redistribution.
 */
function alchemistsTrunkResolver(state, handler, _eventData, _options) {
  return {
    state,
    log: ["Alchemist's Trunk: redistribute resources"],
    pendingDecisions: [{
      type: 'redistributeResources',
      title: "Alchemist's Trunk: Redistribute your resources",
      ownerId: handler.ownerId,
      sourceId: 'alchemists_trunk',
    }],
  };
}

/**
 * Abundance Charm: When you gain resources from a basic gain action, +1 extra of the gained resource.
 */
function abundanceCharmResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  if (eventData.source !== 'action') {
    return { state, log: [], pendingDecisions: [] };
  }

  if (!eventData.isBasicGain) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Add +1 of the primary resource gained
  const resources = eventData.resources || {};
  const primaryColor = Object.keys(resources).find(c => resources[c] > 0);
  if (!primaryColor) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addResourceToPlayer(state, handler.ownerId, primaryColor, 1);
  return {
    state: newState,
    log: [`Abundance Charm: +1 extra ${primaryColor}`],
    pendingDecisions: [],
  };
}

/**
 * Traveler's Journal: At turn end, if you gained 2+ different colors this turn, +1 Glory.
 */
function travelersJournalResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const turnGains = (state.turnResourceGains || {})[handler.ownerId] || {};
  const distinctColors = Object.keys(turnGains).filter(color => turnGains[color] > 0);

  if (distinctColors.length < 2) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addGloryToPlayer(state, handler.ownerId, 1, 'travelers_journal');
  return {
    state: newState,
    log: [`Traveler's Journal: +1 Glory (gained ${distinctColors.length} different colors this turn)`],
    pendingDecisions: [],
  };
}

/**
 * Yellow Glory Condition: At round end, +1 Glory per different resource color owned.
 */
function yellowGloryConditionResolver(state, handler, _eventData, _options) {
  const player = getPlayer(state, handler.ownerId);
  const resources = player.resources || {};
  const colorsOwned = Object.keys(resources).filter(c => (resources[c] || 0) > 0);
  const count = colorsOwned.length;

  if (count <= 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addGloryToPlayer(state, handler.ownerId, count, 'yellow_glory_condition');
  return {
    state: newState,
    log: [`Yellow Glory: +${count} Glory (${count} different resource colors owned)`],
    pendingDecisions: [],
  };
}

export const yellowHandlers = {
  horn_of_plenty: hornOfPlentyResolver,
  rainbow_crest: rainbowCrestResolver,
  alchemists_trunk: alchemistsTrunkResolver,
  abundance_charm: abundanceCharmResolver,
  travelers_journal: travelersJournalResolver,
  yellow_glory_condition: yellowGloryConditionResolver,
};
