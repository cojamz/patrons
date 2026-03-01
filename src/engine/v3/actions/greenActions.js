/**
 * Patrons v3 — Green God Action Handlers
 *
 * Each handler: (state, playerId, gods, decisions?, recursionDepth?) => { state, log, pendingDecision?, executeAction? }
 * All pure functions. No mutation.
 */

import { getRepeatableActions, isRepeatExcluded } from '../rules.js';

// --- Helpers (inline for now) ---

function addResources(state, playerId, resources) {
  const players = state.players.map(p => {
    if (p.id !== playerId) return p;
    const newResources = { ...p.resources };
    Object.entries(resources).forEach(([color, amount]) => {
      newResources[color] = (newResources[color] || 0) + amount;
    });
    return { ...p, resources: newResources, lastGain: { ...resources } };
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
  let newState = addResources(state, playerId, { green: 1 });

  if (!decisions.actionChoice) {
    const repeatable = getRepeatableActions(newState, playerId);
    return {
      state: newState,
      log: [`+1 green`],
      pendingDecision: {
        type: 'actionChoice',
        title: 'Choose an action to repeat',
        options: repeatable,
      },
    };
  }

  const chosenAction = decisions.actionChoice;

  // Validate the choice is repeatable
  if (isRepeatExcluded(chosenAction)) {
    return { state: newState, log: [`+1 green`, `Cannot repeat ${chosenAction} (repeat-excluded)`] };
  }

  return {
    state: newState,
    log: [`+1 green`, `Repeating ${chosenAction}`],
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
    return { state: newState, log: [`+1 green`, `No previous action to copy`] };
  }

  // Don't copy repeat/copy actions
  if (isRepeatExcluded(lastAction.actionId)) {
    return { state: newState, log: [`+1 green`, `Last action (${lastAction.actionId}) cannot be copied`] };
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

/** loop: +1 green, repeat 2 of your other actions */
export function loop(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  let newState = addResources(state, playerId, { green: 1 });

  if (!decisions.actionChoices || decisions.actionChoices.length < 2) {
    const repeatable = getRepeatableActions(newState, playerId);
    return {
      state: newState,
      log: [`+1 green`],
      pendingDecision: {
        type: 'actionChoices',
        count: 2,
        title: 'Choose 2 actions to repeat',
        options: repeatable,
      },
    };
  }

  const choices = decisions.actionChoices;

  // Validate choices are repeatable
  for (const actionId of choices) {
    if (isRepeatExcluded(actionId)) {
      return { state: newState, log: [`+1 green`, `Cannot repeat ${actionId} (repeat-excluded)`] };
    }
  }

  // Execute the first action; the second will be chained via executeAction
  return {
    state: newState,
    log: [`+1 green`, `Repeating ${choices[0]} and ${choices[1]}`],
    executeAction: {
      playerId,
      actionId: choices[0],
      decisions: {},
      recursionDepth: recursionDepth + 1,
      chainedActions: choices.slice(1).map(actionId => ({
        playerId,
        actionId,
        decisions: {},
        recursionDepth: recursionDepth + 1,
      })),
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

/** unravel: +1 green, repeat 3 of your other actions */
export function unravel(state, playerId, gods, decisions = {}, recursionDepth = 0) {
  let newState = addResources(state, playerId, { green: 1 });

  if (!decisions.actionChoices || decisions.actionChoices.length < 3) {
    const repeatable = getRepeatableActions(newState, playerId);
    return {
      state: newState,
      log: [`+1 green`],
      pendingDecision: {
        type: 'actionChoices',
        count: 3,
        title: 'Choose 3 actions to repeat',
        options: repeatable,
      },
    };
  }

  const choices = decisions.actionChoices;

  for (const actionId of choices) {
    if (isRepeatExcluded(actionId)) {
      return { state: newState, log: [`+1 green`, `Cannot repeat ${actionId} (repeat-excluded)`] };
    }
  }

  return {
    state: newState,
    log: [`+1 green`, `Repeating ${choices[0]}, ${choices[1]}, and ${choices[2]}`],
    executeAction: {
      playerId,
      actionId: choices[0],
      decisions: {},
      recursionDepth: recursionDepth + 1,
      chainedActions: choices.slice(1).map(actionId => ({
        playerId,
        actionId,
        decisions: {},
        recursionDepth: recursionDepth + 1,
      })),
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
