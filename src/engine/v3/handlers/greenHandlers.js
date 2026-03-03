/**
 * Patrons v3 — Green God Handler Resolvers (Balance Rework)
 *
 * Each resolver: (state, handler, eventData, options) => { state, log, pendingDecisions }
 * All pure functions. No mutation.
 */

import { hasModifier } from '../rules.js';

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

function removeGloryFromPlayer(state, playerId, amount, source) {
  if (hasModifier(state, playerId, 'glory_reduction_immunity')) return state;
  return addGloryToPlayer(state, playerId, -amount, source);
}

function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

// --- Resolvers ---

/**
 * Flux Capacitor: When you gain green from a green god action, +1 extra green.
 */
function fluxCapacitorResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Only from green god actions
  if (eventData.source !== 'action') {
    return { state, log: [], pendingDecisions: [] };
  }

  const godColor = eventData.godColor || '';
  if (godColor !== 'green') {
    return { state, log: [], pendingDecisions: [] };
  }

  const resources = eventData.resources || {};
  if (!resources.green || resources.green <= 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addResourceToPlayer(state, handler.ownerId, 'green', 1);
  return {
    state: newState,
    log: ['Flux Capacitor: +1 green (green god action)'],
    pendingDecisions: [],
  };
}

/**
 * Resonance Crystal: When you repeat another god's action, gain 1 of that god's color.
 * Fires on action.repeated where the repeated action is from a non-green god.
 */
function resonanceCrystalResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const actionId = eventData.repeatedActionId || eventData.actionId || '';
  const godColor = actionId.split('_')[0];

  // Only for non-green god actions
  if (godColor === 'green' || !godColor) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addResourceToPlayer(state, handler.ownerId, godColor, 1);
  return {
    state: newState,
    log: [`Resonance Crystal: +1 ${godColor} (repeated non-green action)`],
    pendingDecisions: [],
  };
}

/**
 * Temporal Patent: When you repeat a player's action, that player loses 2 Favor.
 * Fires on action.repeated where the action was placed by another player.
 */
function temporalPatentResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Need to know which player's action was repeated
  const targetPlayerId = eventData.originalPlayerId;
  if (!targetPlayerId || targetPlayerId === handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = removeGloryFromPlayer(state, targetPlayerId, 2, 'temporal_patent');
  return {
    state: newState,
    log: [`Temporal Patent: ${targetPlayerId} lost 2 Favor (their action was repeated)`],
    pendingDecisions: [],
  };
}

/**
 * Diadem of Expertise: Your Favor condition triggers twice per repeat/copy.
 * Instead of the normal +1 from the glory condition, this adds an extra +1 (for +2 total).
 */
function diademOfExpertiseResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Add 1 extra Favor (the normal glory condition already gives +1)
  const newState = addGloryToPlayer(state, handler.ownerId, 1, 'diadem_of_expertise');
  return {
    state: newState,
    log: ['Diadem of Expertise: +1 extra Favor (double trigger)'],
    pendingDecisions: [],
  };
}

/**
 * Chrono Compass: At start of each round, choose your position in turn order.
 * Returns a pending decision for turn order choice.
 */
function chronoCompassResolver(state, handler, _eventData, _options) {
  const turnOrder = state.turnOrder || [];
  const positions = turnOrder.map((_, i) => i + 1);

  return {
    state,
    log: ['Chrono Compass: choose your position in turn order'],
    pendingDecisions: [{
      type: 'turnOrderChoice',
      title: 'Chrono Compass: Choose your position in turn order',
      ownerId: handler.ownerId,
      options: positions,
      sourceId: 'chrono_compass',
    }],
  };
}

/**
 * Green Favor Condition: +1 Favor every time you repeat or copy an action.
 * VP shop buff makes it +2.
 */
function greenGloryConditionResolver(state, handler, eventData, _options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Check for permanent buff from VP shop
  const player = getPlayer(state, handler.ownerId);
  const hasExtraBuff = (player.permanentBuffs || []).includes('extra_repeat_favor');
  const favorGain = hasExtraBuff ? 2 : 1;

  const newState = addGloryToPlayer(state, handler.ownerId, favorGain, 'green_glory_condition');
  return {
    state: newState,
    log: [`Green Favor: +${favorGain} Favor (repeated/copied an action)${hasExtraBuff ? ' [+1 from permanent buff]' : ''}`],
    pendingDecisions: [],
  };
}

export const greenHandlers = {
  flux_capacitor: fluxCapacitorResolver,
  resonance_crystal: resonanceCrystalResolver,
  temporal_patent: temporalPatentResolver,
  diadem_of_expertise: diademOfExpertiseResolver,
  chrono_compass: chronoCompassResolver,
  green_glory_condition: greenGloryConditionResolver,
};
