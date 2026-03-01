/**
 * Patrons v3 — Gold God Handler Resolvers
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

function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

// --- Resolvers ---

/**
 * Golden Scepter: When you gain gold, gain +1 extra gold.
 * CRITICAL: dispatches sub-event with skipHandlerIds to prevent infinite loop.
 */
function goldenScepterResolver(state, handler, eventData, options) {
  const log = [];
  const pendingDecisions = [];

  // Only fires when the event includes gold resources
  const resources = eventData.resources || {};
  if (!resources.gold || resources.gold <= 0) {
    return { state, log, pendingDecisions };
  }

  let newState = addResourceToPlayer(state, handler.ownerId, 'gold', 1);
  log.push(`Golden Scepter: +1 gold`);

  // Dispatch sub-event for the bonus gold, but skip this handler to prevent infinite loop
  const subResult = dispatchEvent(
    newState,
    EventType.RESOURCE_GAINED,
    { playerId: handler.ownerId, resources: { gold: 1 }, source: 'power_card' },
    {
      ...options,
      skipHandlerIds: [...(options.skipHandlerIds || []), handler.id],
    }
  );

  newState = subResult.state;
  log.push(...subResult.log);
  pendingDecisions.push(...subResult.pendingDecisions);

  return { state: newState, log, pendingDecisions };
}

/**
 * Gold Idol: At round start, +2 gold.
 */
function goldIdolResolver(state, handler, _eventData, _options) {
  const newState = addResourceToPlayer(state, handler.ownerId, 'gold', 2);
  return {
    state: newState,
    log: ['Gold Idol: +2 gold at round start'],
    pendingDecisions: [],
  };
}

/**
 * Golden Chalice: When you gain gold from an action, gain 1 of any other active resource.
 * For now, picks the first non-gold active color.
 */
function goldenChaliceResolver(state, handler, eventData, _options) {
  const resources = eventData.resources || {};
  if (!resources.gold || resources.gold <= 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Only from action source
  if (eventData.source !== 'action') {
    return { state, log: [], pendingDecisions: [] };
  }

  const activeColors = state.activeColors || ['gold', 'black', 'green', 'yellow'];
  const nonGold = activeColors.filter(c => c !== 'gold');
  const chosenColor = nonGold[0] || 'black';

  const newState = addResourceToPlayer(state, handler.ownerId, chosenColor, 1);
  return {
    state: newState,
    log: [`Golden Chalice: +1 ${chosenColor}`],
    pendingDecisions: [],
  };
}

/**
 * Golden Ring: When another player gains gold, you gain 1 gold.
 */
function goldenRingResolver(state, handler, eventData, _options) {
  const resources = eventData.resources || {};
  if (!resources.gold || resources.gold <= 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Only fires when a DIFFERENT player gains gold
  if (eventData.playerId === handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addResourceToPlayer(state, handler.ownerId, 'gold', 1);
  return {
    state: newState,
    log: ['Golden Ring: +1 gold (another player gained gold)'],
    pendingDecisions: [],
  };
}

/**
 * Gold Crown: At game end, +Glory equal to floor(owner's gold / 2).
 */
function goldCrownResolver(state, handler, _eventData, _options) {
  const player = getPlayer(state, handler.ownerId);
  const goldCount = (player.resources || {}).gold || 0;
  const gloryGain = Math.floor(goldCount / 2);

  if (gloryGain <= 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addGloryToPlayer(state, handler.ownerId, gloryGain, 'gold_crown');
  return {
    state: newState,
    log: [`Gold Crown: +${gloryGain} Glory (${goldCount} gold / 2)`],
    pendingDecisions: [],
  };
}

/**
 * Gold Glory Condition: At round end, +Glory equal to gold count.
 */
function goldGloryConditionResolver(state, handler, _eventData, _options) {
  const player = getPlayer(state, handler.ownerId);
  const goldCount = (player.resources || {}).gold || 0;

  if (goldCount <= 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addGloryToPlayer(state, handler.ownerId, goldCount, 'gold_glory_condition');
  return {
    state: newState,
    log: [`Gold Glory: +${goldCount} Glory (${goldCount} gold owned)`],
    pendingDecisions: [],
  };
}

export const goldHandlers = {
  golden_scepter: goldenScepterResolver,
  gold_idol: goldIdolResolver,
  golden_chalice: goldenChaliceResolver,
  golden_ring: goldenRingResolver,
  gold_crown: goldCrownResolver,
  gold_glory_condition: goldGloryConditionResolver,
};
