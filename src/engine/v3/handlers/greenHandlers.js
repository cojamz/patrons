/**
 * Patrons v3 — Green God Handler Resolvers
 *
 * Each resolver: (state, handler, eventData, options) => { state, log, pendingDecisions }
 * All pure functions. No mutation.
 */

import { dispatchEvent, EventType } from '../events.js';

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
 * Capacitor: When you repeat an action, +1 green.
 */
function capacitorResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addResourceToPlayer(state, handler.ownerId, 'green', 1);
  return {
    state: newState,
    log: ['Capacitor: +1 green (repeated an action)'],
    pendingDecisions: [],
  };
}

/**
 * Crystal Watch: At round start, +3 green.
 */
function crystalWatchResolver(state, handler, _eventData, _options) {
  const newState = addResourceToPlayer(state, handler.ownerId, 'green', 3);
  return {
    state: newState,
    log: ['Crystal Watch: +3 green at round start'],
    pendingDecisions: [],
  };
}

/**
 * Diadem of Expertise: When you repeat an action, trigger Glory condition twice.
 * Dispatches green_glory_condition manually with doubled effect.
 */
function diademOfExpertiseResolver(state, handler, eventData, options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const log = ['Diadem of Expertise: triggering Glory condition twice'];
  const pendingDecisions = [];
  let newState = state;

  // Trigger green glory condition twice
  for (let i = 0; i < 2; i++) {
    newState = addGloryToPlayer(newState, handler.ownerId, 1, 'green_glory_condition');
  }

  log.push('Diadem of Expertise: +2 Glory (double Glory condition)');
  return { state: newState, log, pendingDecisions };
}

/**
 * Green Glory Condition: When you repeat or copy an action, +1 Glory.
 */
function greenGloryConditionResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addGloryToPlayer(state, handler.ownerId, 1, 'green_glory_condition');
  return {
    state: newState,
    log: ['Green Glory: +1 Glory (repeated/copied an action)'],
    pendingDecisions: [],
  };
}

export const greenHandlers = {
  capacitor: capacitorResolver,
  crystal_watch: crystalWatchResolver,
  diadem_of_expertise: diademOfExpertiseResolver,
  green_glory_condition: greenGloryConditionResolver,
};
