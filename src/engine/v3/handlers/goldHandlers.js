/**
 * Patrons v3 — Gold God Handler Resolvers (Balance Rework)
 *
 * Each resolver: (state, handler, eventData, options) => { state, log, pendingDecisions }
 * All pure functions. No mutation.
 */

import { dispatchEvent, EventType } from '../events.js';
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
 * Golden Scepter: +1 extra gold when gaining gold from actions (actions only).
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

  // Only from action source
  if (eventData.source !== 'action') {
    return { state, log, pendingDecisions };
  }

  let newState = addResourceToPlayer(state, handler.ownerId, 'gold', 1);
  log.push('Golden Scepter: +1 gold');

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
 * Rainbow Scepter: +1 any other color when gaining gold from actions.
 * Auto-picks the player's lowest non-gold active resource.
 */
function rainbowScepterResolver(state, handler, eventData, _options) {
  const resources = eventData.resources || {};
  if (!resources.gold || resources.gold <= 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Only from action source
  if (eventData.source !== 'action') {
    return { state, log: [], pendingDecisions: [] };
  }

  const activeGods = state.gods || ['gold', 'black', 'green', 'yellow'];
  const nonGold = activeGods.filter(c => c !== 'gold');

  // Auto-pick lowest non-gold resource for simplicity (AI-friendly)
  const player = getPlayer(state, handler.ownerId);
  const sortedColors = nonGold.sort((a, b) =>
    (player.resources[a] || 0) - (player.resources[b] || 0)
  );
  const chosenColor = sortedColors[0] || nonGold[0];

  const newState = addResourceToPlayer(state, handler.ownerId, chosenColor, 1);
  return {
    state: newState,
    log: [`Rainbow Scepter: +1 ${chosenColor} (gained gold from action)`],
    pendingDecisions: [],
  };
}

/**
 * Golden Ring: At the start of your turn, gain 1 gold (once per turn).
 */
function goldenRingResolver(state, handler, eventData, _options) {
  // Only trigger for the card owner's turn
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addResourceToPlayer(state, handler.ownerId, 'gold', 1);
  return {
    state: newState,
    log: ['Golden Ring: +1 gold (start of turn)'],
    pendingDecisions: [],
  };
}

/**
 * Gold Crown: At game end, +1 Favor per 2 gold owned.
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
    log: [`Gold Crown: +${gloryGain} Favor (${goldCount} gold, 1 per 2)`],
    pendingDecisions: [],
  };
}

/**
 * Golden Scope: When a player steals from you, they lose 1 Favor.
 * Fires on resource.stolen where target is owner.
 */
function goldenScopeResolver(state, handler, eventData, _options) {
  // Only when someone steals FROM the owner
  if (eventData.targetPlayerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // The stealer loses 1 Favor
  const stealerId = eventData.playerId;
  const newState = removeGloryFromPlayer(state, stealerId, 1, 'golden_scope_penalty');

  return {
    state: newState,
    log: [`Golden Scope: ${stealerId} lost 1 Favor for stealing`],
    pendingDecisions: [],
  };
}

/**
 * Golden Idol: Whenever you gain Favor from a gold source, +1 extra Favor.
 * Fires on glory.gained where source contains 'gold'.
 */
function goldenIdolResolver(state, handler, eventData, options) {
  if (eventData.playerId !== handler.ownerId) {
    return { state, log: [], pendingDecisions: [] };
  }

  // Check if the glory source is gold-related
  const source = eventData.source || '';
  if (!source.includes('gold')) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addGloryToPlayer(state, handler.ownerId, 1, 'golden_idol');
  return {
    state: newState,
    log: ['Golden Idol: +1 extra Favor (from gold source)'],
    pendingDecisions: [],
  };
}

/**
 * Gold Favor Condition: At round end, +1 Favor per 2 gold owned.
 */
function goldGloryConditionResolver(state, handler, _eventData, _options) {
  const player = getPlayer(state, handler.ownerId);
  const goldCount = (player.resources || {}).gold || 0;
  const gloryGain = Math.floor(goldCount / 2);

  if (gloryGain <= 0) {
    return { state, log: [], pendingDecisions: [] };
  }

  const newState = addGloryToPlayer(state, handler.ownerId, gloryGain, 'gold_glory_condition');
  return {
    state: newState,
    log: [`Gold Favor: +${gloryGain} Favor (${goldCount} gold, 1 per 2)`],
    pendingDecisions: [],
  };
}

export const goldHandlers = {
  golden_scepter: goldenScepterResolver,
  rainbow_scepter: rainbowScepterResolver,
  golden_ring: goldenRingResolver,
  gold_crown: goldCrownResolver,
  golden_scope: goldenScopeResolver,
  golden_idol: goldenIdolResolver,
  gold_glory_condition: goldGloryConditionResolver,
};
