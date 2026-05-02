/**
 * Patrons v3 — Champion Handler Resolvers
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

// --- Resolvers ---

/**
 * Prescient Passive: At round start, place 2 nullifiers.
 */
function prescientPassiveResolver(state, handler, _eventData, _options) {
  return {
    state,
    log: ['The Prescient: place 2 nullifiers'],
    pendingDecisions: [
      {
        type: 'nullifierPlacement',
        playerId: handler.ownerId,
        sourceId: 'prescient_passive',
      },
      {
        type: 'nullifierPlacement',
        playerId: handler.ownerId,
        sourceId: 'prescient_passive',
      },
    ],
  };
}

/**
 * Favored Passive: When you use a shop, +1 of the shop's god color.
 */
function favoredPassiveResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const shopColor = eventData.godColor || 'gold';
  const newState = addResourceToPlayer(state, handler.ownerId, shopColor, 1);
  return {
    state: newState,
    log: [`The Favored: +1 ${shopColor} (used a shop)`],
    pendingDecisions: [],
  };
}

/**
 * Deft Passive: At round 1 start, grant one consecutive turn (go twice in a row).
 */
function deftPassiveResolver(state, handler, _eventData, _options) {
  // Only activates in Round 1
  if (state.round !== 1) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = {
    ...state,
    players: state.players.map(p => {
      if (p.id !== handler.ownerId) return p;
      return { ...p, extraTurns: (p.extraTurns || 0) + 1 };
    }),
  };
  return {
    state: newState,
    log: ['The Deft: consecutive turns granted (Round 1)'],
    pendingDecisions: [],
  };
}

export const championHandlers = {
  prescient_passive: prescientPassiveResolver,
  favored_passive: favoredPassiveResolver,
  deft_passive: deftPassiveResolver,
};
