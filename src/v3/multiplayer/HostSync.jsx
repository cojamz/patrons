/**
 * HostSync — Thin network layer for the host in multiplayer.
 *
 * Sits as a child of GameProvider. Does two things:
 *   1. Watches game state and broadcasts atomic snapshots to Firebase
 *   2. Listens for remote player actions and routes them through GameProvider's actions
 *
 * Also overrides GameContext to add multiplayer metadata (isHost, mySlot, etc.)
 * so downstream components can check multiplayer state.
 *
 * Zero engine logic — all game processing happens in GameProvider.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { GameStateContext } from '../GameProvider';
import { useGameState } from '../hooks/useGame';
import { useGameActions } from '../hooks/useGame';
import { getAvailableActions } from '../../engine/v3/GameEngine';
import {
  writeSnapshot,
  onPlayerAction,
  clearPlayerAction,
  setRoomStatus,
} from '../firebase/rooms';

export default function HostSync({ roomCode, playerId, slotMap, children }) {
  const gameState = useGameState();
  const actions = useGameActions();
  const { game, pendingDecision, log, phase, initialized } = gameState;

  // Convert Firebase 0-indexed slot → engine 1-indexed playerId.
  // The engine creates players with IDs 1..N (createV3Player(i + 1, ...)),
  // but Firebase slots are 0..N-1. All "is this me?" comparisons in the
  // multiplayer-aware UI compare against engine playerId, so mySlot must
  // be in engine space.
  const mySlot = (slotMap?.[playerId] ?? 0) + 1;
  const broadcastQueue = useRef(Promise.resolve());
  const actionsRef = useRef(actions);
  const gameRef = useRef(game);
  const phaseRef = useRef(phase);
  const pendingDecisionRef = useRef(pendingDecision);
  const prevPhaseRef = useRef(null);

  // Always keep refs current (avoids stale closures in Firebase listener)
  actionsRef.current = actions;
  gameRef.current = game;
  phaseRef.current = phase;
  pendingDecisionRef.current = pendingDecision;

  // --- Broadcast state to Firebase on every change ---
  useEffect(() => {
    if (!game) return;

    // Strip internal/transient fields to reduce snapshot size.
    // These are engine internals that guests don't need — the host
    // recomputes them locally on each action.
    const { eventHandlers, decisionQueue, powerCardDecks, _pendingNewColors,
      _actionChainQueue, actionLog, ...gameForSync } = game;

    const snapshot = {
      game: gameForSync,
      pendingDecision: pendingDecision || null,
      log: log.slice(-20),
    };

    broadcastQueue.current = broadcastQueue.current
      .then(() => writeSnapshot(roomCode, snapshot))
      .catch(err => console.error('[HostSync] Failed to broadcast:', err));
  }, [game, pendingDecision, log, roomCode]);

  // --- Update room status on phase changes ---
  useEffect(() => {
    if (!game || !phase) return;
    if (phase === prevPhaseRef.current) return;
    prevPhaseRef.current = phase;

    if (phase === 'champion_draft') setRoomStatus(roomCode, 'drafting');
    else if (phase === 'game_end') setRoomStatus(roomCode, 'finished');
    else if (phase !== 'round_end') setRoomStatus(roomCode, 'playing');
  }, [phase, game, roomCode]);

  // --- Listen for remote player actions (with validation) ---
  useEffect(() => {
    if (!initialized) return;

    const unsubscribe = onPlayerAction(roomCode, (fbPlayerId, action) => {
      // Always clear the action from Firebase first
      clearPlayerAction(roomCode, fbPlayerId);

      if (fbPlayerId === playerId) return; // skip own actions
      const fbSlot = slotMap[fbPlayerId];
      if (fbSlot === undefined) return;
      // Convert Firebase 0-indexed slot → engine 1-indexed playerId for all comparisons below.
      const slot = fbSlot + 1;

      // --- Validate action before executing ---
      const currentGame = gameRef.current;
      const currentPhase = phaseRef.current;
      const currentDecision = pendingDecisionRef.current;

      if (!currentGame) {
        console.warn('[HostSync] Rejected action (no game state):', action.type, fbPlayerId);
        return;
      }

      // Turn-based actions: verify it's this player's turn
      if (['placeWorker', 'endTurn', 'useShop', 'buyCard'].includes(action.type)) {
        if (currentGame.currentPlayer !== slot) {
          console.warn('[HostSync] Rejected action (not their turn):', action.type, `slot=${slot}, current=${currentGame.currentPlayer}`);
          return;
        }
      }

      // Worker placement: verify action is available
      if (action.type === 'placeWorker') {
        const available = getAvailableActions(currentGame, slot);
        if (!available.some(a => a.id === action.actionId)) {
          console.warn('[HostSync] Rejected placeWorker (action unavailable):', action.actionId);
          return;
        }
      }

      // Decision submissions: verify there's a pending decision for this player
      if (action.type === 'submitDecision' || action.type === 'cancelDecision') {
        if (!currentDecision) {
          console.warn('[HostSync] Rejected decision (no pending decision):', action.type);
          return;
        }
        const decisionOwner = currentDecision.playerId ?? currentDecision._playerId ?? currentGame.currentPlayer;
        if (decisionOwner !== slot) {
          console.warn('[HostSync] Rejected decision (wrong player):', action.type, `slot=${slot}, owner=${decisionOwner}`);
          return;
        }
      }

      // Draft: verify it's draft phase and this player's pick
      if (action.type === 'draftChampion') {
        if (currentPhase !== 'champion_draft') {
          console.warn('[HostSync] Rejected draft (wrong phase):', currentPhase);
          return;
        }
        // Null guard: between draft picks, pendingDecision can briefly be null
        // while host processes the previous pick. Don't reject — just skip validation.
        if (currentDecision && currentDecision.playerId !== slot) {
          console.warn('[HostSync] Rejected draft (not their pick):', `slot=${slot}, expected=${currentDecision.playerId}`);
          return;
        }
      }

      const a = actionsRef.current;

      switch (action.type) {
        case 'placeWorker':
          a.placeWorker(action.actionId);
          break;
        case 'endTurn':
          a.endTurn();
          break;
        case 'useShop':
          a.useShop(action.shopId);
          break;
        case 'buyCard':
          a.buyCard(action.cardId);
          break;
        case 'submitDecision':
          a.submitDecision(action.answer);
          break;
        case 'draftChampion':
          a.draftChampion({ championId: action.championId });
          break;
        case 'advanceRound':
          a.advanceRound();
          break;
        case 'cancelDecision':
          a.cancelDecision();
          break;
      }
    });

    return unsubscribe;
  }, [initialized, roomCode, playerId, slotMap]);

  // --- Override state context with multiplayer metadata ---
  // Actions flow through from GameProvider unchanged (stable references).
  const value = useMemo(() => ({
    ...gameState,
    isMultiplayer: true,
    isHost: true,
    mySlot,
    roomCode,
    playerId,
  }), [gameState, mySlot, roomCode, playerId]);

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}
