/**
 * Patrons v3 — Event System
 *
 * Pure-functional synchronous event bus. State in, state out.
 * Handlers register for event types. dispatchEvent finds matching handlers,
 * checks eligibility, runs them in priority order, and accumulates results.
 */

import { HANDLER_RESOLVERS } from './handlers/index.js';

// --- Event Type Constants ---

export const EventType = {
  RESOURCE_GAINED: 'resource.gained',
  RESOURCE_LOST: 'resource.lost',
  RESOURCE_STOLEN: 'resource.stolen',
  GLORY_GAINED: 'glory.gained',
  GLORY_LOST: 'glory.lost',
  GLORY_STOLEN: 'glory.stolen',
  ACTION_EXECUTED: 'action.executed',
  ACTION_REPEATED: 'action.repeated',
  ACTION_COPIED: 'action.copied',
  POWER_CARD_BOUGHT: 'card.bought',
  SHOP_USED: 'shop.used',
  PLAYER_PENALIZED: 'player.penalized',
  ROUND_START: 'phase.round_start',
  ROUND_END: 'phase.round_end',
  TURN_START: 'phase.turn_start',
  TURN_END: 'phase.turn_end',
  GAME_END: 'phase.game_end',
  NULLIFIER_PLACED: 'nullifier.placed',
};

// --- Source Priority ---
// Lower number = fires first.

const SOURCE_PRIORITY = {
  champion_passive: 0,
  power_card: 1,
  glory_condition: 2,
};

// --- Core Functions ---

/**
 * Dispatch an event through all registered handlers.
 * Returns { state, log, pendingDecisions }.
 */
export function dispatchEvent(state, eventType, eventData, options = {}) {
  const {
    maxDepth = 3,
    currentDepth = 0,
    skipHandlerIds = [],
  } = options;

  let currentState = state;
  const log = [];
  const pendingDecisions = [];

  // Bail if we've hit cascade depth limit
  if (currentDepth >= maxDepth) {
    return { state: currentState, log, pendingDecisions };
  }

  const handlers = (currentState.eventHandlers || [])
    .filter(h => h.eventType === eventType)
    .filter(h => !skipHandlerIds.includes(h.id))
    .filter(h => isHandlerEligible(h, eventData))
    .sort((a, b) => {
      const aPri = SOURCE_PRIORITY[a.source] ?? 99;
      const bPri = SOURCE_PRIORITY[b.source] ?? 99;
      return aPri - bPri;
    });

  for (const handler of handlers) {
    const resolver = HANDLER_RESOLVERS[handler.sourceId];
    if (!resolver) continue;

    // Mark handler as used before resolving (frequency tracking)
    currentState = markHandlerUsed(currentState, handler.id);

    const result = resolver(currentState, handler, eventData, {
      maxDepth,
      currentDepth: currentDepth + 1,
      skipHandlerIds,
    });

    currentState = result.state;
    if (result.log) log.push(...result.log);
    if (result.pendingDecisions) pendingDecisions.push(...result.pendingDecisions);
  }

  return { state: currentState, log, pendingDecisions };
}

/**
 * Register a handler on the state.
 * Handler shape: { id, eventType, source, sourceId, ownerId, config, frequency?, usesThisRound?, usesThisTurn? }
 */
export function registerHandler(state, handler) {
  const fullHandler = {
    usesThisRound: 0,
    usesThisTurn: 0,
    ...handler,
  };
  return {
    ...state,
    eventHandlers: [...(state.eventHandlers || []), fullHandler],
  };
}

/**
 * Remove a handler by id.
 */
export function removeHandler(state, handlerId) {
  return {
    ...state,
    eventHandlers: (state.eventHandlers || []).filter(h => h.id !== handlerId),
  };
}

/**
 * Reset frequency counters for all handlers at the given scope ('round' or 'turn').
 */
export function resetHandlerFrequencies(state, scope) {
  return {
    ...state,
    eventHandlers: (state.eventHandlers || []).map(h => {
      if (scope === 'round') {
        return { ...h, usesThisRound: 0, usesThisTurn: 0 };
      }
      if (scope === 'turn') {
        return { ...h, usesThisTurn: 0 };
      }
      return h;
    }),
  };
}

// --- Internal Helpers ---

/**
 * Check if a handler is eligible to fire for the given event data.
 * Checks triggerOn ('self' vs 'others') and frequency limits.
 */
function isHandlerEligible(handler, eventData) {
  const config = handler.config || {};

  // triggerOn filter: 'self' means only fires when ownerId === eventData.playerId
  if (config.triggerOn === 'self' && handler.ownerId !== eventData.playerId) {
    return false;
  }
  if (config.triggerOn === 'others' && handler.ownerId === eventData.playerId) {
    return false;
  }

  // Frequency limits
  if (handler.frequency === 'once_per_turn' && handler.usesThisTurn >= 1) {
    return false;
  }
  if (handler.frequency === 'once_per_round' && handler.usesThisRound >= 1) {
    return false;
  }

  return true;
}

/**
 * Increment usage counters on a handler.
 */
function markHandlerUsed(state, handlerId) {
  return {
    ...state,
    eventHandlers: (state.eventHandlers || []).map(h => {
      if (h.id !== handlerId) return h;
      return {
        ...h,
        usesThisRound: (h.usesThisRound || 0) + 1,
        usesThisTurn: (h.usesThisTurn || 0) + 1,
      };
    }),
  };
}
