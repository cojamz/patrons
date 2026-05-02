/**
 * Patrons v3 — Headless Game Runner
 *
 * Simulates complete v3 games without UI. Used for balance testing,
 * AI development, and smoke testing the engine.
 *
 * Uses GameEngine APIs (executeAction, executeShop, endTurn) for correct
 * event dispatching. All power card triggers work in simulations.
 */

import { getPlayer } from './stateHelpers.js';
import {
  Phase,
  executeChampionDraft, executeRoundStart, executeRoundEnd,
  advanceTurn, isGameOver, resortTurnOrder,
} from './phases.js';
import { getAvailableActions } from './rules.js';
import { createGame, executeAction, executeShop, endTurn, buyPowerCard, resolveDecision } from './GameEngine.js';
import { dispatchEvent, EventType, resetHandlerFrequencies } from './events.js';

// ---------------------------------------------------------------------------
// Random Decision Helpers
// ---------------------------------------------------------------------------

/**
 * Random decision function -- makes random valid choices.
 * Good enough for smoke testing and basic simulation.
 */
export function randomDecisionFn(state, playerId, pendingDecision) {
  const activeColors = state.gods || ['gold', 'black', 'green', 'yellow'];

  switch (pendingDecision.type) {
    case 'championChoice': {
      const options = pendingDecision.options || [];
      if (options.length === 0) return { championId: null };
      const pick = options[Math.floor(Math.random() * options.length)];
      return { championId: pick.id };
    }

    case 'gemSelection': {
      const count = pendingDecision.count || 1;
      const selection = {};
      let remaining = count;

      // In 'spend' mode, pick from the player's own resources
      if (pendingDecision.mode === 'spend') {
        const player = state.players?.find(p => p.id === playerId);
        const resources = player?.resources || {};
        const available = Object.entries(resources)
          .filter(([, v]) => v > 0)
          .sort(() => Math.random() - 0.5);
        for (const [color, amount] of available) {
          if (remaining <= 0) break;
          const take = Math.min(amount, remaining);
          selection[color] = take;
          remaining -= take;
        }
      } else {
        const colorPool = pendingDecision.colors || activeColors;
        while (remaining > 0) {
          const color = colorPool[Math.floor(Math.random() * colorPool.length)];
          selection[color] = (selection[color] || 0) + 1;
          remaining--;
        }
      }
      return { gemSelection: selection };
    }

    case 'targetPlayer': {
      const others = state.players.filter(
        p => p.id !== (pendingDecision.excludePlayer || playerId)
      );
      if (others.length === 0) return { targetPlayer: null };
      const target = others[Math.floor(Math.random() * others.length)];
      return { targetPlayer: target.id };
    }

    case 'actionChoice': {
      const options = pendingDecision.options || [];
      if (options.length === 0) return { actionChoice: null };
      const pick = options[Math.floor(Math.random() * options.length)];
      // options can be objects with .id/.value or plain strings
      return { actionChoice: typeof pick === 'string' ? pick : (pick.value || pick.id || pick) };
    }

    case 'actionChoices': {
      const options = pendingDecision.options || [];
      const count = pendingDecision.count || 1;
      const shuffled = [...options].sort(() => Math.random() - 0.5);
      const picks = shuffled.slice(0, Math.min(count, shuffled.length));
      return { actionChoices: picks };
    }

    case 'stealGems': {
      const targetResources = pendingDecision.targetResources || {};
      const count = pendingDecision.count || 1;
      const selection = {};
      let remaining = count;

      const available = Object.entries(targetResources)
        .filter(([, amount]) => amount > 0)
        .sort(() => Math.random() - 0.5);

      for (const [color, amount] of available) {
        if (remaining <= 0) break;
        const take = Math.min(amount, remaining);
        selection[color] = take;
        remaining -= take;
      }
      return { stealGems: selection };
    }

    case 'chooseColor': {
      const options = pendingDecision.options || activeColors;
      if (options.length === 0) return { chooseColor: null };
      const pick = options[Math.floor(Math.random() * options.length)];
      return { chooseColor: pick };
    }

    case 'turnOrderChoice': {
      const options = pendingDecision.options || [1];
      const pick = options[Math.floor(Math.random() * options.length)];
      return { position: pick };
    }

    case 'nullifierPlacement': {
      const options = pendingDecision.options || [];
      if (options.length === 0) return { nullifierPlacement: null };
      const pick = options[Math.floor(Math.random() * options.length)];
      return { nullifierPlacement: typeof pick === 'string' ? pick : pick.id };
    }

    case 'redistribute':
    case 'redistributeResources': {
      const player = state.players?.find(p => p.id === playerId);
      const currentResources = player?.resources || {};
      const totalResources = pendingDecision.totalResources
        || Object.values(currentResources).reduce((s, v) => s + Math.max(0, v), 0);
      const selection = {};
      let remaining = totalResources;
      while (remaining > 0) {
        const color = activeColors[Math.floor(Math.random() * activeColors.length)];
        selection[color] = (selection[color] || 0) + 1;
        remaining--;
      }
      return { redistribution: selection };
    }

    default:
      return {};
  }
}

/**
 * Random action picker -- picks random available action.
 */
export function randomActionPicker(state, playerId, availableActions) {
  if (!availableActions || availableActions.length === 0) return null;
  return availableActions[Math.floor(Math.random() * availableActions.length)];
}

// ---------------------------------------------------------------------------
// Decision Queue Draining
// ---------------------------------------------------------------------------

/**
 * Drain decision queue by auto-answering with decisionFn.
 * Returns { state, log }.
 */
function drainDecisionQueue(state, decisionFn, gameLog, maxIterations = 50) {
  let iterations = 0;
  while (state.decisionQueue && state.decisionQueue.length > 0 && iterations < maxIterations) {
    const decision = state.decisionQueue[0];
    const remaining = state.decisionQueue.slice(1);
    state = { ...state, decisionQueue: remaining };

    const playerId = decision.playerId || decision.ownerId;
    const answer = decisionFn(state, playerId, decision);

    if (decision.type === 'championChoice' && answer.championId) {
      // Champion draft decisions loop back through executeChampionDraft
      const result = executeChampionDraft(state, { championId: answer.championId });
      state = result.state;
      if (result.log) gameLog.push(...result.log);
      if (result.pendingDecision) {
        state = {
          ...state,
          decisionQueue: [result.pendingDecision, ...(state.decisionQueue || [])],
        };
      }
    } else if (decision.sourceId) {
      // Event-triggered decisions (Voodoo Doll, Prescient, Fortunate, etc.)
      const result = resolveDecision(state, decision.sourceId, answer);
      state = result.state;
      if (result.log) gameLog.push(...result.log);
    }

    iterations++;
  }
  return state;
}

/**
 * Process a result that may contain a pendingDecision by feeding it
 * back through the decisionFn and re-executing with the answer.
 * Used for actions and shops that require multi-step decisions.
 */
function resolveWithDecisions(state, playerId, pendingDecision, decisionFn, executor, maxAttempts = 10) {
  let decisions = {};
  let result = { state, pendingDecision };
  let attempts = 0;

  while (result.pendingDecision && attempts < maxAttempts) {
    const pd = result.pendingDecision;
    const answer = decisionFn(result.state, playerId, pd);
    // Fold in pendingDecision annotations (_costPaid for shops, etc.)
    if (pd._costPaid) decisions._costPaid = true;

    // Handle _resolveField: remap the answer key to the target field
    // e.g. { gemSelection: {...} } → { gemSelectionGain: {...} } when _resolveField is 'gemSelectionGain'
    if (pd._resolveField && answer[pd.type]) {
      decisions[pd._resolveField] = answer[pd.type];
    } else {
      decisions = { ...decisions, ...answer };
    }
    decisions._continued = true;

    result = executor(result.state, decisions);
    attempts++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main Simulation Loop
// ---------------------------------------------------------------------------

/**
 * Simulate a complete v3 game headlessly.
 *
 * @param {Object} options
 * @param {number} options.playerCount - 2-4 players (default 2)
 * @param {string[]} options.playerNames - Optional player names
 * @param {string[]} options.godSet - Active gods (default ['gold','black','green','yellow'])
 * @param {Function} options.decisionFn - (state, playerId, pendingDecision) => answer object
 * @param {Function} options.actionPickerFn - (state, playerId, availableActions) => actionId
 * @param {Function} options.shopDecisionFn - (state, playerId) => shopId | null
 * @param {Function} options.cardDecisionFn - (state, playerId) => cardId | null
 * @param {number} options.maxTurns - Safety valve (default 300)
 * @param {boolean} options.verbose - Log each action (default false)
 * @returns {{ finalState, gameLog: string[], turns: number, winner }}
 */
export function simulateGame(options = {}) {
  const {
    playerCount = 2,
    playerNames,
    godSet = ['gold', 'black', 'green', 'yellow'],
    decisionFn = randomDecisionFn,
    actionPickerFn = randomActionPicker,
    shopDecisionFn = null,
    cardDecisionFn = null,
    maxTurns = 300,
    verbose = false,
  } = options;

  const gameLog = [];
  let turns = 0;

  // 1. Create game state via GameEngine (sets up markets, glory handlers, etc.)
  const createResult = createGame({ playerCount, playerNames, godSet });
  let state = createResult.state;
  if (createResult.log) gameLog.push(...createResult.log);

  // 2. Champion draft phase
  state = runChampionDraft(state, decisionFn, gameLog);

  // 3. Transition to round start
  if (state.phase === Phase.ROUND_START) {
    state = runRoundStart(state, decisionFn, gameLog);
  }

  // 4. Main game loop
  while (!isGameOver(state) && turns < maxTurns) {
    // Handle phase transitions
    if (state.phase === Phase.ROUND_START) {
      state = runRoundStart(state, decisionFn, gameLog);
      continue;
    }

    if (state.phase === Phase.ROUND_END) {
      state = runRoundEnd(state, decisionFn, gameLog);
      continue;
    }

    if (state.phase === Phase.GAME_END) {
      break;
    }

    if (state.phase !== Phase.ACTION_PHASE) {
      // Unknown phase, bail
      gameLog.push(`Unexpected phase: ${state.phase}, ending simulation`);
      break;
    }

    // --- ACTION PHASE ---
    const currentPlayerId = state.currentPlayer;
    const player = getPlayer(state, currentPlayerId);

    if (!player || player.workersLeft <= 0) {
      // This player is out of workers, advance turn
      const advResult = advanceTurn(state);
      state = advResult;
      if (state.phase === Phase.ROUND_END) continue;
      continue;
    }

    // Pick an action
    const available = getAvailableActions(state, currentPlayerId);
    if (available.length === 0) {
      // No available actions, advance
      const advResult = advanceTurn(state);
      state = advResult;
      continue;
    }

    const actionId = actionPickerFn(state, currentPlayerId, available);
    if (!actionId) {
      const advResult = advanceTurn(state);
      state = advResult;
      continue;
    }

    // Only count turns where a worker is actually placed
    turns++;

    if (verbose) {
      gameLog.push(`[Turn ${turns}] Player ${currentPlayerId} plays ${actionId}`);
    }

    // 1. Execute action via GameEngine (handles placement, routing, all events:
    //    PLAYER_PENALIZED, GLORY_STOLEN, RESOURCE_STOLEN, RESOURCE_GAINED, ACTION_EXECUTED)
    let chosenActionId = actionId;
    let actionResult = executeAction(state, currentPlayerId, chosenActionId);

    // If action aborted (e.g. repeat with no valid targets), try other actions
    if (actionResult.abort) {
      state = actionResult.state; // reverted state
      if (actionResult.log) gameLog.push(...actionResult.log);
      const retryActions = available.filter(a => a !== chosenActionId);
      let retried = false;
      for (const retryId of retryActions) {
        actionResult = executeAction(state, currentPlayerId, retryId);
        if (!actionResult.abort) {
          chosenActionId = retryId;
          retried = true;
          break;
        }
        state = actionResult.state; // reverted
        if (actionResult.log) gameLog.push(...actionResult.log);
      }
      if (!retried) {
        // All available actions abort — advance without placing
        state = advanceTurn(state);
        continue;
      }
    }

    state = actionResult.state;
    if (actionResult.log) gameLog.push(...actionResult.log);

    // Resolve pending decisions from the action
    if (actionResult.pendingDecision) {
      const resolved = resolveWithDecisions(
        state, currentPlayerId, actionResult.pendingDecision, decisionFn,
        (s, d) => executeAction(s, currentPlayerId, chosenActionId, d, { isContinuation: true })
      );
      state = resolved.state;
      if (resolved.log) gameLog.push(...resolved.log);
    }

    // Drain any queued decisions from events triggered by the action
    state = drainDecisionQueue(state, decisionFn, gameLog);

    // Note: The Deft's consecutive turns are handled by advanceTurn via player.extraTurns

    // 2. Optionally use shop (via GameEngine — handles cost, benefit, events)
    if (shopDecisionFn && !state.purchaseMadeThisTurn) {
      const shopId = shopDecisionFn(state, currentPlayerId);
      if (shopId) {
        let shopResult = executeShop(state, currentPlayerId, shopId);
        state = shopResult.state;
        if (shopResult.log) gameLog.push(...shopResult.log);

        if (shopResult.pendingDecision) {
          const resolved = resolveWithDecisions(
            state, currentPlayerId, shopResult.pendingDecision, decisionFn,
            (s, d) => executeShop(s, currentPlayerId, shopId, d)
          );
          state = resolved.state;
          if (resolved.log) gameLog.push(...resolved.log);
        }

        state = drainDecisionQueue(state, decisionFn, gameLog);
      }
    }

    // 3. Optionally buy a power card
    if (cardDecisionFn && !state.purchaseMadeThisTurn) {
      const cardId = cardDecisionFn(state, currentPlayerId);
      if (cardId) {
        state = buyCardForRunner(state, currentPlayerId, cardId, decisionFn, gameLog);
      }
    }

    // 4. End turn (handles TURN_END event, handler resets, turn advance, TURN_START)
    const turnResult = endTurn(state);
    state = turnResult.state;
    if (turnResult.log) gameLog.push(...turnResult.log);

    // Drain any decisions from turn-end/turn-start events
    state = drainDecisionQueue(state, decisionFn, gameLog);
  }

  // 5. Dispatch GAME_END event
  if (state.phase === Phase.GAME_END || isGameOver(state)) {
    const gameEndResult = dispatchEvent(state, EventType.GAME_END, {});
    state = gameEndResult.state;
    if (gameEndResult.log) gameLog.push(...gameEndResult.log);
  }

  // 6. Determine winner (highest glory)
  const winner = determineWinner(state);
  gameLog.push(`Game over after ${turns} turns. Winner: Player ${winner} with ${getPlayer(state, winner)?.glory || 0} Glory`);

  return { finalState: state, gameLog, turns, winner };
}

// ---------------------------------------------------------------------------
// Phase Helpers
// ---------------------------------------------------------------------------

function runChampionDraft(state, decisionFn, gameLog) {
  let maxDraftSteps = state.players.length * 2 + 5; // 1 pick per player + safety margin

  while (state.phase === Phase.CHAMPION_DRAFT && maxDraftSteps > 0) {
    maxDraftSteps--;

    // Ask for next draft pick
    const draftResult = executeChampionDraft(state);
    state = draftResult.state;
    if (draftResult.log) gameLog.push(...draftResult.log);

    // If there's a pending decision, answer it
    if (draftResult.pendingDecision) {
      const answer = decisionFn(state, draftResult.pendingDecision.playerId, draftResult.pendingDecision);
      const pickResult = executeChampionDraft(state, answer);
      state = pickResult.state;
      if (pickResult.log) gameLog.push(...pickResult.log);
    }
  }

  return state;
}

function runRoundStart(state, decisionFn, gameLog) {
  // Resort turn order by glory (lowest first)
  state = resortTurnOrder(state);

  // Execute round start (resets workers, clears per-round state)
  const startResult = executeRoundStart(state);
  state = startResult.state;
  if (startResult.log) gameLog.push(...startResult.log);

  // Reset per-round handler frequencies
  state = resetHandlerFrequencies(state, 'round');

  // Dispatch ROUND_START event (triggers power card effects)
  const eventResult = dispatchEvent(state, EventType.ROUND_START, {
    round: state.round,
  });
  state = eventResult.state;
  if (eventResult.log) gameLog.push(...eventResult.log);

  // Drain any decisions from round start events
  state = drainDecisionQueue(state, decisionFn, gameLog);

  // Set current player to first in turn order
  state = { ...state, currentPlayer: state.turnOrder[0] };

  // Dispatch TURN_START for the first player (endTurn handles this for later players,
  // but the first player of each round has no preceding endTurn)
  const firstPlayerId = state.turnOrder[0];
  const turnStartResult = dispatchEvent(state, EventType.TURN_START, {
    playerId: firstPlayerId,
  });
  state = turnStartResult.state;
  if (turnStartResult.log) gameLog.push(...turnStartResult.log);
  state = drainDecisionQueue(state, decisionFn, gameLog);

  return state;
}

function runRoundEnd(state, decisionFn, gameLog) {
  // Dispatch ROUND_END event (triggers glory conditions, power card effects)
  const eventResult = dispatchEvent(state, EventType.ROUND_END, {
    round: state.round,
  });
  state = eventResult.state;
  if (eventResult.log) gameLog.push(...eventResult.log);

  // Drain any decisions from round end events
  state = drainDecisionQueue(state, decisionFn, gameLog);

  // Execute round end (advances round or transitions to game end)
  const endResult = executeRoundEnd(state);
  state = endResult.state;
  if (endResult.log) gameLog.push(...endResult.log);

  return state;
}

function buyCardForRunner(state, playerId, cardId, decisionFn, gameLog) {
  // Use GameEngine's buyPowerCard which handles cost, slotting, handlers, onPurchase
  let result = buyPowerCard(state, playerId, cardId);
  state = result.state;
  if (result.log) gameLog.push(...result.log);

  // Handle pending decisions (e.g., gemSelection for 'any' cost)
  if (result.pendingDecision) {
    const resolved = resolveWithDecisions(
      state, playerId, result.pendingDecision, decisionFn,
      (s, d) => buyPowerCard(s, playerId, cardId, d)
    );
    state = resolved.state;
    if (resolved.log) gameLog.push(...resolved.log);
  }

  return state;
}

function determineWinner(state) {
  let bestPlayer = state.players[0];
  for (const player of state.players) {
    if (player.glory > bestPlayer.glory) {
      bestPlayer = player;
    }
  }
  return bestPlayer.id;
}

// ---------------------------------------------------------------------------
// Batch Simulations
// ---------------------------------------------------------------------------

/**
 * Run multiple simulations and collect stats.
 *
 * @param {Object} options
 * @param {number} options.gameCount - Number of games to simulate (default 100)
 * @param {number} options.playerCount - Players per game (default 2)
 * @param {string[]} options.godSet - Active gods
 * @param {Function} options.decisionFn - Decision function
 * @param {Function} options.actionPickerFn - Action picker
 * @param {Function} options.shopDecisionFn - Shop decision function
 * @param {number} options.maxTurns - Safety valve per game
 * @returns {{ wins, avgGlory, glorySpread, avgTurns, championWins, errors }}
 */
export function runSimulations(options = {}) {
  const {
    gameCount = 100,
    playerCount = 2,
    godSet,
    decisionFn,
    actionPickerFn,
    shopDecisionFn,
    cardDecisionFn,
    maxTurns,
    verbose = false,
  } = options;

  const wins = {}; // playerId -> win count
  const gloryTotals = {}; // playerId -> total glory across games
  const championWins = {}; // championId -> win count
  const turnCounts = [];
  const gloryDiffs = []; // winner glory - last place glory per game
  let errors = 0;

  for (let i = 0; i < gameCount; i++) {
    try {
      const result = simulateGame({
        playerCount,
        godSet,
        decisionFn,
        actionPickerFn,
        shopDecisionFn,
        cardDecisionFn,
        maxTurns,
        verbose,
      });

      const { finalState, turns, winner } = result;

      // Track wins
      wins[winner] = (wins[winner] || 0) + 1;

      // Track champion wins
      const winnerChampion = finalState.champions?.[winner]?.id;
      if (winnerChampion) {
        championWins[winnerChampion] = (championWins[winnerChampion] || 0) + 1;
      }

      // Track glory totals
      for (const player of finalState.players) {
        gloryTotals[player.id] = (gloryTotals[player.id] || 0) + player.glory;
      }

      // Track game length
      turnCounts.push(turns);

      // Track glory spread
      const glories = finalState.players.map(p => p.glory);
      const maxGlory = Math.max(...glories);
      const minGlory = Math.min(...glories);
      gloryDiffs.push(maxGlory - minGlory);
    } catch (e) {
      errors++;
      if (verbose) {
        console.error(`Game ${i + 1} failed:`, e.message);
      }
    }
  }

  const completedGames = gameCount - errors;

  // Compute averages
  const avgGlory = {};
  for (const [pid, total] of Object.entries(gloryTotals)) {
    avgGlory[pid] = completedGames > 0 ? total / completedGames : 0;
  }

  const avgTurns = turnCounts.length > 0
    ? turnCounts.reduce((a, b) => a + b, 0) / turnCounts.length
    : 0;

  const glorySpread = gloryDiffs.length > 0
    ? gloryDiffs.reduce((a, b) => a + b, 0) / gloryDiffs.length
    : 0;

  return {
    wins,
    avgGlory,
    glorySpread,
    avgTurns,
    championWins,
    errors,
    completedGames,
  };
}
