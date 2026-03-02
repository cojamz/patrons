/**
 * TurnAnnouncement — Inline HUD toast between turn info and round tracker.
 *
 * Shows rich narrative messages with resource impacts:
 *   "Player 2 → Skulk · +3 black"
 *   "You → Collect Tribute · +2 gold"
 *   "Player 1: -2 Favor (Hex)"
 *   "Bought Golden Scepter"
 *   "The Fortunate: gained 2 starting resources"
 *
 * Batches concurrent events into combined messages.
 */
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playerColors, base, godColors, resourceStyles } from '../../styles/theme';
import WorkerIcon from '../icons/WorkerIcon';
import ResourceIcon from '../icons/ResourceIcon';
import godsData from '../../../engine/v3/data/gods';

// Build lookup: actionId → { name, godColor, effect }
const ACTION_LOOKUP = {};
for (const [godColor, god] of Object.entries(godsData)) {
  for (const action of god.actions) {
    ACTION_LOOKUP[action.id] = { name: action.name, godColor, effect: action.effect };
  }
}

function formatLogText(text) {
  return text
    .replace(/\bGlory\b/g, 'Favor')
    .replace(/\bglory\b/g, 'favor')
    .replace(/\benvoys\b/gi, 'workers')
    .replace(/\benvoy\b/gi, 'worker');
}

function formatDeltas(deltas) {
  return Object.entries(deltas)
    .filter(([, v]) => v !== 0)
    .map(([color, amt]) => `${amt > 0 ? '+' : ''}${amt} ${color}`)
    .join(', ');
}

function getPlayerName(playerId, players) {
  const p = players?.find(pp => pp.id === playerId);
  return p?.name || `Player ${(playerId ?? 0) + 1}`;
}

/**
 * Inline HUD toast.
 */
export default function TurnAnnouncement({ narrativeEvents, players, aiPlayers, currentPlayer }) {
  const [current, setCurrent] = useState(null);
  const [queueVersion, setQueueVersion] = useState(0);
  const queueRef = useRef([]);
  const timerRef = useRef(null);
  const seenRef = useRef(new Set());
  const batchRef = useRef([]);
  const batchTimerRef = useRef(null);

  // Collect events, batch those arriving in the same frame
  useEffect(() => {
    if (!narrativeEvents || narrativeEvents.length === 0) return;

    let hasNew = false;
    for (const evt of narrativeEvents) {
      if (seenRef.current.has(evt.id)) continue;
      seenRef.current.add(evt.id);
      batchRef.current.push(evt);
      hasNew = true;
    }

    if (!hasNew) return;

    // Debounce: wait one frame for concurrent events to arrive
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(() => {
      const batch = batchRef.current;
      batchRef.current = [];
      const messages = buildBatchMessages(batch, players, aiPlayers, currentPlayer);
      if (messages.length > 0) {
        queueRef.current.push(...messages);
        setQueueVersion(v => v + 1);
      }
    }, 60);
  }, [narrativeEvents, players, aiPlayers, currentPlayer]);

  function showNext() {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (queueRef.current.length === 0) {
      // No more messages — keep the current one visible as persistent context
      return;
    }

    const next = queueRef.current.shift();
    setCurrent(next);

    // If more messages are queued, cycle after duration. Otherwise, persist.
    if (queueRef.current.length > 0) {
      timerRef.current = setTimeout(() => showNext(), next.duration);
    }
  }

  // When new messages arrive while one is persisting, kick the cycle
  useEffect(() => {
    if (current && queueRef.current.length > 0 && !timerRef.current) {
      // Current message is persisting — give it a moment then advance
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        showNext();
      }, 600);
      return () => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      };
    }
    if (!current && queueRef.current.length > 0) {
      const t = setTimeout(() => showNext(), 100);
      return () => clearTimeout(t);
    }
  }, [current, queueVersion]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center min-w-0 px-2 overflow-hidden">
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={current.id}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg max-w-full"
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${current.color}22`,
            }}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
          >
            {/* Accent pip */}
            <div
              className="w-1 h-4 rounded-full flex-shrink-0"
              style={{ background: current.color }}
            />

            {/* Player icon */}
            {current.playerId != null && (
              <WorkerIcon playerId={current.playerId} size={14} />
            )}

            {/* Main text */}
            <span
              className="text-xs font-medium whitespace-nowrap"
              style={{ color: current.textColor || base.textSecondary }}
            >
              {current.text}
            </span>

            {/* Resource deltas with icons */}
            {current.deltas && Object.keys(current.deltas).length > 0 && (
              <div className="flex items-center gap-1.5 ml-0.5">
                <span style={{ color: base.textMuted, fontSize: '10px' }}>·</span>
                {Object.entries(current.deltas).filter(([,v]) => v !== 0).map(([color, amt]) => (
                  <span key={color} className="flex items-center gap-0.5">
                    <span className="text-xs font-medium" style={{ color: amt > 0 ? base.textSecondary : 'rgba(225, 29, 72, 0.9)' }}>
                      {amt > 0 ? '+' : ''}{amt}
                    </span>
                    <ResourceIcon type={color} size={12} />
                  </span>
                ))}
              </div>
            )}

            {/* Plain text detail (fallback) */}
            {current.detail && !current.deltas && (
              <span
                className="text-xs whitespace-nowrap"
                style={{ color: base.textMuted }}
              >
                · {current.detail}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Batch message builder ---

function buildBatchMessages(batch, players, aiPlayers, currentPlayerId) {
  const isHuman = (pid) => !aiPlayers || !aiPlayers.has(pid);
  const messages = [];

  // Separate events by type
  const turnChanges = batch.filter(e => e.type === 'turnChange');
  const workerPlaced = batch.filter(e => e.type === 'workerPlaced');
  const resourceDeltas = batch.filter(e => e.type === 'resourceDelta');
  const favorDeltas = batch.filter(e => e.type === 'favorDelta');
  const logEntries = batch.filter(e => e.type === 'logEntry');

  // 1. Turn changes
  for (const evt of turnChanges) {
    const name = getPlayerName(evt.toPlayer, players);
    const colors = playerColors[evt.toPlayer] || playerColors[0];
    messages.push({
      id: evt.id,
      text: isHuman(evt.toPlayer) ? 'Your Turn' : `${name}'s Turn`,
      detail: null,
      playerId: evt.toPlayer,
      color: colors.primary,
      textColor: colors.light,
      duration: 1500,
    });
  }

  // 2. Worker placements — combine with concurrent resource deltas
  for (const evt of workerPlaced) {
    const name = getPlayerName(evt.playerId, players);
    const action = ACTION_LOOKUP[evt.actionId];
    const actionName = action?.name || evt.actionId;
    const godColor = action?.godColor;
    const colors = playerColors[evt.playerId] || playerColors[0];

    // Find concurrent resource delta for this player
    const playerDelta = resourceDeltas.find(d => d.playerId === evt.playerId);

    messages.push({
      id: evt.id,
      text: isHuman(evt.playerId) ? `You → ${actionName}` : `${name} → ${actionName}`,
      detail: !playerDelta ? (action?.effect ? formatLogText(action.effect) : null) : null,
      deltas: playerDelta?.deltas || null,
      playerId: evt.playerId,
      color: godColor ? godColors[godColor].primary : colors.primary,
      textColor: colors.light,
      duration: 1800,
    });

    // Show impacts on other players
    for (const rd of resourceDeltas) {
      if (rd.playerId === evt.playerId) continue;
      const hasAny = Object.values(rd.deltas).some(v => v !== 0);
      if (hasAny) {
        const victimName = getPlayerName(rd.playerId, players);
        messages.push({
          id: rd.id,
          text: victimName,
          detail: null,
          deltas: rd.deltas,
          playerId: rd.playerId,
          color: godColors.black?.primary || 'rgba(168,162,158,0.5)',
          textColor: base.textSecondary,
          duration: 1500,
        });
      }
    }

    for (const fd of favorDeltas) {
      if (fd.playerId === evt.playerId) continue;
      if (fd.delta >= 0) continue; // Only show losses
      const victimName = getPlayerName(fd.playerId, players);
      messages.push({
        id: fd.id,
        text: `${victimName}: ${fd.delta} Favor`,
        detail: null,
        playerId: fd.playerId,
        color: godColors.black?.primary || 'rgba(168,162,158,0.5)',
        textColor: base.textSecondary,
        duration: 1200,
      });
    }
  }

  // 3. Log entries — catch shop purchases, power card buys, champion effects, round events
  //    Skip entries that duplicate what workerPlaced already shows
  const hasWorkerPlacement = workerPlaced.length > 0;
  for (const evt of logEntries) {
    const t = evt.text;
    if (!t) continue;

    // Skip plain resource gains (covered by workerPlaced detail or floating deltas)
    if (/^\+\d+ (gold|black|green|yellow)$/.test(t)) continue;

    // Skip "Paid for X" (redundant with shop benefit)
    if (/^Paid for /.test(t)) continue;

    // If we just showed a workerPlaced, skip generic action logs
    if (hasWorkerPlacement && /^\+\d+ /.test(t)) continue;

    // Power card purchase
    if (/^Bought /.test(t)) {
      messages.push({
        id: evt.id,
        text: formatLogText(t),
        detail: null,
        playerId: null,
        color: godColors.gold.primary,
        textColor: godColors.gold.light,
        duration: 1500,
      });
      continue;
    }

    // Shop results
    if (/shop:/i.test(t)) {
      messages.push({
        id: evt.id,
        text: formatLogText(t),
        detail: null,
        playerId: null,
        color: godColors.gold.primary,
        textColor: base.textSecondary,
        duration: 1200,
      });
      continue;
    }

    // On-purchase effects
    if (/on-purchase:/i.test(t)) {
      messages.push({
        id: evt.id,
        text: formatLogText(t),
        detail: null,
        playerId: null,
        color: godColors.gold.primary,
        textColor: base.textSecondary,
        duration: 1200,
      });
      continue;
    }

    // Champion/round/steal/favor effects
    if (/Prescient|Fortunate|Blessed|Strategist|stole|steal|lost|favor|glory|hex|ruin|blocked|repeat|copy|nullif|draft|champion|begins|Round \d|discount/i.test(t)) {
      messages.push({
        id: evt.id,
        text: formatLogText(t),
        detail: null,
        playerId: null,
        color: godColors.gold.primary,
        textColor: base.textSecondary,
        duration: 1200,
      });
      continue;
    }

    // Catch "Cannot" / error messages
    if (/^Cannot |^You can only|^No empty|^Invalid/.test(t)) {
      messages.push({
        id: evt.id,
        text: formatLogText(t),
        detail: null,
        playerId: null,
        color: 'rgba(225, 29, 72, 0.6)',
        textColor: 'rgba(225, 29, 72, 0.9)',
        duration: 1500,
      });
      continue;
    }
  }

  // 4. Standalone favor deltas (when no worker placement in this batch — e.g., shop effects)
  if (workerPlaced.length === 0) {
    for (const fd of favorDeltas) {
      if (fd.delta === 0) continue;
      const name = getPlayerName(fd.playerId, players);
      const sign = fd.delta > 0 ? '+' : '';
      messages.push({
        id: fd.id,
        text: `${name}: ${sign}${fd.delta} Favor`,
        detail: null,
        playerId: fd.playerId,
        color: fd.delta > 0 ? godColors.gold.primary : godColors.black.primary,
        textColor: base.textSecondary,
        duration: 1200,
      });
    }
  }

  return messages;
}
