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
import { GameContext } from '../GameProvider';
import { useGame } from '../hooks/useGame';
import {
  writeSnapshot,
  onAnyPlayerAction,
  clearPlayerAction,
  setRoomStatus,
} from '../firebase/rooms';

export default function HostSync({ roomCode, playerId, slotMap, children }) {
  const gameContext = useGame();
  const { game, pendingDecision, log, actions, phase, initialized } = gameContext;

  const mySlot = slotMap?.[playerId] ?? 0;
  const broadcastQueue = useRef(Promise.resolve());
  const actionsRef = useRef(actions);
  const prevPhaseRef = useRef(null);

  // Always keep actions ref current (avoids stale closures in Firebase listener)
  actionsRef.current = actions;

  // --- Broadcast state to Firebase on every change ---
  useEffect(() => {
    if (!game) return;

    const snapshot = {
      game,
      pendingDecision: pendingDecision || null,
      log,
    };

    broadcastQueue.current = broadcastQueue.current.then(async () => {
      try {
        await writeSnapshot(roomCode, snapshot);
      } catch (err) {
        console.error('[HostSync] Failed to broadcast:', err);
      }
    });
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

  // --- Listen for remote player actions ---
  useEffect(() => {
    if (!initialized) return;

    const unsubscribe = onAnyPlayerAction(roomCode, (allActions) => {
      for (const [fbPlayerId, action] of Object.entries(allActions)) {
        if (fbPlayerId === playerId) continue; // skip own actions
        const slot = slotMap[fbPlayerId];
        if (slot === undefined) continue;

        clearPlayerAction(roomCode, fbPlayerId);
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
      }
    });

    return unsubscribe;
  }, [initialized, roomCode, playerId, slotMap]);

  // --- Override context with multiplayer metadata ---
  const value = useMemo(() => ({
    ...gameContext,
    isMultiplayer: true,
    isHost: true,
    mySlot,
    roomCode,
    playerId,
  }), [gameContext, mySlot, roomCode, playerId]);

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
