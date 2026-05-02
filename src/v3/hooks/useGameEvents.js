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
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGameState } from './useGame';
import { powerCards } from '../../engine/v3/data/powerCards';

// Build lookup: card name → cardId for log-based trigger detection
const CARD_NAME_TO_ID = new Map();
for (const [id, card] of Object.entries(powerCards)) {
  CARD_NAME_TO_ID.set(card.name, id);
}
// Build regex for all card names (single pass instead of O(n) includes per log entry)
const CARD_NAME_REGEX = new RegExp(
  Array.from(CARD_NAME_TO_ID.keys())
    .sort((a, b) => b.length - a.length) // Longest first to avoid partial matches
    .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|'),
  'g'
);

let nextEventId = 0;

// Pre-build player lookup by ID for O(1) access
function buildPlayerMap(players) {
  const map = new Map();
  if (players) {
    for (const p of players) map.set(p.id, p);
  }
  return map;
}

/**
 * @param {Object} options
 * @param {number} options.expiry - How long events persist (ms). Default 4000.
 * @returns {Object[]} Array of typed events, each with { id, type, timestamp, ...data }
 */
export function useGameEvents({ expiry = 4000 } = {}) {
  const { game, log, phase, pendingDecision } = useGameState();
  const prevGameRef = useRef(null);
  const prevLogLenRef = useRef(0);
  const prevPhaseRef = useRef(null);
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
    const prevPlayerMap = buildPlayerMap(prev.players);

    // --- 1. Resource + Favor deltas per player (single pass) ---
    for (const player of game.players) {
      const prevPlayer = prevPlayerMap.get(player.id);
      if (!prevPlayer) continue;

      // Resource deltas
      const currRes = player.resources || {};
      const prevRes = prevPlayer.resources || {};
      let deltas = null;
      // Check current resources
      for (const resource in currRes) {
        const diff = (currRes[resource] ?? 0) - (prevRes[resource] ?? 0);
        if (diff !== 0) {
          if (!deltas) deltas = {};
          deltas[resource] = diff;
        }
      }
      // Check removed resources (in prev but not in curr)
      for (const resource in prevRes) {
        if (!(resource in currRes) && prevRes[resource] !== 0) {
          if (!deltas) deltas = {};
          deltas[resource] = -(prevRes[resource] ?? 0);
        }
      }
      if (deltas) {
        newEvents.push({ id: ++nextEventId, type: 'resourceDelta', playerId: player.id, deltas, timestamp: now });
      }

      // Favor delta
      const currGlory = player.glory ?? 0;
      const prevGlory = prevPlayer.glory ?? 0;
      if (currGlory !== prevGlory) {
        newEvents.push({ id: ++nextEventId, type: 'favorDelta', playerId: player.id, delta: currGlory - prevGlory, timestamp: now });
      }
    }

    // --- 2. Turn change ---
    if (game.currentPlayer !== prev.currentPlayer && game.phase === 'action_phase' && prevPhase === 'action_phase') {
      newEvents.push({ id: ++nextEventId, type: 'turnChange', fromPlayer: prev.currentPlayer, toPlayer: game.currentPlayer, timestamp: now });
    }

    // --- 3. Worker placements (only when fully committed) ---
    if (!pendingDecision) {
      const currLen = game.roundActions?.length || 0;
      const committedLen = committedRoundActionsLenRef.current;
      if (currLen > committedLen) {
        const actions = game.roundActions || [];
        for (let i = committedLen; i < currLen; i++) {
          const ra = actions[i];
          newEvents.push({ id: ++nextEventId, type: 'workerPlaced', playerId: ra.playerId, actionId: ra.actionId, timestamp: now });
        }
      }
      committedRoundActionsLenRef.current = currLen;
    } else {
      // Don't advance committed length while pending
    }
    // Handle round resets
    if (!pendingDecision) {
      const currLen = game.roundActions?.length || 0;
      if (currLen < committedRoundActionsLenRef.current) {
        committedRoundActionsLenRef.current = currLen;
      }
    }

    // --- 4. New log entries + card triggers (single pass with regex) ---
    if (logArr.length > prevLogLen) {
      const alreadyDetected = new Set();
      for (let i = prevLogLen; i < logArr.length; i++) {
        const text = logArr[i];
        newEvents.push({ id: ++nextEventId, type: 'logEntry', text, timestamp: now });

        // Card trigger detection via regex (single pass per log entry)
        const matches = text.matchAll(CARD_NAME_REGEX);
        for (const match of matches) {
          const cardName = match[0];
          if (!alreadyDetected.has(cardName)) {
            alreadyDetected.add(cardName);
            newEvents.push({ id: ++nextEventId, type: 'cardTriggered', cardId: CARD_NAME_TO_ID.get(cardName), cardName, timestamp: now });
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

  // Auto-expire old events — only run interval when there are events
  const hasEvents = events.length > 0;
  useEffect(() => {
    if (!hasEvents) return;

    const timer = setInterval(() => {
      const now = Date.now();
      setEvents(prev => {
        const filtered = prev.filter(e => now - e.timestamp < expiry);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 500); // 500ms instead of 250ms — less CPU, events still expire smoothly

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
