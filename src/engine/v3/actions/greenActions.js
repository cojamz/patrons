/**
 * Patrons v3 — Green God Action Handlers
 *
 * Each handler: (state, playerId, gods, decisions?, recursionDepth?) => { state, log, pendingDecision?, executeAction? }
 * All pure functions. No mutation.
 */

import { getRepeatableActions, isRepeatExcluded, getActionTier } from '../rules.js';

// --- Helpers (inline for now) ---

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

// --- Green Actions ---

/** bide: +3 green */
export function bide(state, playerId) {
  const newState = addResources(state, playerId, { green: 3 });
  return { state: newState, log: [`+3 green`] };
}

/** meditate: +2 green */
export function meditate(state, playerId) {
  const newState = addResources(state, playerId, { green: 2 });
  return { state: newState, log: [`+2 green`] };
}

/** relive: +1 green, repeat 1 of your other actions */
export function relive(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  // Skip resource gain on re-entry (_continued means state already has the gain)
  let newState = decisions._continued ? state : addResources(state, playerId, { green: 1 });
  const logPrefix = decisions._continued ? [] : [`+1 green`];

  if (!decisions.actionChoice) {
    const repeatable = getRepeatableActions(newState, playerId)
      .filter(id => getActionTier(id, gods) === 1);
    if (repeatable.length === 0) {
      return { state: newState, log: [`No Tier 1 actions to repeat — place a worker elsewhere first`], abort: true };
    }
    return {
      state: newState,
      log: [`+1 green`],
      pendingDecision: {
        type: 'actionChoice',
        title: 'Choose a Tier 1 action to repeat',
        options: repeatable,
      },
    };
  }

  const chosenAction = decisions.actionChoice;

  // Validate the choice is repeatable
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

/** echo: +1 green, copy the last action any player took */
export function echo(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  let newState = addResources(state, playerId, { green: 1 });

  const roundActions = state.roundActions || [];

  // Find the last action that is NOT the current echo action.
  // roundActions may include the current echo (added before handler runs),
  // so we search backwards for the first non-echo entry.
  let lastAction = null;
  for (let i = roundActions.length - 1; i >= 0; i--) {
    if (roundActions[i].actionId !== 'green_echo') {
      lastAction = roundActions[i];
      break;
    }
  }

  if (!lastAction) {
    return { state: newState, log: [`No previous action to copy`], abort: true };
  }

  // Don't copy repeat/copy actions
  if (isRepeatExcluded(lastAction.actionId)) {
    return { state: newState, log: [`Last action (${lastAction.actionId}) cannot be copied`], abort: true };
  }

  return {
    state: newState,
    log: [`+1 green`, `Copying ${lastAction.actionId} (last action by ${lastAction.playerId})`],
    executeAction: {
      playerId,
      actionId: lastAction.actionId,
      decisions: {},
      recursionDepth: recursionDepth + 1,
    },
  };
}

/** loop: +1 green, repeat 1 of your Tier 2 actions */
export function loop(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  // Skip resource gain on re-entry (_continued means state already has the gain)
  let newState = decisions._continued ? state : addResources(state, playerId, { green: 1 });
  const logPrefix = decisions._continued ? [] : [`+1 green`];

  if (!decisions.actionChoice) {
    const repeatable = getRepeatableActions(newState, playerId)
      .filter(id => getActionTier(id, gods) === 2);
    if (repeatable.length === 0) {
      return { state: newState, log: [`No Tier 2 actions to repeat — place a worker elsewhere first`], abort: true };
    }
    return {
      state: newState,
      log: [`+1 green`],
      pendingDecision: {
        type: 'actionChoice',
        title: 'Choose a Tier 2 action to repeat',
        options: repeatable,
      },
    };
  }

  const chosenAction = decisions.actionChoice;

  // Validate the choice is repeatable
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

/** accelerate: +2 green, grant extra turn */
export function accelerate(state, playerId) {
  let newState = addResources(state, playerId, { green: 2 });

  // Grant extra turn
  const players = newState.players.map(p => {
    if (p.id !== playerId) return p;
    return { ...p, extraTurns: (p.extraTurns || 0) + 1 };
  });
  newState = { ...newState, players };

  return { state: newState, log: [`+2 green, extra turn granted`] };
}

/** unravel: +1 green, repeat 1 of your Tier 3 actions */
export function unravel(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  // Skip resource gain on re-entry (_continued means state already has the gain)
  let newState = decisions._continued ? state : addResources(state, playerId, { green: 1 });
  const logPrefix = decisions._continued ? [] : [`+1 green`];

  if (!decisions.actionChoice) {
    const repeatable = getRepeatableActions(newState, playerId)
      .filter(id => getActionTier(id, gods) === 3);
    if (repeatable.length === 0) {
      return { state: newState, log: [`No Tier 3 actions to repeat — place a worker elsewhere first`], abort: true };
    }
    return {
      state: newState,
      log: [`+1 green`],
      pendingDecision: {
        type: 'actionChoice',
        title: 'Choose a Tier 3 action to repeat',
        options: repeatable,
      },
    };
  }

  const chosenAction = decisions.actionChoice;

  // Validate the choice is repeatable
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

export const greenActions = {
  green_bide: bide,
  green_meditate: meditate,
  green_relive: relive,
  green_echo: echo,
  green_loop: loop,
  green_accelerate: accelerate,
  green_unravel: unravel,
};
