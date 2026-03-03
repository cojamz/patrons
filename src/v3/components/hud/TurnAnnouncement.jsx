/**
 * TurnAnnouncement — Horizontal event ribbon in the HUD bar.
 *
 * Two-line persistent pills stack left-to-right. Newest on the right,
 * old ones push left. Scrollable to review history. Max ~10 retained.
 *
 * Each pill: Line 1 = title (who/source), Line 2 = body (what happened)
 * with optional resource delta icons.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playerColors, base, godColors } from '../../styles/theme';
import WorkerIcon from '../icons/WorkerIcon';
import ResourceIcon from '../icons/ResourceIcon';
import godsData from '../../../engine/v3/data/gods';

const MAX_MESSAGES = 10;

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

function getPlayerName(playerId, players) {
  const p = players?.find(pp => pp.id === playerId);
  return p?.name || `Player ${(playerId ?? 0) + 1}`;
}

/**
 * Split "Source: details" or "Source — details" into [title, body].
 * Falls back to [text, null] if no separator found.
 */
function splitText(text) {
  // Try ": " split first
  const colonIdx = text.indexOf(': ');
  if (colonIdx > 0 && colonIdx < 30) {
    return [text.slice(0, colonIdx), text.slice(colonIdx + 2)];
  }
  // Try " — " split
  const dashIdx = text.indexOf(' — ');
  if (dashIdx > 0) {
    return [text.slice(0, dashIdx), text.slice(dashIdx + 3)];
  }
  return [text, null];
}

/**
 * Two-line message pill.
 * Line 1: [pip] [worker icon] title
 * Line 2: resource deltas or body text
 */
function MessagePill({ msg, isNewest }) {
  const hasDeltas = msg.deltas && Object.keys(msg.deltas).some(k => msg.deltas[k] !== 0);

  return (
    <motion.div
      layout
      className="flex gap-1.5 px-2.5 py-1 rounded-md flex-shrink-0"
      style={{
        background: isNewest ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${msg.color}${isNewest ? '33' : '18'}`,
        opacity: isNewest ? 1 : 0.7,
      }}
      initial={{ opacity: 0, scale: 0.92, x: 16 }}
      animate={{ opacity: isNewest ? 1 : 0.7, scale: 1, x: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {/* Accent pip — spans both lines */}
      <div
        className="w-1 rounded-full flex-shrink-0 self-stretch"
        style={{ background: msg.color, minHeight: '14px' }}
      />

      <div className="flex flex-col gap-0 min-w-0">
        {/* Line 1: title */}
        <div className="flex items-center gap-1">
          {msg.playerId != null && (
            <WorkerIcon playerId={msg.playerId} size={11} />
          )}
          <span
            className="font-semibold whitespace-nowrap"
            style={{
              color: msg.textColor || base.textSecondary,
              fontSize: '10.5px',
              lineHeight: '14px',
            }}
          >
            {msg.title}
          </span>
        </div>

        {/* Line 2: resource deltas (preferred) or body text */}
        {hasDeltas ? (
          <div className="flex items-center gap-1">
            {Object.entries(msg.deltas).filter(([,v]) => v !== 0).map(([color, amt]) => (
              <span key={color} className="flex items-center gap-0.5">
                <span
                  className="font-semibold"
                  style={{
                    fontSize: '10px',
                    color: amt > 0 ? 'rgba(167, 243, 208, 0.9)' : 'rgba(225, 29, 72, 0.85)',
                  }}
                >
                  {amt > 0 ? '+' : ''}{amt}
                </span>
                <ResourceIcon type={color} size={10} />
              </span>
            ))}
          </div>
        ) : msg.body ? (
          <span
            className="whitespace-nowrap"
            style={{ color: base.textMuted, fontSize: '10px', lineHeight: '13px' }}
          >
            {msg.body}
          </span>
        ) : null}
      </div>
    </motion.div>
  );
}

/**
 * Horizontal event ribbon — persistent pills, newest on right.
 */
export default function TurnAnnouncement({ narrativeEvents, players, aiPlayers, currentPlayer }) {
  const [messages, setMessages] = useState([]);
  const seenRef = useRef(new Set());
  const batchRef = useRef([]);
  const batchTimerRef = useRef(null);
  const scrollRef = useRef(null);

  // Auto-scroll to the right (newest) when messages change
  const scrollToEnd = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    });
  }, []);

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

    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(() => {
      const batch = batchRef.current;
      batchRef.current = [];
      const newMsgs = buildBatchMessages(batch, players, aiPlayers, currentPlayer);
      if (newMsgs.length > 0) {
        setMessages(prev => [...prev, ...newMsgs].slice(-MAX_MESSAGES));
      }
    }, 60);
  }, [narrativeEvents, players, aiPlayers, currentPlayer]);

  useEffect(() => {
    if (messages.length > 0) scrollToEnd();
  }, [messages, scrollToEnd]);

  useEffect(() => {
    return () => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, []);

  if (messages.length === 0) {
    return <div className="flex-1 min-w-0" />;
  }

  return (
    <div
      className="flex-1 min-w-0 relative"
      style={{ overflow: 'hidden' }}
    >
      {/* Left fade mask */}
      <div
        className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{
          width: '24px',
          background: 'linear-gradient(to right, rgba(12, 10, 9, 0.95), transparent)',
        }}
      />
      {/* Right fade mask */}
      <div
        className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
        style={{
          width: '24px',
          background: 'linear-gradient(to left, rgba(12, 10, 9, 0.95), transparent)',
        }}
      />

      {/* Scrollable ribbon */}
      <div
        ref={scrollRef}
        className="ticker-ribbon flex items-center gap-2 px-6"
        style={{
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessagePill
              key={msg.id}
              msg={msg}
              isNewest={i === messages.length - 1}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Batch message builder ---
// All messages now have: { id, title, body, deltas, playerId, color, textColor }

function buildBatchMessages(batch, players, aiPlayers, currentPlayerId) {
  const isHuman = (pid) => !aiPlayers || !aiPlayers.has(pid);
  const pName = (pid) => isHuman(pid) ? 'You' : getPlayerName(pid, players);
  const messages = [];

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
      title: isHuman(evt.toPlayer) ? 'Your Turn' : `${name}'s Turn`,
      body: 'Place a worker on an action',
      deltas: null,
      playerId: evt.toPlayer,
      color: colors.primary,
      textColor: colors.light,
    });
  }

  // 2. Worker placements — combine with concurrent resource deltas
  for (const evt of workerPlaced) {
    const action = ACTION_LOOKUP[evt.actionId];
    const actionName = action?.name || evt.actionId;
    const godColor = action?.godColor;
    const colors = playerColors[evt.playerId] || playerColors[0];
    const playerDelta = resourceDeltas.find(d => d.playerId === evt.playerId);

    messages.push({
      id: evt.id,
      title: `${pName(evt.playerId)} → ${actionName}`,
      body: !playerDelta && action?.effect ? formatLogText(action.effect) : null,
      deltas: playerDelta?.deltas || null,
      playerId: evt.playerId,
      color: godColor ? godColors[godColor].primary : colors.primary,
      textColor: colors.light,
    });

    // Impacts on other players
    for (const rd of resourceDeltas) {
      if (rd.playerId === evt.playerId) continue;
      if (!Object.values(rd.deltas).some(v => v !== 0)) continue;
      messages.push({
        id: rd.id,
        title: pName(rd.playerId),
        body: 'affected',
        deltas: rd.deltas,
        playerId: rd.playerId,
        color: godColors.black?.primary || 'rgba(168,162,158,0.5)',
        textColor: base.textSecondary,
      });
    }

    for (const fd of favorDeltas) {
      if (fd.playerId === evt.playerId) continue;
      if (fd.delta >= 0) continue;
      messages.push({
        id: fd.id,
        title: pName(fd.playerId),
        body: `${fd.delta} Favor`,
        deltas: null,
        playerId: fd.playerId,
        color: godColors.black?.primary || 'rgba(168,162,158,0.5)',
        textColor: base.textSecondary,
      });
    }
  }

  // 3. Log entries
  const hasWorkerPlacement = workerPlaced.length > 0;
  for (const evt of logEntries) {
    const t = evt.text;
    if (!t) continue;
    if (/^\+\d+ (gold|black|green|yellow)$/.test(t)) continue;
    if (/^Paid for /.test(t)) continue;
    if (hasWorkerPlacement && /^\+\d+ /.test(t)) continue;

    const formatted = formatLogText(t);

    // Power card purchase: "Bought Golden Scepter"
    if (/^Bought /.test(t)) {
      const cardName = formatted.replace('Bought ', '');
      messages.push({
        id: evt.id,
        title: 'Purchased',
        body: cardName,
        deltas: null,
        playerId: null,
        color: godColors.gold.primary,
        textColor: godColors.gold.light,
      });
      continue;
    }

    // Shop / on-purchase results
    if (/shop:|on-purchase:/i.test(t)) {
      const [title, body] = splitText(formatted);
      messages.push({
        id: evt.id,
        title,
        body: body || 'shop effect',
        deltas: null,
        playerId: null,
        color: godColors.gold.primary,
        textColor: base.textSecondary,
      });
      continue;
    }

    // Champion/round/steal/favor effects
    if (/Prescient|Fortunate|Blessed|Strategist|stole|steal|lost|favor|glory|hex|ruin|blocked|repeat|copy|nullif|draft|champion|begins|Round \d|discount/i.test(t)) {
      const [title, body] = splitText(formatted);
      messages.push({
        id: evt.id,
        title,
        body: body || formatted,
        deltas: null,
        playerId: null,
        color: godColors.gold.primary,
        textColor: base.textSecondary,
      });
      continue;
    }

    // Error messages
    if (/^Cannot |^You can only|^No empty|^Invalid/.test(t)) {
      messages.push({
        id: evt.id,
        title: 'Error',
        body: formatted,
        deltas: null,
        playerId: null,
        color: 'rgba(225, 29, 72, 0.6)',
        textColor: 'rgba(225, 29, 72, 0.9)',
      });
      continue;
    }
  }

  // 4. Standalone favor deltas
  if (workerPlaced.length === 0) {
    for (const fd of favorDeltas) {
      if (fd.delta === 0) continue;
      const sign = fd.delta > 0 ? '+' : '';
      messages.push({
        id: fd.id,
        title: pName(fd.playerId),
        body: `${sign}${fd.delta} Favor`,
        deltas: null,
        playerId: fd.playerId,
        color: fd.delta > 0 ? godColors.gold.primary : godColors.black.primary,
        textColor: base.textSecondary,
      });
    }
  }

  return messages;
}
