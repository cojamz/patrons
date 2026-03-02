/**
 * GuestProvider — Read-only multiplayer provider for remote (non-host) players.
 *
 * Zero engine logic. All game state comes from a single atomic Firebase snapshot.
 * All actions submit intents to Firebase for the host to process.
 *
 * Provides the same GameContext interface as GameProvider so all downstream
 * components (GameBoard, PlayerPanel, modals, etc.) work identically.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { GameContext } from '../GameProvider';
import { getAvailableActions, Phase } from '../../engine/v3/GameEngine';
import { onSnapshotUpdate } from '../firebase/rooms';
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

export default function GuestProvider({ roomCode, playerId, slotMap, children }) {
  const [game, setGame] = useState(null);
  const [pendingDecision, setPendingDecision] = useState(null);
  const [log, setLog] = useState([]);
  const [initialized, setInitialized] = useState(false);

  const mySlot = slotMap?.[playerId] ?? 0;

  // Subscribe to atomic snapshot from Firebase (single path, no split-state)
  useEffect(() => {
    const unsubscribe = onSnapshotUpdate(roomCode, (snapshot) => {
      if (!snapshot) return;
      if (snapshot.game) {
        setGame(snapshot.game);
        setInitialized(true);
      }
      setPendingDecision(snapshot.pendingDecision || null);
      if (snapshot.log) setLog(snapshot.log);
    });

    return unsubscribe;
  }, [roomCode]);

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

  const value = useMemo(() => ({
    game,
    phase,
    log,
    pendingDecision,
    roundStartDecisionQueue: [],
    error: null,
    initialized,
    aiPlayers: new Set(),
    availableActions,
    currentPlayer,

    isMultiplayer: true,
    isHost: false,
    mySlot,
    roomCode,
    playerId,

    actions,
  }), [
    game, phase, log, pendingDecision, initialized,
    availableActions, currentPlayer,
    mySlot, roomCode, playerId, actions,
  ]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
