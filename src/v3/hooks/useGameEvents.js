/**
 * useGameEvents — Detects game state changes and produces typed UI events.
 *
 * Compares previous vs current game state on each render, emitting events
 * like resource deltas, turn changes, worker placements, and card triggers.
 * Events auto-expire after a configurable duration.
 *
 * Worker placements only fire after the action is fully committed
 * (no pending decision), preventing ghost toasts on cancelled actions.
 *
 * Used by: FloatingDeltas, TurnAnnouncement, PowerCardSlot
 */
import { useState, useEffect, useRef } from 'react';
import { useGame } from './useGame';
import { powerCards } from '../../engine/v3/data/powerCards';

// Build lookup: card name → cardId for log-based trigger detection
const CARD_NAME_TO_ID = {};
for (const [id, card] of Object.entries(powerCards)) {
  CARD_NAME_TO_ID[card.name] = id;
}
const CARD_NAMES = Object.keys(CARD_NAME_TO_ID);

let nextEventId = 0;

/**
 * @param {Object} options
 * @param {number} options.expiry - How long events persist (ms). Default 2500.
 * @returns {Object[]} Array of typed events, each with { id, type, timestamp, ...data }
 *
 * Event types:
 *   resourceDelta  — { playerId, deltas: { gold: +2, black: -1 } }
 *   turnChange     — { fromPlayer, toPlayer }
 *   workerPlaced   — { playerId, actionId }
 *   logEntry       — { text }
 *   favorDelta     — { playerId, delta }
 *   cardTriggered  — { cardId, cardName }
 */
export function useGameEvents({ expiry = 2500 } = {}) {
  const { game, log, phase, pendingDecision } = useGame();
  const prevGameRef = useRef(null);
  const prevLogLenRef = useRef(0);
  const prevPhaseRef = useRef(null);
  // Track committed roundActions length — only updates when no pending decision
  const committedRoundActionsLenRef = useRef(0);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const prev = prevGameRef.current;
    const prevLogLen = prevLogLenRef.current;
    const prevPhase = prevPhaseRef.current;

    // First render or no game yet — just store refs
    if (!game || !prev) {
      prevGameRef.current = game;
      prevLogLenRef.current = log?.length || 0;
      prevPhaseRef.current = phase;
      if (game) {
        committedRoundActionsLenRef.current = game.roundActions?.length || 0;
      }
      return;
    }

    // Same object reference — no change
    if (game === prev) return;

    const now = Date.now();
    const newEvents = [];
    const logArr = log || [];

    // --- 1. Resource deltas per player ---
    for (const player of game.players) {
      const prevPlayer = prev.players.find(p => p.id === player.id);
      if (!prevPlayer) continue;

      const deltas = {};
      let hasDeltas = false;
      const allResources = new Set([
        ...Object.keys(player.resources || {}),
        ...Object.keys(prevPlayer.resources || {}),
      ]);

      for (const resource of allResources) {
        const curr = player.resources?.[resource] ?? 0;
        const prevVal = prevPlayer.resources?.[resource] ?? 0;
        if (curr !== prevVal) {
          deltas[resource] = curr - prevVal;
          hasDeltas = true;
        }
      }

      if (hasDeltas) {
        newEvents.push({
          id: ++nextEventId,
          type: 'resourceDelta',
          playerId: player.id,
          deltas,
          timestamp: now,
        });
      }
    }

    // --- 2. Turn change (only during action_phase → action_phase transitions) ---
    if (
      game.currentPlayer !== prev.currentPlayer &&
      game.phase === 'action_phase' &&
      prevPhase === 'action_phase'
    ) {
      newEvents.push({
        id: ++nextEventId,
        type: 'turnChange',
        fromPlayer: prev.currentPlayer,
        toPlayer: game.currentPlayer,
        timestamp: now,
      });
    }

    // --- 3. Worker placements (only when fully committed — no pending decision) ---
    // We track a separate "committed" length that only advances when pendingDecision is null.
    // This prevents ghost toasts for actions that get cancelled mid-decision.
    if (!pendingDecision) {
      const currLen = game.roundActions?.length || 0;
      const committedLen = committedRoundActionsLenRef.current;
      if (currLen > committedLen) {
        const newPlacements = (game.roundActions || []).slice(committedLen);
        for (const ra of newPlacements) {
          newEvents.push({
            id: ++nextEventId,
            type: 'workerPlaced',
            playerId: ra.playerId,
            actionId: ra.actionId,
            timestamp: now,
          });
        }
      }
      committedRoundActionsLenRef.current = currLen;
    }
    // If pendingDecision exists and roundActions shrunk (cancel/revert), update committed length
    if (pendingDecision) {
      // Don't advance committed length — wait for resolution
    } else {
      // Also handle round resets (new round = roundActions clears)
      const currLen = game.roundActions?.length || 0;
      if (currLen < committedRoundActionsLenRef.current) {
        committedRoundActionsLenRef.current = currLen;
      }
    }

    // --- 4. New log entries ---
    if (logArr.length > prevLogLen) {
      const newEntries = logArr.slice(prevLogLen);
      for (const text of newEntries) {
        newEvents.push({
          id: ++nextEventId,
          type: 'logEntry',
          text,
          timestamp: now,
        });
      }
    }

    // --- 5. Favor deltas ---
    for (const player of game.players) {
      const prevPlayer = prev.players.find(p => p.id === player.id);
      if (!prevPlayer) continue;
      const currGlory = player.glory ?? 0;
      const prevGlory = prevPlayer.glory ?? 0;
      if (currGlory !== prevGlory) {
        newEvents.push({
          id: ++nextEventId,
          type: 'favorDelta',
          playerId: player.id,
          delta: currGlory - prevGlory,
          timestamp: now,
        });
      }
    }

    // --- 6. Power card triggers (detected from new log entries) ---
    if (logArr.length > prevLogLen) {
      const newLogs = logArr.slice(prevLogLen);
      const alreadyDetected = new Set();
      for (const entry of newLogs) {
        for (const cardName of CARD_NAMES) {
          if (entry.includes(cardName) && !alreadyDetected.has(cardName)) {
            alreadyDetected.add(cardName);
            newEvents.push({
              id: ++nextEventId,
              type: 'cardTriggered',
              cardId: CARD_NAME_TO_ID[cardName],
              cardName,
              timestamp: now,
            });
          }
        }
      }
    }

    if (newEvents.length > 0) {
      setEvents(prev => [...prev, ...newEvents]);
    }

    prevGameRef.current = game;
    prevLogLenRef.current = logArr.length;
    prevPhaseRef.current = phase;
  }, [game, log, phase, pendingDecision]);

  // Auto-expire old events
  const hasEvents = events.length > 0;
  useEffect(() => {
    if (!hasEvents) return;

    const timer = setInterval(() => {
      const now = Date.now();
      setEvents(prev => {
        const filtered = prev.filter(e => now - e.timestamp < expiry);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 250);

    return () => clearInterval(timer);
  }, [hasEvents, expiry]);

  return events;
}

// --- Convenience filters ---

export function filterByType(events, type) {
  return events.filter(e => e.type === type);
}

export function filterByPlayer(events, playerId) {
  return events.filter(e => e.playerId === playerId);
}
