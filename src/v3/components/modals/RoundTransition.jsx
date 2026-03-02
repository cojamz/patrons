/**
 * RoundTransition — Cinematic round-end / round-start overlay.
 *
 * Full-screen overlay with dramatic entrance. Shows round completion,
 * standings with favor counts and resources, next round turn order,
 * and a button to proceed.
 *
 * Props:
 *   round       — the round that just completed (1, 2, or 3)
 *   players     — array of player objects from game state
 *   onContinue  — called when player clicks to advance
 */
import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ResourceIcon from '../icons/ResourceIcon';
import WorkerIcon from '../icons/WorkerIcon';
import { godColors, playerColors, base, godMeta } from '../../styles/theme';
import { roundTransition, cardReveal, staggerContainer } from '../../styles/animations';
import { FAVOR_SOURCE_LABELS } from '../player/PlayerPanel';

const ROUNDS_TOTAL = 3;

function FavorCell({ player, isLeader, gloryDelta }) {
  const [expanded, setExpanded] = useState(false);
  const sourceEntries = player.glorySources
    ? Object.entries(player.glorySources)
        .filter(([, v]) => v !== 0)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    : [];

  return (
    <div className="w-20 text-right flex flex-col items-end">
      <span
        className="text-base font-bold tabular-nums"
        style={{
          color: isLeader ? godColors.gold.text : base.textPrimary,
          cursor: sourceEntries.length > 0 ? 'pointer' : 'default',
        }}
        onClick={() => sourceEntries.length > 0 && setExpanded(!expanded)}
      >
        {player.glory ?? 0}
        {sourceEntries.length > 0 && (
          <span style={{ fontSize: '9px', marginLeft: '3px', opacity: 0.4 }}>
            {expanded ? '▴' : '▾'}
          </span>
        )}
      </span>
      {gloryDelta !== undefined && gloryDelta !== 0 && (
        <span
          className="text-[10px] font-semibold tabular-nums"
          style={{
            color: gloryDelta > 0 ? godColors.gold.light : 'rgba(225, 29, 72, 0.8)',
          }}
        >
          {gloryDelta > 0 ? '+' : ''}{gloryDelta} this round
        </span>
      )}

      {/* Inline accounting breakdown */}
      <AnimatePresence>
        {expanded && sourceEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              overflow: 'hidden',
              marginTop: '4px',
              width: '180px',
              textAlign: 'left',
            }}
          >
            <div style={{
              padding: '6px 8px',
              borderRadius: '6px',
              background: 'rgba(0, 0, 0, 0.5)',
              border: `1px solid ${godColors.gold.primary}30`,
            }}>
              {sourceEntries.map(([source, amount]) => (
                <div
                  key={source}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    fontSize: '10px', lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: base.textMuted }}>
                    {FAVOR_SOURCE_LABELS[source] || source.replace(/_/g, ' ')}
                  </span>
                  <span
                    style={{
                      fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                      color: amount > 0 ? '#4ade80' : '#fb7185',
                      marginLeft: '8px', flexShrink: 0,
                    }}
                  >
                    {amount > 0 ? `+${amount}` : amount}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RoundTransition({ round, players, onContinue, activeGods, gloryDeltas, preRoundGlory }) {
  const isGameEnd = round >= ROUNDS_TOTAL;

  const resourceTypes = activeGods || ['gold', 'black', 'green', 'yellow'];

  // Rank players by favor descending, then by total resources as tiebreaker
  const standings = useMemo(() => {
    if (!players) return [];
    return [...players]
      .map(p => ({
        ...p,
        totalResources: Object.values(p.resources || {}).reduce((s, v) => s + v, 0),
      }))
      .sort((a, b) => {
        const favorDiff = (b.glory ?? 0) - (a.glory ?? 0);
        if (favorDiff !== 0) return favorDiff;
        return b.totalResources - a.totalResources;
      });
  }, [players]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center"
        variants={roundTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          backgroundColor: 'rgba(12, 10, 9, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="w-full max-w-lg mx-4">

          {/* Round number — cinematic large text */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.5 } }}
          >
            {/* Decorative line */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16" style={{ background: `linear-gradient(90deg, transparent, ${godColors.gold.primary})` }} />
              <span
                className="text-xs uppercase tracking-[0.3em] font-medium"
                style={{ color: godColors.gold.primary }}
              >
                {isGameEnd ? 'Final Results' : 'Round Complete'}
              </span>
              <div className="h-px w-16" style={{ background: `linear-gradient(90deg, ${godColors.gold.primary}, transparent)` }} />
            </div>

            {/* Big round number */}
            <h1
              className="text-6xl font-bold tracking-tight"
              style={{
                color: base.textPrimary,
                textShadow: `0 0 40px ${godColors.gold.glow}`,
              }}
            >
              {isGameEnd ? 'Game Over' : `Round ${round}`}
            </h1>

            {!isGameEnd && (
              <p className="text-sm mt-2" style={{ color: base.textMuted }}>
                Preparing Round {round + 1} of {ROUNDS_TOTAL}
              </p>
            )}
          </motion.div>

          {/* Standings table */}
          <motion.div
            className="rounded-xl overflow-hidden mb-6"
            style={{
              backgroundColor: 'rgba(28, 25, 23, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {/* Header */}
            <div
              className="flex items-center px-4 py-2.5 text-[10px] uppercase tracking-wider font-medium"
              style={{
                color: base.textMuted,
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              }}
            >
              <span className="w-8">#</span>
              <span className="flex-1">Player</span>
              <span className="w-20 text-right">Favor</span>
              <span className="w-32 text-right">Blessings</span>
            </div>

            {/* Player rows */}
            {standings.map((player, i) => {
              const pColors = playerColors[player.id] || playerColors[0];
              const isLeader = i === 0;

              return (
                <motion.div
                  key={player.id}
                  custom={i}
                  variants={cardReveal}
                  initial="initial"
                  animate="animate"
                  className="flex items-center px-4 py-3 transition-colors duration-150"
                  style={{
                    backgroundColor: isLeader ? 'rgba(212, 168, 67, 0.04)' : 'transparent',
                    borderBottom: i < standings.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                  }}
                >
                  {/* Rank */}
                  <span
                    className="w-8 text-sm font-bold tabular-nums"
                    style={{
                      color: isLeader ? godColors.gold.text : base.textMuted,
                    }}
                  >
                    {i + 1}
                  </span>

                  {/* Player name + meeple */}
                  <div className="flex-1 flex items-center gap-2">
                    <WorkerIcon playerId={player.id} size={22} />
                    <span
                      className="text-sm font-semibold"
                      style={{ color: pColors.light }}
                    >
                      {player.name || pColors.name}
                    </span>
                    {isLeader && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="ml-1">
                        <path
                          d="M7 1L8.8 5.2L13 5.8L10 8.7L10.6 13L7 11L3.4 13L4 8.7L1 5.8L5.2 5.2L7 1Z"
                          fill="#E8C547"
                          opacity="0.6"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Favor + delta + hover accounting */}
                  <FavorCell
                    player={player}
                    isLeader={isLeader}
                    gloryDelta={gloryDeltas?.[player.id]}
                  />

                  {/* Resource breakdown */}
                  <div className="w-32 flex items-center justify-end gap-1.5">
                    {resourceTypes.map(type => (
                      <div key={type} className="flex items-center gap-0.5">
                        <ResourceIcon type={type} size={12} />
                        <span
                          className="text-[10px] tabular-nums font-medium"
                          style={{ color: godColors[type]?.text || base.textSecondary, opacity: 0.8 }}
                        >
                          {player.resources?.[type] ?? 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Turn order for next round (only if not game end) */}
          {!isGameEnd && standings.length > 0 && (
            <motion.div
              className="text-center mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.6 } }}
            >
              <span className="text-xs uppercase tracking-wider" style={{ color: base.textMuted }}>
                Next round turn order
              </span>
              <div className="flex items-center justify-center gap-3 mt-2">
                {/* Reverse standings: lowest favor goes first */}
                {[...standings].reverse().map((player, i) => {
                  const pColors = playerColors[player.id] || playerColors[0];
                  return (
                    <div key={player.id} className="flex items-center gap-1.5">
                      <span className="text-xs font-medium tabular-nums" style={{ color: base.textMuted }}>
                        {i + 1}.
                      </span>
                      <WorkerIcon playerId={player.id} size={18} />
                      <span className="text-xs font-medium" style={{ color: pColors.light }}>
                        {player.name || pColors.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Continue button */}
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.8 } }}
          >
            <motion.button
              onClick={onContinue}
              className="px-10 py-3 rounded-lg text-sm font-semibold tracking-wide"
              style={{
                backgroundColor: isGameEnd ? godColors.gold.primary : 'rgba(255, 255, 255, 0.08)',
                color: isGameEnd ? base.textDark : base.textPrimary,
                border: isGameEnd ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: isGameEnd
                  ? `0 4px 20px ${godColors.gold.glow}, 0 0 60px ${godColors.gold.glow}`
                  : '0 4px 16px rgba(0, 0, 0, 0.3)',
              }}
              whileHover={{ scale: 1.04, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
              whileTap={{ scale: 0.97 }}
            >
              {isGameEnd ? 'View Final Standings' : `Begin Round ${round + 1}`}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
