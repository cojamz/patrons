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
  advanceRound,
  resolveDecision,
  getAvailableActions,
  Phase,
} from '../engine/v3/GameEngine';
import { executeChampionDraft, executeRoundStart, resortTurnOrder } from '../engine/v3/phases';
import { dispatchEvent, EventType, resetHandlerFrequencies } from '../engine/v3/events';

export const GameContext = createContext(null);

// --- Reducer ---

const initialState = {
  game: null,           // Engine game state
  phase: null,          // Current phase string
  log: [],              // Accumulated game log
  pendingDecision: null, // Current decision awaiting player input
  preDecisionSnapshot: null, // Snapshot of state before a pending decision (for cancel/restore)
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
        // Snapshot the pre-action state when a decision is first triggered
        preDecisionSnapshot: action.pendingDecision
          ? { game: state.game, log: state.log }
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
    // God count matches player count
    const allGods = ['gold', 'black', 'green', 'yellow'];
    const godSet = allGods.slice(0, config.playerCount);
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

    // Dispatch ROUND_START event (triggers Prescient nullifiers, Gold Idol, etc.)
    const eventResult = dispatchEvent(gameState, EventType.ROUND_START, { round: gameState.round });
    gameState = eventResult.state;
    if (eventResult.log) log.push(...eventResult.log);

    // Reset handler frequencies
    gameState = resetHandlerFrequencies(gameState, 'round');

    // Set current player to first in turn order
    if (gameState.turnOrder && gameState.turnOrder.length > 0) {
      gameState = { ...gameState, currentPlayer: gameState.turnOrder[0], turnDirection: 1 };
    }

    // Check for queued decisions (prescient nullifiers)
    const pendingDecisions = eventResult.pendingDecisions || [];
    if (pendingDecisions.length > 0) {
      gameState = { ...gameState, decisionQueue: [...(gameState.decisionQueue || []), ...pendingDecisions] };
      pendingDecision = gameState.decisionQueue[0];
    }

    return { gameState, log, pendingDecision };
  };

  const draftChampion = useCallback((decision) => {
    if (!state.game) return;
    const result = executeChampionDraft(state.game, decision);
    let gameState = result.state;
    let log = result.log || [];
    let pendingDecision = result.pendingDecision || null;

    // If draft is complete, transition to round start
    if (gameState.phase === Phase.ROUND_START) {
      const roundStart = performFirstRoundStart(gameState);
      gameState = roundStart.gameState;
      log = [...log, ...roundStart.log];
      pendingDecision = roundStart.pendingDecision || null;
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
      }
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

    // If round ended, check for round advance
    if (result.state.phase === Phase.ROUND_END) {
      dispatch({
        type: 'UPDATE_STATE',
        game: result.state,
        log: result.log,
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

    // Snapshot glory BEFORE round-end scoring fires
    const preRoundGlory = {};
    for (const player of state.game.players) {
      preRoundGlory[player.id] = player.glory ?? 0;
    }

    const result = advanceRound(state.game);

    // Attach glory deltas to game state for RoundTransition display
    const postRoundGlory = {};
    for (const player of result.state.players) {
      postRoundGlory[player.id] = player.glory ?? 0;
    }
    const gloryDeltas = {};
    for (const id of Object.keys(preRoundGlory)) {
      gloryDeltas[id] = postRoundGlory[id] - preRoundGlory[id];
    }
    const gameWithDeltas = { ...result.state, lastRoundGloryDeltas: gloryDeltas, lastRoundPreGlory: preRoundGlory };

    // Check for queued decisions (prescient nullifiers, etc.)
    if (result.state.decisionQueue && result.state.decisionQueue.length > 0) {
      const nextDecision = result.state.decisionQueue[0];
      dispatch({
        type: 'UPDATE_STATE',
        game: gameWithDeltas,
        log: result.log,
        pendingDecision: nextDecision,
      });
      return;
    }

    dispatch({ type: 'UPDATE_STATE', game: gameWithDeltas, log: result.log });
  }, [state.game]);

  const cancelDecision = useCallback(() => {
    dispatch({ type: 'CANCEL_DECISION' });
  }, []);

  const submitDecision = useCallback((answer) => {
    if (!state.game || !state.pendingDecision) return;

    const decision = state.pendingDecision;

    // For action-level decisions, re-call the originating function with the decision
    // Helper: re-tag any follow-up pendingDecision with the same source metadata
    const reTag = (pd) => {
      if (!pd) return null;
      return { ...pd, _source: decision._source, _playerId: decision._playerId, _actionId: decision._actionId, _shopId: decision._shopId, _cardId: decision._cardId };
    };

    if (decision.type === 'gemSelection') {
      if (decision._source === 'shop') {
        const result = executeShop(state.game, decision._playerId, decision._shopId, { gemSelection: answer });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: reTag(result.pendingDecision) });
        return;
      }
      if (decision._source === 'card') {
        const result = buyPowerCard(state.game, decision._playerId, decision._cardId, { gemSelection: answer });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: reTag(result.pendingDecision) });
        return;
      }
      if (decision._source === 'action') {
        const result = executeAction(state.game, decision._playerId, decision._actionId, { gemSelection: answer });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: reTag(result.pendingDecision) });
        return;
      }
    }

    if (decision.type === 'targetPlayer') {
      if (decision._source === 'action') {
        const result = executeAction(state.game, decision._playerId, decision._actionId, { targetPlayer: answer });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: reTag(result.pendingDecision) });
        return;
      }
      if (decision._source === 'shop') {
        const result = executeShop(state.game, decision._playerId, decision._shopId, { targetPlayer: answer });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: reTag(result.pendingDecision) });
        return;
      }
      if (decision._source === 'card') {
        const result = buyPowerCard(state.game, decision._playerId, decision._cardId, { targetPlayer: answer });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: reTag(result.pendingDecision) });
        return;
      }
    }

    if (decision.type === 'stealGems') {
      if (decision._source === 'action') {
        const result = executeAction(state.game, decision._playerId, decision._actionId, {
          targetPlayer: decision.targetPlayer,
          stealGems: answer,
        });
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: reTag(result.pendingDecision) });
        return;
      }
    }

    if (decision.type === 'actionChoice' || decision.type === 'actionChoices') {
      if (decision._source === 'action') {
        const decisions = decision.type === 'actionChoice' ? { actionChoice: answer } : { actionChoices: answer };
        const result = executeAction(state.game, decision._playerId, decision._actionId, decisions);
        dispatch({ type: 'UPDATE_STATE', game: result.state, log: result.log, pendingDecision: reTag(result.pendingDecision) });
        return;
      }
    }

    // For queued decisions (voodoo doll, prescient, alchemist's trunk)
    const result = resolveDecision(state.game, decision.sourceId || decision.type, answer);
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
    },
  }), [
    state, availableActions, currentPlayer,
    initGame, draftChampion, placeWorker, useShop,
    buyCard, doEndTurn, doAdvanceRound, submitDecision, cancelDecision,
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
