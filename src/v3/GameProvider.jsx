/**
 * GameProvider — React context wired to the v3 game engine.
 *
 * Wraps the pure-function engine in React state management.
 * All engine calls go through here, keeping the rest of the UI
 * purely declarative.
 *
 * State flow:
 *   User clicks → action.placeWorker(actionId) → engine.executeAction()
 *   → state updated → React re-renders → pendingDecision → modal
 *   → user responds → action.submitDecision(answer) → engine continues
 */
import React, { createContext, useReducer, useCallback, useMemo } from 'react';
import {
  createGame,
  executeAction,
  executeShop,
  buyPowerCard,
  endTurn,
  resolveDecision,
  getAvailableActions,
  Phase,
} from '../engine/v3/GameEngine';
import { executeChampionDraft, executeRoundStart, executeRoundEnd, resortTurnOrder } from '../engine/v3/phases';
import { dispatchEvent, EventType, resetHandlerFrequencies } from '../engine/v3/events';

export const GameContext = createContext(null);

// --- Reducer ---

const initialState = {
  game: null,           // Engine game state
  phase: null,          // Current phase string
  log: [],              // Accumulated game log
  pendingDecision: null, // Current decision awaiting player input
  preDecisionSnapshot: null, // Snapshot of state before a pending decision (for cancel/restore)
  roundStartDecisionQueue: [], // Buffered decisions from round start (surfaced after delay)
  error: null,          // Last error message
  initialized: false,
  aiPlayers: new Set(),  // Set of player IDs controlled by AI
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'INIT_GAME': {
      return {
        ...state,
        game: action.game,
        phase: action.game.phase,
        log: action.log || [],
        pendingDecision: action.pendingDecision || null,
        error: null,
        initialized: true,
        aiPlayers: action.aiPlayers || new Set(),
      };
    }
    case 'UPDATE_STATE': {
      const newLog = action.log ? [...state.log, ...action.log] : state.log;
      return {
        ...state,
        game: action.game,
        phase: action.game.phase,
        log: newLog,
        pendingDecision: action.pendingDecision || null,
        // Snapshot the pre-action state when a decision is first triggered.
        // Preserve existing snapshot for chained decisions (e.g. relive → repeated action → gem selection)
        // so cancelling any step in the chain restores to before the original action.
        preDecisionSnapshot: action.pendingDecision
          ? (state.preDecisionSnapshot || { game: state.game, log: state.log })
          : null,
        error: null,
      };
    }
    case 'SET_DECISION': {
      return { ...state, pendingDecision: action.decision };
    }
    case 'CLEAR_DECISION': {
      return { ...state, pendingDecision: null };
    }
    case 'CANCEL_DECISION': {
      if (!state.preDecisionSnapshot) {
        return { ...state, pendingDecision: null, preDecisionSnapshot: null };
      }
      const snap = state.preDecisionSnapshot;
      return {
        ...state,
        game: snap.game,
        phase: snap.game.phase,
        log: snap.log,
        pendingDecision: null,
        preDecisionSnapshot: null,
        error: null,
      };
    }
    case 'QUEUE_ROUND_START_DECISIONS': {
      // Clear engine's decisionQueue — decisions are now managed exclusively
      // in roundStartDecisionQueue to prevent double-surfacing
      return {
        ...state,
        game: { ...action.game, decisionQueue: [] },
        phase: action.game.phase,
        log: action.log ? [...state.log, ...action.log] : state.log,
        pendingDecision: null,
        roundStartDecisionQueue: action.decisions,
        error: null,
      };
    }
    case 'SURFACE_QUEUED_DECISION': {
      const queue = state.roundStartDecisionQueue;
      if (!queue || queue.length === 0) return state;
      if (state.pendingDecision) return state; // Don't overwrite an active decision
      return {
        ...state,
        pendingDecision: queue[0],
        roundStartDecisionQueue: queue.slice(1),
      };
    }
    case 'SET_ERROR': {
      return { ...state, error: action.error };
    }
    case 'CLEAR_LOG': {
      return { ...state, log: [] };
    }
    default:
      return state;
  }
}

// --- Provider Component ---

export default function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  // --- Engine action wrappers ---

  const initGame = useCallback((config) => {
    // God count matches player count — randomly select N gods
    const allGods = ['gold', 'black', 'green', 'yellow'];
    const shuffled = [...allGods];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const godSet = shuffled.slice(0, config.playerCount);
    const result = createGame({ ...config, godSet });
    // After creating the game, initiate champion draft
    const draftResult = executeChampionDraft(result.state);

    // Build AI player set from config
    const aiPlayers = new Set(config.aiPlayers || []);

    dispatch({
      type: 'INIT_GAME',
      game: draftResult.state,
      log: [...(result.log || []), ...(draftResult.log || [])],
      pendingDecision: draftResult.pendingDecision || null,
      aiPlayers,
    });
  }, []);

  /**
   * Perform full round-1 start sequence (matching advanceRound logic):
   * resort turn order → executeRoundStart → dispatch ROUND_START event → reset frequencies
   */
  const performFirstRoundStart = (gameState) => {
    const log = [];
    let pendingDecision = null;

    gameState = resortTurnOrder(gameState);
    const startResult = executeRoundStart(gameState);
    gameState = startResult.state;
    if (startResult.log) log.push(...startResult.log);

    // Reset handler frequencies BEFORE dispatching ROUND_START so once_per_round
    // handlers (Prescient, Gold Idol, etc.) can fire exactly once this round.
    gameState = resetHandlerFrequencies(gameState, 'round');

    // Dispatch ROUND_START event (triggers Prescient nullifiers, Gold Idol, etc.)
    const eventResult = dispatchEvent(gameState, EventType.ROUND_START, { round: gameState.round });
    gameState = eventResult.state;
    if (eventResult.log) log.push(...eventResult.log);

    // Set current player to first in turn order
    if (gameState.turnOrder && gameState.turnOrder.length > 0) {
      gameState = { ...gameState, currentPlayer: gameState.turnOrder[0], turnDirection: 1 };
    }

    // Check for The Fortunate — grant starting resources (only round 1)
    if (gameState.round === 1) {
      for (const p of gameState.players) {
        const champ = gameState.champions[p.id];
        if (champ && champ.id === 'fortunate') {
          const fortunateDecision = {
            type: 'gemSelection',
            title: 'The Fortunate: Choose 2 starting resources',
            playerId: p.id,
            count: 2,
            options: gameState.gods,
            sourceId: 'fortunate_starting',
          };
          gameState = {
            ...gameState,
            decisionQueue: [...(gameState.decisionQueue || []), fortunateDecision],
          };
        }
      }
    }

    // Check for queued decisions (prescient nullifiers, fortunate resources)
    const pendingDecisions = eventResult.pendingDecisions || [];
    if (pendingDecisions.length > 0) {
      gameState = { ...gameState, decisionQueue: [...(gameState.decisionQueue || []), ...pendingDecisions] };
    }

    return { gameState, log, pendingDecision, roundStartDecisions: gameState.decisionQueue || [] };
  };

  const draftChampion = useCallback((decision) => {
    if (!state.game) return;
    const result = executeChampionDraft(state.game, decision);
    let gameState = result.state;
    let log = result.log || [];
    let pendingDecision = result.pendingDecision || null;
    let roundStartDecisions = [];

    // If draft is complete, transition to round start
    if (gameState.phase === Phase.ROUND_START) {
      const roundStart = performFirstRoundStart(gameState);
      gameState = roundStart.gameState;
      log = [...log, ...roundStart.log];
      pendingDecision = roundStart.pendingDecision || null;
      roundStartDecisions = roundStart.roundStartDecisions || [];
    }

    // If draft continues, get next draft decision
    if (gameState.phase === Phase.CHAMPION_DRAFT && !pendingDecision) {
      const nextDraft = executeChampionDraft(gameState);
      gameState = nextDraft.state;
      log = [...log, ...(nextDraft.log || [])];
      pendingDecision = nextDraft.pendingDecision || null;

      // Check again if draft is now complete
      if (gameState.phase === Phase.ROUND_START) {
        const roundStart = performFirstRoundStart(gameState);
        gameState = roundStart.gameState;
        log = [...log, ...roundStart.log];
        pendingDecision = roundStart.pendingDecision || null;
        roundStartDecisions = roundStart.roundStartDecisions || [];
      }
    }

    // Buffer round-start decisions so the board is visible before the modal
    if (roundStartDecisions.length > 0 && !pendingDecision) {
      dispatch({
        type: 'QUEUE_ROUND_START_DECISIONS',
        game: gameState,
        log,
        decisions: roundStartDecisions,
      });
      return;
    }

    dispatch({ type: 'UPDATE_STATE', game: gameState, log, pendingDecision });
  }, [state.game]);

  const placeWorker = useCallback((actionId, decisions = {}) => {
    if (!state.game) return;
    const playerId = state.game.currentPlayer;
    const result = executeAction(state.game, playerId, actionId, decisions);

    if (result.pendingDecision) {
      dispatch({
        type: 'UPDATE_STATE',
        game: result.state,
        log: result.log,
        pendingDecision: { ...result.pendingDecision, _source: 'action', _playerId: playerId, _actionId: actionId },
      });
      return;
    }

    // Check for queued decisions
    if (result.state.decisionQueue && result.state.decisionQueue.length > 0) {
      const nextDecision = result.state.decisionQueue[0];
      dispatch({
        type: 'UPDATE_STATE',
        game: result.state,
        log: result.log,
        pendingDecision: nextDecision,
      });
      return;
    }

    dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log });
  }, [state.game]);

  const useShop = useCallback((shopId, decisions = {}) => {
    if (!state.game) return;
    const playerId = state.game.currentPlayer;
    const result = executeShop(state.game, playerId, shopId, decisions);

    dispatch({
      type: 'UPDATE_STATE',
      game: result.state,
      log: result.log,
      pendingDecision: result.pendingDecision
        ? { ...result.pendingDecision, _source: 'shop', _playerId: playerId, _shopId: shopId }
        : null,
    });
  }, [state.game]);

  const buyCard = useCallback((cardId, decisions = {}) => {
    if (!state.game) return;
    const playerId = state.game.currentPlayer;
    const result = buyPowerCard(state.game, playerId, cardId, decisions);

    dispatch({
      type: 'UPDATE_STATE',
      game: result.state,
      log: result.log,
      pendingDecision: result.pendingDecision
        ? { ...result.pendingDecision, _source: 'card', _playerId: playerId, _cardId: cardId }
        : null,
    });
  }, [state.game]);

  const doEndTurn = useCallback(() => {
    if (!state.game) return;
    const result = endTurn(state.game);

    // If round ended, score glory NOW so the RoundTransition shows correct values
    if (result.state.phase === Phase.ROUND_END) {
      const preGlory = {};
      for (const p of result.state.players) {
        preGlory[p.id] = p.glory ?? 0;
      }

      // Dispatch ROUND_END event to trigger glory conditions
      const roundEndEvent = dispatchEvent(result.state, EventType.ROUND_END, { round: result.state.round });
      let scoredState = roundEndEvent.state;
      const combinedLog = [...(result.log || []), ...(roundEndEvent.log || [])];

      // Compute glory deltas
      const deltas = {};
      for (const p of scoredState.players) {
        deltas[p.id] = (p.glory ?? 0) - (preGlory[p.id] ?? 0);
      }

      scoredState = {
        ...scoredState,
        lastRoundGloryDeltas: deltas,
        lastRoundPreGlory: preGlory,
        roundEndScored: true,
      };

      // Handle ROUND_END pending decisions (e.g., voodoo_doll target selection)
      const roundEndDecisions = roundEndEvent.pendingDecisions || [];
      if (roundEndDecisions.length > 0) {
        scoredState = {
          ...scoredState,
          decisionQueue: [...(scoredState.decisionQueue || []), ...roundEndDecisions],
        };
        dispatch({
          type: 'UPDATE_STATE',
          game: scoredState,
          log: combinedLog,
          pendingDecision: roundEndDecisions[0],
        });
        return;
      }

      dispatch({
        type: 'UPDATE_STATE',
        game: scoredState,
        log: combinedLog,
        pendingDecision: null,
      });
      return;
    }

    // Check for queued decisions
    if (result.state.decisionQueue && result.state.decisionQueue.length > 0) {
      const nextDecision = result.state.decisionQueue[0];
      dispatch({
        type: 'UPDATE_STATE',
        game: result.state,
        log: result.log,
        pendingDecision: nextDecision,
      });
      return;
    }

    dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log });
  }, [state.game]);

  const doAdvanceRound = useCallback(() => {
    if (!state.game) return;

    let gameState = state.game;
    const log = [];
    const pendingDecisions = [];

    // Glory conditions were already scored in doEndTurn (roundEndScored flag).
    // Only score here as a safety fallback.
    if (!gameState.roundEndScored) {
      const preGlory = {};
      for (const p of gameState.players) {
        preGlory[p.id] = p.glory ?? 0;
      }
      const roundEndEvent = dispatchEvent(gameState, EventType.ROUND_END, { round: gameState.round });
      gameState = roundEndEvent.state;
      if (roundEndEvent.log) log.push(...roundEndEvent.log);
      if (roundEndEvent.pendingDecisions) pendingDecisions.push(...roundEndEvent.pendingDecisions);

      const postGlory = {};
      for (const p of gameState.players) {
        postGlory[p.id] = p.glory ?? 0;
      }
      const deltas = {};
      for (const id of Object.keys(preGlory)) {
        deltas[id] = postGlory[id] - preGlory[id];
      }
      gameState = { ...gameState, lastRoundGloryDeltas: deltas, lastRoundPreGlory: preGlory };
    }

    // Clear the scored flag
    gameState = { ...gameState, roundEndScored: undefined };

    // Execute round end phase transition (increments round, checks game end)
    const endResult = executeRoundEnd(gameState);
    gameState = endResult.state;
    if (endResult.log) log.push(...endResult.log);

    // If game over, dispatch GAME_END event
    if (gameState.phase === Phase.GAME_END) {
      const gameEndResult = dispatchEvent(gameState, EventType.GAME_END, {});
      gameState = gameEndResult.state;
      if (gameEndResult.log) log.push(...gameEndResult.log);
      if (gameEndResult.pendingDecisions) pendingDecisions.push(...gameEndResult.pendingDecisions);
      if (pendingDecisions.length > 0) {
        gameState = { ...gameState, decisionQueue: [...(gameState.decisionQueue || []), ...pendingDecisions] };
      }
      dispatch({ type: 'UPDATE_STATE', game: gameState, log });
      return;
    }

    // Resort turn order and execute round start
    gameState = resortTurnOrder(gameState);
    const startResult = executeRoundStart(gameState);
    gameState = startResult.state;
    if (startResult.log) log.push(...startResult.log);

    // Reset handler frequencies BEFORE dispatching ROUND_START so once_per_round
    // handlers (Prescient, Gold Idol, etc.) can fire exactly once this round.
    gameState = resetHandlerFrequencies(gameState, 'round');

    // Dispatch ROUND_START event (triggers Prescient nullifiers, Gold Idol, etc.)
    const roundStartResult = dispatchEvent(gameState, EventType.ROUND_START, { round: gameState.round });
    gameState = roundStartResult.state;
    if (roundStartResult.log) log.push(...roundStartResult.log);
    if (roundStartResult.pendingDecisions) pendingDecisions.push(...roundStartResult.pendingDecisions);

    // Set current player to first in turn order
    if (gameState.turnOrder && gameState.turnOrder.length > 0) {
      gameState = { ...gameState, currentPlayer: gameState.turnOrder[0], turnDirection: 1 };
    }

    // Add any pending decisions to the queue
    if (pendingDecisions.length > 0) {
      gameState = { ...gameState, decisionQueue: [...(gameState.decisionQueue || []), ...pendingDecisions] };
    }

    // Buffer round-start decisions so the board is visible before modals
    if (gameState.decisionQueue && gameState.decisionQueue.length > 0) {
      dispatch({
        type: 'QUEUE_ROUND_START_DECISIONS',
        game: gameState,
        log,
        decisions: [...gameState.decisionQueue],
      });
      return;
    }

    dispatch({ type: 'UPDATE_STATE', game: gameState, log });
  }, [state.game]);

  const cancelDecision = useCallback(() => {
    dispatch({ type: 'CANCEL_DECISION' });
  }, []);

  const surfaceQueuedDecision = useCallback(() => {
    dispatch({ type: 'SURFACE_QUEUED_DECISION' });
  }, []);

  const submitDecision = useCallback((answer) => {
    if (!state.game || !state.pendingDecision) return;

    const decision = state.pendingDecision;

    // For action-level decisions, re-call the originating function with the decision.
    // IMPORTANT: Pass { isContinuation: true } so it skips occupancy/worker placement
    // (already done in the initial call) but does NOT dispatch ACTION_REPEATED.
    // _resolveActionId: When a repeat/copy action triggers a nested action that needs
    // a decision, the pendingDecision carries _resolveActionId pointing to the INNER
    // action, so we re-call the correct handler (not the outer repeat action).
    const resolveActionId = decision._resolveActionId || decision._actionId;

    // Helper: re-tag any follow-up pendingDecision with the same source metadata
    const reTag = (pd) => {
      if (!pd) return null;
      return {
        ...pd,
        _source: decision._source,
        _playerId: decision._playerId,
        _actionId: decision._actionId,
        _shopId: decision._shopId,
        _cardId: decision._cardId,
        _resolveActionId: pd._resolveActionId || decision._resolveActionId,
        _costPaid: pd._costPaid || decision._costPaid,
      };
    };

    // Helper: after a continuation resolve, pick the next decision to surface.
    // Direct pendingDecision takes priority; otherwise check the decisionQueue
    // for event-handler decisions (e.g. Golden Chalice triggering on resource gain).
    const nextDecisionFromResult = (result) => {
      if (result.pendingDecision) return reTag(result.pendingDecision);
      if (result.state?.decisionQueue?.length > 0) return result.state.decisionQueue[0];
      return null;
    };

    if (decision.type === 'gemSelection') {
      if (decision._source === 'shop') {
        const result = executeShop(state.game, decision._playerId, decision._shopId, { gemSelection: answer, _costPaid: !!decision._costPaid });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: nextDecisionFromResult(result) });
        return;
      }
      if (decision._source === 'card') {
        const result = buyPowerCard(state.game, decision._playerId, decision._cardId, { gemSelection: answer });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: nextDecisionFromResult(result) });
        return;
      }
      if (decision._source === 'action') {
        const result = executeAction(state.game, decision._playerId, resolveActionId, { gemSelection: answer, _continued: true }, { isContinuation: true });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: nextDecisionFromResult(result) });
        return;
      }
    }

    if (decision.type === 'targetPlayer') {
      if (decision._source === 'action') {
        const result = executeAction(state.game, decision._playerId, resolveActionId, { targetPlayer: answer, _continued: true }, { isContinuation: true });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: nextDecisionFromResult(result) });
        return;
      }
      if (decision._source === 'shop') {
        const result = executeShop(state.game, decision._playerId, decision._shopId, { targetPlayer: answer, _costPaid: !!decision._costPaid });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: nextDecisionFromResult(result) });
        return;
      }
      if (decision._source === 'card') {
        const result = buyPowerCard(state.game, decision._playerId, decision._cardId, { targetPlayer: answer });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: nextDecisionFromResult(result) });
        return;
      }
    }

    if (decision.type === 'stealGems') {
      if (decision._source === 'action') {
        const result = executeAction(state.game, decision._playerId, resolveActionId, {
          targetPlayer: decision.targetPlayer,
          stealGems: answer,
          _continued: true,
        }, { isContinuation: true });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: nextDecisionFromResult(result) });
        return;
      }
    }

    if (decision.type === 'discardArtifact') {
      // Player chose which artifact to discard — re-call buyPowerCard with discardCardId
      const result = buyPowerCard(state.game, decision._playerId, decision._cardId, { discardCardId: answer });
      dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: nextDecisionFromResult(result) });
      return;
    }

    if (decision.type === 'actionChoice' || decision.type === 'actionChoices') {
      if (decision._source === 'action') {
        const decisions = decision.type === 'actionChoice' ? { actionChoice: answer, _continued: true } : { actionChoices: answer, _continued: true };
        const result = executeAction(state.game, decision._playerId, resolveActionId, decisions, { isContinuation: true });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: nextDecisionFromResult(result) });
        return;
      }
      if (decision._source === 'shop') {
        const decisions = decision.type === 'actionChoice'
          ? { actionChoice: answer, _costPaid: !!decision._costPaid }
          : { actionChoices: answer, _costPaid: !!decision._costPaid };
        const result = executeShop(state.game, decision._playerId, decision._shopId, decisions);
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: nextDecisionFromResult(result) });
        return;
      }
    }

    // For queued decisions (voodoo doll, prescient, alchemist's trunk)
    // Ensure the decision is in the engine's decisionQueue before resolving
    // (it may have been surfaced from roundStartDecisionQueue and not in the engine queue)
    let gameForResolve = state.game;
    const engineQueue = gameForResolve.decisionQueue || [];
    const alreadyInQueue = engineQueue.some(d => (d.sourceId || d.type) === (decision.sourceId || decision.type));
    if (!alreadyInQueue) {
      gameForResolve = { ...gameForResolve, decisionQueue: [decision, ...engineQueue] };
    }

    // Wrap raw answer in the shape resolveDecision expects
    // Modal components pass raw values (e.g. player ID, gem object, action ID)
    // but resolveDecision checks answer.targetPlayer, answer.actionId, etc.
    let wrappedAnswer = answer;
    if (decision.type === 'targetPlayer') {
      wrappedAnswer = { targetPlayer: answer };
    } else if (decision.type === 'gemSelection') {
      wrappedAnswer = { gemSelection: answer };
    } else if (decision.type === 'nullifierPlacement') {
      wrappedAnswer = (typeof answer === 'object' && answer.actionId) ? answer : { actionId: answer };
    } else if (decision.type === 'redistribution') {
      wrappedAnswer = { redistribution: answer };
    }

    const result = resolveDecision(gameForResolve, decision.sourceId || decision.type, wrappedAnswer);
    let gameState = result.state;
    let log = result.log || [];

    // Check for more queued decisions
    if (gameState.decisionQueue && gameState.decisionQueue.length > 0) {
      const nextDecision = gameState.decisionQueue[0];
      dispatch({ type: 'UPDATE_STATE', game: gameState, log, pendingDecision: nextDecision });
      return;
    }

    dispatch({ type: 'UPDATE_STATE', game: gameState, log });
  }, [state.game, state.pendingDecision]);

  // --- Derived state ---

  const availableActions = useMemo(() => {
    if (!state.game || state.game.phase !== Phase.ACTION_PHASE) return [];
    return getAvailableActions(state.game, state.game.currentPlayer);
  }, [state.game]);

  const currentPlayer = useMemo(() => {
    if (!state.game) return null;
    return state.game.players.find(p => p.id === state.game.currentPlayer);
  }, [state.game]);

  // --- Context value ---

  const value = useMemo(() => ({
    // State
    game: state.game,
    phase: state.phase,
    log: state.log,
    pendingDecision: state.pendingDecision,
    roundStartDecisionQueue: state.roundStartDecisionQueue,
    error: state.error,
    initialized: state.initialized,
    aiPlayers: state.aiPlayers,

    // Derived
    availableActions,
    currentPlayer,

    // Actions
    actions: {
      initGame,
      draftChampion,
      placeWorker,
      useShop,
      buyCard,
      endTurn: doEndTurn,
      advanceRound: doAdvanceRound,
      submitDecision,
      cancelDecision,
      surfaceQueuedDecision,
    },
  }), [
    state, availableActions, currentPlayer,
    initGame, draftChampion, placeWorker, useShop,
    buyCard, doEndTurn, doAdvanceRound, submitDecision, cancelDecision,
    surfaceQueuedDecision,
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
