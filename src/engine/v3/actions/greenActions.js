/**
 * Patrons v3 — Green God Action Handlers (Balance Rework)
 *
 * Each handler: (state, playerId, gods, decisions?, recursionDepth?) => { state, log, pendingDecision?, executeAction? }
 * All pure functions. No mutation.
 */

import { isRepeatExcluded, getActionTier, getAllActions, getRepeatableActions } from '../rules.js';

// --- Helpers ---

function addResources(state, playerId, resources) {
  const player = state.players.find(p => p.id === playerId);
  const hasDouble = player?.effects?.includes('doubleNextGain');
  const effective = hasDouble
    ? Object.fromEntries(Object.entries(resources).map(([c, a]) => [c, a * 2]))
    : resources;
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const newResources = { ...p.resources };
    Object.entries(effective).forEach(([color, amount]) => {
      newResources[color] = (newResources[color] || 0) + amount;
    });
    let newEffects = p.effects;
    if (hasDouble) {
      newEffects = [...(p.effects || [])];
      const idx = newEffects.indexOf('doubleNextGain');
      if (idx >= 0) newEffects.splice(idx, 1);
    }
    return { ...p, resources: newResources, lastGain: { ...effective }, ...(hasDouble ? { effects: newEffects } : {}) };
  });
  return { ...state, players };
}

/**
 * Get actions placed by other players at a specific tier (from roundActions).
 * Excludes repeat-excluded actions.
 */
function getOtherPlayerActions(state, playerId, tier, gods) {
  const roundActions = state.roundActions || [];
  const actions = roundActions
    .filter(ra => ra.playerId !== playerId)
    .map(ra => ra.actionId)
    .filter(id => !isRepeatExcluded(id))
    .filter(id => getActionTier(id, gods) === tier);
  return [...new Set(actions)];
}

/**
 * Get unoccupied actions at a specific tier.
 * Excludes repeat-excluded actions.
 */
function getUnoccupiedActions(state, tier, gods) {
  const round = state.round || 1;
  const occupied = state.occupiedSpaces || {};
  const allActions = getAllActions(state);
  return allActions
    .filter(a => a.tier === tier && a.tier <= round)
    .filter(a => !occupied[a.id])
    .filter(a => !isRepeatExcluded(a.id))
    .map(a => a.id);
}

// --- Green Actions ---

/** gather: +3 green */
export function gather(state, playerId) {
  const newState = addResources(state, playerId, { green: 3 });
  return { state: newState, log: ['+3 green'] };
}

/** relive: +1 green, repeat one of your T1 actions */
export function relive(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  let newState = decisions._continued ? state : addResources(state, playerId, { green: 1 });
  const logPrefix = decisions._continued ? [] : ['+1 green'];

  if (!decisions.actionChoice) {
    const repeatable = getRepeatableActions(newState, playerId)
      .filter(id => getActionTier(id, gods) === 1);
    if (repeatable.length === 0) {
      return { state: newState, log: ['No Tier 1 actions to repeat — place a worker elsewhere first'], abort: true };
    }
    return {
      state: newState,
      log: ['+1 green'],
      pendingDecision: {
        type: 'actionChoice',
        title: 'Choose a Tier 1 action to repeat',
        options: repeatable,
      },
    };
  }

  const chosenAction = decisions.actionChoice;
  if (isRepeatExcluded(chosenAction)) {
    return { state: newState, log: [...logPrefix, `Cannot repeat ${chosenAction} (repeat-excluded)`] };
  }

  return {
    state: newState,
    log: [...logPrefix, `Repeating ${chosenAction}`],
    executeAction: {
      playerId,
      actionId: chosenAction,
      decisions: {},
      recursionDepth: recursionDepth + 1,
    },
  };
}

/** echo: +1 green, repeat another player's T1 action */
export function echo(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  let newState = decisions._continued ? state : addResources(state, playerId, { green: 1 });
  const logPrefix = decisions._continued ? [] : ['+1 green'];

  if (!decisions.actionChoice) {
    const otherActions = getOtherPlayerActions(newState, playerId, 1, gods);
    if (otherActions.length === 0) {
      return { state: newState, log: ['No other players\' T1 actions to copy'], abort: true };
    }
    return {
      state: newState,
      log: ['+1 green'],
      pendingDecision: {
        type: 'actionChoice',
        title: 'Choose another player\'s Tier 1 action to copy',
        options: otherActions,
      },
    };
  }

  const chosenAction = decisions.actionChoice;
  if (isRepeatExcluded(chosenAction)) {
    return { state: newState, log: [...logPrefix, `Cannot copy ${chosenAction} (repeat-excluded)`] };
  }

  return {
    state: newState,
    log: [...logPrefix, `Copying ${chosenAction}`],
    executeAction: {
      playerId,
      actionId: chosenAction,
      decisions: {},
      recursionDepth: recursionDepth + 1,
    },
  };
}

/** recall: +1 green, repeat an unoccupied T1 action */
export function recall(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  let newState = decisions._continued ? state : addResources(state, playerId, { green: 1 });
  const logPrefix = decisions._continued ? [] : ['+1 green'];

  if (!decisions.actionChoice) {
    const unoccupied = getUnoccupiedActions(newState, 1, gods);
    if (unoccupied.length === 0) {
      return { state: newState, log: ['No unoccupied Tier 1 actions available'], abort: true };
    }
    return {
      state: newState,
      log: ['+1 green'],
      pendingDecision: {
        type: 'actionChoice',
        title: 'Choose an unoccupied Tier 1 action to repeat',
        options: unoccupied,
      },
    };
  }

  const chosenAction = decisions.actionChoice;
  if (isRepeatExcluded(chosenAction)) {
    return { state: newState, log: [...logPrefix, `Cannot repeat ${chosenAction} (repeat-excluded)`] };
  }

  return {
    state: newState,
    log: [...logPrefix, `Repeating unoccupied ${chosenAction}`],
    executeAction: {
      playerId,
      actionId: chosenAction,
      decisions: {},
      recursionDepth: recursionDepth + 1,
    },
  };
}

/** rewind: +1 green, repeat another player's T2 action */
export function rewind(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  let newState = decisions._continued ? state : addResources(state, playerId, { green: 1 });
  const logPrefix = decisions._continued ? [] : ['+1 green'];

  if (!decisions.actionChoice) {
    const otherActions = getOtherPlayerActions(newState, playerId, 2, gods);
    if (otherActions.length === 0) {
      return { state: newState, log: ['No other players\' T2 actions to copy'], abort: true };
    }
    return {
      state: newState,
      log: ['+1 green'],
      pendingDecision: {
        type: 'actionChoice',
        title: 'Choose another player\'s Tier 2 action to copy',
        options: otherActions,
      },
    };
  }

  const chosenAction = decisions.actionChoice;
  if (isRepeatExcluded(chosenAction)) {
    return { state: newState, log: [...logPrefix, `Cannot copy ${chosenAction} (repeat-excluded)`] };
  }

  return {
    state: newState,
    log: [...logPrefix, `Copying T2 ${chosenAction}`],
    executeAction: {
      playerId,
      actionId: chosenAction,
      decisions: {},
      recursionDepth: recursionDepth + 1,
    },
  };
}

/** foresight: +1 green, repeat an unoccupied T2 action */
export function foresight(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  let newState = decisions._continued ? state : addResources(state, playerId, { green: 1 });
  const logPrefix = decisions._continued ? [] : ['+1 green'];

  if (!decisions.actionChoice) {
    const unoccupied = getUnoccupiedActions(newState, 2, gods);
    if (unoccupied.length === 0) {
      return { state: newState, log: ['No unoccupied Tier 2 actions available'], abort: true };
    }
    return {
      state: newState,
      log: ['+1 green'],
      pendingDecision: {
        type: 'actionChoice',
        title: 'Choose an unoccupied Tier 2 action to repeat',
        options: unoccupied,
      },
    };
  }

  const chosenAction = decisions.actionChoice;
  if (isRepeatExcluded(chosenAction)) {
    return { state: newState, log: [...logPrefix, `Cannot repeat ${chosenAction} (repeat-excluded)`] };
  }

  return {
    state: newState,
    log: [...logPrefix, `Repeating unoccupied T2 ${chosenAction}`],
    executeAction: {
      playerId,
      actionId: chosenAction,
      decisions: {},
      recursionDepth: recursionDepth + 1,
    },
  };
}

/** eternity: Repeat all actions where you have workers placed this round */
export function eternity(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  const roundActions = state.roundActions || [];

  // Get this player's placed actions this round, excluding eternity itself and repeat-excluded
  const ownActions = roundActions
    .filter(ra => ra.playerId === playerId)
    .filter(ra => ra.actionId !== 'green_eternity')
    .filter(ra => !isRepeatExcluded(ra.actionId))
    .map(ra => ra.actionId);

  // Deduplicate (if placed on same action twice via Timeline Splitter, only replay once)
  const uniqueActions = [...new Set(ownActions)];

  if (uniqueActions.length === 0) {
    return { state, log: ['Eternity: no actions to replay'] };
  }

  // Chain all actions: execute first, chain the rest
  const [firstAction, ...restActions] = uniqueActions;

  return {
    state,
    log: [`Eternity: replaying ${uniqueActions.length} action${uniqueActions.length > 1 ? 's' : ''}`],
    executeAction: {
      playerId,
      actionId: firstAction,
      decisions: {},
      recursionDepth: recursionDepth + 1,
      chainedActions: restActions.map(actionId => ({
        playerId,
        actionId,
        decisions: {},
        recursionDepth: recursionDepth + 1,
      })),
    },
  };
}

export const greenActions = {
  green_gather: gather,
  green_relive: relive,
  green_echo: echo,
  green_recall: recall,
  green_rewind: rewind,
  green_foresight: foresight,
  green_eternity: eternity,
};
