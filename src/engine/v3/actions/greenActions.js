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
  const newColors = Object.entries(effective)
    .filter(([color, amount]) => amount > 0 && (player.resources[color] || 0) === 0)
    .map(([color]) => color);
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
  let newState = { ...state, players };
  if (newColors.length > 0) {
    const prev = newState._pendingNewColors || [];
    newState._pendingNewColors = [...prev, { playerId, newColors }];
  }
  return newState;
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
      .filter(id => getActionTier(id, gods) === 1)
      .filter(id => id !== 'green_relive'); // can't repeat itself
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
  if (isRepeatExcluded(chosenAction) || chosenAction === 'green_relive') {
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
    const unoccupied = getUnoccupiedActions(newState, 1, gods)
      .filter(id => id !== 'green_recall'); // can't repeat itself
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
  if (isRepeatExcluded(chosenAction) || chosenAction === 'green_recall') {
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
    const unoccupied = getUnoccupiedActions(newState, 2, gods)
      .filter(id => id !== 'green_foresight'); // can't repeat itself
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
  if (isRepeatExcluded(chosenAction) || chosenAction === 'green_foresight') {
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

// Green repeat actions that Eternity should NOT replay (prevents exponential chain)
const ETERNITY_EXCLUDED = new Set([
  'green_relive', 'green_echo', 'green_recall',
  'green_rewind', 'green_foresight', 'green_eternity',
]);

/** eternity: Repeat all actions where you have workers placed this round.
 *  Player chooses the order — sequential picks via _actionChainQueue.
 */
export function eternity(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  const roundActions = state.roundActions || [];

  // Get this player's placed actions this round, excluding eternity itself and all green repeat actions
  const ownActions = roundActions
    .filter(ra => ra.playerId === playerId)
    .filter(ra => !ETERNITY_EXCLUDED.has(ra.actionId))
    .map(ra => ra.actionId);

  // Deduplicate (if placed on same action twice via Timeline Splitter, only replay once)
  const uniqueActions = [...new Set(ownActions)];

  if (uniqueActions.length === 0) {
    return { state, log: ['Eternity: no actions to replay'] };
  }

  // Use _remaining to track which actions are still available (set after first pick)
  const remaining = decisions._remaining || uniqueActions;

  // If player hasn't chosen yet, present the choice
  if (!decisions.actionChoice) {
    // Only 1 action left — auto-execute, no choice needed
    if (remaining.length === 1) {
      return {
        state,
        log: [`Eternity: replaying ${remaining[0]}`],
        executeAction: {
          playerId,
          actionId: remaining[0],
          decisions: {},
          recursionDepth: recursionDepth + 1,
        },
      };
    }

    return {
      state,
      log: decisions._continued ? [] : [`Eternity: replaying ${uniqueActions.length} actions — choose order`],
      pendingDecision: {
        type: 'actionChoice',
        title: `Eternity: Choose which action to repeat next (${remaining.length} remaining)`,
        options: remaining,
      },
    };
  }

  // Player chose an action — execute it and queue the rest
  const chosenAction = decisions.actionChoice;
  const nextRemaining = remaining.filter(a => a !== chosenAction);

  // Queue the next Eternity choice for remaining actions (if any)
  let newState = state;
  if (nextRemaining.length > 0) {
    newState = {
      ...state,
      _actionChainQueue: [
        ...(state._actionChainQueue || []),
        {
          playerId,
          actionId: 'green_eternity',
          decisions: { _remaining: nextRemaining },
          recursionDepth,
          isContinuation: true,
        },
      ],
    };
  }

  return {
    state: newState,
    log: [`Repeating ${chosenAction}`],
    executeAction: {
      playerId,
      actionId: chosenAction,
      decisions: {},
      recursionDepth: recursionDepth + 1,
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
