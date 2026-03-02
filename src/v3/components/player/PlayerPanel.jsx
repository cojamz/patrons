/**
 * PlayerPanel — Fixed bottom HUD for the current player.
 *
 * Luxury card-game feel: dark glass panel with warm divine glow,
 * animated favor counter, resource gems, worker meeples,
 * power card slots, and an End Turn button.
 *
 * Top strip shows all players as tabs; the current player is expanded.
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../hooks/useGame';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';
import { useGameEvents, filterByType, filterByPlayer } from '../../hooks/useGameEvents';
import { godColors, playerColors, base } from '../../styles/theme';
import { favorChange } from '../../styles/animations';
import ResourceDisplay from './ResourceDisplay';
import FloatingDeltas from '../hud/FloatingDeltas';
import PowerCardSlot from './PowerCardSlot';
import WorkerIcon from '../icons/WorkerIcon';
import ChampionIcon from '../icons/ChampionIcon';
import CardPixelIcon from '../icons/CardPixelIcon';
import champions from '../../../engine/v3/data/champions';
import { powerCards as powerCardsData } from '../../../engine/v3/data/powerCards';
import { ACTIONS_PER_ROUND } from '../../../engine/v3/data/constants';

// --- Collapsible Log ---

function CollapsibleLog({ log }) {
  const [expanded, setExpanded] = useState(false);
  const entries = (log || []).slice(-20);

  return (
    <div className="relative">
      {/* Toggle button */}
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-150"
        style={{
          background: expanded ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
          border: `1px solid ${expanded ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)'}`,
          color: base.textMuted,
          cursor: 'pointer',
        }}
        title={expanded ? 'Hide game log' : 'Show game log'}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.6 }}>
          <rect x="1" y="2" width="10" height="1.2" rx="0.6" fill="currentColor" />
          <rect x="1" y="5.4" width="7" height="1.2" rx="0.6" fill="currentColor" />
          <rect x="1" y="8.8" width="8.5" height="1.2" rx="0.6" fill="currentColor" />
        </svg>
        <span className="text-[10px] font-medium uppercase tracking-wider">Log</span>
        {entries.length > 0 && (
          <span
            className="text-[9px] font-semibold px-1 rounded"
            style={{ background: 'rgba(255,255,255,0.08)', color: base.textMuted }}
          >
            {entries.length}
          </span>
        )}
      </button>

      {/* Expanded log panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="absolute bottom-full right-0 mb-2 rounded-xl overflow-hidden"
            style={{
              width: '340px',
              maxHeight: '280px',
              background: 'rgba(12, 10, 9, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
              zIndex: 60,
            }}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: base.textMuted }}>
                Game Log
              </span>
              <button
                onClick={() => setExpanded(false)}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{ color: base.textMuted, background: 'rgba(255,255,255,0.04)' }}
              >
                Close
              </button>
            </div>

            {/* Entries */}
            <div className="flex flex-col gap-0.5 p-2 overflow-y-auto scrollbar-hide" style={{ maxHeight: '240px' }}>
              {entries.map((entry, i) => {
                const isLatest = i === entries.length - 1;
                return (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 px-1.5 py-0.5 rounded"
                    style={{
                      fontSize: '11px',
                      lineHeight: 1.4,
                      color: isLatest ? base.textPrimary : base.textSecondary,
                      opacity: isLatest ? 1 : 0.5 + (i / entries.length) * 0.4,
                      background: isLatest ? 'rgba(255,255,255,0.03)' : 'transparent',
                    }}
                  >
                    <div
                      className="w-0.5 rounded-full flex-shrink-0 mt-0.5"
                      style={{
                        background: isLatest ? godColors.gold.primary : 'rgba(255, 255, 255, 0.12)',
                        minHeight: '10px',
                        alignSelf: 'stretch',
                      }}
                    />
                    <span>
                      {entry
                        .replace(/\benvoys\b/gi, 'workers')
                        .replace(/\benvoy\b/gi, 'worker')
                        .replace(/\bGlory\b/g, 'Favor')
                        .replace(/\bglory\b/g, 'favor')}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Player Tab (top strip, non-current players) ---

function PowerCardTooltipIcon({ cardId, isCurrent }) {
  const [hovered, setHovered] = useState(false);
  const cardData = powerCardsData[cardId];

  return (
    <span
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CardPixelIcon
        cardId={cardId}
        size={12}
        color={isCurrent ? godColors.gold.light : base.textMuted}
      />
      <AnimatePresence>
        {hovered && cardData && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '8px',
              zIndex: 9999,
              width: '220px',
              padding: '8px 10px',
              borderRadius: '8px',
              background: '#0a0908',
              border: `1px solid ${godColors.gold.border}`,
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.9)',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, color: godColors.gold.text, marginBottom: '3px' }}>
              {cardData.name}
            </div>
            <div style={{ fontSize: '10px', lineHeight: 1.4, color: base.textSecondary }}>
              {cardData.description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}

function PlayerTab({ player, champion, isCurrent, onClick, favorDeltas, resourceDeltas }) {
  const colors = playerColors[player.id] || playerColors[0];
  const { value: favorDisplay } = useAnimatedValue(player.glory);
  const powerCards = champion?.powerCards || [];

  // Collect recent resource deltas for mini indicators
  const recentResources = {};
  for (const event of (resourceDeltas || [])) {
    for (const [resource, amount] of Object.entries(event.deltas || {})) {
      if (amount !== 0) recentResources[resource] = (recentResources[resource] || 0) + amount;
    }
  }

  return (
    <div className="relative">
      {/* Floating mini deltas above the tab */}
      <AnimatePresence>
        {!isCurrent && (favorDeltas || []).map(event => (
          <motion.div
            key={event.id}
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ bottom: '100%', marginBottom: '2px', zIndex: 40 }}
            initial={{ opacity: 0, y: 6, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ exit: { duration: 0.8 } }}
          >
            <span
              className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full whitespace-nowrap"
              style={{
                color: event.delta > 0 ? '#E0E0F0' : base.negativeLight,
                background: event.delta > 0 ? 'rgba(220, 220, 240, 0.15)' : 'rgba(225, 29, 72, 0.15)',
                border: `1px solid ${event.delta > 0 ? 'rgba(220, 220, 240, 0.3)' : 'rgba(225, 29, 72, 0.3)'}`,
              }}
            >
              {event.delta > 0 ? '+' : ''}{event.delta}
            </span>
          </motion.div>
        ))}
        {!isCurrent && Object.entries(recentResources).map(([resource, amount]) => (
          <motion.div
            key={`res-${resource}`}
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ bottom: '100%', marginBottom: '18px', zIndex: 39 }}
            initial={{ opacity: 0, y: 6, scale: 0.7 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.9 }}
            transition={{ exit: { duration: 0.8 } }}
          >
            <span
              className="text-[9px] font-bold tabular-nums px-1 py-0.5 rounded-full whitespace-nowrap"
              style={{
                color: (godColors[resource] || godColors.gold).light,
                background: `rgba(${hexToRgb((godColors[resource] || godColors.gold).primary)}, 0.2)`,
                border: `1px solid ${(godColors[resource] || godColors.gold).primary}44`,
              }}
            >
              {amount > 0 ? '+' : ''}{amount}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      <button
        onClick={onClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg transition-all duration-200"
        style={{
          background: isCurrent
            ? 'rgba(28, 25, 23, 0.92)'
            : 'rgba(28, 25, 23, 0.5)',
          borderBottom: isCurrent
            ? `2px solid ${colors.primary}`
            : '2px solid transparent',
          opacity: isCurrent ? 1 : 0.7,
        }}
      >
        {/* Player color pip */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: colors.primary,
            boxShadow: isCurrent ? `0 0 6px ${colors.primary}` : 'none',
          }}
        />
        <span
          className="text-xs font-semibold truncate max-w-[80px]"
          style={{ color: isCurrent ? colors.light : base.textSecondary }}
        >
          {player.name}
        </span>
        <span
          className="text-xs tabular-nums font-medium"
          style={{ color: '#E0E0F0', opacity: 0.9 }}
        >
          {favorDisplay}
        </span>
        {/* Power card icons */}
        {powerCards.length > 0 && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {powerCards.map(cardId => (
              <PowerCardTooltipIcon key={cardId} cardId={cardId} isCurrent={isCurrent} />
            ))}
          </div>
        )}
      </button>
    </div>
  );
}

// --- Favor Source Labels ---

export const FAVOR_SOURCE_LABELS = {
  gold_glory_condition: 'Gold God — per gold owned (round end)',
  yellow_glory_condition: 'Yellow God — per unique color (round end)',
  green_glory_condition: 'Green God — per action repeated',
  black_glory_condition: 'Black God — per steal/penalty',
  cash_in: 'Cash In action — gold converted',
  pickpocket: 'Pickpocket action — stolen favor',
  pickpocket_victim: 'Pickpocket — favor stolen from you',
  hex_action: 'Hex — mass penalty',
  ruin_action: 'Ruin — mass penalty',
  voodoo_doll: 'Voodoo Doll — curse damage',
  gold_crown: 'Gold Crown — endgame gold bonus',
  travelers_journal: "Traveler's Journal — gods visited",
  cursed_blade: 'Cursed Blade — attack bonus',
  cursed_blade_victim: 'Cursed Blade — damage taken',
  gold_vp_shop: 'Gold Shop — favor purchase',
  black_weak_shop: 'Black Shop — stolen favor',
  black_weak_shop_victim: 'Black Shop — favor stolen from you',
  black_strong_shop: 'Black Shop — stolen favor',
  black_strong_shop_victim: 'Black Shop — favor stolen from you',
  black_vp_shop: 'Black Shop — mass steal',
  black_vp_shop_victim: 'Black Shop — favor stolen from you',
  green_vp_shop: 'Green Shop — favor purchase',
  yellow_strong_shop: 'Yellow Shop — trigger scoring',
  yellow_vp_shop: 'Yellow Shop — set collection',
};

// --- Favor Counter ---

function FavorCounter({ glory, glorySources }) {
  const { value: displayFavor, direction } = useAnimatedValue(glory);
  const [hovered, setHovered] = useState(false);

  const glowColor = direction === 'up'
    ? 'rgba(220, 220, 240, 0.5)'
    : direction === 'down'
      ? 'rgba(225, 29, 72, 0.5)'
      : 'rgba(220, 220, 240, 0.3)';

  const textColor = direction === 'up'
    ? '#F0F0FF'
    : direction === 'down'
      ? base.negativeLight
      : '#E0E0F0';

  // Build sorted source entries (non-zero only, sorted by |value| descending)
  const sourceEntries = glorySources
    ? Object.entries(glorySources)
        .filter(([, v]) => v !== 0)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    : [];

  return (
    <div
      className="flex flex-col items-center gap-0.5 relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="text-[10px] uppercase tracking-widest font-medium cursor-help"
        style={{ color: base.textMuted }}
      >
        Favor
      </span>
      <motion.div
        className="relative cursor-help"
        animate={direction ? favorChange.animate : {}}
      >
        <span
          className="text-3xl font-bold tabular-nums leading-none"
          style={{
            color: textColor,
            textShadow: `0 0 20px ${glowColor}`,
            transition: 'color 0.3s ease',
          }}
        >
          {displayFavor}
        </span>
      </motion.div>

      {/* Favor accounting tooltip */}
      <AnimatePresence>
        {hovered && sourceEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '10px',
              zIndex: 9999,
              minWidth: '200px',
              maxWidth: '280px',
              padding: '10px 12px',
              borderRadius: '10px',
              background: '#0a0908',
              border: `2px solid rgba(220, 220, 240, 0.4)`,
              boxShadow: `0 16px 48px rgba(0, 0, 0, 1), 0 0 0 4px rgba(0, 0, 0, 0.9), 0 0 16px rgba(220, 220, 240, 0.15)`,
              pointerEvents: 'none',
            }}
          >
            <div style={{
              fontSize: '10px', fontWeight: 700, color: '#E0E0F0',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '8px', textAlign: 'center',
            }}>
              Favor Breakdown
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {sourceEntries.map(([source, amount]) => (
                <div
                  key={source}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '11px', lineHeight: 1.4,
                  }}
                >
                  <span style={{ color: base.textSecondary }}>
                    {FAVOR_SOURCE_LABELS[source] || source.replace(/_/g, ' ')}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: amount > 0 ? base.positiveLight : base.negativeLight,
                      marginLeft: '12px',
                    }}
                  >
                    {amount > 0 ? `+${amount}` : amount}
                  </span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: '6px', paddingTop: '5px',
              borderTop: `1px solid rgba(255,255,255,0.08)`,
              display: 'flex', justifyContent: 'space-between',
              fontSize: '11px', fontWeight: 700,
            }}>
              <span style={{ color: base.textSecondary }}>Total</span>
              <span style={{ color: '#E0E0F0' }}>{glory}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Floating Favor Delta ---

function FloatingFavorDelta({ deltas }) {
  if (!deltas || deltas.length === 0) return null;

  return (
    <div
      className="absolute left-0 right-0 flex justify-center pointer-events-none"
      style={{ bottom: '100%', marginBottom: '4px', zIndex: 30 }}
    >
      <AnimatePresence>
        {deltas.map((event) => {
          const isPositive = event.delta > 0;
          const text = isPositive ? `+${event.delta}` : `${event.delta}`;

          return (
            <motion.span
              key={event.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold tabular-nums"
              initial={{ opacity: 0, y: 8, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{
                enter: { type: 'spring', stiffness: 400, damping: 20 },
                exit: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
              }}
              style={{
                color: isPositive ? '#E0E0F0' : base.negativeLight,
                background: isPositive
                  ? 'rgba(220, 220, 240, 0.15)'
                  : 'rgba(225, 29, 72, 0.15)',
                border: `1px solid ${isPositive ? 'rgba(220, 220, 240, 0.3)' : 'rgba(225, 29, 72, 0.3)'}`,
                textShadow: `0 0 8px ${isPositive ? 'rgba(220, 220, 240, 0.4)' : 'rgba(225, 29, 72, 0.4)'}`,
              }}
            >
              {text} Favor
            </motion.span>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// --- Workers Remaining ---

function WorkersDisplay({ playerId, workersLeft, totalWorkers }) {
  const total = totalWorkers || 4;

  return (
    <div
      className="flex flex-col items-center gap-1"
      title={`${workersLeft} of ${total} workers remaining this round`}
    >
      <span
        className="text-[11px] uppercase tracking-widest font-medium"
        style={{ color: base.textMuted }}
      >
        Workers
      </span>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }, (_, i) => (
          <WorkerIcon
            key={i}
            playerId={playerId}
            size={22}
            ghost={i >= workersLeft}
          />
        ))}
      </div>
    </div>
  );
}

function hexToRgb(hex) {
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3
    ? cleaned.split('').map(c => c + c).join('')
    : cleaned;
  const r = parseInt(full.substring(0, 2), 16);
  const g = parseInt(full.substring(2, 4), 16);
  const b = parseInt(full.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

// --- Champion Tooltip Wrapper ---

function ChampionTooltipWrapper({ championData, colors, children }) {
  const [hovered, setHovered] = useState(false);

  if (!championData) return children;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              bottom: '100%',
              left: '0',
              marginBottom: '8px',
              zIndex: 9999,
              width: '260px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#0a0908',
              border: `2px solid rgba(220, 220, 240, 0.4)`,
              boxShadow: `0 16px 48px rgba(0, 0, 0, 1), 0 0 0 4px rgba(0, 0, 0, 0.9), 0 0 16px rgba(220, 220, 240, 0.15)`,
              pointerEvents: 'none',
            }}
          >
            <div style={{
              fontSize: '12px', fontWeight: 700, color: godColors.gold.text,
              marginBottom: '6px',
            }}>
              {championData.name}
            </div>
            <div style={{
              fontSize: '9px', fontWeight: 600, color: godColors.gold.primary,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              marginBottom: '6px', opacity: 0.7,
            }}>
              People Power
            </div>
            <div style={{
              fontSize: '11px', lineHeight: 1.5, color: base.textSecondary,
            }}>
              {championData.passive}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Main Panel ---

export default function PlayerPanel() {
  const { game, currentPlayer, phase, log, actions, pendingDecision } = useGame();
  const events = useGameEvents();

  const [viewingId, setViewingId] = useState(null);

  // Auto-reset to own panel when a decision modal appears for the human player
  useEffect(() => {
    if (pendingDecision) setViewingId(null);
  }, [pendingDecision]);

  if (!game || !currentPlayer) return null;

  // viewingPlayer: defaults to currentPlayer, or the selected tab
  const viewingPlayer = viewingId !== null
    ? game.players.find(p => p.id === viewingId) || currentPlayer
    : currentPlayer;
  const isViewingSelf = viewingPlayer.id === currentPlayer.id;

  const playerIndex = viewingPlayer.id;
  const colors = playerColors[playerIndex] || playerColors[0];

  // Find the champion data for the viewed player
  const championState = game.champions?.[playerIndex];
  const championData = championState
    ? champions.find(c => c.id === championState.id)
    : null;

  // Power card slots
  const powerCardIds = championState?.powerCards || [];
  const totalSlots = championState?.powerCardSlots || 4;

  // Workers info
  const workersLeft = viewingPlayer.workersLeft ?? 0;
  const totalWorkers = ACTIONS_PER_ROUND[(game.round || 1) - 1] || 4;

  // End turn only available when viewing yourself and it's action phase
  const isMyTurn = phase === 'action_phase' && isViewingSelf;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Player tabs strip */}
      <div
        className="flex items-end gap-0.5 px-4"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(28, 25, 23, 0.7) 50%, rgba(28, 25, 23, 0.92) 100%)',
          paddingTop: '6px',
        }}
      >
        {game.players.map(player => (
          <PlayerTab
            key={player.id}
            player={player}
            champion={game.champions?.[player.id]}
            isCurrent={player.id === viewingPlayer.id}
            onClick={() => setViewingId(player.id === currentPlayer.id ? null : player.id)}
            favorDeltas={filterByPlayer(filterByType(events, 'favorDelta'), player.id)}
            resourceDeltas={filterByPlayer(filterByType(events, 'resourceDelta'), player.id)}
          />
        ))}
      </div>

      {/* Viewing indicator */}
      {!isViewingSelf && (
        <div
          className="text-center text-xs py-1 font-semibold tracking-wide cursor-pointer"
          style={{
            background: `linear-gradient(90deg, ${colors.primary}22, ${colors.primary}44, ${colors.primary}22)`,
            color: colors.light,
            borderTop: `1px solid ${colors.primary}66`,
          }}
          onClick={() => setViewingId(null)}
        >
          Viewing {viewingPlayer.name}'s panel — click to return
        </div>
      )}

      {/* Main panel */}
      <div
        className="relative"
        style={{
          background: 'rgba(28, 25, 23, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(212, 168, 67, 0.15)',
        }}
      >
        {/* Subtle top glow line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(212, 168, 67, 0.25), transparent)',
          }}
        />

        <div className="flex items-center gap-6 px-5 py-4">
          {/* -- Player identity + Favor -- */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Champion icon */}
            {championData && (
              <div
                className="flex items-center justify-center rounded-md flex-shrink-0"
                style={{
                  width: '36px',
                  height: '36px',
                  background: godColors.gold.surface,
                  border: `1px solid ${godColors.gold.border}`,
                }}
              >
                <ChampionIcon championId={championState.id} size={26} color={godColors.gold.light} />
              </div>
            )}

            {/* Player name & champion — hover for passive power */}
            <ChampionTooltipWrapper championData={championData} colors={colors}>
              <div className="flex flex-col gap-0.5 cursor-help">
                <span
                  className="text-sm font-bold tracking-wide"
                  style={{ color: colors.light }}
                >
                  {viewingPlayer.name}
                </span>
                {championData && (
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: base.textMuted, borderBottom: '1px dotted rgba(168,162,158,0.3)' }}
                  >
                    {championData.name}
                  </span>
                )}
              </div>
            </ChampionTooltipWrapper>

            {/* Vertical divider */}
            <div
              className="w-px h-12 flex-shrink-0"
              style={{ background: base.divider }}
            />

            {/* Favor counter + floating deltas */}
            <div className="relative">
              <FavorCounter glory={viewingPlayer.glory} glorySources={viewingPlayer.glorySources} />
              <FloatingFavorDelta
                deltas={filterByPlayer(filterByType(events, 'favorDelta'), viewingPlayer.id)}
              />
            </div>
          </div>

          {/* Vertical divider */}
          <div
            className="w-px h-10 flex-shrink-0"
            style={{ background: base.divider }}
          />

          {/* -- Blessings (with floating deltas) -- */}
          <div className="flex flex-col gap-1 relative">
            <span
              className="text-[11px] uppercase tracking-widest font-medium"
              style={{ color: base.textMuted }}
            >
              Blessings
            </span>
            <ResourceDisplay resources={viewingPlayer.resources} activeGods={game.gods} />
            <FloatingDeltas
              deltas={filterByPlayer(filterByType(events, 'resourceDelta'), viewingPlayer.id)}
            />
          </div>

          {/* Vertical divider */}
          <div
            className="w-px h-10 flex-shrink-0"
            style={{ background: base.divider }}
          />

          {/* -- Workers -- */}
          <WorkersDisplay
            playerId={playerIndex}
            workersLeft={workersLeft}
            totalWorkers={totalWorkers}
          />

          {/* Vertical divider */}
          <div
            className="w-px h-10 flex-shrink-0"
            style={{ background: base.divider }}
          />

          {/* -- Power Card Slots -- */}
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span
              className="text-[11px] uppercase tracking-widest font-medium"
              style={{ color: base.textMuted }}
            >
              Artifacts
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {Array.from({ length: totalSlots }, (_, i) => {
                const cardId = powerCardIds[i] || null;
                const isTriggered = cardId
                  ? filterByType(events, 'cardTriggered').some(e => e.cardId === cardId)
                  : false;
                return (
                  <PowerCardSlot
                    key={i}
                    cardId={cardId}
                    slotIndex={i}
                    isEmpty={!cardId}
                    isTriggered={isTriggered}
                  />
                );
              })}
            </div>
          </div>

          {/* -- Log Toggle + End Turn -- */}
          <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
            {/* Collapsible log */}
            <CollapsibleLog log={log} />

            <motion.button
              className="flex-shrink-0 px-5 py-2.5 rounded-lg font-semibold text-sm uppercase tracking-wider"
              title={!isMyTurn ? `Waiting for ${currentPlayer?.name || 'another player'}` : 'End your turn'}
              style={{
                background: isMyTurn
                  ? `linear-gradient(135deg, ${godColors.gold.primary}, ${godColors.gold.dark})`
                  : 'rgba(120, 113, 108, 0.2)',
                color: isMyTurn ? base.textDark : base.textMuted,
                border: isMyTurn
                  ? `1px solid ${godColors.gold.light}`
                  : '1px solid rgba(120, 113, 108, 0.15)',
                cursor: isMyTurn ? 'pointer' : 'not-allowed',
                opacity: isMyTurn ? 1 : 0.4,
              }}
              animate={isMyTurn && game.workerPlacedThisTurn ? {
                boxShadow: [
                  `0 0 20px ${godColors.gold.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  `0 0 35px ${godColors.gold.glowStrong}, 0 0 15px ${godColors.gold.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  `0 0 20px ${godColors.gold.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                ],
              } : {
                boxShadow: isMyTurn
                  ? `0 0 20px ${godColors.gold.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`
                  : '0 0 0px transparent',
              }}
              transition={isMyTurn && game.workerPlacedThisTurn
                ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                : { duration: 0.3 }}
              whileHover={isMyTurn ? { scale: 1.04, boxShadow: `0 0 30px ${godColors.gold.glowStrong}` } : {}}
              whileTap={isMyTurn ? { scale: 0.97 } : {}}
              onClick={() => isMyTurn && actions.endTurn()}
              disabled={!isMyTurn}
            >
              End Turn
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
