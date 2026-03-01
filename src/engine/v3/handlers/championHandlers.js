/**
 * Patrons v3 — Champion Handler Resolvers
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

function addEffectToPlayer(state, playerId, effect) {
  const updatedPlayers = state.players.map(p => {
    if (p.id !== playerId) return p;
    return {
      ...p,
      effects: [...(p.effects || []), effect],
    };
  });
  return { ...state, players: updatedPlayers };
}

// --- Resolvers ---

/**
 * Prescient Passive: At round start, place a nullifier.
 */
function prescientPassiveResolver(state, handler, _eventData, _options) {
  return {
    state,
    log: ['The Prescient: place a nullifier'],
    pendingDecisions: [{
      type: 'nullifierPlacement',
      playerId: handler.ownerId,
      sourceId: 'prescient_passive',
    }],
  };
}

/**
 * Favored Passive: When you use a shop, +1 of the shop's god color.
 */
function favoredPassiveResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const shopColor = eventData.shopColor || 'gold';
  const newState = addResourceToPlayer(state, handler.ownerId, shopColor, 1);
  return {
    state: newState,
    log: [`The Favored: +1 ${shopColor} (used a shop)`],
    pendingDecisions: [],
  };
}

/**
 * Deft Passive: At turn start (once per round), offer a second action.
 */
function deftPassiveResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addEffectToPlayer(state, handler.ownerId, 'extraActionThisTurn');
  return {
    state: newState,
    log: ['The Deft: extra action available this turn'],
    pendingDecisions: [],
  };
}

export const championHandlers = {
  prescient_passive: prescientPassiveResolver,
  favored_passive: favoredPassiveResolver,
  deft_passive: deftPassiveResolver,
};
