/**
 * TurnAnnouncement — Event Line.
 *
 * Shows the latest event as a single readable line. Crossfades on update.
 * Click to expand a dropdown showing recent event history (newest on top).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playerColors, base, godColors } from '../../styles/theme';
import WorkerIcon from '../icons/WorkerIcon';
import ResourceIcon from '../icons/ResourceIcon';
import { powerCards } from '../../../engine/v3/data/powerCards';
import godsData from '../../../engine/v3/data/gods';

const MAX_MESSAGES = 20;

// === Lookups ===

const ACTION_LOOKUP = {};
for (const [godColor, god] of Object.entries(godsData)) {
  for (const action of god.actions) {
    ACTION_LOOKUP[action.id] = { name: action.name, godColor, effect: action.effect };
  }
}

const SHOP_LOOKUP = {};
for (const [godColor, god] of Object.entries(godsData)) {
  for (const shop of god.shops || []) {
    SHOP_LOOKUP[`${godColor}_${shop.type}`] = {
      godColor,
      type: shop.type,
      label: `${god.name} ${shop.type === 'vp' ? 'VP' : shop.type === 'strong' ? 'Strong' : 'Weak'} Shop`,
      effect: shop.effect,
    };
  }
}

const CARD_NAME_TO_ID = new Map();
for (const [id, card] of Object.entries(powerCards)) {
  CARD_NAME_TO_ID.set(card.name, id);
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

// === Deltas renderer (inline in event line) ===

function DeltaIcons({ deltas, favorDelta }) {
  const entries = deltas
    ? Object.entries(deltas).filter(([, v]) => v !== 0)
    : [];
  const hasFavor = favorDelta != null && favorDelta !== 0;

  if (entries.length === 0 && !hasFavor) return null;

  return (
    <span className="inline-flex items-center gap-1 ml-1.5">
      {entries.map(([color, amt]) => (
        <span key={color} className="inline-flex items-center gap-0.5">
          <span
            className="font-bold"
            style={{
              fontSize: '11px',
              color: amt > 0 ? 'rgba(167, 243, 208, 0.9)' : 'rgba(225, 29, 72, 0.85)',
            }}
          >
            {amt > 0 ? '+' : ''}{amt}
          </span>
          <ResourceIcon type={color} size={11} />
        </span>
      ))}
      {hasFavor && (
        <span className="inline-flex items-center gap-0.5">
          <span
            className="font-bold"
            style={{
              fontSize: '11px',
              color: favorDelta > 0 ? '#E8C547' : 'rgba(225, 29, 72, 0.85)',
            }}
          >
            {favorDelta > 0 ? '+' : ''}{favorDelta}
          </span>
          <span style={{ fontSize: '9px', fontWeight: 700 }}>F</span>
        </span>
      )}
    </span>
  );
}

// === Inline message display (stripped — no deltas, no effectText) ===

function InlineMessageLine({ msg }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Accent pip */}
        <div
          className="w-1 rounded-full flex-shrink-0"
          style={{ background: msg.color, height: '12px' }}
        />

        {/* Player name + worker icon */}
        <div className="flex items-center gap-1 min-w-0">
          {msg.playerId != null && (
            <WorkerIcon playerId={msg.playerId} size={11} />
          )}
          <span
            className="font-semibold whitespace-nowrap"
            style={{
              color: msg.textColor || base.textSecondary,
              fontSize: '11px',
              lineHeight: '14px',
            }}
          >
            {msg.playerName}
          </span>
        </div>

        {/* Source / action name */}
        {msg.source && (
          <span
            className="whitespace-nowrap"
            style={{ color: base.textMuted, fontSize: '10.5px', lineHeight: '14px' }}
          >
            {msg.source}
          </span>
        )}
      </div>
    </div>
  );
}

// === Full message display (with deltas + effectText — for dropdown history) ===

function MessageLine({ msg }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 min-w-0">
        {/* Accent pip */}
        <div
          className="w-1 rounded-full flex-shrink-0"
          style={{ background: msg.color, height: '12px' }}
        />

        {/* Player name + worker icon */}
        <div className="flex items-center gap-1 min-w-0">
          {msg.playerId != null && (
            <WorkerIcon playerId={msg.playerId} size={11} />
          )}
          <span
            className="font-semibold whitespace-nowrap"
            style={{
              color: msg.textColor || base.textSecondary,
              fontSize: '11px',
              lineHeight: '14px',
            }}
          >
            {msg.playerName}
          </span>
        </div>

        {/* Source / action name */}
        {msg.source && (
          <span
            className="whitespace-nowrap"
            style={{ color: base.textMuted, fontSize: '10.5px', lineHeight: '14px' }}
          >
            {msg.source}
          </span>
        )}

        {/* Resource + favor deltas */}
        <DeltaIcons deltas={msg.deltas} favorDelta={msg.favorDelta} />
      </div>

      {/* Effect text subtitle */}
      {msg.effectText && (
        <div
          className="truncate"
          style={{
            fontSize: '9.5px',
            color: base.textMuted,
            opacity: 0.7,
            fontStyle: 'italic',
            marginLeft: '10px',
            lineHeight: '13px',
          }}
        >
          {msg.effectText}
        </div>
      )}
    </div>
  );
}

// === Main component ===

export default function TurnAnnouncement({ narrativeEvents, players, aiPlayers, currentPlayer }) {
  const [messages, setMessages] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const seenRef = useRef(new Set());
  const batchRef = useRef([]);
  const batchTimerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!expanded) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded]);

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
        const hasTurnChange = batch.some(e => e.type === 'turnChange');
        if (hasTurnChange) {
          setMessages(newMsgs.slice(-MAX_MESSAGES)); // fresh start on turn change
        } else {
          setMessages(prev => [...prev, ...newMsgs].slice(-MAX_MESSAGES)); // accumulate
        }
      }
    }, 30);
  }, [narrativeEvents, players, aiPlayers, currentPlayer]);

  useEffect(() => {
    return () => {
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    };
  }, []);

  if (messages.length === 0) {
    return <div className="flex-1 min-w-0" />;
  }

  const newest = messages[messages.length - 1];
  const history = [...messages].reverse().slice(0, 8);

  return (
    <div
      ref={dropdownRef}
      className="flex-1 min-w-0 relative cursor-pointer"
      onClick={() => setExpanded(e => !e)}
    >
      {/* Single-line latest event with crossfade (stripped — no deltas/effectText) */}
      <div className="px-2 py-0.5 overflow-hidden" style={{ minHeight: '22px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={newest.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <InlineMessageLine msg={newest} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Event count hint */}
      {messages.length > 1 && !expanded && (
        <div
          className="absolute right-1 pointer-events-none"
          style={{ top: '50%', transform: 'translateY(-50%)', fontSize: '8px', fontWeight: 500, color: base.textMuted, opacity: 0.4 }}
        >
          {messages.length} ▾
        </div>
      )}

      {/* Dropdown history */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-50 rounded-lg overflow-hidden"
            style={{
              top: '100%',
              marginTop: '4px',
              width: '320px',
              maxHeight: '360px',
              overflowY: 'auto',
              background: 'rgba(12, 10, 9, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              scrollbarWidth: 'none',
              transformOrigin: 'top',
            }}
          >
            <div className="px-2 py-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, color: base.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                This Turn
              </span>
            </div>
            {history.map((msg, i) => (
              <div
                key={msg.id}
                className="px-2 py-1.5"
                style={{
                  borderBottom: i < history.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined,
                  opacity: i === 0 ? 1 : Math.max(0.4, 1 - i * 0.08),
                }}
              >
                <MessageLine msg={msg} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// === Batch message builder ===
// Structure: { id, playerName, playerId, source, deltas, favorDelta, color, textColor }

function buildBatchMessages(batch, players, aiPlayers, currentPlayerId) {
  const isHuman = (pid) => !aiPlayers || !aiPlayers.has(pid);
  const pName = (pid) => isHuman(pid) ? 'You' : getPlayerName(pid, players);
  const messages = [];

  const turnChanges = batch.filter(e => e.type === 'turnChange');
  const workerPlaced = batch.filter(e => e.type === 'workerPlaced');
  const resourceDeltas = batch.filter(e => e.type === 'resourceDelta');
  const favorDeltas = batch.filter(e => e.type === 'favorDelta');
  const logEntries = batch.filter(e => e.type === 'logEntry');
  const cardTriggers = batch.filter(e => e.type === 'cardTriggered');

  const consumedResourceDeltas = new Set();
  const consumedFavorDeltas = new Set();
  const consumedLogs = new Set();

  // 1. Turn changes
  for (const evt of turnChanges) {
    const colors = playerColors[evt.toPlayer] || playerColors[0];
    messages.push({
      id: evt.id,
      playerName: isHuman(evt.toPlayer) ? 'Your Turn' : `${getPlayerName(evt.toPlayer, players)}'s Turn`,
      playerId: evt.toPlayer,
      source: 'Place a worker',
      deltas: null,
      favorDelta: null,
      color: colors.primary,
      textColor: colors.light,
    });
  }

  // 2. Worker placements — primary action pills
  for (const evt of workerPlaced) {
    const action = ACTION_LOOKUP[evt.actionId];
    const actionName = action?.name || evt.actionId;
    const godColor = action?.godColor;
    const colors = playerColors[evt.playerId] || playerColors[0];

    const playerDelta = resourceDeltas.find(d => d.playerId === evt.playerId);
    if (playerDelta) consumedResourceDeltas.add(playerDelta.id);

    const playerFavor = favorDeltas.find(d => d.playerId === evt.playerId);
    if (playerFavor) consumedFavorDeltas.add(playerFavor.id);

    messages.push({
      id: evt.id,
      playerName: pName(evt.playerId),
      playerId: evt.playerId,
      source: actionName,
      deltas: playerDelta?.deltas || null,
      favorDelta: playerFavor?.delta || null,
      color: godColor ? godColors[godColor].primary : colors.primary,
      textColor: colors.light,
      effectText: action?.effect || null,
    });

    // Victim pills
    for (const rd of resourceDeltas) {
      if (rd.playerId === evt.playerId) continue;
      if (!Object.values(rd.deltas).some(v => v !== 0)) continue;
      consumedResourceDeltas.add(rd.id);

      const victimFavor = favorDeltas.find(d => d.playerId === rd.playerId);
      if (victimFavor) consumedFavorDeltas.add(victimFavor.id);

      messages.push({
        id: rd.id,
        playerName: pName(rd.playerId),
        playerId: rd.playerId,
        source: null,
        deltas: rd.deltas,
        favorDelta: victimFavor?.delta || null,
        color: godColors.black?.primary || 'rgba(168,162,158,0.5)',
        textColor: base.textSecondary,
      });
    }

    // Favor-only victims
    for (const fd of favorDeltas) {
      if (fd.playerId === evt.playerId) continue;
      if (consumedFavorDeltas.has(fd.id)) continue;
      if (fd.delta === 0) continue;
      consumedFavorDeltas.add(fd.id);

      messages.push({
        id: fd.id,
        playerName: pName(fd.playerId),
        playerId: fd.playerId,
        source: null,
        deltas: null,
        favorDelta: fd.delta,
        color: fd.delta < 0 ? (godColors.black?.primary || 'rgba(168,162,158,0.5)') : godColors.gold.primary,
        textColor: base.textSecondary,
      });
    }
  }

  // 3. Card triggers
  for (const evt of cardTriggers) {
    const card = powerCards[evt.cardId];
    if (!card) continue;
    const godColor = card.god;

    messages.push({
      id: evt.id,
      playerName: pName(currentPlayerId),
      playerId: currentPlayerId,
      source: card.name,
      deltas: null,
      favorDelta: null,
      color: godColor ? godColors[godColor].primary : godColors.gold.primary,
      textColor: base.textSecondary,
    });
  }

  // 4. Log entries
  const hasWorkerPlacement = workerPlaced.length > 0;
  for (const evt of logEntries) {
    const t = evt.text;
    if (!t) continue;
    if (consumedLogs.has(evt.id)) continue;

    if (/^\+\d+ (gold|black|green|yellow)$/.test(t)) continue;
    if (/^Paid for /.test(t)) continue;
    if (hasWorkerPlacement && /^\+\d+ /.test(t)) continue;
    if (cardTriggers.length > 0) {
      const isCardLog = cardTriggers.some(ct => t.includes(ct.cardName));
      if (isCardLog) continue;
    }

    const formatted = formatLogText(t);

    if (/^Bought /.test(t)) {
      const cardName = formatted.replace('Bought ', '');
      const cardId = CARD_NAME_TO_ID.get(cardName) || CARD_NAME_TO_ID.get(t.replace('Bought ', ''));
      const cardDef = cardId ? powerCards[cardId] : null;
      messages.push({
        id: evt.id,
        playerName: pName(currentPlayerId),
        playerId: currentPlayerId,
        source: `Bought ${cardName}`,
        deltas: null,
        favorDelta: null,
        color: godColors.gold.primary,
        textColor: godColors.gold.light,
        effectText: cardDef?.description || null,
      });
      continue;
    }

    if (/shop:/i.test(t)) {
      const colonIdx = t.indexOf(': ');
      const shopLabel = colonIdx > 0 ? formatted.slice(0, colonIdx) : 'Shop';
      const body = colonIdx > 0 ? formatted.slice(colonIdx + 2) : formatted;
      messages.push({
        id: evt.id,
        playerName: pName(currentPlayerId),
        playerId: currentPlayerId,
        source: `${shopLabel}: ${body}`,
        deltas: null,
        favorDelta: null,
        color: godColors.gold.primary,
        textColor: base.textSecondary,
      });
      continue;
    }

    if (/Prescient|Fortunate|Blessed|Strategist|Favored|stole|steal|lost|favor|glory|hex|ruin|blocked|repeat|copy|nullif|draft|champion|begins|Round \d|discount|Chrono|Diadem|Temporal/i.test(t)) {
      const colonIdx = formatted.indexOf(': ');
      const source = colonIdx > 0 && colonIdx < 30 ? formatted.slice(0, colonIdx) : null;
      const body = colonIdx > 0 && colonIdx < 30 ? formatted.slice(colonIdx + 2) : formatted;

      messages.push({
        id: evt.id,
        playerName: source || 'Effect',
        playerId: null,
        source: body,
        deltas: null,
        favorDelta: null,
        color: godColors.gold.primary,
        textColor: base.textSecondary,
      });
      continue;
    }

    if (/^Cannot |^You can only|^No empty|^Invalid/.test(t)) {
      messages.push({
        id: evt.id,
        playerName: 'Error',
        playerId: null,
        source: formatted,
        deltas: null,
        favorDelta: null,
        color: 'rgba(225, 29, 72, 0.6)',
        textColor: 'rgba(225, 29, 72, 0.9)',
      });
      continue;
    }
  }

  // 5. Standalone favor deltas
  if (workerPlaced.length === 0) {
    for (const fd of favorDeltas) {
      if (consumedFavorDeltas.has(fd.id)) continue;
      if (fd.delta === 0) continue;
      messages.push({
        id: fd.id,
        playerName: pName(fd.playerId),
        playerId: fd.playerId,
        source: null,
        deltas: null,
        favorDelta: fd.delta,
        color: fd.delta > 0 ? godColors.gold.primary : godColors.black.primary,
        textColor: base.textSecondary,
      });
    }
  }

  // 6. Standalone resource deltas
  for (const rd of resourceDeltas) {
    if (consumedResourceDeltas.has(rd.id)) continue;
    if (!Object.values(rd.deltas).some(v => v !== 0)) continue;

    const uncFavor = favorDeltas.find(d => d.playerId === rd.playerId && !consumedFavorDeltas.has(d.id));
    if (uncFavor) consumedFavorDeltas.add(uncFavor.id);

    messages.push({
      id: rd.id,
      playerName: pName(rd.playerId),
      playerId: rd.playerId,
      source: null,
      deltas: rd.deltas,
      favorDelta: uncFavor?.delta || null,
      color: godColors.gold.primary,
      textColor: base.textSecondary,
    });
  }

  return messages;
}
