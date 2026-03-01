/**
 * Patrons v3 — Black God Handler Resolvers
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

// --- Resolvers ---

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
 * Voodoo Doll: At round end, choose a player to lose 2 Glory.
 */
function voodooDollResolver(state, handler, _eventData, _options) {
  return {
    state,
    log: ['Voodoo Doll: choose a player to lose 2 Glory'],
    pendingDecisions: [{
      type: 'targetPlayer',
      title: 'Voodoo Doll: Choose a player to lose 2 Glory',
      ownerId: handler.ownerId,
      excludePlayer: handler.ownerId,
      effect: { gloryLoss: 2 },
      sourceId: 'voodoo_doll',
    }],
  };
}

/**
 * Thieves' Gloves: When you steal resources or glory, +1 of any resource.
 * For now, picks the first active color.
 */
function thievesGlovesResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const activeColors = state.activeColors || ['gold', 'black', 'green', 'yellow'];
  const chosenColor = activeColors[0] || 'gold';

  const newState = addResourceToPlayer(state, handler.ownerId, chosenColor, 1);
  return {
    state: newState,
    log: [`Thieves' Gloves: +1 ${chosenColor} (bonus from stealing)`],
    pendingDecisions: [],
  };
}

/**
 * Cursed Blade: When you steal Glory, steal 1 extra Glory.
 */
function cursedBladeResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Add 1 glory to the stealer and remove 1 from the target
  let newState = addGloryToPlayer(state, handler.ownerId, 1, 'cursed_blade');

  if (eventData.targetPlayerId) {
    newState = addGloryToPlayer(newState, eventData.targetPlayerId, -1, 'cursed_blade_victim');
  }

  return {
    state: newState,
    log: ['Cursed Blade: steal 1 extra Glory'],
    pendingDecisions: [],
  };
}

/**
 * Black Glory Condition: When you penalize another player, +1 Glory.
 */
function blackGloryConditionResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addGloryToPlayer(state, handler.ownerId, 1, 'black_glory_condition');
  return {
    state: newState,
    log: ['Black Glory: +1 Glory (penalized a player)'],
    pendingDecisions: [],
  };
}

export const blackHandlers = {
  onyx_spyglass: onyxSpyglassResolver,
  voodoo_doll: voodooDollResolver,
  thieves_gloves: thievesGlovesResolver,
  cursed_blade: cursedBladeResolver,
  black_glory_condition: blackGloryConditionResolver,
};
