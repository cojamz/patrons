/**
 * GuestProvider — Read-only multiplayer provider for remote (non-host) players.
 *
 * Zero engine logic. All game state comes from a single atomic Firebase snapshot.
 * All actions submit intents to Firebase for the host to process.
 *
 * Provides the same GameContext interface as GameProvider so all downstream
 * components (GameBoard, PlayerPanel, modals, etc.) work identically.
 *
 * Connection tracking: monitors Firebase .info/connected to detect disconnects
 * and auto-resubscribe on reconnection.
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { GameStateContext, GameActionsContext } from '../GameProvider';
import { getAvailableActions, Phase } from '../../engine/v3/GameEngine';
import { onSnapshotUpdate } from '../firebase/rooms';
import { db, ref, onValue } from '../firebase/config';
import {
  submitPlaceWorker,
  submitEndTurn,
  submitUseShop,
  submitBuyCard,
  submitDecision as submitDecisionAction,
  submitDraftChampion,
  submitAdvanceRound,
  submitCancelDecision,
} from '../firebase/actions';

const EMPTY_AI_SET = new Set();

export default function GuestProvider({ roomCode, playerId, slotMap, children }) {
  const [game, setGame] = useState(null);
  const [pendingDecision, setPendingDecision] = useState(null);
  const [log, setLog] = useState([]);
  const [initialized, setInitialized] = useState(false);
  // Connection states: 'connected' | 'reconnecting' | 'disconnected'
  const [connectionState, setConnectionState] = useState('connected');
  const unsubSnapshotRef = useRef(null);

  // Convert Firebase 0-indexed slot → engine 1-indexed playerId.
  // See HostSync.jsx for full context.
  const mySlot = (slotMap?.[playerId] ?? 0) + 1;

  // --- Connection monitoring via Firebase .info/connected ---
  useEffect(() => {
    const connectedRef = ref(db, '.info/connected');
    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        setConnectionState('connected');
      } else {
        setConnectionState(prev => prev === 'connected' ? 'reconnecting' : prev);
      }
    });
    return unsubscribe;
  }, []);

  // --- Subscribe to atomic snapshot (re-subscribe on reconnect) ---
  const subscribe = useCallback(() => {
    if (unsubSnapshotRef.current) {
      unsubSnapshotRef.current();
    }
    unsubSnapshotRef.current = onSnapshotUpdate(roomCode, (snapshot) => {
      if (!snapshot) return;
      if (snapshot.game) {
        setGame(snapshot.game);
        setInitialized(true);
      }
      setPendingDecision(snapshot.pendingDecision || null);
      if (snapshot.log) setLog(snapshot.log);
    });
  }, [roomCode]);

  // Initial subscription
  useEffect(() => {
    subscribe();
    return () => {
      if (unsubSnapshotRef.current) unsubSnapshotRef.current();
    };
  }, [subscribe]);

  // Re-subscribe when reconnecting → connected
  const prevConnectionRef = useRef(connectionState);
  useEffect(() => {
    const prev = prevConnectionRef.current;
    prevConnectionRef.current = connectionState;
    if (prev === 'reconnecting' && connectionState === 'connected') {
      subscribe();
    }
  }, [connectionState, subscribe]);

  // Actions — submit intents to Firebase (host processes them)
  const actions = useMemo(() => ({
    initGame: () => {},
    draftChampion: (decision) => submitDraftChampion(roomCode, playerId, decision.championId),
    placeWorker: (actionId) => submitPlaceWorker(roomCode, playerId, actionId),
    useShop: (shopId) => submitUseShop(roomCode, playerId, shopId),
    buyCard: (cardId) => submitBuyCard(roomCode, playerId, cardId),
    endTurn: () => submitEndTurn(roomCode, playerId),
    advanceRound: () => submitAdvanceRound(roomCode, playerId),
    submitDecision: (answer) => submitDecisionAction(roomCode, playerId, answer),
    cancelDecision: () => submitCancelDecision(roomCode, playerId),
    surfaceQueuedDecision: () => {},
  }), [roomCode, playerId]);

  // Derived state
  const availableActions = useMemo(() => {
    if (!game || game.phase !== Phase.ACTION_PHASE) return [];
    return getAvailableActions(game, game.currentPlayer);
  }, [game]);

  const currentPlayer = useMemo(() => {
    if (!game) return null;
    return game.players.find(p => p.id === game.currentPlayer);
  }, [game]);

  const phase = game?.phase || null;

  const stateValue = useMemo(() => ({
    game,
    phase,
    log,
    pendingDecision,
    roundStartDecisionQueue: [],
    error: null,
    initialized,
    aiPlayers: EMPTY_AI_SET,
    availableActions,
    currentPlayer,
    connectionState,

    isMultiplayer: true,
    isHost: false,
    mySlot,
    roomCode,
    playerId,
  }), [
    game, phase, log, pendingDecision, initialized,
    availableActions, currentPlayer, connectionState,
    mySlot, roomCode, playerId,
  ]);

  return (
    <GameActionsContext.Provider value={actions}>
      <GameStateContext.Provider value={stateValue}>
        {children}
      </GameStateContext.Provider>
    </GameActionsContext.Provider>
  );
}
