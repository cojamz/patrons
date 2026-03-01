/**
 * Patrons v3 — Phase System
 *
 * Phase state machine and lifecycle functions.
 * Pure functions: state in -> state out.
 *
 * Phase flow:
 *   champion_draft -> round_start -> action_phase -> round_end
 *                     ^------- (if round < 3) ---------|
 *                                              -> game_end (after round 3)
 */

import { ACTIONS_PER_ROUND, ROUNDS } from './data/constants.js';
import champions from './data/champions.js';
import { createResult, createDecisionRequest } from './stateHelpers.js';

// --- Phase Constants ---

export const Phase = {
  CHAMPION_DRAFT: 'champion_draft',
  ROUND_START: 'round_start',
  ACTION_PHASE: 'action_phase',
  ROUND_END: 'round_end',
  GAME_END: 'game_end',
};

export { ACTIONS_PER_ROUND };

// --- Champion Draft ---

/**
 * Execute the champion draft phase.
 * Uses snake draft order: 1,2,3,...,3,2,1 for fair picks.
 *
 * If no decision provided: returns pendingDecision for current drafter.
 * If decision provided: assigns champion, advances draft.
 * When all players have champions, transitions to ROUND_START.
 */
export function executeChampionDraft(state, decision) {
  const playerCount = state.players.length;
  const draftOrder = buildSnakeDraftOrder(playerCount);
  const draftIndex = state.draftIndex || 0;

  // All players have drafted
  if (draftIndex >= draftOrder.length) {
    return createResult(
      { ...state, phase: Phase.ROUND_START },
      ['Champion draft complete.']
    );
  }

  const currentDrafter = draftOrder[draftIndex];

  // Determine which champions are already taken
  const takenChampionIds = Object.values(state.champions)
    .map(c => c.id)
    .filter(Boolean);
  const availableChampions = champions.filter(c => !takenChampionIds.includes(c.id));

  // No decision yet — ask for one
  if (!decision) {
    return createDecisionRequest(
      state,
      [],
      {
        type: 'championChoice',
        playerId: currentDrafter,
        options: availableChampions.map(c => ({
          id: c.id,
          name: c.name,
          passive: c.passive,
          powerCardSlots: c.powerCardSlots,
        })),
      }
    );
  }

  // Decision provided — assign champion
  const chosenChampion = champions.find(c => c.id === decision.championId);
  if (!chosenChampion) {
    return createResult(state, ['Invalid champion choice.']);
  }

  const newState = {
    ...state,
    champions: {
      ...state.champions,
      [currentDrafter]: {
        id: chosenChampion.id,
        name: chosenChampion.name,
        powerCards: [],
        powerCardSlots: chosenChampion.powerCardSlots,
      },
    },
    draftIndex: draftIndex + 1,
  };

  const log = [`Player ${currentDrafter} drafted ${chosenChampion.name}.`];

  // Check if draft is now complete
  if (newState.draftIndex >= draftOrder.length) {
    return createResult(
      { ...newState, phase: Phase.ROUND_START },
      [...log, 'Champion draft complete.']
    );
  }

  return createResult(newState, log);
}

// --- Round Lifecycle ---

/**
 * Execute round start.
 * Resets per-round state, sets worker counts for the new round.
 * NOTE: Event dispatch (power card triggers, nullifiers) is handled
 * by GameEngine calling dispatchEvent after this.
 */
export function executeRoundStart(state) {
  const workersThisRound = ACTIONS_PER_ROUND[state.round - 1] || ACTIONS_PER_ROUND[ACTIONS_PER_ROUND.length - 1];

  const newState = {
    ...state,
    phase: Phase.ACTION_PHASE,
    occupiedSpaces: {},
    nullifiedSpaces: {},
    workerPlacedThisTurn: false,
    workersToPlace: 1,
    playersOutOfWorkers: [],
    skippedTurns: {},
    roundActions: [],
    turnResourceGains: {},
    turnActionsThisTurn: [],
    godsAccessedThisTurn: [],
    players: state.players.map(player => ({
      ...player,
      workersLeft: workersThisRound,
      extraTurns: 0,
    })),
  };

  return createResult(newState, [`Round ${state.round} begins. Each player has ${workersThisRound} workers.`]);
}

/**
 * Execute round end.
 * Clears turn-specific state. Advances round or transitions to game end.
 * NOTE: Glory condition scoring and event dispatch are handled
 * by GameEngine calling dispatchEvent before this.
 */
export function executeRoundEnd(state) {
  const log = [`Round ${state.round} ends.`];

  if (state.round >= ROUNDS) {
    return createResult(
      {
        ...state,
        phase: Phase.GAME_END,
        gameOver: true,
      },
      [...log, 'Game over!']
    );
  }

  return createResult(
    {
      ...state,
      round: state.round + 1,
      phase: Phase.ROUND_START,
      workerPlacedThisTurn: false,
      turnResourceGains: {},
      turnActionsThisTurn: [],
      godsAccessedThisTurn: [],
    },
    [...log, `Advancing to round ${state.round + 1}.`]
  );
}

// --- Turn Management ---

/**
 * Advance to the next player's turn.
 *
 * Snake draft turn progression with:
 * - extraTurns: don't advance if player has extra turns
 * - skippedTurns: skip players who should be skipped
 * - playersOutOfWorkers: skip players with no workers
 * - When ALL players are out of workers: transition to ROUND_END
 *
 * Resets per-turn state.
 */
export function advanceTurn(state) {
  const currentPlayer = getPlayer(state, state.currentPlayer);

  // Handle extra turns — stay on current player
  if (currentPlayer && currentPlayer.extraTurns > 0) {
    return resetTurnState({
      ...state,
      players: state.players.map(p =>
        p.id === state.currentPlayer
          ? { ...p, extraTurns: p.extraTurns - 1 }
          : p
      ),
    });
  }

  // Find next player in turn order
  const turnOrder = state.turnOrder;
  const currentIndex = turnOrder.indexOf(state.currentPlayer);
  let direction = state.turnDirection;
  let nextIndex = currentIndex + direction;

  // Snake draft reversal at boundaries
  if (nextIndex >= turnOrder.length) {
    direction = -1;
    nextIndex = turnOrder.length - 1;
  } else if (nextIndex < 0) {
    direction = 1;
    nextIndex = 0;
  }

  // Walk through players to find next eligible one
  const maxAttempts = turnOrder.length * 2;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const candidateId = turnOrder[nextIndex];
    const candidate = getPlayer(state, candidateId);

    // Check if this player should be skipped
    const skipCount = (state.skippedTurns[candidateId] || 0);
    const outOfWorkers = candidate && candidate.workersLeft <= 0;

    if (!outOfWorkers && skipCount <= 0) {
      // Found eligible player
      return resetTurnState({
        ...state,
        currentPlayer: candidateId,
        turnDirection: direction,
      });
    }

    // Consume a skip if they have one
    if (skipCount > 0 && !outOfWorkers) {
      const newSkipped = { ...state.skippedTurns };
      newSkipped[candidateId] = skipCount - 1;
      if (newSkipped[candidateId] <= 0) delete newSkipped[candidateId];
      state = { ...state, skippedTurns: newSkipped };
    }

    // Track out-of-workers players
    if (outOfWorkers && !(state.playersOutOfWorkers || []).includes(candidateId)) {
      state = {
        ...state,
        playersOutOfWorkers: [...(state.playersOutOfWorkers || []), candidateId],
      };
    }

    // Move to next candidate
    nextIndex += direction;
    if (nextIndex >= turnOrder.length) {
      direction = -1;
      nextIndex = turnOrder.length - 1;
    } else if (nextIndex < 0) {
      direction = 1;
      nextIndex = 0;
    }

    attempts++;
  }

  // All players exhausted — transition to round end
  return {
    ...state,
    phase: Phase.ROUND_END,
    turnDirection: direction,
  };
}

// --- Game Over Check ---

export function isGameOver(state) {
  return state.phase === Phase.GAME_END || state.round > ROUNDS;
}

// --- Turn Order Management ---

/**
 * Resort turn order by glory (lowest first — catch-up mechanic).
 */
export function resortTurnOrder(state) {
  const sorted = [...state.players]
    .sort((a, b) => a.glory - b.glory)
    .map(p => p.id);

  return {
    ...state,
    turnOrder: sorted,
  };
}

// --- Internal Helpers ---

function getPlayer(state, playerId) {
  return state.players.find(p => p.id === playerId);
}

function resetTurnState(state) {
  return {
    ...state,
    workerPlacedThisTurn: false,
    turnResourceGains: {},
    godsAccessedThisTurn: [],
    turnActionsThisTurn: [],
  };
}

/**
 * Build champion draft order for N players.
 * Each player gets exactly 1 champion pick.
 * e.g., 3 players: [1, 2, 3]
 */
function buildSnakeDraftOrder(playerCount) {
  const forward = [];
  for (let i = 1; i <= playerCount; i++) {
    forward.push(i);
  }
  return forward;
}
